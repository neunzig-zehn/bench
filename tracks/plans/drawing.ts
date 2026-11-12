/**
 * Drawing primitives for the plans track: SVG in paper millimetres, German dimension notation,
 * the sheet frame with its zone grid, title block and scale bar, and PNG crops rendered with resvg.
 */
import { Resvg } from "@resvg/resvg-js";

import type { Lang } from "../../src/types";

export type Text = Record<Lang, string>;
export type Pt = readonly [number, number];
export type Box = { x: number; y: number; w: number; h: number };

const FONT = new URL("./fixtures/DejaVuSans.ttf", import.meta.url).pathname;
const n = (value: number) => String(Math.round(value * 1000) / 1000);

export const esc = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const decimal = (lang: Lang, value: number, digits = 2) => {
  const text = value.toFixed(digits);
  return lang === "de" ? text.replace(".", ",") : text;
};

/** A level as drawings write it: ±0,00, +3,30, −0,45. */
export const level = (lang: Lang, value: number) =>
  Math.abs(value) < 0.0005 ? `±${decimal(lang, 0)}` : `${value > 0 ? "+" : "−"}${decimal(lang, Math.abs(value))}`;

/**
 * A dimension as German drawings write it: metres with two decimals from 1 m, centimetres below 1 m,
 * and a superscript 5 for an extra half centimetre (4,26⁵ = 4.265 m, 11⁵ = 0.115 m).
 */
export const dimension = (lang: Lang, metres: number) => {
  const mm = Math.round(metres * 1000);
  if (mm % 5) throw new Error(`Dimension ${metres} m is not a multiple of 5 mm`);
  const cm = Math.floor(mm / 10);
  return { main: cm >= 100 ? decimal(lang, cm / 100) : String(cm), sup: mm % 10 ? "5" : "" };
};

export type Style = { stroke?: string; width?: number; fill?: string; dash?: string };
const style = ({ stroke = "#000", width = 0.25, fill = "none", dash }: Style = {}) =>
  `stroke="${stroke}" stroke-width="${n(width)}" fill="${fill}"${dash ? ` stroke-dasharray="${dash}"` : ""}`;

export const line = (a: Pt, b: Pt, s?: Style) => `<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" ${style(s)}/>`;
export const polyline = (points: readonly Pt[], s?: Style) =>
  `<polyline points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" ${style(s)}/>`;
export const polygon = (points: readonly Pt[], s?: Style) =>
  `<polygon points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" ${style(s)}/>`;
export const rect = (x: number, y: number, w: number, h: number, s?: Style) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${style(s)}/>`;
export const circle = (c: Pt, r: number, s?: Style) => `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r)}" ${style(s)}/>`;
export const path = (d: string, s?: Style) => `<path d="${d}" ${style(s)}/>`;
export const group = (at: Pt, rotate: number, body: string) => `<g transform="translate(${n(at[0])} ${n(at[1])}) rotate(${n(rotate)})">${body}</g>`;

export type TextStyle = {
  size?: number;
  anchor?: "start" | "middle" | "end";
  rotate?: number;
  fill?: string;
  bold?: boolean;
  underline?: boolean;
};

/** Text, or text runs where `{ sup }` is set superscript. */
export type Rich = string | ReadonlyArray<string | { sup: string }>;

/** A dimension's text runs. */
export const dimRich = ({ main, sup }: { main: string; sup: string }): Rich => (sup ? [main, { sup }] : main);

export const text = (at: Pt, content: Rich, o: TextStyle = {}) => {
  const size = o.size ?? 2.5;
  const runs = typeof content === "string" ? [content] : content;
  const body = runs
    .map((run) => (typeof run === "string" ? esc(run) : `<tspan baseline-shift="super" font-size="${n(size * 0.7)}">${esc(run.sup)}</tspan>`))
    .join("");
  const attributes = [
    `x="${n(at[0])}" y="${n(at[1])}" font-family="DejaVu Sans" font-size="${n(size)}"`,
    `text-anchor="${o.anchor ?? "start"}" fill="${o.fill ?? "#000"}"`,
    o.bold ? 'font-weight="bold"' : "",
    o.underline ? 'text-decoration="underline"' : "",
    o.rotate ? `transform="rotate(${n(o.rotate)} ${n(at[0])} ${n(at[1])})"` : "",
  ];
  return `<text ${attributes.filter(Boolean).join(" ")}>${body}</text>`;
};

