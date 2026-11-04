"use strict";

var Aurora = window.Aurora || (window.Aurora = {});

Aurora.state = {
  user: null,
  products: [],
  cart: [],
  couponCode: "",
  quote: null,
  receipt: null,
};

function loadStoredCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("aurora-cart") || "[]");
    Aurora.state.cart = Array.isArray(cart) ? cart : [];
  } catch (error) {
    Aurora.state.cart = [];
  }
  Aurora.state.couponCode = localStorage.getItem("aurora-coupon") || "";
}

Aurora.persistCart = function persistCart() {
  localStorage.setItem("aurora-cart", JSON.stringify(Aurora.state.cart));
  if (Aurora.state.couponCode) localStorage.setItem("aurora-coupon", Aurora.state.couponCode);
  else localStorage.removeItem("aurora-coupon");
  Aurora.updateCartCount();
};

Aurora.updateCartCount = function updateCartCount() {
  const count = Aurora.state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.getElementById("cart-count").textContent = String(count);
};

Aurora.addToCart = function addToCart(productId) {
  const current = Aurora.state.cart.find((item) => item.productId === productId);
  if (current) current.quantity += 1;
  else Aurora.state.cart.push({ productId, quantity: 1 });
  Aurora.state.receipt = null;
  Aurora.persistCart();
  return Aurora.renderCart();
};

function onQuantityChanged(productId, quantity) {
  const item = Aurora.state.cart.find((entry) => entry.productId === productId);
  if (!item) return;
  item.quantity = quantity;
  Aurora.persistCart();
  Aurora.renderCart();
}

let renderToken = 0;

Aurora.renderCart = async function renderCart() {
  const token = ++renderToken;
  const root = document.getElementById("cart-content");
  const checkout = document.getElementById("checkout-box");
  const feedback = document.getElementById("coupon-feedback");
  document.getElementById("coupon-code").value = Aurora.state.couponCode || "";

  if (Aurora.state.cart.length === 0) {
    root.innerHTML = "";
    checkout.hidden = Aurora.state.receipt === null;
    Aurora.state.quote = null;
    renderReceipt();
    return;
  }

  checkout.hidden = false;
  try {
    const quote = await Aurora.api.post("/api/cart/quote", {
      items: Aurora.state.cart,
      couponCode: Aurora.state.couponCode || null,
    });
    if (token !== renderToken) return;
    Aurora.state.quote = quote;
    feedback.textContent = "";
    root.innerHTML = renderLines(quote);
  } catch (error) {
    if (token !== renderToken) return;
    Aurora.state.quote = null;
    feedback.textContent = error.message;
    root.innerHTML = "";
  }
  renderReceipt();
};

function renderLines(quote) {
  const lines = quote.items.map((item) => `
    <div class="cart-line">
      <div>
        <strong>${Aurora.escapeHtml(item.name)}</strong>
        <div>${Aurora.formatBRL(item.lineTotal)}</div>
      </div>
      <input data-qty="true" data-product-id="${item.productId}" type="number" step="1" value="${item.quantity}" placeholder="Qtd">
      <button type="button" class="button button-quiet" data-remove="${item.productId}">Remover</button>
    </div>
  `).join("");

  return `
    ${lines}
    <div class="totals" data-testid="cart-summary">
      <div>Subtotal <span data-testid="cart-subtotal">${Aurora.formatBRL(quote.subtotal)}</span></div>
      <div>Desconto <span data-testid="cart-discount">${Aurora.formatBRL(quote.discount)}</span></div>
      <div>Frete <span data-testid="cart-shipping">${Aurora.formatBRL(quote.shipping)}</span></div>
      <div><strong>Total <span data-testid="cart-total">${Aurora.formatBRL(quote.total)}</span></strong></div>
    </div>
  `;
}

function renderReceipt() {
  const receipt = document.getElementById("receipt");
  const order = Aurora.state.receipt;
  if (!order) {
    receipt.innerHTML = "";
    return;
  }
  receipt.innerHTML = `
    <div class="receipt">
      <h2>Pedido ${order.id}</h2>
      <div>Subtotal ${Aurora.formatBRL(order.subtotal)}</div>
      <div>Desconto ${Aurora.formatBRL(order.discount)}</div>
      <div>Frete ${Aurora.formatBRL(order.shipping)}</div>
      <div><strong>Total <span data-testid="receipt-total">${Aurora.formatBRL(order.total)}</span></strong></div>
    </div>
  `;
}

function readAddress() {
  return {
    street: document.getElementById("addr-street").value,
    number: document.getElementById("addr-number").value,
    district: document.getElementById("addr-district").value,
    city: document.getElementById("addr-city").value,
    state: document.getElementById("addr-state").value,
    zip: document.getElementById("addr-zip").value,
  };
}

Aurora.initCart = function initCart() {
  loadStoredCart();
  Aurora.updateCartCount();
  const content = document.getElementById("cart-content");

  content.addEventListener("change", (event) => {
    if (!event.target.matches("[data-qty]")) return;
    onQuantityChanged(event.target.dataset.productId, Number(event.target.value));
  });

  content.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    Aurora.state.cart = Aurora.state.cart.filter((item) => item.productId !== button.dataset.remove);
    Aurora.persistCart();
    Aurora.renderCart();
  });

  document.getElementById("apply-coupon").addEventListener("click", () => {
    Aurora.state.couponCode = document.getElementById("coupon-code").value.trim();
    Aurora.persistCart();
    Aurora.renderCart();
  });

  document.getElementById("checkout-button").addEventListener("click", async () => {
    if (Aurora.state.checkingOut) return;
    const feedback = document.getElementById("checkout-feedback");
    feedback.textContent = "";
    if (!Aurora.state.user) {
      location.hash = "#entrar";
      return;
    }
    Aurora.state.checkingOut = true;
    const button = document.getElementById("checkout-button");
    button.disabled = true;
    try {
      await Aurora.renderCart();
      const quote = Aurora.state.quote;
      if (!quote) throw new Error("Não foi possível calcular o carrinho.");
      const result = await Aurora.api.post("/api/checkout", {
        items: quote.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        couponCode: Aurora.state.couponCode || null,
        address: readAddress(),
      });
      Aurora.state.receipt = result.order;
      Aurora.state.cart = [];
      Aurora.persistCart();
      await Aurora.renderCart();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      Aurora.state.checkingOut = false;
      button.disabled = false;
    }
  });
};
