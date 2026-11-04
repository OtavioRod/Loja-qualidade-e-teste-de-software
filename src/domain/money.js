"use strict";

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function fromCents(cents) {
  return cents / 100;
}

function percentOf(amount, percent) {
  const cents = toCents(amount);
  const resultCents = Math.trunc((cents * Number(percent)) / 100);
  return fromCents(resultCents);
}

module.exports = {
  toCents,
  fromCents,
  percentOf,
};
