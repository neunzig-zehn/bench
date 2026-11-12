/**
 * The plan set of the project: six sheets drawn from the building data, each with its frame, zone
 * grid, title block, notes, and legend. A sheet's SVG is built once per language.
 */
import type { Lang } from "../../src/types";
import { BOILER, CODES, FLOORS, HEATING, HEATING_DRAWN, MANIFOLD, RISERS, SIZE, TRAY_RISER, WATER, drawnAt, type Floor } from "./building";
import {
  PAPER,
  TITLE_BLOCK,
  circle,
  dimRich,
  dimension,
  decimal,
  frame,
  frameBox,
  group,
  level,
  line,
  planDim,
  polygon,
  polyline,
  rect,
  scaleBar,
  text,
  titleBlock,
  toPaper,
  type Box,
  type Paper,
  type PlanView,
  type Pt,
  type Text,
} from "./drawing";
import { ARCH, BACKGROUND, TRAY_COLOR, axisGrid, axisReferences, devicePlan, exteriorChains, floorPlan, glyph, referenceBoxes, referenceDims, roomDims, trayPlan } from "./floorplan";

export type Sheet = {
  id: string;
  paper: Paper;
  /** 50 for 1:50; undefined for a diagram not to scale. */
  scale?: number;
  title: Text;
  discipline: Text;
  notes: Text[];
  legend?: { box: Box; entries: Array<{ code?: string; name: Text }> };
  /** The sheet draws its own scale bar. */
  ownScaleBar?: boolean;
  body: (lang: Lang) => string;
};

export const PROJECT: Text = { de: "Umbau Bürogebäude Lindenstraße 12", en: "Conversion of office building Lindenstraße 12" };
const CLIENT = "Lindenhof Immobilien GmbH";
const PLANNER = "PG Nord Architekten + Ingenieure";

const t = (de: string, en: string): Text => ({ de, en });
const tr = (lang: Lang, de: string, en: string) => (lang === "de" ? de : en);

const DEVICE_NAMES: Record<(typeof CODES)[number], Text> = {
  E1: t("Steckdose 1-fach", "Socket outlet, single"),
  E2: t("Steckdose 2-fach", "Socket outlet, double"),
  E3: t("Ausschalter", "One-way switch"),
  E4: t("Wechselschalter", "Two-way switch"),
  E5: t("Deckenleuchte", "Ceiling light"),
  E6: t("Sicherheitsleuchte", "Emergency light"),
  E7: t("Rauchwarnmelder", "Smoke alarm"),
  E8: t("Bewegungsmelder", "Motion detector"),
  E9: t("Datendose 2× RJ45", "Data outlet 2× RJ45"),
};

const scaleText = (lang: Lang, sheet: Sheet) => (sheet.scale ? `1:${sheet.scale}` : tr(lang, "ohne Maßstab", "not to scale"));

const wrap = (value: string, width: number) => {
  const lines: string[] = [];
  let current = "";
  for (const word of value.split(" ")) {
    if (current && (current + " " + word).length > width) {
      lines.push(current);
      current = word;
    } else current = current ? `${current} ${word}` : word;
  }
  return [...lines, current];
};

/** Notes box above the title block. */
const notesBox = (sheet: Sheet, lang: Lang) => {
  const f = frameBox(sheet.paper);
  const x = f.x + f.w - TITLE_BLOCK.w;
  const lines = [tr(lang, "Hinweise", "Notes"), ...sheet.notes.flatMap((note) => wrap(`– ${note[lang]}`, 100))];
  const height = lines.length * 3.6 + 3;
  const y = f.y + f.h - TITLE_BLOCK.h - height - 2;
  return (
    rect(x, y, TITLE_BLOCK.w, height, { width: 0.3, fill: "#fff" }) +
    lines.map((value, index) => text([x + 2, y + 4.5 + index * 3.6], value, { size: index ? 2.3 : 2.6, bold: !index })).join("")
  );
};

const legendBox = (sheet: Sheet, lang: Lang, symbols: Record<string, string>) => {
  if (!sheet.legend) return "";
  const { box, entries } = sheet.legend;
  return [
    rect(box.x, box.y, box.w, box.h, { width: 0.3, fill: "#fff" }),
    text([box.x + 3, box.y + 7], tr(lang, "Legende", "Legend"), { size: 3.5, bold: true }),
    ...entries.map((entry, index) => {
      const y = box.y + 17 + index * 9.5;
      return [
        symbols[entry.code ?? ""] ? group([box.x + 10, y - 1], 0, symbols[entry.code ?? ""]!) : "",
        entry.code && /^E\d$/u.test(entry.code) ? text([box.x + 22, y], entry.code, { size: 3, bold: true }) : "",
        text([box.x + 34, y], entry.name[lang], { size: 3 }),
      ].join("");
    }),
  ].join("");
};

const cache = new Map<string, string>();

