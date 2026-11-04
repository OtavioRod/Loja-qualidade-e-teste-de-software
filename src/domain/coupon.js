
"use strict";

const { now } = require("./clock");

const { toCents, fromCents, percentOf } = require("./money");

function evaluateCoupon(coupon) {
  if (!coupon || coupon.active === false) {
    return { ok: false, message: "Cupom inválido." };
  }

  if (coupon.expiresAt) {
    const expiration = new Date(coupon.expiresAt).getTime();

    if (
      Number.isNaN(expiration) ||
      expiration < require("./clock").now().getTime()
    ) {
      return { ok: false, message: "Cupom vencido ou inválido." };
    }
  }
  if (!Number.isFinite(coupon.value) || coupon.value < 0) {
    return { ok: false, message: "Valor do cupom inválido." };
  }
  return { ok: true };
}

function couponBenefit(subtotal, coupon) {
  if (!coupon) return 0;

  if (coupon.type === "percent") {
    return percentOf(subtotal, coupon.value);
  }

  if (coupon.type === "fixed") {
    const benefitCents = toCents(coupon.value);
    const subtotalCents = toCents(subtotal);
    return fromCents(Math.min(benefitCents, subtotalCents));
  }

  return 0;
}

module.exports = {
  evaluateCoupon,
  couponBenefit,
};
