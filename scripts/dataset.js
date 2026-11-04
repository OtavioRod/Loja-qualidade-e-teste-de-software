"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { hashPasswordWithSalt } = require("../src/auth/credentials");

const projectRoot = path.join(__dirname, "..");
const datasetPath = path.join(projectRoot, "data", "dataset_loja_6000.json");
const defaultDatabasePath = path.join(projectRoot, "data", "db.json");

const TEST_PASSWORD = "SenhaDidatica123!";
const TEST_ACCOUNT_IDS = new Set(["cliente-a", "cliente-b", "administrador"]);

function assertDidacticPath(filePath) {
  const target = path.resolve(filePath);
  const relative = path.relative(projectRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Gravação recusada fora da pasta da loja didática.");
  }
  if (target === path.resolve(datasetPath)) {
    throw new Error("O arquivo dataset_loja_6000.json não pode ser sobrescrito.");
  }
  return target;
}

function loadDataset() {
  const raw = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
  const counts = raw.metadata && raw.metadata.contagens;
  if (!counts || !Array.isArray(raw.produtos) || !Array.isArray(raw.clientes) || !Array.isArray(raw.cupons) || !Array.isArray(raw.pedidos) || !Array.isArray(raw.itensPedido)) {
    throw new Error("O dataset consolidado não tem o formato esperado.");
  }
  return raw;
}

function mapAddress(endereco) {
  const source = endereco || {};
  return {
    street: String(source.logradouro || ""),
    number: String(source.numero || ""),
    district: String(source.bairro || ""),
    city: String(source.cidade || ""),
    state: String(source.uf || ""),
    zip: String(source.cep || ""),
  };
}

function reais(cents) {
  return Number(cents) / 100;
}

function saltFor(id) {
  return crypto.createHash("sha256").update(`loja-aurora:${id}`).digest("hex").slice(0, 32);
}

function passwordFor(cliente) {
  if (TEST_ACCOUNT_IDS.has(cliente.id)) return TEST_PASSWORD;
  return crypto.createHash("sha256").update(`sem-senha:${cliente.id}`).digest("hex");
}

function mapProducts(produtos) {
  return produtos.map((produto) => ({
    id: produto.id,
    sku: produto.sku,
    name: produto.nome,
    category: produto.categoria,
    description: produto.descricao,
    priceCents: produto.precoCentavos,
    price: reais(produto.precoCentavos),
    stock: produto.estoque,
    active: produto.ativo !== false,
    weightGrams: produto.pesoGramas,
  }));
}

async function mapUsers(clientes) {
  const users = clientes.map((cliente) => ({
    id: cliente.id,
    name: cliente.nome,
    email: String(cliente.email || "").toLowerCase(),
    role: cliente.papel === "admin" ? "admin" : "customer",
    active: cliente.ativo !== false,
    address: mapAddress(cliente.endereco),
    passwordHash: "",
  }));

  let cursor = 0;
  async function worker() {
    while (cursor < clientes.length) {
      const index = cursor;
      cursor += 1;
      const cliente = clientes[index];
      users[index].passwordHash = await hashPasswordWithSalt(passwordFor(cliente), saltFor(cliente.id));
    }
  }

  await Promise.all(Array.from({ length: 8 }, () => worker()));
  return users;
}

function mapCoupons(cupons) {
  return cupons.map((cupom) => ({
    id: cupom.id,
    code: cupom.codigo,
    description: `${cupom.percentual}%`,
    type: "percent",
    value: cupom.percentual,
    startsAt: cupom.inicio,
    expiresAt: cupom.validade,
    active: cupom.ativo !== false,
    minimumSubtotalCents: cupom.subtotalMinimoCentavos,
  }));
}

function mapOrders(pedidos, itensPedido, coupons) {
  const couponById = new Map(coupons.map((coupon) => [coupon.id, coupon]));
  const itemsByOrder = new Map();

  for (const item of itensPedido) {
    const line = {
      id: item.id,
      productId: item.produtoId,
      name: item.nomeProduto,
      quantity: item.quantidade,
      unitPriceCents: item.precoUnitarioCentavos,
      unitPrice: reais(item.precoUnitarioCentavos),
      lineTotalCents: item.totalCentavos,
      lineTotal: reais(item.totalCentavos),
    };
    const bucket = itemsByOrder.get(item.pedidoId);
    if (bucket) bucket.push(line);
    else itemsByOrder.set(item.pedidoId, [line]);
  }

  return pedidos.map((pedido) => {
    const coupon = pedido.cupomId ? couponById.get(pedido.cupomId) : null;
    return {
      id: pedido.id,
      userId: pedido.clienteId,
      createdAt: pedido.criadoEm,
      status: pedido.status,
      items: itemsByOrder.get(pedido.id) || [],
      subtotalCents: pedido.subtotalCentavos,
      discountCents: pedido.descontoCentavos,
      shippingCents: pedido.freteCentavos,
      totalCents: pedido.totalCentavos,
      subtotal: reais(pedido.subtotalCentavos),
      discount: reais(pedido.descontoCentavos),
      shipping: reais(pedido.freteCentavos),
      total: reais(pedido.totalCentavos),
      couponId: pedido.cupomId,
      couponCode: coupon ? coupon.code : null,
      address: mapAddress(pedido.endereco),
    };
  });
}

