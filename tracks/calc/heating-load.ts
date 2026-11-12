/**
 * Room-by-room heat load of a flat with a stated simplified method: transmission through every
 * component plus ventilation. Traps: gross wall areas with windows and doors to deduct, the bathroom
 * at 24 °C and the hall at 18 °C (so internal walls, the party wall and the ceiling count for some
 * rooms and give heat gains for the hall), unheated cellar and stairwell temperatures, air change
 * rates by room type, and a lower clear height in bathroom and WC. Graded per room to the watt and
 * on the total.
 */
import { LANGS, type Check, type Lang, type Task } from "../../src/types";
import { relativeDeviation } from "../../src/score";
import { GOLD, method, ROOM_TYPES, ROOMS, U_VALUES, type Adjacent } from "./fixtures/heating-load";
import { byKey, calculateTool, localize, matches, object, ok, page, pageParameters, refuse } from "./shared";

type Answer = { rooms: Array<{ roomId: string; heatLoadW: number }>; totalW: number };

const NAMES_DE = {
  id: "id",
  name: "bezeichnung",
  roomType: "raumart",
  floorAreaM2: "grundflaecheM2",
  clearHeightM: "lichteRaumhoeheM",
  walls: "waende",
  openings: "oeffnungen",
  slabs: "bodenUndDecke",
  code: "bauteil",
  adjacent: "angrenzend",
  lengthM: "laengeM",
  heightM: "hoeheM",
  widthM: "breiteM",
  inWall: "inWand",
  areaM2: "flaecheM2",
  uValue: "uWert",
  components: "bauteile",
  unit: "einheit",
  document: "dokument",
};

const ADJACENT: Record<string, Record<Lang, string>> = {
  outside: { de: "außen", en: "outside" },
  cellar: { de: "Keller (unbeheizt)", en: "cellar (unheated)" },
  stairwell: { de: "Treppenhaus (unbeheizt)", en: "stairwell (unheated)" },
  "upper-flat": { de: "Wohnung OG", en: "upper flat" },
  "neighbour-flat": { de: "Nachbarwohnung", en: "neighbouring flat" },
};

const TEXT = {
  de: {
    system: "Du bist TGA-Planer und berechnest Heizlasten mit den Werkzeugen. Die Daten erreichst du nur über die Werkzeuge; rechne mit calculate. Lies das Berechnungsverfahren vollständig, bevor du rechnest. Rufe unabhängige Werkzeuge parallel auf. Wenn du fertig bist, rufe submit mit deinem Ergebnis auf.",
    prompt: "Berechne die Raumheizlasten und die Heizlast der Wohnung EG links im Ahornweg 7 nach dem vorgegebenen Berechnungsverfahren.",
    room: (id: string) => `Raum ${id}: ${ROOMS.find((room) => room.id === id)!.name.de}`,
    unknown: (id: string) => `Unbekannter Raum ${id}. Räume: ${ROOMS.map((room) => room.id).join(", ")}.`,
    tools: {
      list_rooms: "Listet die Räume der Wohnung seitenweise: ID, Bezeichnung, Raumart, Grundfläche, lichte Raumhöhe. Höchstens 4 Räume je Aufruf.",
      get_room: "Gibt die Bauteile eines Raumes zurück: Wände (Bruttomaße), Fenster und Türen mit der Wand, in der sie liegen, Boden und Decke, jeweils mit angrenzendem Bereich.",
      get_u_values: "Gibt den Bauteilkatalog mit den U-Werten in W/(m²·K) zurück.",
      get_method: "Gibt das Berechnungsverfahren zurück: Temperaturen, Luftwechsel, Formeln und Rundung.",
    },
    answer: "Die Raumheizlasten und die Heizlast der Wohnung.",
    fields: { rooms: "Heizlast je Raum", roomId: "Raum-ID, z. B. R01", heatLoadW: "Raumheizlast in W, ganzzahlig gerundet", totalW: "Heizlast der Wohnung in W" },
  },
  en: {
    system: "You are a building services engineer calculating heat loads with the tools. You reach the data only through the tools; calculate with calculate. Read the calculation method completely before you calculate. Call independent tools in parallel. When you are done, call submit with your result.",
    prompt: "Calculate the room heat loads and the heat load of the flat ground floor left at Ahornweg 7 with the prescribed calculation method.",
    room: (id: string) => `Room ${id}: ${ROOMS.find((room) => room.id === id)!.name.en}`,
    unknown: (id: string) => `Unknown room ${id}. Rooms: ${ROOMS.map((room) => room.id).join(", ")}.`,
    tools: {
      list_rooms: "Lists the rooms of the flat page by page: id, name, room type, floor area, clear room height. At most 4 rooms per call.",
      get_room: "Returns a room's components: walls (gross dimensions), windows and doors with the wall they sit in, floor and ceiling, each with the adjacent space.",
      get_u_values: "Returns the component catalog with U-values in W/(m²·K).",
      get_method: "Returns the calculation method: temperatures, air change rates, formulas and rounding.",
    },
    answer: "The room heat loads and the heat load of the flat.",
    fields: { rooms: "Heat load per room", roomId: "Room id, e.g. R01", heatLoadW: "Room heat load in W, rounded to an integer", totalW: "Heat load of the flat in W" },
  },
};

