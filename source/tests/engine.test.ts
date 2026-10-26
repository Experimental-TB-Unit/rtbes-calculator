import test from "node:test";
import assert from "node:assert/strict";
import {
  fields,
  LEGACY_TOTAL_SCORING_VERSION,
  newCase,
  newVisit,
  SCORING_VERSION,
} from "../model.ts";
import type { Visit, Status } from "../model.ts";
import {
  availableStatuses,
  calculateSeries,
  validateRecord,
} from "../services/engine.ts";
import {
  makeBackup,
  parseBackup,
  mergeRecords,
  makeWorkbook,
  readWorkbook,
} from "../services/transfer.ts";
import ExcelJS from "exceljs";

function baseline(): Visit {
  const v = newVisit(true);
  v.quality = v.standing = v.reviewed = true;
  for (const f of fields) v.observations[f.id] = { value: 0, status: "absent" };
  return v;
}
function fu(previous: Visit, day = 10): Visit {
  const v = newVisit();
  v.day = day;
  v.quality = v.standing = v.reviewed = true;
  for (const f of fields) {
    const o = previous.observations[f.id];
    v.observations[f.id] = {
      value: o.value,
      status:
        o.value === 0 ? "absent" : "unchanged",
    };
  }
  return v;
}
function set(v: Visit, id: string, value: number, status: Status = "present") {
  v.observations[id] = { value, status };
}
test("Blank form has no score", () =>
  assert.equal(calculateSeries([newVisit(true)])[0].score, null));
test("Explicit reviewed absent baseline is zero", () =>
  assert.deepEqual(calculateSeries([baseline()])[0].score, {
    activityScore: 0,
    nonActivityScore: 0,
    items: Object.fromEntries(fields.map((f) => [f.id, 0])),
  }));
