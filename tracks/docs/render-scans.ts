/**
 * Renders the scanned offer pages of `fixtures/offer-scan.ts` to the committed images with headless
 * Chromium: `bun tracks/docs/render-scans.ts`. Each page, as scanned and turned by 180°, becomes a
 * low-resolution overview and two full-resolution halves (top, bottom), as a viewer zooms. Run it
 * after changing the offer or its layout.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LANGS } from "../../src/types";
import { PAGES, scanHtml } from "./fixtures/offer-scan";

const WIDTH = 1080;
const HEIGHT = 760;
const OVERVIEW = 0.6;
/** The halves overlap, so no row is cut in both. */
const HALF = 440;

const chromium = Bun.which("chromium") ?? Bun.which("google-chrome");
if (!chromium) throw new Error("Rendering needs chromium or google-chrome on the PATH.");
const dir = await mkdtemp(join(tmpdir(), "offer-scan-"));
const shoot = async (name: string, html: string, scale: number, height: number) => {
  const file = join(dir, `${name}.html`);
  await Bun.write(file, html);
  const out = new URL(`fixtures/${name}.jpg`, import.meta.url).pathname;
  const run = Bun.spawnSync([chromium, "--headless", "--disable-gpu", "--hide-scrollbars", `--force-device-scale-factor=${scale}`, `--window-size=${WIDTH},${height}`, `--screenshot=${out}`, `file://${file}`]);
  if (run.exitCode !== 0) throw new Error(run.stderr.toString());
  console.log(out);
};
for (const lang of LANGS)
  for (let page = 1; page <= PAGES; page++)
    for (const turned of [false, true]) {
      const name = `offer-scan-${lang}-${page}${turned ? "-r180" : ""}`;
      const html = scanHtml(lang, page, turned);
      await shoot(name, html, OVERVIEW, HEIGHT);
      await shoot(`${name}-top`, html, 1, HALF);
      await shoot(`${name}-bottom`, html.replace("<body>", `<body style="margin-top: -${HEIGHT - HALF}px">`), 1, HALF);
    }
await rm(dir, { recursive: true });
