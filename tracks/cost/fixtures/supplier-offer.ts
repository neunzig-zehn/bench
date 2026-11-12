/**
 * A supplier offer built from product catalogs, and the LV Items priced from it, each with its gold
 * answer and the trap it sets.
 */
export type Line = {
  id: string;
  articleNo: string;
  text: string;
  unit: string;
  price: number;
  priceUnit?: number;
  packaging?: string;
  discountPercent?: number;
  notes?: string;
};
export type Item = {
  id: string;
  ordinal: string;
  short: string;
  long: string;
  quantity: number;
  unit: string;
};
/** The right answer; an Item that allows an equivalent ("oder gleichwertig") has one per line. */
export type Gold = Array<{ lines: string[]; unitPrice: number }> | "unpriced";

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

// ---- offer lines -------------------------------------------------------------------------
const byArticle = new Map<string, Line>();
const LINES: Line[] = [];
const add = (line: Omit<Line, "id">) => {
  const full = { id: "", ...line };
  LINES.push(full);
  byArticle.set(line.articleNo, full);
};

const KG_BASE: Record<number, number> = { 110: 4.6, 125: 5.4, 160: 8.9 };
for (const dn of [110, 125, 160])
  for (const length of [500, 1000, 2000])
    add({
      articleNo: `10${dn}${length / 500}`,
      text: `KG-Rohr DN ${dn} x ${length} mm, SN 4`,
      unit: "Stk",
      price: round2(KG_BASE[dn]! * (length / 1000) + 0.6),
    });
for (const [dn, price] of [
  [110, 4.8],
  [125, 5.6],
  [160, 8.9],
] as const)
  add({
    articleNo: `10${dn}9`,
    text: `Mehrpreis für Formstücke KG DN ${dn} (Bögen, Abzweige), gemittelt`,
    unit: "Stk",
    price,
    notes: "Zulage gegenüber Rohr, je Formstück",
  });
for (const [dn, price] of [
  [110, 3.6],
  [125, 4.2],
  [160, 7.4],
] as const)
  add({ articleNo: `11${dn}5`, text: `KG-Bogen DN ${dn}, 45°`, unit: "Stk", price });

const HT_BASE: Record<number, number> = { 40: 2.1, 50: 2.6, 75: 3.9, 110: 5.2 };
for (const dn of [40, 50, 75, 110])
  for (const length of [500, 1000, 2000])
    add({
      articleNo: `12${String(dn).padStart(3, "0")}${length / 500}`,
      text: `HT-Rohr DN ${dn} x ${length} mm`,
      unit: "Stk",
      price: round2(HT_BASE[dn]! * (length / 1000) + 0.45),
    });

const surcharge = "zzgl. Metallzuschlag, siehe Angebotsbedingungen";
const CU_HARD: Record<number, number> = { 12: 34.5, 15: 41.5, 18: 52, 22: 68.5, 28: 89 };
for (const [size, price] of Object.entries(CU_HARD))
  add({
    articleNo: `2500${size}`,
    text: `Cu-Rohr ${size}x1,0 hart, Stange 5 m`,
    unit: "Stange",
    price,
    packaging: "Stangenlänge 5 m",
    notes: surcharge,
  });
for (const [size, price] of [
  [12, 330],
  [15, 395],
] as const)
  add({
    articleNo: `2501${size}`,
    text: `Cu-Rohr ${size}x1,0 weich, Ring 50 m`,
    unit: "Ring",
    price,
    packaging: "Ringlänge 50 m",
    notes: surcharge,
  });

const PRESS_PIPE: Record<number, number> = { 15: 39, 18: 48.6, 22: 61.2, 28: 82.8 };
for (const [size, price] of Object.entries(PRESS_PIPE))
  add({
    articleNo: `2400${size}`,
    text: `Edelstahl-Pressrohr ${size} x 1,0 mm, Stange 6 m`,
    unit: "Stange",
    price,
    packaging: "Stangenlänge 6 m",
  });
for (const [size, price] of [
  [15, 58],
  [18, 66],
  [22, 78],
] as const)
  add({
    articleNo: `2409${size}`,
    text: `Edelstahl-Pressbogen 90°, ${size} mm`,
    unit: "VE",
    price,
    packaging: "1 VE = 10 Stk",
  });
add({ articleNo: "240928", text: "Edelstahl-Pressbogen 90°, 28 mm", unit: "Stk", price: 9.85 });
for (const [size, price] of [
  [22, 6.9],
  [28, 8.6],
] as const)
  add({
    articleNo: `2404${size}`,
    text: `Edelstahl-Pressbogen 45°, ${size} mm`,
    unit: "Stk",
    price,
  });
