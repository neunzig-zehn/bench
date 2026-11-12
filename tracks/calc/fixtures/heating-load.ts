/**
 * A ground-floor flat over an unheated cellar: rooms, their building components, U-values and a
 * simplified heat-load method, with every room's heat load by construction.
 */
import type { Lang } from "../../../src/types";
import { roundHalfUp } from "../calculator";
import { fmt } from "../shared";

type Text = Record<Lang, string>;
export type RoomType = "living" | "kitchen" | "bath" | "wc" | "hall";
export type Adjacent = "outside" | "cellar" | "stairwell" | "upper-flat" | "neighbour-flat" | `R0${number}`;
export type Wall = { id: string; code: string; adjacent: Adjacent; length: number; height: number };
export type Opening = { id: string; code: string; inWall: string; width: number; height: number };
export type Slab = { id: string; code: string; adjacent: Adjacent; area: number };
export type Room = { id: string; name: Text; type: RoomType; area: number; clearHeight: number; walls: Wall[]; openings: Opening[]; slabs: Slab[] };

export const OUTSIDE = -12;
export const ADJACENT_TEMPERATURES: Record<"outside" | "cellar" | "stairwell" | "upper-flat" | "neighbour-flat", number> = {
  outside: OUTSIDE,
  cellar: 6,
  stairwell: 10,
  "upper-flat": 15,
  "neighbour-flat": 15,
};
export const THERMAL_BRIDGE = 0.05;
/** Extract air volume flow in m³/h of rooms with a mechanical extract fan. */
export const EXTRACT: Partial<Record<RoomType, number>> = { bath: 60, wc: 30 };
export const ROOM_TYPES: Record<RoomType, { name: Text; temperature: number; airChange: number }> = {
  living: { name: { de: "Wohn-, Schlaf- und Kinderzimmer", en: "Living room, bedroom, children's room" }, temperature: 20, airChange: 0.5 },
  kitchen: { name: { de: "Küche", en: "Kitchen" }, temperature: 20, airChange: 1 },
  bath: { name: { de: "Bad", en: "Bathroom" }, temperature: 24, airChange: 1.5 },
  wc: { name: { de: "WC", en: "WC" }, temperature: 20, airChange: 1.5 },
  hall: { name: { de: "Flur/Diele", en: "Hall" }, temperature: 18, airChange: 0.5 },
};
export const U_VALUES: Record<string, { name: Text; u: number }> = {
  AW: { name: { de: "Außenwand, Mauerwerk mit WDVS 14 cm", en: "External wall, masonry with 14 cm ETICS" }, u: 0.28 },
  "IW-TH": { name: { de: "Wand zum Treppenhaus, KS 24 cm", en: "Wall to the stairwell, sand-lime brick 24 cm" }, u: 0.95 },
  IW: { name: { de: "Innenwand, KS 11,5 cm verputzt", en: "Internal wall, sand-lime brick 11.5 cm, plastered" }, u: 1.9 },
  "IW-WT": { name: { de: "Wohnungstrennwand, KS 24 cm", en: "Party wall between flats, sand-lime brick 24 cm" }, u: 1.35 },
  "FB-KG": { name: { de: "Boden über Keller, Stahlbeton mit Dämmung", en: "Floor over the cellar, concrete with insulation" }, u: 0.38 },
  "DE-OG": { name: { de: "Decke zur Wohnung OG", en: "Ceiling to the upper flat" }, u: 0.8 },
  FE: { name: { de: "Fenster, Kunststoff, 3-fach verglast", en: "Window, PVC frame, triple glazed" }, u: 1.1 },
  FT: { name: { de: "Fenstertür, Kunststoff, 3-fach verglast", en: "French window, PVC frame, triple glazed" }, u: 1.3 },
  WT: { name: { de: "Wohnungseingangstür", en: "Flat entrance door" }, u: 1.8 },
  IT: { name: { de: "Innentür, Röhrenspan", en: "Internal door, tubular chipboard" }, u: 2 },
};

