/**
 * The project every plans task reads: "Umbau Bürogebäude Lindenstraße 12", a synthetic two-storey
 * office building with a basement. Each floor holds its rooms (clear interior polygons, metres, y
 * north), openings, electrical devices and cable trays; the basement holds the heating pipes. Every
 * quantity a task asks for is computed here from this data, so the ground truth is known by
 * construction and the sheets are drawn from the same numbers.
 */
import type { Pt, Text } from "./drawing";

export type Room = {
  id: string;
  name: Text;
  poly: Pt[];
  /** Clear height: finished floor to ceiling, or to a suspended ceiling. */
  height: number;
  suspended?: boolean;
  /** Electrical devices: "E1" one symbol, "E2x3" one symbol marked 3×, "E5*4" four symbols, "~E1" existing. */
  devices?: string;
  /** Where devices go when the room is not a rectangle: [x0, y0, x1, y1]. */
  place?: readonly [number, number, number, number];
  /** Where the room stamp goes when not in the middle of the placement box. */
  stamp?: Pt;
};

export type Opening = {
  kind: "door" | "window";
  /** The wall's direction, its centre along it, and its two faces across it. */
  along: "x" | "y";
  at: number;
  faces: readonly [number, number];
  width: number;
  height: number;
  sill?: number;
  /** Rooms whose walls hold the opening. */
  rooms: string[];
  /** A door opens toward the higher (+1) or lower (−1) face; its hinge is at the lower (−1) or higher (+1) end. */
  swing?: 1 | -1;
  hinge?: 1 | -1;
};

/** A straight run of cable tray between two points as dimensioned; width in mm. */
export type Tray = { a: Pt; b: Pt; size: 200 | 300; existing?: boolean };

export type Floor = {
  id: "UG" | "EG" | "OG";
  name: Text;
  /** Finished floor level in m, ±0,00 = finished floor of the ground floor. */
  level: number;
  rooms: Room[];
  openings: Opening[];
  trays: Tray[];
  /** Underside of the cable trays above this floor's finished floor. */
  trayHeight?: number;
  /** Points drawn away from their dimensioned position (not to scale), by "x,y". */
  drawn?: Record<string, Pt>;
};

/** The structural axis grid every installation plan is dimensioned from. */
export const AXES = {
  x: [
    { name: "1", at: 0.15 },
    { name: "2", at: 5.4 },
    { name: "3", at: 10.65 },
    { name: "4", at: 15.9 },
    { name: "5", at: 21.15 },
  ],
  y: [
    { name: "A", at: 0.15 },
    { name: "B", at: 5.15 },
    { name: "C", at: 6.9 },
    { name: "D", at: 11.65 },
  ],
} as const;

export const pointKey = ([x, y]: Pt) => `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`;

/** Where a point is drawn: its dimensioned position unless the drawing departs from it. */
export const drawnAt = (drawn: Record<string, Pt> | undefined, p: Pt): Pt => drawn?.[pointKey(p)] ?? p;

export const SIZE: Pt = [21.3, 11.8];
export const EXTERIOR = 0.3;
export const CODES = ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9"] as const;
export type Code = (typeof CODES)[number];

const box = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

const SOUTH = [0, 0.3] as const;
const NORTH = [11.5, 11.8] as const;
const WEST = [0, 0.3] as const;
const EAST = [21, 21.3] as const;
const CORRIDOR_S = [5.05, 5.225] as const;
const CORRIDOR_N = [6.825, 7] as const;

const door = (along: "x" | "y", at: number, faces: readonly [number, number], width: number, height: number, rooms: string[], swing: 1 | -1, hinge: 1 | -1 = -1): Opening => ({
  kind: "door",
  along,
  at,
  faces,
  width,
  height,
  rooms,
  swing,
  hinge,
});
const win = (along: "x" | "y", at: number, faces: readonly [number, number], width: number, height: number, sill: number, room: string): Opening => ({
  kind: "window",
  along,
  at,
  faces,
  width,
  height,
  sill,
  rooms: [room],
});

const room = (id: string, de: string, en: string, poly: Pt[], height: number, devices = "", extra: Partial<Room> = {}): Room => ({
  id,
  name: { de, en },
  poly,
  height,
  devices,
  ...extra,
});

