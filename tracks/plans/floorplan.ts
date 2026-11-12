/**
 * Floor plans drawn from the building data: walls, openings with their size labels, room stamps,
 * dimension chains, electrical device symbols placed along walls and on a ceiling grid, and cable
 * trays with their dimensions.
 */
import type { Lang } from "../../src/types";
import { AXES, SIZE, devicesOf, drawnAt, length, type Code, type Device, type Floor, type Opening, type Room } from "./building";
import { circle, dimRich, dimension, group, line, path, planDim, polygon, polyline, rect, text, toPaper, type PlanView, type Pt, type Rich } from "./drawing";

export type FloorStyle = { wall: string; edge: string; edgeWidth: number; label: string; labelSize: number; doors: string };

export const ARCH: FloorStyle = { wall: "#3c3c3c", edge: "#000", edgeWidth: 0.3, label: "#000", labelSize: 3, doors: "#000" };
export const BACKGROUND: FloorStyle = { wall: "#cfcfcf", edge: "#9a9a9a", edgeWidth: 0.15, label: "#7a7a7a", labelSize: 2.4, doors: "#b0b0b0" };

const bounds = (poly: readonly Pt[]) => {
  const xs = poly.map(([x]) => x);
  const ys = poly.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as const;
};

/** Where devices go: the room's placement box or its bounding box. */
export const placeOf = (room: Room) => room.place ?? bounds(room.poly);

/** Where the room stamp goes. */
export const stampOf = (room: Room): Pt => {
  const [x0, y0, x1, y1] = placeOf(room);
  return room.stamp ?? [(x0 + x1) / 2, (y0 + y1) / 2];
};

const openingBox = (o: Opening) =>
  o.along === "x"
    ? ([o.at - o.width / 2, o.faces[0], o.at + o.width / 2, o.faces[1]] as const)
    : ([o.faces[0], o.at - o.width / 2, o.faces[1], o.at + o.width / 2] as const);

/** The point in model space of (along, across) on an opening's wall. */
const onWall = (o: Opening, along: number, across: number): Pt => (o.along === "x" ? [along, across] : [across, along]);

const doorLeaves = (view: PlanView, o: Opening, color: string) => {
  const swing = o.swing ?? 1;
  const face = swing > 0 ? o.faces[1] : o.faces[0];
  const start = o.at - o.width / 2;
  const end = o.at + o.width / 2;
  const leaves: Array<[number, number, number]> =
    o.width > 1.5 ? [[start, o.width / 2, o.at], [end, o.width / 2, o.at]] : [[(o.hinge ?? -1) < 0 ? start : end, o.width, (o.hinge ?? -1) < 0 ? end : start]];
  return leaves
    .map(([hinge, leaf, close]) => {
      const h = toPaper(view, onWall(o, hinge, face));
      const open = toPaper(view, onWall(o, hinge, face + swing * leaf));
      const shut = toPaper(view, onWall(o, close, face));
      const r = Math.hypot(open[0] - h[0], open[1] - h[1]);
      const a1 = Math.atan2(open[1] - h[1], open[0] - h[0]);
      const a2 = Math.atan2(shut[1] - h[1], shut[0] - h[0]);
      let delta = a2 - a1;
      while (delta <= -Math.PI) delta += 2 * Math.PI;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      return (
        line(h, open, { stroke: color, width: 0.25 }) +
        path(`M ${open[0]} ${open[1]} A ${r} ${r} 0 0 ${delta > 0 ? 1 : 0} ${shut[0]} ${shut[1]}`, { stroke: color, width: 0.15 })
      );
    })
    .join("");
};

/** An opening's size label as plans write it: width/height, with the sill height of a window. */
export const openingLabel = (lang: Lang, o: Opening): Rich => [
  ...[dimension(lang, o.width), dimension(lang, o.height)].flatMap((d, index) => [...(index ? ["/"] : []), ...[dimRich(d)].flat()]),
];

