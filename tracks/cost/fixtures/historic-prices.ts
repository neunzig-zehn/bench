/**
 * A price database of awarded unit prices from past projects, a construction price index by trade
 * group, regional factors, a cost-estimating guideline, and a new LV to estimate from them, in German
 * or English. Records are generated from a seed around each Item's true price, so the guideline's
 * estimate is known by construction.
 */
import type { Lang } from "../../../src/types";
import { formatNumber, pick, round2, type Doc } from "../shared";

type Group = "structure" | "finishing";
const FIRST_YEAR = 2021;
const INDEX: Record<Group, number[]> = {
  structure: [96.0, 99.2, 101.6, 103.2, 110.4, 118.9, 121.7, 123.5, 126.0, 126.8, 127.3, 127.9, 129.1, 129.8, 130.6, 131.2, 132.5, 133.4, 134.1, 134.9, 136.3, 137.2, 138.0],
  finishing: [97.1, 99.5, 101.0, 102.4, 107.6, 113.8, 117.2, 119.6, 122.9, 124.1, 125.3, 126.0, 127.7, 128.9, 130.0, 130.8, 132.6, 133.9, 135.0, 136.1, 137.9, 139.2, 140.3],
};
const TARGET_QUARTER = 22;
const REGIONS: Record<string, number> = {
  Leipzig: 0.94,
  Dresden: 0.95,
  Berlin: 1.03,
  Hamburg: 1.09,
  Stuttgart: 1.12,
  Hannover: 0.99,
  Erfurt: 0.91,
  Magdeburg: 0.9,
  Rostock: 0.93,
  Düsseldorf: 1.06,
  Bremen: 1.01,
};
const TARGET_REGION = "Leipzig";
const CUTOFF = "2022-07";
const VAT = 1.19;

const quarterOf = (date: string) => (Number(date.slice(0, 4)) - FIRST_YEAR) * 4 + Math.floor((Number(date.slice(5, 7)) - 1) / 3);

