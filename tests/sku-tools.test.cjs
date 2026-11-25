"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test: nodeTest } = require("node:test");

const root = path.resolve(__dirname, "..");
const TARGET = "g1.2tb.ai.12months_ip_90p";
const LEGACY_TARGET = "g1.2tb.ai.annual";
const SCAN_KEY = "g1.sku.scan.v1";
const TEST_KEY = "g1.pro.annual.test.v1";
const REPORT = "https://one.google.com/g1-sku-report";
// Fixture source IDs test the matching contract; they are not store catalog evidence.
const SOURCE = "g1.ios.2tb.fixture_monthly";
const OTHER_SOURCE = "g1.ios.2tb.fixture_annual";
const TWENTY = "g1.ios.20tb.m.v2";
const THIRTY = "g1.ios.30tb.ai.pro.m";
// Expected offers are explicit fixtures, independent of the scripts and builder.
const VARIANTS = [
  {
    mode: "trial", script: "g1-acq.js", report: "g1-sku-report.js",
    version: "g1-acq-v7.7-trial", label: "Ultra 1个月免费试用优先", fallbackName: "90p",
    twentyTarget: "g1.20tb.1month_eft.acq", thirtyTarget: "g1.ai.ultra.1month_eft.acq",
    twentyFallback: "g1.20tb.3months_ip_90p.acq", thirtyFallback: "g1.ai.ultra.3months_ip_90p.acq",
    ignoredOffers: ["g1.20tb.3months_ip_75p.acq", "g1.ai.ultra.3months_ip_75p.acq"]
  },
  {
    mode: "discount", script: "g1-acq-discount.js", report: "g1-sku-report-discount.js",
    version: "g1-acq-v7.7-discount", label: "Ultra 三个月一折优先", fallbackName: "75p",
    twentyTarget: "g1.20tb.3months_ip_90p.acq", thirtyTarget: "g1.ai.ultra.3months_ip_90p.acq",
    twentyFallback: "g1.20tb.3months_ip_75p.acq", thirtyFallback: "g1.ai.ultra.3months_ip_75p.acq",
    ignoredOffers: ["g1.20tb.1month_eft.acq", "g1.ai.ultra.1month_eft.acq"]
  }
];
const LEGACY_TWENTY_FALLBACK = "g1.20tb.3months_ip_75p.acq";
const LEGACY_THIRTY_FALLBACK = "g1.ai.ultra.3months_ip_75p.acq";
const source = Object.fromEntries(
  ["g1-acq.js", "g1-acq-discount.js", "g1-sku-scan.js", "g1-sku-report.js", "g1-sku-report-discount.js"].map(name =>
    [name, fs.readFileSync(path.join(root, name), "utf8")])
);

function run(name, options = {}) {
  const storage = options.storage || new Map();
  const calls = [];
  const logs = [];
  const reads = [];
  const writes = [];
  const context = {
    $request: {
      url: options.url || "https://one.google.com/ai?fixture=1",
      headers: { Cookie: "cookie-secret", Authorization: "auth-secret" }
    },
    $response: { body: options.body, headers: { "x-private": "response-secret" } },
    $done: payload => calls.push(JSON.parse(JSON.stringify(payload))),
    console: { log: value => logs.push(String(value)) }
  };
  if (options.storageAvailable !== false) {
    context.$persistentStore = {
      read(key) {
        if (options.storageThrows) throw new Error("fixture storage failure");
        reads.push(key);
        return storage.get(key) || null;
      },
      write(value, key) {
        if (options.storageThrows) throw new Error("fixture storage failure");
        writes.push(key);
        if (options.storageWriteFails) return false;
        storage.set(key, value);
        return true;
      }
    };
  }
  vm.runInNewContext(source[name], context, { timeout: 2000, filename: name });
  assert.equal(calls.length, 1, "$done must be called once");
  return { payload: calls[0], storage, logs, reads, writes };
}

function get(storage, key) {
  return JSON.parse(storage.get(key));
}

function assertModeText(html, label, expected) {
  const visible = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
  assert.match(visible, new RegExp(label + "\\s*[：:]\\s*" + expected));
}

