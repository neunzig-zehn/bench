/**
 * Drywall with published rules, a faster crew, and one rule the company does not follow. The catalog
 * publishes working-height factors and a quantity scale per LV Item; the history, recomputed with
 * those rules, shows this company books 0.90 × catalog, except above 5 m, where it works from its own
 * aerial platform and books a height factor of 1.20 instead of the published 1.35. Traps: heights
 * from the site description (3.20 m walls stay at ×1.00), the quantity scale by catalog quantity
 * (none for pieces), bulkheads and soffits billed in metres but timed per m² of developed surface,
 * the crew factor that only shows once the rules are applied, and trusting the published factor
 * above 5 m over the bookings. Graded per Item and on the total by log deviation.
 */
import { catalogOf, hoursTask, num, standardMinutes, type Entry, type Fixture, type Item, type L, type Line, type PastItem, type Unit } from "./kit";

type Work = { height: number };

/** Hidden crew factor of this company against the catalog. */
const CREW = 0.9;
/** Hidden height factor above 5 m: the company's own aerial platform instead of the published 1.35. */
const HIGH = 1.2;

const entry = (code: string, unit: Entry["unit"], minutes: number, de: string, en: string): Entry => ({ code, unit, minutes, text: { de, en } });

const CATALOG: Entry[] = [
  entry("T-101", "m2", 55, "Metallständerwand CW 75, beidseitig 2x12,5 mm GKB, Dämmung, Q2", "Metal stud wall CW 75, 2x12.5 mm plasterboard both sides, insulation, Q2"),
  entry("T-102", "m2", 60, "Metallständerwand CW 100, beidseitig 2x12,5 mm GKB, Dämmung, Q2", "Metal stud wall CW 100, 2x12.5 mm plasterboard both sides, insulation, Q2"),
  entry("T-103", "m2", 70, "Metallständerwand CW 100 F90, beidseitig 2x12,5 mm GKF, Q2", "Metal stud wall CW 100 fire-rated F90, 2x12.5 mm fire board both sides, Q2"),
  entry("T-110", "m2", 35, "Vorsatzschale freistehend CW 50, einlagig 12,5 mm GKB", "Free-standing lining CW 50, single layer 12.5 mm plasterboard"),
  entry("T-120", "m2", 48, "Unterdecke abgehängt, GK 12,5 mm auf CD-Unterkonstruktion, Q2", "Suspended ceiling, 12.5 mm plasterboard on CD substructure, Q2"),
  entry("T-121", "m2", 62, "Akustikdecke abgehängt, gelochte Gipsplatten", "Suspended acoustic ceiling, perforated gypsum boards"),
  entry("T-130", "m2", 75, "Abkofferung oder Deckenschürze aus GK, je m² Abwicklung", "Plasterboard bulkhead or soffit, per m² of developed surface"),
  entry("T-140", "m2", 8, "Zulage Spachtelung Q3", "Extra for Q3 finish"),
  entry("T-150", "pc", 30, "Revisionsklappe 300x300 mm in Decke einbauen", "Access panel 300x300 mm, built into a ceiling"),
  entry("T-151", "pc", 60, "Türöffnung in Ständerwand mit UA-Profilen ausbilden", "Door opening in a stud wall, framed with UA profiles"),
  entry("T-160", "m", 4, "Kantenschutzprofil setzen", "Corner bead, fitted"),
];

const catalog = catalogOf(CATALOG);
const heightFactor = (height: number) => (height > 5 ? HIGH : height > 3.25 ? 1.15 : 1);
const quantityFactor = (unit: Unit, quantity: number) => (unit === "pc" ? 1 : quantity < 20 ? 1.3 : quantity < 100 ? 1.1 : quantity < 500 ? 1 : 0.92);
const hours = (lines: Line<Work>[]) =>
  lines.reduce((sum, line) => {
    const found = catalog(line.code);
    return sum + standardMinutes(found, line.quantity) * heightFactor(line.height) * quantityFactor(found.unit, line.quantity) * CREW;
  }, 0) / 60;

