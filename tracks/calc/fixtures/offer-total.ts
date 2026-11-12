/**
 * A seeded sanitary tender, ported from the 90/10 totals eval: an LV with unit prices, preliminary
 * notes that decide which items count, three amendments (one changes a quantity twice), answers to
 * bidder questions, and a cover letter with a threshold discount on some titles only. Ground truth
 * by construction.
 */
import type { Lang } from "../../../src/types";
import { fmt } from "../shared";

type Text = Record<Lang, string>;
export type Position = { ordinal: string; text: Text; quantity: number; unit: string; unitPrice: number; marking?: Text };

let seed = 4711;
const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const price = (min: number, max: number) => {
  const value = min + random() * (max - min);
  return random() < 0.3 ? Math.round(value * 1000) / 1000 : Math.round(value * 100) / 100;
};

type Line = [de: string, en: string, unit: string, min: number, max: number];
const TEXTS: Record<"01" | "02", Line[]> = {
  "01": [
    ["KG-Rohr DN 110, liefern und verlegen", "KG sewer pipe DN 110, supply and lay", "m", 14, 26],
    ["KG-Rohr DN 125, liefern und verlegen", "KG sewer pipe DN 125, supply and lay", "m", 18, 30],
    ["HT-Rohr DN 50, liefern und verlegen", "HT drain pipe DN 50, supply and lay", "m", 8, 14],
    ["Bodenablauf DN 100 mit Geruchsverschluss", "Floor drain DN 100 with odour trap", "Stk", 150, 260],
    ["Bodenablauf DN 100, Edelstahl, mit Geruchsverschluss", "Floor drain DN 100, stainless steel, with odour trap", "Stk", 210, 320],
    ["Zulage zu Pos. 01.02 für Formstücke", "Supplement to item 01.02 for fittings", "Stk", 4, 9],
    ["Rohrreinigung und Kamerabefahrung der Grundleitungen", "Pipe cleaning and CCTV inspection of the underground drains", "psch", 400, 900],
    ["Revisionsschacht DN 400, liefern und setzen", "Inspection chamber DN 400, supply and install", "Stk", 380, 620],
    ["Rückstauverschluss DN 125", "Backflow stop DN 125", "Stk", 290, 470],
    ["HT-Rohr DN 75, liefern und verlegen", "HT drain pipe DN 75, supply and lay", "m", 11, 18],
    ["Fallleitung DN 100 SML, liefern und montieren", "Soil stack DN 100 SML, supply and install", "m", 38, 62],
    ["Reinigungsöffnung DN 100", "Cleaning access DN 100", "Stk", 45, 85],
    ["Bodenablauf Balkon DN 70", "Balcony floor drain DN 70", "Stk", 120, 190],
    ["Anschluss an Grundleitung herstellen", "Connection to the underground drain", "Stk", 60, 120],
  ],
  "02": [
    ["Edelstahlrohr 22 mm, liefern und verlegen", "Stainless steel pipe 22 mm, supply and lay", "m", 19, 28],
    ["Edelstahlrohr 28 mm, liefern und verlegen", "Stainless steel pipe 28 mm, supply and lay", "m", 25, 36],
    ["Zulage zu Pos. 02.01 für Pressfittings", "Supplement to item 02.01 for press fittings", "Stk", 8, 15],
    ["Druckminderer DN 32", "Pressure reducer DN 32", "Stk", 320, 520],
    ["Spülung und Desinfektion eines zusätzlichen Strangs", "Flushing and disinfection of an additional riser", "psch", 280, 480],
    ["Druckprobe und Spülung der Trinkwasseranlage", "Pressure test and flushing of the drinking water system", "psch", 900, 1600],
    ["Dämmung Edelstahlrohr 22 mm", "Insulation of stainless steel pipe 22 mm", "m", 3, 6],
    ["Dämmung Edelstahlrohr 28 mm", "Insulation of stainless steel pipe 28 mm", "m", 4, 7],
    ["Zirkulationspumpe, Hocheffizienz", "Circulation pump, high efficiency", "Stk", 380, 640],
    ["Strangregulierventil DN 20", "Riser balancing valve DN 20", "Stk", 85, 140],
    ["Wasserzähler-Montageblock", "Water meter mounting block", "Stk", 120, 210],
    ["Absperrventil DN 25", "Shut-off valve DN 25", "Stk", 28, 46],
    ["Freistromventil DN 32", "Free-flow valve DN 32", "Stk", 70, 115],
    ["Rohrbefestigung Schienensystem", "Pipe supports, rail system", "m", 9, 16],
  ],
};
const CONTINGENCY: Line[] = [
  ["Kernbohrung DN 150 durch Stahlbeton", "Core drilling DN 150 through reinforced concrete", "Stk", 80, 120],
  ["Rohrleitung provisorisch umlegen", "Temporary rerouting of pipework", "m", 28, 40],
  ["Wanddurchbruch nach Rohrdurchführung schließen", "Closing a wall opening after the pipe penetration", "Stk", 22, 34],
  ["Zusätzliche Druckprobe Teilstrang", "Additional pressure test of a sub-section", "psch", 180, 260],
  ["Stemmarbeiten Mauerwerk", "Chasing in masonry", "m", 18, 30],
];
const HOURLY: Array<[string, string, number]> = [
  ["Monteurstunde", "Fitter hour", 58],
  ["Helferstunde", "Labourer hour", 44],
  ["Meisterstunde", "Master craftsman hour", 72],
];
const LUMP: Array<[string, string, number]> = [
  ["Baustelleneinrichtung und -räumung", "Site setup and clearance", 1850],
  ["Dokumentation und Revisionsunterlagen", "Documentation and as-built records", 720],
  ["Inbetriebnahme und Einweisung", "Commissioning and instruction", 640],
];
export const UNITS: Record<string, Text> = { m: { de: "m", en: "m" }, Stk: { de: "Stk", en: "pcs" }, psch: { de: "psch", en: "LS" }, h: { de: "h", en: "h" } };
export const TITLES: Record<string, Text> = {
  "01": { de: "Entwässerung", en: "Drainage" },
  "02": { de: "Trinkwasser", en: "Drinking water" },
  "03": { de: "Bedarfsleistungen", en: "Contingency works" },
  "04": { de: "Stundenlohnarbeiten", en: "Daywork" },
  "05": { de: "Pauschalleistungen", en: "Lump-sum works" },
};

