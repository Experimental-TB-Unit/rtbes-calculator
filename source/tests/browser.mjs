// Optional UI acceptance test. Set RTBES_PLAYWRIGHT_MODULE / RTBES_CHROMIUM_MODULE
// only when using a preinstalled test runtime. Otherwise install Playwright and
// its browser, then: node tests/browser.mjs /absolute/path/to/RTBES.html
import { createRequire } from "node:module";
import { mkdir, readFile, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.RTBES_PLAYWRIGHT_MODULE || "playwright",
);
const options = { headless: true };
if (process.env.RTBES_CHROMIUM_MODULE) {
  const c = require(process.env.RTBES_CHROMIUM_MODULE);
  options.executablePath =
    process.env.RTBES_CHROMIUM_EXECUTABLE || (await c.executablePath());
  options.args = c.args.filter(
    (a) =>
      ![
        "--disable-web-security",
        "--allow-running-insecure-content",
        "--disable-site-isolation-trials",
      ].includes(a),
  );
}
const browser = await chromium.launch(options);
const folder = resolve("qa/browser");
await mkdir(folder, { recursive: true });
const source = resolve(process.argv[2] || "dist-offline/RTBES.html");
const spaced = resolve(folder, "Extracted release with spaces");
await mkdir(spaced, { recursive: true });
await copyFile(source, resolve(spaced, "RTBES.html"));
const context = await browser.newContext({
  acceptDownloads: true,
  offline: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) requests.push(r.url());
});
page.on("dialog", (d) => d.accept());
try {
  await page.goto(pathToFileURL(resolve(spaced, "RTBES.html")).href);
  await page.getByRole("heading", { name: "RTBES Calculator" }).waitFor();
  assert.match(await page.locator("footer").innerText(), /Incomplete/);
  await page
    .getByRole("button", {
      name: "Mark all remaining findings as absent",
    })
    .click();
  await page.getByLabel("Cavities Right upper lung zone", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Cavities Left upper lung zone", { exact: true }).click();
  await page.getByLabel("Adequate technical quality").check();
  await page.getByLabel("CXR obtained standing").check();
  await page
    .getByLabel("I have completed the professional assessment", {
      exact: false,
    })
    .check();
  await page.getByTestId("activity-score").filter({ hasText: "4" }).waitFor();
  assert.equal((await page.locator("footer").innerText()).includes("Total"), false);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({
    path: resolve(folder, "baseline.png"),
    fullPage: true,
  });
  assert.match(await page.locator("footer").innerText(), /Unsaved changes/);
  await page.getByRole("button", { name: "Save case on this device", exact: true }).click();
  assert.match(await page.locator("footer").innerText(), /Saved on this device/);
  for (const [day, activity] of [
    [10, 2],
    [20, 1],
  ]) {
    await page.getByRole("button", { name: "+ Add follow-up" }).click();
    await page.getByLabel("Elapsed days since baseline").fill(String(day));
    await page
      .getByRole("button", {
        name: "Copy preceding findings as unchanged — then review",
      })
      .click();
    await page
      .getByLabel("Cavities Right upper lung zone status", { exact: true })
      .selectOption("improved");
    await page
      .getByLabel("Cavities Left upper lung zone status", { exact: true })
      .selectOption("improved");
    await page.getByLabel("Adequate technical quality").check();
    await page.getByLabel("CXR obtained standing").check();
    await page
      .getByLabel("I have completed the professional assessment", {
        exact: false,
      })
      .check();
    await page.getByTestId("activity-score").filter({ hasText: String(activity) }).waitFor();
  }
  await page.getByRole("button", { name: "Save case on this device", exact: true }).click();
  await page.screenshot({
    path: resolve(folder, "follow-up.png"),
    fullPage: true,
  });
  const jsonEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download full JSON backup" }).click();
  const json = await jsonEvent;
  await json.saveAs(resolve(folder, "roundtrip.json"));
  const backup = JSON.parse(
    await readFile(resolve(folder, "roundtrip.json"), "utf8"),
  );
  assert.equal(backup.records.length, 1);
  assert.equal(backup.records[0].visits.length, 3);
  assert.equal(
    backup.records[0].history.at(-1).results[2].score.activityScore,
    1,
  );
  const xlsxEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Excel", exact: true }).click();
  const xlsx = await xlsxEvent;
  await xlsx.saveAs(resolve(folder, "roundtrip.xlsx"));
  await page
    .getByLabel("Import JSON or Excel")
    .setInputFiles(resolve(folder, "roundtrip.xlsx"));
  await page
    .getByRole("heading", { name: "Import preview — 1 records" })
    .waitFor();
  assert.equal(
    await page.getByLabel("Replace existing session record").isChecked(),
    false,
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByLabel("Import JSON or Excel")
    .setInputFiles(resolve(folder, "roundtrip.json"));
  await page
    .getByRole("heading", { name: "Import preview — 1 records" })
    .waitFor();
  await page.getByRole("button", { name: "Apply import" }).click();
  await page
    .getByLabel("Import JSON or Excel")
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
  await page
    .getByRole("status")
    .filter({ hasText: "Not an RTBES backup" })
    .waitFor();
  assert.equal(
    await page.getByRole("heading", { name: /Import preview/ }).count(),
    0,
  );
  await page.getByRole("button", { name: "Reload cases from this device" }).click();
  await page
    .getByRole("heading", { name: "Import preview — 1 records" })
    .waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "+ Add follow-up" }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Follow-up 5 ·", exact: true })
      .count(),
    1,
  );
  await page.getByRole("button", { name: "Baseline ✓", exact: true }).click();
  await page
    .getByLabel("Cavities Right upper lung zone status", { exact: true })
    .selectOption("absent");
  await page
    .getByRole("button", { name: "Follow-up 1 ·", exact: true })
    .waitFor();
  for (const [label, width, height] of [
    ["phone-320", 320, 568],
    ["phone-390", 390, 844],
    ["tablet-768", 768, 1024],
    ["tablet-1024", 1024, 768],
    ["desktop-1440", 1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: resolve(folder, `${label}.png`),
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      `horizontal overflow at ${width}px`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Start new case", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Mark all remaining findings as absent",
    })
    .click();
  await page.getByLabel("Adequate technical quality").check();
  await page.getByLabel("CXR obtained standing").check();
  await page
    .getByLabel("I have completed the professional assessment", {
      exact: false,
    })
    .check();
  await page.getByTestId("activity-score").filter({ hasText: "0" }).waitFor();
  await page.getByRole("button", { name: "+ Add follow-up" }).click();
  await page.getByLabel("Elapsed days since baseline").fill("10");
  await page
    .getByRole("button", {
      name: "Mark all remaining findings as absent",
    })
    .click();
  await page
    .getByLabel("Miliary TB Both lungs — global status", { exact: true })
    .selectOption("new");
  await page.getByLabel("Adequate technical quality").check();
  await page.getByLabel("CXR obtained standing").check();
  await page
    .getByLabel("I have completed the professional assessment", {
      exact: false,
    })
    .check();
  await page.getByTestId("activity-score").filter({ hasText: "16" }).waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  const moved=resolve(folder,'Moved application');await mkdir(moved,{recursive:true});await copyFile(source,resolve(moved,'RTBES.html'));
  const fresh=await browser.newContext({offline:true,viewport:{width:1440,height:1000}});const restored=await fresh.newPage();restored.on('pageerror',e=>errors.push(e.message));restored.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await restored.goto(pathToFileURL(resolve(moved,'RTBES.html')).href);
  await restored.getByLabel('Import JSON or Excel').setInputFiles(resolve(folder,'roundtrip.json'));
  await restored.getByRole('heading',{name:'Import preview — 1 records'}).waitFor();await restored.getByRole('button',{name:'Apply import'}).click();
  await restored.getByRole('button',{name:new RegExp(`^${backup.records[0].id} ·`)}).click();
  await restored.getByRole('button',{name:'Follow-up 2 ✓',exact:true}).click();
  await restored.getByTestId('activity-score').filter({hasText:'1'}).waitFor();
  // Both contexts are closed by browser.close() below.
  assert.deepEqual(errors, []);assert.deepEqual(requests, []);
  console.log(
    JSON.stringify(
      {
        browser: await browser.version(),
        platform: process.platform,
        transport: "file://",
        network: "offline",
        folderWithSpaces: true,
        checks: [
          "blank not zero",
          "keyboard quadrants",
          "baseline4",
          "FU2",
          "FU1",
          "JSON history",
          "Excel import/export",
          "duplicate skipped",
          "invalid import",
          "browser persistence",
          "5 follow-ups",
          "review invalidation",
          "responsive widths 320/390/768/1024/1440",
          "new miliary = 16",
          "JSON restoration in fresh profile after moving HTML",
        ],
        pageErrors: errors,
        httpRequests: requests,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
