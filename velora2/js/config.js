/* Единые настройки шаблона VELORA. Перед запуском измените значения ниже. */
(function (window) {
  "use strict";
  window.VELORA_CONFIG = Object.freeze({
    restaurant: {
      name: "VELORA",
      phone: "+992 55 123 45 67",
      email: "info@velora.tj",
      address: "Ваш адрес"
    },
    api: {
      baseUrl: "https://e358e856b815a139.mokky.dev"
    },
    resources: {
      menu: "menu",
      orders: "orders",
      reservations: "reserve",
      messages: "messages"
    },
    currency: "$",
    socialLinks: {
      instagram: "",
      telegram: "",
      whatsapp: ""
    },
    cartStorageKey: "velora_cart_v1",
    imagePrefix: "../images/catalog_images/",
    categories: ["Салаты", "Горячее", "Паста", "Десерты", "Напитки"],
    /* Только демонстрационный вход для локального шаблона.
       Это НЕ серверная авторизация и не подходит для защиты реальных данных. */
    demoAdminPassword: "velora2026"
  });
})(window);
