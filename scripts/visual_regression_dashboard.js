#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
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

async function selectIfPresent(page, selector, value) {
  const element = page.locator(selector);
  if ((await element.count()) === 0) return false;
  await element.selectOption(value);
  return true;
}

async function configureDashboard(page, scenario) {
  await selectIfPresent(page, "#asset", scenario.asset);
  await selectIfPresent(page, "#freq", scenario.frequency);
  await selectIfPresent(page, "#range", scenario.range);
  await selectIfPresent(page, "#priceDisplay", "candles");
  await selectIfPresent(page, "#bollinger", scenario.bands);
  await selectIfPresent(page, "#engagement", "price_sentiment");
  await page.waitForTimeout(600);
}

async function waitForChart(page) {
  await page.waitForSelector("#chart", { timeout: 15000 });
  await page.waitForFunction(() => {
    const chart = document.querySelector("#chart");
    return chart && chart.offsetWidth > 500 && chart.offsetHeight > 400;
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

  if (result.chartWidth < 500 || result.chartHeight < 400) {
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

async function runDrawerCheck(page) {
  const toggle = page.locator("#alertPanelToggle");
  const panel = page.locator("#alertSidePanel");
  if ((await toggle.count()) === 0 || (await panel.count()) === 0) {
    console.log("[SKIP] Drawer controls not present on this route.");
    return;
  }

  const openWidth = (await panel.boundingBox()).width;
  await toggle.click();
  await page.waitForTimeout(400);
  const collapsedWidth = (await panel.boundingBox()).width;
  await toggle.click();
  await page.waitForTimeout(600);
  const reopenedWidth = (await panel.boundingBox()).width;

  if (collapsedWidth >= openWidth - 80) {
    throw new Error(`drawer collapse did not materially reduce width (${openWidth} -> ${collapsedWidth})`);
  }
  if (reopenedWidth < 250) {
    throw new Error(`drawer reopen width is unexpectedly narrow (${reopenedWidth})`);
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });

  const scenarios = [
    {
      name: "member-btc-weekly-1y-combined-overlap",
      path: "/interactive_dashboard_fix24_member_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "contextual",
      expectBandCoverage: true,
    },
    {
      name: "member-link-weekly-1y-combined-overlap",
      path: "/interactive_dashboard_fix24_member_embed.html",
      asset: "LINK",
      frequency: "W",
      range: "1Y",
      bands: "contextual",
      expectBandCoverage: true,
    },
    {
      name: "public-btc-weekly-1y-price-bands",
      path: "/interactive_dashboard_fix24_public_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "price",
      expectBandCoverage: true,
    },
    {
      name: "public-btc-weekly-1y-all-bands",
      path: "/interactive_dashboard_fix24_public_embed.html",
      asset: "BTC",
      frequency: "W",
      range: "1Y",
      bands: "both",
      expectBandCoverage: true,
    },
  ];

  try {
    for (const scenario of scenarios) {
      await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "networkidle" });
      await configureDashboard(page, scenario);
      await waitForChart(page);
      await assertChartBasics(page, scenario);
      if (scenario.name === "member-btc-weekly-1y-combined-overlap") {
        await runDrawerCheck(page);
      }
      const screenshotPath = path.join(screenshotDir, `${scenario.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
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
