/**
 * A cable list for the second floor of an office building, its cable catalog, a tray catalog, and
 * the planning rules, with the power tray of every route sized from them by construction.
 */
import type { Lang } from "../../../src/types";
import { roundHalfUp } from "../calculator";

type Text = Record<Lang, string>;
export type Status = "new" | "cancelled" | "existing" | "removed";
export type Cable = { id: string; type: string; to: Text; route: string[]; count: number; status?: Status; note?: Text };
export type Route = { id: string; reserve: number; sideHeights: number[]; maxWidth?: number };
export type Tray = { designation: string; nominalWidth: number; sideHeight: number; innerWidth: number; usableHeight: number };

export const MAX_FILL = 0.4;
export const ROUTES: Route[] = [
  { id: "KR-1", reserve: 1.5, sideHeights: [60, 85] },
  { id: "KR-2", reserve: 1.3, sideHeights: [60] },
  { id: "KR-3", reserve: 1.3, sideHeights: [60, 85], maxWidth: 300 },
];

/** Outer diameters in mm. */
export const CATALOG: Record<string, number> = {
  "NYM-J 3x1.5": 8.4,
  "NYM-J 3x2.5": 9.6,
  "NYM-J 5x1.5": 10.0,
  "NYM-J 5x2.5": 11.4,
  "NYM-J 5x4": 13.3,
  "NYM-J 5x6": 14.8,
  "NYM-J 5x10": 18.5,
  "NYM-J 5x16": 21.6,
  "NYY-J 3x2.5": 12.2,
  "NYY-J 5x2.5": 13.5,
  "NYY-J 5x4": 15.2,
  "NYY-J 5x6": 16.2,
  "NYY-J 5x10": 19.5,
  "NYY-J 5x16": 22.5,
  "NYY-J 5x25": 27.0,
  "NHXH-J 3x1.5 E30": 10.6,
  "NHXH-J 5x2.5 E30": 13.9,
  "J-Y(St)Y 2x2x0.8": 5.4,
  "J-Y(St)Y 4x2x0.8": 6.5,
  "CAT.7 S/FTP 4x2xAWG23": 7.8,
};

/** Catalog lines as a supplier lists them, with the weight and article number around the diameter. */
export const CATALOG_LINES = Object.entries(CATALOG).map(([type, diameter], index) => ({
  articleNo: `C-${String(4100 + index * 7)}`,
  type,
  outerDiameterMm: diameter,
  weightKgPerKm: Math.round(diameter ** 2 * 1.6),
}));

export const TRAYS: Tray[] = [60, 85].flatMap((sideHeight) =>
  [100, 150, 200, 300, 400, 500, 600].map((nominalWidth) => ({
    designation: `KR ${sideHeight}.${nominalWidth}`,
    nominalWidth,
    sideHeight,
    innerWidth: nominalWidth - 4,
    usableHeight: sideHeight - 6,
  })),
);

const to = (de: string, en: string): Text => ({ de, en });
const revB = (type: string): Text => ({
  de: `Rev. B vom 14.10.2026: Querschnitt erhöht, neuer Typ ${type}`,
  en: `Rev. B of 14 Oct 2026: cross-section increased, new type ${type}`,
});

