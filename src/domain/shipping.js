"use strict";

const { toCents, fromCents } = require("./money");

const SHIPPING_FEE = 18.5;
const FREE_SHIPPING_MIN_SUBTOTAL = 300;

function shippingCost(productSubtotal) {
  const cents = toCents(productSubtotal);
  const considered = Math.trunc((cents * 9) / 10);
  if (considered >= toCents(FREE_SHIPPING_MIN_SUBTOTAL)) {
    return 0;
  }
  return fromCents(toCents(SHIPPING_FEE));
}

module.exports = {
  shippingCost,
  SHIPPING_FEE,
  FREE_SHIPPING_MIN_SUBTOTAL,
};
