"use strict";

const REFERENCE_INSTANT = "2026-10-07T15:00:00.000Z";

let fixedInstant = null;

function now() {
  return new Date(fixedInstant || Date.now());
}

function setClock(instant) {
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Instante inválido.");
  }
  fixedInstant = parsed.toISOString();
  return fixedInstant;
}

function resetClock() {
  fixedInstant = null;
}

module.exports = {
  REFERENCE_INSTANT,
  now,
  setClock,
  resetClock,
};
