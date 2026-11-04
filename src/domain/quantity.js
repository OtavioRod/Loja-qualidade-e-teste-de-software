"use strict";

function validateQuantity(quantity) {
  let value = quantity;
  if (typeof value === "string" && value.trim() !== "") {
    value = Number(value);
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { ok: false, message: "A quantidade deve ser um número inteiro." };
  }

  if (value === 0) {
    return { ok: false, message: "A quantidade não pode ser zero." };
  }

  return { ok: true, quantity: value };
}

module.exports = {
  validateQuantity,
};