const EG: Floor = {
  id: "EG",
  name: { de: "Erdgeschoss", en: "Ground floor" },
  level: 0,
  trayHeight: 2.85,
  rooms: [
    room("0.01", "Büro", "Office", box(0.3, 0.3, 4.3, 5.05), 2.8, "E3 E1 E2 E2 E2 E9 E9 E5*4 E7 ~E1 ~E5"),
    room("0.02", "Büro", "Office", box(4.415, 0.3, 8.175, 5.05), 2.8, "E3 E1 E1 E2 E2 E9x2 E5*4 E7"),
    room("0.03", "Besprechung", "Meeting room", box(8.29, 0.3, 13.55, 5.05), 2.55, "E4 E4 E1 E1 E2 E2 E2x3 E9 E9 E5*6 E6 E7", { suspended: true }),
    room("0.04", "Teeküche", "Kitchenette", box(13.665, 0.3, 16.175, 5.05), 2.8, "E3 E2 E2 E2 E1 E5 E5 E7"),
    room("0.05", "Büro", "Office", box(16.29, 0.3, 21, 5.05), 2.8, "E3 E1 E2 E2 E2 E9 E9 E5*4 E7 ~E2 ~E2"),
    room("0.06", "WC Damen", "WC women", box(0.3, 7, 2.2, 11.5), 2.8, "E3 E1 E5 E8"),
    room("0.07", "WC Herren", "WC men", box(2.315, 7, 4.215, 11.5), 2.8, "E3 E1 E5 E8"),
    room("0.08", "Technik", "Plant room", box(4.33, 7, 7.33, 11.5), 2.8, "E3 E1 E1 E2x2 E5 E5 E6 E7"),
    room("0.09", "Lager", "Storage", box(7.445, 9.115, 9.945, 11.5), 2.8, "E3 E1 E5 ~E5", { stamp: [8.4, 10.85] }),
    room(
      "0.10",
      "Großraumbüro",
      "Open-plan office",
      [
        [7.445, 7],
        [16, 7],
        [16, 11.5],
        [10.06, 11.5],
        [10.06, 9],
        [7.445, 9],
      ],
      2.8,
      "E4 E4 E3 E1 E1 E2 E2 E2 E2 E2x2 E9 E9 E9 E9x2 E5*8 E6 E7 E7",
      { place: [10.06, 7, 16, 11.5] },
    ),
    room("0.11", "Büro", "Office", box(16.115, 7, 21, 11.5), 2.8, "E3 E1 E2 E2 E2 E9 E9 E5*4 E7"),
    room("0.12", "Flur", "Corridor", box(0.3, 5.225, 21, 6.825), 2.4, "E4 E4 E4 E1 E1 E5*6 E6 E6 E7 E7 E7 E8 E8 ~E5 ~E5", { suspended: true, place: [0.3, 5.225, 21, 5.75], stamp: [2.6, 5.5] }),
  ],
  openings: [
    win("x", 2.3, SOUTH, 2.01, 1.51, 0.9, "0.01"),
    win("y", 2.675, WEST, 1.26, 1.51, 0.9, "0.01"),
    win("x", 6.295, SOUTH, 1.635, 1.51, 0.9, "0.02"),
    win("x", 9.92, SOUTH, 2.01, 1.51, 0.9, "0.03"),
    win("x", 11.92, SOUTH, 2.01, 1.51, 0.9, "0.03"),
    win("x", 14.92, SOUTH, 1.01, 1.26, 1.1, "0.04"),
    win("x", 18.645, SOUTH, 1.76, 1.51, 0.9, "0.05"),
    win("y", 2.675, EAST, 1.26, 1.51, 0.9, "0.05"),
    win("x", 1.25, NORTH, 0.76, 0.76, 1.5, "0.06"),
    win("x", 3.265, NORTH, 0.76, 0.76, 1.5, "0.07"),
    win("x", 5.83, NORTH, 1.01, 1.26, 1.1, "0.08"),
    win("x", 11.7, NORTH, 2.01, 1.51, 0.9, "0.10"),
    win("x", 14.36, NORTH, 2.01, 1.51, 0.9, "0.10"),
    win("x", 18.56, NORTH, 2.01, 1.51, 0.9, "0.11"),
    win("y", 9.25, EAST, 1.26, 1.51, 0.9, "0.11"),
    door("y", 6.025, WEST, 1.26, 2.26, ["0.12"], 1),
    door("x", 3.6, CORRIDOR_S, 0.885, 2.01, ["0.01", "0.12"], -1),
    door("x", 7.5, CORRIDOR_S, 0.885, 2.01, ["0.02", "0.12"], -1),
    door("x", 12.4, CORRIDOR_S, 1.76, 2.135, ["0.03", "0.12"], -1),
    door("x", 15.4, CORRIDOR_S, 0.885, 2.01, ["0.04", "0.12"], -1),
    door("x", 17.1, CORRIDOR_S, 1.01, 2.135, ["0.05", "0.12"], -1, 1),
    door("x", 1.25, CORRIDOR_N, 0.76, 2.01, ["0.06", "0.12"], 1),
    door("x", 3.265, CORRIDOR_N, 0.76, 2.01, ["0.07", "0.12"], 1),
    door("x", 5, CORRIDOR_N, 1.01, 2.135, ["0.08", "0.12"], 1),
    door("x", 8.7, CORRIDOR_N, 1.76, 2.135, ["0.10", "0.12"], 1),
    door("x", 15.2, CORRIDOR_N, 1.01, 2.135, ["0.10", "0.12"], 1, 1),
    door("x", 8.7, [9, 9.115], 0.885, 2.01, ["0.09", "0.10"], 1),
    door("x", 16.9, CORRIDOR_N, 0.885, 2.01, ["0.11", "0.12"], 1),
  ],
  trays: [
    { a: [0.8, 6.025], b: [5.83, 6.025], size: 200 },
    { a: [5.83, 6.025], b: [13.2, 6.025], size: 300 },
    { a: [13.2, 6.025], b: [20.4, 6.025], size: 200 },
    { a: [5.83, 6.025], b: [5.83, 9.8], size: 300 },
    { a: [5.83, 9.8], b: [4.9, 9.8], size: 300 },
    { a: [10.9, 6.025], b: [10.9, 3], size: 200 },
    { a: [10.9, 3], b: [12.6, 3], size: 200 },
    { a: [13.2, 6.025], b: [13.2, 8.5], size: 200 },
    { a: [13.2, 8.5], b: [10.8, 8.5], size: 200 },
    { a: [18.5, 6.025], b: [18.5, 2.175], size: 200 },
    { a: [1, 4.6], b: [3.8, 4.6], size: 200, existing: true },
  ],
  drawn: { "18.5,2.175": [18.5, 3.025] },
};

