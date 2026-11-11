"use strict";

const { performance } = require("node:perf_hooks");

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const LOAD_STAGES = [5, 10, 20];
const STRESS_STAGES = [10, 20, 40, 60, 10];
const MAX_VIRTUAL_USERS = 60;
const REQUEST_TIMEOUT_MS = 10_000;

function parseOptions(args, env = process.env) {
  const options = {
    scenario: "load",
    baseUrl: env.PERF_BASE_URL || DEFAULT_BASE_URL,
    stageSeconds: Number(env.PERF_STAGE_SECONDS || 5),
    thinkTimeMs: Number(env.PERF_THINK_TIME_MS || 100),
    p95LimitMs: Number(env.PERF_P95_LIMIT_MS || 2000),
    errorRateLimitPercent: Number(env.PERF_ERROR_RATE_LIMIT_PERCENT || 1),
  };
  const allowed = new Set([
    "--scenario",
    "--base-url",
    "--stage-seconds",
    "--think-time-ms",
    "--p95-limit-ms",
    "--error-rate-limit-percent",
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (!allowed.has(option) || !args[index + 1] || args[index + 1].startsWith("--")) {
      throw new Error(`Opção inválida ou sem valor: ${option}`);
    }
    const value = args[index + 1];
    index += 1;
    if (option === "--scenario") options.scenario = value;
    if (option === "--base-url") options.baseUrl = value;
    if (option === "--stage-seconds") options.stageSeconds = Number(value);
    if (option === "--think-time-ms") options.thinkTimeMs = Number(value);
    if (option === "--p95-limit-ms") options.p95LimitMs = Number(value);
    if (option === "--error-rate-limit-percent") {
      options.errorRateLimitPercent = Number(value);
    }
  }

  if (!["load", "stress"].includes(options.scenario)) {
    throw new Error("O cenário deve ser 'load' ou 'stress'.");
  }
  if (!Number.isInteger(options.stageSeconds) || options.stageSeconds < 1 || options.stageSeconds > 60) {
    throw new Error("A duração de cada etapa deve ser um inteiro entre 1 e 60 segundos.");
  }
  if (!Number.isInteger(options.thinkTimeMs) || options.thinkTimeMs < 0 || options.thinkTimeMs > 5000) {
    throw new Error("A pausa entre jornadas deve ser um inteiro entre 0 e 5000 ms.");
  }
  if (!Number.isFinite(options.p95LimitMs) || options.p95LimitMs <= 0) {
    throw new Error("O limite de p95 deve ser um número positivo.");
  }
  if (
    !Number.isFinite(options.errorRateLimitPercent) ||
    options.errorRateLimitPercent <= 0 ||
    options.errorRateLimitPercent > 100
  ) {
    throw new Error("O limite de falhas deve ser maior que 0 e no máximo 100.");
  }
  options.baseUrl = validateLocalBaseUrl(options.baseUrl);
  return options;
}

function validateLocalBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("URL inválida. Use http://127.0.0.1 ou http://localhost.");
  }
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Por segurança, use somente http://127.0.0.1 ou http://localhost, com a porta opcional.");
  }
  return url.origin;
}

function percentile(values, proportion) {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.ceil(proportion * ordered.length) - 1];
}

function meetsQualityCriteria(stage, options) {
  return (
    stage.p95Ms <= options.p95LimitMs &&
    stage.errorRatePercent < options.errorRateLimitPercent
  );
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(baseUrl, path, checkBody, samples, init = {}) {
  const startedAt = performance.now();
  try {
    const response = await fetch(new URL(path, baseUrl), {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await response.json();
    const reason = checkBody(body);
    if (!response.ok || reason) {
      samples.push({
        durationMs: performance.now() - startedAt,
        error: `HTTP ${response.status}${reason ? `: ${reason}` : ""}`,
      });
      return null;
    }
    samples.push({ durationMs: performance.now() - startedAt, error: null });
    return body;
  } catch (error) {
    samples.push({
      durationMs: performance.now() - startedAt,
      error: error.message || String(error),
    });
    return null;
  }
}

async function runJourney(baseUrl, virtualUser, iteration, samples, thinkTimeMs) {
  const catalog = await request(
    baseUrl,
    "/api/products",
    (body) => (!Array.isArray(body) || body.length === 0 ? "catálogo vazio ou inválido" : ""),
    samples,
  );
  if (!catalog) return;

  const profile = iteration % 10;
  if (profile < 6) return;
  if (thinkTimeMs > 0) await sleep(thinkTimeMs);
  const product = catalog[(virtualUser + iteration) % catalog.length];
  if (!product || !product.id) {
    samples.push({ durationMs: 0, error: "produto sem identificador no catálogo" });
    return;
  }

  const detail = await request(
    baseUrl,
    `/api/products/${encodeURIComponent(product.id)}`,
    (body) => (!body || body.id !== product.id ? "detalhe do produto inválido" : ""),
    samples,
  );
  if (!detail || profile < 9) return;

  if (thinkTimeMs > 0) await sleep(thinkTimeMs);
  await request(
    baseUrl,
    "/api/cart/quote",
    (body) => (!body || body.ok !== true ? "cotação inválida" : ""),
    samples,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] }),
    },
  );
}

