/**
 * A drywall contractor's costing documents (costing guideline, crew wage sheet, labour and material
 * norms, a builders' merchant offer, a subcontractor offer) and an LV to price from them, in German
 * or English. The unit prices follow from the documents by construction.
 */
import type { Lang } from "../../../src/types";
import { formatNumber, pick, round2, type Doc } from "../shared";

const SITE_OVERHEADS = { setup: 1850, containers: 2, containerWeek: 42, managementHours: 6, managementRate: 68, scaffoldWeeks: 5, scaffoldWeek: 95, skips: 3, skip: 380 };
const WEEKS = 16;
const GENERAL_OVERHEAD = 9;
const RISK_PROFIT = 5;
const MATERIAL_MARKUP = 10;
const SUBCONTRACT_MARKUP = 6;

const WAGES = { foreman: 24.3, skilled: 22.15, helper: 17.6, apprentice: 9.8, supervisor: 28.4 };
const SKILLED = 4;
const SUPERVISOR_SHARE = 0.25;
const ON_COSTS = 84;
const TRAVEL = 1.65;
const PRODUCTIVE = 1 + SKILLED + 1;
/** Average wage ASL, rounded to the cent as the guideline says. */
export const AVERAGE_WAGE = round2(
  ((WAGES.foreman + SKILLED * WAGES.skilled + WAGES.helper + SUPERVISOR_SHARE * WAGES.supervisor) / PRODUCTIVE) * (1 + ON_COSTS / 100) + TRAVEL,
);

type Material = {
  articleNo: string;
  de: string;
  en: string;
  price: number;
  unitDe: string;
  unitEn: string;
  per: number;
  insulation?: boolean;
  tier?: { from: number; price: number; de: string; en: string };
};
const MATERIALS = {
  gkb: { articleNo: "GK-1220", de: "Gipskartonplatte GKB (Typ A) 12,5 mm, 1250 × 2000 mm", en: "Gypsum plasterboard GKB (type A) 12.5 mm, 1250 × 2000 mm", price: 6.4, unitDe: "Platte (2,50 m²)", unitEn: "board (2.50 m²)", per: 2.5 },
  gkb26: { articleNo: "GK-1226", de: "Gipskartonplatte GKB (Typ A) 12,5 mm, 1250 × 2600 mm", en: "Gypsum plasterboard GKB (type A) 12.5 mm, 1250 × 2600 mm", price: 8.3, unitDe: "Platte (3,25 m²)", unitEn: "board (3.25 m²)", per: 3.25 },
  gkf: { articleNo: "GK-2220", de: "Gipskarton-Feuerschutzplatte GKF (Typ DF) 12,5 mm, 1250 × 2000 mm", en: "Fire-resistant gypsum board GKF (type DF) 12.5 mm, 1250 × 2000 mm", price: 8.9, unitDe: "Platte (2,50 m²)", unitEn: "board (2.50 m²)", per: 2.5, tier: { from: 250, price: 8.2, de: "Platten", en: "boards" } },
  gkbi: { articleNo: "GK-3220", de: "Gipskartonplatte imprägniert GKBI (Typ H2) 12,5 mm, 1250 × 2000 mm", en: "Moisture-resistant gypsum board GKBI (type H2) 12.5 mm, 1250 × 2000 mm", price: 8.1, unitDe: "Platte (2,50 m²)", unitEn: "board (2.50 m²)", per: 2.5 },
  cw75: { articleNo: "PR-0751", de: "CW-Profil 75 × 50 × 0,6 mm, Länge 2600 mm", en: "CW stud 75 × 50 × 0.6 mm, length 2600 mm", price: 248, unitDe: "100 m", unitEn: "100 m", per: 100 },
  uw75: { articleNo: "PR-0752", de: "UW-Profil 75 × 40 × 0,6 mm, Länge 4000 mm", en: "UW track 75 × 40 × 0.6 mm, length 4000 mm", price: 212, unitDe: "100 m", unitEn: "100 m", per: 100 },
  cw50: { articleNo: "PR-0501", de: "CW-Profil 50 × 50 × 0,6 mm, Länge 2600 mm", en: "CW stud 50 × 50 × 0.6 mm, length 2600 mm", price: 196, unitDe: "100 m", unitEn: "100 m", per: 100 },
  uw50: { articleNo: "PR-0502", de: "UW-Profil 50 × 40 × 0,6 mm, Länge 4000 mm", en: "UW track 50 × 40 × 0.6 mm, length 4000 mm", price: 171, unitDe: "100 m", unitEn: "100 m", per: 100 },
  cd: { articleNo: "PR-0627", de: "CD-Profil 60 × 27 × 0,6 mm, Länge 4000 mm", en: "CD channel 60 × 27 × 0.6 mm, length 4000 mm", price: 165, unitDe: "100 m", unitEn: "100 m", per: 100 },
  hanger: { articleNo: "AB-0060", de: "Schnellabhänger für CD 60/27", en: "Quick hanger for CD 60/27", price: 34.5, unitDe: "100 St", unitEn: "100 pcs", per: 100 },
  mw60: { articleNo: "DS-0060", de: "Mineralwolle-Trennwandplatte 60 mm, WLS 040", en: "Mineral wool partition slab 60 mm, λ 0.040", price: 28.8, unitDe: "Paket (7,20 m²)", unitEn: "pack (7.20 m²)", per: 7.2, insulation: true, tier: { from: 100, price: 26.4, de: "Paketen", en: "packs" } },
  mw40: { articleNo: "DS-0040", de: "Mineralwolle-Trennwandplatte 40 mm, WLS 040", en: "Mineral wool partition slab 40 mm, λ 0.040", price: 27.84, unitDe: "Paket (9,60 m²)", unitEn: "pack (9.60 m²)", per: 9.6, insulation: true },
  s25: { articleNo: "SC-3525", de: "Schnellbauschraube 3,5 × 25 mm", en: "Drywall screw 3.5 × 25 mm", price: 9.8, unitDe: "1.000 St", unitEn: "1,000 pcs", per: 1000 },
  s35: { articleNo: "SC-3535", de: "Schnellbauschraube 3,5 × 35 mm", en: "Drywall screw 3.5 × 35 mm", price: 12.4, unitDe: "1.000 St", unitEn: "1,000 pcs", per: 1000 },
  filler: { articleNo: "SP-0025", de: "Fugenspachtel, Sack 25 kg", en: "Joint filler, 25 kg bag", price: 24.5, unitDe: "Sack (25 kg)", unitEn: "bag (25 kg)", per: 25 },
  edge: { articleNo: "KS-0250", de: "Kantenschutzprofil, Stange 2,50 m", en: "Corner bead, 2.50 m length", price: 1.95, unitDe: "Stange (2,50 m)", unitEn: "length (2.50 m)", per: 2.5 },
  hatch30: { articleNo: "RK-0300", de: "Revisionsklappe 300 × 300 mm, mit GK-Einlage", en: "Access panel 300 × 300 mm, with board insert", price: 38.5, unitDe: "St", unitEn: "pc", per: 1 },
  hatch40: { articleNo: "RK-0400", de: "Revisionsklappe 400 × 400 mm, mit GK-Einlage", en: "Access panel 400 × 400 mm, with board insert", price: 49.9, unitDe: "St", unitEn: "pc", per: 1 },
} satisfies Record<string, Material>;
type MaterialKey = keyof typeof MATERIALS;
const DISCOUNT = 12;
/** Net price per unit of need; a tier price applies when the base Items together need its quantity. */
const materialPrice = (key: MaterialKey) => {
  const material: Material = MATERIALS[key];
  const tiered = material.tier && (TOTAL_NEEDS[key] ?? 0) / material.per >= material.tier.from;
  return ((tiered ? material.tier!.price : material.price) / material.per) * (material.insulation ? 1 : 1 - DISCOUNT / 100);
};

