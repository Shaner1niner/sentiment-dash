#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const screenshotDir = path.join(repoRoot, "docs", "qa", "dashboard-visual-regression-latest");
const required = process.env.VISUAL_REQUIRED === "1";

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (firstError) {
    try {
      return require("playwright-core");
    } catch (secondError) {
      const bundledNodeModules = path.join(
        os.homedir(),
        ".cache",
        "codex-runtimes",
        "codex-primary-runtime",
        "dependencies",
        "node",
        "node_modules"
      );
      for (const packageName of ["playwright", "playwright-core"]) {
        try {
          return require(path.join(bundledNodeModules, packageName));
        } catch (_) {}
      }
      return null;
    }
  }
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".csv") return "text/csv; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const requested = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = path.resolve(repoRoot, `.${requested}`);

    if (!filePath.startsWith(repoRoot)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function configureDashboard(page, scenario) {
  await page.waitForSelector("#freq", { timeout: 15000 });
  await page.waitForFunction(() => {
    const asset = document.querySelector("#asset");
    const freq = document.querySelector("#freq");
    return asset && freq && asset.options && asset.options.length > 0;
  }, null, { timeout: 30000 });
  await page.evaluate((updates) => {
    updates.forEach(([selector, value]) => {
      const select = document.querySelector(selector);
      if (!select) return;
      const hasOption = Array.from(select.options || []).some((option) => option.value === value);
      if (!hasOption) return;
      select.value = value;
    });
    updates.forEach(([selector]) => {
      const select = document.querySelector(selector);
      if (!select) return;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, [
    ["#asset", scenario.asset],
    ["#freq", scenario.frequency],
    ["#range", scenario.range],
    ["#priceDisplay", "candles"],
    ["#bollinger", scenario.bands],
    ["#engagement", "context"],
    ["#osc", "both"],
  ]);
  await page.waitForTimeout(600);
}

async function waitForChart(page) {
  await page.waitForSelector("#chart", { timeout: 15000 });
  await page.waitForFunction(() => {
    const chart = document.querySelector("#chart");
    const minWidth = Math.min(500, window.innerWidth - 32);
    return chart && chart.offsetWidth >= minWidth && chart.offsetHeight > 360;
  }, null, { timeout: 15000 });
}

async function assertChartBasics(page, scenario) {
  const result = await page.evaluate((expectBandCoverage) => {
    const chart = document.querySelector("#chart");
    const gd = chart && chart.data ? chart : chart && chart.querySelector(".js-plotly-plot");
    const traces = gd && gd.data ? gd.data : [];
    const chartBox = chart ? chart.getBoundingClientRect() : { width: 0, height: 0 };
    const priceBarCount = traces.filter((trace) => trace.type === "bar" && trace.name === "Price").length;
    const bandTraces = traces.filter((trace) => {
      const name = String(trace.name || "");
      const yaxis = trace.yaxis || "y";
      return yaxis === "y" && /(Band|Overlap|Envelope)/i.test(name);
    });
    const firstFiniteBandIndex = bandTraces
      .map((trace) => {
        const values = Array.isArray(trace.y) ? trace.y : [];
        return values.findIndex((value) => Number.isFinite(Number(value)));
      })
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];

    return {
      chartWidth: chartBox.width,
      chartHeight: chartBox.height,
      priceBarCount,
      bandTraceCount: bandTraces.length,
      firstFiniteBandIndex,
      expectBandCoverage,
    };
  }, scenario.expectBandCoverage);

  const minChartWidth = scenario.viewport && scenario.viewport.width < 700 ? 320 : 500;
  const minChartHeight = scenario.viewport && scenario.viewport.width < 700 ? 360 : 400;
  if (result.chartWidth < minChartWidth || result.chartHeight < minChartHeight) {
    throw new Error(`${scenario.name}: chart rendered too small (${result.chartWidth}x${result.chartHeight})`);
  }

  if (scenario.frequency === "W" && result.priceBarCount < 1) {
    throw new Error(`${scenario.name}: expected weekly custom price bar trace`);
  }

  if (scenario.expectBandCoverage) {
    if (result.bandTraceCount < 1) {
      throw new Error(`${scenario.name}: expected at least one band or overlap trace`);
    }
    if (!Number.isFinite(result.firstFiniteBandIndex) || result.firstFiniteBandIndex > 6) {
      throw new Error(`${scenario.name}: band coverage starts too late in the visible window`);
    }
  }
}

async function assertMarketTapeUniverse(page, scenario) {
  const text = await page.evaluate(() => {
    const el = document.querySelector(".marketTapeUniverse");
    return el ? el.textContent || "" : "";
  });
  if (!text) {
    throw new Error(`${scenario.name}: expected Market Tape universe text`);
  }
  if (!/Showing \d+ of \d+/i.test(text) || !/global across \d+ screener assets/i.test(text)) {
    throw new Error(`${scenario.name}: Market Tape universe text is incomplete (${text})`);
  }
}

async function runDrawerCheck(page) {
  const hasDrawer = await page.evaluate(() => {
    return !!document.querySelector("#alertPanelToggle") && !!document.querySelector("#alertSidePanel");
  });
  if (!hasDrawer) {
    console.log("[SKIP] Drawer controls not present on this route.");
    return;
  }

  await page.evaluate(() => {
    const panel = document.querySelector("#alertSidePanel");
    const width = panel ? panel.getBoundingClientRect().width : 0;
    if (width <= 0) throw new Error("drawer panel has no rendered width");
  });
}

async function assertViewportLayout(page, scenario) {
  const issues = await page.evaluate(() => {
    const selectors = [
      ".control",
      ".setaSelectButton",
      ".marketTapeCard",
      ".marketTapePill",
      ".marketTapeUniverse",
      ".metricBadge",
      ".pill",
      "#chart",
      "#alertSidePanel",
    ];
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    };
    const problems = [];
    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      if (!visible(el)) return;
      const box = el.getBoundingClientRect();
      if (box.right > window.innerWidth + 2 || box.left < -2) {
        problems.push(`${el.className || el.id || el.tagName} horizontal overflow ${Math.round(box.left)}-${Math.round(box.right)} / ${window.innerWidth}`);
      }
      if ((el.scrollWidth - el.clientWidth) > 2 && !["chart", "alertSidePanel"].includes(el.id)) {
        problems.push(`${el.className || el.id || el.tagName} text overflow ${el.scrollWidth}/${el.clientWidth}`);
      }
    });
    return problems.slice(0, 10);
  });
  if (issues.length) {
    throw new Error(`${scenario.name}: viewport layout issues: ${issues.join("; ")}`);
  }
}

