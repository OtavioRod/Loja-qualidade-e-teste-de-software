"use strict";

var Aurora = window.Aurora || (window.Aurora = {});

const ROUTES = {
  "": "catalog",
  "#catalogo": "catalog",
  "#carrinho": "cart",
  "#pedidos": "orders",
  "#entrar": "login",
  "#cadastro": "register",
  "#admin": "admin",
};

Aurora.applyRoute = function applyRoute() {
  const hash = location.hash;
  let view = ROUTES[hash] || "catalog";
  let orderId = "";
  if (hash.startsWith("#pedido/")) {
    view = "orders";
    orderId = decodeURIComponent(hash.slice("#pedido/".length));
  }
  for (const section of document.querySelectorAll("[data-view]")) {
    section.hidden = section.dataset.view !== view;
  }
  if (view === "cart") Aurora.renderCart();
  if (view === "orders" && orderId) Aurora.openOrder(orderId);
  else if (view === "orders") Aurora.loadOrders();
  if (view === "admin") Aurora.loadAdmin();
};

document.addEventListener("DOMContentLoaded", async () => {
  await Aurora.initCatalog();
  Aurora.initCart();
  Aurora.initAuth();
  Aurora.initOrders();
  Aurora.initAdmin();
  await Aurora.restoreSession();
  if (!location.hash) location.hash = "#catalogo";
  Aurora.applyRoute();
  window.addEventListener("hashchange", () => Aurora.applyRoute());
  setInterval(() => {
    fetch("/api/products").catch(() => {});
  }, 2000);
});
