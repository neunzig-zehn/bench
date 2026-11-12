/**
 * Electrical renovation of an occupied administration building. The catalog is for new builds; the
 * history holds all four combinations of new or existing building and vacant or occupied, which
 * book 1.00, 1.20, 1.25 and 1.50 × catalog, so the estimator must see two factors that multiply.
 * Traps: the wing of each Item (east vacant, west occupied, stairwell and entrance hall in use) only
 * through the room names and the site description; Items whose quantity the long text splits across
 * both wings; composite Items with several catalog lines per piece; concrete corridor and stairwell
 * walls among masonry; the entrance hall at 4.80 m on top of both factors. Graded per Item and on the
 * total by log deviation.
 */
import { CATALOG, heightFactor, mountedAt, RULES } from "./electrical-catalog";
import { catalogOf, hoursTask, standardMinutes, type Fixture, type Item, type L, type Line, type Project } from "./kit";

type Work = { height: number; occupied: boolean };
type Building = { existing: boolean };

/** Hidden factors on the catalog for an existing building and for work in occupied rooms. */
const EXISTING = 1.2;
const OCCUPIED = 1.25;

const catalog = catalogOf(CATALOG);
const hours = (lines: Line<Work>[], attrs: Building) =>
  lines.reduce(
    (sum, line) =>
      sum + standardMinutes(catalog(line.code), line.quantity) * heightFactor(line.height) * (attrs.existing ? EXISTING : 1) * (line.occupied ? OCCUPIED : 1),
    0,
  ) / 60;

const l = (de: string, en: string): L => ({ de, en });
const east = (code: string, quantity: number, height = 1): Line<Work> => ({ code, quantity, height, occupied: false });
const west = (code: string, quantity: number, height = 1): Line<Work> => ({ code, quantity, height, occupied: true });

const item = (id: string, trap: string, quantity: number, lines: Line<Work>[], short: [string, string], long: [string, string]): Item<Work> => ({
  id,
  trap,
  short: { de: short[0], en: short[1] },
  long: { de: long[0], en: long[1] },
  quantity,
  unit: catalog(lines[0]!.code).unit,
  lines,
});

const project = (id: string, name: L, year: number, conditions: L, existing: boolean, occupied: boolean, rows: Array<[string, number, number?]>): Project<Work, Building> => ({
  id,
  name,
  year,
  conditions,
  attrs: { existing },
  items: rows.map(([code, quantity, height]) => ({
    text: catalog(code).text,
    quantity,
    unit: catalog(code).unit,
    ...(height === undefined ? {} : { note: mountedAt(height) }),
    lines: [{ code, quantity, height: height ?? 0, occupied }],
  })),
});

