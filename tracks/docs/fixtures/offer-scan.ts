/**
 * An electrical supplier offer as three scanned pages, in German and in English: printed lines with
 * price units and discounts, a metal surcharge for cables computed from a printed formula, a
 * received stamp over one total, a handwritten price correction, a line struck out by hand, and a
 * handwritten note that extends a discount, a handwritten discount correction, and a last page fed
 * into the scanner upside down. `scanHtml` lays out a page as scanned or turned by 180°;
 * `render-scans.ts` turns both into the committed images.
 */
import type { Lang } from "../../../src/types";
import type { GoldLine } from "../offer-lines";
import { formatNumber, type Text } from "../shared";

type ScanLine = {
  pos: string;
  marker?: "A" | "B";
  articleNo: string;
  text: Text;
  quantity: number;
  unit: Text;
  price: number;
  priceUnit: number;
  discount?: number;
  page: 1 | 2 | 3;
  /** A handwritten unit price replacing the struck printed one. */
  handPrice?: number;
  /** Struck out by hand: discontinued. */
  struck?: boolean;
  /** A received stamp covers the printed total. */
  stamped?: boolean;
  /** A handwritten note grants this discount on top. */
  handDiscount?: number;
  /** A handwritten discount replacing the struck printed one. */
  handRebate?: number;
  /** Copper weight in kg/km: the line carries a metal surcharge per metre, without discount. */
  copper?: number;
};

/** The DEL copper quote on the offer date and the copper base included in cable prices, EUR/100 kg. */
const DEL = 870;
const COPPER_BASE = 150;
const metalSurcharge = (line: ScanLine) => ((line.copper ?? 0) * (DEL - COPPER_BASE)) / 100_000;

type Section = { title: Text; lines: ScanLine[] };

const m = { de: "m", en: "m" };
const pcs = { de: "Stk", en: "pcs" };