for (const [size, price] of [
  [15, 3.1],
  [18, 3.65],
  [22, 4.35],
  [28, 5.95],
] as const)
  add({ articleNo: `2408${size}`, text: `Edelstahl-Pressmuffe ${size} mm`, unit: "Stk", price });

for (const [code, thread, inch, price] of [
  ["190", "M8", '½"', 46],
  ["192", "M8", '¾"', 49.5],
  ["196", "M10", '1"', 71],
  ["198", "M10", '1¼"', 84],
] as const)
  add({
    articleNo: `220${code}`,
    text: `Befestigungsschelle ${thread} ${inch} mit Gummieinlage, verzinkt`,
    unit: "Stk",
    price,
    priceUnit: 100,
    notes: "Preis je 100 Stk",
  });

const DOWELS: [string, string, number, number][] = [
  ["06", "6 x 30", 5.2, 3.9],
  ["08", "8 x 40", 8, 5.5],
  ["10", "10 x 50", 11, 9.2],
  ["12", "12 x 60", 15.4, 12.8],
];
for (const [code, size, price, tier] of DOWELS) {
  add({
    articleNo: `5004${code}`,
    text: `Spreizdübel ${size} mm, Nylon`,
    unit: "Stk",
    price,
    priceUnit: 100,
    notes: "Preis je 100 Stk",
  });
  add({
    articleNo: `5005${code}`,
    text: `Spreizdübel ${size} mm, Nylon – Staffelpreis`,
    unit: "Stk",
    price: tier,
    priceUnit: 100,
    notes: "Preis je 100 Stk; Staffelpreis ab 1.000 Stk, siehe Angebotsbedingungen",
  });
}

for (const [pipe, wall, price] of [
  [15, 9, 2.4],
  [18, 9, 2.7],
  [22, 9, 3.1],
  [22, 13, 4.2],
  [28, 9, 3.8],
  [28, 13, 4.9],
] as const)
  add({
    articleNo: `230${pipe}${wall}`,
    text: `Isolierschlauch ${pipe} x ${wall} mm, Kautschuk`,
    unit: "Stange",
    price,
    packaging: "Stangenlänge 2 m",
  });

for (const [code, inch, price] of [
  ["15", '½"', 1290],
  ["20", '¾"', 1590],
  ["25", '1"', 2190],
  ["32", '1¼"', 3240],
] as const)
  add({
    articleNo: `2600${code}`,
    text: `Absperrventil ${inch} Messing, mit Entleerung`,
    unit: "Stk",
    price,
    priceUnit: 100,
    notes: "Preis je 100 Stk",
  });

add({
  articleNo: "310110",
  text: "Waschtisch Keramag Renova 60 cm, weiß",
  unit: "Stk",
  price: 142,
});
add({
  articleNo: "310115",
  text: "Waschtisch Keramag Renova 65 cm, weiß",
  unit: "Stk",
  price: 158,
});
add({
  articleNo: "310120",
  text: "Waschtisch Ideal Standard Eurovit 60 cm, weiß (gleichwertig zu Keramag Renova)",
  unit: "Stk",
  price: 118,
});
add({ articleNo: "310210", text: "Wand-WC Keramag Renova Rimfree, weiß", unit: "Stk", price: 168 });
add({
  articleNo: "310220",
  text: "Wand-WC Ideal Standard Eurovit Rimless, weiß (gleichwertig)",
  unit: "Stk",
  price: 139,
});
add({
  articleNo: "310410",
  text: "Urinal Keramag Renova, Zulauf von hinten, weiß (gleichwertig zu Duravit Fizz)",
  unit: "Stk",
  price: 212,
});
add({
  articleNo: "330510",
  text: "Montageelement WC, Bauhöhe 112 cm, mit Spülkasten",
  unit: "Stk",
  price: 389,
  discountPercent: 22,
  notes: "Listenpreis; 22 % Rabatt auf diese Position",
});
add({
  articleNo: "330498",
  text: "Montageelement WC, Bauhöhe 98 cm, mit Spülkasten",
  unit: "Stk",
  price: 365,
  discountPercent: 22,
  notes: "Listenpreis; 22 % Rabatt auf diese Position",
});
add({
  articleNo: "330610",
  text: "Montageelement Waschtisch, Bauhöhe 112 cm",
  unit: "Stk",
  price: 214,
  discountPercent: 22,
  notes: "Listenpreis; 22 % Rabatt auf diese Position",
});
add({
  articleNo: "330713",
  text: "Montageelement Urinal, Bauhöhe 130 cm",
  unit: "Stk",
  price: 268,
});
add({
  articleNo: "410020",
  text: "Duschthermostat AP, Art. 4471",
  unit: "Stk",
  price: 210,
  notes: "entfällt – nicht mehr lieferbar, Ersatz siehe Art. 4480",
});
add({
  articleNo: "410028",
  text: "Duschthermostat AP, Art. 4480 (Ersatz für 4471)",
  unit: "Stk",
  price: 224.5,
});
add({
  articleNo: "410512",
  text: "Waschtisch-Einhebelmischer, verchromt, Art. 5120",
  unit: "Stk",
  price: 86.4,
});
for (const [length, price] of [
  [70, 172],
  [80, 189],
  [100, 229],
] as const)
  add({
    articleNo: `420${String(length).padStart(3, "0")}`,
    text: `Duschrinne Edelstahl ${length} cm mit Rost`,
    unit: "Stk",
    price,
    notes: "Lieferung ohne Montage",
  });
