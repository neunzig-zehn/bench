import { describe, expect, test } from "bun:test";

import { scoreOf } from "../../src/score";
import { LANGS, type Lang } from "../../src/types";
import { ask, date, fold, matches, type Scenario, type State } from "./dialog";
import { FEEDER_SCENARIO, FEEDER_TOTAL } from "./feeder";
import { TASKS } from "./index";
import { LIGHTING_SCENARIO, LIGHTING_TOTAL } from "./lighting";
import { SCHEDULE_DAYS, SCHEDULE_HOURS, SCHEDULE_SCENARIO } from "./schedule";
import { SOCKET_SCENARIO, SOCKET_TOTAL } from "./sockets";
import { WALLBOX_SCENARIO, WALLBOX_UNIT_PRICE } from "./wallbox";

const task = (name: string, lang: Lang) => TASKS.find((item) => item.id === "dialog-" + name + "-" + lang)!;
const fresh = (): State => ({ questions: [] });
const run = async (name: string, lang: Lang, tool: string, args: Record<string, unknown>, state = fresh()) =>
  (await task(name, lang).tools.find((item) => item.name === tool)!.run(args, state)).output;

test("results match hand calculations", () => {
  expect(WALLBOX_UNIT_PRICE).toBe(1246.28);
  expect(LIGHTING_TOTAL).toBe(5969.16);
  expect(FEEDER_TOTAL).toBe(4816.82);
  expect(SOCKET_TOTAL).toBe(1585.78);
  expect(SCHEDULE_HOURS).toBe(518);
  expect(SCHEDULE_DAYS).toBe(33);
});

test("five tasks, each in German and in English", () => {
  expect(TASKS).toHaveLength(10);
  for (const item of TASKS) {
    expect(item.id.endsWith("-" + item.lang)).toBe(true);
    expect(TASKS.some((other) => other.id === item.id.slice(0, -2) + (item.lang === "de" ? "en" : "de"))).toBe(true);
  }
});

test("documents differ by language but keep their shape", async () => {
  for (const name of ["wallbox-unit-price", "lighting-contradictions", "feeder-unknown-length", "sockets-fully-specified", "schedule-decision"]) {
    const [de, en] = await Promise.all(LANGS.map((lang) => run(name, lang, "list_documents", {}) as Promise<Array<{ id: string; pages: number; title: string }>>));
    expect(de!.map(({ id, pages }) => [id, pages])).toEqual(en!.map(({ id, pages }) => [id, pages]));
    for (const doc of de!) {
      for (let page = 1; page <= doc.pages; page++) {
        const [textDe, textEn] = await Promise.all(LANGS.map((lang) => run(name, lang, "read_document", { document: doc.id, page }) as Promise<{ text: string }>));
        expect(textDe!.text).not.toBe(textEn!.text);
        expect(textDe!.text.split("\n").every(Boolean)).toBe(true);
      }
    }
  }
});

test("search finds lines and articles in the task's language", async () => {
  const lines = (await run("wallbox-unit-price", "de", "search_documents", { query: "Montagehöhe Wallbox" })) as Array<{ document: string; text: string }>;
  expect(lines.some(({ text }) => text.includes("1,20 m"))).toBe(true);
  const articles = (await run("wallbox-unit-price", "en", "search_articles", { query: "NYM-J 5x6" })) as Array<{ articleNo: string; priceBasis: string }>;
  expect(articles[0]).toMatchObject({ articleNo: "K-5060", priceBasis: "EUR per 100 m" });
  expect(await run("wallbox-unit-price", "de", "search_articles", { query: "Waschmaschine" })).toBe("Keine Treffer.");
});

const classify = (scenario: Scenario, question: string) => {
  const state = fresh();
  const reply = ask(scenario, "en", question, state);
  return { ...state.questions[0]!, reply };
};