/** Walls (the footprint less the rooms), openings, and room stamps. */
export const floorPlan = (view: PlanView, floor: Floor, lang: Lang, style: FloorStyle, o: { openingLabels?: boolean } = {}) => {
  const parts = [polygon([[0, 0], [SIZE[0], 0], SIZE, [0, SIZE[1]]].map((p) => toPaper(view, p as Pt)), { fill: style.wall, stroke: style.edge, width: style.edgeWidth })];
  for (const room of floor.rooms) parts.push(polygon(room.poly.map((p) => toPaper(view, p)), { fill: "#fff", stroke: style.edge, width: style.edgeWidth }));
  for (const opening of floor.openings) {
    const [x0, y0, x1, y1] = openingBox(opening);
    const a = toPaper(view, [x0, y1]);
    const b = toPaper(view, [x1, y0]);
    parts.push(rect(a[0], a[1], b[0] - a[0], b[1] - a[1], { fill: "#fff", stroke: "none" }));
    const jambs = [opening.at - opening.width / 2, opening.at + opening.width / 2];
    for (const along of jambs) parts.push(line(toPaper(view, onWall(opening, along, opening.faces[0])), toPaper(view, onWall(opening, along, opening.faces[1])), { stroke: style.edge, width: style.edgeWidth }));
    if (opening.kind === "window") {
      const mid = (opening.faces[0] + opening.faces[1]) / 2;
      for (const across of [mid - 0.03, mid + 0.03, opening.faces[0], opening.faces[1]])
        parts.push(line(toPaper(view, onWall(opening, jambs[0]!, across)), toPaper(view, onWall(opening, jambs[1]!, across)), { stroke: style.edge, width: across === opening.faces[0] || across === opening.faces[1] ? style.edgeWidth : 0.15 }));
    } else parts.push(doorLeaves(view, opening, style.doors));
    if (o.openingLabels) {
      const outward = opening.kind === "window" ? (opening.faces[0] < 1 ? -1 : 1) : (opening.swing ?? 1);
      const face = outward > 0 ? opening.faces[1] : opening.faces[0];
      const sill = opening.sill !== undefined ? ["  ", lang === "de" ? "BRH " : "sill ", ...[dimRich(dimension(lang, opening.sill))].flat()] : [];
      const runs: Rich = [...[openingLabel(lang, opening)].flat(), ...sill];
      const distance = opening.kind === "door" ? opening.width / (opening.width > 1.5 ? 2 : 1) + 0.25 : 0.32;
      const at = toPaper(view, onWall(opening, opening.at, face + outward * distance));
      const rotate = opening.along === "y" ? -90 : 0;
      const shift: Pt = opening.along === "x" ? [0, outward > 0 ? 0 : 2.2] : [outward > 0 ? 2.2 : 0, 0];
      parts.push(text([at[0] + shift[0], at[1] + shift[1]], runs, { size: 2.2, anchor: "middle", rotate }));
    }
  }
  for (const room of floor.rooms) {
    const at = toPaper(view, stampOf(room));
    parts.push(
      text([at[0], at[1] - 0.6], room.id, { size: style.labelSize * 1.15, anchor: "middle", bold: true, fill: style.label }),
      text([at[0], at[1] + style.labelSize * 0.9], room.name[lang], { size: style.labelSize * 0.85, anchor: "middle", fill: style.label }),
    );
  }
  return parts.join("");
};