export const RENOVATION: Fixture<Work, Building> = {
  slug: "electrical-occupied-renovation",
  title: "Electrical labour hours for renovating a partly occupied building",
  description:
    "Electrical renovation of a 1968 administration building, east wing vacant, west wing, stairwell and entrance hall in use: 23 Items. History covers new and existing buildings, vacant and occupied (1.00, 1.20, 1.25, 1.50 × catalog), so two multiplying factors must be inferred. Traps: the wing of each Item only via room names and the site description, quantities the long text splits across wings, composite Items (two boxes plus two sockets per piece), concrete corridor and stairwell walls, removals per 100 m, the entrance hall at 4.80 m (height ×1.20 on top). Graded per Item and on the total (weight 5) by log deviation, 0 at a factor of 1.5.",
  company: l("Elektro Albers GmbH", "Elektro Albers GmbH"),
  project: l("Sanierung Elektroinstallation Verwaltungsgebäude Kreiswerke", "Renovation of the electrical installation, Kreiswerke administration building"),
  rules: RULES,
  catalog: CATALOG,
  site: [
    {
      title: l("Allgemeines", "General"),
      text: l(
        "Sanierung der Elektroinstallation im Verwaltungsgebäude der Kreiswerke, Baujahr 1968 (Bestand). Ostflügel und Westflügel mit je zwei Geschossen, dazwischen Treppenhaus und Eingangshalle. Die Altinstallation wird vollständig ausgebaut und ersetzt. Raumnummern: O.x.xx im Ostflügel, W.x.xx im Westflügel.",
        "Renovation of the electrical installation in the Kreiswerke administration building, built 1968 (existing building). East and west wings of two storeys each, with the stairwell and entrance hall between them. The old installation is removed completely and replaced. Room numbers: O.x.xx in the east wing, W.x.xx in the west wing.",
      ),
    },
    {
      title: l("Bauabschnitte und Nutzung", "Construction phases and use"),
      text: l(
        "Bauabschnitt 1, Ostflügel: während der Arbeiten geräumt und leer. Bauabschnitt 2, Westflügel: im laufenden Betrieb; die Büros bleiben besetzt, gearbeitet wird raumweise nach Freigabe, Arbeitsplätze und Möbel sind abzudecken. Treppenhaus und Eingangshalle verbinden beide Flügel und bleiben während der gesamten Bauzeit in Benutzung; dort gelten dieselben Bedingungen wie im Westflügel.",
        "Phase 1, east wing: cleared and empty during the works. Phase 2, west wing: in operation; the offices stay occupied, work proceeds room by room once released, desks and furniture must be covered. The stairwell and entrance hall connect both wings and stay in use for the whole of the works; the same conditions as in the west wing apply there.",
      ),
    },
    {
      title: l("Konstruktion und Höhen", "Structure and heights"),
      text: l(
        "Außenwände und Bürotrennwände Ziegelmauerwerk, Flurwände und Treppenhaus Stahlbeton. Büros: Raumhöhe 2,90 m, verputzte Decken. Flure: abgehängte Decke auf 2,50 m, Kabelrinnen im Deckenhohlraum auf 2,70 m. Eingangshalle: Deckenhöhe 4,80 m. Schalter auf 1,05 m, Steckdosen auf 0,30 m, Sicherheitsleuchten auf 2,40 m.",
        "External walls and office partitions brick masonry, corridor walls and stairwell reinforced concrete. Offices: room height 2.90 m, plastered ceilings. Corridors: suspended ceiling at 2.50 m, cable trays in the ceiling void at 2.70 m. Entrance hall: ceiling height 4.80 m. Switches at 1.05 m, sockets at 0.30 m, emergency luminaires at 2.40 m.",
      ),
    },
    {
      title: l("Unterverteilungen", "Sub-distribution boards"),
      text: l(
        "Je Flügel eine Unterverteilung im Flur am Treppenhaus, die alte wird an gleicher Stelle ausgebaut. Ostflügel 40 Stromkreise, Westflügel 32 Stromkreise.",
        "One sub-distribution board per wing in the corridor next to the stairwell; the old one is removed at the same place. East wing 40 circuits, west wing 32 circuits.",
      ),
    },
  ],
  attrs: { existing: true },
  items: [
    item("01.01", "east: existing ×1.20", 64, [east("E-180", 64, 2.9)], ["Leuchten demontieren, Büros O.1.01–O.2.16", "Remove luminaires, offices O.1.01–O.2.16"],
      ["Vorhandene Deckenleuchten in den Büros O.1.01 bis O.2.16 demontieren und entsorgen.", "Remove and dispose of the existing ceiling luminaires in offices O.1.01 to O.2.16."]),
    item("01.02", "west: ×1.20 × 1.25", 48, [west("E-180", 48, 2.9)], ["Leuchten demontieren, Büros W.1.01–W.2.12", "Remove luminaires, offices W.1.01–W.2.12"],
      ["Vorhandene Deckenleuchten in den Büros W.1.01 bis W.2.12 demontieren und entsorgen.", "Remove and dispose of the existing ceiling luminaires in offices W.1.01 to W.2.12."]),
    item("01.03", "split 120 east / 100 west", 220, [east("E-181", 120), west("E-181", 100)], ["Schalter und Steckdosen demontieren", "Remove switches and sockets"],
      ["Alte Schalter, Steckdosen und Gerätedosen ausbauen und entsorgen, davon 120 Stück im Ostflügel und 100 Stück im Westflügel.", "Remove and dispose of the old switches, sockets and device boxes, of which 120 pieces in the east wing and 100 pieces in the west wing."]),
    item("01.04", "per 100 m, split 55 % / 45 %", 1400, [east("E-182", 770, 2.7), west("E-182", 630, 2.7)], ["Alte Leitungen demontieren", "Remove old cables"],
      ["Alte Leitungen auf Putz und auf den alten Rinnen ausbauen und entsorgen; 55 % der Menge liegen im Ostflügel, 45 % im Westflügel.", "Remove and dispose of the old surface-mounted cables and the cables on the old trays; 55 % of the quantity lies in the east wing, 45 % in the west wing."]),
    item("01.05", "one per wing", 2, [east("E-183", 1), west("E-183", 1)], ["Alte Unterverteilungen demontieren", "Remove old sub-boards"],
      ["Die beiden alten Unterverteilungen ausbauen und entsorgen, je eine pro Flügel.", "Remove and dispose of the two old sub-distribution boards, one per wing."]),
    item("02.01", "split 80 / 80", 160, [east("E-121", 80, 2.7), west("E-121", 80, 2.7)], ["Kabelrinne 100x60 mm, Flure", "Cable tray 100x60 mm, corridors"],
      ["Kabelrinne 100x60 mm mit Abhängung im Deckenhohlraum der Flure beider Flügel montieren, je Flügel 80 m.", "Install 100x60 mm cable tray with suspension in the corridor ceiling voids of both wings, 80 m per wing."]),
    item("02.02", "per 100 m, split 900 / 700", 1600, [east("E-111", 900, 2.7), west("E-111", 700, 2.7)], ["NYM-J 3x1,5 mm² auf Kabelrinne", "NYM-J 3x1.5 mm² on cable tray"],
      ["Mantelleitung NYM-J 3x1,5 mm² auf den Kabelrinnen der Flure verlegen, davon 900 m im Ostflügel und 700 m im Westflügel.", "Lay NYM-J 3x1.5 mm² sheathed cable on the corridor cable trays, of which 900 m in the east wing and 700 m in the west wing."]),
    item("02.03", "east masonry", 140, [east("E-130", 140)], ["Schlitze, Büros O.1.01–O.2.16", "Chases, offices O.1.01–O.2.16"],
      ["Schlitze 30x30 mm in den Bürowänden O.1.01 bis O.2.16 herstellen und schließen.", "Make and close 30x30 mm chases in the office walls O.1.01 to O.2.16."]),
    item("02.04", "west masonry", 110, [west("E-130", 110)], ["Schlitze, Büros W.1.01–W.2.12", "Chases, offices W.1.01–W.2.12"],
      ["Schlitze 30x30 mm in den Bürowänden W.1.01 bis W.2.12 herstellen und schließen.", "Make and close 30x30 mm chases in the office walls W.1.01 to W.2.12."]),
    item("02.05", "west concrete corridor wall", 24, [west("E-131", 24)], ["Schlitze, Flurwände W.1.F und W.2.F", "Chases, corridor walls W.1.F and W.2.F"],
      ["Schlitze 30x30 mm in den Flurwänden des Westflügels (W.1.F, W.2.F) für die Zuleitungen der Büros herstellen und schließen.", "Make and close 30x30 mm chases in the west wing corridor walls (W.1.F, W.2.F) for the office feeds."]),
    item("02.06", "per 100 m, split 340 / 260", 600, [east("E-110", 340), west("E-110", 260)], ["NYM-J 3x1,5 mm² unter Putz", "NYM-J 3x1.5 mm² under plaster"],
      ["Mantelleitung NYM-J 3x1,5 mm² in den Schlitzen der Büros verlegen, davon 340 m im Ostflügel und 260 m im Westflügel.", "Lay NYM-J 3x1.5 mm² sheathed cable in the office chases, of which 340 m in the east wing and 260 m in the west wing."]),
    item("03.01", "composite 2 boxes + 2 sockets, east", 60, [east("E-140", 120, 0.3), east("E-151", 120, 0.3)], ["Doppelsteckdose komplett, Büros O.1.01–O.2.16", "Double socket complete, offices O.1.01–O.2.16"],
      ["Doppelsteckdose komplett, je Stück: zwei Gerätedosen unter Putz im Mauerwerk setzen, zwei Schutzkontaktsteckdosen einsetzen und anschließen. Büros O.1.01 bis O.2.16.", "Double socket complete, per piece: set two flush device boxes in the masonry, fit and connect two Schuko sockets. Offices O.1.01 to O.2.16."]),
    item("03.02", "composite, west", 44, [west("E-140", 88, 0.3), west("E-151", 88, 0.3)], ["Doppelsteckdose komplett, Büros W.1.01–W.2.12", "Double socket complete, offices W.1.01–W.2.12"],
      ["Doppelsteckdose komplett, je Stück: zwei Gerätedosen unter Putz im Mauerwerk setzen, zwei Schutzkontaktsteckdosen einsetzen und anschließen. Büros W.1.01 bis W.2.12.", "Double socket complete, per piece: set two flush device boxes in the masonry, fit and connect two Schuko sockets. Offices W.1.01 to W.2.12."]),
    item("03.03", "split 28 / 24", 52, [east("E-150", 28, 1.05), west("E-150", 24, 1.05)], ["Lichtschalter Büros", "Light switches, offices"],
      ["Lichtschalter in die neuen Dosen der Büros einsetzen und anschließen, 28 Stück im Ostflügel, 24 Stück im Westflügel.", "Fit and connect light switches in the new office boxes, 28 pieces in the east wing, 24 pieces in the west wing."]),
    item("03.04", "stairwell: concrete, in use", 10, [west("E-141", 10, 1.05)], ["Gerätedosen Treppenhaus", "Device boxes, stairwell"],
      ["Gerätedosen unter Putz in den Treppenhauswänden für Lichttaster setzen.", "Set flush device boxes in the stairwell walls for light push-buttons."]),
    item("04.01", "east", 64, [east("E-164", 64, 2.9)], ["LED-Anbauleuchten, Büros O.1.01–O.2.16", "LED surface luminaires, offices O.1.01–O.2.16"],
      ["LED-Anbauleuchten an den verputzten Decken der Büros O.1.01 bis O.2.16 montieren und anschließen.", "Mount and connect LED surface-mounted luminaires on the plastered ceilings of offices O.1.01 to O.2.16."]),
    item("04.02", "west", 48, [west("E-164", 48, 2.9)], ["LED-Anbauleuchten, Büros W.1.01–W.2.12", "LED surface luminaires, offices W.1.01–W.2.12"],
      ["LED-Anbauleuchten an den verputzten Decken der Büros W.1.01 bis W.2.12 montieren und anschließen.", "Mount and connect LED surface-mounted luminaires on the plastered ceilings of offices W.1.01 to W.2.12."]),
    item("04.03", "hall 4.80 m ×1.20, in use", 12, [west("E-162", 12, 4.8)], ["LED-Downlights Eingangshalle", "LED downlights, entrance hall"],
      ["LED-Downlights in die Decke der Eingangshalle einbauen und anschließen.", "Build LED downlights into the entrance hall ceiling and connect them."]),
    item("04.04", "split 8 / 8", 16, [east("E-163", 8, 2.4), west("E-163", 8, 2.4)], ["Sicherheitsleuchten Flure", "Emergency luminaires, corridors"],
      ["Sicherheitsleuchten mit Einzelbatterie in den Fluren montieren und anschließen, je Flügel 8 Stück.", "Mount and connect emergency luminaires with single battery in the corridors, 8 pieces per wing."]),
    item("05.01", "east", 1, [east("E-170", 1)], ["Unterverteilung Ostflügel", "Sub-board, east wing"],
      ["Neue Unterverteilung bis 72 TE für den Ostflügel setzen und verdrahten.", "Set and wire a new sub-distribution board up to 72 modules for the east wing."]),
    item("05.02", "west", 1, [west("E-170", 1)], ["Unterverteilung Westflügel", "Sub-board, west wing"],
      ["Neue Unterverteilung bis 72 TE für den Westflügel setzen und verdrahten.", "Set and wire a new sub-distribution board up to 72 modules for the west wing."]),
    item("05.03", "circuits per wing from site description", 72, [east("E-171", 40, 1.4), west("E-171", 32, 1.4)], ["Leitungsschutzschalter", "Miniature circuit breakers"],
      ["Leitungsschutzschalter B16 in die beiden neuen Unterverteilungen einbauen und anschließen, einer je Stromkreis.", "Fit and connect B16 miniature circuit breakers in the two new sub-boards, one per circuit."]),
    item("05.04", "circuits per wing from site description", 72, [east("E-190", 40), west("E-190", 32)], ["Prüfen und Messen", "Testing and measuring"],
      ["Erstprüfung nach DIN VDE 0100-600 aller Stromkreise der beiden neuen Unterverteilungen, Prüfen und Messen je Stromkreis.", "Initial verification to DIN VDE 0100-600 of all circuits of the two new sub-boards, testing and measuring per circuit."]),
  ],
  projects: [
    project("P-2303", l("Sanierung Grundschule Lindenweg", "Renovation of Lindenweg primary school"), 2023,
      l("Bestandsgebäude, Baujahr 1962. Arbeiten in den Sommerferien, Gebäude leer.", "Existing building, built 1962. Works during the summer holidays, building empty."), true, false,
      [["E-180", 40, 3], ["E-181", 90], ["E-182", 600, 2.8], ["E-183", 1], ["E-130", 120], ["E-110", 300], ["E-140", 70, 0.3], ["E-151", 70, 0.3], ["E-150", 30, 1.05], ["E-164", 40, 3], ["E-170", 1], ["E-171", 30, 1.4], ["E-190", 30]]),
    project("P-2407", l("Neubau Anbau Klinik am Park", "New annex, Klinik am Park"), 2024,
      l("Neubau, angeschlossen an die Klinik und im laufenden Klinikbetrieb ausgeführt: Räume belegt, Arbeiten nach Freigabe, Schutzmaßnahmen.", "New build, attached to the hospital and executed while the hospital operated: rooms in use, work once released, protective measures."), false, true,
      [["E-121", 90, 2.8], ["E-111", 500, 2.8], ["E-142", 80, 0.3], ["E-151", 80, 0.3], ["E-160", 50, 2.7], ["E-163", 12, 2.4], ["E-170", 1], ["E-171", 24, 1.4], ["E-190", 24]]),
    project("P-2410", l("Neubau Lagerhalle Spedition Kurz", "New warehouse, Kurz logistics"), 2024,
      l("Neubau, leer, freier Zugang.", "New build, empty, free access."), false, false,
      [["E-120", 100, 6.2], ["E-112", 200, 6.2], ["E-161", 20, 6.2], ["E-152", 14, 1.1], ["E-163", 6, 2.5], ["E-170", 1], ["E-190", 18]]),
    project("P-2503", l("Sanierung Rathaus Nordstadt", "Renovation of Nordstadt town hall"), 2025,
      l("Bestandsgebäude, Baujahr 1958. Im laufenden Verwaltungsbetrieb: Büros besetzt, raumweise Arbeiten nach Freigabe, Abdeckungen.", "Existing building, built 1958. During normal office operation: offices occupied, room by room once released, coverings."), true, true,
      [["E-180", 30, 2.9], ["E-181", 70], ["E-182", 420, 2.7], ["E-130", 80], ["E-131", 16], ["E-110", 200], ["E-140", 50, 0.3], ["E-141", 6, 1.05], ["E-151", 60, 0.3], ["E-164", 30, 2.9], ["E-162", 8, 4.4], ["E-171", 20, 1.4], ["E-190", 20]]),
  ],
  hours,
  seed: 67,
};

export const electricalOccupiedRenovation = hoursTask(RENOVATION);
