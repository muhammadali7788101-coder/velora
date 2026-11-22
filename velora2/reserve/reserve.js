// Логика формы бронирования и отправка заявки в Mokky.dev.
(function () {
  "use strict";
  const config = window.VELORA_CONFIG;
  if (!config) throw new Error("Не подключён js/config.js");
  const dateInput = document.getElementById("dateInput");
  const dateDropdown = document.getElementById("dateDropdown");
  const reserveForm = document.querySelector(".booking-form");
  const dateFormat = date => new Intl.DateTimeFormat("ru-RU", {day:"2-digit",month:"2-digit",year:"numeric"}).format(date);
  function generateDates() {
    if (!dateDropdown || !dateInput) return;
    const today = new Date(); today.setHours(0,0,0,0); dateDropdown.innerHTML = "";
    for (let i=0;i<30;i++) {
      const date = new Date(today); date.setDate(today.getDate()+i);
      const label = dateFormat(date) + (i===0 ? " (Сегодня)" : i===1 ? " (Завтра)" : "");
      const item = document.createElement("div"); item.className="dropdown-item"; item.textContent=label; item.dataset.date=dateFormat(date);
      if (i===0) item.classList.add("active");
      dateDropdown.appendChild(item);
      if (i===0) { dateInput.value=label; dateInput.dataset.date=dateFormat(date); }
    }
  }
  generateDates();
  document.querySelectorAll(".select-dropdown").forEach(dropdown => {
    const input = dropdown.querySelector("input");
    const currentValue = input?.value?.trim();
    const options = [...dropdown.querySelectorAll(".dropdown-item")];
    options.forEach(option => option.classList.toggle("active", option.textContent.trim() === currentValue || option.dataset.date === input?.dataset.date));
    dropdown.addEventListener("click", event => {
      const item = event.target.closest(".dropdown-item");
      if (item) {
        event.stopPropagation();
        const input = dropdown.querySelector("input");
        if (input) { input.value=item.textContent.trim(); if (item.dataset.date) input.dataset.date=item.dataset.date; }
        dropdown.querySelectorAll(".dropdown-item").forEach(node=>node.classList.toggle("active",node===item));
        dropdown.classList.remove("active"); return;
      }
      document.querySelectorAll(".select-dropdown.active").forEach(node=>{if(node!==dropdown)node.classList.remove("active");});
      dropdown.classList.toggle("active");
    });
  });
  // Закрываем списки только при клике СНАРУЖИ. Раньше обработчик
  // закрывал список даже при клике по самому полю, поэтому его нельзя было открыть.
  document.addEventListener("click", event => {
    if (!event.target.closest(".select-dropdown")) {
      document.querySelectorAll(".select-dropdown.active").forEach(node => node.classList.remove("active"));
    }
  });
  if (!reserveForm) return;
  reserveForm.addEventListener("submit", async event => {
    event.preventDefault(); if (!reserveForm.reportValidity()) return;
    const button=reserveForm.querySelector('[type="submit"]'); const original=button?.innerHTML;
    if(button){button.disabled=true;button.textContent="Отправляем…";}
    const clientName=document.getElementById("clientNameInput")?.value.trim()||"";
    const clientPhone=document.getElementById("clientPhoneInput")?.value.trim()||"";
    const date=dateInput?.dataset.date || dateInput?.value || "";
    const time=document.getElementById("timeInput")?.value.trim()||"";
    const guests=document.getElementById("guestsInput")?.value.trim()||"";
    const tableType=document.getElementById("tableInput")?.value.trim()||"";
    const comment=reserveForm.querySelector("textarea")?.value.trim()||"";
    const data={clientName,phone:clientPhone,date,time,guestsCount:guests,tableType,comment,status:"Новая бронь",createdAt:new Date().toLocaleString("ru-RU")};
    try {
      const endpoint=config.api.baseUrl.replace(/\/$/,"")+"/"+config.resources.reservations;
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(!response.ok) throw new Error("HTTP "+response.status);
      reserveForm.reset(); generateDates();
      alert(`Спасибо, ${clientName}! Заявка на бронирование отправлена. Мы свяжемся с вами для подтверждения.`);
    } catch(error) {
      console.error("Ошибка бронирования:",error);
      alert("Не удалось отправить заявку. Проверьте ресурс reserve в Mokky.dev.");
    } finally {if(button){button.disabled=false;if(original)button.innerHTML=original;}}
  });
})();