export const SECTIONS: Section[] = [
  {
    title: { de: "Kabel und Leitungen", en: "Cables and wires" },
    lines: [
      { pos: "1", articleNo: "410315", text: { de: "NYM-J 3x1,5 mm², Ring 100 m, Cu-Zahl 43,2", en: "NYM-J 3x1.5 mm² cable, 100 m coil, Cu 43.2" }, quantity: 800, unit: m, price: 68.9, priceUnit: 100, discount: 15, copper: 43.2, page: 1 },
      { pos: "2", articleNo: "410325", text: { de: "NYM-J 3x2,5 mm², Ring 100 m, Cu-Zahl 72,0", en: "NYM-J 3x2.5 mm² cable, 100 m coil, Cu 72.0" }, quantity: 450, unit: m, price: 104.5, priceUnit: 100, discount: 15, copper: 72, page: 1 },
      { pos: "3", articleNo: "410525", text: { de: "NYM-J 5x2,5 mm², Trommel, Cu-Zahl 120,0", en: "NYM-J 5x2.5 mm² cable, drum, Cu 120.0" }, quantity: 120, unit: m, price: 172, priceUnit: 100, discount: 15, copper: 120, page: 1 },
      {
        pos: "4",
        articleNo: "420220",
        text: { de: "J-Y(St)Y 2x2x0,8 Fernmeldeleitung, Cu-Zahl 9,6", en: "J-Y(St)Y 2x2x0.8 telecom cable, Cu 9.6" },
        quantity: 300,
        unit: m,
        price: 39.8,
        priceUnit: 100,
        copper: 9.6,
        page: 1,
        stamped: true,
      },
    ],
  },
  {
    title: { de: "Schalter und Steckdosen", en: "Switches and sockets" },
    lines: [
      { pos: "5", articleNo: "510010", text: { de: "Schuko-Steckdose UP, reinweiß", en: "Schuko socket, flush-mounted, pure white" }, quantity: 140, unit: pcs, price: 4.85, priceUnit: 1, discount: 10, page: 1 },
      {
        pos: "6",
        articleNo: "510030",
        text: { de: "Doppelsteckdose UP, reinweiß", en: "Double socket, flush-mounted, pure white" },
        quantity: 60,
        unit: pcs,
        price: 8.2,
        priceUnit: 1,
        discount: 10,
        page: 1,
        handPrice: 7.6,
      },
      { pos: "7", articleNo: "520110", text: { de: "Aus-/Wechselschalter UP, reinweiß", en: "On/off two-way switch, flush-mounted, pure white" }, quantity: 85, unit: pcs, price: 6.4, priceUnit: 1, discount: 10, page: 1 },
      {
        pos: "8",
        marker: "A",
        articleNo: "520115",
        text: { de: "Kontrollschalter mit Glimmlampe, alternativ zu Pos. 7", en: "Switch with pilot lamp, alternative to item 7" },
        quantity: 85,
        unit: pcs,
        price: 9.1,
        priceUnit: 1,
        discount: 10,
        page: 1,
      },
      { pos: "9", marker: "B", articleNo: "530200", text: { de: "Präsenzmelder Decke 360°, DALI", en: "Ceiling presence detector 360°, DALI" }, quantity: 24, unit: pcs, price: 89, priceUnit: 1, page: 1 },
    ],
  },
  {
    title: { de: "Leuchten", en: "Luminaires" },
    lines: [
      { pos: "10", articleNo: "610450", text: { de: "LED-Panel 62,5 x 62,5 cm, 3.400 lm, 4000 K", en: "LED panel 62.5 x 62.5 cm, 3,400 lm, 4000 K" }, quantity: 96, unit: pcs, price: 74.5, priceUnit: 1, discount: 8, page: 2 },
      { pos: "11", articleNo: "610470", text: { de: "LED-Feuchtraumleuchte 1,5 m, IP65", en: "LED damp-proof luminaire 1.5 m, IP65" }, quantity: 18, unit: pcs, price: 52.3, priceUnit: 1, discount: 8, page: 2 },
      {
        pos: "12",
        marker: "B",
        articleNo: "620100",
        text: { de: "Sicherheitsleuchte Einzelbatterie 3 h", en: "Emergency luminaire, self-contained, 3 h" },
        quantity: 12,
        unit: pcs,
        price: 118,
        priceUnit: 1,
        page: 2,
      },
      {
        pos: "13",
        articleNo: "610490",
        text: { de: "LED-Downlight Ø 150 mm, 2.000 lm", en: "LED downlight Ø 150 mm, 2,000 lm" },
        quantity: 40,
        unit: pcs,
        price: 38.9,
        priceUnit: 1,
        discount: 8,
        page: 2,
        struck: true,
      },
    ],
  },
  {
    title: { de: "Verteiler und Schutzgeräte", en: "Distribution boards and protective devices" },
    lines: [
      { pos: "14", articleNo: "710120", text: { de: "Kleinverteiler UP 3-reihig, 36 TE", en: "Flush consumer unit, 3 rows, 36 modules" }, quantity: 4, unit: pcs, price: 186, priceUnit: 1, discount: 12, page: 2 },
      {
        pos: "15",
        articleNo: "710200",
        text: { de: "Leitungsschutzschalter B16, 1-polig", en: "Circuit breaker B16, single-pole" },
        quantity: 72,
        unit: pcs,
        price: 3.95,
        priceUnit: 1,
        page: 2,
        handDiscount: 12,
      },
      { pos: "16", articleNo: "710310", text: { de: "FI-Schutzschalter 40 A / 30 mA, 4-polig", en: "RCD 40 A / 30 mA, four-pole" }, quantity: 6, unit: pcs, price: 42.8, priceUnit: 1, discount: 12, page: 2 },
    ],
  },
  {
    title: { de: "Installationsmaterial", en: "Installation material" },
    lines: [
      { pos: "17", articleNo: "810100", text: { de: "Abzweigdose UP, Ø 68 mm", en: "Flush junction box, Ø 68 mm" }, quantity: 180, unit: pcs, price: 0.62, priceUnit: 1, discount: 10, page: 3 },
      { pos: "18", articleNo: "810200", text: { de: "Gerätedose UP, tief", en: "Flush device box, deep" }, quantity: 220, unit: pcs, price: 0.48, priceUnit: 1, discount: 10, page: 3 },
      { pos: "19", articleNo: "820010", text: { de: "Isolierrohr flexibel M20", en: "Flexible conduit M20" }, quantity: 600, unit: m, price: 23.5, priceUnit: 100, page: 3 },
      { pos: "20", articleNo: "820025", text: { de: "Isolierrohr flexibel M25", en: "Flexible conduit M25" }, quantity: 250, unit: m, price: 34.9, priceUnit: 100, page: 3 },
      { pos: "21", articleNo: "830110", text: { de: "Kabelkanal 40 x 60 mm, reinweiß", en: "Cable trunking 40 x 60 mm, pure white" }, quantity: 64, unit: m, price: 6.85, priceUnit: 1, page: 3 },
      {
        pos: "22",
        marker: "A",
        articleNo: "830115",
        text: { de: "Brüstungskanal Alu 70 x 130 mm, alternativ zu Pos. 21", en: "Aluminium dado trunking 70 x 130 mm, alternative to item 21" },
        quantity: 64,
        unit: m,
        price: 24.3,
        priceUnit: 1,
        page: 3,
      },
      {
        pos: "23",
        articleNo: "840500",
        text: { de: "Verbindungsklemme 3-polig, VE 100", en: "Splicing connector 3-pole, pack of 100" },
        quantity: 2000,
        unit: pcs,
        price: 14.9,
        priceUnit: 100,
        discount: 5,
        handRebate: 8,
        page: 3,
      },
      {
        pos: "24",
        marker: "B",
        articleNo: "850100",
        text: { de: "Brandschutzmanschette für Kabeldurchführung", en: "Fire collar for cable penetration" },
        quantity: 30,
        unit: pcs,
        price: 18.4,
        priceUnit: 1,
        page: 3,
      },
    ],
  },
];

