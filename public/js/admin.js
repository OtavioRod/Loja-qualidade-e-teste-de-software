"use strict";

var Aurora = window.Aurora || (window.Aurora = {});

function renderAdminProducts(products) {
  const root = document.getElementById("admin-products");
  root.innerHTML = "";
  for (const product of products) {
    const row = document.createElement("form");
    row.className = "admin-row";
    row.dataset.productId = product.id;
    row.innerHTML = `
      <h2>${Aurora.escapeHtml(product.name)}</h2>
      <input name="price" type="number" step="0.01" value="${product.price}">
      <input name="stock" type="number" step="1" value="${product.stock}">
      <button type="submit" class="button button-secondary">Salvar</button>
    `;
    row.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(row);
      try {
        await Aurora.api.put(`/api/admin/products/${product.id}`, {
          price: Number(data.get("price")),
          stock: Number(data.get("stock")),
        });
        document.getElementById("admin-status").textContent = `${product.name} atualizado.`;
        Aurora.loadCatalog();
      } catch (error) {
        document.getElementById("admin-status").textContent = error.message;
      }
    });
    root.appendChild(row);
  }
}

Aurora.loadAdmin = async function loadAdmin() {
  const status = document.getElementById("admin-status");
  if (!Aurora.state.user) {
    status.textContent = "Entre na sua conta para abrir a administração.";
    return;
  }
  status.textContent = "";
  let products;
  try {
    products = await Aurora.api.get("/api/admin/products");
  } catch (error) {
    products = await Aurora.api.get("/api/products");
  }
  renderAdminProducts(products);

  const ordersRoot = document.getElementById("admin-orders");
  try {
    const orders = await Aurora.api.get("/api/admin/orders");
    ordersRoot.innerHTML = orders.map((order) => `<article class="order-card"><h2>${order.id}</h2><p>${order.userId} · ${Aurora.formatBRL(order.total)}</p></article>`).join("");
  } catch (error) {
    ordersRoot.textContent = error.message;
  }
};

Aurora.initAdmin = function initAdmin() {
  document.getElementById("new-product-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.getElementById("new-product-error");
    error.textContent = "";
    try {
      await Aurora.api.post("/api/admin/products", {
        name: document.getElementById("new-product-name").value,
        price: Number(document.getElementById("new-product-price").value),
        stock: Number(document.getElementById("new-product-stock").value),
        category: "Geral",
      });
      error.textContent = "";
      await Aurora.loadAdmin();
    } catch (err) {
      error.textContent = err.message;
    }
  });
};