/**
 * A dimension line between two paper points with oblique ticks and its text above the line. The
 * text is underlined when the length is not drawn to scale (DIN 406).
 */
export const dimLine = (a: Pt, b: Pt, label: { main: string; sup: string }, o: { color?: string; size?: number; underline?: boolean } = {}) => {
  const color = o.color ?? "#000";
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / length;
  const uy = (b[1] - a[1]) / length;
  let angle = (Math.atan2(uy, ux) * 180) / Math.PI;
  if (angle > 90.01) angle -= 180;
  if (angle <= -89.99) angle += 180;
  if (Math.abs(angle - 90) < 0.01) angle = -90;
  const rad = (angle * Math.PI) / 180;
  const up: Pt = [Math.sin(rad), -Math.cos(rad)];
  const tick = (p: Pt) => line([p[0] - (ux - uy) * 0.9, p[1] - (uy + ux) * 0.9], [p[0] + (ux - uy) * 0.9, p[1] + (uy + ux) * 0.9], { stroke: color, width: 0.3 });
  const mid: Pt = [(a[0] + b[0]) / 2 + up[0] * 0.7, (a[1] + b[1]) / 2 + up[1] * 0.7];
  return [
    line(a, b, { stroke: color, width: 0.18 }),
    tick(a),
    tick(b),
    text(mid, dimRich(label), { size: o.size ?? 2.5, anchor: "middle", rotate: angle, fill: color, underline: o.underline }),
  ].join("");
};

/** A plan drawn at a scale: model metres (y up) to paper millimetres (y down). */
export type PlanView = { ox: number; oy: number; scale: number };
export const toPaper = (view: PlanView, [x, y]: Pt): Pt => [view.ox + (x * 1000) / view.scale, view.oy - (y * 1000) / view.scale];

/**
 * A dimension of the model points a–b drawn `offset` metres to the left of a→b, with extension
 * lines from the points; `value` overrides the drawn length for a length not drawn to scale, and
 * that text is underlined.
 */
export const planDim = (
  view: PlanView,
  lang: Lang,
  a: Pt,
  b: Pt,
  offset: number,
  o: { value?: number; color?: string; size?: number } = {},
) => {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / length;
  const ny = (b[0] - a[0]) / length;
  const da: Pt = [a[0] + nx * offset, a[1] + ny * offset];
  const db: Pt = [b[0] + nx * offset, b[1] + ny * offset];
  const value = o.value ?? length;
  const color = o.color ?? "#000";
  const sign = Math.sign(offset);
  const ext = (p: Pt, d: Pt) =>
    Math.abs(offset) > 0.05
      ? line(toPaper(view, [p[0] + nx * sign * 0.05, p[1] + ny * sign * 0.05]), toPaper(view, [d[0] + nx * sign * 0.1, d[1] + ny * sign * 0.1]), { stroke: color, width: 0.13 })
      : "";
  return ext(a, da) + ext(b, db) + dimLine(toPaper(view, da), toPaper(view, db), dimension(lang, value), { color, size: o.size, underline: Math.abs(value - length) > 0.004 });
};

export const PAPER = { A1: [841, 594], A2: [594, 420], A3: [420, 297] } as const;
export type Paper = keyof typeof PAPER;
const GRID: Record<Paper, readonly [number, number]> = { A1: [12, 8], A2: [8, 6], A3: [6, 4] };
const ROWS = "ABCDEFGH";

export const frameBox = (paper: Paper): Box => {
  const [w, h] = PAPER[paper];
  return { x: 20, y: 10, w: w - 30, h: h - 20 };
};

export const zoneGrid = (paper: Paper) => {
  const [cols, rows] = GRID[paper];
  return { columns: `1–${cols}`, rows: `A–${ROWS[rows - 1]}` };
};

/** The paper box of a zone ("C4": row letter, column number) or a zone range ("B2:D5"). */
export const zoneBox = (paper: Paper, region: string): Box | undefined => {
  const [cols, rows] = GRID[paper];
  const f = frameBox(paper);
  const cell = (zone: string) => {
    const match = /^([A-Ha-h])\s*(\d{1,2})$/u.exec(zone.trim());
    if (!match) return undefined;
    const row = ROWS.indexOf(match[1]!.toUpperCase());
    const col = Number(match[2]) - 1;
    return row < rows && col >= 0 && col < cols ? { row, col } : undefined;
  };
  const [first = "", last = first] = region.split(":");
  const a = cell(first);
  const b = cell(last);
  if (!a || !b) return undefined;
  const cw = f.w / cols;
  const rh = f.h / rows;
  const [c0, c1] = [Math.min(a.col, b.col), Math.max(a.col, b.col)];
  const [r0, r1] = [Math.min(a.row, b.row), Math.max(a.row, b.row)];
  return { x: f.x + c0 * cw, y: f.y + r0 * rh, w: (c1 - c0 + 1) * cw, h: (r1 - r0 + 1) * rh };
};

