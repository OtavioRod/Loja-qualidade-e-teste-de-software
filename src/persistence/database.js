"use strict";

const fs = require("fs");

function openDatabase(filePath) {
  const state = readFile(filePath);

  function readFile(target) {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  }

  function persist() {
    const onDisk = readFile(filePath);
    const next = {
      users: state.users,
      products: state.products,
      coupons: state.coupons,
      sessions: state.sessions,
      orders: onDisk.orders,
    };
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
  }

  function publicUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  return {
    listProducts() {
      return state.products.map((product) => ({ ...product }));
    },

    findProduct(productId) {
      const product = state.products.find((item) => item.id === productId);
      return product ? { ...product } : null;
    },

    updateProduct(productId, patch) {
      const product = state.products.find((item) => item.id === productId);
      if (!product) return null;
      if (patch.name !== undefined) product.name = String(patch.name).trim();
      if (patch.price !== undefined) product.price = Number(patch.price);
      if (patch.stock !== undefined) product.stock = Number(patch.stock);
      if (patch.description !== undefined) product.description = String(patch.description);
      if (patch.category !== undefined) product.category = String(patch.category);
      persist();
      return { ...product };
    },

    addProduct(product) {
      state.products.push(product);
      persist();
      return { ...product };
    },

    listCoupons() {
      return state.coupons.map((coupon) => ({ ...coupon }));
    },

    findCoupon(code) {
      const normalized = String(code || "").trim().toLowerCase();
      const coupon = state.coupons.find((item) => item.code.toLowerCase() === normalized);
      return coupon ? { ...coupon } : null;
    },

    listUsers() {
      return state.users.map((user) => ({ ...user }));
    },

    findUserByEmail(email) {
      const normalized = String(email || "").trim().toLowerCase();
      return state.users.find((user) => user.email === normalized) || null;
    },

    findUserById(userId) {
      return state.users.find((user) => user.id === userId) || null;
    },

    addUser(user) {
      state.users.push(user);
      persist();
      return publicUser(user);
    },

    createSession(userId) {
      const { createToken } = require("../auth/credentials");
      const session = {
        token: createToken(),
        userId,
        createdAt: new Date().toISOString(),
      };
      state.sessions.push(session);
      persist();
      return session;
    },

    findSession(token) {
      return state.sessions.find((session) => session.token === token) || null;
    },

    deleteSession(token) {
      state.sessions = state.sessions.filter((session) => session.token !== token);
      persist();
    },

    addOrder(order) {
      state.orders.push(order);
    },

    listOrders() {
      return readFile(filePath).orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({ ...item })),
        address: { ...order.address },
      }));
    },

    findOrder(orderId) {
      return this.listOrders().find((order) => order.id === orderId) || null;
    },

    nextOrderId() {
      const ids = [...state.orders, ...this.listOrders()].map((order) => order.id);
      let max = 1000;
      for (const id of ids) {
        const value = Number(String(id).replace(/\D/g, ""));
        if (Number.isFinite(value) && value > max) max = value;
      }
      return `ped-${max + 1}`;
    },

    publicUser,
  };
}

module.exports = {
  openDatabase,
};
