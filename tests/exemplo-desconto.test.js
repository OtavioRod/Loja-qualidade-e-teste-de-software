"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { automaticDiscount } = require("../src/domain/discount");

test("subtotal de R$ 250 recebe 10% de desconto automático", () => {
  assert.equal(automaticDiscount(250), 25);
});
