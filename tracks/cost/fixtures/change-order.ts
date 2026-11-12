/**
 * A tiling contract with its deposited original calculation (Urkalkulation), the contract's change
 * order clauses, the client's instructions, a measurement sheet, a new supplier offer, and a current
 * wage sheet, in German or English. Change order prices follow from them by construction.
 */
import type { Lang } from "../../../src/types";
import { formatNumber, pick, round2, type Doc } from "../shared";

const WAGE = 41.2;
const WAGE_2026 = 43.9;
const SURCHARGES = {
  labour: { site: 11, general: 9, riskProfit: 5 },
  material: { site: 4, general: 6, riskProfit: 3 },
};
const sum = ({ site, general, riskProfit }: { site: number; general: number; riskProfit: number }) => (site + general + riskProfit) / 100;

const PRICES = { tile30: 33.6, wallTile: 25.8, adhesive: 0.72, grout: 2.1 };
const NORMS = {
  floor30: { hours: 0.85, waste: 5, adhesive: 4.5, grout: 0.4 },
  floor60: { hours: 1, waste: 8, adhesive: 5.5, grout: 0.3 },
  floor120: { hours: 1.2, waste: 10, adhesive: 6, grout: 0.25 },
  wall30: { hours: 0.95, waste: 5, adhesive: 4, grout: 0.3 },
  mat: { hours: 0.15, waste: 5, adhesive: 2 },
};
const OFFER = { tile60: { price: 49.68, pack: 1.08 }, mat: { price: 285, roll: 30 }, tileDiscount: 8 };

type Contract = { ordinal: string; quantity: number; unit: string; hours: number; material: number; de: string; en: string };
const floorMaterial = PRICES.tile30 * (1 + NORMS.floor30.waste / 100) + PRICES.adhesive * NORMS.floor30.adhesive + PRICES.grout * NORMS.floor30.grout;
const wallMaterial = PRICES.wallTile * (1 + NORMS.wall30.waste / 100) + PRICES.adhesive * NORMS.wall30.adhesive + PRICES.grout * NORMS.wall30.grout;
const CONTRACT: Contract[] = [
  { ordinal: "01.01", quantity: 400, unit: "m²", hours: 0.2, material: 9.8, de: "Zementestrich CT-C25-F4, d = 50 mm, auf Trennlage", en: "Cement screed CT-C25-F4, t = 50 mm, on separating layer" },
  { ordinal: "01.02", quantity: 260, unit: "m", hours: 0.05, material: 0.45, de: "Randdämmstreifen 8 mm", en: "Edge insulation strip 8 mm" },
  { ordinal: "02.01", quantity: 60, unit: "m²", hours: 0.35, material: 8.4, de: "Verbundabdichtung 2K im Duschbereich", en: "Bonded waterproofing 2K in shower areas" },
  { ordinal: "02.02", quantity: 140, unit: "m²", hours: NORMS.floor30.hours, material: floorMaterial, de: "Bodenfliesen Feinsteinzeug 30 × 60 cm, grau matt, R10, Dünnbett", en: "Floor tiles porcelain stoneware 30 × 60 cm, grey matt, R10, thin bed" },
  { ordinal: "02.03", quantity: 300, unit: "m²", hours: NORMS.wall30.hours, material: wallMaterial, de: "Wandfliesen 30 × 60 cm, weiß matt, Dünnbett", en: "Wall tiles 30 × 60 cm, white matt, thin bed" },
  { ordinal: "02.04", quantity: 210, unit: "m", hours: 0.2, material: 4.2, de: "Sockelfliesen h = 8 cm", en: "Skirting tiles h = 8 cm" },
];
const DISCOUNT = 3;
/** A calculated unit price rounded, less the contract discount, rounded again. */
const discounted = (price: number) => round2(round2(price) * (1 - DISCOUNT / 100));
const unitPrice = (hours: number, material: number, drop: Array<"site" | "general" | "riskProfit"> = []) => {
  const rate = (kind: "labour" | "material") => sum(SURCHARGES[kind]) - drop.reduce((total, key) => total + SURCHARGES[kind][key] / 100, 0);
  return hours * WAGE * (1 + rate("labour")) + material * (1 + rate("material"));
};
const contractPrice = (ordinal: string) => {
  const item = CONTRACT.find((entry) => entry.ordinal === ordinal)!;
  const calculated = round2(unitPrice(item.hours, item.material));
  return { item, calculated, price: discounted(calculated) };
};

