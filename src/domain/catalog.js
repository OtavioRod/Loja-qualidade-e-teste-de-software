"use strict";

function isListedInCatalog(product) {
  return Boolean(product) && product.active !== false;
}

module.exports = {
  isListedInCatalog,
};