// Run the original response, persistence and report contracts through both entries.
for (const variant of VARIANTS) {
  const test = (name, fn) => nodeTest(variant.mode + ": " + name, fn);
  const TWENTY_TARGET = variant.twentyTarget;
  const THIRTY_TARGET = variant.thirtyTarget;
  const TWENTY_FALLBACK = variant.twentyFallback;
  const THIRTY_FALLBACK = variant.thirtyFallback;

  test("combined module maps 2TB, 20TB and 30TB while preserving unrelated full tokens", () => {
    const untouched = [
      "g1.ios.12tb.fixture", TWENTY + ".extra", THIRTY + ".extra",
      "g1.ios.2tbx.fixture", "prefix" + SOURCE, "x." + SOURCE,
      "person@" + SOURCE, "g1.2tb", TARGET
    ];
    const values = [SOURCE, OTHER_SOURCE, SOURCE, TWENTY, THIRTY, ...untouched];
    const result = run(variant.script, { body: JSON.stringify(values) });
    assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TARGET, TARGET, TWENTY_TARGET, THIRTY_TARGET, ...untouched]);
    const record = get(result.storage, TEST_KEY);
    assert.equal(record.hitCount, 5);
    assert.equal(record.annualHitCount, 3);
    assert.equal(record.status, "rewritten");
    assert.equal(record.version, variant.version);
    assert.deepEqual(record.matchedFrom, [
      { id: TWENTY, to: TWENTY_TARGET, count: 1, fallback: false },
      { id: OTHER_SOURCE, to: TARGET, count: 1, fallback: false },
      { id: SOURCE, to: TARGET, count: 2, fallback: false },
      { id: THIRTY, to: THIRTY_TARGET, count: 1, fallback: false }
    ]);
  });

  test("empty responses or responses with no configured sources pass through", () => {
    for (const body of ["", "g1.ios.100gb.m", "g1.ios.20tb.other", "g1.ios.30tb.other"]) {
      const result = run(variant.script, { body });
      assert.deepEqual(result.payload, {});
      assert.equal(get(result.storage, TEST_KEY).status, "no-match");
    }
    for (const body of [undefined, null, 123, {}]) {
      const result = run(variant.script, { body });
      assert.deepEqual(result.payload, {});
      assert.equal(get(result.storage, TEST_KEY).status, "non-text");
    }
  });

  const offerCases = (target, backup) => [
    { name: "neither", offers: [], to: target, fallback: false },
    { name: "default", offers: [target], to: target, fallback: false },
    { name: "backup", offers: [backup], to: backup, fallback: true },
    { name: "both", offers: [target, backup], to: target, fallback: false }
  ];
  for (const twenty of offerCases(TWENTY_TARGET, TWENTY_FALLBACK)) {
    for (const thirty of offerCases(THIRTY_TARGET, THIRTY_FALLBACK)) {
      test("independent offers: 20TB=" + twenty.name + ", 30TB=" + thirty.name, () => {
        const observed = [...twenty.offers, ...thirty.offers];
        // Reversing offers catches a first-offer-wins implementation when both exist.
        for (const offers of [observed, [...observed].reverse()]) {
          const body = JSON.stringify([TWENTY, THIRTY, TWENTY, ...offers]);
          const result = run(variant.script, { body });
          assert.deepEqual(JSON.parse(result.payload.body), [twenty.to, thirty.to, twenty.to, ...offers]);
          const record = get(result.storage, TEST_KEY);
          assert.equal(record.schemaVersion, 1);
          assert.equal(record.version, variant.version);
          assert.equal(record.mode, variant.mode);
          assert.equal(record.hitCount, 3);
          assert.equal(record.annualHitCount, 0);
          assert.equal(record.status, "rewritten");
          assert.deepEqual(record.matchedFrom, [
            { id: TWENTY, to: twenty.to, count: 2, fallback: twenty.fallback },
            { id: THIRTY, to: thirty.to, count: 1, fallback: thirty.fallback }
          ]);
          const scan = get(result.storage, SCAN_KEY);
          assert.equal(scan.schemaVersion, 1);
          assert.equal(scan.version, variant.version);
          assert.equal(scan.mode, variant.mode);
          assert.deepEqual(scan.skus.map(row => row.id), [...new Set([TWENTY, THIRTY, ...offers])].sort());
          assert.equal(scan.skus.find(row => row.id === TWENTY).count, 2);
          assert.deepEqual(result.writes, [SCAN_KEY, TEST_KEY]);
          assert.deepEqual([...result.storage.keys()], [SCAN_KEY, TEST_KEY]);
          assert.equal(result.logs.filter(line => line.startsWith("[g1-acq] " + variant.version + " hits=")).length, 1);
          assert(result.logs.includes("[g1-acq] " + variant.version + " hits=3 annualHits=0 mode=" + variant.mode));
          const collectionLogs = result.logs.filter(line => line.startsWith("[g1-acq] " + variant.version + " status="));
          assert.equal(collectionLogs.length, 1);
          assert(collectionLogs[0].includes(" status=new-skus "));
          assert(collectionLogs[0].endsWith(" mode=" + variant.mode));
          assert(result.logs.indexOf(collectionLogs[0]) < result.logs.findIndex(line => line.includes(variant.version + " hits=")));
          for (const [id, expected, count] of [[TWENTY, twenty, 2], [THIRTY, thirty, 1]]) {
            assert(result.logs.includes("[g1-acq] " + id + " -> " + expected.to + " x" + count +
              (expected.fallback ? " fallback=" + expected.to : "")));
          }
        }
      });
    }
  }

  test("offers belonging only to the other mode stay unchanged and never select a fallback", () => {
    const observed = variant.ignoredOffers;
    const result = run(variant.script, { body: JSON.stringify([SOURCE, TWENTY, THIRTY, ...observed]) });
    assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TWENTY_TARGET, THIRTY_TARGET, ...observed]);
    assert(get(result.storage, TEST_KEY).matchedFrom.every(row => row.fallback === false));
  });

  test("fallback uses this response rather than saved offers and preserves price and date fields", () => {
    const storage = new Map();
    run(variant.script, { url: "https://one.google.com/plans", body: JSON.stringify([TWENTY_FALLBACK, THIRTY_FALLBACK]), storage });
    for (const day of ["23", "24"]) {
      const body = {
        product: TWENTY,
        trialStart: "2026-11-" + day,
        regularStart: "2027-02-" + day,
        price: 330,
        regularPrice: 3300
      };
      const result = run(variant.script, { body: JSON.stringify(body), storage });
      assert.deepEqual(JSON.parse(result.payload.body), { ...body, product: TWENTY_TARGET });
      assert.equal(get(storage, TEST_KEY).matchedFrom[0].fallback, false);
    }
    const result = run(variant.script, { body: JSON.stringify([TWENTY, TWENTY_FALLBACK]), storage });
    assert.deepEqual(JSON.parse(result.payload.body), [TWENTY_FALLBACK, TWENTY_FALLBACK]);
    assert(result.logs.some(line => line.includes("fallback=" + TWENTY_FALLBACK)));
    assert(!result.logs.some(line => /fallback=(?:75p|90p)(?:\s|$)/.test(line)));
  });

  test("fallback decisions are independent and the 2TB target stays fixed", () => {
    const body = JSON.stringify([SOURCE, TWENTY, THIRTY, TWENTY_TARGET, TWENTY_FALLBACK, THIRTY_FALLBACK]);
    const result = run(variant.script, { body });
    assert.deepEqual(JSON.parse(result.payload.body).slice(0, 3), [TARGET, TWENTY_TARGET, THIRTY_FALLBACK]);
    const rows = get(result.storage, TEST_KEY).matchedFrom;
    assert.deepEqual(rows.find(row => row.id === SOURCE), { id: SOURCE, to: TARGET, count: 1, fallback: false });
    assert.deepEqual(rows.find(row => row.id === TWENTY), { id: TWENTY, to: TWENTY_TARGET, count: 1, fallback: false });
    assert.deepEqual(rows.find(row => row.id === THIRTY), { id: THIRTY, to: THIRTY_FALLBACK, count: 1, fallback: true });
  });

  test("single module collects other Google pages without changing the last mapping record", () => {
    for (const url of [
      "https://one.google.com/ai", "https://one.google.com/ai/other?x=1",
      "https://one.google.com/plans?x=1"
    ]) {
      const previous = JSON.stringify({ schemaVersion: 1, version: "previous-record", hitCount: 2 });
      const storage = new Map([[TEST_KEY, previous]]);
      const result = run(variant.script, { url, body: SOURCE, storage });
      assert.deepEqual(result.payload, {});
      assert.equal(storage.get(TEST_KEY), previous);
      assert.equal(get(storage, SCAN_KEY).skus[0].id, SOURCE);
    }
    for (const url of [
      "https://one.google.com.evil/ai?x=1", "http://one.google.com/ai?x=1",
      REPORT, REPORT + "?format=json", REPORT + "/", REPORT + "/?format=json"
    ]) {
      const result = run(variant.script, { url, body: SOURCE });
      assert.deepEqual(result.payload, {});
      assert.equal(result.storage.size, 0);
    }
  });

  test("single module saves original candidates before rewriting without recording generated targets", () => {
    const body = JSON.stringify([SOURCE, SOURCE, TWENTY, THIRTY, "com.google.one.fixture"]);
    const result = run(variant.script, { body });
    assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TARGET, TWENTY_TARGET, THIRTY_TARGET, "com.google.one.fixture"]);
    const scan = get(result.storage, SCAN_KEY);
    assert.equal(scan.version, variant.version);
    assert.deepEqual(scan.skus.map(row => row.id), ["com.google.one.fixture", TWENTY, SOURCE, THIRTY]);
    assert.equal(scan.skus.find(row => row.id === SOURCE).count, 2);
    assert.deepEqual(result.writes, [SCAN_KEY, TEST_KEY]);
  });

  test("single-module collection decodes discovery copies and continues mapping when the list is full", () => {
    const escaped = String.raw`g1\u002eios\u002e2tb\u002eescaped`;
    const decoded = run(variant.script, { body: escaped });
    assert.deepEqual(decoded.payload, {});
    assert.equal(get(decoded.storage, SCAN_KEY).skus[0].id, "g1.ios.2tb.escaped");
    const storage = new Map();
    const full = Array.from({ length: 305 }, (_, index) => "g1.fixture." + index).join(" ");
    run(variant.script, { url: "https://one.google.com/plans", body: full, storage });
    const fullEvent = get(storage, SCAN_KEY).recentResponses.at(-1);
    assert.equal(fullEvent.status, "new-skus");
    assert.equal(fullEvent.candidateCount, 305);
    assert.equal(fullEvent.addedCount, 300);
    assert.equal(fullEvent.omittedCount, 5);
    const next = run(variant.script, { body: SOURCE + " g1.fixture.0", storage });
    assert.equal(next.payload.body, TARGET + " g1.fixture.0");
    const scan = get(storage, SCAN_KEY);
    assert.equal(scan.skus.length, 300);
    assert.equal(scan.truncated, true);
    assert.equal(scan.scannedResponses, 2);
    assert.equal(scan.skus.find(row => row.id === "g1.fixture.0").count, 2);
    assert.equal(scan.recentResponses.at(-1).status, "limit-reached");
    assert.equal(scan.recentResponses.at(-1).candidateCount, 2);
    assert.equal(scan.recentResponses.at(-1).addedCount, 0);
    assert.equal(scan.recentResponses.at(-1).omittedCount, 1);
  });

  test("activity distinguishes new IDs, repeated IDs, empty text and nontext responses", () => {
    const storage = new Map();
    const url = "https://one.google.com/plans?token=private-token";
    const body = [SOURCE, SOURCE, OTHER_SOURCE].join(" ");
    run(variant.script, { url, body, storage });
    let scan = get(storage, SCAN_KEY);
    assert.equal(scan.recentResponses[0].status, "new-skus");
    assert.equal(scan.recentResponses[0].candidateCount, 2);
    assert.equal(scan.recentResponses[0].addedCount, 2);
    run(variant.script, { url, body, storage });
    scan = get(storage, SCAN_KEY);
    assert.equal(scan.skus.length, 2);
    assert.equal(scan.skus.find(row => row.id === SOURCE).count, 4);
    assert.equal(scan.scannedResponses, 2);
    assert.equal(scan.matchedResponses, 2);
    assert.equal(scan.recentResponses.at(-1).status, "known-skus");
    assert.equal(scan.recentResponses.at(-1).candidateCount, 2);
    assert.equal(scan.recentResponses.at(-1).addedCount, 0);
    run(variant.script, { url, body: "no product in this response", storage });
    run(variant.script, { url, body: undefined, storage });
    scan = get(storage, SCAN_KEY);
    assert.deepEqual(scan.recentResponses.map(event => event.status), ["new-skus", "known-skus", "no-skus", "non-text"]);
    assert.equal(scan.scannedResponses, 3);
    assert.equal(scan.matchedResponses, 2);
    assert.equal(scan.nonTextResponses, 1);
    assert.equal(scan.skus.length, 2);
    assert.equal(scan.recentResponses.at(-1).bodyType, "non-text");
    assert.equal(scan.recentResponses.at(-1).candidateCount, 0);
    assert.equal(storage.has(TEST_KEY), false, "non-rewrite pages preserve the mapping record");
    assert(!storage.get(SCAN_KEY).includes("private-token"));
    const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.deepEqual(data.scan.recentResponses, scan.recentResponses);
    assert.equal(data.scan.nonTextResponses, 1);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("实际采集脚本：<code>" + variant.version + "</code>"));
    assert(html.includes("编号与已有记录重复"));
    assert(html.includes("正文不是可扫描文本"));
  });

  test("recent activity keeps ten arrivals and redacts URLs, extra fields and malformed events", () => {
    const valid = {
      at: "2099-01-01T00:00:00.000Z", path: "/ai", bodyType: "text", status: "no-skus",
      candidateCount: 0, addedCount: 0, omittedCount: 0, body: "private-history-body"
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify({
      schemaVersion: 1, recentResponses: [valid, { ...valid, path: "/private-secret" }, { ...valid, status: "bad-status" }]
    })]]);
    run(variant.script, { url: "https://one.google.com/plans?secret=1", body: SOURCE, storage });
    let scan = get(storage, SCAN_KEY);
    assert.equal(scan.recentResponses.length, 2);
    assert.equal(scan.recentResponses[0].at, valid.at);
    assert.equal(scan.recentResponses.at(-1).path, "/plans", "last received event stays last even after a clock change");
    const paths = ["/", "/ai/", "/plans/", "/_/GoogleOne/account-secret/data/batchexecute", "/account/private@example.test"];
    const expected = ["/", "/ai", "/plans", "/_/…/data/batchexecute", "[其他 one.google.com 路径]"];
    for (let index = 0; index < 14; index++) {
      run(variant.script, { url: "https://one.google.com" + paths[index % 5] + "?secret=query#private-fragment", body: SOURCE, storage });
    }
    scan = get(storage, SCAN_KEY);
    assert.equal(scan.recentResponses.length, 10);
    assert.deepEqual(scan.recentResponses.map(event => event.path), Array.from({ length: 10 }, (_, index) => expected[(index + 4) % 5]));
    assert(scan.recentResponses.every(event => event.status === "known-skus" && event.addedCount === 0));
    for (const forbidden of ["private-history-body", "private-secret", "account-secret", "private@example.test", "query", "private-fragment", "secret="]) {
      assert(!storage.get(SCAN_KEY).includes(forbidden));
    }
  });

  test("old scan records remain old until an actual response creates a new diagnostic event", () => {
    const old = {
      schemaVersion: 1, version: "g1-acq-v7.1", updatedAt: "2026-11-23T07:40:18.464Z",
      scannedResponses: 5, matchedResponses: 1,
      skus: [{ id: SOURCE, count: 4, lastSeen: "2026-11-23T07:40:06.325Z" }]
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify(old)]]);
    const before = storage.get(SCAN_KEY);
    let data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.scan.version, "g1-acq-v7.1");
    assert.deepEqual(data.scan.recentResponses, []);
    assert.equal(data.scan.scannedResponses, 5);
    assert.equal(storage.get(SCAN_KEY), before);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("旧采集记录；尚未保存本版采集响应记录"));
    run(variant.script, { url: "https://one.google.com/plans", body: SOURCE, storage });
    data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.scan.version, variant.version);
    assert.equal(data.scan.scannedResponses, 6);
    assert.equal(data.scan.matchedResponses, 2);
    assert.equal(data.scan.skus.length, 1);
    assert.equal(data.scan.skus[0].count, 5);
    assert.equal(data.scan.recentResponses.length, 1);
    assert.equal(data.scan.recentResponses[0].status, "known-skus");
    assert.equal(data.scan.recentResponses[0].addedCount, 0);
  });

  test("activity export rejects malformed metadata and excludes untrusted extra fields", () => {
    const event = {
      at: "2026-11-23T07:40:06.325Z", path: "/plans", bodyType: "text", status: "known-skus",
      candidateCount: 2, addedCount: 0, omittedCount: 0, body: "private-body", query: "private-token"
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify({
      schemaVersion: 1, version: variant.version,
      recentResponses: [event, { ...event, at: "<script>private</script>" }, { ...event, status: "constructor" }, { ...event, bodyType: "unknown" }]
    })]]);
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body);
    assert.deepEqual(data.scan.recentResponses, [{
      at: event.at, path: event.path, bodyType: "text", status: "known-skus", candidateCount: 2, addedCount: 0, omittedCount: 0
    }]);
    assert(!result.payload.response.body.includes("private"));
  });

  test("storage errors do not prevent a matched response from completing", () => {
    for (const flags of [{ storageAvailable: false }, { storageThrows: true }, { storageWriteFails: true }]) {
      const result = run(variant.script, { body: SOURCE, ...flags });
      assert.equal(result.payload.body, TARGET);
    }
  });

  test("test records omit cookies, headers and full response data", () => {
    const result = run(variant.script, { body: JSON.stringify({ sku: SOURCE, email: "private@example.test" }) });
    const saved = result.storage.get(TEST_KEY);
    assert(!saved.includes("private@example.test"));
    assert(!saved.includes("secret"));
    assert.deepEqual(result.reads, [SCAN_KEY]);
    assert(!result.storage.get(SCAN_KEY).includes("private@example.test"));
    assert(!result.storage.get(SCAN_KEY).includes("secret"));
  });

  test("report displays captured IDs and test sources without external assets", () => {
    const storage = new Map();
    run("g1-sku-scan.js", { body: SOURCE, storage });
    run(variant.script, { body: SOURCE, storage });
    const { payload } = run(variant.report, { url: REPORT, storage });
    assert.equal(payload.response.status, 200);
    assert.match(payload.response.body, /Google One SKU 本地报告/);
    assert(payload.response.body.includes(SOURCE));
    assert(payload.response.body.includes(TARGET));
    assert(payload.response.body.includes("本机脚本已接管 · v7.7.0"));
    assert.match(payload.response.body, /<button\b[^>]*name=format[^>]*value=json[^>]*>导出 JSON<\/button>/);
    assert(!/<(?:script|img|iframe)\b/i.test(payload.response.body));
    assert.equal(payload.response.headers["Cache-Control"], "no-store");
  });

  test("report export form resolves to a JSON attachment and supports a trailing slash", () => {
    const storage = new Map();
    run(variant.script, { body: SOURCE, storage });
    const html = run(variant.report, { url: REPORT + "/", storage }).payload.response.body;
    const action = html.match(/<form method=get action="([^"]+)"><button type=submit name=format value=json>/);
    assert(action, "the visible export button must submit a GET form");
    const url = new URL(action[1]);
    url.searchParams.set("format", "json");
    assert.equal(url.href, REPORT + "?format=json");
    for (const exportURL of [url.href, REPORT + "/?format=json"]) {
      const result = run(variant.report, { url: exportURL, storage });
      assert.equal(result.payload.response.status, 200);
      assert.equal(result.payload.response.headers["Content-Disposition"], 'attachment; filename="g1-sku-report.json"');
      assert.equal(result.payload.response.headers["X-G1-Report-Version"], "v7.7.0");
      const data = JSON.parse(result.payload.response.body);
      assert.equal(data.reportVersion, "v7.7.0");
      assert.equal(data.configuredTarget, TARGET);
      assert.equal(data.test.target, TARGET);
      assert.equal(data.test.targetOrigin, "user-specified");
      assert.equal(data.scan.skus[0].id, SOURCE);
      assert.equal(data.test.matchedFrom[0].to, TARGET);
      assert(result.logs.some(line => line.includes("[g1-sku-report] v7.7.0 json")));
    }
  });

  test("report exports each actual target and separates annual hits from total hits", () => {
    const storage = new Map();
    run(variant.script, {
      body: JSON.stringify([SOURCE, TWENTY, THIRTY, THIRTY_FALLBACK]), storage
    });
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body).test;
    assert.equal(data.version, variant.version);
    assert.equal(data.hitCount, 3);
    assert.equal(data.annualHitCount, 1);
    assert.equal(data.matchedFrom.find(row => row.id === TWENTY).to, TWENTY_TARGET);
    assert.deepEqual(data.matchedFrom.find(row => row.id === THIRTY), {
      id: THIRTY, count: 1, to: THIRTY_FALLBACK, fallback: true
    });
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("最近一次三档映射"));
    assert(html.includes("其中 2TB：1"));
    assert(html.includes(TWENTY_TARGET));
    assert(html.includes(THIRTY_FALLBACK));
    assert(html.includes(THIRTY_FALLBACK + "</code></td><td>" + variant.fallbackName + "</td>"));
    assert(html.includes(variant.label));
  });

  test("report preserves historical 75p fallbacks and keeps old 90p defaults distinct", () => {
    const previous = {
      schemaVersion: 1, version: "g1-acq-v7.5", target: TARGET, targetOrigin: "user-specified",
      hitCount: 2, annualHitCount: 0, status: "rewritten",
      matchedFrom: [
        { id: TWENTY, to: LEGACY_TWENTY_FALLBACK, count: 1, fallback: true },
        { id: THIRTY, to: "g1.ai.ultra.3months_ip_90p.acq", count: 1, fallback: false }
      ]
    };
    const before = JSON.stringify(previous);
    const storage = new Map([[TEST_KEY, before]]);
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body).test;
    assert.equal(data.version, previous.version);
    assert.deepEqual(data.matchedFrom, previous.matchedFrom);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes(LEGACY_TWENTY_FALLBACK + "</code></td><td>75p</td>"));
    assert(html.includes("g1.ai.ultra.3months_ip_90p.acq</code></td><td>否</td>"));
    assert.equal(storage.get(TEST_KEY), before);
  });

  test("report does not invent a discount for a fallback whose target was not recorded", () => {
    const storage = new Map([[TEST_KEY, JSON.stringify({
      schemaVersion: 1, version: "g1-acq-v7.5", matchedFrom: [{ id: TWENTY, count: 1, fallback: true }]
    })]]);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("<code>未记录</code></td><td>是</td>"));
  });

  test("new report displays existing v1 records with their original 2TB target", () => {
    const storage = new Map([[TEST_KEY, JSON.stringify({
      schemaVersion: 1, version: "pro-annual-test-v1", hitCount: 2, status: "rewritten",
      matchedFrom: [{ id: SOURCE, count: 2 }]
    })]]);
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body).test;
    assert.equal(data.version, "pro-annual-test-v1");
    assert.equal(data.hitCount, 2);
    assert.equal(data.annualHitCount, 2);
    assert.equal(data.target, LEGACY_TARGET);
    assert.equal(data.targetOrigin, "legacy");
    assert.deepEqual(data.matchedFrom, [{ id: SOURCE, count: 2, to: LEGACY_TARGET, fallback: false }]);
    storage.set(TEST_KEY, JSON.stringify({
      schemaVersion: 1, version: "pro-annual-test-v1", hitCount: 0,
      status: "no-match", matchedFrom: []
    }));
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("旧 v1 记录：本次响应未命中 iOS 2TB 前缀"));
  });

  test("report preserves saved v7.1 through v7.5 targets and origins independently of current configuration", () => {
    for (const prior of [
      { version: "g1-acq-v7.1", target: LEGACY_TARGET, origin: "legacy" },
      { version: "g1-acq-v7.2", target: "g1.2tb.ai.annual.3months_ip_90p.acq", origin: "pattern-derived" },
      { version: "g1-acq-v7.3", target: "g1.2tb.ai.annual_ip_90p.acq", origin: "user-specified" },
      { version: "g1-acq-v7.4", target: "g1.2tb.ai.annual_ip_90p.acq", origin: "user-specified" },
      { version: "g1-acq-v7.5", target: TARGET, origin: "user-specified" }
    ]) {
      const record = {
        schemaVersion: 1, version: prior.version, target: prior.target,
        status: "rewritten", hitCount: 9, annualHitCount: 9,
        matchedFrom: [{ id: "g1.ios.2tb.ai.a", to: prior.target, count: 9, fallback: false }]
      };
      if (prior.origin !== "legacy") record.targetOrigin = prior.origin;
      const storage = new Map([[TEST_KEY, JSON.stringify(record)]]);
      const before = storage.get(TEST_KEY);
      const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
      assert.equal(data.configuredTarget, TARGET);
      assert.equal(data.test.version, prior.version);
      assert.equal(data.test.target, prior.target);
      assert.equal(data.test.targetOrigin, prior.origin);
      assert.equal(data.test.matchedFrom[0].to, prior.target);
      assert.equal(storage.get(TEST_KEY), before);
      const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
      assert(html.includes("当前配置的 2TB 候选目标：<code>" + TARGET + "</code>"));
      assert(html.includes("该次记录的 2TB 目标：<code>" + prior.target + "</code>"));
    }
    const empty = JSON.parse(run(variant.report, { url: REPORT + "?format=json" }).payload.response.body);
    assert.equal(empty.configuredTarget, TARGET);
    assert.equal(empty.test.target, "");
    assert.equal(empty.test.targetOrigin, "");
    assert.equal(empty.test.status, "");
  });

  test("JSON export is limited to report fields and escapes untrusted HTML text", () => {
    const storage = new Map([[SCAN_KEY, JSON.stringify({
      schemaVersion: 1, updatedAt: "<script>fixture</script>", scannedResponses: 1,
      secret: "must-not-export", body: "must-not-export",
      skus: [{ id: SOURCE, count: 2, lastSeen: "<img src=x>", secret: "must-not-export" }]
    })]]);
    const jsonResult = run(variant.report, { url: REPORT + "?format=json", storage });
    assert.match(jsonResult.payload.response.headers["Content-Type"], /application\/json/);
    const report = JSON.parse(jsonResult.payload.response.body);
    assert.equal(report.scan.skus[0].id, SOURCE);
    assert(!jsonResult.payload.response.body.includes("must-not-export"));
    const htmlResult = run(variant.report, { url: REPORT, storage });
    assert(!htmlResult.payload.response.body.includes("<script>fixture"));
    assert(htmlResult.payload.response.body.includes("&lt;img src=x&gt;"));
  });

  test("clear action affects only the tool's two storage keys", () => {
    const storage = new Map([
      [SCAN_KEY, JSON.stringify({ schemaVersion: 1, skus: [{ id: SOURCE, count: 1 }] })],
      [TEST_KEY, JSON.stringify({ schemaVersion: 1, hitCount: 1 })],
      ["other-tool", "untouched"]
    ]);
    const result = run(variant.report, { url: REPORT + "?clear=1", storage });
    assert.deepEqual(get(storage, SCAN_KEY), {});
    assert.deepEqual(get(storage, TEST_KEY), {});
    assert.equal(storage.get("other-tool"), "untouched");
    assert.deepEqual(new Set(result.reads), new Set([SCAN_KEY, TEST_KEY]));
  });

  test("report handles unavailable storage and skips other URL paths", () => {
    const unavailable = run(variant.report, { url: REPORT + "?format=json", storageAvailable: false });
    assert.equal(JSON.parse(unavailable.payload.response.body).storageAvailable, false);
    for (const url of ["https://one.google.com/ai?x=1", REPORT + "-other", "https://example.test/g1-sku-report"]) {
      const result = run(variant.report, { url });
      assert.deepEqual(result.payload, {});
      assert.deepEqual(result.reads, []);
    }
  });

  test("saved defaults never suppress a backup found in this response", () => {
    const storage = new Map();
    run(variant.script, {
      url: "https://one.google.com/plans",
      body: JSON.stringify([TWENTY_TARGET, THIRTY_TARGET]), storage
    });
    const result = run(variant.script, {
      body: JSON.stringify([SOURCE, TWENTY, THIRTY, TWENTY_FALLBACK, THIRTY_FALLBACK]), storage
    });
    assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TWENTY_FALLBACK, THIRTY_FALLBACK, TWENTY_FALLBACK, THIRTY_FALLBACK]);
    assert.deepEqual(get(storage, TEST_KEY).matchedFrom, [
      { id: TWENTY, to: TWENTY_FALLBACK, count: 1, fallback: true },
      { id: SOURCE, to: TARGET, count: 1, fallback: false },
      { id: THIRTY, to: THIRTY_FALLBACK, count: 1, fallback: true }
    ]);
    assert(get(storage, SCAN_KEY).skus.some(row => row.id === TWENTY_TARGET));
    assert(get(storage, SCAN_KEY).skus.some(row => row.id === THIRTY_TARGET));
  });

  test("decoding a discovery copy never introduces a fallback into the original body", () => {
    for (const [id, target, backup] of [
      [TWENTY, TWENTY_TARGET, TWENTY_FALLBACK],
      [THIRTY, THIRTY_TARGET, THIRTY_FALLBACK]
    ]) {
      for (const separator of [String.raw`\u002e`, String.raw`\x2e`, "&#46;", "&#x2e;", "&period;"]) {
        const escaped = backup.replaceAll(".", separator);
        const body = id + " " + escaped;
        const result = run(variant.script, { body });
        assert.equal(result.payload.body, target + " " + escaped);
        assert.deepEqual(get(result.storage, TEST_KEY).matchedFrom, [{ id, to: target, count: 1, fallback: false }]);
        assert.deepEqual(get(result.storage, SCAN_KEY).skus.map(row => row.id), [id, backup].sort());
      }
    }
  });

  test("nested price and date fields survive both Ultra backup selections byte for byte", () => {
    const body = JSON.stringify({
      products: [
        { sku: TWENTY, price: 330, regularPrice: 3300, currency: "TWD", trialStart: "2026-11-23", regularStart: "2027-02-23" },
        { sku: THIRTY, price: "490.00", regularPrice: "4900.00", currency: "TWD", trialStart: "2026-11-24", regularStart: "2027-02-24" },
        { sku: SOURCE, price: 65, regularPrice: 650, renewAt: "2027-11-23T00:00:00.000Z" }
      ],
      offers: [TWENTY_FALLBACK, THIRTY_FALLBACK],
      invoice: { total: 885, generatedAt: "2026-11-23T00:00:00.000Z", account: "fixture@example.test" }
    }, null, 2);
    const result = run(variant.script, { body });
    assert.equal(result.payload.body, body.replace(TWENTY, TWENTY_FALLBACK).replace(THIRTY, THIRTY_FALLBACK).replace(SOURCE, TARGET));
    for (const value of result.storage.values()) {
      assert(!value.includes("fixture@example.test"));
      assert(!value.includes("regularPrice"));
      assert(!value.includes("invoice"));
    }
  });

  test("zero-hit and nontext executions retain mode on records and summary logs", () => {
    for (const [body, status, scanStatus] of [["", "no-match", "no-skus"], [undefined, "non-text", "non-text"]]) {
      const result = run(variant.script, { body });
      const scan = get(result.storage, SCAN_KEY);
      const record = get(result.storage, TEST_KEY);
      assert.equal(scan.schemaVersion, 1);
      assert.equal(record.schemaVersion, 1);
      assert.equal(scan.version, variant.version);
      assert.equal(record.version, variant.version);
      assert.equal(scan.mode, variant.mode);
      assert.equal(record.mode, variant.mode);
      assert.equal(record.status, status);
      assert.equal(scan.recentResponses.at(-1).status, scanStatus);
      assert.deepEqual(record.matchedFrom, []);
      assert.deepEqual(result.payload, {});
      assert(result.logs.includes("[g1-acq] " + variant.version + " hits=0 annualHits=0 mode=" + variant.mode));
      assert(result.logs.some(line => line.startsWith("[g1-acq] " + variant.version + " status=" + scanStatus + " ") && line.endsWith(" mode=" + variant.mode)));
    }
  });

  test("switching entries accumulates original SKUs and preserves the previous mapping until a rewrite page arrives", () => {
    const other = VARIANTS.find(entry => entry.mode !== variant.mode);
    const storage = new Map();
    run(variant.script, { body: JSON.stringify([SOURCE, TWENTY]), storage });
    const previousTest = storage.get(TEST_KEY);
    const firstScan = get(storage, SCAN_KEY);
    const collection = run(other.script, {
      url: "https://one.google.com/plans?fixture=2", body: JSON.stringify([SOURCE, THIRTY]), storage
    });
    assert.deepEqual(collection.payload, {});
    assert.deepEqual(collection.writes, [SCAN_KEY]);
    assert.equal(storage.get(TEST_KEY), previousTest);
    const scan = get(storage, SCAN_KEY);
    assert.equal(scan.mode, other.mode);
    assert.equal(scan.version, other.version);
    assert.equal(scan.scannedResponses, 2);
    assert.equal(scan.matchedResponses, 2);
    assert.deepEqual(scan.skus.map(row => [row.id, row.count]), [[TWENTY, 1], [SOURCE, 2], [THIRTY, 1]]);
    assert.deepEqual(scan.recentResponses.slice(0, 1), firstScan.recentResponses);
    assert.equal(scan.recentResponses.at(-1).addedCount, 1);
    for (const reportEntry of VARIANTS) {
      const before = [...storage];
      const data = JSON.parse(run(reportEntry.report, { url: REPORT + "?format=json", storage }).payload.response.body);
      assert.equal(data.configuredMode, reportEntry.mode);
      assert.equal(data.scan.mode, other.mode);
      assert.equal(data.test.mode, variant.mode);
      assert.equal(data.test.version, variant.version);
      assert.deepEqual(data.test.matchedFrom, get(storage, TEST_KEY).matchedFrom);
      const html = run(reportEntry.report, { url: REPORT, storage }).payload.response.body;
      assertModeText(html, "当前报告入口", reportEntry.label);
      assertModeText(html, "实际采集模式", other.label);
      assertModeText(html, "实际映射模式", variant.label);
      assert.deepEqual([...storage], before);
    }
    const mapped = run(other.script, { body: JSON.stringify([OTHER_SOURCE, THIRTY]), storage });
    assert.deepEqual(JSON.parse(mapped.payload.body), [TARGET, other.thirtyTarget]);
    assert.equal(get(storage, TEST_KEY).mode, other.mode);
    assert.equal(get(storage, TEST_KEY).version, other.version);
    const finalScan = get(storage, SCAN_KEY);
    assert.equal(finalScan.schemaVersion, 1);
    assert.equal(finalScan.scannedResponses, 3);
    assert.equal(finalScan.matchedResponses, 3);
    assert.deepEqual(finalScan.skus.map(row => [row.id, row.count]), [[TWENTY, 1], [OTHER_SOURCE, 1], [SOURCE, 2], [THIRTY, 2]]);
    assert.deepEqual(finalScan.recentResponses.slice(0, 2), scan.recentResponses);
    assert.deepEqual([...storage.keys()], [SCAN_KEY, TEST_KEY]);
  });

  test("configuredMode is the report entry while saved scan and test modes remain independent", () => {
    for (const scanEntry of VARIANTS) {
      for (const testEntry of VARIANTS) {
        const scanVersion = VARIANTS.find(entry => entry.mode !== scanEntry.mode).version;
        const testVersion = VARIANTS.find(entry => entry.mode !== testEntry.mode).version;
        const storage = new Map([
          [SCAN_KEY, JSON.stringify({ schemaVersion: 1, version: scanVersion, mode: scanEntry.mode, skus: [{ id: SOURCE, count: 4 }] })],
          [TEST_KEY, JSON.stringify({ schemaVersion: 1, version: testVersion, mode: testEntry.mode, target: TARGET, matchedFrom: [{ id: SOURCE, to: TARGET, count: 4 }] })]
        ]);
        const before = [...storage];
        const result = run(variant.report, { url: REPORT + "?format=json", storage });
        const data = JSON.parse(result.payload.response.body);
        assert.equal(data.schemaVersion, 1);
        assert.equal(data.reportVersion, "v7.7.0");
        assert.equal(data.configuredMode, variant.mode);
        assert.equal(data.configuredTarget, TARGET);
        assert.equal(data.scan.mode, scanEntry.mode);
        assert.equal(data.test.mode, testEntry.mode);
        assert.equal(data.scan.version, scanVersion);
        assert.equal(data.test.version, testVersion);
        assert.deepEqual(result.writes, []);
        const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
        assertModeText(html, "当前报告入口", variant.label);
        assertModeText(html, "实际采集模式", scanEntry.label);
        assertModeText(html, "实际映射模式", testEntry.label);
        assert.deepEqual([...storage], before);
      }
    }
  });

  test("fresh reports leave both stored modes unrecorded rather than inferring the entry", () => {
    const storage = new Map();
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body);
    assert.equal(data.configuredMode, variant.mode);
    assert.equal(data.scan.mode, "");
    assert.equal(data.test.mode, "");
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assertModeText(html, "当前报告入口", variant.label);
    assertModeText(html, "实际采集模式", "未记录");
    assertModeText(html, "实际映射模式", "未记录");
    assert.equal(storage.size, 0);
  });

  test("mode sanitization accepts only the exact saved trial and discount strings", () => {
    const invalidModes = [
      undefined, null, "", "Trial", "DISCOUNT", " trial", "trial ", "discount\n", "discount\u0000",
      "unknown", "constructor", "__proto__", 0, 1, true, false, [], ["trial"], {},
      { mode: "discount" }, "<img src=x onerror=fixture-mode>"
    ];
    const other = VARIANTS.find(entry => entry.mode !== variant.mode);
    for (const invalid of invalidModes) {
      for (const field of ["scan", "test"]) {
        const storage = new Map([
          [SCAN_KEY, JSON.stringify({ schemaVersion: 1, version: variant.version, mode: field === "scan" ? invalid : other.mode })],
          [TEST_KEY, JSON.stringify({ schemaVersion: 1, version: variant.version, mode: field === "test" ? invalid : other.mode })]
        ]);
        const before = [...storage];
        const result = run(variant.report, { url: REPORT + "?format=json", storage });
        const data = JSON.parse(result.payload.response.body);
        assert.equal(data.configuredMode, variant.mode);
        assert.equal(data[field].mode, "", field + " mode=" + JSON.stringify(invalid));
        assert.equal(data[field === "scan" ? "test" : "scan"].mode, other.mode);
        const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
        assertModeText(html, "当前报告入口", variant.label);
        assertModeText(html, "实际采集模式", field === "scan" ? "未记录" : other.label);
        assertModeText(html, "实际映射模式", field === "test" ? "未记录" : other.label);
        assert(!html.includes("fixture-mode"));
        assert(!result.payload.response.body.includes("fixture-mode"));
        assert.deepEqual([...storage], before);
      }
    }
  });

  test("scan version labels distinguish this entry, the other v7.7 entry and older records", () => {
    const other = VARIANTS.find(entry => entry.mode !== variant.mode);
    for (const [version, expected, excluded] of [
      [variant.version, "记录来自本版采集脚本", ["本版另一入口", "旧采集记录"]],
      [other.version, "本版另一入口", ["记录来自本版采集脚本", "旧采集记录"]],
      ["g1-acq-v7.6", "旧采集记录", ["记录来自本版采集脚本", "本版另一入口"]]
    ]) {
      const storage = new Map([[SCAN_KEY, JSON.stringify({ schemaVersion: 1, version, mode: variant.mode })]]);
      const before = [...storage];
      const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
      assert(html.includes("实际采集脚本：<code>" + version + "</code>"));
      assert(html.includes(expected));
      for (const phrase of excluded) assert(!html.includes(phrase));
      const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
      assert.equal(data.scan.version, version);
      assert.equal(data.scan.mode, variant.mode);
      assert.deepEqual([...storage], before);
    }
  });

  test("v7.6 trial records keep their original versions, absent modes and actual 90p fallback", () => {
    const oldScan = {
      schemaVersion: 1, version: "g1-acq-v7.6", scannedResponses: 4, matchedResponses: 3,
      skus: [{ id: SOURCE, count: 4, lastSeen: "2026-11-23T07:40:06.325Z" }]
    };
    const oldTest = {
      schemaVersion: 1, version: "g1-acq-v7.6", target: TARGET, targetOrigin: "user-specified",
      status: "rewritten", hitCount: 2, annualHitCount: 0,
      matchedFrom: [
        { id: TWENTY, to: "g1.20tb.1month_eft.acq", count: 1, fallback: false },
        { id: THIRTY, to: "g1.ai.ultra.3months_ip_90p.acq", count: 1, fallback: true }
      ]
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify(oldScan)], [TEST_KEY, JSON.stringify(oldTest)]]);
    const before = [...storage];
    const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.configuredMode, variant.mode);
    assert.equal(data.scan.version, "g1-acq-v7.6");
    assert.equal(data.test.version, "g1-acq-v7.6");
    assert.equal(data.scan.mode, "");
    assert.equal(data.test.mode, "");
    assert.deepEqual(data.scan.skus, oldScan.skus);
    assert.deepEqual(data.test.matchedFrom, oldTest.matchedFrom);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("旧采集记录"));
    assert(html.includes("g1.20tb.1month_eft.acq</code></td><td>否</td>"));
    assert(html.includes("g1.ai.ultra.3months_ip_90p.acq</code></td><td>90p</td>"));
    assertModeText(html, "当前报告入口", variant.label);
    assertModeText(html, "实际采集模式", "未记录");
    assertModeText(html, "实际映射模式", "未记录");
    assert.deepEqual([...storage], before);
    const collected = run(variant.script, { url: "https://one.google.com/plans", body: SOURCE + " " + OTHER_SOURCE, storage });
    assert.deepEqual(collected.payload, {});
    assert.equal(storage.get(TEST_KEY), before[1][1]);
    const scan = get(storage, SCAN_KEY);
    assert.equal(scan.version, variant.version);
    assert.equal(scan.mode, variant.mode);
    assert.equal(scan.scannedResponses, 5);
    assert.equal(scan.matchedResponses, 4);
    assert.deepEqual(scan.skus.map(row => [row.id, row.count]), [[OTHER_SOURCE, 1], [SOURCE, 5]]);
    const after = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(after.scan.mode, variant.mode);
    assert.equal(after.test.mode, "");
    assert.equal(after.test.version, "g1-acq-v7.6");
    assert.deepEqual(after.test.matchedFrom, oldTest.matchedFrom);
  });

  test("both historical 75p Ultra targets retain their actual fallback labels in either report", () => {
    const rows = [
      { id: TWENTY, to: LEGACY_TWENTY_FALLBACK, count: 1, fallback: true },
      { id: THIRTY, to: LEGACY_THIRTY_FALLBACK, count: 2, fallback: true }
    ];
    const storage = new Map([[TEST_KEY, JSON.stringify({ schemaVersion: 1, version: "g1-acq-v7.5", matchedFrom: rows })]]);
    const before = [...storage];
    const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.test.mode, "");
    assert.equal(data.test.version, "g1-acq-v7.5");
    assert.deepEqual(data.test.matchedFrom, rows);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    for (const row of rows) assert(html.includes(row.to + "</code></td><td>75p</td>"));
    assert.deepEqual([...storage], before);
  });

}