type Opening = [string, string, number];
type Room = [string, number, Opening[]];
const SHAFT: [string, string] = ["Schacht", "shaft"];
const SCREED_ROOMS: Room[] = [
  ["0.01", 112.4, []],
  ["0.02", 86.25, [[...SHAFT, 0.64]]],
  ["0.03", 64.1, [[...SHAFT, 1]]],
  ["0.04", 98.8, [["Treppenauge", "stairwell opening", 3.2]]],
  ["1.01", 75.55, [[...SHAFT, 1.2]]],
  ["1.02", 87.3, []],
];
const WALL_ROOMS: Room[] = [
  ["0.05", 40.38, [["Tür", "door", 1.78]]],
  ["0.06", 41.25, []],
  ["0.07", 27.9, [["Fensternische", "window recess", 0.72]]],
  ["1.03", 44.1, []],
  ["1.04", 28.15, []],
];
const FLOOR_ROOMS: Room[] = [
  ["0.05", 12.4, [["Bodenablauf", "floor drain", 0.04]]],
  ["0.06", 11.85, []],
  ["0.07", 31.75, [["Stütze", "column", 1.5]]],
  ["1.03", 16.3, []],
  ["1.04", 13.45, []],
  ["1.05", 62.25, [[...SHAFT, 0.8]]],
];
const SKIRTING_ROOMS: Room[] = [
  ["0.01", 46.2, []],
  ["0.02", 38.1, []],
  ["0.03", 31.4, []],
  ["0.04", 41.8, []],
  ["1.01", 35.25, []],
  ["1.02", 38.25, []],
];
const WATERPROOFING_ROOMS: Room[] = [
  ["0.05", 12.4, [["Bodenablauf", "floor drain", 0.04]]],
  ["0.06", 11.85, []],
  ["1.03", 16.3, []],
  ["1.04", 13.45, []],
];
const OPENING_LIMIT = 1;
const measured = (rooms: Room[]) =>
  round2(rooms.reduce((total, [, gross, openings]) => total + gross - openings.filter(([, , area]) => area > OPENING_LIMIT).reduce((sum, [, , area]) => sum + area, 0), 0));
const DAYWORK_HOURS = 16;

const changed = (() => {
  const old = contractPrice("02.02");
  const tile = (OFFER.tile60.price / OFFER.tile60.pack) * (1 - OFFER.tileDiscount / 100) * (1 + NORMS.floor60.waste / 100);
  const material = tile + PRICES.adhesive * NORMS.floor60.adhesive + PRICES.grout * NORMS.floor60.grout;
  const price = discounted(unitPrice(NORMS.floor60.hours, material));
  return { price, amount: round2(round2(measured(FLOOR_ROOMS) * price) - round2(old.item.quantity * old.price)) };
})();
const added = (() => {
  const quantity = measured(FLOOR_ROOMS);
  const material = (OFFER.mat.price / OFFER.mat.roll) * (1 + NORMS.mat.waste / 100) + PRICES.adhesive * NORMS.mat.adhesive;
  const price = discounted(unitPrice(NORMS.mat.hours, material));
  return { price, amount: round2(quantity * price) };
})();
const increased = (() => {
  const { item, price: old } = contractPrice("01.01");
  const executed = measured(SCREED_ROOMS);
  const limit = item.quantity * 1.1;
  const price = discounted(unitPrice(item.hours, item.material, ["site"]));
  return { price, amount: round2(round2(limit * old) + round2((executed - limit) * price) - round2(item.quantity * old)) };
})();
const decreased = (() => {
  const { item, calculated, price: old } = contractPrice("02.03");
  const executed = measured(WALL_ROOMS);
  const overheads = item.hours * WAGE * ((SURCHARGES.labour.site + SURCHARGES.labour.general) / 100) + item.material * ((SURCHARGES.material.site + SURCHARGES.material.general) / 100);
  const price = discounted(calculated + (overheads * (item.quantity - executed)) / executed);
  return { price, amount: round2(round2(executed * price) - round2(item.quantity * old)) };
})();
const unchanged = (ordinal: string, rooms: Room[]) => {
  const { item, price } = contractPrice(ordinal);
  return { price, amount: round2(round2(measured(rooms) * price) - round2(item.quantity * price)) };
};
const daywork = (() => {
  const price = discounted(WAGE * (1 + sum(SURCHARGES.labour)));
  return { price, amount: round2(DAYWORK_HOURS * price) };
})();

