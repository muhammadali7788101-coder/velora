(() => {
    "use strict";
    const CONFIG = window.VELORA_CONFIG;
    const form = document.getElementById("veloraOrderForm");
    const successModal = document.getElementById("successModalOverlay");
    const successClose = document.getElementById("successCloseBtn");
    if (!form) return;
    if (!CONFIG) throw new Error("Не подключён js/config.js");
    const submitButton = form.querySelector('[type="submit"]');
    const addressInput = document.getElementById("veloraCustomerAddress");
    const addressWrap = addressInput?.closest(".velora-input-wrap");
    const deliveryOptions = [...document.querySelectorAll(".velora-delivery-option")];
    let submitting = false;
    function updateDelivery() {
        const selected = form.querySelector('input[name="delivery"]:checked')?.value || "delivery";
        deliveryOptions.forEach(option => option.classList.toggle("selected", !!option.querySelector('input[name="delivery"]')?.checked));
        if (addressInput && addressWrap) {
            const pickup = selected === "pickup";
            addressWrap.style.display = pickup ? "none" : "";
            addressInput.required = !pickup;
            if (pickup) addressInput.value = "Самовывоз из ресторана";
            else if (addressInput.value === "Самовывоз из ресторана") addressInput.value = "";
        }
    }
    deliveryOptions.forEach(option => option.addEventListener("click", () => {
        const radio = option.querySelector('input[name="delivery"]'); if (radio) radio.checked = true; updateDelivery();
    }));
    form.querySelectorAll('input[name="delivery"]').forEach(radio => radio.addEventListener("change", updateDelivery));
    updateDelivery();
    const successMessage = successModal?.querySelector("p");
    const defaultSuccessMessage = successMessage?.textContent || "Заказ отправлен.";
    successClose?.addEventListener("click", () => successModal?.classList.remove("active"));
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (submitting || !form.reportValidity()) return;
        const cart = window.VeloraCart?.getItems() || [];
        if (!cart.length) { alert("Ваша корзина пуста!"); return; }
        submitting = true;
        const originalHTML = submitButton?.innerHTML;
        if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Отправляем…"; }
        try {
            const deliveryType = form.querySelector('input[name="delivery"]:checked')?.value || "delivery";
            const order = {
                clientName: document.getElementById("veloraCustomerName")?.value.trim() || "",
                phone: document.getElementById("veloraCustomerPhone")?.value.trim() || "",
                address: deliveryType === "pickup" ? "Самовывоз из ресторана" : (addressInput?.value.trim() || ""),
                deliveryType,
                comment: document.getElementById("veloraOrderComment")?.value.trim() || "",
                items: cart.map(({name, price, quantity, image, productId}) => ({name, price:Number(price)||0, quantity:Number(quantity)||1, image:image||"", productId:productId||""})),
                totalPrice: Number(cart.reduce((sum, item) => sum + (Number(item.price)||0) * (Number(item.quantity)||1), 0).toFixed(2)),
                date: new Date().toLocaleString("ru-RU"),
                status: "Новый"
            };
            const endpoint = CONFIG.api.baseUrl.replace(/\/$/, "") + "/" + CONFIG.resources.orders;
            const response = await fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(order)});
            if (!response.ok) throw new Error("Mokky.dev вернул статус " + response.status);
            window.VeloraCart.clear();
            form.reset(); updateDelivery();
            if (window.VeloraCartUI?.close) window.VeloraCartUI.close();
            if (successMessage) successMessage.textContent = defaultSuccessMessage;
            successModal?.classList.add("active");
        } catch (error) {
            console.error("Ошибка оформления заказа:", error);
            alert("Не удалось отправить заказ. Проверьте адрес API и ресурс orders в Mokky.dev.");
        } finally {
            submitting = false;
            if (submitButton) { submitButton.disabled = false; if (originalHTML) submitButton.innerHTML = originalHTML; }
        }
    });
})();