nodeTest("collector discovers IDs and escaped dots while preserving the response", () => {
  const body = JSON.stringify([
    SOURCE, SOURCE, TARGET, "com.google.one.2tb.fixture.iog", "private@example.test"
  ]) + String.raw` "g1\u002eios\u002e2tb\u002eescaped" "g1&#46;2tb&#46;html"`;
  const result = run("g1-sku-scan.js", { body });
  assert.deepEqual(result.payload, {});
  const state = get(result.storage, SCAN_KEY);
  assert.equal(state.scannedResponses, 1);
  assert.equal(state.matchedResponses, 1);
  assert.equal(state.skus.length, 5);
  assert.equal(state.skus.find(row => row.id === SOURCE).count, 2);
  assert(state.skus.some(row => row.id === "g1.ios.2tb.escaped"));
  assert(state.skus.some(row => row.id === "g1.2tb.html"));
  assert(!JSON.stringify(state).includes("private@example.test"));
  assert(!JSON.stringify(state).includes("secret"));
});

nodeTest("collector accumulates prior records and recovers corrupt storage", () => {
  const storage = new Map([[SCAN_KEY, "corrupt JSON"]]);
  run("g1-sku-scan.js", { body: SOURCE, storage });
  run("g1-sku-scan.js", { url: "https://one.google.com/plans", body: SOURCE + " " + TARGET, storage });
  const state = get(storage, SCAN_KEY);
  assert.equal(state.scannedResponses, 2);
  assert.equal(state.skus.length, 2);
  assert.equal(state.skus.find(row => row.id === SOURCE).count, 2);
});