const l = (de: string, en: string): L => ({ de, en });

const item = (id: string, trap: string, code: string, quantity: number, unit: Unit, timed: number, height: number, short: [string, string], long: [string, string]): Item<Work> => ({
  id,
  trap,
  short: { de: short[0], en: short[1] },
  long: { de: long[0], en: long[1] },
  quantity,
  unit,
  lines: [{ code, quantity: timed, height }],
});

const at = (kind: "wall" | "ceiling", height: number): L =>
  kind === "wall" ? { de: `Wandhöhe ${num(height).de} m`, en: `wall height ${num(height).en} m` } : { de: `Unterdecke auf ${num(height).de} m`, en: `ceiling at ${num(height).en} m` };

const past = (code: string, quantity: number, kind: "wall" | "ceiling", height: number): PastItem<Work> => ({
  text: catalog(code).text,
  quantity,
  unit: catalog(code).unit,
  note: at(kind, height),
  lines: [{ code, quantity, height }],
});

export const DRYWALL: Fixture<Work, object> = {
  slug: "drywall-rules",
  title: "Drywall labour hours with height and quantity rules",
  description:
    "Drywall in a new school: 15 Items. The catalog publishes working-height factors (×1.15 above 3.25 m, ×1.35 above 5 m) and a quantity scale per Item (×1.30 under 20, ×1.10 under 100, ×0.92 from 500 catalog units, none for pieces); history recomputed with those rules shows the crew books 0.90 × catalog, and above 5 m, where it uses its own aerial platform, a height factor of 1.20 instead of 1.35. Traps: heights from the site description (3.20 m walls stay ×1.00), the scale applied to the catalog quantity, bulkheads and soffits in metres but timed per m² of developed surface, a crew factor hidden until the rules are applied, and the published factor above 5 m that the bookings contradict. Graded per Item and on the total (weight 5) by log deviation, 0 at a factor of 1.5.",
  company: l("Innenausbau Petersen GmbH", "Innenausbau Petersen GmbH"),
  project: l("Neubau Schulzentrum Ost, Trockenbau", "New build Schulzentrum Ost, drywall"),
  rules: l(
    `Zeitwertkatalog Innenausbau Petersen GmbH, Ausgabe 2026 – Vorbemerkungen

1. Die Zeitwerte sind Minuten je Katalogeinheit für einen Trockenbauer. Sie gelten für Neubau und eine Arbeitshöhe bis 3,25 m.
2. Arbeitshöhe ist bei Wänden die Wandhöhe, bei Decken, Abkofferungen und Schürzen die Höhe der Unterdecke über dem Fußboden. Über 3,25 m bis 5,00 m (Rollgerüst): Zeitwert × 1,15. Über 5,00 m (Raumgerüst oder Hubarbeitsbühne): Zeitwert × 1,35. Auf- und Umbau der Gerüste ist damit abgegolten.
3. Mengenstaffel je LV-Position nach der Menge in Katalogeinheiten (m² oder m): unter 20 × 1,30; 20 bis unter 100 × 1,10; 100 bis unter 500 × 1,00; ab 500 × 0,92. Einträge je Stück haben keine Staffel.
4. Abkofferungen und Deckenschürzen werden nach der Abwicklung in m² bemessen.
5. Alle Faktoren werden miteinander multipliziert.`,
    `Time catalog Innenausbau Petersen GmbH, 2026 edition – general conditions

1. Standard times are minutes per catalog unit for one drywaller. They apply to new builds and a working height up to 3.25 m.
2. The working height is the wall height for walls, and the height of the suspended ceiling above the floor for ceilings, bulkheads and soffits. Above 3.25 m up to 5.00 m (mobile scaffold): standard time × 1.15. Above 5.00 m (room scaffold or aerial work platform): standard time × 1.35. This covers erecting and moving the scaffolds.
3. Quantity scale per LV Item by its quantity in catalog units (m² or m): under 20 × 1.30; 20 to under 100 × 1.10; 100 to under 500 × 1.00; 500 and more × 0.92. Entries per piece have no scale.
4. Bulkheads and soffits are measured by their developed surface in m².
5. All factors multiply.`,
  ),
  catalog: CATALOG,
  site: [
    {
      title: l("Allgemeines", "General"),
      text: l(
        "Neubau Schulzentrum Ost, Innenausbau Trockenbau: Klassentrakt mit drei Geschossen, Treppenhäuser, Mensa und Mehrzweckhalle. Der Rohbau ist fertig und geschlossen.",
        "New build Schulzentrum Ost, drywall fit-out: three-storey classroom wing, stairwells, canteen and multi-purpose hall. The shell is complete and closed.",
      ),
    },
    {
      title: l("Klassentrakt", "Classroom wing"),
      text: l(
        "Geschosshöhe 3,55 m, Fußboden bis Rohdecke 3,20 m. Trennwände reichen vom Fußboden bis zur Rohdecke, Wandhöhe 3,20 m. Klassenräume: Akustikdecke auf 3,00 m. Flure: GK-Unterdecke auf 2,80 m, darunter eine Abkofferung für den Lüftungskanal. WC-Anlagen und Nebenräume wie Klassenräume.",
        "Storey height 3.55 m, floor to slab 3.20 m. Partitions run from floor to slab, wall height 3.20 m. Classrooms: acoustic ceiling at 3.00 m. Corridors: plasterboard ceiling at 2.80 m, with a bulkhead for the ventilation duct below it. WCs and ancillary rooms as classrooms.",
      ),
    },
    {
      title: l("Treppenhäuser", "Stairwells"),
      text: l(
        "Treppenhauswände in F90, je Geschoss vom Podest bis zur Rohdecke, Wandhöhe 3,60 m.",
        "Stairwell walls fire-rated F90, per storey from landing to slab, wall height 3.60 m.",
      ),
    },
    {
      title: l("Mensa", "Canteen"),
      text: l(
        "Rohdecke auf 4,80 m, Akustikdecke auf 4,20 m. Umlaufende Deckenschürze am Rand der Akustikdecke zwischen Unterdecke und Rohdecke.",
        "Slab at 4.80 m, acoustic ceiling at 4.20 m. A soffit runs round the edge of the acoustic ceiling between ceiling and slab.",
      ),
    },
    {
      title: l("Mehrzweckhalle", "Multi-purpose hall"),
      text: l(
        "Lichte Höhe 7,00 m. Die Trennwand zum Geräteraum reicht vom Hallenboden bis zur Rohdecke, Wandhöhe 7,00 m. Die Akustikdecke hängt auf 6,80 m. Über 5 m arbeiten wir wie in unseren bisherigen Hallen von unserer eigenen Hubarbeitsbühne aus.",
        "Clear height 7.00 m. The partition to the equipment room runs from the hall floor to the slab, wall height 7.00 m. The acoustic ceiling hangs at 6.80 m. Above 5 m we work from our own aerial work platform, as in our previous halls.",
      ),
    },
  ],
  attrs: {},
  items: [
    item("01.01", "≥500 ×0.92, crew 0.90", "T-102", 640, "m2", 640, 3.2, ["Ständerwand CW 100, Klassenräume", "Stud wall CW 100, classrooms"],
      ["Metallständerwand CW 100, beidseitig doppelt beplankt, mit Dämmung, Q2, Trennwände zwischen den Klassenräumen.", "Metal stud wall CW 100, double boarded both sides, with insulation, Q2, partitions between the classrooms."]),
    item("01.02", "20–100 ×1.10", "T-101", 85, "m2", 85, 3.2, ["Ständerwand CW 75, Nebenräume", "Stud wall CW 75, ancillary rooms"],
      ["Metallständerwand CW 75, beidseitig doppelt beplankt, mit Dämmung, Q2, WC-Anlagen und Lager im Klassentrakt.", "Metal stud wall CW 75, double boarded both sides, with insulation, Q2, WCs and stores in the classroom wing."]),
    item("01.03", "3.60 m ×1.15", "T-103", 120, "m2", 120, 3.6, ["Ständerwand CW 100 F90, Treppenhäuser", "Stud wall CW 100 F90, stairwells"],
      ["Metallständerwand CW 100 F90 mit Feuerschutzplatten, Q2, Treppenhauswände.", "Metal stud wall CW 100 F90 with fire boards, Q2, stairwell walls."]),
    item("01.04", "7.00 m: booked ×1.20 not ×1.35, 20–100 ×1.10", "T-102", 96, "m2", 96, 7, ["Ständerwand CW 100, Mehrzweckhalle", "Stud wall CW 100, multi-purpose hall"],
      ["Metallständerwand CW 100, beidseitig doppelt beplankt, mit Dämmung, Q2, Trennwand zwischen Mehrzweckhalle und Geräteraum.", "Metal stud wall CW 100, double boarded both sides, with insulation, Q2, partition between multi-purpose hall and equipment room."]),
    item("01.05", "<20 ×1.30", "T-110", 18, "m2", 18, 3.2, ["Vorsatzschale WC-Anlage", "Lining, WCs"],
      ["Freistehende Vorsatzschale CW 50 für die Installationswand der WC-Anlage im Erdgeschoss.", "Free-standing CW 50 lining for the installation wall of the ground-floor WCs."]),
    item("02.01", "100–500 ×1.00", "T-120", 410, "m2", 410, 2.8, ["GK-Unterdecke Flure", "Plasterboard ceiling, corridors"],
      ["Abgehängte GK-Unterdecke, Q2, Flure im Klassentrakt.", "Suspended plasterboard ceiling, Q2, corridors in the classroom wing."]),
    item("02.02", "≥500 ×0.92", "T-121", 720, "m2", 720, 3, ["Akustikdecke Klassenräume", "Acoustic ceiling, classrooms"],
      ["Abgehängte Akustikdecke aus gelochten Gipsplatten, Klassenräume.", "Suspended acoustic ceiling of perforated gypsum boards, classrooms."]),
    item("02.03", "4.20 m ×1.15", "T-121", 260, "m2", 260, 4.2, ["Akustikdecke Mensa", "Acoustic ceiling, canteen"],
      ["Abgehängte Akustikdecke aus gelochten Gipsplatten, Mensa.", "Suspended acoustic ceiling of perforated gypsum boards, canteen."]),
    item("02.04", "m → 33.6 m², 4.20 m ×1.15", "T-130", 42, "m", 33.6, 4.2, ["Deckenschürze Mensa", "Soffit, canteen"],
      ["Umlaufende Deckenschürze aus GK zwischen Akustikdecke und Rohdecke, Abwicklung 0,80 m, Mensa. Abrechnung nach Länge.", "Plasterboard soffit round the acoustic ceiling between ceiling and slab, developed width 0.80 m, canteen. Billed by length."]),
    item("02.05", "m → 28.6 m²", "T-130", 26, "m", 28.6, 2.8, ["Abkofferung Lüftungskanal Flur", "Bulkhead for corridor duct"],
      ["Abkofferung des Lüftungskanals unter der Flurdecke aus GK, Abwicklung 1,10 m. Abrechnung nach Länge.", "Plasterboard bulkhead round the ventilation duct below the corridor ceiling, developed width 1.10 m. Billed by length."]),
    item("02.06", "6.80 m: booked ×1.20 not ×1.35, ≥500 ×0.92", "T-121", 520, "m2", 520, 6.8, ["Akustikdecke Mehrzweckhalle", "Acoustic ceiling, multi-purpose hall"],
      ["Abgehängte Akustikdecke aus gelochten Gipsplatten, Mehrzweckhalle.", "Suspended acoustic ceiling of perforated gypsum boards, multi-purpose hall."]),
    item("03.01", "≥500 ×0.92", "T-140", 640, "m2", 640, 3.2, ["Zulage Q3 Klassenraumwände", "Extra for Q3, classroom walls"],
      ["Zulage für Spachtelung in Qualitätsstufe Q3 auf den Wänden der Pos. 01.01.", "Extra for Q3 finish on the walls of Item 01.01."]),
    item("03.02", "pieces, no scale", "T-150", 14, "pc", 14, 2.8, ["Revisionsklappen Flurdecke", "Access panels, corridor ceiling"],
      ["Revisionsklappe 300x300 mm in die GK-Unterdecke der Flure einbauen.", "Build 300x300 mm access panels into the corridor plasterboard ceiling."]),
    item("03.03", "pieces, no scale", "T-151", 22, "pc", 22, 3.2, ["Türöffnungen", "Door openings"],
      ["Türöffnungen in den Ständerwänden der Klassenräume mit UA-Profilen ausbilden.", "Frame door openings in the classroom stud walls with UA profiles."]),
    item("03.04", "100–500 ×1.00", "T-160", 180, "m", 180, 3.2, ["Kantenschutzprofile", "Corner beads"],
      ["Kantenschutzprofile an allen Außenecken der Wände im Klassentrakt setzen.", "Fit corner beads at all external wall corners in the classroom wing."]),
  ],
  projects: [
    {
      id: "P-2309",
      name: l("Neubau Gymnasium Nord, Innenausbau", "New build Gymnasium Nord, fit-out"),
      year: 2023,
      conditions: l("Neubau, Klassentrakt und Aula; Aula über 5 m von der eigenen Hubarbeitsbühne aus.", "New build, classroom wing and assembly hall; assembly hall above 5 m from our own aerial work platform."),
      attrs: {},
      items: [
        past("T-102", 820, "wall", 3), past("T-101", 60, "wall", 3), past("T-120", 380, "ceiling", 2.7), past("T-121", 540, "ceiling", 3), past("T-121", 180, "ceiling", 6),
        past("T-150", 10, "ceiling", 2.7), past("T-151", 18, "wall", 3), past("T-140", 820, "wall", 3), past("T-160", 140, "wall", 3), past("T-130", 18, "ceiling", 2.7),
      ],
    },
    {
      id: "P-2405",
      name: l("Neubau Bürohaus Hafenkante", "New build office building Hafenkante"),
      year: 2024,
      conditions: l("Neubau, Bürogeschosse.", "New build, office floors."),
      attrs: {},
      items: [
        past("T-101", 450, "wall", 2.9), past("T-110", 40, "wall", 2.9), past("T-103", 150, "wall", 3.5), past("T-120", 900, "ceiling", 2.7), past("T-130", 12, "ceiling", 2.7),
        past("T-150", 20, "ceiling", 2.7), past("T-151", 30, "wall", 2.9), past("T-160", 260, "wall", 2.9), past("T-140", 15, "wall", 2.9),
      ],
    },
    {
      id: "P-2511",
      name: l("Neubau Sporthalle Waldschule", "New build sports hall Waldschule"),
      year: 2025,
      conditions: l("Neubau, Einfeldhalle mit Nebenräumen; Halle über 5 m von der eigenen Hubarbeitsbühne aus.", "New build, single sports hall with ancillary rooms; hall above 5 m from our own aerial work platform."),
      attrs: {},
      items: [
        past("T-102", 210, "wall", 7.5), past("T-101", 14, "wall", 3), past("T-121", 120, "ceiling", 4.5), past("T-110", 65, "wall", 3),
        past("T-151", 4, "wall", 3), past("T-160", 30, "wall", 3), past("T-120", 85, "ceiling", 2.6), past("T-121", 380, "ceiling", 6.8),
      ],
    },
  ],
  hours,
  cluster: (lines) => (lines[0]!.height > 5 ? "high" : "low"),
  seed: 41,
};

export const drywallRules = hoursTask(DRYWALL);
