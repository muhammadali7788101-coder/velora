(() => {
    "use strict";

    const overlay = document.getElementById("dishModalOverlay");
    const closeButton = document.getElementById("dishModalClose");
    const body = document.getElementById("dishModalBody");
    if (!overlay || !body) return;

    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    function imagePath(value) {
        if (!value) return "";
        if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
        const nested = /\/menu\//.test(location.pathname);
        if (value.startsWith("../")) return nested ? value : value.replace(/^(\.\.\/)+/, "");
        if (value.startsWith("images/")) return (nested ? "../" : "") + value;
        return (nested ? "../" : "") + "images/catalog_images/" + value;
    }

    function open(card) {
        const title = card.dataset.name || card.querySelector(".dish-title, .card-title")?.textContent?.trim() || "Блюдо";
        const description = card.dataset.description || card.querySelector(".dish-desc, .card-desc")?.textContent?.trim() || "";
        const price = Number(card.dataset.price) || 0;
        const image = imagePath(card.dataset.image || card.querySelector("img")?.getAttribute("src") || "");
        const fallback = imagePath("hero.jpg");

        body.innerHTML = `
            <div class="modal-content-grid">
                <div class="modal-img-box"><img src="${escapeHTML(image)}" alt="${escapeHTML(title)}" onerror="this.onerror=null;this.src='${escapeHTML(fallback)}'"></div>
                <div class="modal-info-box">
                    <h2>${escapeHTML(title)}</h2>
                    <p>${escapeHTML(description)}</p>
                    <div class="modal-footer-flex">
                        <span class="modal-price">${price.toFixed(2)} $</span>
                        <button class="modal-add-btn" type="button">В корзину</button>
                    </div>
                </div>
            </div>`;

        const addButton = body.querySelector(".modal-add-btn");
        addButton.addEventListener("click", () => {
            const originalButton = card.querySelector(".card-add-btn, .add-to-cart-btn");
            if (originalButton) originalButton.click();
            overlay.classList.remove("active");
        });
        overlay.classList.add("active");
    }

    document.addEventListener("click", event => {
        if (event.target.closest(".card-add-btn, .add-to-cart-btn, .product-quantity-control")) return;
        const card = event.target.closest(".dish-card, .menu-card");
        if (card) open(card);
    });

    function close() { overlay.classList.remove("active"); }
    if (closeButton) closeButton.addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
})();
