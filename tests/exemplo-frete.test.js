"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { quoteLines } = require("../src/domain/pricing");

function quote(unitPrice) {
  return quoteLines({
    lines: [{ productId: "p-exemplo", name: "Item", unitPrice, quantity: 1 }],
    coupon: null,
  });
}

test("subtotal de R$ 100 paga frete", () => {
  const result = quote(100);
  assert.equal(result.ok, true);
  assert.equal(result.shipping, 18.5);
});

test("subtotal de R$ 400 tem frete grátis", () => {
  const result = quote(400);
  assert.equal(result.ok, true);
  assert.equal(result.shipping, 0);
});
