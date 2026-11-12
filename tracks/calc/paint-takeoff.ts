/**
 * Paint quantities (Aufmaß) for the walls of six rooms under explicit measurement rules. Traps:
 * suspended ceilings lowering the wall height, the 2.5 m² deduction threshold with one opening just
 * above it and one exactly at it, reveals added only for deducted openings with a reveal depth, a
 * tiled splashback deducted despite its small size, and openings that occur several times. Graded
 * per room to the cent of a square metre and on the total.
 */
import { LANGS, type Check, type Lang, type Task } from "../../src/types";
import { relativeDeviation } from "../../src/score";
import { GOLD, OPENINGS, ROOMS, rules } from "./fixtures/paint-takeoff";
import { byKey, calculateTool, localize, matches, object, ok, page, pageParameters, refuse } from "./shared";

type Answer = { rooms: Array<{ roomId: string; areaM2: number }>; totalM2: number };

const NAMES_DE = {
  id: "id",
  name: "bezeichnung",
  wallLengthsM: "wandlaengenM",
  clearHeightM: "lichteRaumhoeheM",
  suspendedCeilingUndersideM: "unterkanteAbhangdeckeM",
  openings: "oeffnungen",
  type: "typ",
  count: "anzahl",
  tiledAreas: "gefliesteFlaechen",
  widthM: "breiteM",
  heightM: "hoeheM",
  revealDepthM: "laibungstiefeM",
  document: "dokument",
};

const TEXT = {
  de: {
    system: "Du bist Kalkulator im Malerhandwerk und erstellst Aufmaße mit den Werkzeugen. Die Daten erreichst du nur über die Werkzeuge; rechne mit calculate. Lies die Aufmaßregeln vollständig, bevor du rechnest. Rufe unabhängige Werkzeuge parallel auf. Wenn du fertig bist, rufe submit mit deinem Ergebnis auf.",
    prompt: "Ermittle die zu streichenden Wandflächen im 3. OG der Hafenstraße 18 nach den Aufmaßregeln, je Raum und gesamt.",
    unknown: (id: string) => `Unbekannter Raum ${id}. Räume: ${ROOMS.map((room) => room.id).join(", ")}.`,
    tools: {
      list_rooms: "Listet die Räume des 3. OG seitenweise: Raumnummer und Bezeichnung. Höchstens 3 Räume je Aufruf.",
      get_room: "Gibt die Raumdaten zurück: Wandlängen, lichte Raumhöhe, Unterkante Abhangdecke (falls vorhanden), Öffnungen nach Typ und Anzahl, geflieste Flächen.",
      get_opening_schedule: "Gibt die Öffnungsliste zurück: Typ, Bezeichnung, Breite, Höhe und Laibungstiefe in m.",
      get_rules: "Gibt die Aufmaßregeln für den Wandanstrich zurück.",
    },
    answer: "Die Wandflächen je Raum und gesamt.",
    fields: { rooms: "Fläche je Raum", roomId: "Raumnummer, z. B. 3.01", areaM2: "Zu streichende Wandfläche in m², zwei Nachkommastellen", totalM2: "Gesamtfläche in m², zwei Nachkommastellen" },
  },
  en: {
    system: "You are a painting contractor's estimator taking off quantities with the tools. You reach the data only through the tools; calculate with calculate. Read the measurement rules completely before you calculate. Call independent tools in parallel. When you are done, call submit with your result.",
    prompt: "Take off the wall areas to be painted on the 3rd floor of Hafenstraße 18 according to the measurement rules, per room and in total.",
    unknown: (id: string) => `Unknown room ${id}. Rooms: ${ROOMS.map((room) => room.id).join(", ")}.`,
    tools: {
      list_rooms: "Lists the rooms of the 3rd floor page by page: room number and name. At most 3 rooms per call.",
      get_room: "Returns a room's data: wall lengths, clear room height, underside of the suspended ceiling (if any), openings by type and count, tiled areas.",
      get_opening_schedule: "Returns the opening schedule: type, name, width, height and reveal depth in m.",
      get_rules: "Returns the measurement rules for wall painting.",
    },
    answer: "The wall areas per room and in total.",
    fields: { rooms: "Area per room", roomId: "Room number, e.g. 3.01", areaM2: "Wall area to paint in m², two decimals", totalM2: "Total area in m², two decimals" },
  },
};

