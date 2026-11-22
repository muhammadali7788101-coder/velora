// Общие настройки интерфейса, которые можно менять через js/config.js.
(function () {
  "use strict";
  const config = window.VELORA_CONFIG;
  if (!config) return;
  document.querySelectorAll(".social-link").forEach(link => {
    const icon = link.querySelector("i");
    const type = icon?.classList.contains("fa-instagram") ? "instagram"
      : icon?.classList.contains("fa-telegram") ? "telegram"
      : icon?.classList.contains("fa-whatsapp") ? "whatsapp" : "";
    const url = type ? config.socialLinks?.[type] : "";
    if (url && /^https:\/\//i.test(url)) {
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.title = "Добавьте ссылку в js/config.js";
    }
  });
})();
