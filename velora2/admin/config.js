/* Совместимость административной панели с общей конфигурацией. */
(function (window) {
  "use strict";
  const cfg = window.VELORA_CONFIG;
  if (!cfg) throw new Error("Сначала подключите ../js/config.js");
  window.VELORA = {
    API: cfg.api.baseUrl,
    MENU: cfg.resources.menu,
    RESERVE: cfg.resources.reservations,
    ORDERS: cfg.resources.orders,
    MESSAGES: cfg.resources.messages,
    PASSWORD: cfg.demoAdminPassword,
    IMG_PREFIX: "../images/catalog_images/",
    CATEGORIES: cfg.categories,
    CURRENCY: cfg.currency
  };
})(window);