async function run() {
  const playwright = loadPlaywright();
  if (!playwright) {
    console.log("[SKIP] Playwright is not installed. Install playwright or playwright-core to capture dashboard screenshots.");
    process.exit(required ? 2 : 0);
  }

  fs.rmSync(screenshotDir, { recursive: true, force: true });
  fs.mkdirSync(screenshotDir, { recursive: true });

  let server;
  let baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    const local = await startStaticServer();
    server = local.server;
    baseUrl = local.baseUrl;
  }
  baseUrl = baseUrl.replace(/\/$/, "");

  const browser = await playwright.chromium.launch();

  const scenarios = [
    {
      name: "member-btc-weekly-1y-combined-overlap",
      path: "/interactive_dashboard_fix24_member_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "contextual",
      expectBandCoverage: true,
      viewport: { width: 1440, height: 1200 },
    },
    {
      name: "member-link-weekly-1y-combined-overlap",
      path: "/interactive_dashboard_fix24_member_embed.html",
      asset: "LINK",
      frequency: "W",
      range: "1Y",
      bands: "contextual",
      expectBandCoverage: true,
      viewport: { width: 1440, height: 1200 },
    },
    {
      name: "public-btc-weekly-1y-price-bands",
      path: "/interactive_dashboard_fix24_public_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "price",
      expectBandCoverage: true,
      viewport: { width: 1440, height: 1200 },
    },
    {
      name: "public-btc-weekly-1y-all-bands",
      path: "/interactive_dashboard_fix24_public_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "both",
      expectBandCoverage: true,
      viewport: { width: 1440, height: 1200 },
    },
    {
      name: "mobile-member-btc-weekly-1y-combined-overlap",
      path: "/interactive_dashboard_fix24_member_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "contextual",
      expectBandCoverage: true,
      viewport: { width: 390, height: 1200 },
    },
    {
      name: "mobile-public-btc-weekly-1y-all-bands",
      path: "/interactive_dashboard_fix24_public_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "both",
      expectBandCoverage: true,
      viewport: { width: 390, height: 1200 },
    },
  ];

  try {
    for (const scenario of scenarios) {
      const page = await browser.newPage({
        viewport: scenario.viewport || { width: 1440, height: 1200 },
        deviceScaleFactor: 1,
        isMobile: !!(scenario.viewport && scenario.viewport.width < 700),
      });
      await page.addInitScript(() => {
        window.localStorage && window.localStorage.removeItem("setaAlertEventsPanelCollapsed");
      });
      console.log(`[RUN] ${scenario.name}`);
      await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "commit", timeout: 15000 });
      await configureDashboard(page, scenario);
      console.log(`[READY] ${scenario.name} controls`);
      await waitForChart(page);
      console.log(`[READY] ${scenario.name} chart`);
      await assertChartBasics(page, scenario);
      console.log(`[READY] ${scenario.name} checks`);
      await assertMarketTapeUniverse(page, scenario);
      console.log(`[READY] ${scenario.name} universe`);
      await assertViewportLayout(page, scenario);
      console.log(`[READY] ${scenario.name} viewport`);
      if (scenario.name === "member-btc-weekly-1y-combined-overlap") {
        await runDrawerCheck(page);
        console.log(`[READY] ${scenario.name} drawer`);
      }
      const screenshotPath = path.join(screenshotDir, `${scenario.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: !!(scenario.viewport && scenario.viewport.width < 700) });
      await page.close();
      console.log(`[OK] ${scenario.name}`);
    }
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

run().catch((error) => {
  console.error(`[FAIL] ${error.message}`);
  process.exit(1);
});