describe("the simulated colleague", () => {
  const cases: Array<[Scenario, string, string[], string[]]> = [
    [WALLBOX_SCENARIO, "Welches Fabrikat soll ich für die Wallbox ansetzen?", ["make"], []],
    [WALLBOX_SCENARIO, "Which make and model of wallbox should we offer?", ["make"], []],
    [WALLBOX_SCENARIO, "Wie lang sind die Zuleitungen von der UV-TG zu den Wallboxen?", ["cable length"], []],
    [WALLBOX_SCENARIO, "What cable length should I assume per charging point?", ["cable length"], []],
    [WALLBOX_SCENARIO, "Laut Baubeschreibung wird auf 1,20 m montiert. Wie lang ist die Leitung je Wallbox?", ["cable length"], []],
    [WALLBOX_SCENARIO, "In welcher Höhe wird die Wallbox montiert?", [], ["mounting height"]],
    [WALLBOX_SCENARIO, "Is the wallbox wall-mounted or on a pedestal?", [], ["mounting type"]],
    [WALLBOX_SCENARIO, "Wie viele Wallboxen sind es?", [], ["quantity"]],
    [WALLBOX_SCENARIO, "Ist das Lastmanagement im EP enthalten?", [], ["load management"]],
    [WALLBOX_SCENARIO, "Will the site be ready in March?", [], []],
    [LIGHTING_SCENARIO, "Plan shows 12 downlights in the waiting room, LV only 10. Which number applies?", ["luminaire count"], []],
    [LIGHTING_SCENARIO, "Soll ich in Pos. 03.04 NYM-J oder die halogenfreie NHXMH-J kalkulieren?", ["cable type"], []],
    [LIGHTING_SCENARIO, "Welcher Fertigstellungstermin gilt: 15.05. oder 30.04.2027?", ["deadline"], []],
    [LIGHTING_SCENARIO, "Which colour temperature do the downlights have?", [], ["colour temperature"]],
    [LIGHTING_SCENARIO, "Wie hoch ist die Decke im Foyer?", ["foyer height"], []],
    [LIGHTING_SCENARIO, "Wie hoch ist der Flur?", [], ["height"]],
    [LIGHTING_SCENARIO, "Wie viele Rasterleuchten kommen in die Behandlungsräume?", [], ["panel count"]],
    [FEEDER_SCENARIO, "In welcher Farbe sollen die Pollerleuchten geliefert werden?", ["bollard colour"], []],
    [FEEDER_SCENARIO, "How long is the cable route from the main distribution board to the barn?", ["cable length"], []],
    [FEEDER_SCENARIO, "Can I use the 40 m from the site plan for item 04.01?", ["cable length"], []],
    [FEEDER_SCENARIO, "Wie lang ist das Kabel zu den Steckdosensäulen?", [], ["loop cable length"]],
    [FEEDER_SCENARIO, "Welche Art und Länge hat die Zuleitung zu den sechs Pollerleuchten?", [], ["loop cable length"]],
    [FEEDER_SCENARIO, "Wer stellt den Kabelgraben her?", [], ["trench"]],
    [SCHEDULE_SCENARIO, "Wie viele Monteure haben wir für das 2. OG?", ["crew"], []],
    [SCHEDULE_SCENARIO, "Which completion date applies, 16 April or 30 April 2027?", ["deadline"], []],
    [SCHEDULE_SCENARIO, "Ab wann können wir im 2. OG anfangen?", [], ["start"]],
    [SCHEDULE_SCENARIO, "The LV has 36 downlights but the plan only 32 — which is right?", ["downlight count"], []],
    [SCHEDULE_SCENARIO, "Pos. 02.01 sind Einlegeleuchten, im Großraumbüro gibt es aber keine Rasterdecke. Wie wird montiert?", ["panel mounting"], []],
    [SCHEDULE_SCENARIO, "Wie viele Monteure stehen ab Baufreiheit am 01.03.2027 zur Verfügung?", ["crew"], []],
    [LIGHTING_SCENARIO, "Pos. 03.02 nennt RL-625/840, gefordert ist aber UGR < 19. Welche Variante soll ich nehmen?", ["panel type"], []],
    [SCHEDULE_SCENARIO, "Are Easter Monday and Women's Day days off?", [], ["holidays"]],
  ];
  for (const [scenario, question, facts, documented] of cases)
    test(question, () => {
      const asked = classify(scenario, question);
      expect(asked.facts).toEqual(facts);
      expect(asked.documented).toEqual(documented);
    });

  test("replies in the task's language", () => {
    expect(ask(WALLBOX_SCENARIO, "de", "Wann kommt der Estrich?", fresh())).toBe("Weiß ich nicht.");
    expect(ask(WALLBOX_SCENARIO, "en", "How high is the wallbox mounted?", fresh())).toBe("That is in the documents.");
    expect(ask(WALLBOX_SCENARIO, "de", "Welches Fabrikat? Und in welcher Höhe wird montiert?", fresh())).toContain("1. Bauabschnitt");
  });
});

test("dates match in German and English spellings", () => {
  const april16 = new RegExp(date(16, 4), "u");
  for (const text of ["16.04.2027", "16.4.", "16. april", "16 apr 2027", "april 16th", "2027-04-16"]) expect(april16.test(fold(text))).toBe(true);
  for (const text of ["26.04.2027", "16.05.2027", "1 apr"]) expect(april16.test(fold(text))).toBe(false);
});