add({ articleNo: "900420", text: "Montage Duschrinne, je Stk", unit: "Stk", price: 65 });
add({ articleNo: "900310", text: "Montage Waschtisch, je Stk", unit: "Stk", price: 48 });
add({ articleNo: "900320", text: "Montage Wand-WC, je Stk", unit: "Stk", price: 72 });
add({
  articleNo: "520410",
  text: "Flexkleber C2TE S1",
  unit: "Sack",
  price: 18.75,
  packaging: "1 Sack = 25 kg",
});
add({
  articleNo: "520510",
  text: "Fugenmörtel CG2 WA, grau",
  unit: "Sack",
  price: 11.4,
  packaging: "1 Sack = 5 kg",
});
add({
  articleNo: "520300",
  text: "Dichtschlämme 2K flexibel",
  unit: "Gebinde",
  price: 96,
  packaging: "1 Gebinde = 24 kg",
  notes: "Verbrauch 3 kg/m² bei vorgeschriebener Schichtdicke",
});
add({
  articleNo: "520110",
  text: "Tiefengrund lösemittelfrei",
  unit: "Kanister",
  price: 42,
  packaging: "1 Kanister = 10 l",
  notes: "Verbrauch 0,15 l/m²",
});
add({
  articleNo: "520610",
  text: "Dichtband für Wandanschlüsse, 120 mm",
  unit: "Rolle",
  price: 18.9,
  packaging: "1 Rolle = 10 m",
});
add({
  articleNo: "530360",
  text: "Feinsteinzeug 30 x 60 cm, grau matt",
  unit: "Paket",
  price: 51.84,
  packaging: "1 Paket = 1,44 m²",
});
add({
  articleNo: "530660",
  text: "Feinsteinzeug 60 x 60 cm, grau matt",
  unit: "Paket",
  price: 49.68,
  packaging: "1 Paket = 1,08 m²",
});
add({
  articleNo: "531360",
  text: "Wandfliese 30 x 60 cm, weiß glänzend",
  unit: "Paket",
  price: 38.88,
  packaging: "1 Paket = 1,62 m²",
});
add({
  articleNo: "540310",
  text: "Sanitärsilikon 310 ml, transparent",
  unit: "Karton",
  price: 66,
  packaging: "1 Karton = 12 Kartuschen",
});
for (const [dn, price] of [
  [50, 24],
  [75, 29],
  [110, 38],
] as const)
  add({
    articleNo: `600${String(dn).padStart(3, "0")}`,
    text: `Brandschutzmanschette R 90 für Rohr DN ${dn}`,
    unit: "Stk",
    price,
  });
add({ articleNo: "700010", text: "Monteurstunde", unit: "h", price: 58 });
add({ articleNo: "700020", text: "Helferstunde", unit: "h", price: 44 });
add({ articleNo: "700030", text: "Meisterstunde", unit: "h", price: 72 });
add({
  articleNo: "800680",
  text: "Kristallspiegel 60 x 80 cm, Aktionspreis",
  unit: "Stk",
  price: 39,
  notes: "Aktionspreis, gültig bis 30.09.2026",
});
add({ articleNo: "800681", text: "Kristallspiegel 60 x 80 cm", unit: "Stk", price: 52 });
add({ articleNo: "800690", text: "Kristallspiegel 60 x 90 cm", unit: "Stk", price: 58 });

// Stable, shuffled ids so search order carries no hint.
let seed = 9010;
const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const shuffled = [...LINES].sort(() => random() - 0.5);
shuffled.forEach((line, index) => (line.id = `L${String(index + 1).padStart(3, "0")}`));
export const OFFER_LINES = shuffled.sort((a, b) => a.id.localeCompare(b.id));

