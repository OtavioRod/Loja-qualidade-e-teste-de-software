"use strict";

var Aurora = window.Aurora || (window.Aurora = {});

function renderOrder(order) {
  const items = order.items.map((item) => `<li>${item.quantity} × ${Aurora.escapeHtml(item.name)} — ${Aurora.formatBRL(item.lineTotal)}</li>`).join("");
  const when = new Date(order.createdAt).toLocaleString("pt-BR");
  return `
    <article class="order-card" data-testid="order-card">
      <h2>${order.id}</h2>
      <p class="muted">${when} · ${order.status}</p>
      <ul>${items}</ul>
      <p>Subtotal ${Aurora.formatBRL(order.subtotal)} · Desconto ${Aurora.formatBRL(order.discount)} · Frete ${Aurora.formatBRL(order.shipping)}</p>
      <p><strong>Total ${Aurora.formatBRL(order.total)}</strong></p>
      <p>${Aurora.escapeHtml(order.address.street)}, ${Aurora.escapeHtml(order.address.number)} — ${Aurora.escapeHtml(order.address.city)}/${Aurora.escapeHtml(order.address.state)}</p>
      <p><a href="#pedido/${Aurora.escapeHtml(order.id)}">Ver pedido</a></p>
    </article>
  `;
}

Aurora.openOrder = async function openOrder(orderId) {
  const status = document.getElementById("orders-status");
  const list = document.getElementById("orders-list");
  if (!Aurora.state.user) {
    status.textContent = "Entre na sua conta para consultar pedidos.";
    list.innerHTML = "";
    return;
  }
  try {
    const order = await Aurora.api.get(`/api/orders/${encodeURIComponent(orderId)}`);
    status.textContent = "";
    list.innerHTML = `<p><a href="#pedidos">Voltar ao histórico</a></p>${renderOrder(order)}`;
  } catch (error) {
    status.textContent = error.message;
    list.innerHTML = `<p><a href="#pedidos">Voltar ao histórico</a></p>`;
  }
};

Aurora.loadOrders = async function loadOrders() {
  const status = document.getElementById("orders-status");
  const list = document.getElementById("orders-list");
  if (!Aurora.state.user) {
    status.textContent = "Entre na sua conta para consultar pedidos.";
    list.innerHTML = "";
    return;
  }

  status.textContent = "Carregando pedidos...";
  let orders = [];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    orders = await Aurora.api.get("/api/orders");
  }

  list.innerHTML = "";
  if (orders.length === 0) {
    status.textContent = "Nenhum pedido foi encontrado para esta conta.";
    return;
  }
  status.textContent = "";
  for (const order of orders) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderOrder(order);
    const card = wrapper.firstElementChild;
    list.appendChild(card);
    card.dataset.height = String(card.offsetHeight);
  }
};

Aurora.initOrders = function initOrders() {};
