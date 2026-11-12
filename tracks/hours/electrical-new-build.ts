/**
 * Electrical, new build. The catalog fits this company (the history books a factor of 1.00), so the
 * task measures careful reading. Traps: cable times per 100 m; the mounting-height bands of the
 * catalog applied from the site description (hall roof 6.50 m ×1.40, foyer ceiling 4.60 m ×1.20,
 * while hall sockets, exit signs and the board sit low); the wall material per area (masonry outer
 * walls, concrete stair core, drywall partitions). Graded per Item and on the total by log deviation.
 */
import { CATALOG, heightFactor, mountedAt, RULES } from "./electrical-catalog";
import { catalogOf, hoursTask, standardMinutes, type Fixture, type Item, type L, type Line, type PastItem } from "./kit";

type Work = { height?: number };

const catalog = catalogOf(CATALOG);
const hours = (lines: Line<Work>[]) => lines.reduce((sum, line) => sum + standardMinutes(catalog(line.code), line.quantity) * heightFactor(line.height), 0) / 60;

const item = (id: string, trap: string, code: string, quantity: number, height: number, short: [string, string], long: [string, string]): Item<Work> => ({
  id,
  trap,
  short: { de: short[0], en: short[1] },
  long: { de: long[0], en: long[1] },
  quantity,
  unit: catalog(code).unit,
  lines: [{ code, quantity, height }],
});

const past = (code: string, quantity: number, height?: number): PastItem<Work> => ({
  text: catalog(code).text,
  quantity,
  unit: catalog(code).unit,
  ...(height === undefined ? {} : { note: mountedAt(height) }),
  lines: [{ code, quantity, height }],
});

const l = (de: string, en: string): L => ({ de, en });

