/**
 * Contract terms from nine tender documents (invitation, BVB, ZVB, preliminary notes, ATV excerpt,
 * three bidder information letters, a holiday calendar), read through list, read, and search
 * tools. Traps: the order of precedence in the invitation decides conflicts; bidder information
 * moves the tender deadline (so the binding period of 60 calendar days moves with it), extends the
 * interim deadline in working days (Monday to Saturday without holidays, so it has to be counted),
 * moves the completion date, admits equivalent door handles until a later letter withdraws that,
 * and makes scaffolds above 2 m separate again; the BVB's penalty, defect security, and limitation
 * period beat the ZVB's; the preliminary notes make samples included although the ATV lists them
 * as special works; Saturday work is included by the BVB; floor protection is regulated only by
 * the ATV. Graded per field: dates, penalty, securities, limitation periods, each prescribed
 * product and whether an equivalent is allowed, and each service as included or separate.
 */
import { normalizeText, toNumber } from "../../src/score";
import type { Check, Lang, Task, Tool } from "../../src/types";
import { DOCUMENTS, PRODUCTS, SERVICES, TERMS, type Subject } from "./fixtures/contract";
import { byKey, integerArg, object, ok, percent, refuse } from "./shared";

type Answer = {
  offerDeadline: string;
  bindingPeriodEnd: string;
  executionStart: string;
  interimDeadline: string;
  completionDate: string;
  penalty: { percentPerDay: number; dayType: string; capPercent: number };
  securities: { performancePercent: number; warrantyPercent: number };
  warrantyYears: { general: number; doorClosers: number };
  products: Array<{ subject: Subject; manufacturer: string; product: string; equivalentAllowed: boolean }>;
  services: Array<{ id: string; classification: string }>;
};

const SUBJECTS: Record<Lang, Record<Subject, string>> = {
  de: { plasterboard: "Gipsplatten", fire_doors: "Brandschutztüren T30", lock_cylinders: "Profilzylinder", door_handles: "Türdrücker", door_closers: "Türschließer" },
  en: { plasterboard: "plasterboard", fire_doors: "fire doors T30", lock_cylinders: "profile cylinders", door_handles: "door handles", door_closers: "door closers" },
};

const COPY = {
  de: {
    system: `Du bereitest für die Kalkulation die Vertragsbedingungen einer Ausschreibung auf, mit den Werkzeugen. Maßgeblich ist, was bei Zuschlag gilt: Wende die Rangfolge der Vertragsbestandteile aus den Vergabeunterlagen an.

Erfasse:
- offerDeadline (YYYY-MM-DDTHH:MM), bindingPeriodEnd, executionStart, interimDeadline, completionDate (YYYY-MM-DD),
- penalty: percentPerDay (Prozent je Tag, z. B. 0.5 für 0,5 %), dayType (working_day oder calendar_day), capPercent (Obergrenze in Prozent),
- securities: performancePercent (Vertragserfüllung) und warrantyPercent (Mängelansprüche) in Prozent,
- warrantyYears: general und doorClosers, die Verjährungsfristen für Mängelansprüche in Jahren,
- products: für jeden Gegenstand das vorgegebene Fabrikat (manufacturer, product) und ob ein gleichwertiges Fabrikat zulässig ist (equivalentAllowed),
- services: für jede Leistung, ob sie mit den Einheitspreisen abgegolten ist (included) oder gesondert vergütet wird (separate).
Reiche alles zusammen mit submit ein.`,
    prompt: (services: string, subjects: string) => `Bereite die Vertragsbedingungen für Los 3 (Trockenbau und Innentüren) der Ausschreibung LIN-2026-117 auf.

Fabrikate (subject): ${subjects}

Leistungen (id: Leistung):
${services}`,
    list: "Listet die Vergabeunterlagen mit Kennung, Titel, Datum und Seitenzahl.",
    read: "Liest eine Seite eines Dokuments.",
    search: "Sucht einen Text in allen Dokumenten (ohne Groß-/Kleinschreibung). Gibt bis zu 12 Treffer mit Dokument, Seite und Zeile zurück.",
    unknown: "Unbekanntes Dokument",
    noPage: "Seite gibt es nicht",
    answer: "Die geltenden Vertragsbedingungen.",
  },
  en: {
    system: `You prepare a tender's contract terms for estimating, using the tools. What counts is what applies at contract award: apply the order of precedence of the contract documents from the tender documents.

Capture:
- offerDeadline (YYYY-MM-DDTHH:MM), bindingPeriodEnd, executionStart, interimDeadline, completionDate (YYYY-MM-DD),
- penalty: percentPerDay (percent per day, e.g. 0.5 for 0.5 %), dayType (working_day or calendar_day), capPercent (cap in percent),
- securities: performancePercent (performance) and warrantyPercent (defect claims) in percent,
- warrantyYears: general and doorClosers, the limitation periods for defect claims in years,
- products: for each subject the specified product (manufacturer, product) and whether an equivalent product is allowed (equivalentAllowed),
- services: for each service whether it is covered by the unit prices (included) or paid separately (separate).
Submit everything together with submit.`,
    prompt: (services: string, subjects: string) => `Prepare the contract terms for lot 3 (drywall and internal doors) of tender LIN-2026-117.

Products (subject): ${subjects}

Services (id: service):
${services}`,
    list: "Lists the tender documents with id, title, date, and page count.",
    read: "Reads one page of a document.",
    search: "Searches all documents for a text, case-insensitive. Returns up to 12 hits with document, page, and line.",
    unknown: "Unknown document",
    noPage: "No such page",
    answer: "The contract terms in force.",
  },
};