describe("flags", () => {
  const flagged = (scenario: Scenario, issue: string) => scenario.flags.filter((flag) => matches(flag, fold(issue))).map(({ id }) => id);
  test("lenient in both languages", () => {
    expect(flagged(LIGHTING_SCENARIO, "Anzahl Downlights Wartezimmer: LV 10 Stk, Plan 12 Stk")).toEqual(["luminaire count"]);
    expect(flagged(LIGHTING_SCENARIO, "Two different completion dates: 15 May 2027 vs 30 April 2027")).toEqual(["deadline"]);
    expect(flagged(LIGHTING_SCENARIO, "Leitungstyp Flur: halogenfrei statt NYM")).toEqual(["halogen-free cable"]);
    expect(flagged(FEEDER_SCENARIO, "Pos. 04.01 nicht bepreist: Kabellänge unbekannt")).toEqual(["cable length unknown"]);
    expect(flagged(SCHEDULE_SCENARIO, "Baubeschreibung 30.04.2027 widerspricht Bauzeitenplan 16.04.2027")).toEqual(["deadline"]);
  });
  test("not raised by unrelated issues", () => {
    expect(flagged(LIGHTING_SCENARIO, "Colour of light: neutral white equals 4000 K")).toEqual([]);
    expect(flagged(SCHEDULE_SCENARIO, "Termin 16.04.2027 ist mit zwei Monteuren nicht haltbar")).toEqual([]);
    expect(flagged(FEEDER_SCENARIO, "Art und Länge der Zuleitung zu den Pollerleuchten sind ungeklärt")).toEqual([]);
    expect(flagged(SCHEDULE_SCENARIO, "Mounting height 3.40 m in the open-plan office: 25 % surcharge applied")).toEqual([]);
  });
});

describe("grading", () => {
  test("every reference grades 1 and no answer grades below 1", () => {
    for (const item of TASKS) {
      expect(scoreOf(item.grade(item.reference, item.referenceState ? item.referenceState() : item.init()))).toBeCloseTo(1, 6);
      expect(scoreOf(item.grade(undefined, item.init()))).toBeLessThan(0.5);
    }
  });

  test("the right number without asking loses the asked facts", () => {
    const item = task("wallbox-unit-price", "en");
    const grade = item.grade(item.reference, item.init());
    expect(grade.checks["asked: make"]).toBe(false);
    expect(scoreOf(grade)).toBeLessThan(0.8);
  });

  test("redundant questions and spurious issues cost points", () => {
    const item = task("wallbox-unit-price", "de");
    const state = item.referenceState!();
    ask(WALLBOX_SCENARIO, "de", "Wie hoch wird die Wallbox montiert?", state);
    const grade = item.grade({ unitPrice: "1.246,28", issues: ["Fabrikat Hagenau eCharge 11 wie im 1. Bauabschnitt"] }, state);
    expect(grade.checks["no redundant questions"]).toBe(0.5);
    expect(grade.checks["no spurious issues"]).toBe(0.5);
    expect(grade.checks["unit price"]).toEqual({ score: 1, weight: 4 });
  });

  test("an invented cable length fails the total and the invention check", () => {
    const item = task("feeder-unknown-length", "en");
    const grade = item.grade({ total: FEEDER_TOTAL + 40 * 26.83, issues: [] }, item.referenceState!());
    expect(grade.checks["no invented cable length"]).toEqual({ score: 0, weight: 2 });
    expect(grade.checks["flagged: cable length unknown"]).toBe(false);
  });

  test("any question on the fully specified item costs points", () => {
    const item = task("sockets-fully-specified", "de");
    const state = item.init();
    expect(ask(SOCKET_SCENARIO, "de", "Welche Montagehöhe gilt?", state)).toBe("Das steht in den Unterlagen.");
    expect(item.grade(item.reference, state).checks["asked nothing"]).toEqual({ score: 0.5, weight: 2 });
  });

  test("the schedule decision reads German words and wrong decisions fail", () => {
    const item = task("schedule-decision", "de");
    const state = item.referenceState!();
    expect(item.grade({ ...item.reference, decision: "nein" }, state).checks.decision).toEqual({ score: 1, weight: 3 });
    expect(item.grade({ ...item.reference, decision: "open" }, state).checks.decision).toEqual({ score: 0, weight: 3 });
  });
});
