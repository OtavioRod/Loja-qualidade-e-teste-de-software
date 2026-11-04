"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { quoteLines } = require("../src/domain/pricing");

test("cupom e desconto automático não se acumulam", () => {
  const quote = quoteLines({
    lines: [{ productId: "p-exemplo", name: "Kit", unitPrice: 250, quantity: 1 }],
    coupon: {
      code: "BEMVINDO",
      type: "fixed",
      value: 30,
      expiresAt: "2027-12-31",
      active: true,
    },
  });

  assert.equal(quote.ok, true);
  assert.equal(quote.automaticDiscount, 25);
  assert.equal(quote.couponDiscount, 30);
  assert.equal(quote.discount, 30);
});