test("Cavities in 2 quadrants score 4", () => {
  const v = baseline();
  set(v, "cavities.RS", 2);
  set(v, "cavities.LS", 2);
  assert.equal(calculateSeries([v])[0].score?.activityScore, 4);
});
test("Every active parenchymal item scores 2 in each affected quadrant", () => {
  for (const item of ["cavities", "infiltrates", "dissemination"]) {
    const v = baseline();
    for (const q of ["RS", "RI", "LS", "LI"])
      set(v, `${item}.${q}`, 2);
    assert.equal(
      calculateSeries([v])[0].score?.activityScore,
      8,
      item,
    );
  }
});
test("Every chronic parenchymal item scores 2 per quadrant", () => {
  for (const item of [
    "scars",
    "granulomas",
    "atelectasis",
    "bronchiectasis",
    "destruction",
  ]) {
    const v = baseline();
    for (const q of ["RS", "RI", "LS", "LI"])
      set(v, `${item}.${q}`, 2);
    assert.equal(
      calculateSeries([v])[0].score?.nonActivityScore,
      8,
      item,
    );
  }
});
test("Activity and non-activity remain two separate scores without a combined total", () => {
  const v = baseline();
  set(v, "cavities.RS", 2);
  set(v, "scars.RS", 2);
  const score = calculateSeries([v])[0].score!;
  assert.equal(score.activityScore, 2);
  assert.equal(score.nonActivityScore, 2);
  assert.equal("totalScore" in score, false);
});
test("Miliary is 16 globally", () => {
  const v = baseline();
  set(v, "miliary", 16);
  assert.equal(calculateSeries([v])[0].score?.activityScore, 16);
});
test("Mediastinal and hilar are separate, with own bilateral multiplier", () => {
  const v = baseline();
  set(v, "mediastinalLN", 2);
  set(v, "hilarLN", 2);
  set(v, "mediastinalCalcLN", 4);
  set(v, "hilarCalcLN", 2);
  const s = calculateSeries([v])[0].score!;
  assert.equal(s.activityScore, 4);
  assert.equal(s.nonActivityScore, 6);
});
test("Bilateral massive effusion = 6", () => {
  const v = baseline();
  set(v, "effusion.right", 3);
  set(v, "effusion.left", 3);
  assert.equal(calculateSeries([v])[0].score?.activityScore, 6);
});
test("Every pleural-effusion type is scored independently on either side", () => {
  for (const side of ["right", "left"]) {
    for (const value of [1, 2, 3]) {
      const v = baseline();
      set(v, `effusion.${side}`, value);
      assert.equal(
        calculateSeries([v])[0].score?.activityScore,
        value,
        `${side} ${value}`,
      );
    }
  }
});
test("Pleural-effusion follow-up uses evolution, not the new appearance class", () => {
  const a = baseline();
  set(a, "effusion.right", 1);
  const b = fu(a);
  set(b, "effusion.right", 3, "worsened");
  assert.equal(calculateSeries([a, b])[1].score?.items["effusion.right"], 2);

  const c = fu(b, 20);
  set(c, "effusion.right", 1, "improved");
  assert.equal(calculateSeries([a, b, c])[2].score?.items["effusion.right"], 1);
});
test("All non-miliary active units apply unchanged, /2, ×2 and resolved", () => {
  const activeFields = fields.filter(
    (f) => f.group === "activity" && f.policy === "active",
  );
  for (const field of activeFields) {
    const initial = field.allowed.find((x) => x > 0)!;
    const a = baseline();
    set(a, field.id, initial);
    for (const [status, expected] of [
      ["unchanged", initial],
      ["improved", initial / 2],
      ["worsened", initial * 2],
      ["resolved", 0],
    ] as const) {
      const b = fu(a);
      set(b, field.id, status === "resolved" ? 0 : initial, status);
      assert.equal(
        calculateSeries([a, b])[1].score?.items[field.id],
        expected,
        `${field.id} ${status}`,
      );
    }
  }
});
test("Successive improvements use preceding score without rounding", () => {
  const a = baseline();
  set(a, "cavities.RS", 2);
  const b = fu(a);
  set(b, "cavities.RS", 2, "improved");
  const c = fu(b, 20);
  set(c, "cavities.RS", 2, "improved");
  assert.deepEqual(
    calculateSeries([a, b, c]).map((x) => x.score?.activityScore),
    [2, 1, 0.5],
  );
});
test("Mixed quadrant evolution keeps each quadrant independent", () => {
  const a = baseline();
  set(a, "cavities.RS", 2);
  set(a, "cavities.LS", 2);
  const b = fu(a);
  set(b, "cavities.RS", 2, "improved");
  set(b, "cavities.LS", 2, "worsened");
  set(b, "cavities.LI", 2, "new");
  assert.equal(calculateSeries([a, b])[1].score?.activityScore, 7);
});
test("Active new lesion = 2; resolution = 0; reappearance = 2", () => {
  const a = baseline();
  const b = fu(a);
  set(b, "cavities.RS", 2, "new");
  const c = fu(b, 20);
  set(c, "cavities.RS", 0, "resolved");
  const d = fu(c, 30);
  set(d, "cavities.RS", 2, "new");
  assert.deepEqual(
    calculateSeries([a, b, c, d]).map((x) => x.score?.activityScore),
    [0, 2, 0, 2],
  );
});
test("Miliary improvement and resolution = 16 → 8 → 0", () => {
  const a = baseline();
  set(a, "miliary", 16);
  const b = fu(a);
  set(b, "miliary", 16, "improved");
  const c = fu(b, 20);
  set(c, "miliary", 0, "resolved");
  assert.deepEqual(
    calculateSeries([a, b, c]).map((x) => x.score?.activityScore),
    [16, 8, 0],
  );
});
test("New miliary = 16; post-improvement worsening returns to 16; no score above 16", () => {
  const a = baseline();
  const b = fu(a);
  set(b, "miliary", 16, "new");
  assert.equal(calculateSeries([a, b])[1].score?.activityScore, 16);

  set(a, "miliary", 16);
  set(b, "miliary", 16, "improved");
  const c = fu(b, 20);
  set(c, "miliary", 16, "worsened");
  assert.deepEqual(
    calculateSeries([a, b, c]).map((x) => x.score?.activityScore),
    [16, 8, 16],
  );

  const d = fu(c, 30);
  set(d, "miliary", 16, "worsened");
  assert.equal(calculateSeries([a, b, c, d])[3].score, null);
});
test("Chronically affected parenchyma cannot improve or resolve", () => {
  const allQuadrants = baseline();
  ["RS", "RI", "LS", "LI"].forEach((q) =>
    set(allQuadrants, `atelectasis.${q}`, 2),
  );
  assert.equal(calculateSeries([allQuadrants])[0].score?.nonActivityScore, 8);
  for (const status of ["improved", "resolved"] as Status[]) {
    const a = baseline();
    set(a, "atelectasis.RS", 2);
    const b = fu(a);
    set(b, "atelectasis.RS", status === "resolved" ? 0 : 2, status);
    assert.equal(calculateSeries([a, b])[1].score, null);
  }
});
test("New chronic lesion and chronic worsening", () => {
  const a = baseline();
  const b = fu(a);
  set(b, "scars.RS", 2, "new");
  const c = fu(b, 20);
  set(c, "scars.RS", 2, "worsened");
  assert.deepEqual(
    calculateSeries([a, b, c]).map((x) => x.score?.nonActivityScore),
    [0, 2, 4],
  );
});
test("Every chronic parenchymal unit permits new/unchanged/worsened only", () => {
  for (const field of fields.filter((f) => f.policy === "chronic")) {
    const a = baseline();
    const newlyPresent = fu(a);
    set(newlyPresent, field.id, 2, "new");
    assert.equal(
      calculateSeries([a, newlyPresent])[1].score?.items[field.id],
      2,
      `${field.id} new`,
    );

    const present = baseline();
    set(present, field.id, 2);
    for (const [status, expected] of [
      ["unchanged", 2],
      ["worsened", 4],
    ] as const) {
      const next = fu(present);
      set(next, field.id, 2, status);
      assert.equal(
        calculateSeries([present, next])[1].score?.items[field.id],
        expected,
        `${field.id} ${status}`,
      );
    }
    for (const status of ["improved", "resolved"] as const) {
      const next = fu(present);
      set(next, field.id, status === "resolved" ? 0 : 2, status);
      assert.equal(
        calculateSeries([present, next])[1].score,
        null,
        `${field.id} rejects ${status}`,
      );
    }
  }
});
test("SOP calcified LN improvement remains separate from chronic parenchyma", () => {
  const a = baseline();
  set(a, "mediastinalCalcLN", 4);
  const b = fu(a);
  set(b, "mediastinalCalcLN", 4, "improved");
  assert.equal(calculateSeries([a, b])[1].score?.nonActivityScore, 2);
});
test("Both calcified-LN items allow unchanged, /2 and ×2 but not resolution", () => {
  for (const id of ["mediastinalCalcLN", "hilarCalcLN"]) {
    const a = baseline();
    set(a, id, 4);
    for (const [status, expected] of [
      ["unchanged", 4],
      ["improved", 2],
      ["worsened", 8],
    ] as const) {
      const b = fu(a);
      set(b, id, 4, status);
      assert.equal(
        calculateSeries([a, b])[1].score?.items[id],
        expected,
        `${id} ${status}`,
      );
    }
    const resolved = fu(a);
    set(resolved, id, 0, "resolved");
    assert.equal(calculateSeries([a, resolved])[1].score, null);
  }
});
test("Pleural thickening and calcification are independent findings", () => {
  const a = baseline();
  set(a, "pleuralThickening.right", 2);
  set(a, "pleuralThickening.left", 2);
  set(a, "pleuralCalcification.right", 2);
  assert.equal(calculateSeries([a])[0].score?.nonActivityScore, 6);
  const b = fu(a);
  set(b, "pleuralThickening.right", 2, "improved");
  set(b, "pleuralCalcification.left", 2, "new");
  // 1 improved right thickening + 2 unchanged left thickening +
  // 2 unchanged right calcification + 2 new left calcification.
  assert.equal(calculateSeries([a, b])[1].score?.nonActivityScore, 7);
});
test("Every chronic pleural side uses unchanged, improvement /2 and worsening ×2", () => {
  for (const id of [
    "pleuralThickening.right",
    "pleuralThickening.left",
    "pleuralCalcification.right",
    "pleuralCalcification.left",
  ]) {
    const a = baseline();
    set(a, id, 2);
    for (const [status, expected] of [
      ["unchanged", 2],
      ["improved", 1],
      ["worsened", 4],
    ] as const) {
      const next = fu(a);
      set(next, id, 2, status);
      assert.equal(
        calculateSeries([a, next])[1].score?.items[id],
        expected,
        `${id} ${status}`,
      );
    }
    const resolved = fu(a);
    set(resolved, id, 0, "resolved");
    assert.equal(
      calculateSeries([a, resolved])[1].score,
      null,
      `${id} rejects resolved`,
    );
  }
});
test("One unassessed finding blocks a completed score rather than becoming zero", () => {
  const v = baseline();
  v.observations["infiltrates.LI"] = { value: null, status: "unreviewed" };
  const result = calculateSeries([v])[0];
  assert.equal(result.score, null);
  assert.ok(result.errors.some((x) => x.includes("Infiltrates")));
});
test("Incompatible state/status does not yield scores", () => {
  const a = baseline();
  set(a, "cavities.RS", 2);
  const b = fu(a);
  set(b, "cavities.RS", 0, "unchanged");
  assert.equal(calculateSeries([a, b])[1].score, null);
});
test("Invalid quality, standing, dates or predecessor prevent valid scores", () => {
  for (const key of ["quality", "standing"] as const) {
    const a = baseline();
    a[key] = false;
    assert.equal(calculateSeries([a, fu(a)])[1].score, null);
  }
  const a = baseline();
  const b = fu(a, 0);
  assert.equal(calculateSeries([a, b])[1].score, null);
});
test("More than 3 follow-ups work", () => {
  const v = [baseline()];
  for (let i = 1; i <= 8; i++) v.push(fu(v.at(-1)!, i));
  assert.equal(calculateSeries(v).filter((x) => x.score).length, 9);
});
test("Missing and unexpected fields including names are rejected", () => {
  const r = newCase();
  validateRecord(r);
  assert.throws(() => validateRecord({ ...r, name: "forbidden" }));
  const q = structuredClone(r);
  delete q.visits[0].observations["cavities.RS"];
  assert.throws(() => validateRecord(q));
});
test("Full JSON round trip preserves observations, revisions and exact results", () => {
  const r = newCase();
  r.visits = [baseline()];
  r.history = [
    {
      at: new Date().toISOString(),
      scoringVersion: SCORING_VERSION,
      observations: structuredClone(r.visits),
      results: calculateSeries(r.visits),
    },
  ];
  assert.deepEqual(parseBackup(JSON.stringify(makeBackup([r]))).records, [r]);
});
test("Ambiguous combined-pleura legacy schema is rejected, not silently converted", () => {
  const r = newCase();
  r.visits = [baseline()];
  const backup = makeBackup([r]);
  backup.schemaVersion = 1;
  backup.scoringVersion = LEGACY_TOTAL_SCORING_VERSION;
  assert.throws(() => parseBackup(JSON.stringify(backup)));
});
test("Invalid JSON import leaves existing data intact", () => {
  const r = newCase();
  const before = JSON.stringify([r]);
  for (const b of [
    "{}",
    "not json",
    JSON.stringify({ ...makeBackup([r]), schemaVersion: 99 }),
  ])
    assert.throws(() => parseBackup(b));
  assert.equal(JSON.stringify([r]), before);
});
test("Duplicate code skipped by default; explicit replacement required", () => {
  const a = newCase();
  const b = structuredClone(a);
  b.age = 40;
  assert.equal(mergeRecords([a], [b])[0].age, null);
  assert.equal(mergeRecords([a], [b], new Set([a.id]))[0].age, 40);
  assert.equal(a.age, null);
});
test("Repeated case IDs inside a backup rejected before mutation", () => {
  const r = newCase();
  assert.throws(() => parseBackup(JSON.stringify(makeBackup([r, r]))));
});
test("Excel round trip produces identical current observations and scores", async () => {
  const r = newCase();
  r.visits = [baseline()];
  set(r.visits[0], "cavities.RS", 2);
  r.visits.push(fu(r.visits[0]));
  set(r.visits[1], "cavities.RS", 2, "improved");
  const bytes = await makeWorkbook([r]);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(bytes);
  const resultHeaders = (book.getWorksheet("Results")!.getRow(1).values as unknown[])
    .slice(1);
  assert.deepEqual(resultHeaders, [
    "case_id",
    "visit_index",
    "day",
    "activity",
    "non_activity",
    "status",
    "app_version",
    "scoring_version",
  ]);
  const rs = await readWorkbook(bytes);
  assert.deepEqual(
    rs[0].visits.map((v) => v.observations),
    r.visits.map((v) => v.observations),
  );
  assert.deepEqual(calculateSeries(rs[0].visits), calculateSeries(r.visits));
});
test("Excel formula, unknown column and missing row are rejected", async () => {
  for (const kind of ["formula", "column", "row"]) {
    const r = newCase();
    r.visits = [baseline()];
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await makeWorkbook([r]));
    const sheet = book.getWorksheet("Observations")!;
    if (kind === "formula")
      sheet.getCell("K2").value = { formula: "1+1", result: 2 };
    if (kind === "column") sheet.getCell("M1").value = "name";
    if (kind === "row") sheet.spliceRows(2, 1);
    await assert.rejects(
      readWorkbook((await book.xlsx.writeBuffer()) as unknown as ArrayBuffer),
    );
  }
});
test("Excel duplicate rows and inconsistent metadata rejected", async () => {
  for (const kind of ["duplicate", "metadata"]) {
    const r = newCase();
    r.visits = [baseline()];
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await makeWorkbook([r]));
    const sheet = book.getWorksheet("Observations")!;
    if (kind === "duplicate") sheet.addRow(sheet.getRow(2).values);
    else sheet.getCell("C3").value = 50;
    await assert.rejects(
      readWorkbook((await book.xlsx.writeBuffer()) as unknown as ArrayBuffer),
    );
  }
});
