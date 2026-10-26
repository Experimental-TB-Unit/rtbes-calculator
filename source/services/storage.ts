import type { CaseRecord } from "../model.ts";
import { validateRecord } from "./engine.ts";
const DB = "RTBES-v1-schema3";
async function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("cases", { keyPath: "id" });
    r.onerror = () => reject(r.error);
    r.onblocked = () =>
      reject(Error("Browser database is blocked by another tab."));
    r.onsuccess = () => resolve(r.result);
  });
}
export async function saveLocal(records: CaseRecord[]): Promise<void> {
  records.forEach(validateRecord);
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction("cases", "readwrite");
    const s = t.objectStore("cases");
    s.clear();
    records.forEach((r) => s.put(r));
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onabort = t.onerror = () => {
      db.close();
      reject(t.error ?? Error("Storage transaction failed."));
    };
  });
}
export async function loadLocal(): Promise<CaseRecord[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction("cases", "readonly");
    const r = t.objectStore("cases").getAll();
    t.oncomplete = () => {
      db.close();
      try {
        (r.result as unknown[]).forEach(validateRecord);
        resolve(r.result);
      } catch (e) {
        reject(e);
      }
    };
    t.onabort = t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}