/** The exterior dimension chains: wall and room widths along each side, and the overall size. */
export const exteriorChains = (view: PlanView, floor: Floor, lang: Lang) => {
  const parts: string[] = [];
  const sides = [
    { axis: 0, face: 0.3, outer: 0, a: (t: number): Pt => [t, 0], dir: -1 },
    { axis: 0, face: 11.5, outer: SIZE[1], a: (t: number): Pt => [t, SIZE[1]], dir: 1 },
    { axis: 1, face: 0.3, outer: 0, a: (t: number): Pt => [0, t], dir: -1 },
    { axis: 1, face: 21, outer: SIZE[0], a: (t: number): Pt => [SIZE[0], t], dir: 1 },
  ];
  for (const side of sides) {
    const across = side.axis === 0 ? 1 : 0;
    const breaks = new Set<number>([0, SIZE[side.axis]!]);
    for (const room of floor.rooms) {
      const touches = room.poly.some((p) => Math.abs(p[across]! - side.face) < 1e-6);
      if (!touches) continue;
      for (const p of room.poly) if (Math.abs(p[across]! - side.face) < 1e-6) breaks.add(Math.round(p[side.axis]! * 1000) / 1000);
    }
    const points = [...breaks].sort((a, b) => a - b);
    const offsetSign = side.axis === 0 ? (side.dir < 0 ? -1 : 1) : side.dir < 0 ? 1 : -1;
    for (let index = 0; index + 1 < points.length; index++)
      parts.push(planDim(view, lang, side.a(points[index]!), side.a(points[index + 1]!), offsetSign * 1.1 * (side.axis === 0 ? 1 : 1), { size: 2.2 }));
    parts.push(planDim(view, lang, side.a(0), side.a(SIZE[side.axis]!), offsetSign * 1.9, { size: 2.4 }));
  }
  return parts.join("");
};

/** Clear dimensions inside each room: width and depth, and both legs of an L-shaped room. */
export const roomDims = (view: PlanView, floor: Floor, lang: Lang) =>
  floor.rooms
    .flatMap((room) => {
      const [x0, y0, x1, y1] = bounds(room.poly);
      if (room.poly.length === 4) {
        const dy = y1 - y0 < 2 ? (y1 - y0) * 0.75 : Math.min(0.9, (y1 - y0) * 0.25);
        const dx = Math.min(0.9, (x1 - x0) * 0.22);
        return [planDim(view, lang, [x0, y0 + dy], [x1, y0 + dy], 0, { size: 2.2 }), planDim(view, lang, [x1 - dx, y0], [x1 - dx, y1], 0, { size: 2.2 })];
      }
      const [px0, py0, , py1] = placeOf(room);
      return [
        planDim(view, lang, [x0, y0 + 0.6], [x1, y0 + 0.6], 0, { size: 2.2 }),
        planDim(view, lang, [px0, py1 - 0.6], [x1, py1 - 0.6], 0, { size: 2.2 }),
        planDim(view, lang, [x1 - 0.7, y0], [x1 - 0.7, y1], 0, { size: 2.2 }),
        planDim(view, lang, [x0 + 0.9, y0], [x0 + 0.9, py0 === y0 ? Math.max(...room.poly.filter(([x]) => Math.abs(x - x0) < 1e-6).map(([, y]) => y)) : py0], 0, { size: 2.2 }),
      ];
    })
    .join("");

const GREY = "#9a9a9a";

/** A device glyph in local millimetres: the wall it sits on is above (−y). */
export const glyph = (code: Code, color = "#000") => {
  const s = { stroke: color, width: 0.3 };
  const socket = path("M -1.8 -0.9 A 1.8 1.8 0 0 0 1.8 -0.9", s) + line([-1.8, -0.9], [1.8, -0.9], s) + line([0, -0.9], [0, -2.9], s);
  const lever = (dx: number) => line([dx * 0.7, 0.7], [dx * 2.1, 2.3], s) + line([dx * 2.1, 2.3], [dx * 2.1 + 0.7, 2.3 - dx * 0.6], s);
  const switchBase = circle([0, 0], 1, { ...s, fill: "#fff" }) + line([0, -1], [0, -2.9], s);
  const lamp = circle([0, 0], 2, { ...s, fill: "#fff" }) + line([-1.41, -1.41], [1.41, 1.41], s) + line([-1.41, 1.41], [1.41, -1.41], s);
  const detector = (letters: string) => rect(-2.2, -2.2, 4.4, 4.4, { ...s, fill: "#fff" }) + text([0, 0.75], letters, { size: 2, anchor: "middle", fill: color });
  switch (code) {
    case "E1":
      return socket;
    case "E2":
      return socket + line([-0.8, -1.6], [0.8, -2.0], s) + line([-0.8, -2.3], [0.8, -2.7], s);
    case "E3":
      return switchBase + lever(1);
    case "E4":
      return switchBase + lever(1) + lever(-1);
    case "E5":
      return lamp;
    case "E6":
      return lamp + circle([0, 0], 0.6, { stroke: color, width: 0.2, fill: color });
    case "E7":
      return detector("RM");
    case "E8":
      return detector("BM");
    case "E9":
      return polygon([[-1.7, -0.9], [1.7, -0.9], [0, 2]], s) + line([0, -0.9], [0, -2.9], s);
  }
};

