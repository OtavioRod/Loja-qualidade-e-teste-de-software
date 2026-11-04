"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const testsDir = path.join(__dirname, "..", "tests");
const files = fs
  .readdirSync(testsDir)
  .filter((name) => name.endsWith(".test.js"))
  .map((name) => path.join("tests", name));

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