type Board = "gkb" | "gkf" | "gkbi";
type Finish = "Q2" | "Q3";
type Assembly =
  | { kind: "wall"; studs: 75 | 50; layers: 1 | 2; board: Board; insulation?: "mw60" | "mw40"; finish: Finish[]; tall?: boolean }
  | { kind: "ceiling"; tall: boolean }
  | { kind: "edge" | "hatch" | "door" | "subcontract" | "daywork" };
type Needs = Partial<Record<MaterialKey, number>>;

const LABOUR = { wallFrame: 0.22, wallLayer: 0.14, insulation: 0.05, ceilingFrame: 0.26, ceilingLayer: 0.2, Q2: 0.08, Q3: 0.14 };
const NEED = { layer: 1.05, singleScrews: 13, innerScrews: 6, outerScrews: 13, ceilingScrews: 17, insulation: 1, Q2: 0.3, Q3: 0.5, ceilingFiller: 0.35 };
const FRAMES = { 75: { cw75: 2, uw75: 0.8 }, 50: { cw50: 2, uw50: 0.8 }, ceiling: { cd: 3.2, hanger: 1.3 } } satisfies Record<string, Needs>;
const SINGLES = {
  edge: { hours: 7.5 / 100, needs: { edge: 1.05 } },
  hatch: { hours: 40 / 60, needs: { hatch30: 1 } },
  door: { hours: 1.6, needs: { cw75: 5.4, uw75: 2.4, s25: 30 } },
} satisfies Record<string, { hours: number; needs: Needs }>;
const HEIGHT_SURCHARGE = 20;
const SUBCONTRACT = { price: 48.6, discount: 5 };

/** Crew hours and material needs per LV unit, composed from the norm tables. */
const compose = (assembly: Assembly): { hours: number; needs: Needs } => {
  if (assembly.kind === "edge" || assembly.kind === "hatch" || assembly.kind === "door") return SINGLES[assembly.kind];
  if (assembly.kind === "ceiling") {
    const hours = LABOUR.ceilingFrame + LABOUR.ceilingLayer + LABOUR.Q2;
    return {
      hours: assembly.tall ? hours * (1 + HEIGHT_SURCHARGE / 100) : hours,
      needs: { ...FRAMES.ceiling, gkb: NEED.layer, s25: NEED.ceilingScrews, filler: NEED.ceilingFiller },
    };
  }
  if (assembly.kind !== "wall") return { hours: 0, needs: {} };
  const sides = assembly.finish.length;
  const finishing = assembly.finish.reduce((sum, finish) => sum + LABOUR[finish], 0);
  const hours = LABOUR.wallFrame + assembly.layers * sides * LABOUR.wallLayer + (assembly.insulation ? LABOUR.insulation : 0) + finishing;
  return {
    hours: assembly.tall ? hours * (1 + HEIGHT_SURCHARGE / 100) : hours,
    needs: {
      ...FRAMES[assembly.studs],
      [assembly.board]: assembly.layers * sides * NEED.layer,
      ...(assembly.layers === 1 ? { s25: NEED.singleScrews * sides } : { s25: NEED.innerScrews * sides, s35: NEED.outerScrews * sides }),
      ...(assembly.insulation ? { [assembly.insulation]: NEED.insulation } : {}),
      filler: assembly.finish.reduce((sum, finish) => sum + NEED[finish], 0),
    },
  };
};

