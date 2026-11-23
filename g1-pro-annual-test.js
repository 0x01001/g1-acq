/* Google AI Pro annual product test for Shadowrocket. */
"use strict";

(function () {
  var VERSION = "pro-annual-test-v1";
  var SOURCE_PREFIX = "g1.ios.2tb.";
  var TARGET = "g1.2tb.ai.annual";
  var STORE_KEY = "g1.pro.annual.test.v1";
  var url = typeof $request === "object" && $request ? $request.url : "";

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\/ai\?/.test(url)) {
    $done({});
    return;
  }

  var body = typeof $response === "object" && $response ? $response.body : undefined;
  var counts = Object.create(null);
  var hits = 0;
  var out = body;

  if (typeof body === "string") {
    // Match complete tokens first, then select the iOS 2TB family.
    // The actual source IDs are taken from this response, not a guessed list.
    out = body.replace(
      /(^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g,
      function (match, before, id) {
        if (id.indexOf(SOURCE_PREFIX) !== 0 || id.length <= SOURCE_PREFIX.length) {
          return match;
        }
        counts[id] = (counts[id] || 0) + 1;
        hits += 1;
        return before + TARGET;
      }
    );
  }

  var sources = Object.keys(counts).sort().map(function (id) {
    return { id: id, count: counts[id] };
  });
  var record = {
    schemaVersion: 1,
    version: VERSION,
    updatedAt: new Date().toISOString(),
    sourcePrefix: SOURCE_PREFIX,
    target: TARGET,
    hitCount: hits,
    matchedFrom: sources,
    status: typeof body !== "string" ? "non-text" : hits ? "rewritten" : "no-match"
  };

  try {
    if (typeof $persistentStore !== "undefined" &&
        typeof $persistentStore.write === "function") {
      if (!$persistentStore.write(JSON.stringify(record), STORE_KEY)) {
        console.log("[g1-pro-annual-test] local record write failed");
      }
    }
  } catch (error) {
    console.log("[g1-pro-annual-test] local record unavailable");
  }

  console.log("[g1-pro-annual-test] " + VERSION + " target=" + TARGET + " hits=" + hits);
  sources.forEach(function (source) {
    console.log("[g1-pro-annual-test] " + source.id + " -> " + TARGET + " x" + source.count);
  });
  $done(hits ? { body: out } : {});
})();
