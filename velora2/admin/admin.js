(() => {
const C = window.VELORA;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { tab: "dash", menu: [], orders: [], reserve: [], messages: [], errors: [], q: "", filter: "" };

/* ---------- API ---------- */
async function api(path, opts = {}) {
  const r = await fetch(`${C.API}/${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json" },
    body: opts.body && JSON.stringify(opts.body)
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}
const list = name => api(name).then(d => Array.isArray(d) ? d : [], () => { state.errors.push(name); return []; });
async function loadAll() {
  state.errors = [];
  [state.menu, state.orders, state.reserve, state.messages] = await Promise.all([C.MENU, C.ORDERS, C.RESERVE, C.MESSAGES].map(list));
  $("#bOrders").textContent = state.orders.filter(o => !o.status || o.status === "Новый").length || "";
  $("#bReserve").textContent = state.reserve.filter(r => r.status === "Новая бронь").length || "";
}
function toast(msg, bad) { const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "toast", 2600); }

/* ---------- auth ---------- */
const authed = () => sessionStorage.getItem("velora_admin") === "1";
function boot() {
  if (!authed()) { $("#login").classList.remove("hidden"); $("#app").classList.add("hidden"); return; }
  $("#login").classList.add("hidden"); $("#app").classList.remove("hidden");
  refresh();
}
$("#loginForm").onsubmit = e => {
  e.preventDefault();
  if ($("#pass").value === C.PASSWORD) { sessionStorage.setItem("velora_admin", "1"); boot(); }
  else $("#loginErr").textContent = "Неверный пароль";
};
$("#logout").onclick = () => { sessionStorage.removeItem("velora_admin"); boot(); };

/* ---------- nav ---------- */
const TITLES = { dash: "Обзор", menu: "Блюда", orders: "Заказы", reserve: "Брони столиков", messages: "Сообщения" };
$("#nav").onclick = e => {
  const a = e.target.closest("a"); if (!a) return;
  state.tab = a.dataset.tab; state.q = ""; state.filter = ""; $("#search").value = "";
  document.querySelectorAll("#nav a").forEach(x => x.classList.toggle("active", x === a));
  render();
};
$("#search").oninput = e => { state.q = e.target.value.toLowerCase(); render(); };
$("#refresh").onclick = refresh;
async function refresh() { await loadAll(); render(); }

/* ---------- helpers ---------- */
const price = n => `${Number(n) || 0} ${C.CURRENCY}`;
const imgSrc = p => !p ? "../images/catalog_images/hero.jpg" : /^(https?:|data:|blob:|\/|\.\.\/)/.test(p) ? p : `../images/catalog_images/${p}`;
const categories = () => [...new Set([...C.CATEGORIES, ...state.menu.map(d => d.category).filter(Boolean)])];
const match = (o) => !state.q || JSON.stringify(o).toLowerCase().includes(state.q);
const statusClass = s => ({ "Новая бронь": "new", "Новый": "new", "Подтверждена": "ok", "Выдан": "ok", "Завершена": "ok", "Готовится": "mid", "Отменена": "bad", "Отменён": "bad" }[s] || "");

/* ---------- views ---------- */
function render() {
  $("#title").textContent = TITLES[state.tab];
  const v = $("#view");
  ({ dash: vDash, menu: vMenu, orders: vOrders, reserve: vReserve, messages: vMessages })[state.tab]?.(v);
}

function vDash(v) {
  const rev = state.orders.filter(o => o.status !== "Отменён").reduce((s, o) => s + (+o.totalPrice || 0), 0);
  const cnt = {};
  state.orders.forEach(o => (o.items || []).forEach(i => cnt[i.name] = (cnt[i.name] || 0) + (+i.quantity || 1)));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 6), max = top[0]?.[1] || 1;
  v.innerHTML = `
  <div class="stats">
    <div class="stat"><small>Заказов</small><strong>${state.orders.length}</strong></div>
    <div class="stat"><small>Выручка</small><strong>${price(rev)}</strong></div>
    <div class="stat"><small>Броней</small><strong>${state.reserve.length}</strong></div>
    <div class="stat"><small>Новых броней</small><strong>${state.reserve.filter(r => r.status === "Новая бронь").length}</strong></div>
    <div class="stat"><small>Блюд в меню</small><strong>${state.menu.length}</strong></div>
  </div>
  <div class="panel"><h3>Популярные блюда</h3>${top.length ? `<div class="bars">${top.map(([n, c]) => `<div class="bar"><span>${esc(n)}</span><i style="width:${c / max * 100}%"></i><b>${c}</b></div>`).join("")}</div>` : `<div class="mut">Пока нет заказов</div>`}</div>
  <div class="panel"><h3>Последние брони</h3>${miniReserve()}</div>`;
}
function miniReserve() {
  const r = [...state.reserve].sort((a, b) => b.id - a.id).slice(0, 5);
  return r.length ? `<table><tbody>${r.map(x => `<tr><td>${esc(x.clientName)}</td><td>${esc(x.date)} ${esc(x.time)}</td><td>${esc(x.tableType)}</td><td><span class="tag ${statusClass(x.status)}">${esc(x.status)}</span></td></tr>`).join("")}</tbody></table>` : `<div class="mut">Нет броней</div>`;
}

/* --- menu --- */
function dishCard(d, admin) {
  return `<div class="dish-card ${d.available === false ? "off" : ""}">
<div class="dish-img"><img src="${esc(imgSrc(d.image))}" alt="${esc(d.title)}" onerror="this.onerror=null;this.src='../images/catalog_images/hero.jpg'"></div>
<h3 class="dish-title">${esc(d.title) || "Название блюда"}</h3>
<p class="dish-desc">${esc(d.desc)}</p>
<div class="dish-footer"><span class="dish-price">${price(d.price)}</span>${admin ? `<span class="tag">${esc(d.category || "—")}</span>` : ""}</div>
${admin ? `<div class="dish-actions"><button class="btn sm" data-edit="${d.id}"><i class="fa-solid fa-pen"></i> Изменить</button><button class="btn sm" data-toggle="${d.id}" title="Скрыть/показать"><i class="fa-solid fa-eye${d.available === false ? "-slash" : ""}"></i></button><button class="btn sm danger" data-del="${d.id}"><i class="fa-solid fa-trash"></i></button></div>` : ""}</div>`;
}
function vMenu(v) {
  const cats = categories();
  const items = state.menu.filter(d => match(d) && (!state.filter || d.category === state.filter)).sort((a, b) => b.id - a.id);
  v.innerHTML = `<div class="toolbar">
    <select id="catF"><option value="">Все категории</option>${cats.map(c => `<option ${state.filter === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
    <span class="sp"></span><button class="btn primary" id="addDish"><i class="fa-solid fa-plus"></i> Новое блюдо</button></div>
    ${state.errors.includes(C.MENU) ? `<div class="panel">Не удалось загрузить <b>${esc(C.API)}/${esc(C.MENU)}</b>. Проверьте доступность ресурса и нажмите «Обновить».</div>` : ""}
    ${items.length ? `<div class="dishes">${items.map(d => dishCard(d, true)).join("")}</div>` : `<div class="empty">Блюд пока нет. Нажмите «Новое блюдо».</div>`}`;
  $("#catF").onchange = e => { state.filter = e.target.value; render(); };
  $("#addDish").onclick = () => dishForm();
  v.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return;
    const id = b.dataset.edit || b.dataset.del || b.dataset.toggle; if (!id) return;
    const d = state.menu.find(x => x.id == id);
    if (b.dataset.edit) dishForm(d);
    if (b.dataset.toggle) { await save(() => api(`${C.MENU}/${id}`, { method: "PATCH", body: { available: d.available === false } })); }
    if (b.dataset.del && confirm(`Удалить «${d.title}»?`)) await save(() => api(`${C.MENU}/${id}`, { method: "DELETE" }), "Удалено");
  };
}
async function save(fn, msg = "Сохранено") { try { await fn(); toast(msg); await refresh(); } catch (e) { toast("Ошибка: " + e.message, true); } }

function dishForm(d = {}) {
  const cats = categories();
  openModal(`<h2>${d.id ? "Редактировать блюдо" : "Новое блюдо"}</h2>
  <form id="dForm" class="form-grid">
    <div class="fields">
      <label>Название<input name="title" required value="${esc(d.title)}" placeholder="Салат Цезарь"></label>
      <label>Описание<textarea name="desc" rows="3" placeholder="Курица, салат романо, пармезан, соус цезарь.">${esc(d.desc)}</textarea></label>
      <div class="two">
        <label>Цена (${esc(C.CURRENCY)})<input name="price" type="number" min="0" step="any" required value="${esc(d.price)}"></label>
        <label>Категория<input name="category" list="cats" value="${esc(d.category)}"><datalist id="cats">${cats.map(c => `<option value="${esc(c)}">`).join("")}</datalist></label>
      </div>
      <label>Картинка — путь или ссылка<input name="image" value="${esc(d.image)}" placeholder="${esc(C.IMG_PREFIX)}cezar.jpg"></label>
      <label><span><input type="checkbox" name="available" style="width:auto" ${d.available === false ? "" : "checked"}> Показывать на сайте</span></label>
    </div>
    <div class="prev"><small>Предпросмотр карточки</small><div id="prev"></div></div>
    <div class="acts" style="grid-column:1/-1"><button type="button" class="btn" id="cancel">Отмена</button><button class="btn primary">Сохранить</button></div>
  </form>`);
  const f = $("#dForm");
  const field = name => f.elements.namedItem(name);
  const data = () => ({ title: field("title").value.trim(), desc: field("desc").value.trim(), price: Number(field("price").value) || 0, category: field("category").value.trim(), image: field("image").value.trim(), available: field("available").checked });
  const prev = () => { $("#prev").innerHTML = dishCard(data(), false); };
  f.oninput = prev; f.onchange = prev; prev();
  $("#cancel").onclick = closeModal;
  f.onsubmit = async e => {
    e.preventDefault();
    const body = data();
    try {
      if (d.id) await api(`${C.MENU}/${d.id}`, { method: "PATCH", body });
      else await api(C.MENU, { method: "POST", body });
      closeModal(); toast("Сохранено"); await refresh();
    } catch (err) { toast("Ошибка: " + err.message, true); }
  };
}

/* --- orders --- */
const ORDER_ST = ["Новый", "Готовится", "Выдан", "Отменён"];
function vOrders(v) {
  const rows = state.orders.filter(match).sort((a, b) => b.id - a.id);
  v.innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Клиент</th><th>Состав</th><th>Сумма</th><th>Получение</th><th>Дата</th><th>Статус</th><th></th></tr></thead><tbody>
  ${rows.map(o => `<tr><td>${o.id}</td><td><b>${esc(o.clientName)}</b><br><a href="tel:${esc(o.phone)}" class="mut">${esc(o.phone)}</a>${o.comment ? `<br><i class="mut">«${esc(o.comment)}»</i>` : ""}</td>
  <td><ul class="items-list">${(o.items || []).map(i => `<li><img src="${esc(imgSrc(i.image))}" onerror="this.remove()"> ${esc(i.name)} × ${i.quantity}</li>`).join("")}</ul></td>
  <td><b>${price(o.totalPrice)}</b></td><td>${o.deliveryType === "pickup" ? "Самовывоз" : "Доставка"}<br><span class="mut">${esc(o.address)}</span></td><td class="mut">${esc(o.date)}</td>
  <td><select data-st="${o.id}">${ORDER_ST.map(s => `<option ${(o.status || "Новый") === s ? "selected" : ""}>${s}</option>`).join("")}</select></td>
  <td><button class="btn sm danger" data-del="${o.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Заказов нет</div>`;
  bindTable(v, C.ORDERS);
}

/* --- reserve --- */
const RES_ST = ["Новая бронь", "Подтверждена", "Завершена", "Отменена"];
function vReserve(v) {
  const rows = state.reserve.filter(match).filter(r => !state.filter || r.status === state.filter).sort((a, b) => b.id - a.id);
  v.innerHTML = `<div class="toolbar"><select id="stF"><option value="">Все статусы</option>${RES_ST.map(s => `<option ${state.filter === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>` +
    (rows.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Гость</th><th>Когда</th><th>Гостей</th><th>Зал</th><th>Комментарий</th><th>Создана</th><th>Статус</th><th></th></tr></thead><tbody>
  ${rows.map(r => `<tr><td>${r.id}</td><td><b>${esc(r.clientName)}</b><br><a href="tel:${esc(r.phone)}" class="mut">${esc(r.phone)}</a></td><td>${esc(r.date)}<br><b>${esc(r.time)}</b></td><td>${esc(r.guestsCount)}</td><td>${esc(r.tableType)}</td><td>${esc(r.comment)}</td><td class="mut">${esc(r.createdAt)}</td>
  <td><select data-st="${r.id}">${RES_ST.map(s => `<option ${r.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></td>
  <td><button class="btn sm danger" data-del="${r.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Броней нет</div>`);
  $("#stF").onchange = e => { state.filter = e.target.value; render(); };
  bindTable(v, C.RESERVE);
}
function bindTable(v, res) {
  v.onchange = e => { const s = e.target.closest("select[data-st]"); if (s) save(() => api(`${res}/${s.dataset.st}`, { method: "PATCH", body: { status: s.value } }), "Статус обновлён"); };
  v.onclick = e => { const b = e.target.closest("button[data-del]"); if (b && confirm(`Удалить запись #${b.dataset.del}?`)) save(() => api(`${res}/${b.dataset.del}`, { method: "DELETE" }), "Удалено"); };
}

/* --- messages --- */
function vMessages(v) {
  const rows = state.messages.filter(match).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  v.innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Имя</th><th>Телефон</th><th>Email</th><th>Сообщение</th><th>Дата</th><th></th></tr></thead><tbody>
    ${rows.map(m => `<tr><td><b>${esc(m.customerName)}</b></td><td><a class="mut" href="tel:${esc(m.customerPhone)}">${esc(m.customerPhone)}</a></td><td>${esc(m.email || "—")}</td><td>${esc(m.message)}</td><td class="mut">${esc(m.createdAt || "—")}</td><td><button class="btn sm danger" data-del="${m.id}" aria-label="Удалить сообщение"><i class="fa-solid fa-trash"></i></button></td></tr>`).join("")}
    </tbody></table></div>` : `<div class="empty">Сообщений пока нет</div>`;
  bindTable(v, C.MESSAGES);
}

/* ---------- modal ---------- */
function openModal(html) { $("#modalBox").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); $("#modalBox").innerHTML = ""; }
$("#modal").onclick = e => { if (e.target.id === "modal") closeModal(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

boot();
})();