export const CONDITIONS = `Angebot Nr. 2026-118 vom 02.10.2026, Haustechnik Müller GmbH, gültig 6 Wochen. Alle Preise in EUR netto zzgl. MwSt.
1. Objektrabatt: Auf alle Artikel der Warengruppe Sanitärkeramik (Artikelnummern beginnend mit 31) gewähren wir zusätzlich 8 % Rabatt.
2. Metallzuschlag: Kupferrohrpreise verstehen sich ohne Metallzuschlag. Der Zuschlag beträgt 0,95 € je m Rohr und wird gesondert berechnet.
3. Staffelpreise gelten für die Gesamtabnahmemenge eines Artikels in diesem Auftrag, über alle LV-Positionen zusammen.
4. Korrektur eines Druckfehlers: Art. 250018 kostet 54,80 € je Stange statt des aufgeführten Preises.
5. Lieferung frei Baustelle ab 500 € Warenwert, darunter Frachtpauschale 35 €.
6. Montagepreise gelten nur in Verbindung mit der Lieferung des Artikels.
7. Zahlungsziel 30 Tage netto, 2 % Skonto bei Zahlung innerhalb von 10 Tagen.`;

// ---- LV items with gold ------------------------------------------------------------------
const line = (articleNo: string) => {
  const found = byArticle.get(articleNo);
  if (!found) throw new Error(`no article ${articleNo}`);
  return found;
};
const perUnit = (articleNo: string) => {
  const value = line(articleNo);
  const price = articleNo === "250018" ? 54.8 : value.price;
  return (
    (price / (value.priceUnit ?? 1)) *
    (1 - (value.discountPercent ?? 0) / 100) *
    (articleNo.startsWith("31") ? 0.92 : 1)
  );
};

type Spec = {
  short: string;
  long: string;
  quantity: number;
  unit: string;
  trap: string;
  gold: () => Gold;
};
const priced = (articles: string[], price: () => number) => (): Gold => [
  { lines: articles.map((a) => line(a).id), unitPrice: round2(price()) },
];
/** The named product or an offer line declared equivalent to it, each at its own price. */
const either =
  (...answers: Array<() => Gold>) =>
  (): Gold =>
    answers.flatMap((answer) => {
      const gold = answer();
      return gold === "unpriced" ? [] : gold;
    });
const unpriced = () => (): Gold => "unpriced";

const DOWEL_TOTAL: Record<string, number> = {};
const dowel = (code: string, size: string, quantity: number, titleNote: string): Spec => {
  DOWEL_TOTAL[code] = (DOWEL_TOTAL[code] ?? 0) + quantity;
  return {
    short: `Spreizdübel ${size} mm`,
    long: `Spreizdübel ${size} mm, Nylon, liefern.${titleNote}`,
    quantity,
    unit: "St",
    trap: "tier over all Items",
    gold: () =>
      DOWEL_TOTAL[code]! >= 1000
        ? priced([`5005${code}`], () => perUnit(`5005${code}`))()
        : priced([`5004${code}`], () => perUnit(`5004${code}`))(),
  };
};

