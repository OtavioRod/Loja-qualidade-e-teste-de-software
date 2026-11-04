"use strict";

var Aurora = window.Aurora || (window.Aurora = {});

function hue(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 33 + char.charCodeAt(0)) % 360;
  }
  return hash;
}

function buildCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.testid = "product-card";
  card.dataset.productId = product.id;

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  thumb.style.background = `hsl(${hue(product.id)} 42% 38%)`;
  thumb.textContent = product.name.slice(0, 2).toUpperCase();

  const category = document.createElement("p");
  category.className = "category";
  category.textContent = product.category;

  const title = document.createElement("h2");
  title.textContent = product.name;

  const description = document.createElement("p");
  description.className = "muted";
  description.textContent = product.description;

  const price = document.createElement("p");
  price.className = "price";
  price.textContent = Aurora.formatBRL(product.price);

  const stock = document.createElement("p");
  stock.className = "stock";
  stock.textContent = `Estoque: ${product.stock}`;

  const add = document.createElement("div");
  add.className = "button button-primary";
  add.dataset.testid = "add-to-cart";
  add.dataset.productId = product.id;
  add.textContent = "Adicionar ao carrinho";
  add.addEventListener("click", () => Aurora.addToCart(product.id));

  card.append(thumb, category, title, description, price, stock, add);
  return card;
}

Aurora.renderCatalog = function renderCatalog() {
  const term = document.getElementById("search").value.trim().toLowerCase();
  const category = document.getElementById("category-filter").value;
  const grid = document.getElementById("catalog-grid");
  grid.replaceChildren();

  for (const product of Aurora.state.products) {
    const card = buildCard(product);
    const matchesTerm = !term || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term);
    const matchesCategory = !category || product.category === category;
    card.hidden = !(matchesTerm && matchesCategory);
    grid.appendChild(card);
  }

  document.getElementById("refresh-catalog").addEventListener("click", () => {
    Aurora.loadCatalog();
  });
};

let catalogToken = 0;

function fillCategories(products) {
  const select = document.getElementById("category-filter");
  const current = select.value;
  const categories = [...new Set(products.map((product) => product.category))].sort((left, right) =>
    left.localeCompare(right, "pt-BR"),
  );
  select.replaceChildren(new Option("Todas", ""));
  for (const category of categories) select.append(new Option(category, category));
  if (categories.includes(current)) select.value = current;
}

Aurora.loadCatalog = async function loadCatalog() {
  const token = ++catalogToken;
  const products = await Aurora.api.get("/api/products");
  if (token !== catalogToken) return;
  Aurora.state.products = products;
  fillCategories(products);
  Aurora.renderCatalog();
};

Aurora.initCatalog = function initCatalog() {
  document.getElementById("search").addEventListener("input", () => {
    Aurora.loadCatalog();
  });
  document.getElementById("category-filter").addEventListener("change", () => {
    Aurora.renderCatalog();
  });
  return Aurora.loadCatalog();
};