function uniqueIds(records, label, errors) {
  const seen = new Set();
  for (const record of records) {
    if (!record.id || seen.has(record.id)) errors.push(`ID duplicado ou vazio em ${label}: ${record.id}`);
    seen.add(record.id);
  }
  return seen;
}

function validateDatabase(database, raw) {
  const errors = [];
  const counts = raw.metadata.contagens;
  const itemCount = database.orders.reduce((sum, order) => sum + order.items.length, 0);

  if (database.products.length !== counts.produtos) errors.push("Contagem de produtos divergente.");
  if (database.users.length !== counts.clientes) errors.push("Contagem de clientes divergente.");
  if (database.coupons.length !== counts.cupons) errors.push("Contagem de cupons divergente.");
  if (database.orders.length !== counts.pedidos) errors.push("Contagem de pedidos divergente.");
  if (itemCount !== counts.itensPedido) errors.push("Contagem de itens divergente.");
  if (database.sessions.length !== 0) errors.push("O reset deve começar sem sessões.");

  const productIds = uniqueIds(database.products, "produtos", errors);
  const userIds = uniqueIds(database.users, "clientes", errors);
  const couponIds = uniqueIds(database.coupons, "cupons", errors);
  uniqueIds(database.orders, "pedidos", errors);

  const emails = new Set();
  for (const user of database.users) {
    if (emails.has(user.email)) errors.push(`E-mail duplicado: ${user.email}`);
    emails.add(user.email);
    if (!user.passwordHash || user.passwordHash.includes(TEST_PASSWORD) || user.password) {
      errors.push(`Credencial inválida para ${user.id}`);
    }
  }

  const codes = new Set();
  for (const coupon of database.coupons) {
    const code = String(coupon.code || "").toUpperCase();
    if (codes.has(code)) errors.push(`Cupom duplicado: ${coupon.code}`);
    codes.add(code);
  }

  const sourceProducts = new Map(raw.produtos.map((produto) => [produto.id, produto]));
  for (const product of database.products) {
    const source = sourceProducts.get(product.id);
    if (!source || product.stock !== source.estoque) {
      errors.push(`Estoque alterado na importação: ${product.id}`);
    }
  }

  const itemIds = new Set();
  for (const order of database.orders) {
    if (!userIds.has(order.userId)) errors.push(`Pedido ${order.id} sem cliente.`);
    if (order.couponId && !couponIds.has(order.couponId)) errors.push(`Pedido ${order.id} com cupom inexistente.`);
    if (!order.items.length) errors.push(`Pedido ${order.id} sem itens.`);

    let itemsTotal = 0;
    for (const item of order.items) {
      if (itemIds.has(item.id)) errors.push(`Item duplicado: ${item.id}`);
      itemIds.add(item.id);
      if (!productIds.has(item.productId)) errors.push(`Item ${item.id} sem produto.`);
      if (item.unitPriceCents * item.quantity !== item.lineTotalCents) {
        errors.push(`Total do item ${item.id} não confere.`);
      }
      itemsTotal += item.lineTotalCents;
    }

    if (itemsTotal !== order.subtotalCents) errors.push(`Subtotal divergente em ${order.id}.`);
    if (order.subtotalCents - order.discountCents + order.shippingCents !== order.totalCents) {
      errors.push(`Total divergente em ${order.id}.`);
    }
  }

  if (itemIds.size !== counts.itensPedido) errors.push("Itens órfãos ou faltando na associação com pedidos.");

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return {
    produtos: database.products.length,
    catalogoAtivo: database.products.filter((product) => product.active !== false).length,
    clientes: database.users.length,
    cupons: database.coupons.length,
    pedidos: database.orders.length,
    itens: itemCount,
  };
}

async function buildDatabase() {
  const raw = loadDataset();
  const products = mapProducts(raw.produtos);
  const coupons = mapCoupons(raw.cupons);
  const users = await mapUsers(raw.clientes);
  const orders = mapOrders(raw.pedidos, raw.itensPedido, coupons);
  const database = {
    users,
    products,
    coupons,
    orders,
    sessions: [],
  };
  const report = validateDatabase(database, raw);
  return { database, report };
}

function commitDatabase(filePath, database) {
  const target = assertDidacticPath(filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  assertDidacticPath(temporary);
  fs.writeFileSync(temporary, JSON.stringify(database));
  fs.renameSync(temporary, target);
  return target;
}

async function seedDatabase(filePath = defaultDatabasePath) {
  const { database, report } = await buildDatabase();
  const target = commitDatabase(filePath, database);
  return { target, report, database };
}

module.exports = {
  TEST_PASSWORD,
  TEST_ACCOUNT_IDS,
  datasetPath,
  defaultDatabasePath,
  assertDidacticPath,
  loadDataset,
  buildDatabase,
  commitDatabase,
  seedDatabase,
  validateDatabase,
};
