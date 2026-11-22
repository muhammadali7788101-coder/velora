
(() => {
  "use strict";

  const tabs = document.querySelectorAll(
    ".category-tabs .tab-btn"
  );

  const sections = document.querySelectorAll(
    ".menu-section"
  );

  if (!tabs.length || !sections.length) {
    console.warn("VELORA: tabs or sections not found.");
    return;
  }

  function showCategory(target) {
    const showAll = target === "all";

    if (
      !showAll &&
      !document.getElementById(target)
    ) {
      console.warn(`VELORA: category "${target}" not found.`);
      return;
    }

    sections.forEach((section) => {
     const visible =
  showAll || section.id === target;

section.hidden = !visible;
section.style.display = visible ? "" : "none";
    });

    tabs.forEach((tab) => {
      const active = tab.dataset.target === target;

      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      showCategory(tab.dataset.target);
    });
  });

  const activeTab =
    document.querySelector(
      ".category-tabs .tab-btn.active"
    ) ||
    document.querySelector(
      '.category-tabs .tab-btn[data-target="all"]'
    );

  showCategory(activeTab?.dataset.target || "all");
})();
