"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { openDatabase } = require("./src/persistence/database");
const { handleApi, send } = require("./src/routes/api");
const { seedDatabase, assertDidacticPath } = require("./scripts/dataset");

const publicDir = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function databaseFile() {
  return process.env.DB_PATH || path.join(__dirname, "data", "db.json");
}

async function ensureDatabase() {
  const file = databaseFile();
  if (!fs.existsSync(file)) {
    assertDidacticPath(file);
    await seedDatabase(file);
  }
  return openDatabase(file);
}

function serveStatic(res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(publicDir, requested));
  const relative = path.relative(publicDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    send(res, 403, { error: "Acesso negado." });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, 404, { error: "Página não encontrada." });
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": content.length,
      "Cache-Control": "no-store",
    });
    res.end(content);
  });
}

function createServer(db) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, db, url);
        return;
      }
      serveStatic(res, url.pathname);
    } catch (error) {
      if (res.headersSent) return;
      const status = error.status || 500;
      if (status === 500) console.error(error);
      send(res, status, { error: status === 500 ? "Falha inesperada." : error.message });
    }
  });
}

async function start(port = Number(process.env.PORT || 3000)) {
  const db = await ensureDatabase();
  const server = createServer(db);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

if (require.main === module) {
  start()
    .then((server) => {
      const address = server.address();
      console.log(`Loja Aurora em http://127.0.0.1:${address.port}`);
    })
    .catch((error) => {
      if (error.code === "EADDRINUSE") {
        console.error("A porta 3000 já está em uso. Feche o outro processo ou defina a variável PORT.");
      } else {
        console.error(error);
      }
      process.exit(1);
    });
}

module.exports = {
  createServer,
  start,
};
