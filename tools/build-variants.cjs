"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const check = process.argv.slice(2).includes("--check");
assert(process.argv.slice(2).every(arg => arg === "--check"), "Usage: node tools/build-variants.cjs [--check]");

// Keep existing discount script paths as copies of the single current 75p implementation.
const aliases = [
  { source: "g1-acq.js", output: "g1-acq-discount.js" },
  { source: "g1-sku-report.js", output: "g1-sku-report-discount.js" }
].map(alias => ({
  output: alias.output,
  content: "/* Generated from " + alias.source + " by tools/build-variants.cjs. */\n" +
    fs.readFileSync(path.join(root, alias.source), "utf8")
}));

for (const alias of aliases) {
  const destination = path.join(root, alias.output);
  if (check) {
    assert(fs.existsSync(destination), alias.output + " is missing; run node tools/build-variants.cjs");
    assert.equal(fs.readFileSync(destination, "utf8"), alias.content,
      alias.output + " is stale; run node tools/build-variants.cjs");
  } else {
    fs.writeFileSync(destination, alias.content);
  }
  console.log((check ? "Verified " : "Generated ") + alias.output);
}
