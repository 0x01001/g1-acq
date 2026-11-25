"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const check = process.argv.slice(2).includes("--check");
assert(process.argv.slice(2).every(arg => arg === "--check"), "Usage: node tools/build-variants.cjs [--check]");

function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length, 2, "Expected one variant configuration block");
  return source.replace(before, after);
}

const trialMap = `  var SKU_MAP = {
    "g1.ios.20tb.m.v2": "g1.20tb.1month_eft.acq",
    "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.1month_eft.acq"
  };
  var FALLBACK = {
    "g1.20tb.1month_eft.acq": "g1.20tb.3months_ip_90p.acq",
    "g1.ai.ultra.1month_eft.acq": "g1.ai.ultra.3months_ip_90p.acq"
  };`;
const discountMap = `  var SKU_MAP = {
    "g1.ios.20tb.m.v2": "g1.20tb.3months_ip_90p.acq",
    "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.3months_ip_90p.acq"
  };
  var FALLBACK = {
    "g1.20tb.3months_ip_90p.acq": "g1.20tb.3months_ip_75p.acq",
    "g1.ai.ultra.3months_ip_90p.acq": "g1.ai.ultra.3months_ip_75p.acq"
  };`;

const variants = [
  {
    source: "g1-acq.js",
    output: "g1-acq-discount.js",
    replacements: [
      ['  var VERSION = "g1-acq-v7.7-trial";', '  var VERSION = "g1-acq-v7.7-discount";'],
      ['  var MODE = "trial";', '  var MODE = "discount";'],
      [trialMap, discountMap]
    ]
  },
  {
    source: "g1-sku-report.js",
    output: "g1-sku-report-discount.js",
    replacements: [
      ['  var CONFIGURED_MODE = "trial";', '  var CONFIGURED_MODE = "discount";'],
      ['  var COLLECTOR_VERSION = "g1-acq-v7.7-trial";', '  var COLLECTOR_VERSION = "g1-acq-v7.7-discount";']
    ]
  }
].map(variant => {
  let source = fs.readFileSync(path.join(root, variant.source), "utf8");
  for (const [before, after] of variant.replacements) source = replaceOnce(source, before, after);
  return {
    output: variant.output,
    content: "/* Generated from " + variant.source + " by tools/build-variants.cjs. */\n" + source
  };
});

for (const variant of variants) {
  const destination = path.join(root, variant.output);
  if (check) {
    assert(fs.existsSync(destination), variant.output + " is missing; run node tools/build-variants.cjs");
    assert.equal(fs.readFileSync(destination, "utf8"), variant.content,
      variant.output + " is stale; run node tools/build-variants.cjs");
  } else {
    fs.writeFileSync(destination, variant.content);
  }
  console.log((check ? "Verified " : "Generated ") + variant.output);
}
