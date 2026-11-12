/**
 * Wall areas for an interior paint job on one office floor: rooms, an opening schedule, tiled
 * areas, and explicit measurement rules, with every room's area by construction.
 */
import type { Lang } from "../../../src/types";
import { roundHalfUp } from "../calculator";
import { fmt } from "../shared";

type Text = Record<Lang, string>;
export type OpeningType = { id: string; name: Text; width: number; height: number; reveal: number };
export type Room = {
  id: string;
  name: Text;
  walls: number[];
  clearHeight: number;
  suspendedCeiling?: number;
  openings: Array<{ type: string; count: number }>;
  tiles?: Array<{ width: number; height: number; name: Text }>;
};

export const THRESHOLD = 2.5;

export const OPENINGS: OpeningType[] = [
  { id: "F1", name: { de: "Fenster, einflügelig", en: "Window, single casement" }, width: 1.26, height: 1.385, reveal: 0.175 },
  { id: "F2", name: { de: "Fenster, zweiflügelig", en: "Window, double casement" }, width: 2.51, height: 1.385, reveal: 0.175 },
  { id: "F3", name: { de: "Fenstertür", en: "French window" }, width: 1.135, height: 2.26, reveal: 0.175 },
  { id: "F4", name: { de: "Fensterband Teeküche", en: "Ribbon window kitchenette" }, width: 2, height: 1.25, reveal: 0.175 },
  { id: "T1", name: { de: "Tür mit Umfassungszarge", en: "Door with wrap-around frame" }, width: 1.01, height: 2.135, reveal: 0 },
  { id: "T2", name: { de: "Doppeltür mit Umfassungszarge", en: "Double door with wrap-around frame" }, width: 2.01, height: 2.135, reveal: 0 },
  { id: "T3", name: { de: "Tür mit Umfassungszarge, Überbreite", en: "Door with wrap-around frame, extra wide" }, width: 1.26, height: 2.135, reveal: 0 },
  { id: "G1", name: { de: "Glastrennwand-Element, Rahmen ohne Laibung", en: "Glazed partition element, frame without reveal" }, width: 3.51, height: 2.4, reveal: 0 },
  { id: "D1", name: { de: "Wanddurchgang ohne Tür, Laibung verputzt", en: "Wall passage without door, plastered reveal" }, width: 1.51, height: 2.26, reveal: 0.24 },
];

const name = (de: string, en: string): Text => ({ de, en });

export const ROOMS: Room[] = [
  {
    id: "3.01",
    name: name("Flur", "Corridor"),
    walls: [12.4, 2.1, 12.4, 2.1],
    clearHeight: 2.75,
    suspendedCeiling: 2.5,
    openings: [
      { type: "T1", count: 4 },
      { type: "T2", count: 1 },
      { type: "G1", count: 1 },
      { type: "D1", count: 1 },
    ],
  },
  { id: "3.02", name: name("Büro", "Office"), walls: [4.2, 5.1, 4.2, 5.1], clearHeight: 2.75, openings: [{ type: "F2", count: 1 }, { type: "F1", count: 1 }, { type: "T1", count: 1 }] },
  { id: "3.03", name: name("Büro", "Office"), walls: [3.6, 5.1, 3.6, 5.1], clearHeight: 2.75, suspendedCeiling: 2.6, openings: [{ type: "F2", count: 1 }, { type: "T1", count: 1 }] },
  {
    id: "3.04",
    name: name("Besprechung", "Meeting room"),
    walls: [6.31, 5.1, 6.31, 5.1],
    clearHeight: 2.75,
    suspendedCeiling: 2.6,
    openings: [
      { type: "F2", count: 2 },
      { type: "F3", count: 1 },
      { type: "G1", count: 1 },
      { type: "T2", count: 1 },
    ],
  },
  {
    id: "3.05",
    name: name("Teeküche", "Kitchenette"),
    walls: [3, 2.8, 3, 2.8],
    clearHeight: 2.75,
    openings: [{ type: "F4", count: 1 }, { type: "T1", count: 1 }],
    tiles: [{ width: 2.4, height: 0.6, name: name("Fliesenspiegel Küchenzeile", "Tiled splashback kitchen unit") }],
  },
  { id: "3.06", name: name("Archiv", "Archive"), walls: [4, 3.2, 4, 3.2], clearHeight: 2.75, openings: [{ type: "T3", count: 1 }] },
];