const TITLES: [string, string, Spec[]][] = [
  [
    "01",
    "Entwässerung",
    [
      {
        short: "KG-Rohr DN 110, Baulänge 2 m",
        long: "KG-Rohr PVC-U, SN 4, DN 110, Baulänge 2.000 mm, liefern.",
        quantity: 36,
        unit: "St",
        trap: "size",
        gold: priced(["101104"], () => perUnit("101104")),
      },
      {
        short: "KG-Rohr DN 125, Baulänge 2 m",
        long: "KG-Rohr PVC-U, SN 4, DN 125, Baulänge 2.000 mm, liefern.",
        quantity: 24,
        unit: "St",
        trap: "size",
        gold: priced(["101254"], () => perUnit("101254")),
      },
      {
        short: "KG-Rohr DN 160, Baulänge 1 m",
        long: "KG-Rohr PVC-U, SN 4, DN 160, Baulänge 1.000 mm, liefern.",
        quantity: 12,
        unit: "St",
        trap: "size and length",
        gold: priced(["101602"], () => perUnit("101602")),
      },
      {
        short: "KG-Rohr DN 125, Baulänge 0,5 m",
        long: "KG-Rohr PVC-U, SN 4, DN 125, Baulänge 500 mm, liefern.",
        quantity: 16,
        unit: "St",
        trap: "size and length",
        gold: priced(["101251"], () => perUnit("101251")),
      },
      {
        short: "Zulage Formstücke zu 01.01",
        long: "Zulage zu Pos. 01.01 für Formstücke (Bögen, Abzweige) DN 110, je Stück, liefern.",
        quantity: 22,
        unit: "St",
        trap: "surcharge line",
        gold: priced(["101109"], () => perUnit("101109")),
      },
      {
        short: "Zulage Formstücke zu 01.02",
        long: "Zulage zu Pos. 01.02 für Formstücke (Bögen, Abzweige) DN 125, je Stück, liefern.",
        quantity: 18,
        unit: "St",
        trap: "surcharge line",
        gold: priced(["101259"], () => perUnit("101259")),
      },
      {
        short: "HT-Rohr DN 50, Baulänge 1 m",
        long: "HT-Rohr PP, DN 50, Baulänge 1.000 mm, liefern.",
        quantity: 40,
        unit: "St",
        trap: "size",
        gold: priced(["120502"], () => perUnit("120502")),
      },
      {
        short: "HT-Rohr DN 75, Baulänge 0,5 m",
        long: "HT-Rohr PP, DN 75, Baulänge 500 mm, liefern.",
        quantity: 20,
        unit: "St",
        trap: "size",
        gold: priced(["120751"], () => perUnit("120751")),
      },
      {
        short: "HT-Rohr DN 40, Baulänge 0,25 m",
        long: "HT-Rohr PP, DN 40, Baulänge 250 mm, liefern.",
        quantity: 30,
        unit: "St",
        trap: "length not offered",
        gold: unpriced(),
      },
      {
        short: "HT-Rohr DN 110, Baulänge 2 m",
        long: "HT-Rohr PP, DN 110, Baulänge 2.000 mm, liefern.",
        quantity: 14,
        unit: "St",
        trap: "HT vs KG",
        gold: priced(["121104"], () => perUnit("121104")),
      },
      {
        short: "Brandschutzmanschette R 90, DN 110",
        long: "Brandschutzmanschette R 90 für Kunststoffrohr DN 110, mit abZ, liefern.",
        quantity: 10,
        unit: "St",
        trap: "plain",
        gold: priced(["600110"], () => perUnit("600110")),
      },
      {
        short: "Brandschutzmanschette R 90, DN 125",
        long: "Brandschutzmanschette R 90 für Kunststoffrohr DN 125, mit abZ, liefern.",
        quantity: 8,
        unit: "St",
        trap: "no fit: unpriced",
        gold: unpriced(),
      },
      {
        short: "Brandschutzmanschette R 90, DN 75",
        long: "Brandschutzmanschette R 90 für Kunststoffrohr DN 75, mit abZ, liefern.",
        quantity: 6,
        unit: "St",
        trap: "plain",
        gold: priced(["600075"], () => perUnit("600075")),
      },
      {
        short: "Duschrinne 80 cm",
        long: "Duschrinne Edelstahl, Länge 80 cm, mit Rost, liefern und montieren.",
        quantity: 3,
        unit: "St",
        trap: "supply + install",
        gold: priced(["420080", "900420"], () => perUnit("420080") + perUnit("900420")),
      },
      {
        short: "Duschrinne 100 cm",
        long: "Duschrinne Edelstahl, Länge 100 cm, mit Rost, liefern.",
        quantity: 2,
        unit: "St",
        trap: "supply only",
        gold: priced(["420100"], () => perUnit("420100")),
      },
      {
        short: "Duschrinne 70 cm",
        long: "Duschrinne Edelstahl, Länge 70 cm, mit Rost, liefern und montieren.",
        quantity: 4,
        unit: "St",
        trap: "supply + install",
        gold: priced(["420070", "900420"], () => perUnit("420070") + perUnit("900420")),
      },
      {
        short: "Stundenlohn Monteur",
        long: "Stundenlohnarbeiten, Monteur, nach Anordnung der Bauleitung.",
        quantity: 20,
        unit: "h",
        trap: "fitter",
        gold: priced(["700010"], () => perUnit("700010")),
      },
      {
        short: "Stundenlohn Helfer",
        long: "Stundenlohnarbeiten, Helfer, nach Anordnung der Bauleitung.",
        quantity: 20,
        unit: "h",
        trap: "helper",
        gold: priced(["700020"], () => perUnit("700020")),
      },
    ],
  ],
  [
    "02",
    "Trinkwasser",
    [
      {
        short: "Kupferrohr 15 x 1 mm, hart",
        long: "Kupferrohr 15 x 1 mm, hart, in Stangen, liefern.",
        quantity: 150,
        unit: "lfm",
        trap: "bar + metal surcharge",
        gold: priced(["250015"], () => perUnit("250015") / 5 + 0.95),
      },
      {
        short: "Kupferrohr 18 x 1 mm, hart",
        long: "Kupferrohr 18 x 1 mm, hart, in Stangen, liefern.",
        quantity: 90,
        unit: "lfm",
        trap: "erratum + bar + surcharge",
        gold: priced(["250018"], () => perUnit("250018") / 5 + 0.95),
      },
      {
        short: "Kupferrohr 22 x 1 mm, hart",
        long: "Kupferrohr 22 x 1 mm, hart, in Stangen, liefern.",
        quantity: 60,
        unit: "lfm",
        trap: "bar + metal surcharge",
        gold: priced(["250022"], () => perUnit("250022") / 5 + 0.95),
      },
      {
        short: "Kupferrohr 12 x 1 mm, weich",
        long: "Kupferrohr 12 x 1 mm, weich, im Ring, liefern.",
        quantity: 100,
        unit: "m",
        trap: "ring + metal surcharge",
        gold: priced(["250112"], () => perUnit("250112") / 50 + 0.95),
      },
      {
        short: "Edelstahl-Pressrohr 22 mm",
        long: "Edelstahl-Pressrohr 22 x 1,0 mm, in Stangen, liefern.",
        quantity: 128,
        unit: "m",
        trap: "bar of 6 m",
        gold: priced(["240022"], () => perUnit("240022") / 6),
      },
      {
        short: "Edelstahl-Pressrohr 28 mm",
        long: "Edelstahl-Pressrohr 28 x 1,0 mm, in Stangen, liefern.",
        quantity: 64,
        unit: "m",
        trap: "bar of 6 m",
        gold: priced(["240028"], () => perUnit("240028") / 6),
      },
      {
        short: "Pressbogen 90°, 22 mm",
        long: "Edelstahl-Pressbogen 90°, Durchmesser 22 mm, liefern.",
        quantity: 40,
        unit: "St",
        trap: "pack of 10",
        gold: priced(["240922"], () => perUnit("240922") / 10),
      },
      {
        short: "Pressbogen 90°, 28 mm",
        long: "Edelstahl-Pressbogen 90°, Durchmesser 28 mm, liefern.",
        quantity: 16,
        unit: "St",
        trap: "single, not pack",
        gold: priced(["240928"], () => perUnit("240928")),
      },
      {
        short: "Pressbogen 45°, 22 mm",
        long: "Edelstahl-Pressbogen 45°, Durchmesser 22 mm, liefern.",
        quantity: 24,
        unit: "St",
        trap: "45 vs 90",
        gold: priced(["240422"], () => perUnit("240422")),
      },
      {
        short: "Pressmuffe 22 mm",
        long: "Edelstahl-Pressmuffe, Durchmesser 22 mm, liefern.",
        quantity: 60,
        unit: "St",
        trap: "plain",
        gold: priced(["240822"], () => perUnit("240822")),
      },
      {
        short: "Absperrventil DN 15",
        long: "Absperrventil DN 15, Messing, mit Entleerung, liefern.",
        quantity: 12,
        unit: "St",
        trap: 'DN 15 = ½", per 100',
        gold: priced(["260015"], () => perUnit("260015")),
      },
      {
        short: "Absperrventil DN 20",
        long: "Absperrventil DN 20, Messing, mit Entleerung, liefern.",
        quantity: 10,
        unit: "St",
        trap: 'DN 20 = ¾", per 100',
        gold: priced(["260020"], () => perUnit("260020")),
      },
      {
        short: "Absperrventil DN 32",
        long: "Absperrventil DN 32, Messing, mit Entleerung, liefern.",
        quantity: 4,
        unit: "St",
        trap: 'DN 32 = 1¼", per 100',
        gold: priced(["260032"], () => perUnit("260032")),
      },
      {
        short: "Dämmschlauch 22 x 13 mm",
        long: "Kautschuk-Dämmschlauch für Rohr 22 mm, Dämmdicke 13 mm, liefern.",
        quantity: 128,
        unit: "m",
        trap: "synonym, 13 vs 9, bar",
        gold: priced(["2302213"], () => perUnit("2302213") / 2),
      },
      {
        short: "Dämmschlauch 28 x 9 mm",
        long: "Kautschuk-Dämmschlauch für Rohr 28 mm, Dämmdicke 9 mm, liefern.",
        quantity: 64,
        unit: "m",
        trap: "synonym, 9 vs 13, bar",
        gold: priced(["230289"], () => perUnit("230289") / 2),
      },
      {
        short: "Dämmschlauch 15 x 9 mm",
        long: "Kautschuk-Dämmschlauch für Rohr 15 mm, Dämmdicke 9 mm, liefern.",
        quantity: 150,
        unit: "m",
        trap: "synonym, bar",
        gold: priced(["230159"], () => perUnit("230159") / 2),
      },
      {
        short: 'Rohrschelle M8 ½"',
        long: 'Rohrschelle mit Gummieinlage, Anschluss M8, für Rohr ½", verzinkt, liefern.',
        quantity: 120,
        unit: "St",
        trap: "synonym, per 100",
        gold: priced(["220190"], () => perUnit("220190")),
      },
      {
        short: 'Rohrschelle M10 1¼"',
        long: 'Rohrschelle mit Gummieinlage, Anschluss M10, für Rohr 1¼", verzinkt, liefern.',
        quantity: 40,
        unit: "St",
        trap: "synonym, per 100",
        gold: priced(["220198"], () => perUnit("220198")),
      },
      {
        short: "Stundenlohn Meister",
        long: "Stundenlohnarbeiten, Meister, nach Anordnung der Bauleitung.",
        quantity: 8,
        unit: "h",
        trap: "master",
        gold: priced(["700030"], () => perUnit("700030")),
      },
    ],
  ],
  [
    "03",
    "Sanitärobjekte",
    [
      {
        short: "Waschtisch 60 cm",
        long: "Waschtisch aus Sanitärkeramik, weiß, Breite 60 cm, mit Hahnloch und Überlauf. Fabrikat: Keramag Renova oder gleichwertig. Liefern.",
        quantity: 6,
        unit: "St",
        trap: "named Fabrikat or equivalent + 8 %",
        gold: either(
          priced(["310110"], () => perUnit("310110")),
          priced(["310120"], () => perUnit("310120")),
        ),
      },
      {
        short: "Waschtisch 65 cm",
        long: "Waschtisch aus Sanitärkeramik, weiß, Breite 65 cm, mit Hahnloch und Überlauf. Fabrikat: Keramag Renova oder gleichwertig. Liefern und montieren.",
        quantity: 2,
        unit: "St",
        trap: "8 % + install (no 8 %)",
        gold: priced(["310115", "900310"], () => perUnit("310115") + perUnit("900310")),
      },
      {
        short: "Wand-WC spülrandlos",
        long: "Wand-WC, spülrandlos, Sanitärkeramik weiß. Fabrikat: Keramag Renova Rimfree oder gleichwertig. Liefern.",
        quantity: 6,
        unit: "St",
        trap: "named Fabrikat or equivalent + 8 %",
        gold: either(
          priced(["310210"], () => perUnit("310210")),
          priced(["310220"], () => perUnit("310220")),
        ),
      },
      {
        short: "Urinal",
        long: "Urinal, Zulauf von hinten, Sanitärkeramik weiß. Fabrikat: Duravit Fizz oder gleichwertig. Liefern.",
        quantity: 2,
        unit: "St",
        trap: "only the equivalent + 8 %",
        gold: priced(["310410"], () => perUnit("310410")),
      },
      {
        short: "Vorwandelement WC 112 cm",
        long: "Vorwandelement für Wand-WC, Bauhöhe 112 cm, mit Unterputz-Spülkasten, liefern.",
        quantity: 6,
        unit: "St",
        trap: "synonym + line discount",
        gold: priced(["330510"], () => perUnit("330510")),
      },
      {
        short: "Vorwandelement Waschtisch",
        long: "Vorwandelement für Waschtisch, Bauhöhe 112 cm, liefern.",
        quantity: 8,
        unit: "St",
        trap: "synonym + line discount",
        gold: priced(["330610"], () => perUnit("330610")),
      },
      {
        short: "Vorwandelement Urinal",
        long: "Vorwandelement für Urinal, Bauhöhe 130 cm, liefern.",
        quantity: 2,
        unit: "St",
        trap: "synonym, no discount",
        gold: priced(["330713"], () => perUnit("330713")),
      },
      {
        short: "Thermostat-Brausebatterie Aufputz",
        long: "Thermostat-Brausebatterie für Aufputzmontage, verchromt, liefern.",
        quantity: 4,
        unit: "St",
        trap: "discontinued",
        gold: priced(["410028"], () => perUnit("410028")),
      },
      {
        short: "Waschtischarmatur",
        long: "Waschtisch-Einhebelmischer, verchromt, liefern.",
        quantity: 8,
        unit: "St",
        trap: "plain",
        gold: priced(["410512"], () => perUnit("410512")),
      },
      {
        short: "Spiegel 60 x 80 cm",
        long: "Kristallspiegel 60 x 80 cm, liefern.",
        quantity: 6,
        unit: "St",
        trap: "expired promotion",
        gold: priced(["800681"], () => perUnit("800681")),
      },
      {
        short: "Spiegel 60 x 90 cm",
        long: "Kristallspiegel 60 x 90 cm, liefern.",
        quantity: 2,
        unit: "St",
        trap: "size",
        gold: priced(["800690"], () => perUnit("800690")),
      },
      {
        short: "Sanitärsilikon",
        long: "Sanitärsilikon, transparent, Kartusche 310 ml, liefern.",
        quantity: 24,
        unit: "St",
        trap: "carton of 12",
        gold: priced(["540310"], () => perUnit("540310") / 12),
      },
      dowel("08", "8 x 40", 700, ""),
      dowel("06", "6 x 30", 300, ""),
      dowel("10", "10 x 50", 1500, ""),
    ],
  ],
  [
    "04",
    "Fliesen und Abdichtung",
    [
      {
        short: "Fliesenkleber C2TE S1",
        long: "Flexibler Fliesenkleber C2TE S1, liefern.",
        quantity: 250,
        unit: "kg",
        trap: "sack of 25 kg",
        gold: priced(["520410"], () => perUnit("520410") / 25),
      },
      {
        short: "Fugenmörtel CG2 WA",
        long: "Fugenmörtel CG2 WA, grau, liefern.",
        quantity: 40,
        unit: "kg",
        trap: "sack of 5 kg",
        gold: priced(["520510"], () => perUnit("520510") / 5),
      },
      {
        short: "Verbundabdichtung 2K",
        long: "Flüssige Verbundabdichtung, 2-komponentig, im Duschbereich, Auftrag gemäß Herstellerangabe, liefern.",
        quantity: 40,
        unit: "m²",
        trap: "consumption kg/m²",
        gold: priced(["520300"], () => (perUnit("520300") / 24) * 3),
      },
      {
        short: "Grundierung",
        long: "Tiefengrund, lösemittelfrei, auf saugenden Untergründen, Auftrag gemäß Herstellerangabe, liefern.",
        quantity: 120,
        unit: "qm",
        trap: "consumption l/m², qm",
        gold: priced(["520110"], () => (perUnit("520110") / 10) * 0.15),
      },
      {
        short: "Dichtband Wandanschluss",
        long: "Dichtband für Wand-Boden-Anschlüsse, Breite 120 mm, liefern.",
        quantity: 60,
        unit: "lfm",
        trap: "roll of 10 m",
        gold: priced(["520610"], () => perUnit("520610") / 10),
      },
      {
        short: "Bodenfliesen 30 x 60 cm",
        long: "Bodenfliesen Feinsteinzeug 30 x 60 cm, grau matt, liefern.",
        quantity: 85,
        unit: "qm",
        trap: "pack of 1.44 m²",
        gold: priced(["530360"], () => perUnit("530360") / 1.44),
      },
      {
        short: "Bodenfliesen 60 x 60 cm",
        long: "Bodenfliesen Feinsteinzeug 60 x 60 cm, grau matt, liefern.",
        quantity: 30,
        unit: "qm",
        trap: "pack of 1.08 m²",
        gold: priced(["530660"], () => perUnit("530660") / 1.08),
      },
      {
        short: "Wandfliesen 30 x 60 cm",
        long: "Wandfliesen 30 x 60 cm, weiß glänzend, liefern.",
        quantity: 140,
        unit: "qm",
        trap: "pack of 1.62 m²",
        gold: priced(["531360"], () => perUnit("531360") / 1.62),
      },
      {
        short: "Wandfliesen 20 x 20 cm",
        long: "Wandfliesen 20 x 20 cm, weiß matt, liefern.",
        quantity: 25,
        unit: "qm",
        trap: "no fit: unpriced",
        gold: unpriced(),
      },
      dowel("08", "8 x 40", 400, ""),
      {
        short: 'Rohrschelle M8 ¾"',
        long: 'Rohrschelle mit Gummieinlage, Anschluss M8, für Rohr ¾", verzinkt, liefern.',
        quantity: 200,
        unit: "St",
        trap: "synonym, per 100",
        gold: priced(["220192"], () => perUnit("220192")),
      },
    ],
  ],
];

export const ITEMS: Item[] = [];
export const GOLD: Record<string, Gold> = {};
export const TRAPS: Record<string, string> = {};
for (const [title, , specs] of TITLES)
  specs.forEach((spec, index) => {
    const ordinal = `${title}.${String(index + 1).padStart(2, "0")}`;
    const id = `it-${title}${String(index + 1).padStart(2, "0")}`;
    ITEMS.push({
      id,
      ordinal,
      short: spec.short,
      long: spec.long,
      quantity: spec.quantity,
      unit: spec.unit,
    });
    TRAPS[id] = spec.trap;
  });
// Gold after all Items are known, since tier prices depend on totals over all Items.
let cursor = 0;
for (const [, , specs] of TITLES) for (const spec of specs) GOLD[ITEMS[cursor++]!.id] = spec.gold();