const OG: Floor = {
  id: "OG",
  name: { de: "Obergeschoss", en: "Upper floor" },
  level: 3.3,
  trayHeight: 2.75,
  rooms: [
    room("1.01", "Büro", "Office", box(0.3, 0.3, 5, 5.05), 2.8, "E3 E1 E1 E2 E2 E2x2 E9 E9 E5*4 E7 ~E2"),
    room("1.02", "Büro", "Office", box(5.115, 0.3, 9.255, 5.05), 2.8, "E3 E1 E2 E2 E2 E9x2 E5*4 E7"),
    room("1.03", "Büro", "Office", box(9.37, 0.3, 13.55, 5.05), 2.8, "E3 E3 E1 E2 E2 E2 E9 E9 E9 E5*4 E7 ~E1 ~E9"),
    room("1.04", "Büro", "Office", box(13.665, 0.3, 17.3, 5.05), 2.8, "E3 E1 E2 E2 E9 E9 E5*3 E7"),
    room("1.05", "Büro", "Office", box(17.415, 0.3, 21, 5.05), 2.8, "E3 E1 E1 E2 E2 E9 E5*3 E8 E7"),
    room("1.06", "WC", "WC", box(0.3, 7, 2.2, 11.5), 2.8, "E3 E1 E5 E8"),
    room("1.07", "Teeküche", "Kitchenette", box(2.315, 7, 4.215, 11.5), 2.8, "E3 E2 E2x2 E1 E5 E5 E7"),
    room("1.08", "Technik", "Plant room", box(4.33, 7, 7.33, 11.5), 2.8, "E3 E1 E2x3 E5 E5 E6 E7"),
    room("1.09", "Konferenz", "Conference room", box(7.445, 7, 14, 11.5), 2.8, "E4 E4 E1 E1 E1 E2 E2x4 E9 E9 E9x3 E5*8 E6 E7 E7 ~E5 ~E5"),
    room("1.10", "Büro", "Office", box(14.115, 7, 21, 11.5), 2.8, "E4 E4 E1 E1 E2 E2 E2 E2 E2x2 E9 E9 E9 E9 E5*6 E6 E7 E7"),
    room("1.11", "Flur", "Corridor", box(0.3, 5.225, 21, 6.825), 2.4, "E4 E4 E4 E4 E1 E1 E5*6 E6 E6 E6 E7 E7 E7 E8 E8 E8 ~E1", { suspended: true, place: [0.3, 5.225, 21, 5.75], stamp: [2.6, 5.5] }),
  ],
  openings: [
    win("x", 2.65, SOUTH, 2.01, 1.51, 0.9, "1.01"),
    win("y", 2.675, WEST, 1.26, 1.51, 0.9, "1.01"),
    win("x", 7.185, SOUTH, 2.01, 1.51, 0.9, "1.02"),
    win("x", 11.46, SOUTH, 2.01, 1.51, 0.9, "1.03"),
    win("x", 15.48, SOUTH, 2.01, 1.51, 0.9, "1.04"),
    win("x", 19.2, SOUTH, 2.01, 1.51, 0.9, "1.05"),
    win("y", 2.675, EAST, 1.26, 1.51, 0.9, "1.05"),
    win("x", 1.25, NORTH, 0.76, 0.76, 1.5, "1.06"),
    win("x", 3.265, NORTH, 1.01, 1.26, 1.1, "1.07"),
    win("x", 5.83, NORTH, 1.01, 1.26, 1.1, "1.08"),
    win("x", 9.4, NORTH, 2.01, 1.51, 0.9, "1.09"),
    win("x", 12.05, NORTH, 2.01, 1.51, 0.9, "1.09"),
    win("x", 16.3, NORTH, 2.01, 1.51, 0.9, "1.10"),
    win("x", 19.3, NORTH, 2.01, 1.51, 0.9, "1.10"),
    win("y", 9.25, EAST, 1.26, 1.51, 0.9, "1.10"),
    door("x", 4.3, CORRIDOR_S, 0.885, 2.01, ["1.01", "1.11"], -1),
    door("x", 8.5, CORRIDOR_S, 0.885, 2.01, ["1.02", "1.11"], -1),
    door("x", 12.8, CORRIDOR_S, 0.885, 2.01, ["1.03", "1.11"], -1),
    door("x", 16.6, CORRIDOR_S, 0.885, 2.01, ["1.04", "1.11"], -1),
    door("x", 18.1, CORRIDOR_S, 0.885, 2.01, ["1.05", "1.11"], -1, 1),
    door("x", 1.25, CORRIDOR_N, 0.76, 2.01, ["1.06", "1.11"], 1),
    door("x", 3.265, CORRIDOR_N, 0.885, 2.01, ["1.07", "1.11"], 1),
    door("x", 5, CORRIDOR_N, 1.01, 2.135, ["1.08", "1.11"], 1),
    door("x", 8.5, CORRIDOR_N, 1.76, 2.135, ["1.09", "1.11"], 1),
    door("x", 15, CORRIDOR_N, 1.01, 2.135, ["1.10", "1.11"], 1),
  ],
  trays: [
    { a: [4.9, 9.8], b: [5.83, 9.8], size: 300 },
    { a: [5.83, 9.8], b: [5.83, 6.025], size: 300 },
    { a: [1, 6.025], b: [5.83, 6.025], size: 200 },
    { a: [5.83, 6.025], b: [17, 6.025], size: 200 },
    { a: [10.5, 6.025], b: [10.5, 8.4], size: 200 },
  ],
};