const quantityFor = (unit: string) =>
  unit === "psch" ? 1 : unit === "m" ? (random() < 0.4 ? Math.round((10 + random() * 140) * 2) / 2 : Math.round(10 + random() * 140)) : Math.round(2 + random() * 22);

const SECTIONS: Text[] = [
  { de: "", en: "" },
  { de: " – Bauteil B", en: " – Building B" },
  { de: " – Bauteil C", en: " – Building C" },
  { de: " – Außenanlagen", en: " – External works" },
];
const ordinal = (title: string, index: number) => `${title}.${String(index).padStart(2, "0")}`;

export const POSITIONS: Position[] = [];
for (const title of ["01", "02"] as const) {
  let n = 0;
  for (const section of SECTIONS)
    for (const [de, en, unit, min, max] of TEXTS[title])
      POSITIONS.push({ ordinal: ordinal(title, ++n), text: { de: de + section.de, en: en + section.en }, quantity: quantityFor(unit), unit, unitPrice: price(min, max) });
}
CONTINGENCY.forEach(([de, en, unit, min, max], index) => POSITIONS.push({ ordinal: ordinal("03", index + 1), text: { de, en }, quantity: quantityFor(unit), unit, unitPrice: price(min, max) }));
HOURLY.forEach(([de, en, rate], index) => POSITIONS.push({ ordinal: ordinal("04", index + 1), text: { de, en }, quantity: Math.round(8 + random() * 32), unit: "h", unitPrice: rate }));
LUMP.forEach(([de, en, lump], index) => POSITIONS.push({ ordinal: ordinal("05", index + 1), text: { de, en }, quantity: 1, unit: "psch", unitPrice: lump }));