nodeTest("collector bounds stored candidates at 300 and still counts existing IDs", () => {
  const body = Array.from({ length: 305 }, (_, index) => "g1.fixture." + index).join(" ");
  const result = run("g1-sku-scan.js", { body });
  assert.equal(get(result.storage, SCAN_KEY).skus.length, 300);
  assert.equal(get(result.storage, SCAN_KEY).truncated, true);
  run("g1-sku-scan.js", { body: "g1.fixture.0", storage: result.storage });
  assert.equal(get(result.storage, SCAN_KEY).skus.find(row => row.id === "g1.fixture.0").count, 2);
});

nodeTest("collector skips the local report, other domains and nontext bodies", () => {
  for (const options of [
    { url: REPORT, body: SOURCE },
    { url: REPORT + "?format=json", body: SOURCE },
    { url: REPORT + "/", body: SOURCE },
    { url: REPORT + "/?format=json", body: SOURCE },
    { url: "https://one.google.com.evil/ai?x=1", body: SOURCE },
    { body: undefined }, { body: new Uint8Array([1, 2]) }
  ]) {
    const result = run("g1-sku-scan.js", options);
    assert.deepEqual(result.payload, {});
    assert.equal(result.storage.size, 0);
  }
});

nodeTest("collector passes through on storage failure", () => {
  const result = run("g1-sku-scan.js", { body: SOURCE, storageThrows: true });
  assert.deepEqual(result.payload, {});
  assert(result.logs.some(line => line.includes("saved=no")));
});