type Variant = { de: string; en: string };
type ItemSpec = {
  key: string;
  /** Items of the same work share their price records. */
  work?: string;
  ordinal: string;
  trade: Variant;
  group: Group;
  quantity: number;
  unit: string;
  truePrice: number;
  short: Variant;
  text: Variant;
  other: Variant & { factor: number };
  near?: Variant & { factor: number };
  otherUnit?: { unit: string; factor: number };
  okCount: number;
};
const TRADES = {
  masonry: { de: "Mauerarbeiten", en: "Masonry" },
  concrete: { de: "Beton- und Stahlbetonarbeiten", en: "Concrete and reinforced concrete" },
  screed: { de: "Estricharbeiten", en: "Screed" },
  plaster: { de: "Putzarbeiten", en: "Plastering" },
  drywall: { de: "Trockenbauarbeiten", en: "Drywall" },
  painting: { de: "Malerarbeiten", en: "Painting" },
  flooring: { de: "Bodenbelagarbeiten", en: "Floor covering" },
  tiling: { de: "Fliesenarbeiten", en: "Tiling" },
};
const ITEM_SPECS: ItemSpec[] = [
  {
    key: "ks175",
    ordinal: "01.01",
    trade: TRADES.masonry,
    group: "structure",
    quantity: 820,
    unit: "m²",
    truePrice: 62.5,
    short: { de: "KS-Mauerwerk d = 17,5 cm, Haus A", en: "Sand-lime masonry t = 17.5 cm, building A" },
    text: { de: "Mauerwerk aus Kalksandstein KS 20-2,0, d = 17,5 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 20-2.0, t = 17.5 cm, thin-bed mortar" },
    other: { de: "Mauerwerk aus Kalksandstein KS 20-2,0, d = 11,5 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 20-2.0, t = 11.5 cm, thin-bed mortar", factor: 0.78 },
    near: { de: "Mauerwerk aus Kalksandstein KS 12-1,8, d = 17,5 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 12-1.8, t = 17.5 cm, thin-bed mortar", factor: 0.94 },
    otherUnit: { unit: "m³", factor: 1 / 0.175 },
    okCount: 5,
  },
  {
    key: "ks24",
    ordinal: "01.02",
    trade: TRADES.masonry,
    group: "structure",
    quantity: 460,
    unit: "m²",
    truePrice: 78.4,
    short: { de: "KS-Mauerwerk d = 24 cm", en: "Sand-lime masonry t = 24 cm" },
    text: { de: "Mauerwerk aus Kalksandstein KS 20-2,0, d = 24 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 20-2.0, t = 24 cm, thin-bed mortar" },
    other: { de: "Mauerwerk aus Kalksandstein KS 20-2,0, d = 30 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 20-2.0, t = 30 cm, thin-bed mortar", factor: 1.2 },
    otherUnit: { unit: "m³", factor: 1 / 0.24 },
    okCount: 4,
  },
  {
    key: "c3037",
    ordinal: "01.03",
    trade: TRADES.concrete,
    group: "structure",
    quantity: 210,
    unit: "m³",
    truePrice: 168,
    short: { de: "Beton C30/37 Bodenplatte", en: "Concrete C30/37 ground slab" },
    text: { de: "Beton C30/37 für Bodenplatte, d = 30 cm, einbauen und verdichten", en: "Concrete C30/37 for ground slab, t = 30 cm, place and compact" },
    other: { de: "Beton C25/30 für Bodenplatte, d = 30 cm, einbauen und verdichten", en: "Concrete C25/30 for ground slab, t = 30 cm, place and compact", factor: 0.93 },
    okCount: 5,
  },
  {
    key: "rebar",
    ordinal: "01.04",
    trade: TRADES.concrete,
    group: "structure",
    quantity: 38,
    unit: "t",
    truePrice: 1720,
    short: { de: "Betonstahl B500B", en: "Reinforcing steel B500B" },
    text: { de: "Betonstahl B500B, liefern, schneiden, biegen und verlegen", en: "Reinforcing steel B500B, supply, cut, bend and place" },
    other: { de: "Betonstahlmatten B500A, liefern und verlegen", en: "Reinforcing steel mesh B500A, supply and place", factor: 0.9 },
    otherUnit: { unit: "kg", factor: 1 / 1000 },
    okCount: 4,
  },
  {
    key: "ks175b",
    work: "ks175",
    ordinal: "01.05",
    trade: TRADES.masonry,
    group: "structure",
    quantity: 300,
    unit: "m²",
    truePrice: 62.5,
    short: { de: "KS-Mauerwerk d = 17,5 cm, Haus B", en: "Sand-lime masonry t = 17.5 cm, building B" },
    text: { de: "Mauerwerk aus Kalksandstein KS 20-2,0, d = 17,5 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 20-2.0, t = 17.5 cm, thin-bed mortar" },
    other: { de: "Mauerwerk aus Kalksandstein KS 20-2,0, d = 11,5 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 20-2.0, t = 11.5 cm, thin-bed mortar", factor: 0.78 },
    near: { de: "Mauerwerk aus Kalksandstein KS 12-1,8, d = 17,5 cm, Dünnbettmörtel", en: "Sand-lime brick masonry KS 12-1.8, t = 17.5 cm, thin-bed mortar", factor: 0.94 },
    otherUnit: { unit: "m³", factor: 1 / 0.175 },
    okCount: 4,
  },
  {
    key: "screed",
    ordinal: "02.01",
    trade: TRADES.screed,
    group: "finishing",
    quantity: 1450,
    unit: "m²",
    truePrice: 24.8,
    short: { de: "Zementestrich CT-C25-F4, 50 mm", en: "Cement screed CT-C25-F4, 50 mm" },
    text: { de: "Zementestrich CT-C25-F4, d = 50 mm, auf Trennlage", en: "Cement screed CT-C25-F4, t = 50 mm, on separating layer" },
    other: { de: "Zementestrich CT-C25-F4, d = 65 mm, schwimmend auf Dämmung", en: "Cement screed CT-C25-F4, t = 65 mm, floating on insulation", factor: 1.22 },
    near: { de: "Zementestrich CT-C30-F5, d = 50 mm, auf Trennlage", en: "Cement screed CT-C30-F5, t = 50 mm, on separating layer", factor: 1.08 },
    okCount: 5,
  },
  {
    key: "plaster",
    ordinal: "02.02",
    trade: TRADES.plaster,
    group: "finishing",
    quantity: 3200,
    unit: "m²",
    truePrice: 19.6,
    short: { de: "Innenputz Kalkgips, einlagig", en: "Interior plaster lime-gypsum, single layer" },
    text: { de: "Innenputz Kalkgips, einlagig, d = 15 mm, Q2", en: "Interior plaster lime-gypsum, single layer, t = 15 mm, Q2" },
    other: { de: "Innenputz Kalkzement, zweilagig, d = 20 mm, Q2", en: "Interior plaster lime-cement, two layers, t = 20 mm, Q2", factor: 1.35 },
    okCount: 4,
  },
  {
    key: "w112",
    ordinal: "02.03",
    trade: TRADES.drywall,
    group: "finishing",
    quantity: 640,
    unit: "m²",
    truePrice: 71.3,
    short: { de: "Metallständerwand W112", en: "Metal stud partition W112" },
    text: { de: "Metallständerwand W112, d = 125 mm, CW 75, beidseitig doppelt beplankt", en: "Metal stud partition W112, t = 125 mm, CW 75, double-boarded both sides" },
    other: { de: "Metallständerwand W111, d = 100 mm, CW 75, beidseitig einfach beplankt", en: "Metal stud partition W111, t = 100 mm, CW 75, single-boarded both sides", factor: 0.72 },
    okCount: 5,
  },
  {
    key: "paint",
    ordinal: "02.04",
    trade: TRADES.painting,
    group: "finishing",
    quantity: 5400,
    unit: "m²",
    truePrice: 5.85,
    short: { de: "Dispersionsanstrich Wände", en: "Emulsion paint walls" },
    text: { de: "Dispersionsanstrich Wände, Nassabriebklasse 2, zweifach", en: "Emulsion paint on walls, wet abrasion class 2, two coats" },
    other: { de: "Dispersionsanstrich Decken, Nassabriebklasse 3, einfach", en: "Emulsion paint on ceilings, wet abrasion class 3, one coat", factor: 0.6 },
    near: { de: "Dispersionsanstrich Wände, Nassabriebklasse 3, zweifach", en: "Emulsion paint on walls, wet abrasion class 3, two coats", factor: 0.92 },
    okCount: 4,
  },
  {
    key: "lino",
    ordinal: "02.05",
    trade: TRADES.flooring,
    group: "finishing",
    quantity: 980,
    unit: "m²",
    truePrice: 38.9,
    short: { de: "Linoleum 2,5 mm", en: "Linoleum 2.5 mm" },
    text: { de: "Linoleumbelag 2,5 mm, vollflächig verkleben, Nähte verschweißen", en: "Linoleum flooring 2.5 mm, fully bonded, seams welded" },
    other: { de: "Linoleumbelag 3,2 mm, vollflächig verkleben, Nähte verschweißen", en: "Linoleum flooring 3.2 mm, fully bonded, seams welded", factor: 1.15 },
    okCount: 5,
  },
  {
    key: "tiles",
    ordinal: "02.06",
    trade: TRADES.tiling,
    group: "finishing",
    quantity: 420,
    unit: "m²",
    truePrice: 74.2,
    short: { de: "Wandfliesen 30 × 60 cm", en: "Wall tiles 30 × 60 cm" },
    text: { de: "Wandfliesen 30 × 60 cm, Dünnbett, inkl. Verfugung", en: "Wall tiles 30 × 60 cm, thin bed, incl. grouting" },
    other: { de: "Wandfliesen 20 × 20 cm, Dünnbett, inkl. Verfugung", en: "Wall tiles 20 × 20 cm, thin bed, incl. grouting", factor: 0.9 },
    near: { de: "Wandfliesen 30 × 60 cm, Dickbett, inkl. Verfugung", en: "Wall tiles 30 × 60 cm, thick bed, incl. grouting", factor: 1.12 },
    okCount: 4,
  },
];