async function preflight(baseUrl) {
  const response = await fetch(new URL("/api/products", baseUrl), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`A loja respondeu HTTP ${response.status} em /api/products.`);
  }
  const products = await response.json();
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("A API /api/products não retornou um catálogo válido.");
  }
}

function summarizeStage(users, samples, elapsedMs) {
  const latencies = samples.map((sample) => sample.durationMs);
  const errors = samples.filter((sample) => sample.error);
  return {
    users,
    elapsedSeconds: elapsedMs / 1000,
    requests: samples.length,
    p50Ms: percentile(latencies, 0.5),
    p95Ms: percentile(latencies, 0.95),
    requestsPerSecond: elapsedMs > 0 ? samples.length / (elapsedMs / 1000) : 0,
    failures: errors.length,
    errorRatePercent: samples.length > 0 ? (errors.length / samples.length) * 100 : 100,
    sampleErrors: [...new Set(errors.map((sample) => sample.error))].slice(0, 3),
  };
}

async function runStage(baseUrl, users, durationMs, thinkTimeMs) {
  const samples = [];
  const startedAt = Date.now();
  const deadline = startedAt + durationMs;

  await Promise.all(
    Array.from({ length: users }, async (_, virtualUser) => {
      let iteration = 0;
      while (Date.now() < deadline) {
        await runJourney(baseUrl, virtualUser, iteration, samples, thinkTimeMs);
        iteration += 1;
        if (thinkTimeMs > 0 && Date.now() < deadline) await sleep(thinkTimeMs);
      }
    }),
  );

  return summarizeStage(users, samples, Date.now() - startedAt);
}

function printStage(stage, options) {
  const quality = meetsQualityCriteria(stage, options) ? "ATENDE" : "FORA DO CRITÉRIO";
  console.log(
    `${String(stage.users).padStart(2)} VUs | ${stage.elapsedSeconds.toFixed(1)} s | ` +
      `${stage.requests} req | p50 ${stage.p50Ms.toFixed(1)} ms | ` +
      `p95 ${stage.p95Ms.toFixed(1)} ms | ${stage.requestsPerSecond.toFixed(1)} req/s | ` +
      `falhas ${stage.errorRatePercent.toFixed(2)}% | ${quality}`,
  );
  if (stage.sampleErrors.length > 0) {
    console.log(`  Exemplos de falha: ${stage.sampleErrors.join("; ")}`);
  }
}

async function run(options) {
  const stages = options.scenario === "load" ? LOAD_STAGES : STRESS_STAGES;
  const results = [];
  console.log(`Cenário: ${options.scenario}; destino local: ${options.baseUrl}`);
  console.log(`Etapas de ${options.stageSeconds}s; pausa entre jornadas: ${options.thinkTimeMs}ms`);
  console.log("Usuários | Duração | Requisições | p50 | p95 | Vazão | Falhas | Critério");

  await preflight(options.baseUrl);
  for (const users of stages) {
    console.log(`Iniciando etapa com ${users} usuários virtuais...`);
    const result = await runStage(
      options.baseUrl,
      users,
      options.stageSeconds * 1000,
      options.thinkTimeMs,
    );
    results.push(result);
    printStage(result, options);
  }

  if (options.scenario === "load") {
    return results.every((result) => meetsQualityCriteria(result, options)) ? 0 : 1;
  }

  const recovery = results[results.length - 1];
  const baseline = results[0];
  const recoveryP95Limit = Math.max(options.p95LimitMs, baseline.p95Ms * 1.5);
  const recovered =
    recovery.p95Ms <= recoveryP95Limit &&
    recovery.errorRatePercent < options.errorRateLimitPercent;
  console.log(
    `Recuperação: ${recovered ? "ATENDE" : "NÃO ATENDE"} ` +
      `(p95 ${recovery.p95Ms.toFixed(1)} ms; limite ${recoveryP95Limit.toFixed(1)} ms; ` +
      `falhas ${recovery.errorRatePercent.toFixed(2)}%).`,
  );
  return recovered ? 0 : 1;
}

if (require.main === module) {
  try {
    const options = parseOptions(process.argv.slice(2));
    run(options)
      .then((exitCode) => {
        process.exitCode = exitCode;
      })
      .catch((error) => {
        console.error(`Teste de desempenho não concluído: ${error.message || error}`);
        process.exitCode = 1;
      });
  } catch (error) {
    console.error(error.message || error);
    console.error("Exemplo: npm run test:load -- --stage-seconds 10");
    process.exitCode = 1;
  }
}

module.exports = {
  LOAD_STAGES,
  STRESS_STAGES,
  meetsQualityCriteria,
  parseOptions,
  percentile,
  validateLocalBaseUrl,
};
