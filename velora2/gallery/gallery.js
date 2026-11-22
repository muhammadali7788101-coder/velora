document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  const galleryData = [
    {category:"interior",tag:"Интерьер",title:"Основной зал Velora"},
    {category:"dishes",tag:"Основные блюда",title:"Стейк из говядины"},
    {category:"dishes",tag:"Десерты",title:"Шоколадный фондан"},
    {category:"dishes",tag:"Паста",title:"Итальянская паста"},
    {category:"dishes",tag:"Закуски",title:"Салат Цезарь"},
    {category:"team",tag:"Команда",title:"Работа шеф-повара"},
    {category:"interior",tag:"Интерьер",title:"Барная зона"},
    {category:"interior",tag:"Интерьер",title:"Вечерняя атмосфера"},
    {category:"dishes",tag:"Напитки",title:"Фирменный капучино"},
    {category:"dishes",tag:"Закуски",title:"Креветки в соусе"},
    {category:"dishes",tag:"Десерты",title:"Панна-котта с ягодами"},
    {category:"interior",tag:"Интерьер",title:"Уютный столик"}
  ];
  const items=[...document.querySelectorAll(".gallery-item")];
  items.forEach((item,index)=>{
    const data=galleryData[index]; if(!data)return;
    item.dataset.category=data.category;
    const overlay=document.createElement("div"); overlay.className="gallery-item-overlay";
    overlay.innerHTML=`<div class="overlay-content"><span class="overlay-tag"></span><h3 class="overlay-title"></h3></div><div class="overlay-icon"><i class="fa-solid fa-magnifying-glass-plus"></i></div>`;
    overlay.querySelector(".overlay-tag").textContent=data.tag;
    overlay.querySelector(".overlay-title").textContent=data.title;
    item.appendChild(overlay);
  });
  const tabs=[...document.querySelectorAll(".gallery-tab")];
  tabs.forEach(tab=>tab.addEventListener("click",function(){
    tabs.forEach(node=>node.classList.toggle("active",node===tab));
    const filter=tab.dataset.filter;
    items.forEach(item=>{item.hidden=filter!=="all"&&item.dataset.category!==filter;});
  }));
});
