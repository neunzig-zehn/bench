/** Documents of the schedule task: an LV section, a Baubeschreibung, a floor plan, and a Bauzeitenplan with another deadline. */
import type { Doc } from "../dialog";
import { KALKULATION } from "./catalog";

/** Item, catalog article, quantity to price (02.02 as the colleague confirms it), and whether the mounting height exceeds 3.00 m. */
export const SCHEDULE_ITEMS: Array<[item: string, article: string, quantity: number, high: boolean]> = [
  ["02.01", "L-6262", 64, true],
  ["02.02", "L-2150", 32, false],
  ["02.03", "S-3102", 160, false],
  ["02.04", "S-3101", 40, false],
  ["02.05", "S-3001", 70, false],
  ["02.06", "K-1015", 2400, false],
  ["02.07", "K-1025", 2440, false],
  ["02.08", "K-5025", 420, false],
  ["02.09", "V-8040", 2, false],
];

export const SCHEDULE_DOCS: Doc[] = [
  {
    id: "lv",
    title: { de: "LV Bürohaus Kanalstraße 21 – Titel 02 Elektroinstallation 2. OG (Stand 30.09.2026)", en: "LV office building Kanalstraße 21 – section 02 electrical installation, 2nd floor (as of 30 Sep 2026)" },
    pages: [
      [
        ["Pos. 02.01 LED-Rasterleuchte 625 x 625 mm, 3600 lm, 4000 K, Lumena RL-625/840, Einlegeleuchte für Rasterdecke, Großraumbüro, montieren und anschließen. Menge: 64 Stk", "Item 02.01 LED panel luminaire 625 x 625 mm, 3600 lm, 4000 K, Lumena RL-625/840, lay-in luminaire for a grid ceiling, open-plan office, install and connect. Quantity: 64 pcs"],
        ["Pos. 02.02 LED-Downlight Ø 150 mm, 1200 lm, 4000 K, Lumena DL-150/840, Flur und Besprechungsräume. Menge: 36 Stk", "Item 02.02 LED downlight Ø 150 mm, 1200 lm, 4000 K, Lumena DL-150/840, corridor and meeting rooms. Quantity: 36 pcs"],
        ["Pos. 02.03 Steckdose 2-fach UP, Serie Linea reinweiß. Menge: 160 Stk", "Item 02.03 Socket outlet, double, flush-mounted, Linea series, pure white. Quantity: 160 pcs"],
        ["Pos. 02.04 Steckdose 1-fach UP, Serie Linea reinweiß. Menge: 40 Stk", "Item 02.04 Socket outlet, single, flush-mounted, Linea series, pure white. Quantity: 40 pcs"],
        ["Pos. 02.05 Ausschalter UP, Serie Linea reinweiß. Menge: 70 Stk", "Item 02.05 On/off switch, flush-mounted, Linea series, pure white. Quantity: 70 pcs"],
      ],
      [
        ["Pos. 02.06 Leitung NYM-J 3x1,5 mm² verlegen. Menge: 2.400 m", "Item 02.06 Lay cable NYM-J 3x1.5 mm². Quantity: 2,400 m"],
        ["Pos. 02.07 Leitung NYM-J 3x2,5 mm² verlegen. Menge: 2.440 m", "Item 02.07 Lay cable NYM-J 3x2.5 mm². Quantity: 2,440 m"],
        ["Pos. 02.08 Leitung NYM-J 5x2,5 mm² verlegen. Menge: 420 m", "Item 02.08 Lay cable NYM-J 5x2.5 mm². Quantity: 420 m"],
        ["Pos. 02.09 Kleinverteiler Aufputz, 4-reihig, bestückt, montieren und anschließen. Menge: 2 Stk", "Item 02.09 Small distribution board, surface-mounted, 4 rows, equipped, install and connect. Quantity: 2 pcs"],
      ],
    ],
  },
  {
    id: "baubeschreibung",
    title: { de: "Baubeschreibung – Bürohaus Kanalstraße 21, Berlin (Auszug)", en: "Baubeschreibung (construction specification) – office building Kanalstraße 21, Berlin (extract)" },
    pages: [
      [
        ["1. Termine: Fertigstellung der Elektroinstallation im 2. OG: 30.04.2027.", "1. Schedule: completion of the electrical installation on the 2nd floor: 30 Apr 2027."],
        ["2. Raumhöhen: siehe Grundrisse.", "2. Room heights: see the floor plans."],
        ["3. Arbeitszeiten auf der Baustelle: Montag bis Freitag, 7 bis 17 Uhr.", "3. Working hours on site: Monday to Friday, 7 am to 5 pm."],
        ["4. Die Mieterin im 1. OG bleibt während der Bauzeit im Haus; Lärmarbeiten nach Absprache.", "4. The tenant on the 1st floor stays in the building during construction; noisy work by arrangement."],
      ],
    ],
  },
  {
    id: "grundriss-2og",
    title: { de: "Grundriss 2. OG E-2OG-01, Index A – Planhinweise", en: "Floor plan, 2nd floor E-2OG-01, revision A – plan notes" },
    pages: [
      [
        ["Grundriss 2. OG E-2OG-01, Index A (Stand 20.09.2026)", "Floor plan, 2nd floor E-2OG-01, revision A (as of 20 Sep 2026)"],
        ["Großraumbüro, Achsen 1–6: ohne abgehängte Decke, lichte Raumhöhe 3,40 m; Rasterleuchten als Aufbauleuchten an der Rohdecke.", "Open-plan office, axes 1–6: no suspended ceiling, clear room height 3.40 m; panel luminaires surface-mounted on the bare slab."],
        ["Flur und Besprechungsräume B1–B3: abgehängte Decke, lichte Raumhöhe 2,80 m.", "Corridor and meeting rooms B1–B3: suspended ceiling, clear room height 2.80 m."],
        ["Rasterleuchten (Typ R) im Großraumbüro: 8 Reihen zu je 8 Stk.", "Panel luminaires (type R) in the open-plan office: 8 rows of 8."],
        ["Downlights (Typ D): Flur 14 Stk; Besprechungsräume B1–B3 je 6 Stk.", "Downlights (type D): corridor 14; meeting rooms B1–B3 6 each."],
        ["Kleinverteiler UV-2.1 und UV-2.2 im Flur, Achse 3.", "Small distribution boards UV-2.1 and UV-2.2 in the corridor, axis 3."],
      ],
    ],
  },
  {
    id: "bauzeitenplan",
    title: { de: "Bauzeitenplan Rev. 3 vom 04.11.2026 (Auszug Elektro)", en: "Construction schedule (Bauzeitenplan) rev. 3, 4 Nov 2026 (electrical extract)" },
    pages: [
      [
        ["Bauzeitenplan Rev. 3 (Stand 04.11.2026), Auszug Elektro", "Construction schedule rev. 3 (as of 4 Nov 2026), electrical extract"],
        ["Elektroinstallation 2. OG: Baufreiheit ab Montag, 01.03.2027; Fertigstellung Freitag, 16.04.2027.", "Electrical installation, 2nd floor: site available from Monday, 1 Mar 2027; completion Friday, 16 Apr 2027."],
        ["Elektroinstallation 3. OG: Baufreiheit ab 19.04.2027.", "Electrical installation, 3rd floor: site available from 19 Apr 2027."],
        ["Arbeitsfreie Tage: Wochenenden und gesetzliche Feiertage in Berlin; 2027: 01.01., 08.03. (Internationaler Frauentag), 26.03. (Karfreitag), 29.03. (Ostermontag), 01.05., 06.05., 17.05., 03.10., 25.12., 26.12.", "Days off: weekends and public holidays in Berlin; 2027: 1 Jan, 8 Mar (International Women's Day), 26 Mar (Good Friday), 29 Mar (Easter Monday), 1 May, 6 May, 17 May, 3 Oct, 25 Dec, 26 Dec."],
      ],
    ],
  },
  KALKULATION,
];
