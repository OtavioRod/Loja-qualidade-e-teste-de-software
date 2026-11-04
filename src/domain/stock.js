"use strict";

function hasAvailableStock(quantity, stock) {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= Number(stock);
}

module.exports = {
  hasAvailableStock,
};