const make = (lang: Lang): Task<Record<string, never>, Answer> => {
  const text = TEXT[lang];
  const out = (value: unknown) => ok(localize(lang, value, NAMES_DE));
  const adjacent = (value: Adjacent) => ADJACENT[value]?.[lang] ?? text.room(value);
  return {
    id: `calc-heating-load-${lang}`,
    track: "calc",
    lang,
    title: "Room heat loads of a flat",
    description:
      "Computes seven room heat loads (transmission plus ventilation) and their sum with a stated simplified method. Traps: gross wall areas with openings to deduct, rooms at 24 °C and 18 °C so internal walls, party wall and ceiling count and the hall has heat gains, unheated cellar and stairwell temperatures, air change by room type, and lower clear heights in bathroom and WC.",
    system: text.system,
    prompt: text.prompt,
    init: () => ({}),
    tools: [
      {
        name: "list_rooms",
        description: text.tools.list_rooms,
        parameters: pageParameters(4),
        run: (args) => {
          const { rows, ...rest } = page(ROOMS, args, 4);
          return out({
            ...rest,
            rows: rows.map((room) => ({ id: room.id, name: room.name[lang], roomType: ROOM_TYPES[room.type].name[lang], floorAreaM2: room.area, clearHeightM: room.clearHeight })),
          });
        },
      },
      {
        name: "get_room",
        description: text.tools.get_room,
        parameters: object({ roomId: { type: "string" } }),
        run: (args) => {
          const room = ROOMS.find((candidate) => candidate.id === String(args.roomId ?? "").trim().toUpperCase());
          if (!room) return refuse(lang, text.unknown(String(args.roomId)));
          return out({
            id: room.id,
            name: room.name[lang],
            walls: room.walls.map((wall) => ({ id: wall.id, code: wall.code, adjacent: adjacent(wall.adjacent), lengthM: wall.length, heightM: wall.height })),
            openings: room.openings.map((opening) => ({ id: opening.id, code: opening.code, inWall: opening.inWall, widthM: opening.width, heightM: opening.height })),
            slabs: room.slabs.map((slab) => ({ id: slab.id, code: slab.code, adjacent: adjacent(slab.adjacent), areaM2: slab.area })),
          });
        },
      },
      {
        name: "get_u_values",
        description: text.tools.get_u_values,
        parameters: object({}),
        run: () => out({ unit: "W/(m²·K)", components: Object.entries(U_VALUES).map(([code, entry]) => ({ code, name: entry.name[lang], uValue: entry.u })) }),
      },
      { name: "get_method", description: text.tools.get_method, parameters: object({}), run: () => out({ document: method(lang) }) },
      calculateTool(lang),
    ],
    answer: {
      description: text.answer,
      schema: object({
        rooms: {
          type: "array",
          description: text.fields.rooms,
          items: object({ roomId: { type: "string", description: text.fields.roomId }, heatLoadW: { type: "number", description: text.fields.heatLoadW } }),
        },
        totalW: { type: "number", description: text.fields.totalW },
      }),
    },
    grade: (answer) => {
      const rooms = byKey(answer?.rooms, "roomId");
      const checks: Record<string, Check> = {};
      for (const room of ROOMS) checks[`${room.id} ${room.name.en}`] = matches(rooms.get(room.id)?.heatLoadW, GOLD.rooms[room.id]!, 0) ? 1 : 0;
      checks.total = { score: matches(answer?.totalW, GOLD.total, 0) ? 1 : 0, weight: 3 };
      return { checks, metrics: { totalDeviationPct: Math.min(1, relativeDeviation(answer?.totalW, GOLD.total)) * 100 } };
    },
    reference: { rooms: ROOMS.map((room) => ({ roomId: room.id, heatLoadW: GOLD.rooms[room.id]! })), totalW: GOLD.total },
  };
};

export const heatingLoad = LANGS.map(make);
