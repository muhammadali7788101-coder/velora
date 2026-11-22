// Отправка сообщений в ресурс messages на Mokky.dev.
(function () {
  "use strict";
  const form = document.querySelector(".contact-form");
  const config = window.VELORA_CONFIG;
  if (!form || !config) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = form.querySelectorAll("input");
    const textarea = form.querySelector("textarea");
    const button = form.querySelector('button[type="submit"]');
    const original = button?.innerHTML;
    const message = {
      customerName: fields[0]?.value.trim() || "",
      customerPhone: fields[1]?.value.trim() || "",
      email: fields[2]?.value.trim() || "",
      message: textarea?.value.trim() || "",
      read: false,
      createdAt: new Date().toISOString(),
      source: "site"
    };
    if (button) { button.disabled = true; button.textContent = "Отправляем…"; }
    try {
      const url = config.api.baseUrl.replace(/\/$/, "") + "/" + config.resources.messages;
      const response = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(message) });
      if (!response.ok) throw new Error("HTTP " + response.status);
      form.reset();
      alert("Сообщение отправлено! Спасибо, мы свяжемся с вами.");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      alert("Не удалось отправить сообщение. Проверьте ресурс messages в Mokky.dev.");
    } finally {
      if (button) { button.disabled = false; if (original) button.innerHTML = original; }
    }
  });
})();
