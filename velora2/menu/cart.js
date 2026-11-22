// Локальная корзина: у каждого посетителя своё хранилище в браузере.
(function () {
    "use strict";
    const CONFIG = window.VELORA_CONFIG;
    if (!CONFIG) throw new Error("Не подключён js/config.js");
    const STORAGE_KEY = CONFIG.cartStorageKey;
    const cartItems = document.getElementById("veloraCartItems");
    const cartTotal = document.getElementById("veloraCartTotal");
    const cartCount = document.querySelector(".velora-cart-count");
    const cartEmpty = document.querySelector(".velora-cart-empty");
    const isNestedPage = /\/(menu|reserve|about_us|contacts|gallery)\//.test(location.pathname);
    const fallbackImage = (isNestedPage ? "../" : "") + "images/catalog_images/hero.jpg";
    let items = readCart();

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    }
    function readCart() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value.filter(x => x && x.name && Number.isFinite(Number(x.price))) : [];
        } catch (error) {
            console.warn("Корзина повреждена и будет очищена:", error);
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }
    }
    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent("velora:cart-updated", { detail: { items: getItems() } }));
    }
    function getItems() { return items.map(item => ({...item})); }
    function getQuantity(item) { return Math.max(1, Number.parseInt(item.quantity, 10) || 1); }
    function getImagePath(image) {
        if (!image) return fallbackImage;
        if (/^(https?:|data:|blob:|\/)/i.test(image)) return image;
        if (image.startsWith("../")) return isNestedPage ? image : image.replace(/^\.\.\//, "");
        if (image.startsWith("images/")) return (isNestedPage ? "../" : "") + image;
        return (isNestedPage ? "../" : "") + "images/catalog_images/" + image;
    }
    function findCartItem(productId, name) {
        return items.find(item => productId && item.productId
            ? String(item.productId) === String(productId)
            : item.name === name);
    }
    function updateProductControls() {
        document.querySelectorAll(".menu-card[data-name], .dish-card[data-name]").forEach(card => {
            const item = findCartItem(card.dataset.productId || "", card.dataset.name || "");
            const addButton = card.querySelector(".card-add-btn, .add-to-cart-btn");
            const quantityControl = card.querySelector(".product-quantity-control");
            const quantityValue = quantityControl?.querySelector(".quantity-value");
            if (addButton) addButton.hidden = !!item;
            if (quantityControl) quantityControl.hidden = !item;
            if (quantityValue && item) quantityValue.textContent = String(getQuantity(item));
            if (quantityControl) quantityControl.querySelectorAll("button").forEach(button => {
                button.disabled = false;
                if (item) button.dataset.cartKey = item.key;
                else delete button.dataset.cartKey;
            });
        });
    }
    function showCart() {
        if (cartItems) {
            cartItems.innerHTML = items.map(item => {
                const title = item.name || "Блюдо";
                const image = escapeHTML(getImagePath(item.image));
                const key = escapeHTML(item.key);
                return `<div class="cart-item">
                    <img src="${image}" alt="${escapeHTML(title)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHTML(fallbackImage)}'">
                    <div><h3>${escapeHTML(title)}</h3>
                    <p class="cart-item-price">${(Number(item.price)||0).toFixed(2)} ${escapeHTML(CONFIG.currency)} за шт.</p>
                    <div class="cart-item-quantity">
                      <button class="quantity-minus" data-cart-key="${key}" type="button" aria-label="Уменьшить количество">−</button>
                      <span class="quantity-value">${getQuantity(item)}</span>
                      <button class="quantity-plus" data-cart-key="${key}" type="button" aria-label="Увеличить количество">+</button>
                    </div></div>
                    <button class="remove-cart-item" data-key="${key}" type="button">Удалить</button>
                </div>`;
            }).join("");
        }
        const total = items.reduce((sum, item) => sum + (Number(item.price)||0) * getQuantity(item), 0);
        const count = items.reduce((sum, item) => sum + getQuantity(item), 0);
        const formatted = total.toFixed(2) + " " + CONFIG.currency;
        if (cartTotal) cartTotal.textContent = formatted;
        const subtotal = document.getElementById("veloraCartSubtotal");
        const subtitle = document.getElementById("veloraCartSubtitle");
        if (subtotal) subtotal.textContent = formatted;
        if (cartCount) cartCount.textContent = String(count);
        if (cartEmpty) cartEmpty.style.display = items.length ? "none" : "block";
        if (subtitle) subtitle.textContent = count + " товаров · " + formatted;
        updateProductControls();
    }
    function addToCart(button) {
        const card = button.closest("[data-name]");
        if (!card) return;
        const name = card.dataset.name || "";
        const price = Number(card.dataset.price);
        if (!name || !Number.isFinite(price) || price < 0) {
            alert("У товара некорректные данные."); return;
        }
        const productId = card.dataset.productId || "";
        const existing = findCartItem(productId, name);
        if (existing) existing.quantity = getQuantity(existing) + 1;
        else items.push({ key: (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(36).slice(2)), productId, name, price, image: card.dataset.image || "", quantity: 1 });
        persist(); showCart();
    }
    function changeQuantity(key, difference) {
        const item = items.find(entry => entry.key === key);
        if (!item) return;
        item.quantity = getQuantity(item) + difference;
        if (item.quantity <= 0) items = items.filter(entry => entry.key !== key);
        persist(); showCart();
    }
    function removeFromCart(key) {
        items = items.filter(item => item.key !== key);
        persist(); showCart();
    }
    document.addEventListener("click", event => {
        const addButton = event.target.closest(".add-to-cart-btn, .card-add-btn");
        if (addButton) { addToCart(addButton); return; }
        const minus = event.target.closest(".quantity-minus");
        if (minus) { const card = minus.closest("[data-name]"); const key = minus.dataset.cartKey || findCartItem(card?.dataset.productId || "", card?.dataset.name || "")?.key; if (key) changeQuantity(key, -1); return; }
        const plus = event.target.closest(".quantity-plus");
        if (plus) { const card = plus.closest("[data-name]"); const key = plus.dataset.cartKey || findCartItem(card?.dataset.productId || "", card?.dataset.name || "")?.key; if (key) changeQuantity(key, 1); return; }
        const remove = event.target.closest(".remove-cart-item");
        if (remove) removeFromCart(remove.dataset.key);
    });
    window.VeloraCart = {
        getItems,
        clear() { items = []; persist(); showCart(); },
        refresh() { items = readCart(); showCart(); }
    };
    window.loadCart = async function () { items = readCart(); showCart(); return getItems(); };
    window.addEventListener("storage", event => { if (event.key === STORAGE_KEY) { items = readCart(); showCart(); } });
    window.addEventListener("velora:menu-rendered", showCart);
    showCart();
})();
