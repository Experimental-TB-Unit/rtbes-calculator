import React, { useEffect, useMemo, useState } from "react";
import QuadrantSelector from "./components/QuadrantSelector";
import ScoreEvolutionGraph from "./components/ScoreEvolutionGraph";
import {
  APP_VERSION,
  SCORING_VERSION,
  activeItems,
  chronicItems,
  fields,
  newCase,
  newVisit,
  quadrants,
} from "./model.ts";
import type { CaseRecord, Field, Observation, Status, Visit } from "./model.ts";
import {
  availableStatuses,
  calculateSeries,
  inputOnly,
  validateRecord,
} from "./services/engine.ts";
import {
  download,
  makeBackup,
  parseBackup,
  mergeRecords,
  makeWorkbook,
  readWorkbook,
  templateCase,
} from "./services/transfer.ts";
import { loadLocal, saveLocal } from "./services/storage.ts";

const labels: Record<Status, string> = {
  unreviewed: "Not assessed",
  present: "Present",
  absent: "Absent",
  new: "New",
  unchanged: "No change",
  improved: "Improved ÷2",
  worsened: "Worsened ×2",
  resolved: "Resolved (0)",
};
const clone = <T,>(v: T): T => structuredClone(v);
function readableError(e: unknown) {
  if (e instanceof SyntaxError)
    return "This file could not be read. It may be incomplete or damaged. Nothing was changed.";
  return e instanceof Error ? e.message : "The operation could not be completed.";
}
function extentLabel(f: Field, n: number) {
  if (!n) return "Absent";
  if (f.id.endsWith("LN")) return n === 4 ? "Bilateral (4)" : "Unilateral (2)";
  if (f.id.startsWith("effusion."))
    return n === 1
      ? "Blunting of costophrenic angle (1)"
      : n === 2
        ? "Fissural / lateral / subpulmonic effusion (2)"
        : "Massive effusion (3)";
  return `Present (${n})`;
}

