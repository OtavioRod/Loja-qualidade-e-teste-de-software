"use strict";

const FIELDS = ["street", "number", "district", "city", "state", "zip"];

function normalizeAddress(input) {
  const source = input && typeof input === "object" ? input : {};
  const address = {};
  for (const field of FIELDS) {
    address[field] = String(source[field] ?? "").trim();
  }
  return { ok: true, address };
}

module.exports = {
  normalizeAddress,
  FIELDS,
};