const CEILING = new Set<Code>(["E5", "E6", "E7", "E8"]);

const distanceToSegment = (p: Pt, a: Pt, b: Pt) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};

const edges = (poly: readonly Pt[]) => poly.map((p, index) => [p, poly[(index + 1) % poly.length]!] as const);

/** Device symbols of a floor: placed by construction, so every symbol sits clearly inside its room. */
export const devicePlan = (view: PlanView, floor: Floor, keepout: ReadonlyArray<readonly [number, number, number, number]> = []) => {
  const parts: string[] = [];
  let circuit = 0;
  const blocked = (p: Pt) =>
    floor.trays.some((tray) => {
      const a = drawnAt(floor.drawn, tray.a);
      const b = drawnAt(floor.drawn, tray.b);
      const run = length(a, b);
      const ux = (b[0] - a[0]) / run;
      const uy = (b[1] - a[1]) / run;
      const along = (p[0] - a[0]) * ux + (p[1] - a[1]) * uy;
      const lateral = (p[1] - a[1]) * ux - (p[0] - a[0]) * uy;
      const half = tray.size / 2000;
      return along > -0.4 && along < run + 0.4 && Math.abs(lateral) < half + 0.4;
    }) || keepout.some(([x0, y0, x1, y1]) => p[0] > x0 - 0.2 && p[0] < x1 + 0.2 && p[1] > y0 - 0.2 && p[1] < y1 + 0.2);
  for (const room of floor.rooms) {
    const devices = devicesOf(room);
    const [x0, y0, x1, y1] = placeOf(room);
    const doors = floor.openings.filter((o) => o.kind === "door" && o.rooms.includes(room.id));
    const centre = stampOf(room);
    const stamp = (p: Pt) => Math.abs(p[0] - centre[0]) < 0.95 && Math.abs(p[1] - centre[1]) < 0.4;
    const inset = 0.2;
    const ring: Array<{ p: Pt; normal: Pt; t: number }> = [];
    const w = x1 - x0 - 2 * inset;
    const h = y1 - y0 - 2 * inset;
    for (let t = 0; t < 2 * (w + h); t += 0.05) {
      const p: Pt = t < w ? [x0 + inset + t, y0 + inset] : t < w + h ? [x1 - inset, y0 + inset + t - w] : t < 2 * w + h ? [x1 - inset - (t - w - h), y1 - inset] : [x0 + inset, y1 - inset - (t - 2 * w - h)];
      const normal: Pt = t < w ? [0, 1] : t < w + h ? [-1, 0] : t < 2 * w + h ? [0, -1] : [1, 0];
      const wall: Pt = [p[0] - normal[0] * inset, p[1] - normal[1] * inset];
      const onWall = edges(room.poly).some(([a, b]) => distanceToSegment(wall, a, b) < 0.01);
      const corner = Math.min(Math.abs(p[0] - x0 - inset), Math.abs(p[0] - x1 + inset)) < 0.35 && Math.min(Math.abs(p[1] - y0 - inset), Math.abs(p[1] - y1 + inset)) < 0.35;
      const door = doors.some((o) => Math.hypot(...([0, 1].map((i) => p[i]! - onWallPoint(o)[i]!) as [number, number])) < o.width / 2 + 0.35);
      if (onWall && !corner && !door && !blocked(p) && !stamp(p)) ring.push({ p, normal, t });
    }
    const placed: Pt[] = [];
    const take = (target: (c: { p: Pt; t: number }) => number) => {
      const free = ring.filter((c) => placed.every((q) => Math.hypot(c.p[0] - q[0], c.p[1] - q[1]) > 0.75));
      const best = free.sort((a, b) => target(a) - target(b))[0];
      if (!best) throw new Error(`No wall position left in room ${room.id}`);
      placed.push(best.p);
      return best;
    };
    const wallDevices = devices.filter((d) => !CEILING.has(d.code));
    const switches = wallDevices.filter((d) => d.code === "E3" || d.code === "E4");
    const others = wallDevices.filter((d) => d.code !== "E3" && d.code !== "E4");
    const perimeter = 2 * (w + h);
    const spots: Array<{ device: Device; p: Pt; normal: Pt; t?: number }> = [];
    switches.forEach((device, index) => {
      const target = onWallPoint(doors[index % Math.max(1, doors.length)] ?? doors[0]!);
      const spot = take((c) => Math.hypot(c.p[0] - target[0], c.p[1] - target[1]));
      spots.push({ device, p: spot.p, normal: ring.find((c) => c.p === spot.p)!.normal });
    });
    others.forEach((device, index) => {
      const goal = ((index + 0.5) / others.length) * perimeter;
      const spot = take((c) => Math.min(Math.abs(c.t - goal), perimeter - Math.abs(c.t - goal)));
      spots.push({ device, p: spot.p, normal: ring.find((c) => c.p === spot.p)!.normal, t: spot.t });
    });
    const ceiling = devices.filter((d) => CEILING.has(d.code));
    if (ceiling.length) {
      const ci = Math.min(0.5, (y1 - y0) * 0.25, (x1 - x0) * 0.25);
      const cw = x1 - x0 - 2 * ci;
      const ch = y1 - y0 - 2 * ci;
      let cols = Math.max(1, Math.ceil(Math.sqrt((ceiling.length * cw) / ch)));
      let rows = Math.max(1, Math.ceil(ceiling.length / cols));
      for (let attempt = 0; ; attempt++) {
        const cells: Pt[] = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const p: Pt = [x0 + ci + ((c + 0.5) * cw) / cols, y0 + ci + ((r + 0.5) * ch) / rows];
            if (!blocked(p) && !stamp(p) && spots.every((s) => Math.hypot(s.p[0] - p[0], s.p[1] - p[1]) > 0.5)) cells.push(p);
          }
        if (cells.length >= ceiling.length) {
          const step = cells.length / ceiling.length;
          ceiling.forEach((device, index) => spots.push({ device, p: cells[Math.floor(index * step)]!, normal: [0, 0] }));
          break;
        }
        if (attempt > 20) throw new Error(`No ceiling grid fits room ${room.id}`);
        if (attempt % 2) rows++;
        else cols++;
      }
    }
    const wire = (points: Pt[], label: boolean) => {
      if (points.length < 2) return;
      circuit++;
      parts.push(polyline(points.map((q) => toPaper(view, q)), { stroke: "#7a7a7a", width: 0.13 }));
      if (label) {
        const at = toPaper(view, points[0]!);
        parts.push(text([at[0] + 2.6, at[1] + 3.6], `F${circuit}`, { size: 1.8, fill: "#7a7a7a" }));
      }
    };
    const inward = (s: (typeof spots)[number]): Pt => [s.p[0] + s.normal[0] * 0.3, s.p[1] + s.normal[1] * 0.3];
    wire(spots.filter((s) => s.t !== undefined).sort((a, b) => a.t! - b.t!).map(inward), true);
    const firstSwitch = spots.find((s) => s.device.code === "E3" || s.device.code === "E4");
    const lights = spots.filter((s) => s.device.code === "E5" || s.device.code === "E6");
    wire([...(firstSwitch ? [inward(firstSwitch)] : []), ...lights.map((s) => s.p)], false);
    for (const { device, p, normal } of spots) {
      const at = toPaper(view, p);
      const color = device.existing ? GREY : "#000";
      const rotate = normal[0] || normal[1] ? (Math.atan2(-normal[0], -normal[1]) * 180) / Math.PI : 0;
      parts.push(group(at, rotate, glyph(device.code, color)));
      if (device.count > 1) {
        const offset: Pt = normal[0] || normal[1] ? [normal[0] * 4.6, -normal[1] * 4.6 + 0.9] : [3.6, 0.9];
        parts.push(text([at[0] + offset[0], at[1] + offset[1]], `${device.count}×`, { size: 2.5, anchor: normal[0] || normal[1] ? "middle" : "start", bold: true, fill: color }));
      }
    }
  }
  return parts.join("");
};

