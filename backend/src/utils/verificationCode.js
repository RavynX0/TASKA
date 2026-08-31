const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Reuses the same bcrypt hashing Taska already uses for passwords - codes are
// short-lived one-time secrets and must never be stored in plaintext.
const SALT_ROUNDS = 10;
const CODE_LENGTH = 6;

function generateCode() {
  const max = 10 ** CODE_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(CODE_LENGTH, "0");
}

function hashCode(code) {
  return bcrypt.hash(code, SALT_ROUNDS);
}

function compareCode(code, hash) {
  return bcrypt.compare(code, hash);
}

module.exports = { generateCode, hashCode, compareCode, CODE_LENGTH };