type Kind = "ok" | "gross" | "other" | "near" | "old" | "quantity" | "changeOrder" | "unit" | "edge" | "scope" | "outlier";
export type PriceRecord = {
  id: string;
  item: string;
  kind: Kind;
  variant: "text" | "other" | "near";
  unit: string;
  quantity: number;
  unitPrice: number;
  date: string;
  region: string;
  gross: boolean;
  changeOrder: boolean;
  scope: "" | "scaffold" | "supplied";
};

let seed = 2610;
const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const between = (low: number, high: number) => low + random() * (high - low);
const monthAt = (start: string, months: number) => {
  const total = Number(start.slice(0, 4)) * 12 + Number(start.slice(5, 7)) - 1 + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
};
const regionNames = Object.keys(REGIONS);
/** Boundary cases by Item: the first award month allowed, the month before, a quantity on the band's edge, one just outside. */
const EDGES = ["dateIn", "dateOut", "quantityIn", "quantityOut"] as const;
const generated: Omit<PriceRecord, "id">[] = ITEM_SPECS.flatMap((spec, index) => {
  const kinds: Kind[] = [
    ...Array<Kind>(spec.okCount).fill("ok"),
    "gross",
    "other",
    ...(spec.near ? (["near"] as Kind[]) : []),
    "old",
    "quantity",
    "changeOrder",
    "edge",
    ...(index % 2 === 0 ? (["scope"] as Kind[]) : []),
    ...(index % 3 === 0 ? (["outlier"] as Kind[]) : []),
    ...(spec.otherUnit ? (["unit"] as Kind[]) : []),
  ];
  const edge = EDGES[index % EDGES.length]!;
  return kinds.map((kind) => {
    const date =
      kind === "old"
        ? monthAt("2021-01", Math.floor(between(0, 17)))
        : kind === "edge" && edge === "dateIn"
          ? CUTOFF
          : kind === "edge" && edge === "dateOut"
            ? monthAt(CUTOFF, -1)
            : monthAt(CUTOFF, Math.floor(between(0, 51)));
    const region = regionNames[Math.floor(between(0, regionNames.length))]!;
    const small = random() < 0.5;
    const ratio =
      kind === "quantity"
        ? small
          ? between(0.15, 0.42)
          : between(2.4, 4)
        : kind === "edge" && edge === "quantityIn"
          ? small
            ? 0.5
            : 2
          : between(0.55, 1.9);
    const step = spec.unit === "t" ? 0.1 : 1;
    const rounded = Math.round((spec.quantity * ratio) / step) * step;
    const quantity = Math.round((kind === "edge" && edge === "quantityOut" ? (small ? spec.quantity * 0.5 - step : spec.quantity * 2 + step) : rounded) * 10) / 10;
    const scope = kind === "scope" ? (index % 4 === 0 ? "scaffold" : "supplied") : "";
    const factor =
      (kind === "other" ? spec.other.factor : 1) *
      (kind === "near" ? spec.near!.factor : 1) *
      (kind === "quantity" ? (small ? 1.15 : 0.9) : 1) *
      (kind === "changeOrder" ? 1.25 : 1) *
      (kind === "outlier" ? (index % 2 ? 0.62 : 1.45) : 1) *
      (kind === "gross" ? VAT : 1) *
      (scope === "scaffold" ? 1.12 : scope === "supplied" ? 0.55 : 1) *
      (kind === "unit" ? spec.otherUnit!.factor : 1);
    const price =
      spec.truePrice * (INDEX[spec.group][quarterOf(date)]! / INDEX[spec.group][TARGET_QUARTER]!) * (REGIONS[region]! / REGIONS[TARGET_REGION]!) * between(0.9, 1.1) * factor;
    return {
      item: spec.key,
      kind,
      variant: kind === "other" ? "other" : kind === "near" ? "near" : "text",
      unit: kind === "unit" ? spec.otherUnit!.unit : spec.unit,
      quantity: kind === "unit" && spec.otherUnit!.unit === "kg" ? quantity * 1000 : kind === "unit" ? Math.round(quantity * 0.2) : quantity,
      unitPrice: round2(price),
      date,
      region,
      gross: kind === "gross",
      changeOrder: kind === "changeOrder",
      scope,
    };
  });
});
const order = generated.map((record) => ({ record, key: random() })).sort((a, b) => a.key - b.key);
export const RECORDS: PriceRecord[] = order
  .map(({ record }, index) => ({ id: `P-${String(1001 + index * 7)}`, ...record }))
  .sort((a, b) => a.id.localeCompare(b.id));

