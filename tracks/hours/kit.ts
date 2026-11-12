/**
 * The hours track's shared kit: the tools an estimator uses (LV, site description, time catalog,
 * completed projects with booked hours), the bookings of the hidden labour model, and the grader.
 */
import { deviationScore, mean, relativeDeviation, toNumber } from "../../src/score";
import type { Lang, Task, Tool } from "../../src/types";

export type L = Record<Lang, string>;
export type Unit = "m" | "m2" | "pc";
/** A time catalog entry: standard minutes per `per` (default 1) units. */
export type Entry = { code: string; text: L; unit: Unit; minutes: number; per?: number; note?: L };
/** One catalog activity of an Item, its quantity in the entry's unit. */
export type Line<W> = W & { code: string; quantity: number };
export type Item<W> = { id: string; trap: string; short: L; long: L; quantity: number; unit: Unit; lines: Line<W>[] };
export type PastItem<W> = { text: L; quantity: number; unit: Unit; note?: L; lines: Line<W>[] };
export type Project<W, P> = { id: string; name: L; year: number; conditions: L; attrs: P; items: PastItem<W>[] };

export type Fixture<W, P> = {
  slug: string;
  title: string;
  description: string;
  company: L;
  project: L;
  rules: L;
  catalog: Entry[];
  site: Array<{ title: L; text: L }>;
  attrs: P;
  items: Item<W>[];
  projects: Project<W, P>[];
  /** The hidden labour model: the hours an Item truly takes under a project's conditions. */
  hours: (lines: Line<W>[], attrs: P) => number;
  /** Groups whose bookings scatter around the model independently, so each group's own factor or set-up time shows exactly in history. */
  cluster?: (lines: Line<W>[]) => string;
  seed: number;
};

/** Items and history rows per page. */
const PAGE = 10;
/** Deviation factor at which an estimate scores 0: ±10 % scores about 0.75, +50 % or −33 % scores 0. */
export const FACTOR = 1.5;
/** Weight of the total beside one weight per Item. */
const TOTAL_WEIGHT = 5;
/** Largest relative scatter of a booking around the model's hours. */
const SCATTER = 0.06;

const UNITS: Record<Lang, Record<Unit, string>> = { de: { m: "m", m2: "m²", pc: "St" }, en: { m: "m", m2: "m²", pc: "pc" } };

/** A number in each language's notation: 6,80 and 6.80. */
export const num = (value: number, digits = 2): L => ({
  de: value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  en: value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }),
});

export const catalogOf = (catalog: readonly Entry[]) => {
  const byCode = new Map(catalog.map((entry) => [entry.code, entry]));
  return (code: string) => {
    const entry = byCode.get(code);
    if (!entry) throw new Error(`Unknown catalog entry ${code}`);
    return entry;
  };
};

export const standardMinutes = (entry: Entry, quantity: number) => (entry.minutes * quantity) / (entry.per ?? 1);

const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

const random = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * The hours a completed project booked per Item: the model's hours with seeded scatter of up to
 * ±6 %, shifted so its hours-weighted mean is zero within the project and cluster (the booked
 * total of each matches the model), rounded to 0.1 h.
 */
export const booked = <W, P>(fixture: Fixture<W, P>, index: number) => {
  const project = fixture.projects[index]!;
  const next = random(fixture.seed * 1000 + index);
  const model = project.items.map((item) => fixture.hours(item.lines, project.attrs));
  const clusters = project.items.map((item) => fixture.cluster?.(item.lines) ?? "");
  const scatter = model.map(() => (next() * 2 - 1) * SCATTER);
  const bias = (cluster: string) => {
    const members = model.map((_, i) => i).filter((i) => clusters[i] === cluster);
    return members.reduce((sum, i) => sum + scatter[i]! * model[i]!, 0) / members.reduce((sum, i) => sum + model[i]!, 0);
  };
  return model.map((hours, i) => Math.max(0.1, round(hours * (1 + scatter[i]! - bias(clusters[i]!)), 1)));
};

/** The hours each Item of the new LV truly takes, rounded to 0.01 h. */
export const actualHours = <W, P>(fixture: Fixture<W, P>) => fixture.items.map((item) => round(fixture.hours(item.lines, fixture.attrs), 2));

