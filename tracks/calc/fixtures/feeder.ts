/**
 * The consumers of a canteen kitchen sub-distribution, its feeder route, and the tables to size the
 * feeder, with the demand, current, fuse, cross-section and voltage drop by construction.
 */
import type { Lang } from "../../../src/types";
import { roundHalfUp } from "../calculator";
import { fmt } from "../shared";

type Text = Record<Lang, string>;
export type Group = "cooking" | "refrigeration" | "dishwashing" | "ventilation" | "lighting" | "sockets";
export type Consumer = {
  id: string;
  name: Text;
  group: Group;
  quantity: number;
  power: number;
  unit: "kW" | "W" | "kVA";
  cosPhi?: number;
  status?: "cancelled" | "spare";
  note?: Text;
};

export const VOLTAGE = 400;
export const COS_PHI = 0.9;
export const KAPPA = 56;
export const MAX_DROP_PERCENT = 1.5;

export const FACTORS: Record<Exclude<Group, "cooking">, number> = { refrigeration: 0.9, dishwashing: 0.8, ventilation: 1, lighting: 1, sockets: 0.3 };
/** Cooking appliances: from this many appliances on, the factor applies. */
export const COOKING_FACTORS: Array<[number, number]> = [
  [1, 0.9],
  [4, 0.8],
  [8, 0.7],
  [11, 0.6],
];
export const cookingFactor = (appliances: number) => COOKING_FACTORS.filter(([from]) => appliances >= from).at(-1)![1];
export const GROUP_NAMES: Record<Group, Text> = {
  cooking: { de: "Kochen", en: "Cooking" },
  refrigeration: { de: "Kühlen", en: "Refrigeration" },
  dishwashing: { de: "Spülen", en: "Dishwashing" },
  ventilation: { de: "Lüftung", en: "Ventilation" },
  lighting: { de: "Beleuchtung", en: "Lighting" },
  sockets: { de: "Steckdosen", en: "Sockets" },
};

const name = (de: string, en: string): Text => ({ de, en });

export const CONSUMERS: Consumer[] = [
  { id: "V-01", name: name("Kombidämpfer 10 x GN 1/1", "Combi steamer 10 x GN 1/1"), group: "cooking", quantity: 1, power: 18.6, unit: "kW" },
  { id: "V-02", name: name("Kombidämpfer 6 x GN 1/1", "Combi steamer 6 x GN 1/1"), group: "cooking", quantity: 1, power: 11, unit: "kW" },
  { id: "V-03", name: name("Kippbratpfanne 80 l", "Tilting bratt pan 80 l"), group: "cooking", quantity: 1, power: 12.5, unit: "kW" },
  { id: "V-04", name: name("Induktionsherd 4 Zonen", "Induction range 4 zones"), group: "cooking", quantity: 1, power: 14000, unit: "W" },
  { id: "V-05", name: name("Fritteuse 2 x 10 l", "Fryer 2 x 10 l"), group: "cooking", quantity: 2, power: 9, unit: "kW" },
  { id: "V-06", name: name("Salamander", "Salamander grill"), group: "cooking", quantity: 1, power: 2.8, unit: "kW" },
  { id: "V-07", name: name("Kühlzelle, Verdampfer und Verflüssiger", "Cold room, evaporator and condenser"), group: "refrigeration", quantity: 1, power: 2.6, unit: "kVA", cosPhi: 0.85 },
  { id: "V-08", name: name("Tiefkühlzelle", "Freezer room"), group: "refrigeration", quantity: 1, power: 3.1, unit: "kW" },
  { id: "V-09", name: name("Kühltisch 3-türig", "Refrigerated counter, 3 doors"), group: "refrigeration", quantity: 3, power: 420, unit: "W" },
  { id: "V-10", name: name("Bandspülmaschine", "Flight-type dishwasher"), group: "dishwashing", quantity: 1, power: 28.5, unit: "kW" },
  {
    id: "V-11",
    name: name("Topfspülmaschine", "Pot washer"),
    group: "dishwashing",
    quantity: 1,
    power: 9.8,
    unit: "kW",
    status: "cancelled",
    note: name("Entfällt laut Nutzerabstimmung vom 02.10.2026", "Cancelled per user meeting of 2 Oct 2026"),
  },
  { id: "V-12", name: name("Abluftventilator Küchenhaube", "Kitchen hood exhaust fan"), group: "ventilation", quantity: 1, power: 4.5, unit: "kVA", cosPhi: 0.87 },
  { id: "V-13", name: name("Zuluftventilator Küche", "Kitchen supply air fan"), group: "ventilation", quantity: 1, power: 3, unit: "kW" },
  { id: "V-14", name: name("Beleuchtung Küche und Lager", "Lighting kitchen and store"), group: "lighting", quantity: 1, power: 1850, unit: "W" },
  { id: "V-15", name: name("Steckdosenstromkreise 16 A", "Socket circuits 16 A"), group: "sockets", quantity: 10, power: 3.5, unit: "kW" },
  {
    id: "V-16",
    name: name("Reserveabgang 3-polig", "Spare outgoing circuit, 3-pole"),
    group: "cooking",
    quantity: 3,
    power: 10,
    unit: "kW",
    status: "spare",
    note: name("Reserve, nicht belegt", "Spare, not connected"),
  },
  { id: "V-17", name: name("Wärmeschrank Speiseausgabe", "Heated cabinet serving line"), group: "cooking", quantity: 1, power: 6.5, unit: "kW" },
];