const H = 2.6;
const name = (de: string, en: string): Text => ({ de, en });
const wall = (id: string, code: string, adjacent: Adjacent, length: number, height = H): Wall => ({ id, code, adjacent, length, height });
const slabs = (area: number): Slab[] => [
  { id: "B", code: "FB-KG", adjacent: "cellar", area },
  { id: "D", code: "DE-OG", adjacent: "upper-flat", area },
];
const door = (id: string, inWall: string, width = 0.885): Opening => ({ id, code: "IT", inWall, width, height: 2.01 });

export const ROOMS: Room[] = [
  {
    id: "R01",
    name: name("Wohnen", "Living room"),
    type: "living",
    area: 24.8,
    clearHeight: H,
    walls: [wall("W1", "AW", "outside", 6.2), wall("W2", "AW", "outside", 4), wall("W3", "IW", "R07", 4), wall("W4", "IW", "R02", 3), wall("W5", "IW-WT", "neighbour-flat", 3.2)],
    openings: [
      { id: "FT1", code: "FT", inWall: "W1", width: 1.01, height: 2.26 },
      { id: "FE1", code: "FE", inWall: "W1", width: 2.01, height: 1.51 },
      { id: "FE2", code: "FE", inWall: "W2", width: 1.26, height: 1.51 },
      door("T1", "W3"),
    ],
    slabs: slabs(24.8),
  },
  {
    id: "R02",
    name: name("Küche", "Kitchen"),
    type: "kitchen",
    area: 10.5,
    clearHeight: H,
    walls: [wall("W1", "AW", "outside", 3.5), wall("W2", "IW", "R07", 3), wall("W3", "IW", "R01", 3), wall("W4", "IW-WT", "neighbour-flat", 3.5)],
    openings: [{ id: "FE3", code: "FE", inWall: "W1", width: 1.26, height: 1.26 }, door("T2", "W2")],
    slabs: slabs(10.5),
  },
  {
    id: "R03",
    name: name("Schlafen", "Bedroom"),
    type: "living",
    area: 15.4,
    clearHeight: H,
    walls: [wall("W1", "AW", "outside", 4.4), wall("W2", "AW", "outside", 3.5), wall("W3", "IW", "R05", 3), wall("W4", "IW", "R07", 1.4)],
    openings: [{ id: "FE4", code: "FE", inWall: "W1", width: 1.26, height: 1.51 }, door("T3", "W4")],
    slabs: slabs(15.4),
  },
  {
    id: "R04",
    name: name("Kinderzimmer", "Children's room"),
    type: "living",
    area: 11.2,
    clearHeight: H,
    walls: [wall("W1", "AW", "outside", 3.2), wall("W2", "AW", "outside", 3.5), wall("W3", "IW", "R07", 3.2)],
    openings: [
      { id: "FE5", code: "FE", inWall: "W1", width: 1.26, height: 1.51 },
      { id: "FE6", code: "FE", inWall: "W2", width: 1.01, height: 1.26 },
      door("T4", "W3"),
    ],
    slabs: slabs(11.2),
  },
  {
    id: "R05",
    name: name("Bad", "Bathroom"),
    type: "bath",
    area: 7.2,
    clearHeight: 2.35,
    walls: [wall("W1", "AW", "outside", 2.4), wall("W2", "IW", "R03", 3), wall("W3", "IW", "R07", 2.4), wall("W4", "IW", "R06", 1.5), wall("W5", "IW-WT", "neighbour-flat", 1.5)],
    openings: [{ id: "FE7", code: "FE", inWall: "W1", width: 0.885, height: 1.01 }, door("T5", "W3", 0.76)],
    slabs: slabs(7.2),
  },
  {
    id: "R06",
    name: name("WC", "WC"),
    type: "wc",
    area: 2.1,
    clearHeight: 2.35,
    walls: [wall("W1", "IW", "R05", 1.5), wall("W2", "IW-TH", "stairwell", 1.4), wall("W3", "IW", "R07", 1.5)],
    openings: [door("T6", "W3", 0.76)],
    slabs: slabs(2.1),
  },
  {
    id: "R07",
    name: name("Flur", "Hall"),
    type: "hall",
    area: 9.6,
    clearHeight: H,
    walls: [
      wall("W1", "IW-TH", "stairwell", 4),
      wall("W2", "IW", "R01", 4),
      wall("W3", "IW", "R02", 3),
      wall("W4", "IW", "R05", 2.4),
      wall("W5", "IW", "R04", 3.2),
      wall("W6", "IW", "R03", 1.4),
      wall("W7", "IW", "R06", 1.5),
    ],
    openings: [
      { id: "WT1", code: "WT", inWall: "W1", width: 1.01, height: 2.135 },
      door("T1", "W2"),
      door("T2", "W3"),
      door("T5", "W4", 0.76),
      door("T4", "W5"),
      door("T3", "W6"),
      door("T6", "W7", 0.76),
    ],
    slabs: slabs(9.6),
  },
];