const MARKINGS: Record<string, Text> = {
  "01.05": { de: "Wahlposition zu 01.04", en: "Alternative item to 01.04" },
  "01.10": { de: "Wahlposition zu 01.02", en: "Alternative item to 01.02" },
  "02.05": { de: "Bedarfsposition", en: "Contingency item" },
  "02.07": { de: "ohne GB", en: "without total" },
  "02.11": { de: "Bedarfsposition", en: "Contingency item" },
  "01.12": { de: "ohne GB", en: "without total" },
  "01.20": { de: "nur EP", en: "unit price only" },
  "02.16": { de: "Alternativposition zu 02.15", en: "Alternative to 02.15" },
  "02.25": { de: "Eventualposition", en: "Provisional item" },
};
for (const position of POSITIONS) if (MARKINGS[position.ordinal]) position.marking = MARKINGS[position.ordinal];

export const ORIGINAL_0103 = POSITIONS.find((position) => position.ordinal === "01.03")!.quantity;

export const ORIGINAL_0201 = POSITIONS.find((position) => position.ordinal === "02.01")!.quantity;

/** 01.04 is replaced by 01.05 (3rd amendment), 02.04 dropped (1st), 02.05 and 03.02 become base items (2nd), 02.25 a base item (answer 1). */
export const EXCLUDED = new Set(["01.04", "01.10", "01.12", "01.20", "02.04", "02.07", "02.11", "02.16", "03.01", "03.03", "03.04", "03.05"]);
export const AMENDED_QUANTITIES: Record<string, number> = { "01.03": 72.5, "02.01": 118 };
/** The items a rule, amendment or answer decides on; every other item simply counts. */
export const DECISIONS = [
  "01.04",
  "01.05",
  "01.10",
  "01.12",
  "01.20",
  "02.04",
  "02.05",
  "02.07",
  "02.11",
  "02.16",
  "02.25",
  "03.01",
  "03.02",
  "03.03",
  "03.04",
  "03.05",
  "04.01",
  "04.02",
  "04.03",
];

const totalsFor = (rate: number) => {
  let net = 0;
  let discountable = 0;
  for (const position of POSITIONS) {
    if (EXCLUDED.has(position.ordinal)) continue;
    const total = Math.round((AMENDED_QUANTITIES[position.ordinal] ?? position.quantity) * position.unitPrice * 100);
    net += total;
    if (["01", "02"].includes(position.ordinal.slice(0, 2))) discountable += total;
  }
  return { net, percent: Math.round(discountable * rate) };
};
export const THRESHOLD = Math.floor(totalsFor(0.03).net / 100 / 5000) * 5000;
export const LUMP_DISCOUNT = 250;

/** The offer totals in EUR. */
export const GOLD = (() => {
  const { net, percent } = totalsFor(totalsFor(0).net / 100 > THRESHOLD ? 0.04 : 0.03);
  const afterDiscount = net - percent - LUMP_DISCOUNT * 100;
  const vat = Math.round(afterDiscount * 0.19);
  return { net: net / 100, percent: percent / 100, lump: LUMP_DISCOUNT, afterDiscount: afterDiscount / 100, vat: vat / 100, gross: (afterDiscount + vat) / 100 };
})();

const de = (value: number, decimals = 2) => fmt("de", value, decimals);
const en = (value: number, decimals = 2) => fmt("en", value, decimals);