export type Options = { threshold?: number; inclusive?: boolean; reveals?: boolean; ceiling?: boolean; tiles?: boolean };

/** A room's unrounded paint area in m² under the rules, or under a mistaken reading of them. */
export const paintArea = (room: Room, options: Options = {}) => {
  const height = (options.ceiling ?? true) ? (room.suspendedCeiling ?? room.clearHeight) : room.clearHeight;
  let area = room.walls.reduce((sum, length) => sum + length, 0) * height;
  for (const { type, count } of room.openings) {
    const opening = OPENINGS.find((candidate) => candidate.id === type)!;
    const size = opening.width * opening.height;
    const deducted = (options.inclusive ?? true) ? size > (options.threshold ?? THRESHOLD) : size >= (options.threshold ?? THRESHOLD);
    if (!deducted) continue;
    area -= count * size;
    if (options.reveals ?? true) area += count * opening.reveal * (2 * opening.height + opening.width);
  }
  if (options.tiles ?? true) for (const tile of room.tiles ?? []) area -= tile.width * tile.height;
  return area;
};

export const GOLD = (() => {
  const rooms = Object.fromEntries(ROOMS.map((room) => [room.id, roundHalfUp(paintArea(room), 2)]));
  return { rooms, total: roundHalfUp(Object.values(rooms).reduce((sum, area) => sum + area, 0), 2) };
})();

export const rules = (lang: Lang) =>
  lang === "de"
    ? `AUFMASSREGELN WANDANSTRICH – Bürogebäude Hafenstraße 18, 3. OG

1. Gemessen werden die Wandflächen jedes Raumes, die gestrichen werden.
2. Wandhöhe: bis Unterkante Abhangdecke, wo eine vorhanden ist; sonst die lichte Raumhöhe.
3. Brutto-Wandfläche = Summe der Wandlängen des Raumes × Wandhöhe.
4. Öffnungen (Fenster, Türen, Glaselemente, Durchgänge) bis einschließlich ${fmt(lang, THRESHOLD, 2)} m² Einzelgröße werden übermessen, also nicht abgezogen. Öffnungen über ${fmt(lang, THRESHOLD, 2)} m² Einzelgröße werden abgezogen. Maßgebend sind Breite × Höhe laut Öffnungsliste.
5. Laibungen abgezogener Öffnungen werden hinzugerechnet: Laibungstiefe × (2 × Höhe + Breite). Laibungen übermessener Öffnungen und Öffnungen mit Laibungstiefe 0 bleiben unberücksichtigt.
6. Geflieste Wandflächen werden nicht gestrichen und unabhängig von ihrer Größe abgezogen.
7. Die Fläche je Raum wird in m² auf zwei Nachkommastellen gerundet; die Gesamtfläche ist die Summe der gerundeten Raumflächen.`
    : `MEASUREMENT RULES FOR WALL PAINTING – office building Hafenstraße 18, 3rd floor

1. Measure the wall areas of each room that are painted.
2. Wall height: up to the underside of the suspended ceiling where there is one; otherwise the clear room height.
3. Gross wall area = sum of the room's wall lengths × wall height.
4. Openings (windows, doors, glazed elements, passages) up to and including ${fmt(lang, THRESHOLD, 2)} m² each are measured over, i.e. not deducted. Openings over ${fmt(lang, THRESHOLD, 2)} m² each are deducted. Width × height from the opening schedule govern.
5. Reveals of deducted openings are added: reveal depth × (2 × height + width). Reveals of openings measured over and openings with reveal depth 0 are not counted.
6. Tiled wall areas are not painted and are deducted regardless of their size.
7. Round the area of each room in m² to two decimals; the total area is the sum of the rounded room areas.`;