export const temperatureOf = (adjacent: Adjacent) =>
  adjacent in ADJACENT_TEMPERATURES
    ? ADJACENT_TEMPERATURES[adjacent as keyof typeof ADJACENT_TEMPERATURES]
    : ROOM_TYPES[ROOMS.find((room) => room.id === adjacent)!.type].temperature;

export type Options = { deductOpenings?: boolean; ventilationHeight?: (room: Room) => number; thermalBridge?: boolean; extract?: boolean };

/** A room's unrounded heat load in W: transmission through every component plus ventilation. */
export const heatLoad = (room: Room, options: Options = {}) => {
  const { temperature, airChange } = ROOM_TYPES[room.type];
  const deduct = options.deductOpenings ?? true;
  const bridge = (options.thermalBridge ?? true) ? THERMAL_BRIDGE : 0;
  let transmission = 0;
  for (const component of room.walls) {
    const openings = room.openings.filter((opening) => opening.inWall === component.id);
    const net = component.length * component.height - (deduct ? openings.reduce((sum, opening) => sum + opening.width * opening.height, 0) : 0);
    const delta = temperature - temperatureOf(component.adjacent);
    const surcharge = component.adjacent === "outside" ? bridge : 0;
    transmission += (U_VALUES[component.code]!.u + surcharge) * net * delta;
    for (const opening of openings) transmission += (U_VALUES[opening.code]!.u + surcharge) * opening.width * opening.height * delta;
  }
  for (const slab of room.slabs) transmission += U_VALUES[slab.code]!.u * slab.area * (temperature - temperatureOf(slab.adjacent));
  const volume = room.area * (options.ventilationHeight ?? ((r: Room) => r.clearHeight))(room);
  const flow = Math.max(airChange * volume, (options.extract ?? true) ? (EXTRACT[room.type] ?? 0) : 0);
  return transmission + 0.34 * flow * (temperature - OUTSIDE);
};

export const GOLD = (() => {
  const rooms = Object.fromEntries(ROOMS.map((room) => [room.id, roundHalfUp(heatLoad(room))]));
  return { rooms, total: Object.values(rooms).reduce((sum, load) => sum + load, 0) };
})();

