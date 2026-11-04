"use strict";

const { percentOf } = require("./money");

const AUTO_DISCOUNT_MIN_SUBTOTAL = 200;
const AUTO_DISCOUNT_PERCENT = 10;

function automaticDiscount(subtotal) {
  if (!(Number(subtotal) > AUTO_DISCOUNT_MIN_SUBTOTAL)) {
    return 0;
  }
  return percentOf(subtotal, AUTO_DISCOUNT_PERCENT);
}

module.exports = {
  automaticDiscount,
  AUTO_DISCOUNT_MIN_SUBTOTAL,
  AUTO_DISCOUNT_PERCENT,
};