/** Whether the guideline admits a record for an Item, and its normalized net price. */
export const normalized = (spec: ItemSpec, record: PriceRecord) => {
  const workOf = (key: string) => {
    const owner = ITEM_SPECS.find((candidate) => candidate.key === key)!;
    return owner.work ?? owner.key;
  };
  const eligible =
    workOf(record.item) === workOf(spec.key) &&
    record.variant === "text" &&
    record.unit === spec.unit &&
    record.date >= CUTOFF &&
    record.quantity >= 0.5 * spec.quantity &&
    record.quantity <= 2 * spec.quantity &&
    !record.changeOrder &&
    !record.scope;
  const price =
    (((record.gross ? record.unitPrice / VAT : record.unitPrice) * INDEX[spec.group][TARGET_QUARTER]!) / INDEX[spec.group][quarterOf(record.date)]!) *
    (REGIONS[TARGET_REGION]! / REGIONS[record.region]!);
  return { eligible, price };
};
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};
export const OUTLIER = 20;
export const GOLD = ITEM_SPECS.map((spec) => {
  const admitted = RECORDS.map((record) => normalized(spec, record)).filter(({ eligible }) => eligible).map(({ price }) => price);
  const first = median(admitted);
  const prices = admitted.filter((price) => Math.abs(price / first - 1) <= OUTLIER / 100);
  return { ordinal: spec.ordinal, key: spec.key, quantity: spec.quantity, unitPrice: round2(median(prices)), admitted, first, eligible: prices.length };
});
export const TOTAL = round2(GOLD.reduce((sum, { quantity, unitPrice }) => sum + round2(quantity * unitPrice), 0));
export { ITEM_SPECS };

