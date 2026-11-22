// 1. Загрузка товаров из API
(function () {
    "use strict";

    const CONFIG = window.VELORA_CONFIG;
    if (!CONFIG) throw new Error("Не подключён js/config.js");
    const MENU_API = CONFIG.api.baseUrl.replace(/\/$/, "") + "/" + CONFIG.resources.menu;
    const CURRENCY = CONFIG.currency;
    const isMenuPage = window.location.pathname.includes("/menu/");
    const fallbackImage = isMenuPage
        ? "../images/catalog_images/hero.jpg"
        : "images/catalog_images/hero.jpg";

    // 2. Безопасная обработка текста
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            const symbols = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };
            return symbols[char];
        });
    }

    // 3. Формирование пути изображения
    function getImagePath(image) {
        if (!image) return fallbackImage;
        if (/^(https?:|data:|blob:|\/)/i.test(image)) return image;

        if (image.startsWith("../")) {
            return isMenuPage ? image : image.replace(/^\.\.\//, "");
        }

        if (image.startsWith("images/")) {
            return (isMenuPage ? "../" : "") + image;
        }

        return (isMenuPage ? "../" : "") + "images/catalog_images/" + image;
    }

    function createImage(image, title, className) {
        const path = escapeHTML(getImagePath(image));
        const fallback = escapeHTML(fallbackImage);

        return `<div class="${className}">
            <img src="${path}" alt="${escapeHTML(title)}" loading="lazy"
                 onerror="this.onerror=null;this.src='${fallback}'">
        </div>`;
    }

    // 4. Шаблон карточки главной страницы
    function createHomeCard(dish) {
        const title = escapeHTML(dish.title || "Блюдо");
        const description = escapeHTML(dish.desc || "");
        const category = escapeHTML(dish.category || "Меню");
        const price = Number(dish.price) || 0;
        const image = escapeHTML(dish.image || "");
        const id = escapeHTML(dish.id || "");

        return `<article class="menu-card"
                    data-name="${title}"
                    data-description="${description}"
                    data-price="${price}"
                    data-image="${image}"
                    data-product-id="${id}">
            ${createImage(dish.image, dish.title, "card-img")}
            <div class="card-content">
                <span class="card-category">${category}</span>
                <h3 class="card-title">${title}</h3>
                <p class="card-desc">${description}</p>
                <div class="card-footer">
                    <span class="card-price">${price} ${CURRENCY}</span>
                    <button class="card-add-btn" type="button" aria-label="Добавить ${title} в корзину">+</button>
                    <div class="product-quantity-control" hidden>
                        <button class="quantity-minus" type="button" aria-label="Уменьшить количество ${title}">−</button>
                        <span class="quantity-value">1</span>
                        <button class="quantity-plus" type="button" aria-label="Увеличить количество ${title}">+</button>
                    </div>
                </div>
            </div>
        </article>`;
    }

    // 5. Шаблон карточки каталога
    function createMenuCard(dish) {
        const title = escapeHTML(dish.title || "Блюдо");
        const description = escapeHTML(dish.desc || "");
        const price = Number(dish.price) || 0;
        const image = escapeHTML(dish.image || "");
        const id = escapeHTML(dish.id || "");

        return `<article class="dish-card"
                    data-name="${title}"
                    data-description="${description}"
                    data-price="${price}"
                    data-image="${image}"
                    data-product-id="${id}">
            ${createImage(dish.image, dish.title, "dish-img")}
            <h3 class="dish-title">${title}</h3>
            <p class="dish-desc">${description}</p>
            <div class="dish-footer">
                <span class="dish-price">${price} ${CURRENCY}</span>
                <button class="add-to-cart-btn" type="button" aria-label="Добавить ${title} в корзину">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <div class="product-quantity-control" hidden>
                    <button class="quantity-minus" type="button" aria-label="Уменьшить количество ${title}">−</button>
                    <span class="quantity-value">1</span>
                    <button class="quantity-plus" type="button" aria-label="Увеличить количество ${title}">+</button>
                </div>
            </div>
        </article>`;
    }

    function createCategoryId(index) {
        return "menu-category-" + index;
    }

    function showHomeDishes(dishes) {
        const homeGrid = document.getElementById("homeMenuGrid");
        if (!homeGrid) return;

        if (!dishes.length) {
            homeGrid.innerHTML = '<p class="home-menu-message">Пока нет доступных блюд.</p>';
            return;
        }

        // 6. Вывод товаров на главной странице
        homeGrid.innerHTML = dishes.slice(0, 4).map(createHomeCard).join("");
    }

    function showCatalog(dishes) {
        const catalog = document.getElementById("menuCatalog");
        const tabs = document.getElementById("menuCategoryTabs");
        if (!catalog || !tabs) return;

        if (!dishes.length) {
            catalog.innerHTML = '<p class="empty-menu-message">В меню пока нет доступных блюд.</p>';
            tabs.innerHTML = "";
            return;
        }

        // 7. Категории и переключение вкладок
        const categories = [...new Set(dishes.map(function (dish) {
            return String(dish.category || "Другое").trim() || "Другое";
        }))];

        tabs.innerHTML = '<button class="tab-btn active" data-target="all" type="button">' +
            '<i class="fa-solid fa-utensils"></i><span>Все блюда</span></button>' +
            categories.map(function (category, index) {
                return `<button class="tab-btn" data-target="${createCategoryId(index)}" type="button">
                    <i class="fa-solid fa-bowl-food"></i><span>${escapeHTML(category)}</span>
                </button>`;
            }).join("");

        catalog.innerHTML = categories.map(function (category, index) {
            const categoryDishes = dishes.filter(function (dish) {
                return (String(dish.category || "Другое").trim() || "Другое") === category;
            });

            return `<section class="menu-section" id="${createCategoryId(index)}">
                <div class="section-header">
                    <h2 class="section-title">${escapeHTML(category)}</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="dishes-grid">${categoryDishes.map(createMenuCard).join("")}</div>
            </section>`;
        }).join("");
    }

    document.addEventListener("click", function (event) {
        const tab = event.target.closest("#menuCategoryTabs button[data-target]");
        if (!tab) return;

        const catalog = document.getElementById("menuCatalog");
        const tabs = document.getElementById("menuCategoryTabs");
        if (!catalog || !tabs) return;

        const target = tab.dataset.target;
        catalog.querySelectorAll(".menu-section").forEach(function (section) {
            section.hidden = target !== "all" && section.id !== target;
        });

        tabs.querySelectorAll(".tab-btn").forEach(function (button) {
            button.classList.toggle("active", button === tab);
        });
    });

    async function loadMenu() {
        const catalog = document.getElementById("menuCatalog");
        const homeGrid = document.getElementById("homeMenuGrid");

        try {
            const response = await fetch(MENU_API, { cache: "no-store" });
            if (!response.ok) throw new Error("Ошибка сервера: " + response.status);

            const result = await response.json();
            const serverDishes = Array.isArray(result)
                ? result
                : (result.items || result.data || []);

            const dishes = serverDishes.filter(function (dish) {
                return dish && dish.available !== false;
            });

            showHomeDishes(dishes);
            showCatalog(dishes);
            window.dispatchEvent(new Event("velora:menu-rendered"));
        } catch (error) {
            console.error("Не удалось загрузить товары из Mokky:", error);

            if (homeGrid) {
                homeGrid.innerHTML = '<p class="home-menu-message">Не удалось загрузить блюда. Попробуйте обновить страницу.</p>';
            }
            if (catalog) {
                catalog.innerHTML = '<p class="empty-menu-message">Не удалось загрузить меню. Проверьте подключение и попробуйте снова.</p>';
            }
        }
    }

    loadMenu();
})();
