import {
  COMPATIBLE_SCORING_VERSIONS,
  fields,
  LEGACY_TOTAL_SCORING_VERSION,
} from "../model.ts";
import type {
  CaseRecord,
  Evaluation,
  Field,
  Observation,
  Score,
  Visit,
  Status,
} from "../model.ts";

export function availableStatuses(
  f: Field,
  baseline: boolean,
  previous: number,
): Status[] {
  if (baseline) return ["absent", "present"];
  if (previous === 0) return ["absent", "new"];
  if (f.policy === "chronic") return ["unchanged", "worsened"];
  if (f.policy === "miliary")
    return previous < 16
      ? ["unchanged", "improved", "worsened", "resolved"]
      : ["unchanged", "improved", "resolved"];
  if (f.policy === "calcified-ln") return ["unchanged", "improved", "worsened"];
  if (f.policy === "chronic-pleura")
    return ["unchanged", "improved", "worsened"];
  return ["unchanged", "improved", "worsened", "resolved"];
}

export function scoreObservation(
  f: Field,
  o: Observation,
  baseline: boolean,
  previous: number,
): number {
  if (!o || o.status === "unreviewed" || o.value === null)
    throw Error("not assessed");
  if (!Number.isFinite(o.value) || !f.allowed.includes(o.value))
    throw Error("invalid current extent/type");
  if (!availableStatuses(f, baseline, previous).includes(o.status))
    throw Error("evolution not supported by the agreed rule");
  if ((o.status === "absent" || o.status === "resolved") !== (o.value === 0))
    throw Error("presence and evolution contradict each other");
  if (baseline) return o.value;
  switch (o.status) {
    case "absent":
    case "resolved":
      return 0;
    case "new":
      return o.value;
    case "unchanged":
      return previous;
    case "improved":
      return previous / 2;
    case "worsened":
      return f.policy === "miliary"
        ? Math.min(previous * 2, 16)
        : previous * 2;
    default:
      throw Error("unsupported evolution");
  }
}

export function calculateSeries(visits: Visit[]): Evaluation[] {
  const output: Evaluation[] = [];
  visits.forEach((visit, index) => {
    const errors: string[] = [];
    if (!visit.quality || !visit.standing)
      errors.push(
        "CXR excluded: confirm adequate technical quality and standing position.",
      );
    if (!visit.reviewed) errors.push("Assessment is not confirmed complete.");
    if (
      visit.day === null ||
      !Number.isFinite(visit.day) ||
      visit.day < 0 ||
      (index === 0 && visit.day !== 0)
    )
      errors.push("Enter valid elapsed days (baseline = 0).");
    if (
      index > 0 &&
      (visit.day === null ||
        visits[index - 1].day === null ||
        visit.day <= visits[index - 1].day!)
    )
      errors.push("Follow-up day must be later than the preceding visit.");
    const previous = index > 0 ? output[index - 1].score : null;
    if (index > 0 && !previous)
      errors.push(
        "The previous visit has no valid score; complete/correct it first.",
      );
    const items: Record<string, number> = {};
    let activityScore = 0,
      nonActivityScore = 0;
    for (const f of fields) {
      try {
        if (
          index > 0 &&
          visit.observations[f.id]?.status === "unchanged" &&
          visit.observations[f.id]?.value !==
            visits[index - 1].observations[f.id]?.value
        )
          throw Error(
            "current extent/type changed but evolution says no change",
          );
        const value = scoreObservation(
          f,
          visit.observations[f.id],
          index === 0,
          previous?.items[f.id] ?? 0,
        );
        if (!Number.isFinite(value))
          throw Error("numeric overflow — score cannot be represented");
        items[f.id] = value;
        if (f.group === "activity") activityScore += value;
        else nonActivityScore += value;
      } catch (e) {
        errors.push(`${f.label} (${f.unit}): ${(e as Error).message}`);
      }
    }
    if (!Number.isFinite(activityScore) || !Number.isFinite(nonActivityScore))
      errors.push("Numeric overflow.");
    output.push({
      score: errors.length
        ? null
        : { activityScore, nonActivityScore, items },
      errors,
    });
  });
  return output;
}

export function inputOnly(record: CaseRecord) {
  const { history: _, modifiedAt: __, revision: ___, ...input } = record;
  return JSON.stringify(input);
}