/** Each change order's new unit price and amount. */
export const GOLD = [
  { id: "N1", trap: "changed tile, offer discount, waste, old adhesive price, contract discount, measured area", ...changed },
  { id: "N2", trap: "added mat, no offer discount, contract discount, measured area", ...added },
  { id: "N3", trap: "openings over 1 m² deducted, over 110 %, no site overhead", ...increased },
  { id: "N4", trap: "door deducted, under 90 %, overheads on the shortfall", ...decreased },
  { id: "N5", trap: "daywork at the original wage", ...daywork },
  { id: "N6", trap: "exactly 110 %: no new price", ...unchanged("02.04", SKIRTING_ROOMS) },
  { id: "N7", trap: "exactly 90 %: no adjustment", ...unchanged("02.01", WATERPROOFING_ROOMS) },
];

export const changeOrders = (lang: Lang) => {
  const t = pick(lang);
  const n = (value: number, decimals = 2) => formatNumber(lang, value, decimals);
  const eur = (value: number, decimals = 2) => t(`${n(value, decimals)} €`, `EUR ${n(value, decimals)}`);
  const surchargeRow = (kind: "labour" | "material", label: string) => {
    const { site, general, riskProfit } = SURCHARGES[kind];
    return `| ${label} | ${n(site, 0)} % | ${n(general, 0)} % | ${n(riskProfit, 0)} % |`;
  };
  const contractRows = CONTRACT.map((item) => {
    const { calculated } = contractPrice(item.ordinal);
    return `| ${item.ordinal} | ${lang === "de" ? item.de : item.en} | ${n(item.quantity, 0)} ${item.unit} | ${n(item.hours)} h | ${eur(item.hours * WAGE)} | ${eur(item.material)} | ${eur(calculated)} |`;
  });
  const room = (rooms: Room[], unit = "m²") =>
    rooms
      .map(([name, gross, openings]) => `| ${t("Raum", "Room")} ${name} | ${n(gross)} ${unit} | ${openings.map(([de, en, area]) => `${t(de, en)} ${n(area)} m²`).join(", ") || "–"} |`)
      .join("\n");
  const docs: Doc[] = [
    {
      id: "BV-07",
      title: t("Bauvertrag Kita Sonnenblume, Los 4 Estrich und Fliesen – Auszug §§ 4 und 7", "Construction contract Kita Sonnenblume, lot 4 screed and tiling – excerpt §§ 4 and 7"),
      pages: [
        t(
          `§ 4 Vergütung und Abrechnung
4.1 Der Auftragnehmer gewährt auf alle Einheitspreise einen Nachlass von ${DISCOUNT} %. Vertrags-EP = EP der Urkalkulation abzüglich ${DISCOUNT} %, kaufmännisch auf 2 Nachkommastellen gerundet.
4.2 Der Nachlass gilt auch für Nachträge: Jeder nach § 7 ermittelte EP wird zunächst auf 2 Nachkommastellen gerundet, dann um ${DISCOUNT} % gemindert und erneut gerundet.
4.3 Abgerechnet wird nach gemeinsamem Aufmaß und VOB/C. Bei Estrich- und Fliesenflächen werden Aussparungen bis ${n(OPENING_LIMIT)} m² Einzelgröße übermessen; größere Aussparungen werden abgezogen.
4.4 Die Urkalkulation ist beim Auftraggeber verschlossen hinterlegt und wird zur Prüfung von Nachträgen geöffnet.`,
          `§ 4 Payment and measurement
4.1 The contractor grants a discount of ${DISCOUNT} % on all unit prices. Contract unit price = the unit price of the original calculation less ${DISCOUNT} %, rounded commercially to 2 decimals.
4.2 The discount also applies to change orders: every unit price worked out under § 7 is first rounded to 2 decimals, then reduced by ${DISCOUNT} % and rounded again.
4.3 Payment follows the joint measurement and VOB/C. For screed and tile areas, openings up to ${n(OPENING_LIMIT)} m² each are measured over; larger openings are deducted.
4.4 The original calculation is deposited sealed with the client and opened to check change orders.`,
        ),
        t(
          `§ 7 Vergütung von Nachträgen (VOB/B gilt ergänzend)
7.1 Grundlage aller Nachtragspreise ist die hinterlegte Urkalkulation (vorkalkulatorische Preisfortschreibung). Mittellohn und Zuschlagssätze der Urkalkulation gelten unverändert; Lohn- und Materialpreissteigerungen seit Vertragsschluss werden nicht vergütet.
7.2 Geänderte und zusätzliche Leistungen (§ 2 Abs. 5 und 6 VOB/B): Aufwandswerte, Verschnitt und Verbrauch aus der Anlage zur Urkalkulation. Stoffe, die in der Urkalkulation enthalten sind, zum Preis der Urkalkulation; neue Stoffe zum Preis des vorgelegten Lieferantenangebots, netto nach dessen Rabatten. Bei einer geänderten Leistung tritt der neue EP für die gesamte Menge an die Stelle des Vertrags-EP.
7.3 Mengenmehrung (§ 2 Abs. 3 Nr. 2 VOB/B): Bis 110 % des Vordersatzes gilt der Vertrags-EP. Für die darüber hinausgehende Menge gilt ein neuer EP: Einzelkosten der Urkalkulation zuzüglich AGK sowie Wagnis und Gewinn nach Urkalkulation; die BGK entfallen.
7.4 Mengenminderung (§ 2 Abs. 3 Nr. 3 VOB/B): Unterschreitet die ausgeführte Menge 90 % des Vordersatzes, gilt für die ausgeführte Menge: neuer EP = EP der Urkalkulation + (BGK- und AGK-Anteil je Einheit laut Urkalkulation × (Vordersatz − ausgeführte Menge)) / ausgeführte Menge.
7.5 Angeordnete Stundenlohnarbeiten: Verrechnungssatz = Mittellohn der Urkalkulation einschließlich der Zuschläge auf Lohn.
7.6 Rundung: Zwischenwerte nicht runden; EP kaufmännisch auf 2 Nachkommastellen; Gesamtpreise = Menge × EP auf 2 Nachkommastellen.
7.7 Nachtragsbetrag = Summe der Gesamtpreise der betroffenen Position nach dem Nachtrag (abgerechnete Menge × jeweils geltender EP) − ihr Gesamtpreis im Vertrag (Vordersatz × Vertrags-EP; bei neuen Leistungen 0). Die Mengenänderung zählt also mit, auch wenn kein neuer Preis entsteht. Der Betrag kann negativ sein.`,
          `§ 7 Payment for change orders (VOB/B applies in addition)
7.1 Every change order price is based on the deposited original calculation (Urkalkulation), carried forward from it. The average wage and the surcharge rates of the original calculation apply unchanged; wage and material price increases since the contract was signed are not paid.
7.2 Changed and additional work (§ 2 (5) and (6) VOB/B): labour norms, waste, and consumption from the appendix to the original calculation. Materials contained in the original calculation at the original calculation's price; new materials at the price of the submitted supplier offer, net of its discounts. For changed work, the new unit price replaces the contract unit price for the whole quantity.
7.3 Quantity increase (§ 2 (3) no. 2 VOB/B): up to 110 % of the tendered quantity the contract unit price applies. The quantity beyond that gets a new unit price: the direct costs of the original calculation plus general overhead and risk and profit as in the original calculation; site overhead is dropped.
7.4 Quantity decrease (§ 2 (3) no. 3 VOB/B): if the executed quantity falls below 90 % of the tendered quantity, the executed quantity gets: new unit price = unit price of the original calculation + (site and general overhead share per unit from the original calculation × (tendered quantity − executed quantity)) / executed quantity.
7.5 Instructed daywork: rate = average wage of the original calculation including the surcharges on labour.
7.6 Rounding: do not round intermediate values; unit prices commercially to 2 decimals; line totals = quantity × unit price to 2 decimals.
7.7 Change order amount = the sum of the affected Item's line totals after the change order (billed quantity × the unit price that applies to it) − its line total in the contract (tendered quantity × contract unit price; 0 for new work). The quantity change therefore counts too, even where no new price arises. The amount can be negative.`,
        ),
      ],
    },
    {
      id: "UKA",
      title: t("Urkalkulation Los 4 (hinterlegt), Bodenbau Krüger GmbH", "Original calculation lot 4 (deposited), Bodenbau Krüger GmbH"),
      pages: [
        t(
          `Kalkulationsgrundlagen
Mittellohn ASL: ${eur(WAGE)}/h
Zuschläge in % der Einzelkosten der jeweiligen Kostenart (additiv):
| Kostenart | BGK | AGK | Wagnis und Gewinn |
|---|---|---|---|
${surchargeRow("labour", "Lohn")}
${surchargeRow("material", "Stoffe")}
EP = Lohnkosten × (1 + Summe der Zuschläge auf Lohn) + Stoffkosten × (1 + Summe der Zuschläge auf Stoffe).`,
          `Calculation basis
Average wage ASL: ${eur(WAGE)}/h
Surcharges in % of the direct costs of each cost type (additive):
| Cost type | Site overhead | General overhead | Risk and profit |
|---|---|---|---|
${surchargeRow("labour", "Labour")}
${surchargeRow("material", "Materials")}
Unit price = labour cost × (1 + sum of the labour surcharges) + material cost × (1 + sum of the material surcharges).`,
        ),
        t(
          `Positionen
| Pos. | Leistung | Vordersatz | Aufwandswert | Lohn je Einheit | Stoffe je Einheit | EP Urkalkulation |
|---|---|---|---|---|---|---|
${contractRows.join("\n")}

Stoffe Pos. 02.02 je m²: Feinsteinzeug 30 × 60 ${eur(PRICES.tile30)}/m² × ${n(1 + NORMS.floor30.waste / 100)} m²; Flexkleber C2TE S1 ${eur(PRICES.adhesive)}/kg × ${n(NORMS.floor30.adhesive, 1)} kg; Fugenmörtel ${eur(PRICES.grout)}/kg × ${n(NORMS.floor30.grout)} kg.
Stoffe Pos. 02.03 je m²: Wandfliese 30 × 60 ${eur(PRICES.wallTile)}/m² × ${n(1 + NORMS.wall30.waste / 100)} m²; Flexkleber C2TE S1 ${eur(PRICES.adhesive)}/kg × ${n(NORMS.wall30.adhesive, 1)} kg; Fugenmörtel ${eur(PRICES.grout)}/kg × ${n(NORMS.wall30.grout)} kg.`,
          `Items
| Item | Work | Tendered quantity | Labour norm | Labour per unit | Materials per unit | Unit price of the original calculation |
|---|---|---|---|---|---|---|
${contractRows.join("\n")}

Materials item 02.02 per m²: porcelain stoneware 30 × 60 ${eur(PRICES.tile30)}/m² × ${n(1 + NORMS.floor30.waste / 100)} m²; flexible adhesive C2TE S1 ${eur(PRICES.adhesive)}/kg × ${n(NORMS.floor30.adhesive, 1)} kg; grout ${eur(PRICES.grout)}/kg × ${n(NORMS.floor30.grout)} kg.
Materials item 02.03 per m²: wall tile 30 × 60 ${eur(PRICES.wallTile)}/m² × ${n(1 + NORMS.wall30.waste / 100)} m²; flexible adhesive C2TE S1 ${eur(PRICES.adhesive)}/kg × ${n(NORMS.wall30.adhesive, 1)} kg; grout ${eur(PRICES.grout)}/kg × ${n(NORMS.wall30.grout)} kg.`,
        ),
        t(
          `Anlage: Aufwandswerte, Verschnitt und Verbrauch je m²
| Leistung | Aufwandswert | Verschnitt Fliese/Matte | Flexkleber | Fugenmörtel |
|---|---|---|---|---|
| Bodenfliesen 30 × 60 cm, Dünnbett | ${n(NORMS.floor30.hours)} h | ${NORMS.floor30.waste} % | ${n(NORMS.floor30.adhesive, 1)} kg | ${n(NORMS.floor30.grout)} kg |
| Bodenfliesen 60 × 60 cm, Dünnbett | ${n(NORMS.floor60.hours)} h | ${NORMS.floor60.waste} % | ${n(NORMS.floor60.adhesive, 1)} kg | ${n(NORMS.floor60.grout)} kg |
| Bodenfliesen 120 × 60 cm, Dünnbett | ${n(NORMS.floor120.hours)} h | ${NORMS.floor120.waste} % | ${n(NORMS.floor120.adhesive, 1)} kg | ${n(NORMS.floor120.grout)} kg |
| Wandfliesen 30 × 60 cm, Dünnbett | ${n(NORMS.wall30.hours)} h | ${NORMS.wall30.waste} % | ${n(NORMS.wall30.adhesive, 1)} kg | ${n(NORMS.wall30.grout)} kg |
| Entkopplungsmatte verlegen | ${n(NORMS.mat.hours)} h | ${NORMS.mat.waste} % | ${n(NORMS.mat.adhesive, 1)} kg | – |`,
          `Appendix: labour norms, waste, and consumption per m²
| Work | Labour norm | Waste tile/mat | Flexible adhesive | Grout |
|---|---|---|---|---|
| Floor tiles 30 × 60 cm, thin bed | ${n(NORMS.floor30.hours)} h | ${NORMS.floor30.waste} % | ${n(NORMS.floor30.adhesive, 1)} kg | ${n(NORMS.floor30.grout)} kg |
| Floor tiles 60 × 60 cm, thin bed | ${n(NORMS.floor60.hours)} h | ${NORMS.floor60.waste} % | ${n(NORMS.floor60.adhesive, 1)} kg | ${n(NORMS.floor60.grout)} kg |
| Floor tiles 120 × 60 cm, thin bed | ${n(NORMS.floor120.hours)} h | ${NORMS.floor120.waste} % | ${n(NORMS.floor120.adhesive, 1)} kg | ${n(NORMS.floor120.grout)} kg |
| Wall tiles 30 × 60 cm, thin bed | ${n(NORMS.wall30.hours)} h | ${NORMS.wall30.waste} % | ${n(NORMS.wall30.adhesive, 1)} kg | ${n(NORMS.wall30.grout)} kg |
| Laying an uncoupling mat | ${n(NORMS.mat.hours)} h | ${NORMS.mat.waste} % | ${n(NORMS.mat.adhesive, 1)} kg | – |`,
        ),
      ],
    },
    {
      id: "AO-AG",
      title: t("Anordnungen des Auftraggebers und Nachtragsliste", "Client instructions and change order list"),
      pages: [
        t(
          `N1 (§ 2 Abs. 5 VOB/B): Die Bodenfliesen der Pos. 02.02 werden statt im Format 30 × 60 cm im Format 60 × 60 cm verlegt, Feinsteinzeug grau matt, R10, rektifiziert, auf der gesamten Fläche der Position.
N2 (§ 2 Abs. 6 VOB/B): Unter allen Bodenfliesen der Pos. 02.02 wird zusätzlich eine Entkopplungsmatte verlegt, auf der gesamten Fläche der Position.
N3 (§ 2 Abs. 3 VOB/B): Mengenmehrung Zementestrich Pos. 01.01 laut Aufmaß.
N4 (§ 2 Abs. 3 VOB/B): Mengenminderung Wandfliesen Pos. 02.03 laut Aufmaß; der Auftragnehmer verlangt die Anpassung des EP.
N5 (§ 2 Abs. 10 VOB/B): Angeordnete Stundenlohnarbeiten, Rückbau Altbelag im Bestandsflur: ${DAYWORK_HOURS} Facharbeiterstunden laut unterschriebenem Stundenzettel.
N6 (§ 2 Abs. 3 VOB/B): Mengenmehrung Sockelfliesen Pos. 02.04 laut Aufmaß; der Auftragnehmer verlangt einen neuen Preis.
N7 (§ 2 Abs. 3 VOB/B): Mengenminderung Verbundabdichtung Pos. 02.01 laut Aufmaß; der Auftragnehmer verlangt die Anpassung des EP.`,
          `N1 (§ 2 (5) VOB/B): the floor tiles of item 02.02 are laid in 60 × 60 cm instead of 30 × 60 cm, porcelain stoneware grey matt, R10, rectified, over the whole area of the Item.
N2 (§ 2 (6) VOB/B): an uncoupling mat is laid in addition under all floor tiles of item 02.02, over the whole area of the Item.
N3 (§ 2 (3) VOB/B): quantity increase cement screed item 01.01 per the measurement sheet.
N4 (§ 2 (3) VOB/B): quantity decrease wall tiles item 02.03 per the measurement sheet; the contractor requests the unit price adjustment.
N5 (§ 2 (10) VOB/B): instructed daywork, removal of the old floor covering in the existing corridor: ${DAYWORK_HOURS} skilled worker hours per the signed daywork sheet.
N6 (§ 2 (3) VOB/B): quantity increase skirting tiles item 02.04 per the measurement sheet; the contractor requests a new price.
N7 (§ 2 (3) VOB/B): quantity decrease bonded waterproofing item 02.01 per the measurement sheet; the contractor requests the unit price adjustment.`,
        ),
      ],
    },
    {
      id: "AUF-03",
      title: t("Aufmaß Nr. 3 (gemeinsam festgestellt)", "Measurement sheet no. 3 (jointly agreed)"),
      pages: [
        t(
          `Pos. 01.01 Zementestrich
| Raum | Fläche brutto | Aussparungen |
|---|---|---|
${room(SCREED_ROOMS)}

Pos. 02.02 Bodenfliesen
| Raum | Fläche brutto | Aussparungen |
|---|---|---|
${room(FLOOR_ROOMS)}

Pos. 02.03 Wandfliesen
| Raum | Fläche brutto | Aussparungen |
|---|---|---|
${room(WALL_ROOMS)}

Pos. 02.01 Verbundabdichtung
| Raum | Fläche brutto | Aussparungen |
|---|---|---|
${room(WATERPROOFING_ROOMS)}

Pos. 02.04 Sockelfliesen
| Raum | Länge | Aussparungen |
|---|---|---|
${room(SKIRTING_ROOMS, "m")}`,
          `Item 01.01 cement screed
| Room | Gross area | Openings |
|---|---|---|
${room(SCREED_ROOMS)}

Item 02.02 floor tiles
| Room | Gross area | Openings |
|---|---|---|
${room(FLOOR_ROOMS)}

Item 02.03 wall tiles
| Room | Gross area | Openings |
|---|---|---|
${room(WALL_ROOMS)}

Item 02.01 bonded waterproofing
| Room | Gross area | Openings |
|---|---|---|
${room(WATERPROOFING_ROOMS)}

Item 02.04 skirting tiles
| Room | Length | Openings |
|---|---|---|
${room(SKIRTING_ROOMS, "m")}`,
        ),
      ],
    },
    {
      id: "ANG-N2207",
      title: t("Lieferantenangebot N-2207, Fliesen Hoffmann GmbH", "Supplier offer N-2207, Fliesen Hoffmann GmbH"),
      pages: [
        t(
          `| Art.-Nr. | Bezeichnung | Preis netto |
|---|---|---|
| FS-6061 | Feinsteinzeug 60 × 60 cm, grau matt, R9 | 45,36 € je Paket (1,08 m²) |
| FS-6062 | Feinsteinzeug 60 × 60 cm, grau matt, R10, rektifiziert | ${n(OFFER.tile60.price)} € je Paket (${n(OFFER.tile60.pack)} m²) |
| FS-6063 | Feinsteinzeug 60 × 60 cm, anthrazit, R10, rektifiziert | 52,92 € je Paket (1,08 m²) |
| EM-0030 | Entkopplungsmatte, Rolle 30 m² | ${n(OFFER.mat.price)} € je Rolle |
| KL-2025 | Flexkleber C2TE S1, Sack 25 kg | 19,80 € je Sack |

Konditionen: Auf Feinsteinzeug gewähren wir ${OFFER.tileDiscount} % Rabatt; alle übrigen Artikel netto. Lieferung frei Baustelle.`,
          `| Article | Description | Net price |
|---|---|---|
| FS-6061 | Porcelain stoneware 60 × 60 cm, grey matt, R9 | EUR 45.36 per pack (1.08 m²) |
| FS-6062 | Porcelain stoneware 60 × 60 cm, grey matt, R10, rectified | EUR ${n(OFFER.tile60.price)} per pack (${n(OFFER.tile60.pack)} m²) |
| FS-6063 | Porcelain stoneware 60 × 60 cm, anthracite, R10, rectified | EUR 52.92 per pack (1.08 m²) |
| EM-0030 | Uncoupling mat, 30 m² roll | EUR ${n(OFFER.mat.price)} per roll |
| KL-2025 | Flexible adhesive C2TE S1, 25 kg bag | EUR 19.80 per bag |

Conditions: we grant ${OFFER.tileDiscount} % discount on porcelain stoneware; all other articles net. Delivery free to site.`,
        ),
      ],
    },
    {
      id: "LB-2026",
      title: t("Lohnblatt 2026, Bodenbau Krüger GmbH", "Wage sheet 2026, Bodenbau Krüger GmbH"),
      pages: [
        t(
          `Mittellohn ASL ab 01.03.2026 nach Tariferhöhung: ${eur(WAGE_2026)}/h (Kalkulationen ab März 2026).`,
          `Average wage ASL from 1 Mar 2026 after the collective wage increase: ${eur(WAGE_2026)}/h (for calculations from March 2026).`,
        ),
      ],
    },
  ];
  return { docs };
};