/** The preliminary notes, page by page. */
export const NOTES: Record<Lang, string[]> = {
  de: [
    `VORBEMERKUNGEN ZUM LEISTUNGSVERZEICHNIS
Bauvorhaben: Neubau Kindertagesstätte Sonnenweg 12, 12049 Berlin
Gewerk: Sanitärinstallation (Entwässerung, Trinkwasser)

1. Allgemeines
1.1 Grundlage des Vertrages sind die VOB/B und VOB/C in der bei Angebotsabgabe gültigen Fassung, die Allgemeinen Vertragsbedingungen des Auftraggebers sowie die nachfolgenden Vorbemerkungen.
1.2 Der Bieter hat sich vor Angebotsabgabe über die örtlichen Verhältnisse zu informieren. Eine Ortsbesichtigung ist nach Vereinbarung mit der Bauleitung möglich. Nachforderungen aus Unkenntnis der örtlichen Verhältnisse werden nicht anerkannt.
1.3 Die Baustelleneinrichtung ist in die Einheitspreise einzurechnen, soweit hierfür keine eigene Position vorgesehen ist. Strom und Bauwasser werden vom Auftraggeber an zentraler Stelle zur Verfügung gestellt; die Verbrauchskosten werden pauschal mit 0,4 % der Abrechnungssumme verrechnet.
1.4 Alle Arbeiten sind mit den übrigen Gewerken abzustimmen. Der Bauzeitenplan ist verbindlich. Behinderungen sind unverzüglich schriftlich anzuzeigen.

2. Ausführung
2.1 Es dürfen nur Materialien mit allgemeiner bauaufsichtlicher Zulassung verwendet werden. Für Trinkwasserinstallationen gelten die DIN 1988 und die DIN EN 806 sowie das DVGW-Arbeitsblatt W 551.
2.2 Fabrikatsangaben sind Leitfabrikate. Gleichwertige Fabrikate sind zulässig, wenn die Gleichwertigkeit vom Bieter nachgewiesen wird. Ohne Angabe gilt das Leitfabrikat als angeboten.
2.3 Druckproben sind zu protokollieren. Die Protokolle sind der Bauleitung spätestens drei Werktage nach Durchführung zu übergeben.
2.4 Abfälle sind arbeitstäglich zu beseitigen. Die Entsorgung ist in die Einheitspreise einzurechnen.`,
    `3. Positionsarten
3.1 Grundpositionen sind Positionen, die zur Ausführung vorgesehen sind. Sie werden mit ihrem Gesamtbetrag in die Angebotssumme eingerechnet.
3.2 Sämtliche Positionen des Titels 03 „Bedarfsleistungen“ sind Bedarfspositionen (Eventualpositionen). Sie werden nur mit Einheitspreis angeboten und nicht in die Angebotssumme eingerechnet, auch wenn sie im Leistungsverzeichnis nicht einzeln als Bedarfsposition gekennzeichnet sind.
3.3 Einzeln gekennzeichnete Bedarfspositionen in anderen Titeln werden ebenfalls nicht in die Angebotssumme eingerechnet.
3.4 Wahlpositionen (Alternativpositionen) werden nur mit Einheitspreis angeboten und nicht in die Angebotssumme eingerechnet. Die Entscheidung über die Ausführung trifft der Auftraggeber bei der Vergabe.
3.5 Zulagepositionen werden mit ihrem Gesamtbetrag in die Angebotssumme eingerechnet.
3.6 Stundenlohnarbeiten (Titel 04) werden nur nach vorheriger schriftlicher Anordnung der Bauleitung vergütet. Sie sind mit ihrem Gesamtbetrag in die Angebotssumme einzurechnen.
3.7 Positionen mit dem Vermerk „ohne GB“ oder „nur EP“ werden nur mit Einheitspreis angeboten und nicht in die Angebotssumme eingerechnet.
3.8 Pauschalleistungen (Titel 05) werden mit ihrem Pauschalpreis in die Angebotssumme eingerechnet.`,
    `4. Preise und Abrechnung
4.1 Die Einheitspreise sind Festpreise bis zur Fertigstellung der Leistung.
4.2 Abgerechnet wird nach Aufmaß. Das Aufmaß ist gemeinsam mit der Bauleitung zu nehmen.
4.3 Gesamtbeträge (Menge × Einheitspreis) sind kaufmännisch auf volle Cent zu runden. Die Angebotssumme ist die Summe der gerundeten Gesamtbeträge aller einzurechnenden Positionen.
4.4 Die Umsatzsteuer beträgt 19 % und wird auf die Angebotssumme nach Abzug der Nachlässe berechnet und auf volle Cent gerundet.

5. Gewährleistung und Sicherheiten
5.1 Die Verjährungsfrist für Mängelansprüche beträgt fünf Jahre ab Abnahme.
5.2 Als Sicherheit für die Vertragserfüllung ist eine Bürgschaft in Höhe von 5 % der Auftragssumme zu stellen.
5.3 Skontoangebote werden bei der Wertung nicht berücksichtigt.`,
    `6. 3. Änderung vom 20.09.2026 (Bestandteil der Vergabeunterlagen)
6.1 Die Wahlposition 01.05 wird anstelle der Pos. 01.04 als Grundposition ausgeschrieben. Pos. 01.04 entfällt.
6.2 Die übrigen Festlegungen der 1. und 2. Änderung bleiben bestehen.

7. 2. Änderung vom 03.09.2026 (Bestandteil der Vergabeunterlagen)
7.1 Abweichend von Ziffer 8.2 beträgt die Menge der Pos. 01.03 72,5 m.
7.2 Die Bedarfsposition 02.05 wird als Grundposition ausgeschrieben.
7.3 Pos. 03.02 wird abweichend von Ziffer 3.2 als Grundposition ausgeschrieben.
7.4 Stundenlohnarbeiten werden bei der Wertung der Angebote nicht berücksichtigt; in der Angebotssumme bleiben sie enthalten.

8. 1. Änderung vom 12.08.2026 (Bestandteil der Vergabeunterlagen)
8.1 Pos. 02.04 entfällt ersatzlos.
8.2 Die Menge der Pos. 01.03 wird von ${de(ORIGINAL_0103, Number.isInteger(ORIGINAL_0103) ? 0 : 1)} m auf 85 m erhöht.
8.3 Der Termin für die Angebotsabgabe bleibt unverändert.`,
  ],
  en: [
    `PRELIMINARY NOTES TO THE BILL OF QUANTITIES
Project: new daycare centre Sonnenweg 12, 12049 Berlin
Trade: sanitary installation (drainage, drinking water)

1. General
1.1 The contract is based on VOB/B and VOB/C in the version valid at the time of bidding, the client's general terms of contract and the following preliminary notes.
1.2 Bidders must inform themselves about local conditions before bidding. A site visit can be arranged with the site management. Claims arising from ignorance of local conditions will not be accepted.
1.3 Site setup is to be included in the unit prices unless a separate item is provided for it. Power and construction water are provided by the client at a central point; consumption costs are charged as a lump sum of 0.4 % of the final account.
1.4 All works are to be coordinated with the other trades. The construction schedule is binding. Obstructions are to be reported in writing without delay.

2. Execution
2.1 Only materials with a general building authority approval may be used. Drinking water installations are subject to DIN 1988, DIN EN 806 and DVGW worksheet W 551.
2.2 Named products are reference products. Equivalent products are permitted if the bidder proves equivalence. Without a statement, the reference product is deemed offered.
2.3 Pressure tests are to be recorded. The records are to be handed to the site management no later than three working days after the test.
2.4 Waste is to be removed daily. Disposal is to be included in the unit prices.`,
    `3. Types of items
3.1 Base items are items intended for execution. They are included in the offer total with their total amount.
3.2 All items of title 03 "Contingency works" are contingency items (provisional items). They are offered with a unit price only and not included in the offer total, even if they are not individually marked as contingency items in the bill of quantities.
3.3 Individually marked contingency items in other titles are likewise not included in the offer total.
3.4 Alternative items (alternatives) are offered with a unit price only and not included in the offer total. The client decides on their execution at award.
3.5 Supplement items are included in the offer total with their total amount.
3.6 Daywork (title 04) is only paid after prior written instruction by the site management. It is to be included in the offer total with its total amount.
3.7 Items marked "without total" or "unit price only" are offered with a unit price only and not included in the offer total.
3.8 Lump-sum works (title 05) are included in the offer total with their lump-sum price.`,
    `4. Prices and invoicing
4.1 Unit prices are fixed until completion of the works.
4.2 Invoicing is based on measurement. Measurements are to be taken jointly with the site management.
4.3 Total amounts (quantity × unit price) are to be rounded half up to whole cents. The offer total is the sum of the rounded total amounts of all items to be included.
4.4 VAT is 19 % and is calculated on the offer total after deduction of the discounts and rounded to whole cents.

5. Warranty and securities
5.1 The limitation period for claims for defects is five years from acceptance.
5.2 A guarantee of 5 % of the contract sum is to be provided as performance security.
5.3 Cash discount offers are not considered in the evaluation.`,
    `6. 3rd amendment of 20 Sep 2026 (part of the tender documents)
6.1 Alternative item 01.05 is tendered as a base item instead of item 01.04. Item 01.04 is deleted.
6.2 The other provisions of the 1st and 2nd amendment remain in force.

7. 2nd amendment of 3 Sep 2026 (part of the tender documents)
7.1 Notwithstanding clause 8.2, the quantity of item 01.03 is 72.5 m.
7.2 Contingency item 02.05 is tendered as a base item.
7.3 Notwithstanding clause 3.2, item 03.02 is tendered as a base item.
7.4 Daywork is not considered in the evaluation of the offers; it remains included in the offer total.

8. 1st amendment of 12 Aug 2026 (part of the tender documents)
8.1 Item 02.04 is deleted without replacement.
8.2 The quantity of item 01.03 is increased from ${en(ORIGINAL_0103, Number.isInteger(ORIGINAL_0103) ? 0 : 1)} m to 85 m.
8.3 The bid deadline remains unchanged.`,
  ],
};