nodeTest("all five modules pin v7.7.0 and pair each response entry with its own report", () => {
  assert.equal(fs.existsSync(path.join(root, "g1-acq.sgmodule")), false);
  const scriptBase = "https://cdn.jsdelivr.net/gh/crhywun/g1-acq@v7.7.0/";
  const modules = [
    { file: "g1-acq-v7.sgmodule", script: "g1-acq.js", report: "g1-sku-report.js", allPaths: true },
    { file: "g1-pro-annual-test.sgmodule", script: "g1-acq.js", report: "g1-sku-report.js", allPaths: false },
    { file: "g1-sku-scan.sgmodule", script: "g1-sku-scan.js", report: "g1-sku-report.js", allPaths: true },
    { file: "g1-acq-ultra-trial.sgmodule", script: "g1-acq.js", report: "g1-sku-report.js", allPaths: true },
    { file: "g1-acq-ultra-discount.sgmodule", script: "g1-acq-discount.js", report: "g1-sku-report-discount.js", allPaths: true }
  ];
  assert.deepEqual(fs.readdirSync(root).filter(file => file.endsWith(".sgmodule")).sort(), modules.map(entry => entry.file).sort());
  for (const entry of modules) {
    const module = fs.readFileSync(path.join(root, entry.file), "utf8");
    const scripts = module.split("\n").filter(line => line.includes("script-path="));
    assert.equal(scripts.length, 2, entry.file);
    if (entry.file === "g1-acq-v7.sgmodule") assert.match(module, /^#!name=G1 ACQ$/m);
    for (const script of scripts) {
      const url = script.match(/script-path=([^,\s]+)/)[1];
      assert.match(url, /^https:\/\/cdn\.jsdelivr\.net\/gh\/crhywun\/g1-acq@v7\.7\.0\/[a-z0-9.-]+\.js$/);
      assert.equal(url.slice(0, url.lastIndexOf("/") + 1), scriptBase);
      assert(fs.existsSync(path.join(root, url.split("/").at(-1))));
    }
    assert.match(module, /hostname = %APPEND% one\.google\.com/);
    const responseLines = scripts.filter(line => line.includes("type=http-response"));
    const requestLines = scripts.filter(line => line.includes("type=http-request"));
    assert.equal(responseLines.length, 1, entry.file);
    assert.equal(requestLines.length, 1, entry.file);
    const responseLine = responseLines[0];
    const requestLine = requestLines[0];
    assert.equal(responseLine.match(/script-path=([^,\s]+)/)[1], scriptBase + entry.script, entry.file);
    assert.equal(requestLine.match(/script-path=([^,\s]+)/)[1], scriptBase + entry.report, entry.file);
    assert.match(responseLine, /(?:^|,)requires-body=1(?:,|$)/);
    assert.match(responseLine, /(?:^|,)max-size=0(?:,|$)/);
    const pattern = new RegExp(responseLine.match(/pattern=([^,]+)/)[1]);
    assert(pattern.test("https://one.google.com/ai?x=1"), entry.file);
    for (const url of ["https://one.google.com/", "https://one.google.com/plans", "https://one.google.com/ai", "https://one.google.com/ai/other?x=1", "https://one.google.com/_/fixture/data/batchexecute"]) {
      assert.equal(pattern.test(url), entry.allPaths, entry.file + " " + url);
    }
    for (const url of ["https://one.google.com.evil/ai?x=1", "http://one.google.com/ai?x=1", "https://example.test/ai?x=1"]) {
      assert(!pattern.test(url), entry.file + " " + url);
    }
    const reportPattern = new RegExp(requestLine.match(/pattern=([^,]+)/)[1]);
    for (const url of [REPORT, REPORT + "?format=json", REPORT + "/", REPORT + "/?format=json"]) {
      assert(reportPattern.test(url), entry.file + " " + url);
    }
    for (const url of [REPORT + "-other", REPORT + "/other", "https://one.google.com.evil/g1-sku-report", "http://one.google.com/g1-sku-report"]) {
      assert(!reportPattern.test(url), entry.file + " " + url);
    }
  }
});