export const CABLES: Cable[] = [
  { id: "K-201", type: "NYM-J 5x2.5", to: to("Büro 2.12, Steckdosen", "Office 2.12, sockets"), route: ["KR-1", "KR-2"], count: 1 },
  { id: "K-202", type: "NYM-J 5x2.5", to: to("Büro 2.13, Steckdosen", "Office 2.13, sockets"), route: ["KR-1", "KR-2"], count: 1 },
  { id: "K-203", type: "NYM-J 3x1.5", to: to("Flurbeleuchtung 2. OG", "Corridor lighting 2nd floor"), route: ["KR-2"], count: 1 },
  { id: "K-204", type: "NYM-J 5x4", to: to("Teeküche 2.15", "Kitchenette 2.15"), route: ["KR-1", "KR-2"], count: 1 },
  { id: "K-205", type: "NYM-J 5x6", to: to("UV-2.2", "Sub-distribution UV-2.2"), route: ["KR-1", "KR-2"], count: 1, note: revB("NYM-J 5x10") },
  { id: "K-206", type: "NYY-J 5x16", to: to("UV-2.3", "Sub-distribution UV-2.3"), route: ["KR-1", "KR-2", "KR-3"], count: 1 },
  { id: "K-207", type: "NYM-J 3x2.5", to: to("Besprechung 2.20, Steckdosenkreise", "Meeting room 2.20, socket circuits"), route: ["KR-2"], count: 4 },
  { id: "K-208", type: "NYM-J 5x1.5", to: to("Sonnenschutz Fassade Ost", "Sun shading, east facade"), route: ["KR-2"], count: 2 },
  { id: "K-209", type: "NYY-J 5x10", to: to("Lüftungsgerät RLT-02", "Air handling unit AHU-02"), route: ["KR-1", "KR-2", "KR-3"], count: 1 },
  { id: "K-210", type: "NYM-J 5x2.5", to: to("Büro 2.14, Steckdosen", "Office 2.14, sockets"), route: ["KR-2"], count: 1, status: "cancelled" },
  { id: "K-211", type: "NHXH-J 3x1.5 E30", to: to("Sicherheitsbeleuchtung 2. OG", "Emergency lighting 2nd floor"), route: ["KR-1", "KR-2"], count: 1 },
  { id: "K-212", type: "J-Y(St)Y 2x2x0.8", to: to("Brandmelder Linie 4", "Fire detector loop 4"), route: ["KR-2"], count: 6 },
  { id: "K-213", type: "CAT.7 S/FTP 4x2xAWG23", to: to("Datenanschlüsse Büros 2.12–2.19", "Data outlets offices 2.12–2.19"), route: ["KR-1", "KR-2"], count: 24 },
  { id: "K-214", type: "NYM-J 5x1.5", to: to("Büro 2.04, Steckdosen", "Office 2.04, sockets"), route: ["KR-1"], count: 1 },
  { id: "K-215", type: "NYY-J 5x4", to: to("Außenbeleuchtung Dachterrasse", "Outdoor lighting roof terrace"), route: ["KR-2", "KR-3"], count: 1 },
  { id: "K-216", type: "NYM-J 3x1.5", to: to("Flurbeleuchtung Treppenhaus 2", "Lighting staircase 2"), route: ["KR-3"], count: 1 },
  { id: "K-217", type: "NYY-J 5x25", to: to("UV-3.1 (3. OG)", "Sub-distribution UV-3.1 (3rd floor)"), route: ["KR-1"], count: 1 },
  { id: "K-218", type: "NYM-J 5x2.5", to: to("Büros 2.16–2.18, Steckdosen", "Offices 2.16–2.18, sockets"), route: ["KR-1", "KR-2"], count: 3 },
  { id: "K-219", type: "NHXH-J 5x2.5 E30", to: to("RWA-Zentrale", "Smoke vent control panel"), route: ["KR-2"], count: 1 },
  { id: "K-220", type: "J-Y(St)Y 4x2x0.8", to: to("ELA-Lautsprecher", "Public address speakers"), route: ["KR-2", "KR-3"], count: 2 },
  { id: "K-221", type: "NYM-J 3x2.5", to: to("Kopierraum 2.19", "Copy room 2.19"), route: ["KR-2"], count: 1, status: "cancelled" },
  { id: "K-222", type: "NYY-J 5x6", to: to("USV Serverraum 2.21", "UPS server room 2.21"), route: ["KR-1", "KR-2"], count: 1 },
  { id: "K-223", type: "NYM-J 3x1.5", to: to("Beleuchtung Büros 2.12–2.19", "Lighting offices 2.12–2.19"), route: ["KR-2"], count: 2 },
  { id: "K-224", type: "NYM-J 5x2.5", to: to("Büro 2.30, Steckdosen", "Office 2.30, sockets"), route: ["KR-3"], count: 1 },
  { id: "K-225", type: "NYM-J 5x4", to: to("Teeküche 2.05", "Kitchenette 2.05"), route: ["KR-1"], count: 1 },
  { id: "K-226", type: "NYM-J 3x1.5", to: to("Beleuchtung Büros 2.01–2.08", "Lighting offices 2.01–2.08"), route: ["KR-1"], count: 2 },
  { id: "K-227", type: "NYM-J 5x16", to: to("Wallbox Tiefgarage (Steigschacht)", "Wallbox car park (riser)"), route: ["KR-1"], count: 1 },
  { id: "K-228", type: "NYY-J 5x2.5", to: to("Dachventilator DV-3", "Roof fan RF-3"), route: ["KR-3"], count: 1 },
  { id: "K-229", type: "NYY-J 5x25", to: to("Kältemaschine KM-1 (Dach)", "Chiller CH-1 (roof)"), route: ["KR-3"], count: 2 },
  { id: "K-230", type: "NYY-J 5x16", to: to("Ladestationen Dachparkdeck", "Charging points roof car park"), route: ["KR-3"], count: 3 },
  { id: "K-301", type: "NYM-J 5x2.5", to: to("Bestandsbüros 2.31–2.34, Steckdosen", "Existing offices 2.31–2.34, sockets"), route: ["KR-3"], count: 4, status: "existing" },
  { id: "K-302", type: "NYY-J 5x10", to: to("Alte Klimazentrale", "Old air-conditioning plant"), route: ["KR-3"], count: 1, status: "removed" },
  { id: "K-303", type: "NYM-J 3x1.5", to: to("Bestandsbeleuchtung Flur Ost", "Existing lighting east corridor"), route: ["KR-3"], count: 3, status: "existing" },
  { id: "K-304", type: "NYY-J 5x16", to: to("UV-2.4 (Bestand)", "Sub-distribution UV-2.4 (existing)"), route: ["KR-3"], count: 1, status: "existing" },
  { id: "K-305", type: "NYY-J 5x25", to: to("Aufzug A2 (Bestand)", "Lift A2 (existing)"), route: ["KR-3"], count: 1, status: "existing" },
  { id: "K-306", type: "NYY-J 5x16", to: to("Alte Küche 2.40", "Old kitchen 2.40"), route: ["KR-3"], count: 2, status: "removed" },
];