export const ANSWERS: Record<Lang, string> = {
  de: `ANTWORTEN AUF BIETERFRAGEN – Rundschreiben vom 25.09.2026
Die Antworten sind Bestandteil der Vergabeunterlagen.

Frage 1: Werden Stundenlohnarbeiten bei der Wertung berücksichtigt?
Antwort: Nein, siehe 2. Änderung, Ziffer 7.4.

Frage 2: Die Menge der Pos. 02.01 weicht vom Strangschema ab, das rund 118 m ergibt.
Antwort: Die Menge der Pos. 02.01 wird auf 118 m geändert.

Frage 3: Ist die Eventualposition 02.25 nur mit Einheitspreis anzubieten?
Antwort: Nein. Pos. 02.25 wird als Grundposition ausgeschrieben.

Frage 4: Darf der Nachlass auf einzelne Titel beschränkt werden?
Antwort: Nachlässe sind Sache des Bieters; der Auftraggeber macht hierzu keine Vorgaben.`,
  en: `ANSWERS TO BIDDER QUESTIONS – circular of 25 Sep 2026
The answers are part of the tender documents.

Question 1: Is daywork considered in the evaluation?
Answer: No, see 2nd amendment, clause 7.4.

Question 2: The quantity of item 02.01 differs from the riser diagram, which gives about 118 m.
Answer: The quantity of item 02.01 is changed to 118 m.

Question 3: Is provisional item 02.25 to be offered with a unit price only?
Answer: No. Item 02.25 is tendered as a base item.

Question 4: May the discount be limited to individual titles?
Answer: Discounts are up to the bidder; the client sets no requirements.`,
};

