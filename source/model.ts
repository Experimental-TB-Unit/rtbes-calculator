export const APP_VERSION = "1.0.0-rc3";
export const SCORING_VERSION = "RTBES-SOP-1.0-2026-10-22";
export const PREVIOUS_SCORING_VERSION = "RTBES-2026-10-19-review.3";
export const LEGACY_TOTAL_SCORING_VERSION = "RTBES-2026-10-14-review.1";
export const COMPATIBLE_SCORING_VERSIONS = [
  SCORING_VERSION,
];
export const SCHEMA_VERSION = 3;
export const quadrants = ["RS", "RI", "LS", "LI"] as const;
export type Quadrant = (typeof quadrants)[number];
export type QuadrantData = Record<Quadrant, boolean>;
export type Status =
  | "unreviewed"
  | "present"
  | "absent"
  | "new"
  | "unchanged"
  | "improved"
  | "worsened"
  | "resolved";
export type Group = "activity" | "chronicity";
export type Policy =
  | "active"
  | "chronic"
  | "calcified-ln"
  | "miliary"
  | "chronic-pleura";
export interface Observation {
  value: number | null;
  status: Status;
}
export interface Field {
  id: string;
  label: string;
  group: Group;
  policy: Policy;
  allowed: readonly number[];
  unit: string;
}
export const activeItems = {
  cavities: "Cavities",
  infiltrates: "Infiltrates",
  dissemination: "Bronchogenic dissemination",
};
export const chronicItems = {
  scars: "Cicatricial lesions",
  granulomas: "Calcified granulomas",
  atelectasis: "Atelectasis",
  bronchiectasis: "Bronchiectasis",
  destruction: "Destructive pattern",
};
export const quadrantLabels: Record<Quadrant, string> = {
  RS: "Right upper lung zone",
  RI: "Right lower lung zone",
  LS: "Left upper lung zone",
  LI: "Left lower lung zone",
};
const parenchyma = (
  items: Record<string, string>,
  group: Group,
  policy: Policy,
): Field[] =>
  Object.entries(items).flatMap(([id, label]) =>
    quadrants.map((q) => ({
      id: `${id}.${q}`,
      label,
      group,
      policy,
      allowed: [0, 2],
      unit: quadrantLabels[q],
    })),
  );
export const fields: Field[] = [
  ...parenchyma(activeItems, "activity", "active"),
  {
    id: "miliary",
    label: "Miliary TB",
    group: "activity",
    policy: "miliary",
    allowed: [0, 16],
    unit: "Both lungs — global",
  },
  ...(["mediastinal", "hilar"] as const).map((id) => ({
    id: `${id}LN`,
    label: `${id === "hilar" ? "Hilar" : "Mediastinal"} lymph nodes`,
    group: "activity" as Group,
    policy: "active" as Policy,
    allowed: [0, 2, 4],
    unit: "0 absent / 2 unilateral / 4 bilateral",
  })),
  ...(["right", "left"] as const).map((side) => ({
    id: `effusion.${side}`,
    label: "Pleural effusion",
    group: "activity" as Group,
    policy: "active" as Policy,
    allowed: [0, 1, 2, 3],
    unit: `${side} lung`,
  })),
  ...parenchyma(chronicItems, "chronicity", "chronic"),
  ...(["mediastinal", "hilar"] as const).map((id) => ({
    id: `${id}CalcLN`,
    label: `${id === "hilar" ? "Hilar" : "Mediastinal"} LN calcification`,
    group: "chronicity" as Group,
    policy: "calcified-ln" as Policy,
    allowed: [0, 2, 4],
    unit: "0 absent / 2 unilateral / 4 bilateral",
  })),
  ...(["pleuralThickening", "pleuralCalcification"] as const).flatMap(
    (finding) =>
      (["right", "left"] as const).map((side) => ({
        id: `${finding}.${side}`,
        label:
          finding === "pleuralThickening"
            ? "Pleural thickening"
            : "Pleural calcification",
        group: "chronicity" as Group,
        policy: "chronic-pleura" as Policy,
        allowed: [0, 2],
        unit: `${side} lung`,
      })),
  ),
];
export interface Visit {
  id: string;
  day: number | null;
  analystCode: string;
  quality: boolean;
  standing: boolean;
  reviewed: boolean;
  observations: Record<string, Observation>;
}
export interface Score {
  activityScore: number;
  nonActivityScore: number;
  /** Preserved only inside imported review.1 snapshots; never calculated or shown. */
  totalScore?: number;
  items: Record<string, number>;
}
export interface Evaluation {
  score: Score | null;
  errors: string[];
}
export interface Snapshot {
  at: string;
  scoringVersion: string;
  observations: Visit[];
  results: Evaluation[];
}
export interface CaseRecord {
  id: string;
  age: number | null;
  sex: "" | "male" | "female" | "unknown";
  visits: Visit[];
  modifiedAt: string;
  revision: number;
  history: Snapshot[];
}
export interface Backup {
  schemaVersion: number;
  appVersion: string;
  scoringVersion: string;
  exportedAt: string;
  recordCount: number;
  records: CaseRecord[];
}
function generatedId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}
export function newVisit(baseline = false): Visit {
  return {
    id: generatedId(),
    day: baseline ? 0 : null,
    analystCode: "",
    quality: false,
    standing: false,
    reviewed: false,
    observations: Object.fromEntries(
      fields.map((f) => [f.id, { value: null, status: "unreviewed" }]),
    ),
  };
}
export function newCase(): CaseRecord {
  return {
    id: `RT-${generatedId().slice(0, 12)}`,
    age: null,
    sex: "",
    visits: [newVisit(true)],
    modifiedAt: new Date().toISOString(),
    revision: 0,
    history: [],
  };
}