type ItemSpec = {
  ordinal: string;
  quantity: number;
  unitDe: string;
  unitEn: string;
  provisional?: boolean;
  trap: string;
  assembly: Assembly;
  de: [string, string];
  en: [string, string];
};
const W112: Assembly = { kind: "wall", studs: 75, layers: 2, board: "gkb", insulation: "mw60", finish: ["Q2", "Q2"] };
const ITEM_SPECS: ItemSpec[] = [
  {
    ordinal: "01.01",
    quantity: 420,
    unitDe: "m²",
    unitEn: "m²",
    trap: "W112 composed",
    assembly: W112,
    de: ["Metallständerwand W112, GKB, 125 mm", "Metallständerwand W112, Wanddicke 125 mm, Unterkonstruktion CW 75, beidseitig zweilagig beplankt mit Gipskartonplatten GKB 12,5 mm, Hohlraumdämmung Mineralwolle 60 mm, beidseitig Oberflächen Q2. Büroräume, Raumhöhe bis 3,00 m."],
    en: ["Metal stud partition W112, GKB, 125 mm", "Metal stud partition W112, wall thickness 125 mm, CW 75 studs, two layers of gypsum plasterboard GKB 12.5 mm on both sides, cavity insulation mineral wool 60 mm, surfaces Q2 on both sides. Offices, room height up to 3.00 m."],
  },
  {
    ordinal: "01.02",
    quantity: 160,
    unitDe: "m²",
    unitEn: "m²",
    trap: "GKF board",
    assembly: { ...W112, board: "gkf" },
    de: ["Metallständerwand W112, GKF, 125 mm", "Metallständerwand W112 wie Pos. 01.01, jedoch beplankt mit Gipskarton-Feuerschutzplatten GKF 12,5 mm (Brandwand). Raumhöhe bis 3,00 m."],
    en: ["Metal stud partition W112, GKF, 125 mm", "Metal stud partition W112 as item 01.01, but boarded with fire-resistant gypsum boards GKF 12.5 mm (fire wall). Room height up to 3.00 m."],
  },
  {
    ordinal: "01.03",
    quantity: 95,
    unitDe: "m²",
    unitEn: "m²",
    trap: "Q3 on one side",
    assembly: { ...W112, finish: ["Q3", "Q2"] },
    de: ["Metallständerwand W112, Flurwand", "Metallständerwand W112 wie Pos. 01.01, jedoch flurseitig Oberfläche in Qualitätsstufe Q3, raumseitig Q2. Raumhöhe bis 3,00 m."],
    en: ["Metal stud partition W112, corridor wall", "Metal stud partition W112 as item 01.01, but the corridor side finished to quality level Q3, the room side Q2. Room height up to 3.00 m."],
  },
  {
    ordinal: "01.04",
    quantity: 230,
    unitDe: "m²",
    unitEn: "m²",
    trap: "single layer, 40 mm insulation",
    assembly: { kind: "wall", studs: 75, layers: 1, board: "gkb", insulation: "mw40", finish: ["Q2", "Q2"] },
    de: ["Metallständerwand W111, GKB, 100 mm", "Metallständerwand W111, Wanddicke 100 mm, Unterkonstruktion CW 75, beidseitig einlagig beplankt mit Gipskartonplatten GKB 12,5 mm, Hohlraumdämmung Mineralwolle 40 mm, beidseitig Q2. Raumhöhe bis 3,00 m."],
    en: ["Metal stud partition W111, GKB, 100 mm", "Metal stud partition W111, wall thickness 100 mm, CW 75 studs, one layer of gypsum plasterboard GKB 12.5 mm on both sides, cavity insulation mineral wool 40 mm, Q2 on both sides. Room height up to 3.00 m."],
  },
  {
    ordinal: "01.05",
    quantity: 85,
    unitDe: "m²",
    unitEn: "m²",
    trap: "one side, CW 50, GKBI",
    assembly: { kind: "wall", studs: 50, layers: 1, board: "gkbi", finish: ["Q2"] },
    de: ["Vorsatzschale W625, GKBI", "Vorsatzschale W625 in Sanitärräumen, freistehend, Unterkonstruktion CW 50, einseitig einlagig beplankt mit imprägnierten Gipskartonplatten GKBI 12,5 mm, ohne Dämmung, Q2. Raumhöhe 2,75 m."],
    en: ["Wall lining W625, GKBI", "Free-standing wall lining W625 in sanitary rooms, CW 50 studs, one layer of moisture-resistant gypsum board GKBI 12.5 mm on one side, no insulation, Q2. Room height 2.75 m."],
  },
  {
    ordinal: "01.06",
    quantity: 310,
    unitDe: "m²",
    unitEn: "m²",
    trap: "height surcharge",
    assembly: { kind: "ceiling", tall: true },
    de: ["Abgehängte Decke D112, Foyer", "Abgehängte Gipskartondecke D112, Unterkonstruktion CD 60/27 mit Schnellabhängern, einlagig beplankt mit GKB 12,5 mm, Q2. Foyer, Raumhöhe 4,20 m."],
    en: ["Suspended ceiling D112, foyer", "Suspended gypsum board ceiling D112, CD 60/27 channels on quick hangers, one layer of GKB 12.5 mm, Q2. Foyer, room height 4.20 m."],
  },
  {
    ordinal: "01.07",
    quantity: 540,
    unitDe: "m²",
    unitEn: "m²",
    trap: "no height surcharge",
    assembly: { kind: "ceiling", tall: false },
    de: ["Abgehängte Decke D112, Büros", "Abgehängte Gipskartondecke D112 wie Pos. 01.06, jedoch in den Büroräumen, Raumhöhe 2,75 m."],
    en: ["Suspended ceiling D112, offices", "Suspended gypsum board ceiling D112 as item 01.06, but in the offices, room height 2.75 m."],
  },
  {
    ordinal: "01.08",
    quantity: 260,
    unitDe: "m",
    unitEn: "m",
    trap: "per 100 m, lengths",
    assembly: { kind: "edge" },
    de: ["Kantenschutzprofil", "Kantenschutzprofil an Außenecken von Wänden und Vorsatzschalen, einspachteln, liefern und montieren."],
    en: ["Corner bead", "Corner bead on external corners of walls and wall linings, filled in, supply and install."],
  },
  {
    ordinal: "01.09",
    quantity: 14,
    unitDe: "St",
    unitEn: "pcs",
    trap: "minutes",
    assembly: { kind: "hatch" },
    de: ["Revisionsklappe 300 × 300 mm", "Revisionsklappe 300 × 300 mm mit GK-Einlage in Decke D112 der Büroräume (Pos. 01.07) einbauen, liefern und montieren."],
    en: ["Access panel 300 × 300 mm", "Access panel 300 × 300 mm with board insert, fitted into ceiling D112 of the offices (item 01.07), supply and install."],
  },
  {
    ordinal: "01.10",
    quantity: 75,
    unitDe: "m",
    unitEn: "m",
    trap: "subcontract discount",
    assembly: { kind: "subcontract" },
    de: ["Brandschutzbekleidung Stahlträger F 90", "Brandschutzbekleidung F 90 für Stahlträger HEA 300, dreiseitig, mit Brandschutzplatten. Wird an einen Nachunternehmer vergeben."],
    en: ["Fire protection cladding steel beam F 90", "Fire protection cladding F 90 for steel beams HEA 300, three-sided, with fire protection boards. Subcontracted."],
  },
  {
    ordinal: "01.11",
    quantity: 6,
    unitDe: "St",
    unitEn: "pcs",
    provisional: true,
    trap: "provisional item",
    assembly: { kind: "door" },
    de: ["Türöffnung in W112 herstellen", "Türöffnung in Wand W112 herstellen, lichte Öffnung bis 1,01 × 2,13 m, Aussteifung mit CW/UW 75."],
    en: ["Door opening in W112", "Form a door opening in partition W112, clear opening up to 1.01 × 2.13 m, stiffened with CW/UW 75."],
  },
  {
    ordinal: "01.12",
    quantity: 40,
    unitDe: "h",
    unitEn: "h",
    trap: "daywork rate",
    assembly: { kind: "daywork" },
    de: ["Stundenlohnarbeiten Facharbeiter", "Stundenlohnarbeiten Facharbeiter Trockenbau, nur nach schriftlicher Anordnung der Bauleitung."],
    en: ["Daywork skilled worker", "Daywork, skilled drywall worker, only as instructed in writing by site management."],
  },
  {
    ordinal: "01.13",
    quantity: 120,
    unitDe: "m²",
    unitEn: "m²",
    trap: "foyer height by cross-reference",
    assembly: { ...W112, tall: true },
    de: ["Metallständerwand W112, Foyer", "Metallständerwand W112 wie Pos. 01.01, jedoch raumhoch im Foyer (Raumhöhe siehe Pos. 01.06)."],
    en: ["Metal stud partition W112, foyer", "Metal stud partition W112 as item 01.01, but full room height in the foyer (room height see item 01.06)."],
  },
];