const UG: Floor = {
  id: "UG",
  name: { de: "Untergeschoss", en: "Basement" },
  level: -2.95,
  rooms: [
    room("U.01", "Keller", "Cellar", box(0.3, 0.3, 5, 5.05), 2.5),
    room("U.02", "Keller", "Cellar", box(5.115, 0.3, 10.5, 5.05), 2.5),
    room("U.03", "Werkstatt", "Workshop", box(10.615, 0.3, 16.285, 5.05), 2.5),
    room("U.04", "Keller", "Cellar", box(16.4, 0.3, 21, 5.05), 2.5),
    room("U.05", "Heizraum", "Boiler room", box(0.3, 7, 3.9, 11.5), 2.5, "", { stamp: [1.4, 8.6] }),
    room("U.06", "Hausanschluss", "Service entry", box(4.015, 7, 7.33, 11.5), 2.5),
    room("U.07", "Lager", "Storage", box(7.445, 7, 15.7, 11.5), 2.5),
    room("U.08", "Keller", "Cellar", box(15.815, 7, 21, 11.5), 2.5),
    room("U.09", "Flur", "Corridor", box(0.3, 5.225, 21, 6.825), 2.5, "", { stamp: [1.4, 5.75] }),
  ],
  openings: [
    door("x", 4.4, CORRIDOR_S, 0.885, 2.01, ["U.01", "U.09"], -1),
    door("x", 7.8, CORRIDOR_S, 0.885, 2.01, ["U.02", "U.09"], -1),
    door("x", 12, CORRIDOR_S, 1.01, 2.01, ["U.03", "U.09"], -1),
    door("x", 17.2, CORRIDOR_S, 0.885, 2.01, ["U.04", "U.09"], -1, 1),
    door("x", 1.6, CORRIDOR_N, 1.01, 2.01, ["U.05", "U.09"], 1),
    door("x", 6.6, CORRIDOR_N, 0.885, 2.01, ["U.06", "U.09"], 1, 1),
    door("x", 11.2, CORRIDOR_N, 1.01, 2.01, ["U.07", "U.09"], 1),
    door("x", 17.6, CORRIDOR_N, 0.885, 2.01, ["U.08", "U.09"], 1),
  ],
  trays: [],
};

