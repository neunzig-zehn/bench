/** Reading submitted answers leniently: keyed records whose keys a model may decorate. */
import { normalizeText } from "../../src/score";

/** The value under `key`, or under a key that starts with it ("1.01 Büro" for "1.01"). */
export const pick = (record: unknown, key: string): unknown => {
  if (!record || typeof record !== "object") return undefined;
  const entries = Object.entries(record as Record<string, unknown>);
  const exact = entries.find(([name]) => name.trim() === key);
  if (exact) return exact[1];
  const wanted = normalizeText(key);
  return entries.find(([name]) => normalizeText(name) === wanted || normalizeText(name).startsWith(`${wanted} `))?.[1];
};

export const round2 = (value: number) => Math.round(value * 100) / 100;