export const PAGES = 3;
/** Pages fed into the scanner upside down. */
const UPSIDE_DOWN = new Set([3]);
const ALL_LINES = SECTIONS.flatMap((section) => section.lines);
const round2 = (value: number) => Math.round(value * 100) / 100;
const printedTotal = (line: ScanLine) => round2(((line.quantity * line.price) / line.priceUnit) * (1 - (line.discount ?? 0) / 100));

export const GOLD_LINES: GoldLine[] = ALL_LINES.map((line) => ({
  pos: line.pos,
  articleNo: line.articleNo,
  quantity: line.quantity,
  unit: line.unit,
  unitPrice:
    ((line.handPrice ?? line.price) / line.priceUnit) * (1 - (line.handRebate ?? line.discount ?? 0) / 100) * (1 - (line.handDiscount ?? 0) / 100) +
    metalSurcharge(line),
  lineTotal: line.struck ? null : printedTotal(line),
  alternative: line.marker === "A",
  optional: line.marker === "B",
  discontinued: Boolean(line.struck),
  gradeTotal: line.handPrice === undefined && line.handDiscount === undefined && line.handRebate === undefined,
}));

const COPY = {
  de: {
    company: "Elektro Kaiser GmbH · Gewerbering 7 · 04129 Leipzig · Tel. 0341 556 210",
    title: "ANGEBOT Nr. E-2026-0447",
    date: "Datum: 12.10.2026",
    project: "Bauvorhaben: Grundschule Am Mühlbach – Elektroinstallation, Los 4",
    note: "Alle Preise in EUR netto zzgl. MwSt. Der EP gilt je Preiseinheit (PE) in der angegebenen Mengeneinheit (ME).",
    copper: `Kabel und Leitungen: Preise auf Kupferbasis ${COPPER_BASE} €/100 kg. Zuzüglich Metallzuschlag je m = Cu-Zahl (kg/km) × (DEL-Notiz − ${COPPER_BASE}) / 100.000; DEL-Notiz vom 12.10.2026: ${DEL} €/100 kg. Der Metallzuschlag ist nicht rabattfähig und im GP nicht enthalten.`,
    columns: ["Pos.", "Art.-Nr.", "Bezeichnung", "Menge", "ME", "EP", "PE", "Rab.", "GP"],
    carry: "Übertrag",
    sum: "Summe Positionen (ohne A- und B-Positionen)",
    vat: "zzgl. 19 % MwSt.",
    gross: "Angebotssumme brutto",
    legend: "(A) = Alternativposition, nicht in der Summe · (B) = Bedarfsposition, nicht in der Summe",
    footer: (page: number) => `Elektro Kaiser GmbH · Angebot E-2026-0447 · Seite ${page} von ${PAGES}`,
    stamp: ["EINGEGANGEN", "16. OKT. 2026"],
    struck: "entfällt!",
    handNote: "Pos. 15: Rabatt 12 % wie Pos. 14 — tel. vereinbart 15.10. Ka.",
  },
  en: {
    company: "Elektro Kaiser GmbH · Gewerbering 7 · 04129 Leipzig · Tel. +49 341 556 210",
    title: "OFFER No. E-2026-0447",
    date: "Date: 12 October 2026",
    project: "Project: Am Mühlbach primary school – electrical installation, lot 4",
    note: "All prices in EUR net plus VAT. The unit price (UP) applies per price unit (PU) in the stated unit of quantity.",
    copper: `Cables and wires: prices on a copper base of EUR ${COPPER_BASE}/100 kg. Plus metal surcharge per m = Cu weight (kg/km) × (DEL quote − ${COPPER_BASE}) / 100,000; DEL quote of 12 Oct 2026: EUR ${DEL}/100 kg. The metal surcharge is not discountable and not included in the total.`,
    columns: ["Item", "Art. no.", "Description", "Qty", "Unit", "UP", "PU", "Disc.", "Total"],
    carry: "Carried forward",
    sum: "Total of items (excluding A and B items)",
    vat: "plus 19 % VAT",
    gross: "Offer total incl. VAT",
    legend: "(A) = alternative item, not in the total · (B) = provisional item, not in the total",
    footer: (page: number) => `Elektro Kaiser GmbH · Offer E-2026-0447 · Page ${page} of ${PAGES}`,
    stamp: ["RECEIVED", "16 OCT 2026"],
    struck: "deleted!",
    handNote: "Item 15: 12 % discount as item 14 — agreed by phone 15 Oct. Ka.",
  },
};

