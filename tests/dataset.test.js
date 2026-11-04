"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { verifyPassword } = require("../src/auth/credentials");
const { isListedInCatalog } = require("../src/domain/catalog");
const { REFERENCE_INSTANT, now, setClock, resetClock } = require("../src/domain/clock");
const {
  TEST_PASSWORD,
  datasetPath,
  assertDidacticPath,
  buildDatabase,
  seedDatabase,
} = require("../scripts/dataset");

let loaded;

function database() {
  if (!loaded) loaded = buildDatabase();
  return loaded;
}

test("importação preserva contagens, relações, totais e estoque", async () => {
  const { database: data, report } = await database();
  assert.equal(report.produtos, 1200);
  assert.equal(report.clientes, 800);
  assert.equal(report.cupons, 100);
  assert.equal(report.pedidos, 1200);
  assert.equal(report.itens, 2700);
  assert.equal(report.catalogoAtivo, data.products.filter(isListedInCatalog).length);

  const product = data.products.find((item) => item.id === "produto-teste");
  assert.equal(product.priceCents, 15000);
  assert.equal(product.stock, 5);
  assert.equal(product.active, true);

  const order = data.orders.find((item) => item.id === "pedido-cliente-b");
  assert.equal(order.userId, "cliente-b");
  assert.ok(order.items.length >= 2);
  assert.equal(
    order.items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    order.subtotalCents,
  );
  assert.equal(order.subtotalCents - order.discountCents + order.shippingCents, order.totalCents);

  assert.equal(JSON.stringify(data).includes(TEST_PASSWORD), false);
  assert.equal(data.sessions.length, 0);
});

test("as três contas locais entram com a senha de teste e as demais não", async () => {
  const { database: data } = await database();
  for (const email of ["cliente-a@loja.test", "cliente-b@loja.test", "admin@loja.test"]) {
    const user = data.users.find((item) => item.email === email);
    assert.equal(user.active, true);
    assert.equal(await verifyPassword(TEST_PASSWORD, user.passwordHash), true);
  }

  const inactive = data.users.find((user) => user.active === false);
  assert.ok(inactive);
  assert.equal(await verifyPassword(TEST_PASSWORD, inactive.passwordHash), false);
});

test("reset grava a mesma base duas vezes e não altera o dataset", async () => {
  const { database: data } = await database();
  const before = fs.statSync(datasetPath).mtimeMs;
  const target = path.join(__dirname, "..", "data", "db.reset-check.json");
  await seedDatabase(target);
  const first = fs.readFileSync(target);
  await seedDatabase(target);
  const second = fs.readFileSync(target);
  assert.equal(Buffer.compare(first, second), 0);
  assert.equal(first.toString("utf8"), JSON.stringify(data));
  fs.unlinkSync(target);
  assert.equal(fs.statSync(datasetPath).mtimeMs, before);
  assert.equal(new Set(data.orders.map((order) => order.id)).size, data.orders.length);
  assert.throws(() => assertDidacticPath(path.join(__dirname, "..", "..", "fora.json")));
  assert.throws(() => assertDidacticPath(datasetPath));
});

test("relógio fixo distingue cupom vencido e cupom válido", async () => {
  setClock(REFERENCE_INSTANT);
  try {
    const { database: data } = await database();
    const antigo = data.coupons.find((coupon) => coupon.code === "ANTIGO");
    const vinte = data.coupons.find((coupon) => coupon.code === "VINTE");
    const cinco = data.coupons.find((coupon) => coupon.code === "CINCO");
    assert.ok(new Date(antigo.expiresAt).getTime() < now().getTime());
    assert.ok(new Date(vinte.expiresAt).getTime() >= now().getTime());
    assert.ok(new Date(cinco.expiresAt).getTime() >= now().getTime());
    assert.equal(now().toISOString(), REFERENCE_INSTANT);
  } finally {
    resetClock();
  }
});
