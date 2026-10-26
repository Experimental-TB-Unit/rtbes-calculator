import ExcelJS from "exceljs";
import {
  APP_VERSION,
  COMPATIBLE_SCORING_VERSIONS,
  SCHEMA_VERSION,
  SCORING_VERSION,
  fields,
  newCase,
  newVisit,
} from "../model.ts";
import type { Backup, CaseRecord, Observation } from "../model.ts";
import { calculateSeries, validateRecord } from "./engine.ts";

export function makeBackup(records: CaseRecord[]): Backup {
  records.forEach(validateRecord);
  return {
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    scoringVersion: SCORING_VERSION,
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
    records: structuredClone(records),
  };
}
export function parseBackup(text: string): Backup {
  if (text.length > 25_000_000) throw Error("Backup exceeds 25 MB.");
  const b = JSON.parse(text) as Backup;
  const keys = [
    "schemaVersion",
    "appVersion",
    "scoringVersion",
    "exportedAt",
    "recordCount",
    "records",
  ];
  if (
    !b ||
    typeof b !== "object" ||
    Object.keys(b).some((k) => !keys.includes(k)) ||
    keys.some((k) => !(k in b))
  )
    throw Error("Not an RTBES backup.");
  if (
    b.schemaVersion !== SCHEMA_VERSION ||
    !COMPATIBLE_SCORING_VERSIONS.includes(b.scoringVersion)
  )
    throw Error(
      "Unsupported schema/scoring version. No automatic conversion is applied.",
    );
  if (
    typeof b.appVersion !== "string" ||
    typeof b.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(b.exportedAt)) ||
    !Array.isArray(b.records) ||
    b.records.length > 10000 ||
    b.recordCount !== b.records.length
  )
    throw Error("Invalid backup metadata.");
  const ids = new Set<string>();
  for (const r of b.records) {
    validateRecord(r);
    if (ids.has(r.id)) throw Error("Duplicate case code inside backup.");
    ids.add(r.id);
  }
  return b;
}
export function mergeRecords(
  existing: CaseRecord[],
  incoming: CaseRecord[],
  replaceIds: ReadonlySet<string> = new Set(),
): CaseRecord[] {
  existing.forEach(validateRecord);
  incoming.forEach(validateRecord);
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming)
    if (!map.has(r.id) || replaceIds.has(r.id))
      map.set(r.id, structuredClone(r));
  return [...map.values()];
}
export function download(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const columns = [
  "case_id",
  "visit_index",
  "day",
  "age",
  "sex",
  "quality",
  "standing",
  "reviewed",
  "analyst_code",
  "field",
  "value",
  "status",
];
export async function makeWorkbook(
  records: CaseRecord[],
  template = false,
): Promise<ArrayBuffer> {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Observations");
  sheet.addRow(columns);
  for (const r of records)
    r.visits.forEach((v, index) =>
      fields.forEach((f) => {
        const o = v.observations[f.id];
        sheet.addRow([
          r.id,
          index,
          v.day,
          r.age,
          r.sex,
          Number(v.quality),
          Number(v.standing),
          Number(v.reviewed),
          v.analystCode,
          f.id,
          o.value,
          o.status,
        ]);
      }),
    );
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4338CA" },
  };
  sheet.columns.forEach((c) => {
    c.width = 21;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "L1" };
  const info = book.addWorksheet("Instructions");
  [
    ["RTBES", APP_VERSION, SCORING_VERSION],
    [
      "This workbook is NOT a full backup. Use JSON to preserve revisions and score provenance.",
    ],
    [
      "RTBES provides two separate scores: an activity score and a chronic findings score.",
    ],
    [
      "One row per field per visit. Every field is required. Keep visit_index consecutive, starting at 0.",
    ],
    [
      "Use the generated RT- code only. Do not enter names, clinical record numbers or dates of birth.",
    ],
    [
      "day = elapsed days since baseline. Baseline = 0. Follow-ups must be strictly later.",
    ],
    [
      "quality, standing, reviewed: 0 or 1. Set reviewed=1 only after professional assessment.",
    ],
    ["Baseline: absent (value 0) or present (value from Field rules)."],
    [
      "Follow-up: absent, new, unchanged, improved, worsened, resolved. Rules depend on item and previous score.",
    ],
    [
      "Chronic parenchyma: unchanged / worsened only when previously present; absent / new when previously absent.",
    ],
    [
      "Calcified LN: SOP allows improved; resolved is not specified. Pleural thickening and calcification are separate items; follow-up allows unchanged, improved (/2) or worsened (x2).",
    ],
    [
      "Miliary: new/present 16, unchanged 16, improved 8, resolved 0. No score above the global maximum of 16.",
    ],
    [
      "Optional age in years and biological sex (blank/male/female/unknown). Analyst code only, no names.",
    ],
    [
      "Never use formulas. Read errors before accepting an import. No clinical data is sent to a server.",
    ],
    [
      "The download is unencrypted. Keep files on approved protected institutional storage.",
    ],
    [
      "Template contains a SYNTHETIC draft baseline; replace it with observations, never assume absent by default.",
    ],
  ].forEach((row) => info.addRow(row));
  info.getColumn(1).width = 135;
  const rules = book.addWorksheet("Field rules");
  rules.addRow([
    "field",
    "label",
    "unit",
    "group",
    "policy",
    "allowed current values",
  ]);
  fields.forEach((f) =>
    rules.addRow([
      f.id,
      f.label,
      f.unit,
      f.group,
      f.policy,
      f.allowed.join(", "),
    ]),
  );
  rules.columns.forEach((c) => {
    c.width = 30;
  });
  if (!template) {
    const results = book.addWorksheet("Results");
    results.addRow([
      "case_id",
      "visit_index",
      "day",
      "activity",
      "non_activity",
      "status",
      "app_version",
      "scoring_version",
    ]);
    for (const r of records)
      calculateSeries(r.visits).forEach((e, i) =>
        results.addRow([
          r.id,
          i,
          r.visits[i].day,
          e.score?.activityScore ?? null,
          e.score?.nonActivityScore ?? null,
          e.errors.join("; "),
          APP_VERSION,
          SCORING_VERSION,
        ]),
      );
  }
  return (await book.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}
export function templateCase(): CaseRecord {
  const r = newCase();
  r.visits[0].observations = Object.fromEntries(
    fields.map((f) => [f.id, { value: 0, status: "absent" }]),
  );
  return r;
}
export async function readWorkbook(buffer: ArrayBuffer): Promise<CaseRecord[]> {
  if (buffer.byteLength > 10_000_000) throw Error("Excel file exceeds 10 MB.");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(buffer);
  const sheet = book.getWorksheet("Observations");
  if (!sheet) throw Error("Missing Observations sheet.");
  if (sheet.rowCount > 100000) throw Error("Too many Excel rows.");
  const header = sheet.getRow(1);
  if (
    header.cellCount !== columns.length ||
    columns.some((c, i) => header.getCell(i + 1).value !== c)
  )
    throw Error("Use the supplied Excel column names and order.");
  const cases = new Map<string, CaseRecord>();
  const visited = new Set<string>();
  const meta = new Map<string, string>();
  sheet.eachRow((row, n) => {
    if (n === 1) return;
    try {
      if (row.cellCount > columns.length) throw Error("Unexpected columns.");
      const values = columns.map((_, i) => row.getCell(i + 1).value);
      if (
        values.some(
          (v) => v !== null && typeof v !== "number" && typeof v !== "string",
        )
      )
        throw Error("Only plain text and numbers are accepted; no formulas.");
      const [
        id,
        index,
        day,
        age,
        sex,
        quality,
        standing,
        reviewed,
        analyst,
        field,
        value,
        status,
      ] = values;
      if (
        typeof id !== "string" ||
        typeof index !== "number" ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= 1000
      )
        throw Error("Invalid case/visit index.");
      if (typeof field !== "string" || !fields.some((f) => f.id === field))
        throw Error("Unknown field.");
      if (![quality, standing, reviewed].every((v) => v === 0 || v === 1))
        throw Error("Assessment checks must be 0 or 1.");
      const key = `${id}/${index}/${field}`;
      if (visited.has(key)) throw Error("Duplicate field row.");
      visited.add(key);
      let r = cases.get(id);
      if (!r) {
        r = newCase();
        r.id = id;
        r.age = age as number | null;
        r.sex = (sex ?? "") as CaseRecord["sex"];
        r.visits = [];
        cases.set(id, r);
      }
      if (r.age !== age || r.sex !== (sex ?? ""))
        throw Error("Demographics differ within the same case.");
      const visitKey = `${id}/${index}`;
      const signature = JSON.stringify([
        day,
        quality,
        standing,
        reviewed,
        analyst ?? "",
      ]);
      if (meta.has(visitKey) && meta.get(visitKey) !== signature)
        throw Error("Visit metadata differs between rows.");
      meta.set(visitKey, signature);
      if (!r.visits[index]) {
        const v = newVisit(index === 0);
        v.day = day as number | null;
        v.quality = quality === 1;
        v.standing = standing === 1;
        v.reviewed = reviewed === 1;
        v.analystCode = (analyst ?? "") as string;
        r.visits[index] = v;
      }
      r.visits[index].observations[field] = {
        value: value as number | null,
        status: status as Observation["status"],
      };
    } catch (e) {
      throw Error(`Excel row ${n}: ${(e as Error).message}`);
    }
  });
  const out = [...cases.values()];
  if (!out.length) throw Error("No records in workbook.");
  for (const r of out) {
    for (let i = 0; i < r.visits.length; i++) {
      if (!r.visits[i]) throw Error(`${r.id}: missing visit index ${i}`);
      for (const f of fields)
        if (!visited.has(`${r.id}/${i}/${f.id}`))
          throw Error(`${r.id}, visit ${i}: missing ${f.id}`);
    }
    validateRecord(r);
    const result = calculateSeries(r.visits);
    result.forEach((e, i) => {
      if (r.visits[i].reviewed && e.errors.length)
        throw Error(`${r.id}, visit ${i}: ${e.errors[0]}`);
    });
  }
  return out;
}