const TEXT = {
  de: {
    system: (company: string) => `Du bist Kalkulator der ${company}. Mit den Werkzeugen schätzt du für jede Position eines neuen Leistungsverzeichnisses (LV) die Arbeitsstunden, die eure Monteure tatsächlich buchen werden.

- Stunden je Position: Personenstunden in h für alles, was die Position auf der Baustelle erfordert, mit mindestens einer Nachkommastelle.
- Lies den Langtext jeder Position und die Baubeschreibung; die Bedingungen dort gelten für die Positionen.
- Der Zeitwertkatalog des Betriebs nennt Zeitwerte in Minuten je Katalogeinheit; seine Vorbemerkungen sagen, wofür sie gelten und wie sie anzupassen sind.
- Abgeschlossene Projekte (Nachkalkulation) nennen ihre Positionen mit den verwendeten Katalogeinträgen, den Bedingungen und den tatsächlich gebuchten Stunden. Die Buchungen streuen um wenige Prozent um den tatsächlichen Aufwand; wo Katalog und Buchungen systematisch abweichen, zeigen die Buchungen, wie eure Monteure wirklich arbeiten.
- Rufe unabhängige Werkzeuge parallel auf. Reiche dann die Stunden jeder Position und die Gesamtstunden (Summe über alle Positionen) ein.`,
    prompt: (count: number, project: string) => `Schätze die Arbeitsstunden für alle ${count} Positionen des LV „${project}“.`,
    listItems: "Listet die Positionen des LV in Reihenfolge: Ordnungszahl, Kurztext, Menge, Einheit. Höchstens 10 je Aufruf.",
    getItem: "Liefert eine Position mit Langtext.",
    site: "Liest die Baubeschreibung. Ohne Abschnitt liefert es das Inhaltsverzeichnis, mit Abschnittsnummer den Text des Abschnitts.",
    rules: "Liefert die Vorbemerkungen des Zeitwertkatalogs.",
    search: "Durchsucht den Zeitwertkatalog nach Wörtern oder nach dem Anfang einer Katalognummer. Liefert bis zu 8 Einträge: Nummer, Text, Einheit, Zeitwert in Minuten je Einheit.",
    entry: "Liefert einen Katalogeintrag mit seinen Hinweisen.",
    projects: "Listet die abgeschlossenen Projekte des Betriebs mit Jahr und Bedingungen.",
    project: "Liefert ein abgeschlossenes Projekt: Bedingungen und eine Seite mit bis zu 10 Positionen mit Menge, Einheit, verwendeten Katalogeinträgen, Hinweisen und den tatsächlich gebuchten Stunden.",
    answer: "Die Stunden je Position und die Gesamtstunden.",
    itemId: "Ordnungszahl der Position, z. B. 01.02",
    hours: "Arbeitsstunden der Position in h",
    totalHours: "Gesamtstunden aller Positionen in h",
    notes: "Kurze Begründung, optional",
    offset: "Erste Zeile, ab 0",
    query: "Suchwörter oder Katalognummer",
    unknown: (what: string, id: unknown) => `Unbekannt: ${what} ${String(id)}`,
    what: { item: "Position", section: "Abschnitt", entry: "Katalogeintrag", project: "Projekt" },
  },
  en: {
    system: (company: string) => `You are the estimator of ${company}. Using the tools, you estimate for each Item of a new tender (LV) the labour hours your crews will actually book.

- Hours per Item: person-hours in h for everything the Item needs on site, with at least one decimal.
- Read each Item's long text and the site description; the conditions there apply to the Items.
- The company's time catalog gives standard times in minutes per catalog unit; its general conditions say what they cover and how to adjust them.
- Completed projects (post-calculation) list their Items with the catalog entries used, the conditions, and the hours actually booked. Bookings scatter a few percent around the true effort; where the catalog and the bookings differ systematically, the bookings show how your crews really work.
- Call independent tools in parallel. Then submit the hours of every Item and the total hours (the sum over all Items).`,
    prompt: (count: number, project: string) => `Estimate the labour hours for all ${count} Items of the LV "${project}".`,
    listItems: "Lists the LV's Items in order: ordinal, short text, quantity, unit. At most 10 per call.",
    getItem: "Returns one Item with its long text.",
    site: "Reads the site description. Without a section it returns the table of contents; with a section number, that section's text.",
    rules: "Returns the time catalog's general conditions.",
    search: "Searches the time catalog by words or by the start of a catalog code. Returns up to 8 entries: code, text, unit, standard minutes per unit.",
    entry: "Returns one catalog entry with its notes.",
    projects: "Lists the company's completed projects with year and conditions.",
    project: "Returns one completed project: its conditions and a page of up to 10 Items with quantity, unit, catalog entries used, notes, and the hours actually booked.",
    answer: "The hours per Item and the total hours.",
    itemId: "The Item's ordinal, e.g. 01.02",
    hours: "The Item's labour hours in h",
    totalHours: "Total hours over all Items in h",
    notes: "Short reasoning, optional",
    offset: "First row, from 0",
    query: "Search words or catalog code",
    unknown: (what: string, id: unknown) => `Unknown ${what} ${String(id)}`,
    what: { item: "Item", section: "section", entry: "catalog entry", project: "project" },
  },
} as const;

