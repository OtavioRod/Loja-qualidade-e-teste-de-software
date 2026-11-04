"use strict";

const { toCents, fromCents } = require("./money");
const { automaticDiscount } = require("./discount");
const { shippingCost } = require("./shipping");
const { validateQuantity } = require("./quantity");
const { evaluateCoupon, couponBenefit } = require("./coupon");

function quoteLines({ lines, coupon = null }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, message: "O carrinho está vazio." };
  }

  const items = [];
  for (const line of lines) {
    const check = validateQuantity(line.quantity);
    if (!check.ok) {
      return { ok: false, message: check.message };
    }

    const unitPrice = Number(line.unitPrice);
    if (!Number.isFinite(unitPrice)) {
      return { ok: false, message: "Preço inválido." };
    }

    const lineTotal = fromCents(toCents(unitPrice) * check.quantity);
    items.push({
      productId: line.productId,
      name: line.name,
      unitPrice: fromCents(toCents(unitPrice)),
      quantity: check.quantity,
      lineTotal,
    });
  }

  const subtotal = fromCents(items.reduce((sum, item) => sum + toCents(item.lineTotal), 0));

  if (coupon) {
    const evaluation = evaluateCoupon(coupon);
    if (!evaluation.ok) {
      return { ok: false, message: evaluation.message };
    }
  }

  const automatic = automaticDiscount(subtotal);
  const fromCoupon = coupon ? couponBenefit(subtotal, coupon) : 0;
  const discount = Math.max(automatic, fromCoupon);
  let benefit = null;
  if (discount > 0) {
    benefit = automatic >= fromCoupon ? "automatico" : "cupom";
  }

  const shipping = shippingCost(subtotal);
  const total = fromCents(toCents(subtotal) - toCents(discount) + toCents(shipping));

  return {
    ok: true,
    items,
    subtotal,
    discount,
    automaticDiscount: automatic,
    couponDiscount: fromCoupon,
    benefit,
    shipping,
    total,
  };
}

module.exports = {
  quoteLines,
};
