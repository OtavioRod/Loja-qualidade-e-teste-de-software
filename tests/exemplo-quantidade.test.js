"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateQuantity } = require("../src/domain/quantity");
const { hasAvailableStock } = require("../src/domain/stock");

test("quantidade 2 é aceita", () => {
  const result = validateQuantity(2);
  assert.equal(result.ok, true);
  assert.equal(result.quantity, 2);
});

test("quantidade fracionária é recusada", () => {
  assert.equal(validateQuantity(1.5).ok, false);
});

test("quantidade zero é recusada", () => {
  assert.equal(validateQuantity(0).ok, false);
});

test("a última unidade pode ser vendida", () => {
  assert.equal(hasAvailableStock(1, 1), true);
});

test("quantidade acima do estoque não está disponível", () => {
  assert.equal(hasAvailableStock(3, 2), false);
});