export const method = (lang: Lang) => {
  const types = Object.values(ROOM_TYPES)
    .map((type) => `– ${type.name[lang]}: θ_int = ${type.temperature} °C, n = ${fmt(lang, type.airChange, 1)} 1/h`)
    .join("\n");
  return lang === "de"
    ? `VEREINFACHTES HEIZLASTVERFAHREN – Wohnung EG links, Ahornweg 7

1. Außenklima: Norm-Außentemperatur θ_e = ${OUTSIDE} °C.

2. Norm-Innentemperatur θ_int und Luftwechsel n je Raumart:
${types}

3. Temperaturen angrenzender Bereiche θ_adj:
– außen: ${OUTSIDE} °C
– Keller (unbeheizt): +${ADJACENT_TEMPERATURES.cellar} °C
– Treppenhaus (unbeheizt): +${ADJACENT_TEMPERATURES.stairwell} °C
– Wohnung OG und Nachbarwohnung (beheizt, andere Nutzungseinheiten): +15 °C
– Räume dieser Wohnung: ihre Norm-Innentemperatur nach Abschnitt 2

4. Transmission: Φ_T = Σ U × A × (θ_int − θ_adj) über alle Bauteile des Raumes.
4.1 Wandmaße in der Raumdatenliste sind Bruttomaße (Länge × Höhe). Fenster und Türen werden von der Fläche der Wand abgezogen, in der sie liegen, und mit ihrem eigenen U-Wert gerechnet.
4.2 Ist θ_adj höher als θ_int, ist der Beitrag negativ (Wärmegewinn) und wird mitgerechnet. Bauteile mit θ_adj = θ_int tragen nichts bei.
4.3 Wärmebrücken: Auf den U-Wert jedes Bauteils, das an außen grenzt (Außenwände, Fenster, Fenstertüren), wird ΔU_WB = ${fmt("de", THERMAL_BRIDGE, 2)} W/(m²·K) aufgeschlagen; für alle anderen Bauteile gilt der U-Wert aus dem Katalog.

5. Lüftung: Φ_V = 0,34 × V̇ × (θ_int − θ_e) mit dem Luftvolumenstrom V̇ in m³/h.
5.1 V̇ = n × V, V = Grundfläche × lichte Raumhöhe laut Raumliste, in m³.
5.2 Bad und WC haben eine Abluftanlage mit ${EXTRACT.bath} m³/h (Bad) bzw. ${EXTRACT.wc} m³/h (WC). Ist der Abluftvolumenstrom größer als n × V, gilt er als V̇.

6. Raumheizlast Φ = Φ_T + Φ_V. Innerhalb eines Raumes wird ungerundet gerechnet; die Raumheizlast wird auf ganze W gerundet. Die Heizlast der Wohnung ist die Summe der gerundeten Raumheizlasten.`
    : `SIMPLIFIED HEAT LOAD METHOD – flat ground floor left, Ahornweg 7

1. Outdoor climate: design outdoor temperature θ_e = ${OUTSIDE} °C.

2. Design indoor temperature θ_int and air change rate n by room type:
${types}

3. Temperatures of adjacent spaces θ_adj:
– outside: ${OUTSIDE} °C
– cellar (unheated): +${ADJACENT_TEMPERATURES.cellar} °C
– stairwell (unheated): +${ADJACENT_TEMPERATURES.stairwell} °C
– upper flat and neighbouring flat (heated, other units): +15 °C
– rooms of this flat: their design indoor temperature from section 2

4. Transmission: Φ_T = Σ U × A × (θ_int − θ_adj) over all components of the room.
4.1 Wall dimensions in the room data are gross dimensions (length × height). Windows and doors are deducted from the area of the wall they sit in and calculated with their own U-value.
4.2 If θ_adj is higher than θ_int, the contribution is negative (heat gain) and is included. Components with θ_adj = θ_int contribute nothing.
4.3 Thermal bridges: add ΔU_TB = ${fmt("en", THERMAL_BRIDGE, 2)} W/(m²·K) to the U-value of every component adjacent to the outside (external walls, windows, French windows); all other components use the U-value from the catalog.

5. Ventilation: Φ_V = 0.34 × V̇ × (θ_int − θ_e) with the air volume flow V̇ in m³/h.
5.1 V̇ = n × V, V = floor area × clear room height from the room list, in m³.
5.2 Bathroom and WC have an extract fan with ${EXTRACT.bath} m³/h (bathroom) and ${EXTRACT.wc} m³/h (WC). If the extract volume flow is larger than n × V, it is V̇.

6. Room heat load Φ = Φ_T + Φ_V. Within a room, calculate unrounded; round the room heat load to whole W. The flat's heat load is the sum of the rounded room heat loads.`;
};