export const FUSES = [16, 20, 25, 32, 35, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315];
export const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
/** Ampacity in A for three loaded copper conductors, PVC insulation, 30 °C, by laying method. */
export const AMPACITY: Record<"C" | "E", number[]> = {
  C: [19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299, 344, 392, 461],
  E: [22, 30, 40, 51, 70, 94, 119, 148, 180, 232, 282, 328, 379, 434, 514],
};
export const TEMPERATURE_FACTORS: Record<number, number> = { 20: 1.12, 25: 1.06, 30: 1, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71 };
/** Multi-core cables in one layer, touching, on a perforated tray: number of cables to factor. */
export const GROUPING_FACTORS: Record<number, number> = { 1: 1, 2: 0.88, 3: 0.82, 4: 0.79, 6: 0.76, 9: 0.73 };

export const ROUTE_SECTIONS = [
  { id: "A", length: 73, method: "E" as const, temperature: 25, cables: 3, place: name("Kellergang Bestandsbau, gelochte Kabelrinne", "Basement corridor existing building, perforated tray") },
  { id: "B", length: 91, method: "E" as const, temperature: 40, cables: 5, place: name("Zwischendecke über der Küche, gelochte Kabelrinne", "Ceiling void above the kitchen, perforated tray") },
];

export const groupingFactor = (cables: number) => {
  const key = Object.keys(GROUPING_FACTORS).map(Number).find((count) => count >= cables)!;
  return GROUPING_FACTORS[key]!;
};

export const kilowatts = (consumer: Consumer) =>
  consumer.quantity * (consumer.unit === "W" ? consumer.power / 1000 : consumer.unit === "kVA" ? consumer.power * consumer.cosPhi! : consumer.power);

export const solve = (consumers = CONSUMERS) => {
  const groups = new Map<Group, number>();
  let appliances = 0;
  for (const consumer of consumers) {
    if (consumer.status) continue;
    groups.set(consumer.group, (groups.get(consumer.group) ?? 0) + kilowatts(consumer));
    if (consumer.group === "cooking") appliances += consumer.quantity;
  }
  const demandKw = [...groups].reduce((sum, [group, kw]) => sum + kw * (group === "cooking" ? cookingFactor(appliances) : FACTORS[group]), 0);
  const current = (demandKw * 1000) / (Math.sqrt(3) * VOLTAGE * COS_PHI);
  const fuse = FUSES.find((rating) => rating >= current)!;
  const length = ROUTE_SECTIONS.reduce((sum, section) => sum + section.length, 0);
  const drop = (section: number) => ((Math.sqrt(3) * current * length * COS_PHI) / (KAPPA * section * VOLTAGE)) * 100;
  const carries = (index: number) =>
    ROUTE_SECTIONS.every((section) => AMPACITY[section.method][index]! * TEMPERATURE_FACTORS[section.temperature]! * groupingFactor(section.cables) >= fuse);
  const index = SECTIONS.findIndex((section, index) => carries(index) && drop(section) <= MAX_DROP_PERCENT);
  const section = SECTIONS[index]!;
  return { demandKw, current, fuse, section, drop: drop(section), ampacityOnly: SECTIONS[SECTIONS.findIndex((_, i) => carries(i))]! };
};

export const GOLD = (() => {
  const raw = solve();
  return { demandKw: roundHalfUp(raw.demandKw, 2), current: roundHalfUp(raw.current, 1), fuse: raw.fuse, section: raw.section, drop: roundHalfUp(raw.drop, 2) };
})();