export default function App() {
  const [record, setRecord] = useState<CaseRecord>(newCase);
  const [records, setRecords] = useState<CaseRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [savedInput, setSavedInput] = useState(() => inputOnly(record));
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastExport, setLastExport] = useState("Not exported in this session");
  const [pending, setPending] = useState<CaseRecord[] | null>(null);
  const [replacements, setReplacements] = useState<Set<string>>(new Set());
  const results = useMemo(
    () => calculateSeries(record.visits),
    [record.visits],
  );
  const visit = record.visits[index];
  const evaluation = results[index];
  const baseline = index === 0;
  const dirty = inputOnly(record) !== savedInput;
  const savedOnDevice = records.some(
    (stored) => stored.id === record.id && inputOnly(stored) === inputOnly(record),
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await loadLocal();
        if (cancelled || stored.length === 0) return;
        const latest = [...stored].sort((a, b) =>
          b.modifiedAt.localeCompare(a.modifiedAt),
        )[0];
        setRecords(stored);
        setRecord(clone(latest));
        setIndex(0);
        setSavedInput(inputOnly(latest));
        setNotice(
          `Loaded ${stored.length} case${stored.length === 1 ? "" : "s"} saved on this device.`,
        );
      } catch (e) {
        if (!cancelled)
          setNotice(`Could not load cases from this device: ${(e as Error).message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setNotice(readableError(e));
    } finally {
      setBusy(false);
    }
  };
  function updateVisit(change: Partial<Visit>) {
    setRecord((r) => ({
      ...r,
      visits: r.visits.map((v, i) =>
        i === index
          ? { ...v, ...change, reviewed: change.reviewed ?? false }
          : i > index
            ? { ...v, reviewed: false }
            : v,
      ),
    }));
  }
  function updateObservation(id: string, o: Observation) {
    updateVisit({ observations: { ...visit.observations, [id]: o } });
  }
  function makeSaved(): CaseRecord {
    validateRecord(record);
    if (!dirty) return clone(record);
    if (record.history.length >= 2000)
      throw Error(
        "History limit reached; export and archive this case before further revisions.",
      );
    return {
      ...clone(record),
      modifiedAt: new Date().toISOString(),
      revision: record.revision + 1,
      history: [
        ...record.history,
        {
          at: new Date().toISOString(),
          scoringVersion: SCORING_VERSION,
          observations: clone(record.visits),
          results: clone(results),
        },
      ],
    };
  }
  async function saveSession() {
    const r = makeSaved();
    const next = mergeRecords(records, [r], new Set([r.id]));
    await saveLocal(next);
    setRecords(next);
    setRecord(r);
    setSavedInput(inputOnly(r));
    setNotice(
      "Case saved on this device. It can be reopened here for the next follow-up. Keep a separate JSON backup.",
    );
  }
  function allWithCurrent(): CaseRecord[] {
    const hasInput=record.revision>0||record.age!==null||record.sex!==''||record.visits.length>1||record.visits.some(v=>v.quality||v.standing||v.reviewed||v.analystCode!==''||Object.values(v.observations).some(o=>o.status!=='unreviewed'));
    if(!hasInput) return clone(records);
    return mergeRecords(records, [makeSaved()], new Set([record.id]));
  }
  function switchRecord(r: CaseRecord) {
    if (
      dirty &&
      !confirm("Discard unsaved changes? Download a backup first if needed.")
    )
      return;
    setRecord(clone(r));
    setIndex(0);
    setSavedInput(inputOnly(r));
  }
  function beginNew() {
    if (dirty && !confirm("Discard unsaved changes and start a new case?"))
      return;
    const r = newCase();
    setRecord(r);
    setIndex(0);
    setSavedInput(inputOnly(r));
  }
  function setStatus(f: Field, status: Status) {
    const before = record.visits[index - 1]?.observations[f.id];
    const positives = f.allowed.filter((n) => n > 0);
    const value =
      status === "unreviewed"
        ? null
        : status === "absent" || status === "resolved"
          ? 0
          : status === "new" || status === "present"
            ? positives.length === 1
              ? positives[0]
              : null
            : (before?.value ?? null);
    updateObservation(f.id, { status, value });
  }
  function fieldInput(f: Field, compact = false) {
    const o = visit.observations[f.id];
    const previous = results[index - 1]?.score?.items[f.id] ?? 0;
    const options = availableStatuses(f, baseline, previous);
    const multi = f.allowed.filter((n) => n > 0).length > 1;
    const effusionEvolutionOnly =
      !baseline && previous > 0 && f.id.startsWith("effusion.");
    return (
      <div
        key={f.id}
        className={
          compact
            ? "mb-2"
            : "border border-slate-200 rounded-xl bg-white p-4 shadow-sm h-full"
        }
      >
        <label className="block text-xs font-semibold text-slate-600">
          {compact ? f.unit : f.label}
          {!compact && <span className="block font-normal my-1">{f.unit}</span>}
          <select
            className="field mt-1 text-sm"
            aria-label={`${f.label} ${f.unit} status`}
            value={o.status}
            onChange={(e) => setStatus(f, e.target.value as Status)}
          >
            <option value="unreviewed">Not assessed</option>
            {options.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
            {o.status !== "unreviewed" && !options.includes(o.status) && (
              <option value={o.status}>Invalid: {labels[o.status]}</option>
            )}
          </select>
        </label>
        {multi &&
          !effusionEvolutionOnly &&
          o.status !== "unreviewed" &&
          o.status !== "absent" &&
          o.status !== "resolved" && (
            <label className="block text-xs mt-2">
              Current extent / type
              <select
                className="field mt-1 text-sm"
                aria-label={`${f.label} ${f.unit} extent`}
                value={o.value ?? ""}
                onChange={(e) =>
                  updateObservation(f.id, {
                    ...o,
                    value:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              >
                <option value="">Select current finding</option>
                {f.allowed
                  .filter((n) => n > 0)
                  .map((n) => (
                    <option key={n} value={n}>
                      {extentLabel(f, n)}
                    </option>
                  ))}
              </select>
            </label>
          )}
        {effusionEvolutionOnly && o.status !== "unreviewed" && (
          <p className="text-xs text-slate-500 mt-2">
            At follow-up, the score is determined by evolution from the
            preceding visit: no change keeps the score, improvement divides it
            by 2, worsening multiplies it by 2, and resolution scores 0.
          </p>
        )}
        {!baseline && (
          <p className="text-xs text-slate-500 mt-1">
            Previous score: {previous} · Current:{" "}
            {evaluation.score?.items[f.id] ?? "—"}
          </p>
        )}
        {f.policy === "miliary" && !baseline && previous === 0 && (
          <p className="text-xs text-slate-500 mt-2">
            New miliary TB scores 16 (global maximum).
          </p>
        )}
      </div>
    );
  }
  function parenchymalCards(items: Record<string, string>, chronic: boolean) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(items).map(([key, label]) => {
          const selected = Object.fromEntries(
            quadrants.map((q) => [
              q,
              (visit.observations[`${key}.${q}`].value ?? 0) > 0,
            ]),
          ) as Record<(typeof quadrants)[number], boolean>;
          return (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-center">
                <QuadrantSelector
                  label={label}
                  quadrantData={selected}
                  colorClass={chronic ? "text-teal-700" : "text-indigo-700"}
                  onChange={(data) => {
                    if (!baseline) {
                      setNotice(
                        "Use the per-quadrant evolution selectors below to assess a follow-up.",
                      );
                      return;
                    }
                    const observations = clone(visit.observations);
                    for (const q of quadrants)
                      observations[`${key}.${q}`] = {
                        status: data[q] ? "present" : "absent",
                        value: data[q] ? 2 : 0,
                      };
                    updateVisit({ observations });
                    setNotice(
                      `For ${label}, selected zones were recorded as present and the remaining zones as absent.`,
                    );
                  }}
                />
              </div>
              <div className="mt-3">
                {quadrants.map((q) =>
                  fieldInput(fields.find((f) => f.id === `${key}.${q}`)!, true),
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  function markUnassessedAbsent() {
    const observations = clone(visit.observations);
    for (const f of fields)
      if (observations[f.id].status === "unreviewed") {
        if (
          !baseline &&
          (results[index - 1]?.score?.items[f.id] ?? 0) > 0
        )
          continue;
        observations[f.id] = { value: 0, status: "absent" };
      }
    updateVisit({ observations });
  }
  function copyPrevious() {
    const previous = record.visits[index - 1];
    const score = results[index - 1].score;
    if (!score) return;
    const observations = Object.fromEntries(
      fields.map((f) => [
        f.id,
        {
          value: previous.observations[f.id].value,
          status: score.items[f.id] > 0 ? "unchanged" : "absent",
        },
      ]),
    ) as Record<string, Observation>;
    updateVisit({ observations });
  }
  async function readImport(file: File) {
    if (file.size > 25_000_000) throw Error("File exceeds 25 MB.");
    const incoming = file.name.toLowerCase().endsWith(".xlsx")
      ? await readWorkbook(await file.arrayBuffer())
      : parseBackup(await file.text()).records;
    setReplacements(new Set());
    setPending(incoming);
    setNotice(
      "Import validated structurally. Review records and duplicates before applying. Nothing has been changed.",
    );
  }
  const comparison = baseline
    ? "Baseline assessment"
    : `Compared with ${index === 1 ? "baseline" : `FU ${index - 1}`} (day ${record.visits[index - 1].day ?? "?"})`;
  return (
    <div className="min-h-screen pb-40 bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto p-4 flex flex-wrap justify-between gap-3 items-center">
          <div>
            <h1 className="text-xl font-bold">
              RTBES <span className="text-indigo-600">Calculator</span>
            </h1>
            <p className="text-xs text-slate-500">
              {APP_VERSION} · Clinical case content stays in this browser
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="action"
              disabled={busy}
              onClick={() => run(saveSession)}
            >
              Save case on this device
            </button>
            <button className="action" onClick={beginNew}>
              Start new case
            </button>
            <button className="action" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <p className="text-sm text-amber-900 mb-4">
          Release candidate for research, education and independent evaluation.
          The calculator does not interpret a radiograph or provide diagnostic
          or treatment recommendations.
        </p>
        <section className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5 text-sm">
          <h2 className="font-bold mb-2">About RTBES</h2>
          <p className="mb-2">
            <strong>RUTI-TB Evolution Score (RTBES)</strong> provides two
            separate scores: an activity score and a chronic findings score.
          </p>
          <p>
            <strong>RTBES authors:</strong> Jordi Bechini*, Cristina Vilaplana*,
            Patrícia Cuadras
          </p>
          <p className="text-xs text-slate-600 mt-1">
            *Jordi Bechini and Cristina Vilaplana contributed equally and led
            the development of RTBES.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            <strong>Copyright and institutional owner:</strong> Germans Trias i
            Pujol Research Institute (IGTP). Please cite RTBES when reporting
            results obtained with this calculator.
          </p>
          <p className="text-xs mt-2 flex flex-wrap gap-x-4 gap-y-2">
            <a className="underline font-semibold" href="https://doi.org/10.1101/2025.02.14.25322286" target="_blank" rel="noreferrer">
              Scientific reference
            </a>
            <a className="underline font-semibold" href="https://github.com/Experimental-TB-Unit/rtbes-calculator/blob/main/CITATION.cff" target="_blank" rel="noreferrer">
              Software citation
            </a>
            <a className="underline font-semibold" href="https://github.com/Experimental-TB-Unit/rtbes-calculator/blob/main/TERMS_OF_USE.md" target="_blank" rel="noreferrer">
              Current rights notice
            </a>
            <a className="underline font-semibold" href="https://github.com/Experimental-TB-Unit/rtbes-calculator/issues" target="_blank" rel="noreferrer">
              Report an issue
            </a>
          </p>
        </section>
        <section className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
          <h2 className="font-bold mb-2">Privacy and your records</h2>
          <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
            <li>Use generated RT codes only — never names, record numbers, dates of birth, images or free-text patient details.</li>
            <li>Clinical case content stays in this browser and is not sent to the hosting service by the calculator. The host may process standard technical access logs.</li>
            <li>Cases are retained only after you press “Save case on this device”. Browser storage and downloads are unencrypted; use an approved protected device and keep a JSON backup.</li>
            <li>Coded or pseudonymised data are not necessarily anonymous.</li>
          </ul>
          <div className="flex gap-2 flex-wrap mt-4 no-print">
            <button
              className="action"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const rs = allWithCurrent();
                  download(
                    "RTBES-backup.json",
                    JSON.stringify(makeBackup(rs), null, 2),
                    "application/json",
                  );
                  setLastExport(new Date().toLocaleString());
                  setNotice(
                    "Backup download requested. Check your Downloads folder; the app cannot verify the file was retained.",
                  );
                })
              }
            >
              Download full JSON backup
            </button>
            <button
              className="action"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  download(
                    "RTBES-results.xlsx",
                    await makeWorkbook(allWithCurrent()),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  );
                })
              }
            >
              Export Excel
            </button>
            <button
              className="action"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  download(
                    "RTBES-template.xlsx",
                    await makeWorkbook([templateCase()], true),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  );
                })
              }
            >
              Excel template
            </button>
            <label className="action cursor-pointer">
              Import JSON / Excel
              <input
                className="sr-only"
                aria-label="Import JSON or Excel"
                type="file"
                accept=".json,.xlsx"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void run(() => readImport(f));
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Last backup download requested: {lastExport}. JSON preserves full
            history; Excel is for observations and analysis, not full
            restoration.
          </p>
          <details open className="mt-3 no-print">
            <summary className="text-sm cursor-pointer">
              Cases saved on this device ({records.length})
            </summary>
            <p className="text-xs mt-2">
              Saved cases are loaded when this page is reopened in the same
              browser at the same web address. Browser data can be cleared and
              do not move between devices or browsers. Keep JSON backups.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button
                className="action"
                onClick={() =>
                  run(async () => {
                    setPending(await loadLocal());
                    setReplacements(new Set());
                  })
                }
              >
                Reload cases from this device
              </button>
              <button
                className="action"
                onClick={() =>
                  run(async () => {
                    if (
                      confirm(
                        "Delete all cases saved on this device? Downloaded backups and the open session will not be deleted.",
                      )
                    ) {
                      await saveLocal([]);
                      setRecords([]);
                      setNotice(
                        "Cases saved on this device were deleted. The open session and downloaded backups remain unchanged.",
                      );
                    }
                  })
                }
              >
                Delete all cases from this device
              </button>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {records.map((r) => (
                <div key={r.id} className="flex gap-1">
                  <button className="action" onClick={() => switchRecord(r)}>
                    {r.id} · {r.visits.length} visit
                    {r.visits.length === 1 ? "" : "s"}
                  </button>
                  <button
                    className="action"
                    aria-label={`Delete ${r.id} from this device`}
                    onClick={() =>
                      run(async () => {
                      if (confirm(`Delete ${r.id} from this device?`)) {
                        const next = records.filter((x) => x.id !== r.id);
                        await saveLocal(next);
                        setRecords(next);
                        if (r.id === record.id) {
                          const fresh = newCase();
                          setRecord(fresh);
                          setIndex(0);
                          setSavedInput(inputOnly(fresh));
                        }
                        setNotice(
                          "Removed from this device. Downloaded backups are unchanged.",
                        );
                      }
                    })}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </details>
        </section>
        {notice && (
          <div
            role="status"
            className="border-l-4 border-indigo-500 bg-indigo-50 p-4 mb-5 text-sm"
          >
            {notice}
            <button className="ml-4 underline" onClick={() => setNotice("")}>
              Dismiss
            </button>
          </div>
        )}
        {pending && (
          <section className="bg-white border-2 border-indigo-400 rounded-xl p-5 mb-5">
            <h2 className="font-bold">
              Import preview — {pending.length} records
            </h2>
            <p className="text-sm">
              New records will be added. Duplicate codes are skipped unless you
              explicitly select replacement. Replacing the open case also loads
              the imported version.
            </p>
            {pending.map((r) => (
              <div key={r.id} className="border-t py-2 text-sm">
                {r.id} · {r.visits.length} visits ·{" "}
                {calculateSeries(r.visits).filter((x) => x.score).length}{" "}
                calculable · {r.history.length} saved snapshots{" "}
                {records.some((x) => x.id === r.id) || record.id === r.id ? (
                  <label className="ml-3">
                    <input
                      type="checkbox"
                      checked={replacements.has(r.id)}
                      onChange={(e) =>
                        setReplacements((old) => {
                          const s = new Set(old);
                          e.target.checked ? s.add(r.id) : s.delete(r.id);
                          return s;
                        })
                      }
                    />{" "}
                    Replace existing session record
                  </label>
                ) : (
                  <span className="text-teal-700"> New</span>
                )}
              </div>
            ))}
            <button
              className="action mr-2"
              onClick={() =>
                run(async () => {
                  const base = allWithCurrent();
                  const existingIds = new Set(base.map((r) => r.id));
                  const appliedCount = pending.filter(
                    (r) => !existingIds.has(r.id) || replacements.has(r.id),
                  ).length;
                  const skippedCount = pending.length - appliedCount;
                  const next = mergeRecords(base, pending, replacements);
                  await saveLocal(next);
                  setRecords(next);
                  const replacement = pending.find(
                    (r) => r.id === record.id && replacements.has(r.id),
                  );
                  if (replacement) {
                    setRecord(clone(replacement));
                    setSavedInput(inputOnly(replacement));
                    setIndex(0);
                  }
                  setPending(null);
                  setNotice(
                    appliedCount === 0
                      ? `${skippedCount} case${skippedCount === 1 ? " was" : "s were"} skipped because already saved on this device. Nothing was imported.`
                      : `${appliedCount} case${appliedCount === 1 ? "" : "s"} imported${skippedCount ? `; ${skippedCount} duplicate${skippedCount === 1 ? " was" : "s were"} skipped` : ""}.`,
                  );
                })
              }
            >
              Apply import
            </button>
            <button className="action" onClick={() => setPending(null)}>
              Cancel
            </button>
          </section>
        )}
        <section className="bg-white rounded-xl border border-slate-200 p-5 mb-7">
          <h2 className="font-bold">Coded case information</h2>
          <div className="grid sm:grid-cols-3 gap-5 mt-3">
            <div>
              <span className="text-xs text-slate-500">
                Generated case code (not a hospital ID)
              </span>
              <p className="font-mono text-sm mt-2">{record.id}</p>
            </div>
            <label className="text-sm">
              Age, years (optional)
              <input
                className="field mt-1"
                type="number"
                min="0"
                max="120"
                value={record.age ?? ""}
                onChange={(e) =>
                  setRecord({
                    ...record,
                    age: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="text-sm">
              Biological sex (optional)
              <select
                className="field mt-1"
                value={record.sex}
                onChange={(e) =>
                  setRecord({
                    ...record,
                    sex: e.target.value as CaseRecord["sex"],
                  })
                }
              >
                <option value="">Not recorded</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Demographics do not change the score. Keep any identity-to-code key
            exclusively at the treating centre.
          </p>
        </section>
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          <div
            className="flex overflow-x-auto border-b no-print"
            aria-label="Assessment visits"
          >
            {record.visits.map((v, i) => (
              <button
                key={v.id}
                className={`px-5 py-4 whitespace-nowrap text-sm font-semibold border-b-2 ${i === index ? "border-indigo-600 text-indigo-700 bg-indigo-50" : "border-transparent text-slate-500"}`}
                onClick={() => setIndex(i)}
              >
                {i ? `Follow-up ${i}` : "Baseline"}{" "}
                {results[i].score ? "✓" : "·"}
              </button>
            ))}
            <button
              className="px-5 text-sm font-bold text-indigo-700 whitespace-nowrap"
              onClick={() => {
                setRecord((r) => ({ ...r, visits: [...r.visits, newVisit()] }));
                setIndex(record.visits.length);
              }}
            >
              + Add follow-up
            </button>
          </div>
          <div className="p-4 sm:p-6 bg-slate-50/30">
            <h2 className="font-semibold mb-4">{comparison}</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              <label className="text-sm">
                Elapsed days since baseline
                <input
                  className="field mt-1"
                  type="number"
                  min="0"
                  step="1"
                  value={visit.day ?? ""}
                  disabled={baseline}
                  onChange={(e) =>
                    updateVisit({
                      day:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="text-sm">
                Analyst code (optional; no name)
                <input
                  className="field mt-1"
                  maxLength={24}
                  pattern="[-a-zA-Z0-9_]*"
                  value={visit.analystCode}
                  onChange={(e) =>
                    updateVisit({
                      analystCode: e.target.value.replace(
                        /[^-a-zA-Z0-9_]/g,
                        "",
                      ),
                    })
                  }
                />
              </label>
              {!baseline && (
                <button
                  className="action self-end"
                  onClick={() => {
                    if (
                      confirm(
                        "Delete this follow-up? Later visits will be recalculated against their new predecessor and marked for review.",
                      )
                    ) {
                      setRecord((r) => ({
                        ...r,
                        visits: r.visits
                          .filter((_, i) => i !== index)
                          .map((v, i) =>
                            i >= index ? { ...v, reviewed: false } : v,
                          ),
                      }));
                      setIndex(index - 1);
                    }
                  }}
                >
                  Delete this follow-up
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-5 mb-5 text-sm">
              <label className="critical-check">
                <input
                  type="checkbox"
                  checked={visit.quality}
                  onChange={(e) => updateVisit({ quality: e.target.checked })}
                />{" "}
                Adequate technical quality
              </label>
              <label className="critical-check">
                <input
                  type="checkbox"
                  checked={visit.standing}
                  onChange={(e) => updateVisit({ standing: e.target.checked })}
                />{" "}
                CXR obtained standing
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-6 no-print">
              <button className="action" onClick={markUnassessedAbsent}>
                Mark all remaining findings as absent
              </button>
              {!baseline && (
                <button
                  className="action"
                  disabled={!results[index - 1].score}
                  onClick={copyPrevious}
                >
                  Copy preceding findings as unchanged — then review
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600 -mt-3 mb-6">
              On a baseline diagram, selected zones are recorded as present and
              the other zones for that finding as absent. You can change any
              zone afterwards.
            </p>
            <div>
              <section>
                <h3 className="text-lg font-bold text-indigo-700 mb-5 border-b border-indigo-200 pb-3">
                  Activity
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  At baseline, record every active finding and affected region.
                  At follow-up, compare every item with the immediately preceding
                  valid radiograph: new findings take their baseline value; no
                  change keeps the preceding score; improvement divides it by 2;
                  worsening multiplies it by 2; and resolution scores 0. Miliary
                  TB remains a global item capped at 16.
                </p>
                {parenchymalCards(activeItems, false)}
                <div className="mt-4">
                  {fieldInput(fields.find((f) => f.id === "miliary")!)}
                </div>
                <h4 className="mt-5 mb-2 text-sm font-bold text-slate-700">
                  Lymph nodes
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                  {(["mediastinalLN", "hilarLN"] as const).map((id) =>
                    fieldInput(fields.find((f) => f.id === id)!),
                  )}
                </div>
                <h4 className="mt-5 mb-2 text-sm font-bold text-slate-700">
                  Pleural effusion
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  At baseline, or when an effusion appears de novo, select its
                  type. When an effusion was already present, the follow-up score
                  depends only on change from the preceding visit: unchanged,
                  improved (/2), worsened (×2) or resolved (0).
                </p>
                <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                  {(["effusion.right", "effusion.left"] as const).map((id) =>
                    fieldInput(fields.find((f) => f.id === id)!),
                  )}
                </div>
              </section>
              <section className="mt-10 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-bold text-teal-700 mb-5 border-b border-teal-200 pb-3">
                  Chronicity / non-activity
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Chronic parenchymal findings cannot improve or resolve.
                  Calcified LN retain the separate SOP improvement rule. Pleural
                  thickening and calcification are separate findings; at
                  follow-up they may remain unchanged, improve (/2) or worsen (×2).
                </p>
                {parenchymalCards(chronicItems, true)}
                <h4 className="mt-5 mb-2 text-sm font-bold text-slate-700">
                  Calcified lymph nodes
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                  {(["mediastinalCalcLN", "hilarCalcLN"] as const).map((id) =>
                    fieldInput(fields.find((f) => f.id === id)!),
                  )}
                </div>
                {[
                  {
                    title: "Pleural thickening",
                    ids: [
                      "pleuralThickening.right",
                      "pleuralThickening.left",
                    ],
                  },
                  {
                    title: "Pleural calcification",
                    ids: [
                      "pleuralCalcification.right",
                      "pleuralCalcification.left",
                    ],
                  },
                ].map(({ title, ids }) => (
                  <div key={title}>
                    <h4 className="mt-5 mb-2 text-sm font-bold text-slate-700">
                      {title}
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                      {ids.map((id) =>
                        fieldInput(fields.find((f) => f.id === id)!),
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </div>
            <label className="critical-check mt-7 p-4 border-t font-semibold text-sm">
              <input
                type="checkbox"
                checked={visit.reviewed}
                onChange={(e) => updateVisit({ reviewed: e.target.checked })}
              />{" "}
              I have completed the professional assessment of all findings for
              this visit.
            </label>
            {evaluation.errors.length > 0 && (
              <details className="text-sm text-amber-900 mt-3">
                <summary>
                  {evaluation.errors.length} incomplete / incompatible checks —
                  no valid score yet
                </summary>
                <ul className="list-disc pl-5 mt-3">
                  {evaluation.errors.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </details>
            )}
            {evaluation.score && (
              <details className="mt-3 text-sm">
                <summary>Score breakdown by item and region</summary>
                <table className="w-full mt-3">
                  <thead>
                    <tr>
                      <th className="text-left">Finding</th>
                      <th className="text-left">Region</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => (
                      <tr className="border-t" key={f.id}>
                        <td>{f.label}</td>
                        <td>{f.unit}</td>
                        <td className="text-center">
                          {evaluation.score!.items[f.id]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        </div>
        <ScoreEvolutionGraph visits={record.visits} results={results} />
        <details className="mt-5 text-sm">
          <summary>
            Saved score history and provenance ({record.history.length}{" "}
            snapshots)
          </summary>
          <p className="mt-2">
            Editing observations recalculates the current series. Previously
            saved observations and results remain in the JSON history.
          </p>
          {record.history.map((h, i) => (
            <p key={i} className="mt-2">
              Revision {i + 1} · {h.at} · {h.scoringVersion} · activity / non-activity:{" "}
              {h.results
                .map((x) =>
                  x.score
                    ? `${x.score.activityScore} / ${x.score.nonActivityScore}`
                    : "incomplete",
                )
                .join(" → ")}
            </p>
          ))}
        </details>
      </main>
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-slate-200 shadow-lg p-4 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {dirty
                ? "Unsaved changes"
                : savedOnDevice
                  ? "Saved on this device"
                  : "Draft · not saved yet"} · {comparison}
            </p>
            {!evaluation.score && (
              <p className="font-bold text-lg">
                Incomplete / excluded — no score
              </p>
            )}
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-indigo-600">Activity</p>
              <p data-testid="activity-score" className="text-2xl font-bold text-indigo-700">
                {evaluation.score?.activityScore ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-teal-600">Non-activity</p>
              <p data-testid="non-activity-score" className="text-2xl font-bold text-teal-700">
                {evaluation.score?.nonActivityScore ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