const onWallPoint = (o: Opening): Pt => (o.along === "x" ? [o.at, (o.faces[0] + o.faces[1]) / 2] : [(o.faces[0] + o.faces[1]) / 2, o.at]);

export const TRAY_COLOR = "#1f5fa8";

/** Cable trays drawn to width with their size labels, at their drawn positions. */
export const trayPlan = (view: PlanView, floor: Floor, labels: Record<"size" | "existing", (size: number) => string>) =>
  floor.trays
    .map((tray) => {
      const color = tray.existing ? GREY : TRAY_COLOR;
      const half = tray.size / 2000;
      const a = drawnAt(floor.drawn, tray.a);
      const b = drawnAt(floor.drawn, tray.b);
      const run = length(a, b);
      const ux = (b[0] - a[0]) / run;
      const uy = (b[1] - a[1]) / run;
      const corners: Pt[] = [
        [a[0] - uy * half - ux * half, a[1] + ux * half - uy * half],
        [b[0] - uy * half + ux * half, b[1] + ux * half + uy * half],
        [b[0] + uy * half + ux * half, b[1] - ux * half + uy * half],
        [a[0] + uy * half - ux * half, a[1] - ux * half - uy * half],
      ];
      const body = polygon(corners.map((p) => toPaper(view, p)), { stroke: color, width: 0.3, fill: tray.existing ? "none" : "#dce8f6", dash: tray.existing ? "1.5 1" : undefined });
      const right: Pt = [uy, -ux];
      const p = toPaper(view, [a[0] + ux * run * 0.5 + right[0] * (half + 0.1), a[1] + uy * run * 0.5 + right[1] * (half + 0.1)]);
      const horizontal = Math.abs(ux) > 0.5;
      const shift: Pt = horizontal ? [0, right[1] < 0 ? 2.2 : 0] : [right[0] > 0 ? 2.2 : 0, 0];
      return body + text([p[0] + shift[0], p[1] + shift[1]], tray.existing ? labels.existing(tray.size) : labels.size(tray.size), { size: 2.2, anchor: "middle", rotate: horizontal ? 0 : -90, fill: color });
    })
    .join("");

