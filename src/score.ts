import type { Check, Grade } from "./types";

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** A check as score and weight. */
export const weighted = (check: Check) =>
  typeof check === "boolean"
    ? { score: check ? 1 : 0, weight: 1 }
    : typeof check === "number"
      ? { score: clamp01(check), weight: 1 }
      : { score: clamp01(check.score), weight: check.weight };

/** The weighted mean of a grade's checks, from 0 to 1. */
export const scoreOf = (grade: Grade) => {
  const entries = Object.values(grade.checks).map(weighted);
  const total = entries.reduce((sum, { weight }) => sum + weight, 0);
  return total > 0 ? entries.reduce((sum, { score, weight }) => sum + score * weight, 0) / total : 0;
};

/**
 * How close an estimate is to the actual value, from 0 to 1: 1 when equal, falling with the log
 * ratio, so being off by a factor counts the same over and under; 0 at `factor` (default 2) or
 * beyond, and for a missing, zero, or negative estimate.
 */
export const deviationScore = (estimate: unknown, actual: number, factor = 2) => {
  if (typeof estimate !== "number" || !Number.isFinite(estimate)) return 0;
  if (actual === 0) return estimate === 0 ? 1 : 0;
  if (estimate <= 0 || actual < 0) return 0;
  return clamp01(1 - Math.abs(Math.log(estimate / actual)) / Math.log(factor));
};

/** The relative deviation |estimate − actual| / actual, Infinity for a missing estimate. */
export const relativeDeviation = (estimate: unknown, actual: number) =>
  typeof estimate === "number" && Number.isFinite(estimate) && actual !== 0
    ? Math.abs(estimate - actual) / Math.abs(actual)
    : Number.POSITIVE_INFINITY;

/** A number equal to the expected one within an absolute tolerance (default: half a cent). */
export const exact = (value: unknown, expected: number, tolerance = 0.005) =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value - expected) <= tolerance;

/** A number read leniently: a number, or a string with a German or English decimal. */
export const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const text = value.trim().replace(/\s/gu, "");
  const normalized = /,\d{1,3}$/u.test(text) && !/\.\d{1,2}$/u.test(text)
    ? text.replaceAll(".", "").replace(",", ".")
    : text.replaceAll(",", "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Text compared without case, spacing, and punctuation differences. */
export const normalizeText = (text: unknown) =>
  String(text ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export const mean = (values: readonly number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