export const ELECTRICAL: Fixture<Work, object> = {
  slug: "electrical-new-build",
  title: "Electrical labour hours for a new office and warehouse",
  description:
    "Electrical, new build: 20 Items where the catalog fits this company (history confirms a factor of 1.00). Traps: cable times per 100 m, the catalog's mounting-height factors applied from the site description (hall roof 6.50 m ×1.40, foyer ceiling 4.60 m ×1.20, but hall sockets, exit signs and the board sit low), and the wall material per area (masonry, concrete core, drywall). Graded per Item and on the total (weight 5) by log deviation, 0 at a factor of 1.5.",
  company: l("Elektro Albers GmbH", "Elektro Albers GmbH"),
  project: l("Neubau Bürogebäude mit Lagerhalle, Gewerbepark Nord, Haus 3", "New office building with warehouse, Gewerbepark Nord, Building 3"),
  rules: RULES,
  catalog: CATALOG,
  site: [
    {
      title: l("Allgemeines", "General"),
      text: l(
        "Neubau eines zweigeschossigen Bürotrakts mit angebauter eingeschossiger Lagerhalle. Der Rohbau ist fertig und trocken; Baustrom, Zufahrt und ein Materiallager auf dem Grundstück sind vorhanden. Die Hauptverteilung hängt an der Hallenwand in Achse A. Arbeitszeit Mo–Fr 7–16 Uhr.",
        "New build of a two-storey office wing with an attached single-storey warehouse. The shell is complete and dry; site power, access and a material store on the plot are available. The main distribution board hangs on the hall wall at axis A. Working hours Mon–Fri 7 am–4 pm.",
      ),
    },
    {
      title: l("Bürotrakt", "Office wing"),
      text: l(
        "Geschosshöhe 3,30 m, lichte Raumhöhe 3,00 m. Büros und Flure erhalten eine abgehängte Rasterdecke 625x625 mm auf 2,75 m; die Kabelrinnen liegen im Deckenhohlraum auf 2,90 m. Außenwände Kalksandstein-Mauerwerk, Bürotrennwände Metallständerwände (Trockenbau), Treppenhauskern und Aufzugsschacht Stahlbeton. Schalter auf 1,05 m, Steckdosen auf 0,30 m.",
        "Storey height 3.30 m, clear room height 3.00 m. Offices and corridors get a suspended grid ceiling 625x625 mm at 2.75 m; the cable trays run in the ceiling void at 2.90 m. External walls sand-lime brick masonry, office partitions metal stud walls (drywall), stair core and lift shaft reinforced concrete. Switches at 1.05 m, sockets at 0.30 m.",
      ),
    },
    {
      title: l("Foyer", "Foyer"),
      text: l(
        "Eingangsfoyer im Erdgeschoss mit zweigeschossigem Luftraum und geschlossener Gipskartondecke auf 4,60 m. Wände wie im Bürotrakt.",
        "Entrance foyer on the ground floor with a two-storey void and a closed plasterboard ceiling at 4.60 m. Walls as in the office wing.",
      ),
    },
    {
      title: l("Lagerhalle", "Warehouse"),
      text: l(
        "Eingeschossige Halle, lichte Höhe 7,20 m. Kabelrinnen, Leitungen und Hallenleuchten hängen unter dem Dach auf 6,50 m. Wände Stahlbeton-Fertigteile. Wandsteckdosen in Feuchtraumausführung auf 1,10 m, Rettungszeichenleuchten über den Fluchttüren auf 2,50 m. Die Unterverteilung steht im Hallenvorraum am Boden. Eine Hubarbeitsbühne stellt der Bauherr.",
        "Single-storey hall, clear height 7.20 m. Cable trays, cables and hall luminaires hang under the roof at 6.50 m. Walls precast reinforced concrete. Damp-proof wall sockets at 1.10 m, exit-sign luminaires above the escape doors at 2.50 m. The sub-distribution board stands on the floor of the hall's anteroom. The client provides an aerial work platform.",
      ),
    },
    {
      title: l("Termine", "Schedule"),
      text: l(
        "Ausführung in einem Zug ab KW 10/2027, Fertigstellung KW 18/2027.",
        "Execution in one run from week 10/2027, completion in week 18/2027.",
      ),
    },
  ],
  attrs: {},
  items: [
    item("01.01", "tray, per 100 m", "E-111", 850, 2.9,
      ["NYM-J 3x1,5 mm² auf Kabelrinne", "NYM-J 3x1.5 mm² on cable tray"],
      ["Mantelleitung NYM-J 3x1,5 mm² liefern und auf Kabelrinne verlegen, Bürotrakt EG und OG, Trasse im Deckenhohlraum.", "Supply NYM-J 3x1.5 mm² sheathed cable and lay it on cable tray, office wing ground and upper floor, tray in the ceiling void."]),
    item("01.02", "hall roof ×1.40, per 100 m", "E-112", 240, 6.5,
      ["NYM-J 5x2,5 mm² auf Kabelrinne", "NYM-J 5x2.5 mm² on cable tray"],
      ["Mantelleitung NYM-J 5x2,5 mm² liefern und auf Kabelrinne verlegen, Lagerhalle, Trasse unter dem Hallendach.", "Supply NYM-J 5x2.5 mm² sheathed cable and lay it on cable tray, warehouse, tray under the hall roof."]),
    item("01.03", "hall roof ×1.40, per 100 m", "E-114", 65, 6.5,
      ["NYY-J 5x16 mm² Zuleitung Unterverteilung Lagerhalle", "NYY-J 5x16 mm² feeder to warehouse sub-board"],
      ["Kabel NYY-J 5x16 mm² als Zuleitung von der Hauptverteilung zur Unterverteilung Lagerhalle, vollständig auf der Kabelrinne unter dem Hallendach verlegt.", "NYY-J 5x16 mm² cable as feeder from the main distribution board to the warehouse sub-board, laid entirely on the cable tray under the hall roof."]),
    item("01.04", "hall roof ×1.40", "E-120", 120, 6.5,
      ["Kabelrinne 200x60 mm", "Cable tray 200x60 mm"],
      ["Kabelrinne 200x60 mm, Stahl verzinkt, mit Abhängung an der Dachkonstruktion der Lagerhalle montieren.", "Cable tray 200x60 mm, galvanised steel, install with suspension from the warehouse roof structure."]),
    item("01.05", "ceiling void, no factor", "E-121", 180, 2.9,
      ["Kabelrinne 100x60 mm", "Cable tray 100x60 mm"],
      ["Kabelrinne 100x60 mm, Stahl verzinkt, im Deckenhohlraum des Bürotrakts mit Abhängung an der Rohdecke montieren.", "Cable tray 100x60 mm, galvanised steel, install in the office wing's ceiling void with suspension from the slab."]),
    item("01.06", "under plaster, per 100 m", "E-110", 120, 1,
      ["NYM-J 3x1,5 mm² unter Putz", "NYM-J 3x1.5 mm² under plaster"],
      ["Mantelleitung NYM-J 3x1,5 mm² unter Putz in den Schlitzen der Außenwände verlegen, Bürotrakt (Schlitze nach Pos. 02.01).", "Lay NYM-J 3x1.5 mm² sheathed cable under plaster in the chases of the external walls, office wing (chases as Item 02.01)."]),
    item("02.01", "masonry outer wall", "E-130", 60, 1,
      ["Schlitz 30x30 mm", "Chase 30x30 mm"],
      ["Schlitz 30x30 mm für Leitungen herstellen und wieder schließen, Außenwände Bürotrakt.", "Make a 30x30 mm chase for cables and close it again, external walls of the office wing."]),
    item("02.02", "masonry outer wall", "E-140", 36, 0.3,
      ["Gerätedose unter Putz, Außenwände", "Flush device box, external walls"],
      ["Gerätedose unter Putz setzen, Außenwände Bürotrakt.", "Set flush device boxes, external walls of the office wing."]),
    item("02.03", "concrete stair core", "E-141", 12, 1.05,
      ["Gerätedose unter Putz, Treppenhaus", "Flush device box, stairwell"],
      ["Gerätedose unter Putz setzen, Wände des Treppenhauskerns, für Lichtschalter und Notruftaster.", "Set flush device boxes in the walls of the stair core, for light switches and emergency call buttons."]),
    item("02.04", "drywall partition", "E-142", 140, 0.3,
      ["Hohlwanddose", "Cavity wall box"],
      ["Hohlwand-Gerätedose setzen, Bürotrennwände.", "Set cavity wall device boxes, office partitions."]),
    item("02.05", "plain", "E-151", 160, 0.3,
      ["Schutzkontaktsteckdose unter Putz", "Flush Schuko socket"],
      ["Schutzkontaktsteckdose unter Putz in vorhandene Dosen einsetzen und anschließen, Bürotrakt.", "Fit flush Schuko sockets into the boxes and connect them, office wing."]),
    item("02.06", "plain", "E-150", 48, 1.05,
      ["Schalter und Taster unter Putz", "Flush switches and push-buttons"],
      ["Schalter und Taster unter Putz in vorhandene Dosen einsetzen und anschließen, Bürotrakt und Treppenhaus.", "Fit flush switches and push-buttons into the boxes and connect them, office wing and stairwell."]),
    item("03.01", "grid ceiling 2.75 m", "E-160", 96, 2.75,
      ["LED-Panel 625x625 mm", "LED panel 625x625 mm"],
      ["LED-Panel 625x625 mm in die Rasterdecke der Büros einlegen und anschließen.", "Lay LED panels 625x625 mm into the offices' grid ceiling and connect them."]),
    item("03.02", "foyer 4.60 m ×1.20", "E-162", 14, 4.6,
      ["LED-Downlight Foyer", "LED downlight, foyer"],
      ["LED-Downlight in die Gipskartondecke des Foyers einbauen und anschließen.", "Build LED downlights into the foyer's plasterboard ceiling and connect them."]),
    item("03.03", "hall roof ×1.40", "E-161", 24, 6.5,
      ["LED-Hallenstrahler", "LED high-bay luminaire"],
      ["LED-Hallenstrahler 150 W an der Dachkonstruktion der Lagerhalle abhängen und anschließen.", "Suspend 150 W LED high-bay luminaires from the warehouse roof structure and connect them."]),
    item("03.04", "in the hall but low", "E-163", 6, 2.5,
      ["Rettungszeichenleuchte Lagerhalle", "Exit-sign luminaire, warehouse"],
      ["Rettungszeichenleuchte mit Einzelbatterie über den Fluchttüren der Lagerhalle montieren und anschließen.", "Mount exit-sign luminaires with single battery above the warehouse escape doors and connect them."]),
    item("03.05", "in the hall but low", "E-152", 18, 1.1,
      ["Steckdose Aufputz Feuchtraum", "Surface-mounted damp-proof socket"],
      ["Schutzkontaktsteckdose Aufputz, IP44, an den Hallenwänden montieren und anschließen.", "Mount surface-mounted IP44 Schuko sockets on the hall walls and connect them."]),
    item("04.01", "plain", "E-170", 1, 0,
      ["Unterverteilung Lagerhalle", "Warehouse sub-distribution board"],
      ["Unterverteilung bis 72 TE im Hallenvorraum setzen und verdrahten.", "Set and wire a sub-distribution board up to 72 modules in the hall's anteroom."]),
    item("04.02", "plain", "E-171", 54, 1.4,
      ["Leitungsschutzschalter", "Miniature circuit breaker"],
      ["Leitungsschutzschalter B16 in die Unterverteilung einbauen und anschließen.", "Fit B16 miniature circuit breakers into the sub-board and connect them."]),
    item("04.03", "testing is separate", "E-190", 54, 0,
      ["Prüfen und Messen", "Testing and measuring"],
      ["Erstprüfung nach DIN VDE 0100-600 aller 54 Stromkreise der neuen Unterverteilung, Prüfen und Messen je Stromkreis.", "Initial verification to DIN VDE 0100-600 of all 54 circuits of the new sub-board, testing and measuring per circuit."]),
  ],
  projects: [
    {
      id: "P-2301",
      name: l("Neubau Arztpraxis Lindenhof", "New build medical practice Lindenhof"),
      year: 2023,
      conditions: l("Neubau, eingeschossig, Raumhöhe 2,80 m, Wände Mauerwerk.", "New build, single storey, room height 2.80 m, masonry walls."),
      attrs: {},
      items: [past("E-110", 380, 1.2), past("E-130", 90, 1), past("E-140", 64, 0.6), past("E-151", 72, 0.3), past("E-150", 30, 1.05), past("E-162", 24, 2.7), past("E-170", 1, 0), past("E-171", 24, 1.4), past("E-190", 24)],
    },
    {
      id: "P-2408",
      name: l("Neubau Gewerbehalle Schreinerei Vogt", "New build workshop hall, Vogt joinery"),
      year: 2024,
      conditions: l("Neubau, Halle mit lichter Höhe 7,50 m und Bürovorbau, Hallenwände Stahlbeton.", "New build, hall with 7.50 m clear height and an office annex, hall walls reinforced concrete."),
      attrs: {},
      items: [
        past("E-120", 80, 6.8), past("E-112", 160, 6.8), past("E-114", 40, 6.8), past("E-161", 18, 6.8), past("E-152", 12, 1.2), past("E-141", 8, 1.05),
        past("E-131", 20, 1.5), past("E-121", 30, 2.8), past("E-111", 140, 2.8), past("E-162", 10, 4.2), past("E-163", 4, 2.4), past("E-190", 22),
      ],
    },
    {
      id: "P-2502",
      name: l("Neubau Kita Sonnenblume", "New build daycare centre Sonnenblume"),
      year: 2025,
      conditions: l("Neubau, Raumhöhe 3,00 m, Innenwände Trockenbau, Rasterdecken auf 2,70 m.", "New build, room height 3.00 m, drywall partitions, grid ceilings at 2.70 m."),
      attrs: {},
      items: [
        past("E-142", 120, 0.3), past("E-151", 110, 0.3), past("E-150", 40, 1.05), past("E-160", 60, 2.7), past("E-163", 10, 2.3),
        past("E-111", 600, 2.85), past("E-121", 140, 2.85), past("E-113", 90, 1), past("E-172", 6, 1.4), past("E-190", 30),
      ],
    },
  ],
  hours,
  seed: 11,
};

export const electricalNewBuild = hoursTask(ELECTRICAL);