const pad = (value: string) => value.padStart(2, "0");

/** A date read as ISO from `2027-08-13` or `13.08.2027`, empty when there is none. */
export const isoDate = (value: unknown) => {
  const text = String(value ?? "");
  const iso = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/u);
  if (iso) return `${iso[1]}-${pad(iso[2]!)}-${pad(iso[3]!)}`;
  const german = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/u);
  return german ? `${german[3]}-${pad(german[2]!)}-${pad(german[1]!)}` : "";
};

const clock = (value: unknown) => {
  const match = String(value ?? "").match(/(\d{1,2}):(\d{2})/u);
  return match ? `${pad(match[1]!)}:${match[2]}` : "";
};

const same = (value: unknown, expected: number) => toNumber(value) !== undefined && Math.abs(toNumber(value)! - expected) < 1e-9;

const contractTerms = (lang: Lang): Task<object, Answer> => {
  const copy = COPY[lang];
  const documents = DOCUMENTS[lang];
  const tools: Tool<object>[] = [
    {
      name: "list_documents",
      description: copy.list,
      parameters: object({}),
      run: () => ok(documents.map(({ id, title, date, pages }) => ({ id, title, date, pages: pages.length }))),
    },
    {
      name: "read_document",
      description: copy.read,
      parameters: object({ documentId: { type: "string" }, page: { type: "integer", minimum: 1 } }),
      run: (args) => {
        const document = documents.find(({ id }) => id === args.documentId);
        if (!document) return refuse(`${copy.unknown}: ${String(args.documentId)}`);
        const page = integerArg(args.page, 1, 0, document.pages.length + 1);
        const text = document.pages[page - 1];
        return text === undefined ? refuse(`${copy.noPage}: ${String(args.page)}`) : ok({ documentId: document.id, page, pages: document.pages.length, text });
      },
    },
    {
      name: "search_documents",
      description: copy.search,
      parameters: object({ query: { type: "string" } }),
      run: (args) => {
        const query = String(args.query ?? "").toLowerCase().trim();
        const hits = documents.flatMap((document) =>
          document.pages.flatMap((text, index) =>
            text
              .split("\n")
              .filter((line) => query && line.toLowerCase().includes(query))
              .map((line) => ({ documentId: document.id, page: index + 1, line: line.trim() })),
          ),
        );
        return ok({ total: hits.length, hits: hits.slice(0, 12) });
      },
    },
  ];
  const serviceIds = SERVICES.map(({ id }) => id);
  const subjects = PRODUCTS.map(({ subject }) => subject);
  const number = { type: "number" };
  const date = { type: "string" };
  return {
    id: `docs-contract-terms-${lang}`,
    track: "docs",
    lang,
    title: "Contract terms from tender documents",
    description:
      "Extracts the contract terms in force (dates, penalty, securities, limitation periods, prescribed products, and 10 services as included or separately paid) from nine tender documents read through list, read, and search tools. Traps: an order of precedence decides conflicts; bidder information moves the tender deadline (the 60-day binding period moves with it), extends the interim deadline by working days that must be counted over Saturdays and Easter holidays, moves the completion date, admits equivalent door handles until a later letter withdraws that, and makes scaffolds above 2 m separate again; BVB beats ZVB on penalty (per working day, cap), defect security, and limitation period; preliminary notes make samples included although the ATV lists them as special works; the BVB includes Saturday work; floor protection is regulated only by the ATV. Graded per field (32 checks).",
    system: copy.system,
    prompt: copy.prompt(
      SERVICES.map(({ id, label }) => `- ${id}: ${label[lang]}`).join("\n"),
      subjects.map((subject) => `${subject} (${SUBJECTS[lang][subject]})`).join(", "),
    ),
    init: () => ({}),
    tools,
    answer: {
      description: copy.answer,
      schema: object({
        offerDeadline: date,
        bindingPeriodEnd: date,
        executionStart: date,
        interimDeadline: date,
        completionDate: date,
        penalty: object({ percentPerDay: number, dayType: { type: "string", enum: ["working_day", "calendar_day"] }, capPercent: number }),
        securities: object({ performancePercent: number, warrantyPercent: number }),
        warrantyYears: object({ general: number, doorClosers: number }),
        products: {
          type: "array",
          items: object({ subject: { type: "string", enum: subjects }, manufacturer: { type: "string" }, product: { type: "string" }, equivalentAllowed: { type: "boolean" } }),
        },
        services: { type: "array", items: object({ id: { type: "string", enum: serviceIds }, classification: { type: "string", enum: ["included", "separate"] } }) },
      }),
    },
    grade: (answer) => {
      const checks: Record<string, Check> = {
        "offer deadline": isoDate(answer?.offerDeadline) === TERMS.offerDeadline.slice(0, 10) && clock(answer?.offerDeadline) === TERMS.offerDeadline.slice(11),
        "binding period end": isoDate(answer?.bindingPeriodEnd) === TERMS.bindingPeriodEnd,
        "execution start": isoDate(answer?.executionStart) === TERMS.executionStart,
        "interim deadline": isoDate(answer?.interimDeadline) === TERMS.interimDeadline,
        "completion date": isoDate(answer?.completionDate) === TERMS.completionDate,
        "penalty per day": same(answer?.penalty?.percentPerDay, TERMS.penalty.percentPerDay),
        "penalty day type": answer?.penalty?.dayType === TERMS.penalty.dayType,
        "penalty cap": same(answer?.penalty?.capPercent, TERMS.penalty.capPercent),
        "performance security": same(answer?.securities?.performancePercent, TERMS.securities.performancePercent),
        "defect security": same(answer?.securities?.warrantyPercent, TERMS.securities.warrantyPercent),
        "limitation period": same(answer?.warrantyYears?.general, TERMS.warrantyYears.general),
        "limitation period door closers": same(answer?.warrantyYears?.doorClosers, TERMS.warrantyYears.doorClosers),
      };
      const products = byKey(answer?.products, "subject");
      for (const gold of PRODUCTS) {
        const actual = products.get(gold.subject);
        const named = normalizeText(`${actual?.manufacturer ?? ""} ${actual?.product ?? ""}`);
        checks[`${gold.subject} product`] = actual !== undefined && named.includes(normalizeText(gold.manufacturer)) && named.includes(normalizeText(gold.product));
        checks[`${gold.subject} equivalent allowed`] = actual !== undefined && actual.equivalentAllowed === gold.equivalentAllowed;
      }
      const services = byKey(answer?.services, "id");
      for (const gold of SERVICES) checks[`service ${gold.id}`] = services.get(gold.id)?.classification === gold.gold;
      const precedence = [
        "offer deadline",
        "binding period end",
        "interim deadline",
        "completion date",
        "penalty per day",
        "penalty day type",
        "penalty cap",
        "defect security",
        "limitation period",
        "door_handles equivalent allowed",
        "service scaffold_over_2m",
        "service samples",
        "service saturday_work",
      ];
      return {
        checks,
        metrics: {
          servicesCorrectPct: percent(SERVICES.filter((gold) => checks[`service ${gold.id}`] === true).length, SERVICES.length),
          precedenceResolvedPct: percent(precedence.filter((name) => checks[name] === true).length, precedence.length),
        },
      };
    },
    reference: {
      ...TERMS,
      products: PRODUCTS,
      services: SERVICES.map(({ id, gold }) => ({ id, classification: gold })),
    },
  };
};

export const contractTermsTasks = (["de", "en"] as const).map(contractTerms);