const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: false });

const tokens = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N},.²]+/u)
    .map((token) => token.replace(/^[.,]+|[.,]+$/gu, ""))
    .filter((token) => token.length > 1 || /\d/u.test(token));

/** An Item ordinal compared without leading zeros: 01.02 and 1.2 are the same. */
const ordinal = (id: unknown) =>
  String(id ?? "")
    .trim()
    .split(".")
    .map((part) => (/^\d+$/u.test(part) ? String(Number(part)) : part.toLowerCase()))
    .join(".");

export type Answer = { items: Array<{ itemId: string; hours: number }>; totalHours: number; notes?: string };

/** One task per language from a fixture: the same data, tools, and grading in German and English. */
export const hoursTask =
  <W, P>(fixture: Fixture<W, P>) =>
  (lang: Lang): Task<object, Answer> => {
    const text = TEXT[lang];
    const unit = (value: Unit) => UNITS[lang][value];
    const actual = actualHours(fixture);
    const actualTotal = round(actual.reduce((sum, hours) => sum + hours, 0), 2);
    const bookings = fixture.projects.map((_, index) => booked(fixture, index));
    const ok = (output: unknown) => ({ output });
    const refuse = (what: keyof typeof text.what, id: unknown) => ({ output: { error: text.unknown(text.what[what], id) }, refused: true });
    const offsetOf = (value: unknown) => Math.max(0, Math.floor(Number(value ?? 0)) || 0);
    const entryView = (entry: Entry) => ({
      code: entry.code,
      text: entry.text[lang],
      unit: entry.per ? `${entry.per} ${unit(entry.unit)}` : unit(entry.unit),
      minutesPerUnit: entry.minutes,
    });

    const tools: Tool<object>[] = [
      {
        name: "list_items",
        description: text.listItems,
        parameters: object({ offset: { type: "integer", minimum: 0, description: text.offset } }, ["offset"]),
        run: (args) => {
          const offset = offsetOf(args.offset);
          return ok({
            total: fixture.items.length,
            items: fixture.items.slice(offset, offset + PAGE).map((item) => ({ id: item.id, shortText: item.short[lang], quantity: item.quantity, unit: unit(item.unit) })),
            next: offset + PAGE < fixture.items.length ? offset + PAGE : null,
          });
        },
      },
      {
        name: "get_item",
        description: text.getItem,
        parameters: object({ itemId: { type: "string", description: text.itemId } }, ["itemId"]),
        run: (args) => {
          const item = fixture.items.find(({ id }) => ordinal(id) === ordinal(args.itemId));
          return item
            ? ok({ id: item.id, shortText: item.short[lang], longText: item.long[lang], quantity: item.quantity, unit: unit(item.unit) })
            : refuse("item", args.itemId);
        },
      },
      {
        name: "read_site_description",
        description: text.site,
        parameters: object({ section: { type: "integer", minimum: 1 } }),
        run: (args) => {
          if (args.section === undefined || args.section === null)
            return ok({ title: fixture.project[lang], sections: fixture.site.map((section, index) => ({ number: index + 1, title: section.title[lang] })) });
          const section = fixture.site[Number(args.section) - 1];
          return section ? ok({ number: Number(args.section), title: section.title[lang], text: section.text[lang] }) : refuse("section", args.section);
        },
      },
      {
        name: "read_catalog_rules",
        description: text.rules,
        parameters: object({}),
        run: () => ok({ text: fixture.rules[lang] }),
      },
      {
        name: "search_catalog",
        description: text.search,
        parameters: object({ query: { type: "string", description: text.query } }, ["query"]),
        run: (args) => {
          const query = String(args.query ?? "").trim().toLowerCase();
          const byCode = fixture.catalog.filter((entry) => query && entry.code.toLowerCase().startsWith(query));
          const wanted = tokens(query);
          const results = (
            byCode.length
              ? byCode
              : fixture.catalog
                  .map((entry) => ({ entry, score: wanted.filter((token) => `${entry.code.toLowerCase()} ${tokens(entry.text[lang]).join(" ")}`.includes(token)).length }))
                  .filter(({ score }) => score > 0)
                  .sort((a, b) => b.score - a.score || a.entry.code.localeCompare(b.entry.code))
                  .map(({ entry }) => entry)
          )
            .slice(0, 8)
            .map(entryView);
          return ok({ results });
        },
      },
      {
        name: "get_catalog_entry",
        description: text.entry,
        parameters: object({ code: { type: "string" } }, ["code"]),
        run: (args) => {
          const entry = fixture.catalog.find(({ code }) => code.toLowerCase() === String(args.code ?? "").trim().toLowerCase());
          return entry ? ok({ ...entryView(entry), ...(entry.note ? { note: entry.note[lang] } : {}) }) : refuse("entry", args.code);
        },
      },
      {
        name: "list_projects",
        description: text.projects,
        parameters: object({}),
        run: () =>
          ok({
            projects: fixture.projects.map((project) => ({ id: project.id, name: project.name[lang], year: project.year, conditions: project.conditions[lang], items: project.items.length })),
          }),
      },
      {
        name: "get_project",
        description: text.project,
        parameters: object({ projectId: { type: "string" }, offset: { type: "integer", minimum: 0, description: text.offset } }, ["projectId"]),
        run: (args) => {
          const index = fixture.projects.findIndex(({ id }) => id.toLowerCase() === String(args.projectId ?? "").trim().toLowerCase());
          const project = fixture.projects[index];
          if (!project) return refuse("project", args.projectId);
          const offset = offsetOf(args.offset);
          return ok({
            id: project.id,
            name: project.name[lang],
            year: project.year,
            conditions: project.conditions[lang],
            total: project.items.length,
            items: project.items.slice(offset, offset + PAGE).map((item, i) => ({
              pos: offset + i + 1,
              text: item.text[lang],
              quantity: item.quantity,
              unit: unit(item.unit),
              catalogCodes: item.lines.map(({ code }) => code),
              ...(item.note ? { note: item.note[lang] } : {}),
              actualHours: bookings[index]![offset + i],
            })),
            next: offset + PAGE < project.items.length ? offset + PAGE : null,
          });
        },
      },
    ];

    return {
      id: `hours-${fixture.slug}-${lang}`,
      track: "hours",
      lang,
      title: fixture.title,
      description: fixture.description,
      system: text.system(fixture.company[lang]),
      prompt: text.prompt(fixture.items.length, fixture.project[lang]),
      init: () => ({}),
      tools,
      answer: {
        description: text.answer,
        schema: object(
          {
            items: {
              type: "array",
              items: object({ itemId: { type: "string", description: text.itemId }, hours: { type: "number", description: text.hours } }, ["itemId", "hours"]),
            },
            totalHours: { type: "number", description: text.totalHours },
            notes: { type: "string", description: text.notes },
          },
          ["items", "totalHours"],
        ),
      },
      maxTurns: 60,
      grade: (answer) => {
        const given = new Map<string, number | undefined>();
        for (const row of Array.isArray(answer?.items) ? answer.items : [])
          if (row && typeof row === "object") given.set(ordinal(row.itemId), toNumber(row.hours));
        const checks: Record<string, number | { score: number; weight: number }> = {};
        const deviations: number[] = [];
        fixture.items.forEach((item, i) => {
          const estimate = given.get(ordinal(item.id));
          checks[`${item.id} ${item.trap}`] = deviationScore(estimate, actual[i]!, FACTOR);
          deviations.push(Math.min(1, relativeDeviation(estimate, actual[i]!)));
        });
        const total = toNumber(answer?.totalHours);
        checks["total hours"] = { score: deviationScore(total, actualTotal, FACTOR), weight: TOTAL_WEIGHT };
        return {
          checks,
          metrics: {
            itemDeviationPct: mean(deviations) * 100,
            itemsWithin10Pct: mean(deviations.map((deviation) => (deviation <= 0.1 ? 1 : 0))) * 100,
            totalDeviationPct: Math.min(1, relativeDeviation(total, actualTotal)) * 100,
          },
        };
      },
      reference: { items: fixture.items.map((item, i) => ({ itemId: item.id, hours: actual[i]! })), totalHours: actualTotal },
    };
  };