const EXCLUDED_TYPE = /E30|J-Y\(St\)Y|CAT\./u;

/** The type a cable is laid in: a revision note replaces the listed type. */
export const laidType = (cable: Cable) => /(N[A-Z]+-J [\dx.]+(?: E30)?)$/u.exec(cable.note?.en ?? "")?.[1] ?? cable.type;

export const area = (type: string) => (Math.PI / 4) * CATALOG[type]! ** 2;

/** The cables in a route's power tray: laid or remaining, not telecom and not E30. */
export const powerCables = (route: string) =>
  CABLES.filter((cable) => cable.route.includes(route) && (cable.status ?? "new") !== "cancelled" && cable.status !== "removed" && !EXCLUDED_TYPE.test(cable.type));

/** Trays a route permits, narrowest first and, at equal width, the lower side height first. */
export const permittedTrays = (route: Route) =>
  TRAYS.filter((tray) => route.sideHeights.includes(tray.sideHeight) && tray.nominalWidth <= (route.maxWidth ?? Infinity)).sort(
    (a, b) => a.nominalWidth - b.nominalWidth || a.sideHeight - b.sideHeight,
  );

export const solve = (route: Route, cables = powerCables(route.id), trays = permittedTrays(route)) => {
  const count = cables.reduce((sum, cable) => sum + cable.count, 0);
  const crossSection = cables.reduce((sum, cable) => sum + cable.count * area(laidType(cable)), 0);
  const fill = (tray: Tray) => (crossSection * route.reserve) / (tray.innerWidth * tray.usableHeight);
  const tray = trays.find((candidate) => fill(candidate) <= MAX_FILL)!;
  return { count, crossSection, tray: tray.designation, fillPercent: fill(tray) * 100 };
};

export const GOLD = Object.fromEntries(
  ROUTES.map((route) => {
    const raw = solve(route);
    return [route.id, { ...raw, crossSection: roundHalfUp(raw.crossSection), fillPercent: roundHalfUp(raw.fillPercent, 1) }];
  }),
);

