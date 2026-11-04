"use strict";

const { hasAvailableStock } = require("../domain/stock");
const { isListedInCatalog } = require("../domain/catalog");
const { quoteLines } = require("../domain/pricing");
const { placeOrder } = require("../services/checkout");
const { listVisibleOrders } = require("../services/orderHistory");
const { hashPassword, verifyPassword } = require("../auth/credentials");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(Object.assign(new Error("Corpo da requisição excede o limite."), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(Object.assign(new Error("JSON inválido."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function getAuthUser(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const session = db.findSession(token);
  if (!session) return null;
  const user = db.findUserById(session.userId);
  return user ? db.publicUser(user) : null;
}

function canRegister(body, users) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const emailOk = EMAIL_PATTERN.test(email);
  const duplicate = users.some((user) => user.email === email);
  if (name.length < 3 || !emailOk || password.length < 6 || duplicate) {
    return { ok: false };
  }
  return { ok: true, name, email, password };
}

function serializeProduct(product) {
  return {
    ...product,
    inStock: hasAvailableStock(1, product.stock),
  };
}

async function handleApi(req, res, db, url) {
  const path = url.pathname;
  const method = req.method.toUpperCase();
  const user = getAuthUser(req, db);
  let body = {};
  if (method !== "GET" && method !== "DELETE") {
    body = await readBody(req);
  }

  if (method === "POST" && path === "/api/auth/register") {
    const result = canRegister(body, db.listUsers());
    if (!result.ok) {
      send(res, 400, { error: "Dados inválidos" });
      return;
    }
    const created = db.addUser({
      id: `u-${Date.now().toString(36)}`,
      name: result.name,
      email: result.email,
      passwordHash: hashPassword(result.password),
      role: "customer",
    });
    const session = db.createSession(created.id);
    send(res, 201, { token: session.token, user: created });
    return;
  }

  if (method === "POST" && path === "/api/auth/login") {
    const email = String(body.email || "").trim().toLowerCase();
    const record = db.findUserByEmail(email);
    if (!record || !verifyPassword(String(body.password || ""), record.passwordHash)) {
      send(res, 401, { error: "E-mail ou senha incorretos." });
      return;
    }
    if (record.active === false) {
      send(res, 403, { error: "Conta inativa." });
      return;
    }
    const session = db.createSession(record.id);
    send(res, 200, { token: session.token, user: db.publicUser(record) });
    return;
  }

  if (method === "POST" && path === "/api/auth/logout") {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (token) db.deleteSession(token);
    send(res, 200, { ok: true });
    return;
  }

  if (method === "GET" && path === "/api/auth/me") {
    if (!user) {
      send(res, 401, { error: "Autenticação necessária." });
      return;
    }
    send(res, 200, { user });
    return;
  }

  if (method === "GET" && path === "/api/products") {
    send(res, 200, db.listProducts().filter(isListedInCatalog).map(serializeProduct));
    return;
  }

  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (method === "GET" && productMatch) {
    const product = db.findProduct(decodeURIComponent(productMatch[1]));
    if (!isListedInCatalog(product)) {
      send(res, 404, { error: "Produto não encontrado." });
      return;
    }
    send(res, 200, serializeProduct(product));
    return;
  }

  if (method === "POST" && path === "/api/cart/quote") {
    const lines = [];
    for (const item of body.items || []) {
      const product = db.findProduct(item.productId);
      if (!isListedInCatalog(product)) {
        send(res, 400, { error: "Produto não encontrado." });
        return;
      }
      lines.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
      });
    }

    let coupon = null;
    if (body.couponCode) {
      coupon = db.findCoupon(body.couponCode);
      if (!coupon) {
        send(res, 400, { error: "Cupom inválido." });
        return;
      }
    }

    const quote = quoteLines({ lines, coupon });
    if (!quote.ok) {
      send(res, 400, { error: quote.message });
      return;
    }
    send(res, 200, quote);
    return;
  }

  if (method === "POST" && path === "/api/checkout") {
    if (!user) {
      send(res, 401, { error: "Autenticação necessária." });
      return;
    }
    const result = placeOrder(db, user, body);
    if (!result.ok) {
      send(res, result.status, { error: result.error });
      return;
    }
    send(res, result.status, { order: result.order });
    return;
  }

  if (method === "GET" && path === "/api/orders") {
    if (!user) {
      send(res, 401, { error: "Autenticação necessária." });
      return;
    }
    send(res, 200, listVisibleOrders(db, user.id));
    return;
  }

  const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);
  if (method === "GET" && orderMatch) {
    if (!user) {
      send(res, 401, { error: "Autenticação necessária." });
      return;
    }
    const order = db.findOrder(decodeURIComponent(orderMatch[1]));
    if (!order) {
      send(res, 404, { error: "Pedido não encontrado." });
      return;
    }
    send(res, 200, order);
    return;
  }

  if (method === "GET" && path === "/api/admin/orders") {
    if (!user) {
      send(res, 401, { error: "Autenticação necessária." });
      return;
    }
    if (user.role !== "admin") {
      send(res, 403, { error: "Acesso restrito a administradores." });
      return;
    }
    send(res, 200, db.listOrders());
    return;
  }

  if (method === "POST" && path === "/api/admin/products") {
    if (!user) {
      send(res, 401, { error: "Autenticação necessária." });
      return;
    }
    if (user.role !== "admin") {
      send(res, 403, { error: "Acesso restrito a administradores." });
      return;
    }
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const stock = Number(body.stock);
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      send(res, 400, { error: "Informe nome, preço e estoque válidos." });
      return;
    }
    const product = db.addProduct({
      id: `p-${Date.now().toString(36)}`,
      name,
      description: String(body.description || "").trim(),
      category: String(body.category || "Geral").trim(),
      price,
      stock,
      active: true,
    });
    send(res, 201, serializeProduct(product));
    return;
  }

  if (method === "GET" && path === "/api/admin/products") {
    if (!user) {
      send(res, 401, { error: "Autenticação necessária." });
      return;
    }
    if (user.role !== "admin") {
      send(res, 403, { error: "Acesso restrito a administradores." });
      return;
    }
    send(res, 200, db.listProducts().map(serializeProduct));
    return;
  }

  const adminProductMatch = path.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (method === "PUT" && adminProductMatch) {
    const productId = decodeURIComponent(adminProductMatch[1]);
    const current = db.findProduct(productId);
    if (!current) {
      send(res, 404, { error: "Produto não encontrado." });
      return;
    }
    const patch = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        send(res, 400, { error: "Preço inválido." });
        return;
      }
      patch.price = price;
    }
    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        send(res, 400, { error: "Estoque inválido." });
        return;
      }
      patch.stock = stock;
    }
    const updated = db.updateProduct(productId, patch);
    send(res, 200, serializeProduct(updated));
    return;
  }

  send(res, 404, { error: "Recurso não encontrado." });
}

module.exports = {
  handleApi,
  send,
};
