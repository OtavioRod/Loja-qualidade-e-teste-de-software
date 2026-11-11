"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  LOAD_STAGES,
  STRESS_STAGES,
  meetsQualityCriteria,
  parseOptions,
  percentile,
  validateLocalBaseUrl,
} = require("../scripts/performance");

test("roteiros de carga e estresse incluem redução para observar recuperação", () => {
  assert.deepEqual(LOAD_STAGES, [5, 10, 20]);
  assert.deepEqual(STRESS_STAGES, [10, 20, 40, 60, 10]);
});

test("aceita somente o endereço local da loja", () => {
  assert.equal(validateLocalBaseUrl("http://127.0.0.1:3001"), "http://127.0.0.1:3001");
  assert.equal(validateLocalBaseUrl("http://localhost:3000"), "http://localhost:3000");
  assert.throws(() => validateLocalBaseUrl("https://127.0.0.1:3000"), /somente http/);
  assert.throws(() => validateLocalBaseUrl("http://example.com"), /somente http/);
  assert.throws(() => validateLocalBaseUrl("http://127.0.0.1:3000/api"), /somente http/);
});

test("valida limites para duração e pausa de cada jornada", () => {
  assert.equal(parseOptions(["--stage-seconds", "10"]).stageSeconds, 10);
  assert.equal(parseOptions(["--think-time-ms", "0"]).thinkTimeMs, 0);
  assert.throws(() => parseOptions(["--stage-seconds", "61"]), /entre 1 e 60/);
  assert.throws(() => parseOptions(["--think-time-ms", "5001"]), /entre 0 e 5000/);
  assert.throws(() => parseOptions(["--scenario", "checkout"]), /load.*stress/);
});

test("calcula percentis pela posição de menor valor que cobre a amostra", () => {
  assert.equal(percentile([40, 10, 30, 20], 0.5), 20);
  assert.equal(percentile([40, 10, 30, 20], 0.95), 40);
  assert.equal(percentile([], 0.95), 0);
});

test("aplica p95 máximo e taxa de falhas estritamente menor que o limite", () => {
  const options = { p95LimitMs: 2000, errorRateLimitPercent: 1 };
  assert.equal(meetsQualityCriteria({ p95Ms: 2000, errorRatePercent: 0 }, options), true);
  assert.equal(meetsQualityCriteria({ p95Ms: 2001, errorRatePercent: 0 }, options), false);
  assert.equal(meetsQualityCriteria({ p95Ms: 500, errorRatePercent: 1 }, options), false);
});
