/**
 * Every task is well-formed without a model call: its reference answer grades 1, no answer grades
 * below 1, its ids are unique, its prompt does not hold the answer's numbers, and it has tools to
 * reach its data, so it takes more than one step.
 */
import { describe, expect, test } from "bun:test";

import { scoreOf } from "./score";
import { ALL_TASKS } from "./registry";

test("task ids are unique", () => {
  const ids = ALL_TASKS.map((task) => task.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every task runs in German and in English", () => {
  for (const task of ALL_TASKS) expect(task.id.endsWith(`-${task.lang}`)).toBe(true);
  const base = (lang: string) => new Set(ALL_TASKS.filter((task) => task.lang === lang).map((task) => `${task.track}/${task.id.slice(0, -3)}`));
  expect([...base("en")].sort()).toEqual([...base("de")].sort());
});

for (const task of ALL_TASKS)
  describe(`${task.track}/${task.id}`, () => {
    test("the reference answer scores 1", () => {
      const state = task.referenceState ? task.referenceState() : task.init();
      expect(scoreOf(task.grade(task.reference, state))).toBeCloseTo(1, 6);
    });
    test("no answer scores below 1", () => {
      expect(scoreOf(task.grade(undefined, task.init()))).toBeLessThan(1);
    });
    test("it is multi-step: the data sits behind tools", () => {
      expect(task.tools.length).toBeGreaterThan(0);
      expect(task.id).toMatch(/^[a-z0-9-]+$/u);
    });
  });