export const FLOORS = { UG, EG, OG } as const;

/** One device symbol on a plan: its legend code, the count marked beside it, and whether it exists already. */
export type Device = { code: Code; count: number; existing: boolean };

export const devicesOf = (room: Room): Device[] =>
  (room.devices ?? "")
    .split(/\s+/u)
    .filter(Boolean)
    .flatMap((token) => {
      const match = /^(~?)(E\d)(?:x(\d+))?(?:\*(\d+))?$/u.exec(token);
      if (!match) throw new Error(`Bad device token ${token}`);
      const device = { code: match[2] as Code, count: Number(match[3] ?? 1), existing: match[1] === "~" };
      return Array.from({ length: Number(match[4] ?? 1) }, () => device);
    });

/** New devices of a room by legend code: what the room's symbols count, multipliers included. */
export const deviceCounts = (room: Room) => {
  const counts = Object.fromEntries(CODES.map((code) => [code, 0])) as Record<Code, number>;
  for (const device of devicesOf(room)) if (!device.existing) counts[device.code] += device.count;
  return counts;
};

export const area = (poly: readonly Pt[]) =>
  Math.abs(poly.reduce((sum, [x, y], index) => {
    const [nx, ny] = poly[(index + 1) % poly.length]!;
    return sum + x * ny - nx * y;
  }, 0)) / 2;

export const perimeter = (poly: readonly Pt[]) =>
  poly.reduce((sum, [x, y], index) => {
    const [nx, ny] = poly[(index + 1) % poly.length]!;
    return sum + Math.hypot(nx - x, ny - y);
  }, 0);

/** Openings up to this size (m²) are measured over, larger ones deducted (VOB/C ATV DIN 18363). */
export const OVERMEASURE = 2.5;

/** Wall area to paint: clear perimeter × clear height, less every opening over 2.5 m². */
export const wallArea = (floor: Floor, roomId: string) => {
  const target = floor.rooms.find((candidate) => candidate.id === roomId)!;
  const deducted = floor.openings
    .filter((opening) => opening.rooms.includes(roomId) && opening.width * opening.height > OVERMEASURE)
    .reduce((sum, opening) => sum + opening.width * opening.height, 0);
  return perimeter(target.poly) * target.height - deducted;
};

const key = pointKey;
const inside = (p: Pt, { a, b }: Tray) =>
  (a[0] === b[0] ? Math.abs(p[0] - a[0]) < 1e-6 && p[1] > Math.min(a[1], b[1]) + 1e-6 && p[1] < Math.max(a[1], b[1]) - 1e-6 : Math.abs(p[1] - a[1]) < 1e-6 && p[0] > Math.min(a[0], b[0]) + 1e-6 && p[0] < Math.max(a[0], b[0]) - 1e-6);