const counted = (line: ScanLine) => !line.marker;
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.28  0 0 0 0 0.25  0 0 0 0.22 0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>',
)}")`;

/** One scanned page as HTML: a tilted, slightly blurred sheet with stamp and handwriting, as scanned or turned by 180°. */
export const scanHtml = (lang: Lang, page: number, turned: boolean) => {
  const copy = COPY[lang];
  const number = (value: number, digits = 2) => formatNumber(lang, value, digits);
  const quantity = (value: number) => formatNumber(lang, value, 2, 0);
  const rotation = (page === 1 ? -0.7 : page === 2 ? 0.5 : -0.4) + (UPSIDE_DOWN.has(page) !== turned ? 180 : 0);
  const rows = SECTIONS.flatMap((section) => {
    const own = section.lines.filter((line) => line.page === page);
    if (!own.length) return [];
    return [
      `<tr class="section"><td></td><td></td><td colspan="7">${section.title[lang]}</td></tr>`,
      ...(own.some((line) => line.copper) ? [`<tr class="remark"><td></td><td></td><td colspan="7">${copy.copper}</td></tr>`] : []),
      ...own.map((line) => {
        const total = number(printedTotal(line));
        const price = line.handPrice
          ? `<span class="struck">${number(line.price)}</span><span class="hand price">${number(line.handPrice)}</span>`
          : number(line.price);
        return `<tr class="${line.struck ? "line crossed" : "line"}">
          <td>${line.pos}${line.marker ? ` (${line.marker})` : ""}</td><td>${line.articleNo}</td><td>${line.text[lang]}${line.struck ? `<span class="hand margin">${copy.struck}</span>` : ""}</td>
          <td class="n">${quantity(line.quantity)}</td><td>${line.unit[lang]}</td><td class="n">${price}</td>
          <td class="n">${line.priceUnit}</td><td class="n">${
            line.handRebate
              ? `<span class="struck">${line.discount} %</span><span class="hand price">${line.handRebate} %</span>`
              : line.discount
                ? `${line.discount} %`
                : ""
          }</td>
          <td class="n">${line.marker === "A" ? `(${total})` : total}${line.stamped ? `<div class="stamp">${copy.stamp.join("<br>")}</div>` : ""}</td>
        </tr>`;
      }),
    ];
  });
  const carry = ALL_LINES.filter((line) => line.page < page && counted(line)).reduce((sum, line) => sum + printedTotal(line), 0);
  const sum = ALL_LINES.filter(counted).reduce((sum, line) => sum + printedTotal(line), 0);
  const head =
    page === 1
      ? `<div class="company">${copy.company}</div><h1>${copy.title}</h1><div>${copy.date}</div><div>${copy.project}</div><p>${copy.note}</p>`
      : `<div class="company">${copy.footer(page)}</div><div class="carry">${copy.carry} ${number(carry)}</div>`;
  const totals =
    page === PAGES
      ? `<table class="totals"><tr><td>${copy.sum}</td><td class="n">${number(sum)}</td></tr><tr><td>${copy.vat}</td><td class="n">${number(sum * 0.19)}</td></tr><tr><td><b>${copy.gross}</b></td><td class="n"><b>${number(sum * 1.19)}</b></td></tr></table>`
      : "";
  const note = ALL_LINES.some((line) => line.page === page && line.handDiscount) ? `<div class="hand note">${copy.handNote}</div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #cfcbc2; }
    .sheet { position: relative; width: 980px; margin: 24px auto; padding: 40px 48px 56px; background: #f3f0e8; box-shadow: 0 2px 8px #0004;
      transform: rotate(${rotation}deg); filter: blur(0.45px) contrast(1.05); font: 14px "Liberation Sans", sans-serif; color: #222; }
    .sheet::after { content: ""; position: absolute; inset: 0; background: ${NOISE}; pointer-events: none; }
    h1 { font-size: 20px; margin: 14px 0 4px; }
    .company { font-size: 12px; color: #444; border-bottom: 1px solid #888; padding-bottom: 4px; }
    .carry { text-align: right; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th { text-align: left; border-bottom: 1.5px solid #333; padding: 4px 4px; font-size: 13px; }
    td { padding: 5px 4px; border-bottom: 1px solid #bbb; vertical-align: top; position: relative; }
    .n, td:first-child { text-align: right; white-space: nowrap; }
    td:first-child { text-align: left; }
    .section td { font-weight: bold; padding-top: 12px; border-bottom: none; }
    .remark td { font-size: 12px; border-bottom: none; padding-top: 0; }
    .struck { text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: #1d3a8a; margin-right: 6px; }
    .hand { font-family: "Z003", cursive; color: #1d3a8a; font-size: 24px; }
    .price { display: inline-block; transform: rotate(-6deg) translateY(-6px); }
    .crossed td:first-child::before { content: ""; position: absolute; left: 0; top: 50%; width: 940px; border-top: 2.5px solid #1d3a8a; transform: rotate(-0.6deg); }
    .margin { position: absolute; left: 330px; top: -8px; transform: rotate(-8deg); white-space: nowrap; }
    .stamp { position: absolute; right: -30px; top: -14px; padding: 4px 10px; border: 3px solid #b8323a; border-radius: 6px; color: #b8323a; opacity: 0.82;
      font: bold 17px "Liberation Sans", sans-serif; text-align: center; transform: rotate(-11deg); background: #f3f0e880; white-space: nowrap; }
    .totals { width: 55%; margin-left: auto; }
    .totals td { border-bottom: none; }
    .note { margin-top: 26px; transform: rotate(-2.5deg); }
    .footer { margin-top: 28px; font-size: 11px; color: #555; border-top: 1px solid #888; padding-top: 4px; }
  </style></head><body><div class="sheet">${head}
    <table><tr>${copy.columns.map((column, index) => `<th${index >= 3 && index !== 4 ? ' class="n"' : ""}>${column}</th>`).join("")}</tr>${rows.join("")}</table>
    ${totals}${note}
    <div class="footer">${copy.legend}<br>${copy.footer(page)}</div>
  </div></body></html>`;
};