const TOTAL_NEEDS: Needs = {};
for (const spec of ITEM_SPECS)
  if (!spec.provisional && spec.assembly.kind !== "subcontract" && spec.assembly.kind !== "daywork")
    for (const [key, quantity] of Object.entries(compose(spec.assembly).needs))
      TOTAL_NEEDS[key as MaterialKey] = (TOTAL_NEEDS[key as MaterialKey] ?? 0) + spec.quantity * quantity;

/** Direct costs per unit by cost type. */
const directCosts = ({ assembly }: ItemSpec) => {
  if (assembly.kind === "daywork") return { labour: AVERAGE_WAGE, material: 0, subcontract: 0 };
  if (assembly.kind === "subcontract") return { labour: 0, material: 0, subcontract: SUBCONTRACT.price * (1 - SUBCONTRACT.discount / 100) };
  const { hours, needs } = compose(assembly);
  return {
    labour: hours * AVERAGE_WAGE,
    material: Object.entries(needs).reduce((sum, [key, quantity]) => sum + quantity * materialPrice(key as MaterialKey), 0),
    subcontract: 0,
  };
};
const o = SITE_OVERHEADS;
export const SITE_OVERHEAD_TOTAL =
  o.setup + o.containers * WEEKS * o.containerWeek + o.managementHours * WEEKS * o.managementRate + o.scaffoldWeeks * o.scaffoldWeek + o.skips * o.skip;
const totals = ITEM_SPECS.filter((spec) => !spec.provisional).reduce(
  (sum, spec) => {
    const costs = directCosts(spec);
    return {
      labour: sum.labour + spec.quantity * costs.labour,
      material: sum.material + spec.quantity * costs.material,
      subcontract: sum.subcontract + spec.quantity * costs.subcontract,
    };
  },
  { labour: 0, material: 0, subcontract: 0 },
);
const direct = totals.labour + totals.material + totals.subcontract;
const target = (direct + SITE_OVERHEAD_TOTAL) / (1 - (GENERAL_OVERHEAD + RISK_PROFIT) / 100);
/** The surcharge on labour in percent, rounded to 2 decimals as the guideline says. */
export const LABOUR_SURCHARGE = round2(
  ((target - direct - (totals.material * MATERIAL_MARKUP) / 100 - (totals.subcontract * SUBCONTRACT_MARKUP) / 100) / totals.labour) * 100,
);