const make = (lang: Lang): Task<Record<string, never>, Answer> => {
  const text = TEXT[lang];
  const out = (value: unknown) => ok(localize(lang, value, NAMES_DE));
  return {
    id: `calc-paint-takeoff-${lang}`,
    track: "calc",
    lang,
    title: "Wall paint take-off with deduction rules",
    description:
      "Takes off the paintable wall area of six rooms under explicit rules. Traps: suspended ceilings lowering the wall height, the 2.5 m² threshold with openings just above and exactly at it, reveals only for deducted openings with depth, a small tiled area deducted anyway, and repeated openings.",
    system: text.system,
    prompt: text.prompt,
    init: () => ({}),
    tools: [
      {
        name: "list_rooms",
        description: text.tools.list_rooms,
        parameters: pageParameters(3),
        run: (args) => {
          const { rows, ...rest } = page(ROOMS, args, 3);
          return out({ ...rest, rows: rows.map((room) => ({ id: room.id, name: room.name[lang] })) });
        },
      },
      {
        name: "get_room",
        description: text.tools.get_room,
        parameters: object({ roomId: { type: "string" } }),
        run: (args) => {
          const room = ROOMS.find((candidate) => candidate.id === String(args.roomId ?? "").trim());
          if (!room) return refuse(lang, text.unknown(String(args.roomId)));
          return out({
            id: room.id,
            name: room.name[lang],
            wallLengthsM: room.walls,
            clearHeightM: room.clearHeight,
            ...(room.suspendedCeiling ? { suspendedCeilingUndersideM: room.suspendedCeiling } : {}),
            openings: room.openings,
            ...(room.tiles ? { tiledAreas: room.tiles.map((tile) => ({ name: tile.name[lang], widthM: tile.width, heightM: tile.height })) } : {}),
          });
        },
      },
      {
        name: "get_opening_schedule",
        description: text.tools.get_opening_schedule,
        parameters: object({}),
        run: () =>
          out({
            openings: OPENINGS.map((opening) => ({ type: opening.id, name: opening.name[lang], widthM: opening.width, heightM: opening.height, revealDepthM: opening.reveal })),
          }),
      },
      { name: "get_rules", description: text.tools.get_rules, parameters: object({}), run: () => out({ document: rules(lang) }) },
      calculateTool(lang),
    ],
    answer: {
      description: text.answer,
      schema: object({
        rooms: {
          type: "array",
          description: text.fields.rooms,
          items: object({ roomId: { type: "string", description: text.fields.roomId }, areaM2: { type: "number", description: text.fields.areaM2 } }),
        },
        totalM2: { type: "number", description: text.fields.totalM2 },
      }),
    },
    grade: (answer) => {
      const rooms = byKey(answer?.rooms, "roomId");
      const checks: Record<string, Check> = {};
      for (const room of ROOMS) checks[`${room.id} ${room.name.en}`] = matches(rooms.get(room.id)?.areaM2, GOLD.rooms[room.id]!, 2) ? 1 : 0;
      checks.total = { score: matches(answer?.totalM2, GOLD.total, 2) ? 1 : 0, weight: 2 };
      return { checks, metrics: { totalDeviationPct: Math.min(1, relativeDeviation(answer?.totalM2, GOLD.total)) * 100 } };
    },
    reference: { rooms: ROOMS.map((room) => ({ roomId: room.id, areaM2: GOLD.rooms[room.id]! })), totalM2: GOLD.total },
  };
};

export const paintTakeoff = LANGS.map(make);
