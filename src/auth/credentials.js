"use strict";

const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${digest}`;
}

function hashPasswordWithSalt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), String(salt), 32, (error, digest) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(`${salt}:${digest.toString("hex")}`);
    });
  });
}

function verifyPassword(password, stored) {
  const [salt, digest] = String(stored || "").split(":");
  if (!salt || !digest) return false;
  const actual = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(digest, "hex");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = {
  hashPassword,
  hashPasswordWithSalt,
  verifyPassword,
  createToken,
};