/** The frame with its zone grid labelled in the margin. */
export const frame = (paper: Paper) => {
  const [cols, rows] = GRID[paper];
  const f = frameBox(paper);
  const parts = [rect(f.x, f.y, f.w, f.h, { width: 0.7 })];
  for (let c = 0; c < cols; c++) {
    const x = f.x + (c * f.w) / cols;
    const mid = x + f.w / cols / 2;
    if (c) parts.push(line([x, f.y - 5], [x, f.y]), line([x, f.y + f.h], [x, f.y + f.h + 5]));
    parts.push(text([mid, f.y - 2], String(c + 1), { size: 3.5, anchor: "middle" }), text([mid, f.y + f.h + 5.5], String(c + 1), { size: 3.5, anchor: "middle" }));
  }
  for (let r = 0; r < rows; r++) {
    const y = f.y + (r * f.h) / rows;
    const mid = y + f.h / rows / 2 + 1.3;
    if (r) parts.push(line([f.x - 8, y], [f.x, y]), line([f.x + f.w, y], [f.x + f.w + 5, y]));
    parts.push(text([f.x - 5, mid], ROWS[r]!, { size: 3.5, anchor: "middle" }), text([f.x + f.w + 5, mid], ROWS[r]!, { size: 3.5, anchor: "middle" }));
  }
  return parts.join("");
};

export const TITLE_BLOCK = { w: 180, h: 64 };

/** The title block in the frame's bottom-right corner: label and value rows. */
export const titleBlock = (paper: Paper, rows: ReadonlyArray<readonly [string, string]>) => {
  const f = frameBox(paper);
  const x = f.x + f.w - TITLE_BLOCK.w;
  const y = f.y + f.h - TITLE_BLOCK.h;
  const rowH = TITLE_BLOCK.h / rows.length;
  return [
    rect(x, y, TITLE_BLOCK.w, TITLE_BLOCK.h, { width: 0.5, fill: "#fff" }),
    line([x + 38, y], [x + 38, y + TITLE_BLOCK.h], { width: 0.2 }),
    ...rows.flatMap(([label, value], index) => [
      index ? line([x, y + index * rowH], [x + TITLE_BLOCK.w, y + index * rowH], { width: 0.2 }) : "",
      text([x + 2, y + index * rowH + rowH * 0.62], label, { size: 2.2, fill: "#444" }),
      text([x + 40, y + index * rowH + rowH * 0.68], value, { size: 3.2 }),
    ]),
  ].join("");
};

/** A scale bar of whole metres with its left end at `at`. */
export const scaleBar = (at: Pt, scale: number, metres: number, label: string) => {
  const step = 1000 / scale;
  const parts = [text([at[0], at[1] - 3], label, { size: 2.5 })];
  for (let m = 0; m < metres; m++) parts.push(rect(at[0] + m * step, at[1], step, 2, { width: 0.2, fill: m % 2 ? "#fff" : "#000" }));
  for (let m = 0; m <= metres; m++) parts.push(text([at[0] + m * step, at[1] + 5.5], String(m), { size: 2.2, anchor: "middle" }));
  parts.push(text([at[0] + metres * step + 3, at[1] + 2], "m", { size: 2.5 }));
  return parts.join("");
};

/** The longest side of a rendered image, in pixels. */
export const MAX_PIXELS = 1600;

/** Renders a box of a sheet's SVG body to a PNG data URL at `zoom` pixels per paper millimetre. */
export const renderPng = (body: string, box: Box, zoom: number) => {
  const width = Math.max(1, Math.round(box.w * zoom));
  const height = Math.max(1, Math.round(box.h * zoom));
  const viewBox = `${n(box.x)} ${n(box.y)} ${n(box.w)} ${n(box.h)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}"><rect x="${n(box.x)}" y="${n(box.y)}" width="${n(box.w)}" height="${n(box.h)}" fill="#fff"/>${body}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: "DejaVu Sans" },
  })
    .render()
    .asPng();
  return { url: `data:image/png;base64,${Buffer.from(png).toString("base64")}`, png, width, height };
};