export const historicPrices = (lang: Lang) => {
  const t = pick(lang);
  const n = (value: number, decimals = 2) => formatNumber(lang, value, decimals);
  const quarter = (index: number) => `${t(["I", "II", "III", "IV"][index % 4]!, `Q${(index % 4) + 1}`)}/${FIRST_YEAR + Math.floor(index / 4)}`;
  const items = ITEM_SPECS.map((spec) => ({
    ordinal: spec.ordinal,
    short: spec.short[lang],
    long: spec.text[lang],
    trade: spec.trade[lang],
    quantity: spec.quantity,
    unit: spec.unit,
  }));
  const records = RECORDS.map((record) => {
    const spec = ITEM_SPECS.find(({ key }) => key === record.item)!;
    const notes = [
      record.gross ? t("Preis brutto inkl. 19 % USt", "gross price incl. 19 % VAT") : "",
      record.changeOrder ? t("Nachtragspreis", "change order price") : "",
      record.scope === "scaffold" ? t("inkl. Gerüststellung", "incl. scaffolding") : "",
      record.scope === "supplied" ? t("ohne Materiallieferung, Material vom Auftraggeber beigestellt", "without material supply, material provided by the client") : "",
    ].filter(Boolean);
    return {
      id: record.id,
      text: (record.variant === "other" ? spec.other : record.variant === "near" ? spec.near! : spec.text)[lang],
      trade: spec.trade[lang],
      unit: record.unit,
      quantity: record.quantity,
      unitPrice: record.unitPrice,
      awarded: record.date,
      region: record.region,
      note: notes.join("; "),
    };
  });
  const yearly = (series: number[], year: number) => series.slice(year * 4, year * 4 + 4).reduce((total, value) => total + value, 0) / 4;
  const indexRows = INDEX.structure
    .flatMap((value, index) => {
      const row = `| ${quarter(index)} | ${n(value, 1)} | ${n(INDEX.finishing[index]!, 1)} |`;
      if (index % 4 !== 3) return [row];
      const year = Math.floor(index / 4);
      return [row, `| ${t(`Jahresdurchschnitt ${FIRST_YEAR + year}`, `Annual average ${FIRST_YEAR + year}`)} | ${n(yearly(INDEX.structure, year), 1)} | ${n(yearly(INDEX.finishing, year), 1)} |`];
    })
    .join("\n");
  const groupTrades = (group: Group) =>
    [...new Set(ITEM_SPECS.filter((spec) => spec.group === group).map((spec) => spec.trade[lang]))].join(", ");
  const docs: Doc[] = [
    {
      id: "KER-01",
      title: t("Kostenermittlungsrichtlinie: Einheitspreise aus der Preisdatenbank", "Cost estimating guideline: unit prices from the price database"),
      pages: [
        t(
          `Ziel: Kostenstand ${quarter(TARGET_QUARTER)}, Region ${TARGET_REGION}, Preise netto.
1. Vergleichbarkeit: Verwende nur Datensätze derselben Leistung (gleiche Ausführung, Abmessung und Güte) mit derselben Einheit wie die LV-Position. Nennt der Hinweis eines Datensatzes zusätzliche oder fehlende Leistungsteile, ist er nicht vergleichbar.
2. Aktualität: nur Vergabepreise mit Vergabedatum ab Juli 2022.
3. Mengenband: nur Datensätze, deren Menge zwischen 50 % und 200 % der LV-Menge liegt, Grenzen eingeschlossen.
4. Nachtragspreise sind keine Wettbewerbspreise und bleiben unberücksichtigt.
5. Als brutto gekennzeichnete Preise (inkl. 19 % USt) zuerst durch 1,19 teilen.
6. Indexierung: Preis × Index ${quarter(TARGET_QUARTER)} / Index des Quartals, in dem das Vergabedatum liegt. Verwende die Indexreihe der Gewerkgruppe der Leistung (siehe Baupreisindex).
7. Regionalisierung: × Regionalfaktor ${TARGET_REGION} / Regionalfaktor der Region des Datensatzes.
8. Median: bei gerader Anzahl das arithmetische Mittel der beiden mittleren Werte.
9. Ausreißer: Ein normierter Preis, der um mehr als ${OUTLIER} % vom Median aller zulässigen normierten Preise der Position abweicht, bleibt unberücksichtigt.
10. EP = Median der übrigen normierten Preise. Zwischenwerte nicht runden; den EP kaufmännisch auf 2 Nachkommastellen runden.
11. Kostenschätzung gesamt = Summe aus Menge × EP, jeder Gesamtpreis auf 2 Nachkommastellen gerundet.`,
          `Target: cost basis ${quarter(TARGET_QUARTER)}, region ${TARGET_REGION}, net prices.
1. Comparability: use only records of the same work (same execution, dimensions, and grade) in the same unit as the LV Item. A record whose note names additional or missing parts of the work is not comparable.
2. Recency: only prices awarded in July 2022 or later.
3. Quantity band: only records whose quantity lies between 50 % and 200 % of the LV quantity, bounds included.
4. Change order prices are not competitive prices and are left out.
5. Divide prices marked as gross (incl. 19 % VAT) by 1.19 first.
6. Indexation: price × index ${quarter(TARGET_QUARTER)} / index of the quarter the award date falls in. Use the index series of the work's trade group (see the construction price index).
7. Regionalisation: × regional factor ${TARGET_REGION} / regional factor of the record's region.
8. Median: for an even count, the arithmetic mean of the two middle values.
9. Outliers: a normalised price that deviates by more than ${OUTLIER} % from the median of all admissible normalised prices of the Item is left out.
10. Unit price = the median of the remaining normalised prices. Do not round intermediate values; round the unit price commercially to 2 decimals.
11. Total estimate = the sum of quantity × unit price, each line total rounded to 2 decimals.`,
        ),
      ],
    },
    {
      id: "BPI-2026",
      title: t("Baupreisindex nach Gewerkgruppen (2021 = 100)", "Construction price index by trade group (2021 = 100)"),
      pages: [
        `${t("Gewerkgruppe Rohbau", "Trade group structural work")}: ${groupTrades("structure")}
${t("Gewerkgruppe Ausbau", "Trade group finishing work")}: ${groupTrades("finishing")}

| ${t("Quartal", "Quarter")} | ${t("Rohbau", "Structural work")} | ${t("Ausbau", "Finishing work")} |
|---|---|---|
${indexRows}`,
      ],
    },
    {
      id: "RF-2026",
      title: t("Regionalfaktoren (Bundesdurchschnitt = 1,00)", "Regional factors (national average = 1.00)"),
      pages: [
        `| ${t("Region", "Region")} | ${t("Faktor", "Factor")} |
|---|---|
${Object.entries(REGIONS)
  .map(([region, factor]) => `| ${region} | ${n(factor)} |`)
  .join("\n")}`,
      ],
    },
  ];
  return { items, records, docs };
};
