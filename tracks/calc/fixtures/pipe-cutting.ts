/**
 * A cut list for stainless press-fit pipe from an isometric: pieces per riser, generated bar by bar
 * so that each diameter packs into a known number of 6 m bars with less than one bar of total
 * offcut. That count is therefore also the lower bound, so it is optimal by construction.
 */
import type { Lang } from "../../../src/types";

type Text = Record<Lang, string>;
export type Strand = { id: string; name: Text; cancelled?: boolean };
export type Piece = { id: string; strand: string; dn: number; length: number };

export const BAR = 6000;
export const KERF = 4;
export const DIAMETERS = [15, 22];

let seed = 90_10;
const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

export const STRANDS: Strand[] = [
  { id: "ST-1", name: { de: "Strang 1, Achse A/2", en: "Riser 1, axis A/2" } },
  { id: "ST-2", name: { de: "Strang 2, Achse A/6", en: "Riser 2, axis A/6" } },
  { id: "ST-3", name: { de: "Strang 3, Achse C/2", en: "Riser 3, axis C/2" } },
  { id: "ST-4", name: { de: "Strang 4, Achse C/6", en: "Riser 4, axis C/6" } },
  { id: "ST-5", name: { de: "Strang 5, Achse D/4 (entfällt laut Rev. C)", en: "Riser 5, axis D/4 (cancelled per Rev. C)" }, cancelled: true },
  { id: "ST-6", name: { de: "Verteilung Kellerdecke", en: "Distribution below the basement ceiling" } },
];

/** Bars per diameter, each filled to within a few millimetres. */
const BARS: Record<number, number> = { 15: 8, 22: 6 };

const fill = () => {
  const pieces = between(3, 5);
  const waste = between(1, 9) * 5;
  const usable = BAR - waste - pieces * KERF;
  const weights = Array.from({ length: pieces }, () => 0.35 + random());
  const scale = usable / weights.reduce((sum, weight) => sum + weight, 0);
  const lengths = weights.slice(0, -1).map((weight) => Math.round((weight * scale) / 5) * 5);
  return [...lengths, usable - lengths.reduce((sum, length) => sum + length, 0)];
};

const live = STRANDS.filter((strand) => !strand.cancelled);
/** The constructed bars per diameter: the reference plan. */
export const PLAN: Record<number, number[][]> = Object.fromEntries(DIAMETERS.map((dn) => [dn, Array.from({ length: BARS[dn]! }, fill)]));

const counters = new Map<string, number>();
const pieceId = (strand: string) => {
  const next = (counters.get(strand) ?? 0) + 1;
  counters.set(strand, next);
  return `${strand.replace("ST-", "S")}-${String(next).padStart(2, "0")}`;
};
const assigned = DIAMETERS.flatMap((dn) => PLAN[dn]!.flat().map((length) => ({ dn, length, strand: live[between(0, live.length - 1)]!.id })));
const cancelledPieces = [
  { dn: 15, length: 2140, strand: "ST-5" },
  { dn: 15, length: 1385, strand: "ST-5" },
  { dn: 22, length: 2960, strand: "ST-5" },
  { dn: 22, length: 875, strand: "ST-5" },
];
export const PIECES: Piece[] = [...assigned, ...cancelledPieces]
  .map((piece) => ({ ...piece, order: random() }))
  .sort((a, b) => a.strand.localeCompare(b.strand) || a.order - b.order)
  .map(({ dn, length, strand }) => ({ id: pieceId(strand), strand, dn, length }));

export const OPTIMUM: Record<number, number> = Object.fromEntries(DIAMETERS.map((dn) => [dn, PLAN[dn]!.length]));

/** Lengths each diameter needs: the pieces of strands that are not cancelled. */
export const required = (dn: number) =>
  PIECES.filter((piece) => piece.dn === dn && !STRANDS.find((strand) => strand.id === piece.strand)!.cancelled).map((piece) => piece.length);

export const RULES: Record<Lang, string> = {
  de: `ZUSCHNITTREGELN EDELSTAHL-PRESSROHR – Wohnanlage Birkenhof, Trinkwasser

1. Das Rohr wird in Stangen zu ${BAR} mm geliefert (Edelstahl 1.4521, DN 15 = 15 mm, DN 22 = 22 mm Außendurchmesser).
2. Jedes Stück verbraucht seine Länge laut Stückliste plus ${KERF} mm Schnittzugabe (Sägeschnitt und Entgraten). Die Summe aus Stücklängen und Schnittzugaben einer Stange darf ${BAR} mm nicht überschreiten.
3. Ein Stück wird immer aus einer einzigen Stange geschnitten; Stücke werden nicht gestoßen. Reststücke werden nicht weiterverwendet.
4. Stücke von Strängen, die laut Strangliste entfallen, werden nicht geschnitten.
5. Gesucht ist je Durchmesser ein Schnittplan mit der kleinstmöglichen Zahl an Stangen.`,
  en: `CUTTING RULES FOR STAINLESS PRESS-FIT PIPE – residential complex Birkenhof, drinking water

1. Pipe is delivered in bars of ${BAR} mm (stainless steel 1.4521, DN 15 = 15 mm, DN 22 = 22 mm outer diameter).
2. Each piece uses its length from the cut list plus ${KERF} mm cutting allowance (saw cut and deburring). The sum of piece lengths and cutting allowances on a bar must not exceed ${BAR} mm.
3. A piece is always cut from a single bar; pieces are not joined. Offcuts are not reused.
4. Pieces of risers that are cancelled according to the riser list are not cut.
5. Find, for each diameter, a cutting plan with the smallest possible number of bars.`,
};