const AXIS_STYLE = { stroke: "#555", width: 0.18, dash: "6 1.5 1 1.5" };

/** The axis grid: dash-dot lines with labelled bubbles and the axis dimension chains outside the building. */
export const axisGrid = (view: PlanView, lang: Lang, reach: number) => {
  const parts: string[] = [];
  const bubble = (p: Pt, label: string) => {
    const at = toPaper(view, p);
    parts.push(circle(at, 3.2, { stroke: "#333", width: 0.3, fill: "#fff" }), text([at[0], at[1] + 1.2], label, { size: 3.2, anchor: "middle" }));
  };
  for (const axis of AXES.x) {
    parts.push(line(toPaper(view, [axis.at, -reach]), toPaper(view, [axis.at, SIZE[1] + reach]), AXIS_STYLE));
    bubble([axis.at, -reach - 0.16 * (view.scale / 50)], axis.name);
    bubble([axis.at, SIZE[1] + reach + 0.16 * (view.scale / 50)], axis.name);
  }
  for (const axis of AXES.y) {
    parts.push(line(toPaper(view, [-reach, axis.at]), toPaper(view, [SIZE[0] + reach, axis.at]), AXIS_STYLE));
    bubble([-reach - 0.16 * (view.scale / 50), axis.at], axis.name);
    bubble([SIZE[0] + reach + 0.16 * (view.scale / 50), axis.at], axis.name);
  }
  const chainY = SIZE[1] + reach * 0.55;
  const chainX = -reach * 0.55;
  AXES.x.slice(1).forEach((axis, index) => parts.push(planDim(view, lang, [AXES.x[index]!.at, chainY], [axis.at, chainY], 0, { size: 2.4 })));
  AXES.y.slice(1).forEach((axis, index) => parts.push(planDim(view, lang, [chainX, AXES.y[index]!.at], [chainX, axis.at], 0, { size: 2.4 })));
  return parts.join("");
};