export const length = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** New tray lengths by width, and the tees and horizontal 90° bends their route forms. */
export const trayTakeoff = (floor: Floor) => {
  const trays = floor.trays.filter((tray) => !tray.existing);
  const total = { 200: 0, 300: 0 };
  for (const tray of trays) total[tray.size] += length(tray.a, tray.b);
  const ends = new Map<string, { point: Pt; directions: Pt[] }>();
  for (const tray of trays)
    for (const [point, other] of [
      [tray.a, tray.b],
      [tray.b, tray.a],
    ] as const) {
      const entry = ends.get(key(point)) ?? { point, directions: [] };
      entry.directions.push([Math.sign(other[0] - point[0]), Math.sign(other[1] - point[1])]);
      ends.set(key(point), entry);
    }
  let tees = 0;
  let bends = 0;
  for (const { point, directions } of ends.values()) {
    const degree = directions.length + (trays.some((tray) => inside(point, tray)) ? 2 : 0);
    if (degree === 3) tees++;
    if (degree === 2 && directions.length === 2 && directions[0]![0] + directions[1]![0] !== 0 && directions[0]![1] + directions[1]![1] !== 0) bends++;
  }
  return { KT300: total[300], KT200: total[200], tees, bends };
};

/** Where the tray riser goes up from the ground floor to the upper floor. */
export const TRAY_RISER: Pt = [4.9, 9.8];

/** The riser's length: from the tray underside on the ground floor to the tray underside upstairs. */
export const trayRiser = () => OG.level + OG.trayHeight! - (EG.level + EG.trayHeight!);

export type Pipe = { a: Pt; b: Pt; dn: number };

/** Heating supply and return run as a pair under the basement ceiling; one line per segment. */
export const HEATING: Pipe[] = [
  { a: [1.4, 10.2], b: [2.8, 10.2], dn: 50 },
  { a: [2.8, 10.2], b: [2.8, 6.4], dn: 40 },
  { a: [2.8, 6.4], b: [4.8, 6.4], dn: 40 },
  { a: [4.8, 6.4], b: [9.2, 6.4], dn: 32 },
  { a: [9.2, 6.4], b: [13.6, 6.4], dn: 25 },
  { a: [13.6, 6.4], b: [20.4, 6.4], dn: 20 },
  { a: [20.4, 6.4], b: [20.4, 7.25], dn: 20 },
  { a: [4.8, 6.4], b: [4.8, 7.35], dn: 25 },
  { a: [9.2, 6.4], b: [9.2, 4.7], dn: 25 },
  { a: [13.6, 6.4], b: [13.6, 7.35], dn: 20 },
];

/** Drinking water, cold and warm, drawn on the same sheet and not part of the heating takeoff. */
export const WATER: Array<{ system: "TWK" | "TWW"; points: Pt[]; dn: number }> = [
  { system: "TWK", points: [[5.2, 10.9], [15.5, 10.9], [15.5, 7.6]], dn: 25 },
  { system: "TWW", points: [[5.2, 10.65], [15.25, 10.65], [15.25, 7.6]], dn: 20 },
];

export const BOILER: Pt = [1.4, 10.2];
export const MANIFOLD: Pt = [2.8, 10.2];

/** Heating risers: their foot in the basement plan and their DN between levels (m, pipe axis). */
export const RISERS: Array<{ id: string; at: Pt; runs: Array<{ from: number; to: number; dn: number }> }> = [
  { id: "ST1", at: [4.8, 7.35], runs: [{ from: -0.45, to: 0.3, dn: 25 }, { from: 0.3, to: 3.6, dn: 20 }] },
  { id: "ST2", at: [9.2, 4.7], runs: [{ from: -0.45, to: 0.3, dn: 25 }, { from: 0.3, to: 3.6, dn: 20 }] },
  { id: "ST3", at: [13.6, 7.35], runs: [{ from: -0.45, to: 3.6, dn: 20 }] },
  { id: "ST4", at: [20.4, 7.25], runs: [{ from: -0.45, to: 0.3, dn: 20 }] },
];

/** The heating points the basement plan draws away from their dimensioned position. */
export const HEATING_DRAWN: Record<string, Pt> = { "20.4,6.4": [19.6, 6.4], "20.4,7.25": [19.6, 7.25] };

/** Heating pipe length in m by DN, supply and return together: basement runs plus risers. */
export const heatingTakeoff = () => {
  const total: Record<string, number> = {};
  const add = (dn: number, length: number) => (total[`DN${dn}`] = (total[`DN${dn}`] ?? 0) + 2 * length);
  for (const pipe of HEATING) add(pipe.dn, length(pipe.a, pipe.b));
  for (const riser of RISERS) for (const run of riser.runs) add(run.dn, run.to - run.from);
  return total;
};