export const COVER_LETTER: Record<Lang, string> = {
  de: `Angebotsschreiben des Bieters (Haustechnik Müller GmbH, 02.10.2026)
Wir bieten die Leistungen zu den Einheitspreisen des beiliegenden Leistungsverzeichnisses an. Auf die Gesamtbeträge der Titel 01 und 02 gewähren wir einen Nachlass von 3 %; liegt die Angebotssumme vor Nachlässen über ${de(THRESHOLD)} €, beträgt dieser Nachlass 4 %. Zusätzlich gewähren wir einen Pauschalnachlass von ${de(LUMP_DISCOUNT)} € auf die Angebotssumme nach Abzug des prozentualen Nachlasses. Für Stundenlohnarbeiten und Pauschalleistungen gilt kein prozentualer Nachlass. Nachlässe werden kaufmännisch auf volle Cent gerundet. Bei Zahlung innerhalb von 14 Tagen gewähren wir 2,5 % Skonto.`,
  en: `Bidder's cover letter (Haustechnik Müller GmbH, 2 Oct 2026)
We offer the works at the unit prices of the enclosed bill of quantities. On the total amounts of titles 01 and 02 we grant a discount of 3 %; if the offer total before discounts exceeds EUR ${en(THRESHOLD)}, this discount is 4 %. In addition, we grant a lump-sum discount of EUR ${en(LUMP_DISCOUNT)} on the offer total after deduction of the percentage discount. No percentage discount applies to daywork and lump-sum works. Discounts are rounded half up to whole cents. For payment within 14 days we grant a 2.5 % cash discount.`,
};