export const basis = (lang: Lang) => {
  const cooking = COOKING_FACTORS.map(([from, factor], index) => {
    const to = COOKING_FACTORS[index + 1]?.[0];
    const range = to ? `${from}–${to - 1}` : lang === "de" ? `ab ${from}` : `${from} or more`;
    return `${range}: ${fmt(lang, factor, 1)}`;
  }).join("; ");
  const groups = [
    `– ${GROUP_NAMES.cooking[lang]}: ${lang === "de" ? "nach Anzahl der Geräte" : "by number of appliances"} (${cooking})`,
    ...Object.entries(FACTORS).map(([group, factor]) => `– ${GROUP_NAMES[group as Group][lang]}: ${fmt(lang, factor, 1)}`),
  ].join("\n");
  return lang === "de"
    ? `BEMESSUNGSGRUNDLAGEN ZULEITUNG UV-K (Mensa Campus Nord)

1. Leistungsbedarf
1.1 Anschlussleistung eines Verbrauchers = Anzahl × Leistung je Stück, in kW. Leistungen in W sind in kW umzurechnen; Scheinleistungen in kVA mit dem cos φ des Verbrauchers: P = S × cos φ.
1.2 Je Verbrauchergruppe wird die Summe der Anschlussleistungen mit dem Gleichzeitigkeitsfaktor der Gruppe multipliziert; der Leistungsbedarf ist die Summe über alle Gruppen.
1.3 Gleichzeitigkeitsfaktoren (bei „Kochen“ zählt die Anzahl der Geräte, also die Summe der Stückzahlen der berücksichtigten Kochgeräte):
${groups}
1.4 Entfallene Verbraucher und nicht belegte Reserveabgänge bleiben unberücksichtigt.

2. Betriebsstrom
2.1 Drehstrom, U = ${VOLTAGE} V, cos φ = ${fmt(lang, COS_PHI, 1)} für die gesamte Verteilung.
2.2 I_B = P / (√3 × U × cos φ).

3. Schutzeinrichtung und Querschnitt
3.1 Bemessungsstrom der Sicherung I_n: der kleinste Normwert mit I_n ≥ I_B. Normwerte in A: ${FUSES.join(", ")}.
3.2 Strombelastbarkeit I_z = I_r × f_Temperatur × f_Häufung, mit I_r aus der Belastbarkeitstabelle für die Verlegeart des Abschnitts und den Umrechnungsfaktoren aus der Faktorentabelle.
3.3 Es muss I_n ≤ I_z in jedem Abschnitt der Trasse gelten. Kabeltyp NYY-J, Kupfer, mehradrig.
3.4 Häufung: Gezählt werden alle mehradrigen Kabel im Abschnitt einschließlich der Zuleitung selbst. Steht die Anzahl nicht in der Tabelle, gilt der Faktor der nächstgrößeren Anzahl.

4. Spannungsfall
4.1 Δu = √3 × I_B × L × cos φ / (κ × A × U) × 100 %, mit L = Gesamtlänge der Zuleitung in m, A = Querschnitt in mm², κ = ${KAPPA} m/(Ω·mm²).
4.2 Zulässig sind höchstens ${fmt(lang, MAX_DROP_PERCENT, 1)} % zwischen NSHV und UV-K.
4.3 Gewählt wird der kleinste Normquerschnitt, der 3.3 und 4.2 erfüllt.

5. Rundung
5.1 Rechne mit ungerundeten Zwischenwerten. Angaben: Leistungsbedarf in kW mit zwei Nachkommastellen, I_B in A mit einer Nachkommastelle, Spannungsfall in % mit zwei Nachkommastellen.`
    : `DESIGN BASIS FOR THE FEEDER OF UV-K (canteen, Campus North)

1. Power demand
1.1 Connected load of a consumer = quantity × power per unit, in kW. Convert powers given in W to kW, and apparent powers in kVA with the consumer's cos φ: P = S × cos φ.
1.2 For each consumer group, the sum of connected loads is multiplied by the group's simultaneity factor; the power demand is the sum over all groups.
1.3 Simultaneity factors (for "Cooking", count the appliances, i.e. the sum of the quantities of the cooking appliances that are counted):
${groups}
1.4 Cancelled consumers and spare outgoing circuits that are not connected are not counted.

2. Design current
2.1 Three-phase, U = ${VOLTAGE} V, cos φ = ${fmt(lang, COS_PHI, 1)} for the whole distribution board.
2.2 I_B = P / (√3 × U × cos φ).

3. Protective device and cross-section
3.1 Rated current of the fuse I_n: the smallest standard rating with I_n ≥ I_B. Standard ratings in A: ${FUSES.join(", ")}.
3.2 Current-carrying capacity I_z = I_r × f_temperature × f_grouping, with I_r from the ampacity table for the section's laying method and the correction factors from the factor table.
3.3 I_n ≤ I_z must hold in every section of the route. Cable type NYY-J, copper, multi-core.
3.4 Grouping: count all multi-core cables in the section, including the feeder itself. If the number is not in the table, use the factor for the next larger number.

4. Voltage drop
4.1 Δu = √3 × I_B × L × cos φ / (κ × A × U) × 100 %, with L = total length of the feeder in m, A = cross-section in mm², κ = ${KAPPA} m/(Ω·mm²).
4.2 At most ${fmt(lang, MAX_DROP_PERCENT, 1)} % is permitted between the main LV switchboard and UV-K.
4.3 Choose the smallest standard cross-section that meets 3.3 and 4.2.

5. Rounding
5.1 Calculate with unrounded intermediate values. Report: power demand in kW with two decimals, I_B in A with one decimal, voltage drop in % with two decimals.`;
};