export const RULES: Record<Lang, string> = {
  de: `PLANUNGSGRUNDSÄTZE KABELTRAGSYSTEME – Bürogebäude Lindenallee 4, 2. OG (Stand Rev. B)

1. Trassen und Rinnen
1.1 Eine Trasse (KR-1, KR-2, KR-3) besteht aus einer Starkstromrinne und einer parallel geführten Fernmelderinne. Die Kabelliste nennt die Trassen, die ein Kabel durchläuft.
1.2 Starkstrom- und Fernmeldekabel (Daten, Telefon, Brandmeldeanlage, ELA) werden getrennt geführt: Fernmeldekabel liegen ausschließlich in der Fernmelderinne.
1.3 Kabel mit Funktionserhalt (E30) werden auf einem eigenen, geprüften Funktionserhalt-Tragsystem geführt, nicht in der Starkstromrinne.
1.4 Kabel mit dem Status „entfällt“ werden nicht verlegt. Kabel mit dem Status „Bestand, verbleibt“ werden in die neue Starkstromrinne umgelegt und zählen mit; Kabel mit dem Status „Bestand, Rückbau“ werden entfernt. Die Spalte „Anzahl“ nennt, wie viele gleiche Kabel parallel verlegt werden.
1.5 Revisionsvermerke in der Kabelliste gehen der Spalte „Typ“ vor.

2. Füllgrad
2.1 Kabelquerschnitt eines Kabels: π/4 × D², D = Außendurchmesser laut Kabelkatalog.
2.2 Füllgrad = Summe der Kabelquerschnitte ÷ (lichte Innenbreite × nutzbare Füllhöhe) der Rinne, laut Rinnenkatalog.
2.3 Für spätere Nachbelegung sind 30 % Reserve vorzuhalten: Der Füllgrad wird mit dem 1,3-Fachen der Summe der Kabelquerschnitte ermittelt. Für die Haupttrasse KR-1 gelten 50 % Reserve (1,5-Fache).
2.4 Der Füllgrad einschließlich Reserve darf 40 % nicht überschreiten.
2.5 Gewählt wird je Trasse die schmalste Rinne, die die Vorgaben der Trasse nach Abschnitt 3 und 2.4 einhält; bei gleicher Breite die mit der niedrigeren Seitenhöhe.

3. Vorgaben je Trasse
3.1 KR-1 (Technikflur 2. OG, Achse A/1 bis B/3): Rinnen mit 60 oder 85 mm Seitenhöhe.
3.2 KR-2 (Flur 2. OG, Achse B/3 bis B/9): Unter der Abhangdecke stehen 90 mm Einbauhöhe zur Verfügung; zulässig sind nur Rinnen mit 60 mm Seitenhöhe.
3.3 KR-3 (Flur Ost 2. OG, Achse B/9 bis D/9): Rinnen mit 60 oder 85 mm Seitenhöhe; wegen der parallel geführten Sprinklerleitung höchstens 300 mm Nennbreite.
3.4 Abgänge zu den Räumen erfolgen über die gesamte Länge einer Trasse; für die Bemessung gilt der volle Querschnitt aller Kabel, die die Trasse durchlaufen.

4. Rundung
4.1 Summe der Kabelquerschnitte in mm², auf ganze mm² gerundet; Füllgrad in Prozent mit einer Nachkommastelle. Gerundet wird erst das Endergebnis.`,
  en: `DESIGN RULES FOR CABLE SUPPORT SYSTEMS – office building Lindenallee 4, 2nd floor (as of Rev. B)

1. Routes and trays
1.1 A route (KR-1, KR-2, KR-3) consists of a power tray and a parallel telecom tray. The cable list names the routes a cable runs through.
1.2 Power and telecom cables (data, telephone, fire alarm, public address) are run separately: telecom cables lie only in the telecom tray.
1.3 Cables with circuit integrity (E30) run on their own tested circuit-integrity support system, not in the power tray.
1.4 Cables with the status "cancelled" are not laid. Cables with the status "existing, remains" are moved into the new power tray and count; cables with the status "existing, removed" are taken out. The column "count" gives how many identical cables are laid in parallel.
1.5 Revision notes in the cable list take precedence over the column "type".

2. Fill ratio
2.1 Cross-section of a cable: π/4 × D², D = outer diameter from the cable catalog.
2.2 Fill ratio = sum of cable cross-sections ÷ (inner width × usable fill height) of the tray, from the tray catalog.
2.3 Keep a 30 % reserve for future cables: the fill ratio is computed with 1.3 times the sum of cable cross-sections. The main route KR-1 keeps a 50 % reserve (1.5 times).
2.4 The fill ratio including the reserve must not exceed 40 %.
2.5 For each route, choose the narrowest tray that meets the route's constraints from section 3 and 2.4; at equal width, the one with the lower side height.

3. Constraints per route
3.1 KR-1 (plant corridor 2nd floor, axis A/1 to B/3): trays with 60 or 85 mm side height.
3.2 KR-2 (corridor 2nd floor, axis B/3 to B/9): below the suspended ceiling there are 90 mm of installation height; only trays with a 60 mm side height are permitted.
3.3 KR-3 (east corridor 2nd floor, axis B/9 to D/9): trays with 60 or 85 mm side height; because of the parallel sprinkler pipe, at most 300 mm nominal width.
3.4 Branches to the rooms run along the whole length of a route; the design uses the full cross-section of all cables running through the route.

4. Rounding
4.1 Sum of cable cross-sections in mm², rounded to whole mm²; fill ratio in percent with one decimal. Round only the final result.`,
};