/** Ordinal, gold unit price, quantity, whether it counts toward the offer total, and its trap. */
export const GOLD = ITEM_SPECS.map((spec) => {
  const costs = directCosts(spec);
  return {
    ordinal: spec.ordinal,
    unitPrice: round2(costs.labour * (1 + LABOUR_SURCHARGE / 100) + costs.material * (1 + MATERIAL_MARKUP / 100) + costs.subcontract * (1 + SUBCONTRACT_MARKUP / 100)),
    quantity: spec.quantity,
    counts: !spec.provisional,
    trap: spec.trap,
  };
});
export const OFFER_TOTAL = round2(GOLD.filter(({ counts }) => counts).reduce((sum, { quantity, unitPrice }) => sum + round2(quantity * unitPrice), 0));

export const buildUp = (lang: Lang) => {
  const t = pick(lang);
  const n = (value: number, decimals = 2) => formatNumber(lang, value, decimals);
  const items = ITEM_SPECS.map((spec) => {
    const [short, long] = spec[lang];
    return {
      ordinal: spec.ordinal,
      short,
      long,
      quantity: spec.quantity,
      unit: lang === "de" ? spec.unitDe : spec.unitEn,
      type: spec.provisional ? t("Bedarfsposition", "provisional item") : t("Normalposition", "base item"),
    };
  });
  const material = (key: MaterialKey) => {
    const value: Material = MATERIALS[key];
    return lang === "de" ? value.de : value.en;
  };
  const docs: Doc[] = [
    {
      id: "KR-2026",
      title: t("Kalkulationsrichtlinie 2026, Weber Trockenbau GmbH", "Costing guideline 2026, Weber Trockenbau GmbH"),
      pages: [
        t(
          `1. Mittellohn
1.1 Mittellohn A: Summe der Stundenlöhne aller produktiven Arbeitskräfte der Kolonne, zuzüglich des Aufsichtslohns des Poliers mit seinem Zeitanteil auf der Baustelle, geteilt durch die Zahl der produktiven Arbeitskräfte. Der Polier zählt nicht als produktive Arbeitskraft. Auszubildende bleiben im Mittellohn unberücksichtigt.
1.2 Mittellohn AS = Mittellohn A × (1 + Lohnzusatzkosten). Die Lohnzusatzkosten (Sozialkosten und lohngebundene Kosten) betragen ${n(ON_COSTS, 0)} % des Mittellohns A.
1.3 Mittellohn ASL = Mittellohn AS + Lohnnebenkosten je Stunde laut Lohnblatt. Auf Lohnnebenkosten werden keine Lohnzusatzkosten berechnet.
1.4 Der Mittellohn ASL wird auf volle Cent gerundet und so für alle Lohnkosten verwendet.

2. Einzelkosten der Teilleistung
2.1 Lohnkosten je Einheit = Aufwandswert in Stunden je LV-Einheit × Mittellohn ASL. Erschwerniszuschläge auf den Aufwandswert laut Aufwandswerttabelle.
2.2 Stoffkosten je Einheit = Summe aus Materialbedarf je LV-Einheit × Stoffpreis je Bedarfseinheit. Der Materialbedarf enthält Verschnitt und Verlust bereits. Stoffpreis = Angebotspreis netto nach allen Rabatten des Angebots; Skonto bleibt unberücksichtigt. Ob ein Staffelpreis gilt, entscheidet der Gesamtbedarf des Artikels über alle Normalpositionen.
2.3 Nachunternehmerkosten je Einheit = Einheitspreis des Nachunternehmerangebots nach dessen Nachlässen.`,
          `1. Average wage
1.1 Average wage A: the sum of the hourly wages of all productive workers of the crew, plus the supervision wage of the site supervisor (Polier) at his share of time on this site, divided by the number of productive workers. The supervisor does not count as a productive worker. Apprentices are left out of the average wage.
1.2 Average wage AS = average wage A × (1 + wage on-costs). Wage on-costs (social and wage-related costs) are ${n(ON_COSTS, 0)} % of average wage A.
1.3 Average wage ASL = average wage AS + wage incidentals per hour from the wage sheet. No wage on-costs are charged on wage incidentals.
1.4 Average wage ASL is rounded to the cent and used as such for all labour costs.

2. Direct costs
2.1 Labour cost per unit = labour norm in hours per LV unit × average wage ASL. Difficulty surcharges on the labour norm as the labour norm table says.
2.2 Material cost per unit = the sum of material need per LV unit × material price per unit of need. The material need already includes offcuts and waste. Material price = offer price net of all discounts in the offer; cash discount (Skonto) is ignored. Whether a tier price applies depends on the total need for the article over all base items.
2.3 Subcontract cost per unit = the unit price of the subcontractor's offer net of its discounts.`,
        ),
        t(
          `3. Kalkulation über die Angebotssumme
3.1 Die Angebotssumme netto deckt die Einzelkosten, die Baustellengemeinkosten (BGK), die Allgemeinen Geschäftskosten (AGK) sowie Wagnis und Gewinn.
3.2 BGK: der Betrag aus der BGK-Ermittlung der Baustelle.
3.3 AGK: ${GENERAL_OVERHEAD} % der Angebotssumme netto. Wagnis und Gewinn: ${RISK_PROFIT} % der Angebotssumme netto.
3.4 Zuschlag auf Stoffkosten ${MATERIAL_MARKUP} %, auf Nachunternehmerkosten ${SUBCONTRACT_MARKUP} %, jeweils in % der Einzelkosten.
3.5 Was danach zur Deckung von BGK, AGK sowie Wagnis und Gewinn fehlt, wird auf die Lohnkosten umgelegt. Zuschlag auf Lohn = dieser Betrag in % der Lohnkosten, auf 2 Nachkommastellen gerundet (z. B. 37,46 %).
3.6 Grundlage aller Summen sind die Normalpositionen. Bedarfspositionen gehen in keine Summe ein, erhalten aber einen EP mit denselben Zuschlägen.

4. Einheitspreis und Angebotssumme
4.1 EP = Lohnkosten × (1 + Zuschlag auf Lohn) + Stoffkosten × (1 + Zuschlag auf Stoffe) + Nachunternehmerkosten × (1 + Zuschlag auf Nachunternehmer). Zwischenwerte nicht runden; den EP kaufmännisch auf 2 Nachkommastellen runden.
4.2 Stundenlohnarbeiten sind Normalpositionen mit Lohnkosten von einer Stunde Mittellohn ASL je Einheit.
4.3 Gesamtpreis (GP) = Menge × EP, auf 2 Nachkommastellen. Angebotssumme netto = Summe der GP aller Normalpositionen; sie weicht durch die Rundung geringfügig vom Zielwert aus 3.1 ab.`,
          `3. Costing over the offer total
3.1 The net offer total covers the direct costs, the site overhead, the general overhead, and risk and profit.
3.2 Site overhead: the amount from the site overhead sheet of the site.
3.3 General overhead: ${GENERAL_OVERHEAD} % of the net offer total. Risk and profit: ${RISK_PROFIT} % of the net offer total.
3.4 Surcharge on material costs ${MATERIAL_MARKUP} %, on subcontract costs ${SUBCONTRACT_MARKUP} %, each in % of the direct costs.
3.5 Whatever is then still missing to cover site overhead, general overhead, and risk and profit is spread over the labour costs. Surcharge on labour = that amount in % of the labour costs, rounded to 2 decimals (e.g. 37.46 %).
3.6 All sums are taken over the base items. Provisional items go into no sum, but get a unit price with the same surcharges.

4. Unit price and offer total
4.1 Unit price = labour cost × (1 + surcharge on labour) + material cost × (1 + surcharge on materials) + subcontract cost × (1 + surcharge on subcontract). Do not round intermediate values; round the unit price commercially to 2 decimals.
4.2 Daywork items are base items whose labour cost is one hour of average wage ASL per unit.
4.3 Line total = quantity × unit price, to 2 decimals. Net offer total = the sum of the line totals of all base items; rounding makes it differ slightly from the target in 3.1.`,
        ),
      ],
    },
    {
      id: "LV-VB",
      title: t("LV-Vorbemerkungen, Umbau Bürogeschoss 3. OG", "LV preliminary notes, office floor 3rd floor conversion"),
      pages: [
        t(
          `1. Ausführungsfrist: ${WEEKS} Wochen ab Auftragserteilung, durchgehend.
2. Baustrom und Bauwasser stellt der Auftraggeber kostenlos.
3. Arbeitszeiten werktags 7 bis 18 Uhr; das Gebäude ist während der Arbeiten nicht genutzt.
4. Abrechnung nach VOB/C, ATV DIN 18340.`,
          `1. Construction period: ${WEEKS} weeks from award, continuous.
2. Site power and water are provided free of charge by the client.
3. Working hours on weekdays from 7 am to 6 pm; the building is not in use during the works.
4. Measurement under VOB/C, ATV DIN 18340.`,
        ),
      ],
    },
    {
      id: "BGK-03",
      title: t("BGK-Ermittlung, BV Bürogeschoss 3. OG", "Site overhead sheet, office floor 3rd floor project"),
      pages: [
        t(
          `| Kostenposition | Ansatz |
|---|---|
| Baustelleneinrichtung und Räumung | pauschal ${n(o.setup)} € |
| Materialcontainer | ${o.containers} Stück × Bauzeit in Wochen × ${n(o.containerWeek)} € je Stück und Woche |
| Bauleitung | ${o.managementHours} h je Woche der Bauzeit × ${n(o.managementRate)} €/h |
| Rollgerüst für das Foyer | ${o.scaffoldWeeks} Wochen × ${n(o.scaffoldWeek)} € je Woche |
| Entsorgung Verschnitt | ${o.skips} Container × ${n(o.skip)} € |
| Baustrom und Bauwasser | siehe LV-Vorbemerkungen |
Bauzeit: laut LV-Vorbemerkungen.`,
          `| Cost line | Basis |
|---|---|
| Site setup and clearance | lump sum EUR ${n(o.setup)} |
| Material containers | ${o.containers} units × construction weeks × EUR ${n(o.containerWeek)} per unit and week |
| Site management | ${o.managementHours} h per week of the construction period × EUR ${n(o.managementRate)}/h |
| Mobile scaffold for the foyer | ${o.scaffoldWeeks} weeks × EUR ${n(o.scaffoldWeek)} per week |
| Disposal of offcuts | ${o.skips} skips × EUR ${n(o.skip)} |
| Site power and water | see the LV preliminary notes |
Construction period: per the LV preliminary notes.`,
        ),
      ],
    },
    {
      id: "LB-TB-03",
      title: t("Lohnblatt Kolonne Trockenbau, BV Bürogeschoss 3. OG", "Wage sheet, drywall crew, office floor 3rd floor project"),
      pages: [
        t(
          `| Funktion | Anzahl | Stundenlohn |
|---|---|---|
| Vorarbeiter | 1 | ${n(WAGES.foreman)} € |
| Facharbeiter Trockenbau | ${SKILLED} | ${n(WAGES.skilled)} € |
| Bauhelfer | 1 | ${n(WAGES.helper)} € |
| Auszubildender (2. Lehrjahr) | 1 | ${n(WAGES.apprentice)} € (Ausbildungsvergütung je Stunde) |
| Polier | Zeitanteil auf dieser Baustelle ${n(SUPERVISOR_SHARE * 100, 0)} % | ${n(WAGES.supervisor)} € |

Lohnnebenkosten: Fahrtkostenabgeltung ${n(TRAVEL)} € je produktive Arbeitsstunde.
Hinweis: Tariferhöhung ab 01.04.2027 um 3,1 %. Die Bauzeit endet im Februar 2027; die Erhöhung ist nicht einzurechnen.`,
          `| Role | Number | Hourly wage |
|---|---|---|
| Foreman | 1 | EUR ${n(WAGES.foreman)} |
| Skilled drywall worker | ${SKILLED} | EUR ${n(WAGES.skilled)} |
| Labourer | 1 | EUR ${n(WAGES.helper)} |
| Apprentice (2nd year) | 1 | EUR ${n(WAGES.apprentice)} (training allowance per hour) |
| Site supervisor (Polier) | share of time on this site ${n(SUPERVISOR_SHARE * 100, 0)} % | EUR ${n(WAGES.supervisor)} |

Wage incidentals: travel allowance EUR ${n(TRAVEL)} per productive working hour.
Note: collective wage increase of 3.1 % from 1 Apr 2027. Construction ends in February 2027; do not include the increase.`,
        ),
      ],
    },
    {
      id: "AW-TB",
      title: t("Aufwandswerte und Materialbedarf Trockenbau", "Labour norms and material need, drywall"),
      pages: [
        t(
          `Aufwandswerte in Kolonnenstunden je m² Bauteilfläche, nach Arbeitsschritten
| Arbeitsschritt | Wand, Vorsatzschale | Decke |
|---|---|---|
| Unterkonstruktion stellen | ${n(LABOUR.wallFrame)} h | ${n(LABOUR.ceilingFrame)} h |
| Beplanken, je Plattenlage und beplankte Seite | ${n(LABOUR.wallLayer)} h | ${n(LABOUR.ceilingLayer)} h |
| Dämmung einlegen | ${n(LABOUR.insulation)} h | – |
| Verspachteln Q2, je Seite | ${n(LABOUR.Q2)} h | ${n(LABOUR.Q2)} h |
| Verspachteln Q3, je Seite (anstelle von Q2) | ${n(LABOUR.Q3)} h | ${n(LABOUR.Q3)} h |

Einzelleistungen
| Leistung | Aufwandswert |
|---|---|
| Kantenschutzprofil | ${n(SINGLES.edge.hours * 100, 1)} h je 100 m |
| Revisionsklappe in GK-Decke | ${n(SINGLES.hatch.hours * 60, 0)} min/St |
| Türöffnung in W112 herstellen | ${n(SINGLES.door.hours)} h/St |

Erschwernisse (Zuschlag auf alle Aufwandswerte der Position)
- Arbeiten bei Raumhöhen über 3,50 m (Rollgerüst): + ${HEIGHT_SURCHARGE} %
- Arbeiten in genutzten Räumen bei laufendem Betrieb: + 10 %`,
          `Labour norms in crew hours per m² of element area, by work step
| Work step | Wall, wall lining | Ceiling |
|---|---|---|
| Erect the substructure | ${n(LABOUR.wallFrame)} h | ${n(LABOUR.ceilingFrame)} h |
| Boarding, per board layer and boarded side | ${n(LABOUR.wallLayer)} h | ${n(LABOUR.ceilingLayer)} h |
| Fit insulation | ${n(LABOUR.insulation)} h | – |
| Filling Q2, per side | ${n(LABOUR.Q2)} h | ${n(LABOUR.Q2)} h |
| Filling Q3, per side (instead of Q2) | ${n(LABOUR.Q3)} h | ${n(LABOUR.Q3)} h |

Single items
| Work | Labour norm |
|---|---|
| Corner bead | ${n(SINGLES.edge.hours * 100, 1)} h per 100 m |
| Access panel in board ceiling | ${n(SINGLES.hatch.hours * 60, 0)} min/pc |
| Door opening in W112 | ${n(SINGLES.door.hours)} h/pc |

Difficulty surcharges (on every labour norm of the Item)
- Work at room heights above 3.50 m (mobile scaffold): + ${HEIGHT_SURCHARGE} %
- Work in occupied rooms during operation: + 10 %`,
        ),
        t(
          `Materialbedarf je m² Bauteilfläche, einschließlich Verschnitt
Unterkonstruktion Wand CW 75: ${material("cw75")} ${n(FRAMES[75].cw75)} m; ${material("uw75")} ${n(FRAMES[75].uw75)} m
Unterkonstruktion Wand CW 50: ${material("cw50")} ${n(FRAMES[50].cw50)} m; ${material("uw50")} ${n(FRAMES[50].uw50)} m
Unterkonstruktion Decke: ${material("cd")} ${n(FRAMES.ceiling.cd)} m; ${material("hanger")} ${n(FRAMES.ceiling.hanger)} St
Beplankung: je Plattenlage und beplankte Seite ${n(NEED.layer)} m² Platte des im LV genannten Typs, Format 1250 × 2000 mm
Schrauben Wand, je beplankte Seite: einlagig ${NEED.singleScrews} St ${material("s25")}; zweilagig ${NEED.innerScrews} St ${material("s25")} (1. Lage) und ${NEED.outerScrews} St ${material("s35")} (2. Lage)
Schrauben Decke, einlagig: ${NEED.ceilingScrews} St ${material("s25")}
Dämmung: ${n(NEED.insulation)} m² Mineralwolle-Trennwandplatte in der Dicke laut LV
Fugenspachtel: Wand je Seite Q2 ${n(NEED.Q2)} kg, Q3 ${n(NEED.Q3)} kg; Decke Q2 ${n(NEED.ceilingFiller)} kg

Einzelleistungen
Kantenschutzprofil, je m: ${n(SINGLES.edge.needs.edge)} m Profil
Revisionsklappe 300 × 300 mm, je St: 1 Revisionsklappe 300 × 300 mm
Türöffnung in W112, je St: ${n(SINGLES.door.needs.cw75)} m CW-Profil 75, ${n(SINGLES.door.needs.uw75)} m UW-Profil 75, ${SINGLES.door.needs.s25} St ${material("s25")}`,
          `Material need per m² of element area, including offcuts
Wall substructure CW 75: ${material("cw75")} ${n(FRAMES[75].cw75)} m; ${material("uw75")} ${n(FRAMES[75].uw75)} m
Wall substructure CW 50: ${material("cw50")} ${n(FRAMES[50].cw50)} m; ${material("uw50")} ${n(FRAMES[50].uw50)} m
Ceiling substructure: ${material("cd")} ${n(FRAMES.ceiling.cd)} m; ${material("hanger")} ${n(FRAMES.ceiling.hanger)} pcs
Boarding: per board layer and boarded side ${n(NEED.layer)} m² of the board type the LV names, format 1250 × 2000 mm
Wall screws, per boarded side: one layer ${NEED.singleScrews} pcs ${material("s25")}; two layers ${NEED.innerScrews} pcs ${material("s25")} (1st layer) and ${NEED.outerScrews} pcs ${material("s35")} (2nd layer)
Ceiling screws, one layer: ${NEED.ceilingScrews} pcs ${material("s25")}
Insulation: ${n(NEED.insulation)} m² mineral wool partition slab of the thickness the LV names
Joint filler: wall per side Q2 ${n(NEED.Q2)} kg, Q3 ${n(NEED.Q3)} kg; ceiling Q2 ${n(NEED.ceilingFiller)} kg

Single items
Corner bead, per m: ${n(SINGLES.edge.needs.edge)} m of bead
Access panel 300 × 300 mm, per pc: 1 access panel 300 × 300 mm
Door opening in W112, per pc: ${n(SINGLES.door.needs.cw75)} m CW stud 75, ${n(SINGLES.door.needs.uw75)} m UW track 75, ${SINGLES.door.needs.s25} pcs ${material("s25")}`,
        ),
      ],
    },
    (() => {
      const lines = (Object.keys(MATERIALS) as MaterialKey[]).map((key) => {
        const value: Material = MATERIALS[key];
        const tier = value.tier
          ? t(`; Staffelpreis ab ${value.tier.from} ${value.tier.de} Gesamtabnahme: ${n(value.tier.price)} € je ${value.unitDe}`, `; tier price from ${value.tier.from} ${value.tier.en} in total: ${n(value.tier.price)} EUR per ${value.unitEn}`)
          : "";
        return `| ${value.articleNo} | ${material(key)} | ${n(value.price)} ${t("€ je", "EUR per")} ${lang === "de" ? value.unitDe : value.unitEn}${tier} |`;
      });
      const head = t("| Art.-Nr. | Bezeichnung | Preis netto |\n|---|---|---|", "| Article | Description | Net price |\n|---|---|---|");
      return {
        id: "ANG-4471",
        title: t("Angebot 4471, Baustoffhandel Krämer KG", "Offer 4471, Baustoffhandel Krämer KG"),
        pages: [
          `${t("Angebot 4471 vom 21.10.2026 für das BV Bürogeschoss 3. OG", "Offer 4471 of 21 Oct 2026 for the office floor 3rd floor project")}
${head}
${lines.slice(0, 10).join("\n")}`,
          `${head}
${lines.slice(10).join("\n")}

${t(
  `Konditionen
1. Auf alle Artikel gewähren wir ${DISCOUNT} % Projektrabatt, ausgenommen Dämmstoffe (Art.-Nr. DS-…), die zum aufgeführten Preis berechnet werden.
2. Lieferung frei Baustelle.
3. Zahlung innerhalb von 10 Tagen mit 2 % Skonto, 30 Tage netto.`,
  `Conditions
1. On all articles we grant a project discount of ${DISCOUNT} %, except insulation (article DS-…), which is charged at the listed price.
2. Delivery free to site.
3. Payment within 10 days with 2 % cash discount, 30 days net.`,
)}`,
        ],
      };
    })(),
    {
      id: "NU-0912",
      title: t("Nachunternehmerangebot NU-0912, Brandschutz Nord GmbH", "Subcontractor offer NU-0912, Brandschutz Nord GmbH"),
      pages: [
        t(
          `| Pos. | Leistung | EP netto |
|---|---|---|
| 1 | Brandschutzbekleidung F 90, Stahlträger HEA 200, dreiseitig | 41,20 €/m |
| 2 | Brandschutzbekleidung F 90, Stahlträger HEA 300, dreiseitig | ${n(SUBCONTRACT.price)} €/m |
| 3 | Brandschutzbekleidung F 90, Stahlträger HEA 300, vierseitig | 55,90 €/m |

Auf alle Einheitspreise gewähren wir einen Nachlass von ${SUBCONTRACT.discount} %. Gerüste stellt der Auftraggeber.`,
          `| No. | Work | Net unit price |
|---|---|---|
| 1 | Fire protection cladding F 90, steel beam HEA 200, three-sided | EUR 41.20/m |
| 2 | Fire protection cladding F 90, steel beam HEA 300, three-sided | EUR ${n(SUBCONTRACT.price)}/m |
| 3 | Fire protection cladding F 90, steel beam HEA 300, four-sided | EUR 55.90/m |

We grant a discount of ${SUBCONTRACT.discount} % on all unit prices. Scaffolding is provided by the client.`,
        ),
      ],
    },
  ];
  return { items, docs };
};
