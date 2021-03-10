"use strict";
@@include("webp.js");

const menuButtonElem = document.querySelector(".menu__button");

menuButtonElem.addEventListener("click", () => {
  menuButtonElem.classList.toggle("active");
});
