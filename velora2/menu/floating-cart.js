(function () {
    "use strict";

    var openButton = document.getElementById("veloraCartOpen");
    var closeButton = document.getElementById("veloraCartClose");
    var overlay = document.getElementById("veloraCartOverlay");

    if (!openButton || !overlay) return;

    function open() { overlay.classList.add("is-open"); }
    function close() { overlay.classList.remove("is-open"); }

    openButton.addEventListener("click", open);
    if (closeButton) closeButton.addEventListener("click", close);

    // 1. Закрытие корзины по клику на фон
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) close();
    });

    // 2. Закрытие корзины клавишей Escape
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") close();
    });

    window.VeloraCartUI = { open: open, close: close };
})();
