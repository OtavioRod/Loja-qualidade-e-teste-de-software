"use strict";

const { toCents, fromCents } = require("./money");

function totalsForOrder(quote) {
  const subtotal = Number(quote.subtotal);
  const discount = Number(quote.discount);
  const shipping = Number(quote.shipping);
  return {
    subtotal,
    discount,
    shipping,
    total: fromCents(toCents(subtotal) + toCents(shipping)),
  };
}

module.exports = {
  totalsForOrder,
};