export type Reference = { from: Pt; to: Pt; offset: Pt; value: number };

/**
 * Dimensions from the nearest axis to each point of a route, as installation plans give them: one
 * per distinct x (north of the topmost point) and one per distinct y (east of the rightmost point).
 * Lengths follow from the stated positions; the drawing may depart from them (not to scale).
 */
export const axisReferences = (points: ReadonlyArray<{ stated: Pt; drawn: Pt }>, distance: number): Reference[] => {
  const nearest = (axes: ReadonlyArray<{ at: number }>, value: number) => axes.reduce((best, axis) => (Math.abs(axis.at - value) < Math.abs(best.at - value) ? axis : best));
  const refs: Reference[] = [];
  for (const axis of [0, 1] as const) {
    const groups = new Map<number, { stated: Pt; drawn: Pt }>();
    for (const point of points) {
      const key = Math.round(point.stated[axis] * 1000);
      const other = axis === 0 ? 1 : 0;
      const current = groups.get(key);
      if (!current || point.stated[other] > current.stated[other]) groups.set(key, point);
    }
    for (const { stated, drawn } of groups.values()) {
      const reference = nearest(axis === 0 ? AXES.x : AXES.y, stated[axis]);
      const value = Math.abs(stated[axis] - reference.at);
      if (value < 0.005) continue;
      const other = axis === 0 ? 1 : 0;
      const stacked = refs.filter((ref) => ref.offset[axis] === 0 && Math.abs(ref.to[other] - drawn[other]) < 0.01).length;
      const away = distance * (1 + stacked * 0.8);
      refs.push(
        axis === 0
          ? { from: [reference.at, drawn[1]], to: drawn, offset: [0, away], value }
          : { from: [drawn[0], reference.at], to: drawn, offset: [away, 0], value },
      );
    }
  }
  return refs;
};

/** Model boxes the reference dimensions occupy, for keeping symbols clear of them. */
export const referenceBoxes = (refs: readonly Reference[]) =>
  refs.map(({ from, to, offset }) => {
    const xs = [from[0], to[0], from[0] + offset[0], to[0] + offset[0]];
    const ys = [from[1], to[1], from[1] + offset[1], to[1] + offset[1]];
    return [Math.min(...xs) - (offset[0] ? 0.3 : 0), Math.min(...ys), Math.max(...xs), Math.max(...ys) + (offset[1] ? 0.3 : 0)] as const;
  });

export const referenceDims = (view: PlanView, lang: Lang, refs: readonly Reference[], color: string, size = 2.3) =>
  refs
    .map(({ from, to, offset, value }) => {
      const run = length(from, to);
      const left: Pt = [-(to[1] - from[1]) / run, (to[0] - from[0]) / run];
      return planDim(view, lang, from, to, left[0] * offset[0] + left[1] * offset[1], { color, size, value });
    })
    .join("");
