"use strict";

const { buildDatabase, commitDatabase, defaultDatabasePath } = require("./dataset");

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || !process.argv[index + 1]) return null;
  return process.argv[index + 1];
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function money(cents) {
  return cents / 100;
}

async function buildVolume(productCount, orderCount) {
  const { database } = await buildDatabase();
  const random = mulberry32(20260315);
  const categories = ["Papelaria", "Acessórios", "Eletrônicos", "Casa"];
  const generated = [];

  for (let index = 1; index <= productCount; index += 1) {
    const priceCents = 1000 + Math.floor(random() * 49000);
    generated.push({
      id: `p-carga-${String(index).padStart(5, "0")}`,
      name: `Item de catálogo ${String(index).padStart(5, "0")}`,
      description: "Item gerado para prática com volume maior de dados.",
      category: categories[index % categories.length],
      price: money(priceCents),
      stock: 5 + Math.floor(random() * 40),
    });
  }

  database.products = database.products.concat(generated);
  const catalog = database.products;
  const customers = ["cliente-a", "cliente-b"];
  const extraOrders = [];

  for (let index = 1; index <= orderCount; index += 1) {
    const itemCount = 1 + Math.floor(random() * 3);
    const items = [];
    for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
      const product = catalog[Math.floor(random() * catalog.length)];
      const quantity = 1 + Math.floor(random() * 3);
      const unitCents = Math.round(product.price * 100);
      items.push({
        productId: product.id,
        name: product.name,
        unitPrice: money(unitCents),
        quantity,
        lineTotal: money(unitCents * quantity),
      });
    }
    const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.lineTotal * 100), 0);
    const discountCents = subtotalCents >= 20000 ? Math.round((subtotalCents * 10) / 100) : 0;
    const shippingCents = subtotalCents >= 30000 ? 0 : 1850;
    const day = String((index % 27) + 1).padStart(2, "0");
    extraOrders.push({
      id: `ped-${3000 + index}`,
      userId: customers[index % customers.length],
      createdAt: `2026-07-${day}T12:00:00.000Z`,
      items,
      subtotal: money(subtotalCents),
      discount: money(discountCents),
      shipping: money(shippingCents),
      total: money(subtotalCents - discountCents + shippingCents),
      couponCode: null,
      benefit: discountCents > 0 ? "automatico" : null,
      address: {
        street: "Rua das Acácias",
        number: "120",
        district: "Centro",
        city: "Campinas",
        state: "SP",
        zip: "13010-000",
      },
      status: "confirmado",
    });
  }

  database.orders = database.orders.concat(extraOrders);
  return database;
}

if (require.main === module) {
  const products = Number(arg("products"));
  const orders = Number(arg("orders"));
  if (!Number.isInteger(products) || products < 0 || !Number.isInteger(orders) || orders < 0) {
    console.log("Uso: npm run generate -- --products 4000 --orders 2000");
    process.exit(1);
  }

  const target = defaultDatabasePath;
  buildVolume(products, orders)
    .then((database) => {
      commitDatabase(target, database);
      console.log(`Volume gravado em ${target}`);
      console.log(`Produtos adicionais: ${products}`);
      console.log(`Pedidos adicionais: ${orders}`);
      console.log("Reinicie o servidor se ele já estiver em execução.");
      console.log("Para voltar aos dados iniciais, execute: npm run reset");
    })
    .catch((error) => {
      console.error(error.message || error);
      process.exit(1);
    });
}