/** The whole sheet in paper millimetres. */
export const sheetSvg = (sheet: Sheet, lang: Lang) => {
  const cacheKey = `${sheet.id}:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const f = frameBox(sheet.paper);
  const [w, h] = PAPER[sheet.paper];
  const svg = [
    sheet.body(lang),
    frame(sheet.paper),
    notesBox(sheet, lang),
    titleBlock(sheet.paper, [
      [tr(lang, "Projekt", "Project"), PROJECT[lang]],
      [tr(lang, "Bauherr", "Client"), CLIENT],
      [tr(lang, "Planung", "Design"), PLANNER],
      [tr(lang, "Planinhalt", "Content"), sheet.title[lang]],
      [tr(lang, "Plan-Nr. / Index", "Sheet no. / rev."), `${sheet.id} / B${" ".repeat(6)}${tr(lang, "Datum", "Date")} ${tr(lang, "12.10.2026", "2026-10-12")}`],
      [tr(lang, "Maßstab / Format", "Scale / paper"), `${scaleText(lang, sheet)}   ${sheet.paper} (${w} × ${h} mm)`],
    ]),
    sheet.scale && !sheet.ownScaleBar ? scaleBar([f.x + f.w - TITLE_BLOCK.w - 150, f.y + f.h - 12], sheet.scale, 5, tr(lang, `Maßstabsleiste 1:${sheet.scale}`, `Scale bar 1:${sheet.scale}`)) : "",
  ].join("");
  cache.set(cacheKey, svg);
  return svg;
};

const PLAN_VIEW: PlanView = { ox: 75, oy: 400, scale: 50 };

const planTitle = (view: PlanView, lines: string[]) => {
  const at = toPaper(view, [0, -3.4]);
  return lines.map((value, index) => text([at[0], at[1] + index * 6], value, { size: index ? 3 : 5, bold: !index })).join("");
};

const sectionMarks = (view: PlanView) =>
  [
    { x: 2, label: "B" },
    { x: 11, label: "A" },
  ]
    .map(({ x, label }) =>
      [-2.7, SIZE[1] + 2.7]
        .map((y) => {
          const p = toPaper(view, [x, y]);
          const toward = y < 0 ? 1 : -1;
          return (
            line(toPaper(view, [x, y + toward * 0.6]), toPaper(view, [x, y + toward * 1.4]), { width: 0.9 }) +
            polygon([p, [p[0] - 5, p[1] - 1.8], [p[0] - 5, p[1] + 1.8]], { fill: "#000", stroke: "#000" }) +
            text([p[0] + 2.5, p[1] + 1.8], label, { size: 5, bold: true })
          );
        })
        .join(""),
    )
    .join("");

const deviceLegend: Record<string, string> = Object.fromEntries(CODES.map((code) => [code, glyph(code)]));

const electricalSheet = (floor: Floor, id: string, title: Text): Sheet => ({
  id,
  paper: "A1",
  scale: 50,
  title,
  discipline: t("Elektro", "Electrical"),
  notes: [
    t("Symbole nach Legende. Eine Zahl mit × neben einem Symbol gibt die Anzahl gleicher Geräte an dieser Stelle an.", "Symbols as in the legend. A number with × beside a symbol gives the number of identical devices at that spot."),
    t("Grau dargestellt: Bestand, bleibt erhalten, nicht Teil der Leistung.", "Shown in grey: existing, stays in place, not part of the works."),
    t("Kabeltrassen sind von den Achsen aus auf die Trassenachse bemaßt (Anfang, Ende, Abzweige, Richtungswechsel). Unterstrichene Maße sind nicht maßstäblich gezeichnet; es gilt das Maß.", "Cable trays are dimensioned from the axes to the tray axis (start, end, branches, changes of direction). Underlined dimensions are not drawn to scale; the dimension governs."),
    t("Formteile (T-Stücke, Bögen) sind in den Trassenlängen enthalten.", "Fittings (tees, bends) are included in the tray lengths."),
    t("Architektur grau hinterlegt, Maße siehe Architektur.", "Architecture in grey as background; dimensions see architectural drawings."),
  ],
  legend: {
    box: { x: 575, y: 22, w: 250, h: 162 },
    entries: [
      ...CODES.map((code) => ({ code, name: DEVICE_NAMES[code] })),
      { code: "existing", name: t("grau: Bestand (nicht im Auftrag)", "grey: existing (not in scope)") },
      { code: "count", name: t("3× = drei gleiche Geräte an dieser Stelle", "3× = three identical devices at this spot") },
      { code: "tray", name: t("Kabeltrasse KT Breite×Höhe in mm", "Cable tray KT width×height in mm") },
      { code: "riser", name: t("Steigtrasse (senkrecht)", "Vertical tray riser") },
    ],
  },
  body: (lang) => {
    const riser = toPaper(PLAN_VIEW, TRAY_RISER);
    const up = floor.id === "EG";
    const refs = axisReferences(
      floor.trays.filter((tray) => !tray.existing).flatMap((tray) => [tray.a, tray.b].map((stated) => ({ stated, drawn: drawnAt(floor.drawn, stated) }))),
      0.55,
    );
    return [
      floorPlan(PLAN_VIEW, floor, lang, BACKGROUND),
      axisGrid(PLAN_VIEW, lang, 2.2),
      trayPlan(PLAN_VIEW, floor, {
        size: (size) => `KT ${size}×60`,
        existing: (size) => `KT ${size}×60 ${tr(lang, "Bestand", "existing")}`,
      }),
      referenceDims(PLAN_VIEW, lang, refs, TRAY_COLOR),
      devicePlan(PLAN_VIEW, floor, [[4.4, 8.7, 5.6, 10.1], ...referenceBoxes(refs)]),
      rect(riser[0] - 5, riser[1] - 5, 10, 10, { stroke: TRAY_COLOR, width: 0.5, fill: "#fff" }),
      line([riser[0] - 5, riser[1] + 5], [riser[0] + 5, riser[1] - 5], { stroke: TRAY_COLOR, width: 0.4 }),
      line([riser[0] - 5, riser[1] - 5], [riser[0] + 5, riser[1] + 5], { stroke: TRAY_COLOR, width: 0.4 }),
      text([riser[0] - 8, riser[1] + 10], tr(lang, "Steigtrasse", "Tray riser"), { size: 2.4, fill: TRAY_COLOR }),
      text([riser[0] - 8, riser[1] + 13.5], up ? tr(lang, "KT 300 ↑ OG", "KT 300 ↑ UF") : tr(lang, "KT 300 von EG", "KT 300 from GF"), { size: 2.4, fill: TRAY_COLOR }),
      planTitle(PLAN_VIEW, [
        `${tr(lang, "Elektro", "Electrical")} – ${floor.name[lang]}`,
        tr(lang, `Kabeltrassen: UK Trasse ${decimal(lang, floor.trayHeight!)} m über FFB ${floor.id}`, `Cable trays: underside of tray ${decimal(lang, floor.trayHeight!)} m above finished floor (${floor.name.en.toLowerCase()})`),
      ]),
      legendBox(electricalSheet_(floor), lang, {
        ...deviceLegend,
        existing: glyph("E1", "#9a9a9a"),
        count: glyph("E2") + text([3.5, 1], "3×", { size: 2.5, bold: true }),
        tray: rect(-5, -1.5, 10, 3, { stroke: TRAY_COLOR, width: 0.3, fill: "#dce8f6" }),
        riser: rect(-3, -3, 6, 6, { stroke: TRAY_COLOR, width: 0.5 }) + line([-3, 3], [3, -3], { stroke: TRAY_COLOR, width: 0.4 }) + line([-3, -3], [3, 3], { stroke: TRAY_COLOR, width: 0.4 }),
      }),
    ].join("");
  },
});

const electricalSheet_ = (floor: Floor) => (floor.id === "EG" ? E101 : E102);

const E101 = electricalSheet(FLOORS.EG, "E-101", t("Elektro Grundriss EG", "Electrical plan, ground floor"));
const E102 = electricalSheet(FLOORS.OG, "E-102", t("Elektro Grundriss OG", "Electrical plan, upper floor"));

const A101: Sheet = {
  id: "A-101",
  paper: "A1",
  scale: 50,
  title: t("Grundriss EG", "Floor plan, ground floor"),
  discipline: t("Architektur", "Architecture"),
  notes: [
    t("Maße in m, Maße unter 1 m in cm. Eine hochgestellte 5 bedeutet + 5 mm (4,26⁵ = 4,265 m; 11⁵ = 11,5 cm).", "Dimensions in m, below 1 m in cm. A superscript 5 adds 5 mm (4.26⁵ = 4.265 m; 11⁵ = 11.5 cm)."),
    t("Raummaße sind lichte Rohbaumaße.", "Room dimensions are clear structural dimensions."),
    t("Öffnungen: Breite/Höhe in m (Rohbaurichtmaß); BRH = Brüstungshöhe.", "Openings: width/height in m (nominal structural size); sill = sill height."),
    t("Raumhöhen siehe Schnitte A-301.", "Room heights see sections A-301."),
  ],
  body: (lang) =>
    [
      floorPlan(PLAN_VIEW, FLOORS.EG, lang, ARCH, { openingLabels: true }),
      exteriorChains(PLAN_VIEW, FLOORS.EG, lang),
      roomDims(PLAN_VIEW, FLOORS.EG, lang),
      sectionMarks(PLAN_VIEW),
      planTitle(PLAN_VIEW, [tr(lang, "Grundriss Erdgeschoss", "Floor plan, ground floor"), tr(lang, "±0,00 = OK FFB EG", "±0.00 = top of finished floor, ground floor")]),
    ].join(""),
};


const SLAB = { underside: 2.8, top: 3.05 };
const SECTION_SCALE = 20;

/** A building section at `x` through both storeys, looking from the west: y runs left to right. */
const section = (lang: Lang, x: number, origin: Pt, label: string) => {
  const p = (y: number, z: number): Pt => [origin[0] + y * SECTION_SCALE, origin[1] - z * SECTION_SCALE];
  const box = (y0: number, z0: number, y1: number, z1: number, fill: string) => {
    const a = p(y0, z1);
    const b = p(y1, z0);
    return rect(a[0], a[1], b[0] - a[0], b[1] - a[1], { fill, stroke: "#000", width: 0.3 });
  };
  const parts: string[] = [];
  const storeys = [FLOORS.EG, FLOORS.OG];
  parts.push(box(0, -0.45, SIZE[1], -0.15, "#3c3c3c"));
  parts.push(line(p(-1.5, -0.45), p(SIZE[1] + 1.5, -0.45), { width: 0.5 }));
  for (const floor of storeys) {
    const base = floor.level;
    const top = base + SLAB.underside;
    const bottom = floor.id === "EG" ? -0.15 : base - (SLAB.underside + 0.5 - SLAB.top);
    parts.push(box(0, top, SIZE[1], top + SLAB.top - SLAB.underside, "#3c3c3c"));
    const covered: Array<[number, number, (typeof floor.rooms)[number]]> = [];
    for (const room of floor.rooms) {
      const xs = room.poly.map(([px]) => px);
      if (x < Math.min(...xs) || x > Math.max(...xs)) continue;
      const ys: number[] = [];
      for (let y = 0; y <= SIZE[1]; y += 0.005) if (inPolygon([x, y], room.poly)) ys.push(y);
      if (ys.length) covered.push([Math.round(Math.min(...ys) * 1000) / 1000, Math.round(Math.max(...ys) * 1000) / 1000, room]);
    }
    covered.sort((a, b) => a[0] - b[0]);
    let cursor = 0;
    for (const [y0, y1] of covered) {
      if (y0 > cursor + 0.01) parts.push(box(cursor, bottom, y0, top, "#3c3c3c"));
      cursor = y1;
    }
    parts.push(box(cursor, bottom, SIZE[1], top, "#3c3c3c"));
    parts.push(line(p(0, base), p(SIZE[1], base), { width: 0.2 }));
    for (const [y0, y1, room] of covered) {
      const ceiling = base + room.height;
      const mid = (y0 + y1) / 2;
      if (room.suspended) {
        parts.push(line(p(y0, ceiling), p(y1, ceiling), { width: 0.35, dash: "2 1" }));
        parts.push(text(p(y0 + 0.15, ceiling + 0.08), `${tr(lang, "UK abgeh. Decke", "underside susp. ceiling")} ${level(lang, ceiling)}`, { size: 2.2 }));
      }
      const dimY = y0 + Math.min(0.45, (y1 - y0) * 0.3);
      parts.push(planDim({ ox: origin[0], oy: origin[1], scale: 50 }, lang, [dimY, base], [dimY, ceiling], 0, { size: 2.4 }));
      const at = p(mid, base + Math.min(1.3, room.height / 2));
      parts.push(text(at, room.id, { size: 3, anchor: "middle", bold: true }), text([at[0], at[1] + 3.8], room.name[lang], { size: 2.4, anchor: "middle" }));
    }
  }
  parts.push(box(0, 6.35, 0.3, 7, "#3c3c3c"), box(SIZE[1] - 0.3, 6.35, SIZE[1], 7, "#3c3c3c"));
  const marks: Array<[number, string]> = [
    [0, tr(lang, "OK FFB EG", "finished floor GF")],
    [SLAB.underside, tr(lang, "UK Rohdecke", "underside slab")],
    [FLOORS.OG.level, tr(lang, "OK FFB OG", "finished floor UF")],
    [FLOORS.OG.level + SLAB.underside, tr(lang, "UK Rohdecke", "underside slab")],
    [7, tr(lang, "OK Attika", "top of parapet")],
  ];
  for (const [z, name] of marks) {
    const at = p(-1.4, z);
    parts.push(
      polygon([at, [at[0] - 1.6, at[1] - 2.4], [at[0] + 1.6, at[1] - 2.4]], { fill: "#000", stroke: "#000", width: 0.2 }),
      line([at[0] - 8, at[1]], [at[0] + 8, at[1]], { width: 0.2 }),
      text([at[0] - 2, at[1] - 3.2], `${level(lang, z)} ${name}`, { size: 2.4, anchor: "end" }),
    );
  }
  const title = p(0, -1.6);
  parts.push(text(title, `${tr(lang, "Schnitt", "Section")} ${label}-${label}`, { size: 5, bold: true }));
  parts.push(text([title[0], title[1] + 6], tr(lang, `Schnittführung siehe A-101 (bei x = ${decimal(lang, x)} m ab Außenkante West)`, `Section line see A-101 (at x = ${decimal(lang, x)} m from the west outer face)`), { size: 2.6 }));
  parts.push(text(p(0, 7.4), tr(lang, "Süd", "South"), { size: 2.6 }), text(p(SIZE[1], 7.4), tr(lang, "Nord", "North"), { size: 2.6, anchor: "end" }));
  return parts.join("");
};

const inPolygon = ([x, y]: Pt, poly: readonly Pt[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const A301: Sheet = {
  id: "A-301",
  paper: "A1",
  scale: 50,
  title: t("Schnitte A-A und B-B", "Sections A-A and B-B"),
  discipline: t("Architektur", "Architecture"),
  notes: [
    t("Höhenkoten in m, bezogen auf ±0,00 = OK Fertigfußboden EG.", "Levels in m, relative to ±0.00 = top of finished floor, ground floor."),
    t("Lichte Raumhöhen in m: Fertigfußboden bis Unterkante Decke bzw. Unterkante abgehängte Decke.", "Clear room heights in m: finished floor to the underside of the ceiling or of the suspended ceiling."),
    t("Maße in m, Maße unter 1 m in cm.", "Dimensions in m, below 1 m in cm."),
  ],
  body: (lang) => [section(lang, 11, [95, 330], "A"), section(lang, 2, [460, 330], "B")].join(""),
};

const H_VIEW: PlanView = { ox: 60, oy: 300, scale: 100 };
const VL = "#c8102e";
const RL = "#1f4fd1";
const TWK = "#1a8a3a";
const TWW = "#b0179a";
const PAIR = 0.1;

const H_BACKGROUND = { ...BACKGROUND, labelSize: 2, edgeWidth: 0.12 };

/** A run offset sideways by `d` metres (left of its direction), mitred at the corners. */
const offsetRun = (points: readonly Pt[], d: number): Pt[] =>
  points.map((p, index) => {
    const normal = (a: Pt, b: Pt): Pt => {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    };
    const n1 = index > 0 ? normal(points[index - 1]!, p) : undefined;
    const n2 = index < points.length - 1 ? normal(p, points[index + 1]!) : undefined;
    if (!n1 || !n2) {
      const n = (n1 ?? n2)!;
      return [p[0] + n[0] * d, p[1] + n[1] * d];
    }
    const k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    return [p[0] + ((n1[0] + n2[0]) * d) / k, p[1] + ((n1[1] + n2[1]) * d) / k];
  });

const drawnPipe = (p: Pt) => drawnAt(HEATING_DRAWN, p);

const heatingRuns = () => {
  const runs: Pt[][] = [];
  for (const pipe of HEATING) {
    const last = runs.at(-1);
    if (last && last.at(-1)![0] === pipe.a[0] && last.at(-1)![1] === pipe.a[1]) last.push(pipe.b);
    else runs.push([pipe.a, pipe.b]);
  }
  return runs.map((run) => run.map(drawnPipe));
};

const H101: Sheet = {
  id: "H-101",
  paper: "A2",
  scale: 100,
  title: t("Heizung und Sanitär Grundriss UG", "Heating and plumbing plan, basement"),
  discipline: t("Heizung/Sanitär", "Heating/plumbing"),
  notes: [
    t("Vorlauf (VL) und Rücklauf (RL) verlaufen parallel; Maße und DN gelten jeweils für beide Leitungen.", "Supply (VL) and return (RL) run in parallel; dimensions and DN apply to both pipes."),
    t("Rohrleitungen sind von den Achsen aus auf die Rohrachse bemaßt (Anfang, Abzweige, Richtungswechsel, Strangfuß). Unterstrichene Maße sind nicht maßstäblich gezeichnet; es gilt das Maß.", "Pipes are dimensioned from the axes to the pipe axis (start, branches, changes of direction, riser foot). Underlined dimensions are not drawn to scale; the dimension governs."),
    t("Verteilleitungen unter der UG-Decke, Rohrachse −0,45. Steigstränge siehe Strangschema H-501.", "Distribution pipes under the basement ceiling, pipe axis −0.45. Risers see riser diagram H-501."),
    t("TWK/TWW = Trinkwasser kalt/warm (Sanitär).", "TWK/TWW = drinking water cold/hot (plumbing)."),
  ],
  legend: {
    box: { x: 335, y: 22, w: 240, h: 100 },
    entries: [
      { code: "vl", name: t("Heizung Vorlauf (VL)", "Heating supply (VL)") },
      { code: "rl", name: t("Heizung Rücklauf (RL)", "Heating return (RL)") },
      { code: "twk", name: t("Trinkwasser kalt (TWK)", "Drinking water cold (TWK)") },
      { code: "tww", name: t("Trinkwasser warm (TWW)", "Drinking water hot (TWW)") },
      { code: "riser", name: t("Steigstrang VL/RL ↑", "Riser VL/RL ↑") },
      { code: "boiler", name: t("Wärmeerzeuger / Verteiler", "Boiler / manifold") },
      { code: "reducer", name: t("Reduzierung (DN-Wechsel)", "Reducer (change of DN)") },
    ],
  },
  body: (lang) => {
    const parts = [floorPlan(H_VIEW, FLOORS.UG, lang, H_BACKGROUND)];
    for (const run of heatingRuns())
      parts.push(
        polyline(offsetRun(run, PAIR).map((q) => toPaper(H_VIEW, q)), { stroke: VL, width: 0.35 }),
        polyline(offsetRun(run, -PAIR).map((q) => toPaper(H_VIEW, q)), { stroke: RL, width: 0.35, dash: "1.2 0.6" }),
      );
    const refs = axisReferences(HEATING.flatMap((pipe) => [pipe.a, pipe.b].map((stated) => ({ stated, drawn: drawnPipe(stated) }))), 0.6);
    parts.push(axisGrid(H_VIEW, lang, 2.2), referenceDims(H_VIEW, lang, refs, "#000", 2));
    HEATING.forEach((pipe, index) => {
      const a = drawnPipe(pipe.a);
      const b = drawnPipe(pipe.b);
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ux = (b[0] - a[0]) / length;
      const uy = (b[1] - a[1]) / length;
      const horizontal = Math.abs(ux) > 0.5;
      const at = toPaper(H_VIEW, [(a[0] + b[0]) / 2 - (horizontal ? 0 : 0.3), (a[1] + b[1]) / 2 - (horizontal ? 0.3 : 0)]);
      parts.push(text([at[0], at[1] + (horizontal ? 2 : 0)], `DN ${pipe.dn}`, { size: 2, anchor: "middle", rotate: horizontal ? 0 : -90, bold: true }));
      const next = HEATING[index + 1];
      if (next && next.a[0] === pipe.b[0] && next.a[1] === pipe.b[1] && next.dn !== pipe.dn) {
        const c = toPaper(H_VIEW, b);
        const along: Pt = [ux, -uy];
        const side: Pt = [-along[1], along[0]];
        parts.push(polygon([[c[0] - along[0] * 1.2 + side[0] * 2.2, c[1] - along[1] * 1.2 + side[1] * 2.2], [c[0] + along[0] * 0.6 + side[0] * 1.4, c[1] + along[1] * 0.6 + side[1] * 1.4], [c[0] + along[0] * 0.6 - side[0] * 1.4, c[1] + along[1] * 0.6 - side[1] * 1.4], [c[0] - along[0] * 1.2 - side[0] * 2.2, c[1] - along[1] * 1.2 - side[1] * 2.2]], { stroke: "#000", width: 0.2 }));
      }
    });
    for (const riser of RISERS) {
      const c = toPaper(H_VIEW, drawnPipe(riser.at));
      parts.push(circle([c[0] - 1, c[1]], 0.9, { fill: VL, stroke: VL }), circle([c[0] + 1, c[1]], 0.9, { fill: RL, stroke: RL }), text([c[0] - 2.5, c[1] - 1.8], `${riser.id} ↑`, { size: 2.4, bold: true, anchor: "end" }));
    }
    const boiler = toPaper(H_VIEW, [BOILER[0] - 0.4, BOILER[1]]);
    const manifold = toPaper(H_VIEW, MANIFOLD);
    parts.push(
      rect(boiler[0] - 4, boiler[1] - 4, 8, 8, { width: 0.4, fill: "#fff" }),
      text([boiler[0], boiler[1] + 0.8], tr(lang, "WE", "B"), { size: 2.2, anchor: "middle", bold: true }),
      text([boiler[0], boiler[1] + 7], tr(lang, "Gas-Brennwertkessel", "Gas condensing boiler"), { size: 2, anchor: "middle" }),
      rect(manifold[0] - 1, manifold[1] - 3, 2, 6, { width: 0.3, fill: "#000" }),
      text([manifold[0] + 2, manifold[1] + 6], tr(lang, "Verteiler", "Manifold"), { size: 2 }),
    );
    for (const water of WATER) {
      const color = water.system === "TWK" ? TWK : TWW;
      parts.push(polyline(water.points.map((q) => toPaper(H_VIEW, q)), { stroke: color, width: 0.35, dash: water.system === "TWW" ? "2 0.8 0.5 0.8" : undefined }));
      const [a, b] = [water.points[0]!, water.points[1]!];
      const label = toPaper(H_VIEW, [a[0] + (b[0] - a[0]) * (water.system === "TWK" ? 0.3 : 0.7), a[1] + (water.system === "TWK" ? 0.08 : -0.3)]);
      parts.push(text(label, `${water.system} DN ${water.dn}`, { size: 2, anchor: "middle", fill: color, bold: true }));
      if (water.system === "TWW") {
        parts.push(planDim(H_VIEW, lang, a, b, -0.4, { size: 2, color: TWW }), planDim(H_VIEW, lang, b, water.points[2]!, -0.4, { size: 2, color: TWW }));
      }
    }
    const meter = toPaper(H_VIEW, [5.0, 10.78]);
    parts.push(rect(meter[0] - 1.5, meter[1] - 1.5, 3, 3, { stroke: TWK, width: 0.3, fill: "#fff" }), text([meter[0], meter[1] + 4], tr(lang, "WZ", "WM"), { size: 1.8, anchor: "middle", fill: TWK }));
    const legend = H101.legend!.box;
    const sample = (color: string, dash?: string) => line([-5, 0], [5, 0], { stroke: color, width: 0.5, dash });
    const symbols: Record<string, string> = {
      vl: sample(VL),
      rl: sample(RL, "1.2 0.6"),
      twk: sample(TWK),
      tww: sample(TWW, "2 0.8 0.5 0.8"),
      riser: circle([-1, 0], 0.9, { fill: VL, stroke: VL }) + circle([1, 0], 0.9, { fill: RL, stroke: RL }),
      boiler: rect(-5, -2.5, 5, 5, { width: 0.4 }) + rect(2, -3, 1.5, 6, { fill: "#000", stroke: "#000" }),
      reducer: polygon([[-1.2, -2.2], [0.6, -1.4], [0.6, 1.4], [-1.2, 2.2]], { width: 0.2 }),
    };
    void legend;
    parts.push(legendBox(H101, lang, symbols));
    const title = toPaper(H_VIEW, [0, -2]);
    parts.push(text(title, tr(lang, "Heizung und Sanitär – Untergeschoss", "Heating and plumbing – basement"), { size: 4.5, bold: true }), text([title[0], title[1] + 5.5], tr(lang, "FFB UG −2,95", "finished floor basement −2.95"), { size: 2.6 }));
    return parts.join("");
  },
};

const H501: Sheet = {
  id: "H-501",
  paper: "A3",
  title: t("Strangschema Heizung", "Heating riser diagram"),
  discipline: t("Heizung/Sanitär", "Heating/plumbing"),
  notes: [
    t("Schema ohne Maßstab. Höhenkoten in m auf Rohrachse, bezogen auf ±0,00 = OK FFB EG.", "Diagram not to scale. Levels in m at the pipe axis, relative to ±0.00 = finished floor, ground floor."),
    t("VL und RL je Strang parallel; die DN gilt für beide Leitungen.", "VL and RL of each riser run in parallel; the DN applies to both pipes."),
    t("Längen der Verteilleitungen siehe Grundriss H-101.", "Lengths of the distribution pipes see plan H-101."),
  ],
  body: (lang) => {
    const zy = (z: number) => 112 - z * 18;
    const xs = [100, 165, 230, 295];
    const parts: string[] = [];
    for (const [z, name] of [
      [-2.95, tr(lang, "FFB UG", "fin. floor B")],
      [0, tr(lang, "FFB EG", "fin. floor GF")],
      [3.3, tr(lang, "FFB OG", "fin. floor UF")],
    ] as const) {
      parts.push(line([45, zy(z)], [340, zy(z)], { stroke: "#888", width: 0.2, dash: "3 1.5" }), text([45, zy(z) - 1.2], `${level(lang, z)} ${name}`, { size: 2.4, fill: "#555" }));
    }
    const dist = zy(-0.45);
    parts.push(
      line([60, dist - 1.2], [xs[3]! - 1.2, dist - 1.2], { stroke: VL, width: 0.45 }),
      line([60, dist + 1.2], [xs[3]! + 1.2, dist + 1.2], { stroke: RL, width: 0.45, dash: "1.2 0.6" }),
      text([60, dist + 7], tr(lang, "Verteilung UG vom Verteiler, Rohrachse −0,45", "Basement distribution from the manifold, pipe axis −0.45"), { size: 2.3 }),
    );
    const horizontalDn = [32, 25, 20];
    horizontalDn.forEach((dn, index) => parts.push(text([(xs[index]! + xs[index + 1]!) / 2, dist - 3], `DN ${dn}`, { size: 2.3, anchor: "middle", bold: true })));
    parts.push(text([(60 + xs[0]!) / 2, dist - 3], "DN 40", { size: 2.3, anchor: "middle", bold: true }));
    RISERS.forEach((riser, index) => {
      const x = xs[index]!;
      const top = riser.runs.at(-1)!.to;
      parts.push(
        line([x - 1.2, dist - 1.2], [x - 1.2, zy(top)], { stroke: VL, width: 0.45 }),
        line([x + 1.2, dist + 1.2], [x + 1.2, zy(top)], { stroke: RL, width: 0.45, dash: "1.2 0.6" }),
        text([x, zy(top) - 7], riser.id, { size: 3.4, anchor: "middle", bold: true }),
      );
      for (const run of riser.runs) {
        parts.push(text([x - 3, (zy(run.from) + zy(run.to)) / 2], `DN ${run.dn}`, { size: 2.3, anchor: "middle", rotate: -90, bold: true }));
        for (const z of [run.from, run.to]) {
          parts.push(line([x + 2.5, zy(z)], [x + 6, zy(z)], { width: 0.2 }), text([x + 7, zy(z) + (z === -0.45 ? 4.5 : 0.9)], level(lang, z), { size: 2.3 }));
        }
        if (run.to !== -0.45) {
          parts.push(
            line([x - 1.2, zy(run.to) - 1.2], [x - 11, zy(run.to) - 1.2], { stroke: VL, width: 0.35 }),
            line([x + 1.2, zy(run.to) + 1.2], [x - 11, zy(run.to) + 1.2], { stroke: RL, width: 0.35, dash: "1.2 0.6" }),
            text([x - 12, zy(run.to) - 2.6], run.to > 3 ? tr(lang, "HK OG", "circuit UF") : tr(lang, "HK EG", "circuit GF"), { size: 2, anchor: "end" }),
          );
        }
      }
      parts.push(line([x - 3, zy(top) - 0.2], [x + 3, zy(top) - 0.2], { width: 0.6 }));
    });
    parts.push(text([45, 30], tr(lang, "Strangschema Heizung – Stränge ST1 bis ST4", "Heating riser diagram – risers ST1 to ST4"), { size: 4.5, bold: true }));
    return parts.join("");
  },
};

const SURVEY_VIEW: PlanView = { ox: 70, oy: 165, scale: 100 };
/** The old plan is a reduced, slightly rotated copy: it is not true to its nominal 1:100. */
const COPY = { factor: 0.96, rotate: 0.6, centre: [176, 110] as Pt };

const speckles = (box: Box, count: number) => {
  let seed = 1987;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: count }, () => circle([box.x + random() * box.w, box.y + random() * box.h], 0.08 + random() * 0.18, { stroke: "none", fill: `rgb(${90 + Math.round(random() * 90)},${90 + Math.round(random() * 90)},${90 + Math.round(random() * 90)})` })).join("");
};

const A100: Sheet = {
  id: "A-100",
  paper: "A3",
  scale: 100,
  title: t("Grundriss UG, Bestand (Altplan)", "Basement floor plan, existing (old drawing)"),
  discipline: t("Architektur", "Architecture"),
  ownScaleBar: true,
  notes: [
    t("Bestand: Altplan von 1987 als Kopie eingefügt. Nur die Außenmaße sind bemaßt; Innenmaße sind abzugreifen.", "Existing: old drawing from 1987 inserted as a copy. Only the overall dimensions are given; interior dimensions are to be scaled."),
    t("Die Kopie ist nicht maßhaltig: vor dem Abgreifen an Maßstabsleiste und Außenmaßen kalibrieren.", "The copy is not true to scale: calibrate on the scale bar and the overall dimensions before scaling."),
    t("Maße in m.", "Dimensions in m."),
  ],
  body: (lang) => {
    const style = { ...ARCH, wall: "#4a4a4a", labelSize: 2.2, edgeWidth: 0.2 };
    const at = toPaper(SURVEY_VIEW, [0, -2.6]);
    const [cx, cy] = COPY.centre;
    const old = [
      rect(40, 30, 300, 175, { stroke: "none", fill: "#f3f1e8" }),
      floorPlan(SURVEY_VIEW, FLOORS.UG, lang, style),
      planDim(SURVEY_VIEW, lang, [0, 0], [SIZE[0], 0], -1.2, { size: 2.4 }),
      planDim(SURVEY_VIEW, lang, [0, 0], [0, SIZE[1]], 1.2, { size: 2.4 }),
      text(at, tr(lang, "Grundriss Kellergeschoss", "Basement floor plan"), { size: 4.5, bold: true }),
      text([at[0], at[1] + 5.5], tr(lang, "M 1:100 – Bestand 1987", "scale 1:100 – existing 1987"), { size: 2.6 }),
      scaleBar([at[0] + 120, at[1] + 2], 100, 5, tr(lang, "Maßstabsleiste 1:100", "Scale bar 1:100")),
      speckles({ x: 40, y: 30, w: 300, h: 175 }, 1500),
    ].join("");
    return `<defs><filter id="scan" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation="0.12"/></filter></defs><g filter="url(#scan)" transform="translate(${cx} ${cy}) rotate(${COPY.rotate}) scale(${COPY.factor}) translate(${-cx} ${-cy})">${old}</g>`;
  },
};

/** The plan set every task works from, in sheet order. */
export const SHEETS: Sheet[] = [A100, A101, A301, E101, E102, H101, H501];