export function validateRecord(value: unknown): asserts value is CaseRecord {
  const r = value as CaseRecord;
  if (!r || typeof r !== "object" || Array.isArray(r))
    throw Error("Invalid record.");
  const exact = (v: object, keys: string[]) => {
    if (
      Object.keys(v).some((k) => !keys.includes(k)) ||
      keys.some((k) => !(k in v))
    )
      throw Error(
        "Unexpected or missing field; identifying free-text fields are not accepted.",
      );
  };
  exact(r, ["id", "age", "sex", "visits", "modifiedAt", "revision", "history"]);
  if (typeof r.id !== "string" || !/^RT-[a-zA-Z0-9-]{8,40}$/.test(r.id))
    throw Error("Invalid generated case code. Legacy IDs are not accepted.");
  if (r.age !== null && (!Number.isFinite(r.age) || r.age < 0 || r.age > 120))
    throw Error("Invalid age.");
  if (!["", "male", "female", "unknown"].includes(r.sex))
    throw Error("Invalid sex.");
  if (
    !Array.isArray(r.visits) ||
    r.visits.length === 0 ||
    r.visits.length > 1000
  )
    throw Error("Invalid visits (maximum 1000 per imported case).");
  if (
    !Number.isInteger(r.revision) ||
    r.revision < 0 ||
    typeof r.modifiedAt !== "string" ||
    !Number.isFinite(Date.parse(r.modifiedAt))
  )
    throw Error("Invalid revision metadata.");
  const validateVisits = (visits: Visit[]) => {
    const ids = new Set<string>();
    for (const v of visits) {
      exact(v, [
        "id",
        "day",
        "analystCode",
        "quality",
        "standing",
        "reviewed",
        "observations",
      ]);
      if (
        typeof v.id !== "string" ||
        !/^[-a-zA-Z0-9]{8,50}$/.test(v.id) ||
        ids.has(v.id)
      )
        throw Error("Invalid or duplicate visit ID.");
      ids.add(v.id);
      if (
        typeof v.analystCode !== "string" ||
        !/^[-a-zA-Z0-9_]{0,24}$/.test(v.analystCode)
      )
        throw Error("Use an analyst code, not a name.");
      if (v.day !== null && (!Number.isFinite(v.day) || v.day < 0))
        throw Error("Invalid elapsed day.");
      if (
        ["quality", "standing", "reviewed"].some(
          (k) => typeof v[k as "quality"] !== "boolean",
        )
      )
        throw Error("Invalid assessment checks.");
      if (!v.observations || typeof v.observations !== "object")
        throw Error("Missing observations.");
      exact(
        v.observations,
        fields.map((f) => f.id),
      );
      for (const f of fields) {
        const o = v.observations[f.id];
        if (!o || typeof o !== "object") throw Error("Missing observation.");
        exact(o, ["value", "status"]);
        if (
          ![
            "unreviewed",
            "present",
            "absent",
            "new",
            "unchanged",
            "improved",
            "worsened",
            "resolved",
          ].includes(o.status) ||
          !(o.value === null || f.allowed.includes(o.value))
        )
          throw Error("Invalid observation.");
      }
    }
  };
  validateVisits(r.visits);
  if (!Array.isArray(r.history) || r.history.length > 2000)
    throw Error("Invalid history.");
  for (const h of r.history) {
    exact(h, ["at", "scoringVersion", "observations", "results"]);
    if (
      typeof h.at !== "string" ||
      !Number.isFinite(Date.parse(h.at)) ||
      !COMPATIBLE_SCORING_VERSIONS.includes(h.scoringVersion) ||
      !Array.isArray(h.observations) ||
      !h.observations.length ||
      h.observations.length > 1000 ||
      !Array.isArray(h.results) ||
      h.results.length !== h.observations.length
    )
      throw Error("Invalid historical snapshot.");
    validateVisits(h.observations);
    for (const e of h.results) {
      if (!e || typeof e !== "object")
        throw Error("Invalid historical result.");
      exact(e, ["score", "errors"]);
      if (
        !Array.isArray(e.errors) ||
        e.errors.some((x) => typeof x !== "string" || x.length > 500)
      )
        throw Error("Invalid result errors.");
      if (e.score !== null) {
        const legacy = h.scoringVersion === LEGACY_TOTAL_SCORING_VERSION;
        exact(
          e.score,
          legacy
            ? ["activityScore", "nonActivityScore", "totalScore", "items"]
            : ["activityScore", "nonActivityScore", "items"],
        );
        if (!e.score.items || typeof e.score.items !== "object")
          throw Error("Invalid historical items.");
        exact(
          e.score.items,
          fields.map((f) => f.id),
        );
        if (
          [
            ...Object.values(e.score.items),
            e.score.activityScore,
            e.score.nonActivityScore,
            ...(legacy ? [e.score.totalScore] : []),
          ].some((x) => typeof x !== "number" || !Number.isFinite(x) || x < 0)
        )
          throw Error("Invalid historical score.");
      }
    }
  }
}
