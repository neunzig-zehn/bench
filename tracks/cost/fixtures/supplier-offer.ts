/**
 * A supplier offer built from product catalogs, and the LV Items priced from it, each with its gold
 * answer and the trap it sets, in German or English: the same articles, prices, and quantities.
 */
import type { Lang } from "../../../src/types";
import { pick, round2 } from "../shared";

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
/** The right answer; an Item that allows an equivalent ("or equivalent") has one per line. */
export type Gold = Array<{ lines: string[]; unitPrice: number }> | "unpriced";

type Spec = {
  short: string;
  long: string;
  quantity: number;
  unit: string;
  trap: string;
  gold: () => Gold;
};

export const supplierOffer = (lang: Lang) => {
  const t = pick(lang);
  const byArticle = new Map<string, Line>();
  const LINES: Line[] = [];
  const add = (line: Omit<Line, "id">) => {
    const full = { id: "", ...line };
    LINES.push(full);
    byArticle.set(line.articleNo, full);
  };
  const pc = t("Stk", "pc");
  const per100 = t("Preis je 100 Stk", "Price per 100 pcs");
  const mm = (value: number) => (lang === "de" ? value.toLocaleString("de-DE") : value.toLocaleString("en-GB"));

  const KG_BASE: Record<number, number> = { 110: 4.6, 125: 5.4, 160: 8.9 };
  for (const dn of [110, 125, 160])
    for (const length of [500, 1000, 2000])
      add({
        articleNo: `10${dn}${length / 500}`,
        text: t(`KG-Rohr DN ${dn} x ${length} mm, SN 4`, `KG sewer pipe DN ${dn} x ${length} mm, SN 4`),
        unit: pc,
        price: round2(KG_BASE[dn]! * (length / 1000) + 0.6),
      });
  for (const [dn, price] of [
    [110, 4.8],
    [125, 5.6],
    [160, 8.9],
  ] as const)
    add({
      articleNo: `10${dn}9`,
      text: t(`Mehrpreis für Formstücke KG DN ${dn} (Bögen, Abzweige), gemittelt`, `Extra charge for KG fittings DN ${dn} (bends, branches), averaged`),
      unit: pc,
      price,
      notes: t("Zulage gegenüber Rohr, je Formstück", "Surcharge over pipe, per fitting"),
    });
  for (const [dn, price] of [
    [110, 3.6],
    [125, 4.2],
    [160, 7.4],
  ] as const)
    add({ articleNo: `11${dn}5`, text: t(`KG-Bogen DN ${dn}, 45°`, `KG bend DN ${dn}, 45°`), unit: pc, price });

  const HT_BASE: Record<number, number> = { 40: 2.1, 50: 2.6, 75: 3.9, 110: 5.2 };
  for (const dn of [40, 50, 75, 110])
    for (const length of [500, 1000, 2000])
      add({
        articleNo: `12${String(dn).padStart(3, "0")}${length / 500}`,
        text: t(`HT-Rohr DN ${dn} x ${length} mm`, `HT drain pipe DN ${dn} x ${length} mm`),
        unit: pc,
        price: round2(HT_BASE[dn]! * (length / 1000) + 0.45),
      });

  const surcharge = t("zzgl. Metallzuschlag, siehe Angebotsbedingungen", "plus metal surcharge, see offer conditions");
  const CU_HARD: Record<number, number> = { 12: 34.5, 15: 41.5, 18: 52, 22: 68.5, 28: 89 };
  for (const [size, price] of Object.entries(CU_HARD))
    add({
      articleNo: `2500${size}`,
      text: t(`Cu-Rohr ${size}x1,0 hart, Stange 5 m`, `Copper pipe ${size}x1.0 hard, 5 m bar`),
      unit: t("Stange", "bar"),
      price,
      packaging: t("Stangenlänge 5 m", "Bar length 5 m"),
      notes: surcharge,
    });
  for (const [size, price] of [
    [12, 330],
    [15, 395],
  ] as const)
    add({
      articleNo: `2501${size}`,
      text: t(`Cu-Rohr ${size}x1,0 weich, Ring 50 m`, `Copper pipe ${size}x1.0 soft, 50 m coil`),
      unit: t("Ring", "coil"),
      price,
      packaging: t("Ringlänge 50 m", "Coil length 50 m"),
      notes: surcharge,
    });

  const PRESS_PIPE: Record<number, number> = { 15: 39, 18: 48.6, 22: 61.2, 28: 82.8 };
  for (const [size, price] of Object.entries(PRESS_PIPE))
    add({
      articleNo: `2400${size}`,
      text: t(`Edelstahl-Pressrohr ${size} x 1,0 mm, Stange 6 m`, `Stainless steel press pipe ${size} x 1.0 mm, 6 m bar`),
      unit: t("Stange", "bar"),
      price,
      packaging: t("Stangenlänge 6 m", "Bar length 6 m"),
    });
  for (const [size, price] of [
    [15, 58],
    [18, 66],
    [22, 78],
  ] as const)
    add({
      articleNo: `2409${size}`,
      text: t(`Edelstahl-Pressbogen 90°, ${size} mm`, `Stainless steel press elbow 90°, ${size} mm`),
      unit: t("VE", "PU"),
      price,
      packaging: t("1 VE = 10 Stk", "1 PU = 10 pcs"),
    });
  add({ articleNo: "240928", text: t("Edelstahl-Pressbogen 90°, 28 mm", "Stainless steel press elbow 90°, 28 mm"), unit: pc, price: 9.85 });
  for (const [size, price] of [
    [22, 6.9],
    [28, 8.6],
  ] as const)
    add({
      articleNo: `2404${size}`,
      text: t(`Edelstahl-Pressbogen 45°, ${size} mm`, `Stainless steel press elbow 45°, ${size} mm`),
      unit: pc,
      price,
    });
  for (const [size, price] of [
    [15, 3.1],
    [18, 3.65],
    [22, 4.35],
    [28, 5.95],
  ] as const)
    add({ articleNo: `2408${size}`, text: t(`Edelstahl-Pressmuffe ${size} mm`, `Stainless steel press coupling ${size} mm`), unit: pc, price });

  for (const [code, thread, inch, price] of [
    ["190", "M8", '½"', 46],
    ["192", "M8", '¾"', 49.5],
    ["196", "M10", '1"', 71],
    ["198", "M10", '1¼"', 84],
  ] as const)
    add({
      articleNo: `220${code}`,
      text: t(`Befestigungsschelle ${thread} ${inch} mit Gummieinlage, verzinkt`, `Fixing clamp ${thread} ${inch} with rubber lining, galvanised`),
      unit: pc,
      price,
      priceUnit: 100,
      notes: per100,
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
      text: t(`Spreizdübel ${size} mm, Nylon`, `Expansion plug ${size} mm, nylon`),
      unit: pc,
      price,
      priceUnit: 100,
      notes: per100,
    });
    add({
      articleNo: `5005${code}`,
      text: t(`Spreizdübel ${size} mm, Nylon – Staffelpreis`, `Expansion plug ${size} mm, nylon – tier price`),
      unit: pc,
      price: tier,
      priceUnit: 100,
      notes: t("Preis je 100 Stk; Staffelpreis ab 1.000 Stk, siehe Angebotsbedingungen", "Price per 100 pcs; tier price from 1,000 pcs, see offer conditions"),
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
      text: t(`Isolierschlauch ${pipe} x ${wall} mm, Kautschuk`, `Insulation tube ${pipe} x ${wall} mm, rubber`),
      unit: t("Stange", "bar"),
      price,
      packaging: t("Stangenlänge 2 m", "Bar length 2 m"),
    });

  for (const [code, inch, price] of [
    ["15", '½"', 1290],
    ["20", '¾"', 1590],
    ["25", '1"', 2190],
    ["32", '1¼"', 3240],
  ] as const)
    add({
      articleNo: `2600${code}`,
      text: t(`Absperrventil ${inch} Messing, mit Entleerung`, `Shut-off valve ${inch} brass, with drain`),
      unit: pc,
      price,
      priceUnit: 100,
      notes: per100,
    });

  add({ articleNo: "310110", text: t("Waschtisch Keramag Renova 60 cm, weiß", "Washbasin Keramag Renova 60 cm, white"), unit: pc, price: 142 });
  add({ articleNo: "310115", text: t("Waschtisch Keramag Renova 65 cm, weiß", "Washbasin Keramag Renova 65 cm, white"), unit: pc, price: 158 });
  add({
    articleNo: "310120",
    text: t("Waschtisch Ideal Standard Eurovit 60 cm, weiß (gleichwertig zu Keramag Renova)", "Washbasin Ideal Standard Eurovit 60 cm, white (equivalent to Keramag Renova)"),
    unit: pc,
    price: 118,
  });
  add({ articleNo: "310210", text: t("Wand-WC Keramag Renova Rimfree, weiß", "Wall-hung WC Keramag Renova Rimfree, white"), unit: pc, price: 168 });
  add({
    articleNo: "310220",
    text: t("Wand-WC Ideal Standard Eurovit Rimless, weiß (gleichwertig)", "Wall-hung WC Ideal Standard Eurovit Rimless, white (equivalent)"),
    unit: pc,
    price: 139,
  });
  add({
    articleNo: "310410",
    text: t("Urinal Keramag Renova, Zulauf von hinten, weiß (gleichwertig zu Duravit Fizz)", "Urinal Keramag Renova, rear inlet, white (equivalent to Duravit Fizz)"),
    unit: pc,
    price: 212,
  });
  const lineDiscount = t("Listenpreis; 22 % Rabatt auf diese Position", "List price; 22 % discount on this line");
  add({
    articleNo: "330510",
    text: t("Montageelement WC, Bauhöhe 112 cm, mit Spülkasten", "Mounting frame WC, height 112 cm, with cistern"),
    unit: pc,
    price: 389,
    discountPercent: 22,
    notes: lineDiscount,
  });
  add({
    articleNo: "330498",
    text: t("Montageelement WC, Bauhöhe 98 cm, mit Spülkasten", "Mounting frame WC, height 98 cm, with cistern"),
    unit: pc,
    price: 365,
    discountPercent: 22,
    notes: lineDiscount,
  });
  add({
    articleNo: "330610",
    text: t("Montageelement Waschtisch, Bauhöhe 112 cm", "Mounting frame washbasin, height 112 cm"),
    unit: pc,
    price: 214,
    discountPercent: 22,
    notes: lineDiscount,
  });
  add({ articleNo: "330713", text: t("Montageelement Urinal, Bauhöhe 130 cm", "Mounting frame urinal, height 130 cm"), unit: pc, price: 268 });
  add({
    articleNo: "410020",
    text: t("Duschthermostat AP, Art. 4471", "Shower thermostat, surface-mounted, art. 4471"),
    unit: pc,
    price: 210,
    notes: t("entfällt – nicht mehr lieferbar, Ersatz siehe Art. 4480", "discontinued – no longer available, replacement see art. 4480"),
  });
  add({
    articleNo: "410028",
    text: t("Duschthermostat AP, Art. 4480 (Ersatz für 4471)", "Shower thermostat, surface-mounted, art. 4480 (replacement for 4471)"),
    unit: pc,
    price: 224.5,
  });
  add({
    articleNo: "410512",
    text: t("Waschtisch-Einhebelmischer, verchromt, Art. 5120", "Single-lever basin mixer, chrome-plated, art. 5120"),
    unit: pc,
    price: 86.4,
  });
  for (const [length, price] of [
    [70, 172],
    [80, 189],
    [100, 229],
  ] as const)
    add({
      articleNo: `420${String(length).padStart(3, "0")}`,
      text: t(`Duschrinne Edelstahl ${length} cm mit Rost`, `Shower channel stainless steel ${length} cm with grate`),
      unit: pc,
      price,
      notes: t("Lieferung ohne Montage", "Supply without installation"),
    });
  add({ articleNo: "900420", text: t("Montage Duschrinne, je Stk", "Installation of shower channel, per pc"), unit: pc, price: 65 });
  add({ articleNo: "900310", text: t("Montage Waschtisch, je Stk", "Installation of washbasin, per pc"), unit: pc, price: 48 });
  add({ articleNo: "900320", text: t("Montage Wand-WC, je Stk", "Installation of wall-hung WC, per pc"), unit: pc, price: 72 });
  add({
    articleNo: "520410",
    text: t("Flexkleber C2TE S1", "Flexible tile adhesive C2TE S1"),
    unit: t("Sack", "bag"),
    price: 18.75,
    packaging: t("1 Sack = 25 kg", "1 bag = 25 kg"),
  });
  add({
    articleNo: "520510",
    text: t("Fugenmörtel CG2 WA, grau", "Grout CG2 WA, grey"),
    unit: t("Sack", "bag"),
    price: 11.4,
    packaging: t("1 Sack = 5 kg", "1 bag = 5 kg"),
  });
  add({
    articleNo: "520300",
    text: t("Dichtschlämme 2K flexibel", "Waterproofing slurry, 2-component, flexible"),
    unit: t("Gebinde", "pail"),
    price: 96,
    packaging: t("1 Gebinde = 24 kg", "1 pail = 24 kg"),
    notes: t("Verbrauch 3 kg/m² bei vorgeschriebener Schichtdicke", "Consumption 3 kg/m² at the specified layer thickness"),
  });
  add({
    articleNo: "520110",
    text: t("Tiefengrund lösemittelfrei", "Deep primer, solvent-free"),
    unit: t("Kanister", "can"),
    price: 42,
    packaging: t("1 Kanister = 10 l", "1 can = 10 l"),
    notes: t("Verbrauch 0,15 l/m²", "Consumption 0.15 l/m²"),
  });
  add({
    articleNo: "520610",
    text: t("Dichtband für Wandanschlüsse, 120 mm", "Sealing tape for wall joints, 120 mm"),
    unit: t("Rolle", "roll"),
    price: 18.9,
    packaging: t("1 Rolle = 10 m", "1 roll = 10 m"),
  });
  add({
    articleNo: "530360",
    text: t("Feinsteinzeug 30 x 60 cm, grau matt", "Porcelain stoneware 30 x 60 cm, grey matt"),
    unit: t("Paket", "pack"),
    price: 51.84,
    packaging: t("1 Paket = 1,44 m²", "1 pack = 1.44 m²"),
  });
  add({
    articleNo: "530660",
    text: t("Feinsteinzeug 60 x 60 cm, grau matt", "Porcelain stoneware 60 x 60 cm, grey matt"),
    unit: t("Paket", "pack"),
    price: 49.68,
    packaging: t("1 Paket = 1,08 m²", "1 pack = 1.08 m²"),
  });
  add({
    articleNo: "531360",
    text: t("Wandfliese 30 x 60 cm, weiß glänzend", "Wall tile 30 x 60 cm, white gloss"),
    unit: t("Paket", "pack"),
    price: 38.88,
    packaging: t("1 Paket = 1,62 m²", "1 pack = 1.62 m²"),
  });
  add({
    articleNo: "540310",
    text: t("Sanitärsilikon 310 ml, transparent", "Sanitary silicone 310 ml, transparent"),
    unit: t("Karton", "carton"),
    price: 66,
    packaging: t("1 Karton = 12 Kartuschen", "1 carton = 12 cartridges"),
  });
  for (const [dn, price] of [
    [50, 24],
    [75, 29],
    [110, 38],
  ] as const)
    add({
      articleNo: `600${String(dn).padStart(3, "0")}`,
      text: t(`Brandschutzmanschette R 90 für Rohr DN ${dn}`, `Fire protection collar R 90 for pipe DN ${dn}`),
      unit: pc,
      price,
    });
  add({ articleNo: "700010", text: t("Monteurstunde", "Fitter hour"), unit: "h", price: 58 });
  add({ articleNo: "700020", text: t("Helferstunde", "Helper hour"), unit: "h", price: 44 });
  add({ articleNo: "700030", text: t("Meisterstunde", "Master craftsman hour"), unit: "h", price: 72 });
  add({
    articleNo: "800680",
    text: t("Kristallspiegel 60 x 80 cm, Aktionspreis", "Crystal mirror 60 x 80 cm, promotional price"),
    unit: pc,
    price: 39,
    notes: t("Aktionspreis, gültig bis 30.09.2026", "Promotional price, valid until 30 Sep 2026"),
  });
  add({ articleNo: "800681", text: t("Kristallspiegel 60 x 80 cm", "Crystal mirror 60 x 80 cm"), unit: pc, price: 52 });
  add({ articleNo: "800690", text: t("Kristallspiegel 60 x 90 cm", "Crystal mirror 60 x 90 cm"), unit: pc, price: 58 });

  let seed = 9010;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const shuffled = [...LINES].sort(() => random() - 0.5);
  shuffled.forEach((line, index) => (line.id = `L${String(index + 1).padStart(3, "0")}`));
  const OFFER_LINES = shuffled.sort((a, b) => a.id.localeCompare(b.id));

  const CONDITIONS = t(
    `Angebot Nr. 2026-118 vom 02.10.2026, Haustechnik Müller GmbH, gültig 6 Wochen. Alle Preise in EUR netto zzgl. MwSt.
1. Objektrabatt: Auf alle Artikel der Warengruppe Sanitärkeramik (Artikelnummern beginnend mit 31) gewähren wir zusätzlich 8 % Rabatt.
2. Metallzuschlag: Kupferrohrpreise verstehen sich ohne Metallzuschlag. Der Zuschlag beträgt 0,95 € je m Rohr und wird gesondert berechnet.
3. Staffelpreise gelten für die Gesamtabnahmemenge eines Artikels in diesem Auftrag, über alle LV-Positionen zusammen.
4. Korrektur eines Druckfehlers: Art. 250018 kostet 54,80 € je Stange statt des aufgeführten Preises.
5. Lieferung frei Baustelle ab 500 € Warenwert, darunter Frachtpauschale 35 €.
6. Montagepreise gelten nur in Verbindung mit der Lieferung des Artikels.
7. Zahlungsziel 30 Tage netto, 2 % Skonto bei Zahlung innerhalb von 10 Tagen.`,
    `Offer no. 2026-118 of 2 Oct 2026, Haustechnik Müller GmbH, valid for 6 weeks. All prices in EUR net, plus VAT.
1. Project discount: on all articles of the product group sanitary ceramics (article numbers starting with 31) we grant an additional 8 % discount.
2. Metal surcharge: copper pipe prices exclude the metal surcharge. The surcharge is EUR 0.95 per m of pipe and is charged separately.
3. Tier prices apply to the total quantity of an article in this order, over all LV Items together.
4. Correction of a misprint: art. 250018 costs EUR 54.80 per bar instead of the listed price.
5. Delivery free to site from EUR 500 of goods, below that a flat freight charge of EUR 35.
6. Installation prices apply only together with the supply of the article.
7. Payment within 30 days net, 2 % cash discount for payment within 10 days.`,
  );

  const line = (articleNo: string) => {
    const found = byArticle.get(articleNo);
    if (!found) throw new Error(`no article ${articleNo}`);
    return found;
  };
  const perUnit = (articleNo: string) => {
    const value = line(articleNo);
    const price = articleNo === "250018" ? 54.8 : value.price;
    return (price / (value.priceUnit ?? 1)) * (1 - (value.discountPercent ?? 0) / 100) * (articleNo.startsWith("31") ? 0.92 : 1);
  };
  const priced = (articles: string[], price: () => number) => (): Gold => [{ lines: articles.map((a) => line(a).id), unitPrice: round2(price()) }];
  const either =
    (...answers: Array<() => Gold>) =>
    (): Gold =>
      answers.flatMap((answer) => {
        const gold = answer();
        return gold === "unpriced" ? [] : gold;
      });
  const unpriced = () => (): Gold => "unpriced";

  const st = t("St", "pcs");
  const supply = t("liefern", "supply");
  const DOWEL_TOTAL: Record<string, number> = {};
  const dowel = (code: string, size: string, quantity: number): Spec => {
    DOWEL_TOTAL[code] = (DOWEL_TOTAL[code] ?? 0) + quantity;
    return {
      short: t(`Spreizdübel ${size} mm`, `Expansion plug ${size} mm`),
      long: t(`Spreizdübel ${size} mm, Nylon, liefern.`, `Expansion plug ${size} mm, nylon, supply.`),
      quantity,
      unit: st,
      trap: "tier over all Items",
      gold: () =>
        DOWEL_TOTAL[code]! >= 1000 ? priced([`5005${code}`], () => perUnit(`5005${code}`))() : priced([`5004${code}`], () => perUnit(`5004${code}`))(),
    };
  };
  const kg = (dn: number, length: number) =>
    t(`KG-Rohr PVC-U, SN 4, DN ${dn}, Baulänge ${mm(length)} mm, ${supply}.`, `KG pipe PVC-U, SN 4, DN ${dn}, length ${mm(length)} mm, ${supply}.`);
  const ht = (dn: number, length: number) =>
    t(`HT-Rohr PP, DN ${dn}, Baulänge ${mm(length)} mm, ${supply}.`, `HT pipe PP, DN ${dn}, length ${mm(length)} mm, ${supply}.`);
  const collar = (dn: number) =>
    t(
      `Brandschutzmanschette R 90 für Kunststoffrohr DN ${dn}, mit abZ, liefern.`,
      `Fire protection collar R 90 for plastic pipe DN ${dn}, with national technical approval, supply.`,
    );
  const channel = (length: number, install: boolean) =>
    t(
      `Duschrinne Edelstahl, Länge ${length} cm, mit Rost, ${install ? "liefern und montieren" : "liefern"}.`,
      `Shower channel stainless steel, length ${length} cm, with grate, ${install ? "supply and install" : "supply"}.`,
    );
  const daywork = (de: string, en: string) => t(`Stundenlohnarbeiten, ${de}, nach Anordnung der Bauleitung.`, `Daywork, ${en}, as instructed by site management.`);
  const copper = (size: number, hard: boolean) =>
    t(
      `Kupferrohr ${size} x 1 mm, ${hard ? "hart, in Stangen" : "weich, im Ring"}, liefern.`,
      `Copper pipe ${size} x 1 mm, ${hard ? "hard, in bars" : "soft, in coils"}, supply.`,
    );
  const press = (de: string, en: string, size: number) =>
    t(`Edelstahl-${de}, Durchmesser ${size} mm, liefern.`, `Stainless steel ${en}, diameter ${size} mm, supply.`);
  const valve = (dn: number) => t(`Absperrventil DN ${dn}, Messing, mit Entleerung, liefern.`, `Shut-off valve DN ${dn}, brass, with drain, supply.`);
  const insulation = (pipe: number, thickness: number) =>
    t(
      `Kautschuk-Dämmschlauch für Rohr ${pipe} mm, Dämmdicke ${thickness} mm, liefern.`,
      `Elastomeric pipe insulation for ${pipe} mm pipe, insulation thickness ${thickness} mm, supply.`,
    );
  const clip = (thread: string, inch: string) =>
    t(
      `Rohrschelle mit Gummieinlage, Anschluss ${thread}, für Rohr ${inch}, verzinkt, liefern.`,
      `Pipe clip with rubber insert, ${thread} connection, for ${inch} pipe, galvanised, supply.`,
    );
  const lm = t("lfm", "lm");
  const sqm = t("qm", "sqm");

  const TITLES: [string, Spec[]][] = [
    [
      "01",
      [
        { short: t("KG-Rohr DN 110, Baulänge 2 m", "KG pipe DN 110, length 2 m"), long: kg(110, 2000), quantity: 36, unit: st, trap: "size", gold: priced(["101104"], () => perUnit("101104")) },
        { short: t("KG-Rohr DN 125, Baulänge 2 m", "KG pipe DN 125, length 2 m"), long: kg(125, 2000), quantity: 24, unit: st, trap: "size", gold: priced(["101254"], () => perUnit("101254")) },
        { short: t("KG-Rohr DN 160, Baulänge 1 m", "KG pipe DN 160, length 1 m"), long: kg(160, 1000), quantity: 12, unit: st, trap: "size and length", gold: priced(["101602"], () => perUnit("101602")) },
        { short: t("KG-Rohr DN 125, Baulänge 0,5 m", "KG pipe DN 125, length 0.5 m"), long: kg(125, 500), quantity: 16, unit: st, trap: "size and length", gold: priced(["101251"], () => perUnit("101251")) },
        {
          short: t("Zulage Formstücke zu 01.01", "Supplement for fittings to 01.01"),
          long: t("Zulage zu Pos. 01.01 für Formstücke (Bögen, Abzweige) DN 110, je Stück, liefern.", "Supplement to item 01.01 for fittings (bends, branches) DN 110, per piece, supply."),
          quantity: 22,
          unit: st,
          trap: "surcharge line",
          gold: priced(["101109"], () => perUnit("101109")),
        },
        {
          short: t("Zulage Formstücke zu 01.02", "Supplement for fittings to 01.02"),
          long: t("Zulage zu Pos. 01.02 für Formstücke (Bögen, Abzweige) DN 125, je Stück, liefern.", "Supplement to item 01.02 for fittings (bends, branches) DN 125, per piece, supply."),
          quantity: 18,
          unit: st,
          trap: "surcharge line",
          gold: priced(["101259"], () => perUnit("101259")),
        },
        { short: t("HT-Rohr DN 50, Baulänge 1 m", "HT pipe DN 50, length 1 m"), long: ht(50, 1000), quantity: 40, unit: st, trap: "size", gold: priced(["120502"], () => perUnit("120502")) },
        { short: t("HT-Rohr DN 75, Baulänge 0,5 m", "HT pipe DN 75, length 0.5 m"), long: ht(75, 500), quantity: 20, unit: st, trap: "size", gold: priced(["120751"], () => perUnit("120751")) },
        { short: t("HT-Rohr DN 40, Baulänge 0,25 m", "HT pipe DN 40, length 0.25 m"), long: ht(40, 250), quantity: 30, unit: st, trap: "length not offered", gold: unpriced() },
        { short: t("HT-Rohr DN 110, Baulänge 2 m", "HT pipe DN 110, length 2 m"), long: ht(110, 2000), quantity: 14, unit: st, trap: "HT vs KG", gold: priced(["121104"], () => perUnit("121104")) },
        { short: t("Brandschutzmanschette R 90, DN 110", "Fire protection collar R 90, DN 110"), long: collar(110), quantity: 10, unit: st, trap: "plain", gold: priced(["600110"], () => perUnit("600110")) },
        { short: t("Brandschutzmanschette R 90, DN 125", "Fire protection collar R 90, DN 125"), long: collar(125), quantity: 8, unit: st, trap: "no fit: unpriced", gold: unpriced() },
        { short: t("Brandschutzmanschette R 90, DN 75", "Fire protection collar R 90, DN 75"), long: collar(75), quantity: 6, unit: st, trap: "plain", gold: priced(["600075"], () => perUnit("600075")) },
        {
          short: t("Duschrinne 80 cm", "Shower channel 80 cm"),
          long: channel(80, true),
          quantity: 3,
          unit: st,
          trap: "supply + install",
          gold: priced(["420080", "900420"], () => perUnit("420080") + perUnit("900420")),
        },
        { short: t("Duschrinne 100 cm", "Shower channel 100 cm"), long: channel(100, false), quantity: 2, unit: st, trap: "supply only", gold: priced(["420100"], () => perUnit("420100")) },
        {
          short: t("Duschrinne 70 cm", "Shower channel 70 cm"),
          long: channel(70, true),
          quantity: 4,
          unit: st,
          trap: "supply + install",
          gold: priced(["420070", "900420"], () => perUnit("420070") + perUnit("900420")),
        },
        { short: t("Stundenlohn Monteur", "Daywork fitter"), long: daywork("Monteur", "fitter"), quantity: 20, unit: "h", trap: "fitter", gold: priced(["700010"], () => perUnit("700010")) },
        { short: t("Stundenlohn Helfer", "Daywork helper"), long: daywork("Helfer", "helper"), quantity: 20, unit: "h", trap: "helper", gold: priced(["700020"], () => perUnit("700020")) },
      ],
    ],
    [
      "02",
      [
        { short: t("Kupferrohr 15 x 1 mm, hart", "Copper pipe 15 x 1 mm, hard"), long: copper(15, true), quantity: 150, unit: lm, trap: "bar + metal surcharge", gold: priced(["250015"], () => perUnit("250015") / 5 + 0.95) },
        { short: t("Kupferrohr 18 x 1 mm, hart", "Copper pipe 18 x 1 mm, hard"), long: copper(18, true), quantity: 90, unit: lm, trap: "erratum + bar + surcharge", gold: priced(["250018"], () => perUnit("250018") / 5 + 0.95) },
        { short: t("Kupferrohr 22 x 1 mm, hart", "Copper pipe 22 x 1 mm, hard"), long: copper(22, true), quantity: 60, unit: lm, trap: "bar + metal surcharge", gold: priced(["250022"], () => perUnit("250022") / 5 + 0.95) },
        { short: t("Kupferrohr 12 x 1 mm, weich", "Copper pipe 12 x 1 mm, soft"), long: copper(12, false), quantity: 100, unit: "m", trap: "ring + metal surcharge", gold: priced(["250112"], () => perUnit("250112") / 50 + 0.95) },
        {
          short: t("Edelstahl-Pressrohr 22 mm", "Stainless steel press pipe 22 mm"),
          long: t("Edelstahl-Pressrohr 22 x 1,0 mm, in Stangen, liefern.", "Stainless steel press pipe 22 x 1.0 mm, in bars, supply."),
          quantity: 128,
          unit: "m",
          trap: "bar of 6 m",
          gold: priced(["240022"], () => perUnit("240022") / 6),
        },
        {
          short: t("Edelstahl-Pressrohr 28 mm", "Stainless steel press pipe 28 mm"),
          long: t("Edelstahl-Pressrohr 28 x 1,0 mm, in Stangen, liefern.", "Stainless steel press pipe 28 x 1.0 mm, in bars, supply."),
          quantity: 64,
          unit: "m",
          trap: "bar of 6 m",
          gold: priced(["240028"], () => perUnit("240028") / 6),
        },
        { short: t("Pressbogen 90°, 22 mm", "Press elbow 90°, 22 mm"), long: press("Pressbogen 90°", "press elbow 90°", 22), quantity: 40, unit: st, trap: "pack of 10", gold: priced(["240922"], () => perUnit("240922") / 10) },
        { short: t("Pressbogen 90°, 28 mm", "Press elbow 90°, 28 mm"), long: press("Pressbogen 90°", "press elbow 90°", 28), quantity: 16, unit: st, trap: "single, not pack", gold: priced(["240928"], () => perUnit("240928")) },
        { short: t("Pressbogen 45°, 22 mm", "Press elbow 45°, 22 mm"), long: press("Pressbogen 45°", "press elbow 45°", 22), quantity: 24, unit: st, trap: "45 vs 90", gold: priced(["240422"], () => perUnit("240422")) },
        { short: t("Pressmuffe 22 mm", "Press coupling 22 mm"), long: press("Pressmuffe", "press coupling", 22), quantity: 60, unit: st, trap: "plain", gold: priced(["240822"], () => perUnit("240822")) },
        { short: t("Absperrventil DN 15", "Shut-off valve DN 15"), long: valve(15), quantity: 12, unit: st, trap: 'DN 15 = ½", per 100', gold: priced(["260015"], () => perUnit("260015")) },
        { short: t("Absperrventil DN 20", "Shut-off valve DN 20"), long: valve(20), quantity: 10, unit: st, trap: 'DN 20 = ¾", per 100', gold: priced(["260020"], () => perUnit("260020")) },
        { short: t("Absperrventil DN 32", "Shut-off valve DN 32"), long: valve(32), quantity: 4, unit: st, trap: 'DN 32 = 1¼", per 100', gold: priced(["260032"], () => perUnit("260032")) },
        { short: t("Dämmschlauch 22 x 13 mm", "Pipe insulation 22 x 13 mm"), long: insulation(22, 13), quantity: 128, unit: "m", trap: "synonym, 13 vs 9, bar", gold: priced(["2302213"], () => perUnit("2302213") / 2) },
        { short: t("Dämmschlauch 28 x 9 mm", "Pipe insulation 28 x 9 mm"), long: insulation(28, 9), quantity: 64, unit: "m", trap: "synonym, 9 vs 13, bar", gold: priced(["230289"], () => perUnit("230289") / 2) },
        { short: t("Dämmschlauch 15 x 9 mm", "Pipe insulation 15 x 9 mm"), long: insulation(15, 9), quantity: 150, unit: "m", trap: "synonym, bar", gold: priced(["230159"], () => perUnit("230159") / 2) },
        { short: t('Rohrschelle M8 ½"', 'Pipe clip M8 ½"'), long: clip("M8", '½"'), quantity: 120, unit: st, trap: "synonym, per 100", gold: priced(["220190"], () => perUnit("220190")) },
        { short: t('Rohrschelle M10 1¼"', 'Pipe clip M10 1¼"'), long: clip("M10", '1¼"'), quantity: 40, unit: st, trap: "synonym, per 100", gold: priced(["220198"], () => perUnit("220198")) },
        { short: t("Stundenlohn Meister", "Daywork master craftsman"), long: daywork("Meister", "master craftsman"), quantity: 8, unit: "h", trap: "master", gold: priced(["700030"], () => perUnit("700030")) },
      ],
    ],
    [
      "03",
      [
        {
          short: t("Waschtisch 60 cm", "Washbasin 60 cm"),
          long: t(
            "Waschtisch aus Sanitärkeramik, weiß, Breite 60 cm, mit Hahnloch und Überlauf. Fabrikat: Keramag Renova oder gleichwertig. Liefern.",
            "Washbasin of sanitary ceramics, white, width 60 cm, with tap hole and overflow. Make: Keramag Renova or equivalent. Supply.",
          ),
          quantity: 6,
          unit: st,
          trap: "named make or equivalent + 8 %",
          gold: either(priced(["310110"], () => perUnit("310110")), priced(["310120"], () => perUnit("310120"))),
        },
        {
          short: t("Waschtisch 65 cm", "Washbasin 65 cm"),
          long: t(
            "Waschtisch aus Sanitärkeramik, weiß, Breite 65 cm, mit Hahnloch und Überlauf. Fabrikat: Keramag Renova oder gleichwertig. Liefern und montieren.",
            "Washbasin of sanitary ceramics, white, width 65 cm, with tap hole and overflow. Make: Keramag Renova or equivalent. Supply and install.",
          ),
          quantity: 2,
          unit: st,
          trap: "8 % + install (no 8 %)",
          gold: priced(["310115", "900310"], () => perUnit("310115") + perUnit("900310")),
        },
        {
          short: t("Wand-WC spülrandlos", "Wall-hung WC, rimless"),
          long: t(
            "Wand-WC, spülrandlos, Sanitärkeramik weiß. Fabrikat: Keramag Renova Rimfree oder gleichwertig. Liefern.",
            "Wall-hung WC, rimless, sanitary ceramics, white. Make: Keramag Renova Rimfree or equivalent. Supply.",
          ),
          quantity: 6,
          unit: st,
          trap: "named make or equivalent + 8 %",
          gold: either(priced(["310210"], () => perUnit("310210")), priced(["310220"], () => perUnit("310220"))),
        },
        {
          short: "Urinal",
          long: t(
            "Urinal, Zulauf von hinten, Sanitärkeramik weiß. Fabrikat: Duravit Fizz oder gleichwertig. Liefern.",
            "Urinal, rear inlet, sanitary ceramics, white. Make: Duravit Fizz or equivalent. Supply.",
          ),
          quantity: 2,
          unit: st,
          trap: "only the equivalent + 8 %",
          gold: priced(["310410"], () => perUnit("310410")),
        },
        {
          short: t("Vorwandelement WC 112 cm", "Installation frame WC 112 cm"),
          long: t(
            "Vorwandelement für Wand-WC, Bauhöhe 112 cm, mit Unterputz-Spülkasten, liefern.",
            "Installation frame for wall-hung WC, height 112 cm, with concealed cistern, supply.",
          ),
          quantity: 6,
          unit: st,
          trap: "synonym + line discount",
          gold: priced(["330510"], () => perUnit("330510")),
        },
        {
          short: t("Vorwandelement Waschtisch", "Installation frame washbasin"),
          long: t("Vorwandelement für Waschtisch, Bauhöhe 112 cm, liefern.", "Installation frame for washbasin, height 112 cm, supply."),
          quantity: 8,
          unit: st,
          trap: "synonym + line discount",
          gold: priced(["330610"], () => perUnit("330610")),
        },
        {
          short: t("Vorwandelement Urinal", "Installation frame urinal"),
          long: t("Vorwandelement für Urinal, Bauhöhe 130 cm, liefern.", "Installation frame for urinal, height 130 cm, supply."),
          quantity: 2,
          unit: st,
          trap: "synonym, no discount",
          gold: priced(["330713"], () => perUnit("330713")),
        },
        {
          short: t("Thermostat-Brausebatterie Aufputz", "Thermostatic shower mixer, surface-mounted"),
          long: t("Thermostat-Brausebatterie für Aufputzmontage, verchromt, liefern.", "Thermostatic shower mixer for surface mounting, chrome-plated, supply."),
          quantity: 4,
          unit: st,
          trap: "discontinued",
          gold: priced(["410028"], () => perUnit("410028")),
        },
        {
          short: t("Waschtischarmatur", "Basin tap"),
          long: t("Waschtisch-Einhebelmischer, verchromt, liefern.", "Single-lever basin mixer, chrome-plated, supply."),
          quantity: 8,
          unit: st,
          trap: "plain",
          gold: priced(["410512"], () => perUnit("410512")),
        },
        {
          short: t("Spiegel 60 x 80 cm", "Mirror 60 x 80 cm"),
          long: t("Kristallspiegel 60 x 80 cm, liefern.", "Crystal mirror 60 x 80 cm, supply."),
          quantity: 6,
          unit: st,
          trap: "expired promotion",
          gold: priced(["800681"], () => perUnit("800681")),
        },
        {
          short: t("Spiegel 60 x 90 cm", "Mirror 60 x 90 cm"),
          long: t("Kristallspiegel 60 x 90 cm, liefern.", "Crystal mirror 60 x 90 cm, supply."),
          quantity: 2,
          unit: st,
          trap: "size",
          gold: priced(["800690"], () => perUnit("800690")),
        },
        {
          short: t("Sanitärsilikon", "Sanitary silicone"),
          long: t("Sanitärsilikon, transparent, Kartusche 310 ml, liefern.", "Sanitary silicone, transparent, 310 ml cartridge, supply."),
          quantity: 24,
          unit: st,
          trap: "carton of 12",
          gold: priced(["540310"], () => perUnit("540310") / 12),
        },
        dowel("08", "8 x 40", 700),
        dowel("06", "6 x 30", 300),
        dowel("10", "10 x 50", 1500),
      ],
    ],
    [
      "04",
      [
        {
          short: t("Fliesenkleber C2TE S1", "Tile adhesive C2TE S1"),
          long: t("Flexibler Fliesenkleber C2TE S1, liefern.", "Flexible tile adhesive C2TE S1, supply."),
          quantity: 250,
          unit: "kg",
          trap: "sack of 25 kg",
          gold: priced(["520410"], () => perUnit("520410") / 25),
        },
        {
          short: t("Fugenmörtel CG2 WA", "Grout CG2 WA"),
          long: t("Fugenmörtel CG2 WA, grau, liefern.", "Grout CG2 WA, grey, supply."),
          quantity: 40,
          unit: "kg",
          trap: "sack of 5 kg",
          gold: priced(["520510"], () => perUnit("520510") / 5),
        },
        {
          short: t("Verbundabdichtung 2K", "Bonded waterproofing 2K"),
          long: t(
            "Flüssige Verbundabdichtung, 2-komponentig, im Duschbereich, Auftrag gemäß Herstellerangabe, liefern.",
            "Liquid bonded waterproofing, 2-component, in the shower area, applied as the manufacturer specifies, supply.",
          ),
          quantity: 40,
          unit: "m²",
          trap: "consumption kg/m²",
          gold: priced(["520300"], () => (perUnit("520300") / 24) * 3),
        },
        {
          short: t("Grundierung", "Primer"),
          long: t(
            "Tiefengrund, lösemittelfrei, auf saugenden Untergründen, Auftrag gemäß Herstellerangabe, liefern.",
            "Deep primer, solvent-free, on absorbent substrates, applied as the manufacturer specifies, supply.",
          ),
          quantity: 120,
          unit: sqm,
          trap: "consumption l/m², sqm",
          gold: priced(["520110"], () => (perUnit("520110") / 10) * 0.15),
        },
        {
          short: t("Dichtband Wandanschluss", "Sealing tape wall joint"),
          long: t("Dichtband für Wand-Boden-Anschlüsse, Breite 120 mm, liefern.", "Sealing tape for wall-floor joints, width 120 mm, supply."),
          quantity: 60,
          unit: lm,
          trap: "roll of 10 m",
          gold: priced(["520610"], () => perUnit("520610") / 10),
        },
        {
          short: t("Bodenfliesen 30 x 60 cm", "Floor tiles 30 x 60 cm"),
          long: t("Bodenfliesen Feinsteinzeug 30 x 60 cm, grau matt, liefern.", "Floor tiles porcelain stoneware 30 x 60 cm, grey matt, supply."),
          quantity: 85,
          unit: sqm,
          trap: "pack of 1.44 m²",
          gold: priced(["530360"], () => perUnit("530360") / 1.44),
        },
        {
          short: t("Bodenfliesen 60 x 60 cm", "Floor tiles 60 x 60 cm"),
          long: t("Bodenfliesen Feinsteinzeug 60 x 60 cm, grau matt, liefern.", "Floor tiles porcelain stoneware 60 x 60 cm, grey matt, supply."),
          quantity: 30,
          unit: sqm,
          trap: "pack of 1.08 m²",
          gold: priced(["530660"], () => perUnit("530660") / 1.08),
        },
        {
          short: t("Wandfliesen 30 x 60 cm", "Wall tiles 30 x 60 cm"),
          long: t("Wandfliesen 30 x 60 cm, weiß glänzend, liefern.", "Wall tiles 30 x 60 cm, white gloss, supply."),
          quantity: 140,
          unit: sqm,
          trap: "pack of 1.62 m²",
          gold: priced(["531360"], () => perUnit("531360") / 1.62),
        },
        {
          short: t("Wandfliesen 20 x 20 cm", "Wall tiles 20 x 20 cm"),
          long: t("Wandfliesen 20 x 20 cm, weiß matt, liefern.", "Wall tiles 20 x 20 cm, white matt, supply."),
          quantity: 25,
          unit: sqm,
          trap: "no fit: unpriced",
          gold: unpriced(),
        },
        dowel("08", "8 x 40", 400),
        { short: t('Rohrschelle M8 ¾"', 'Pipe clip M8 ¾"'), long: clip("M8", '¾"'), quantity: 200, unit: st, trap: "synonym, per 100", gold: priced(["220192"], () => perUnit("220192")) },
      ],
    ],
  ];

  const ITEMS: Item[] = [];
  const TRAPS: Record<string, string> = {};
  for (const [title, specs] of TITLES)
    specs.forEach((spec, index) => {
      const id = `it-${title}${String(index + 1).padStart(2, "0")}`;
      ITEMS.push({ id, ordinal: `${title}.${String(index + 1).padStart(2, "0")}`, short: spec.short, long: spec.long, quantity: spec.quantity, unit: spec.unit });
      TRAPS[id] = spec.trap;
    });
  const GOLD: Record<string, Gold> = {};
  const specs = TITLES.flatMap(([, list]) => list);
  specs.forEach((spec, index) => (GOLD[ITEMS[index]!.id] = spec.gold()));
  return { OFFER_LINES, CONDITIONS, ITEMS, GOLD, TRAPS };
};
