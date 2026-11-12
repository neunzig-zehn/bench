/**
 * Plumbing in an old building. The catalog is for new builds and leaves old-building surcharges to
 * the company's experience, so the factors must come from history, and they differ by kind of
 * work: in vacant old buildings removals and ceiling openings book 1.40 × catalog, pipework 1.15,
 * fixtures and tests 1.00 (new builds 1.00 throughout). Traps: one blanket factor fits no group; an
 * occupied old building in the history books more (1.55 / 1.30 / 1.20), and the site description
 * makes this one vacant; composite Items mix groups; ceiling openings differ by slab (timber-joist
 * floors, a brick-vault cellar ceiling). Graded per Item and on the total by log deviation.
 */
import { catalogOf, hoursTask, standardMinutes, type Entry, type Fixture, type Item, type L, type Line, type PastItem } from "./kit";

type Building = { building: "new" | "vacant" | "occupied" };
type Group = "strip" | "pipe" | "fit";

/** Hidden factors on the catalog by building and kind of work. */
const FACTORS: Record<Building["building"], Record<Group, number>> = {
  new: { strip: 1, pipe: 1, fit: 1 },
  vacant: { strip: 1.4, pipe: 1.15, fit: 1 },
  occupied: { strip: 1.55, pipe: 1.3, fit: 1.2 },
};

const entry = (code: string, unit: Entry["unit"], minutes: number, de: string, en: string): Entry => ({ code, unit, minutes, text: { de, en } });

const CATALOG: Entry[] = [
  entry("S-101", "m", 8, "Trinkwasserleitung Stahl verzinkt bis DN 32 demontieren und entsorgen", "Remove and dispose of galvanised steel water pipe up to DN 32"),
  entry("S-102", "m", 14, "Abwasserleitung Guss oder Steinzeug bis DN 100 demontieren und entsorgen", "Remove and dispose of cast-iron or stoneware drain pipe up to DN 100"),
  entry("S-103", "pc", 35, "WC-Anlage demontieren und entsorgen (Keramik, Spülkasten)", "Remove and dispose of a WC (ceramic, cistern)"),
  entry("S-104", "pc", 20, "Waschtisch demontieren und entsorgen", "Remove and dispose of a washbasin"),
  entry("S-105", "pc", 60, "Badewanne Stahl oder Guss demontieren und entsorgen", "Remove and dispose of a steel or cast-iron bathtub"),
  entry("S-110", "m", 9, "Mehrschichtverbundrohr 16x2 verlegen, mit Formstücken und Befestigung", "Multilayer composite pipe 16x2, laid with fittings and fixings"),
  entry("S-111", "m", 10, "Mehrschichtverbundrohr 20x2 verlegen, mit Formstücken und Befestigung", "Multilayer composite pipe 20x2, laid with fittings and fixings"),
  entry("S-112", "m", 12, "Mehrschichtverbundrohr 26x3 verlegen, mit Formstücken und Befestigung", "Multilayer composite pipe 26x3, laid with fittings and fixings"),
  entry("S-113", "m", 14, "Mehrschichtverbundrohr 32x3 verlegen, mit Formstücken und Befestigung", "Multilayer composite pipe 32x3, laid with fittings and fixings"),
  entry("S-120", "m", 12, "Abwasserrohr PP schallgedämmt DN 50 verlegen, mit Formstücken", "Sound-insulated PP drain pipe DN 50, laid with fittings"),
  entry("S-121", "m", 18, "Abwasserrohr PP schallgedämmt DN 100 verlegen, mit Formstücken", "Sound-insulated PP drain pipe DN 100, laid with fittings"),
  entry("S-122", "m", 28, "Abwasserrohr Guss SML DN 100 verlegen, mit Formstücken", "Cast-iron SML drain pipe DN 100, laid with fittings"),
  entry("S-130", "m", 5, "Rohrdämmung Trinkwasser bis 32 mm anbringen", "Pipe insulation for water pipes up to 32 mm"),
  entry("S-140", "pc", 75, "Vorwandelement WC montieren", "Pre-wall frame for a WC, mounted"),
  entry("S-141", "pc", 50, "Vorwandelement Waschtisch montieren", "Pre-wall frame for a washbasin, mounted"),
  entry("S-150", "pc", 40, "Wand-WC-Keramik montieren", "Wall-hung WC ceramic, mounted"),
  entry("S-151", "pc", 55, "Waschtisch mit Armatur montieren und anschließen", "Washbasin with tap, mounted and connected"),
  entry("S-152", "pc", 150, "Duschwanne bodeneben einbauen, einschließlich Ablauf", "Walk-in shower tray, installed including drain"),
  entry("S-153", "pc", 160, "Badewanne Stahl mit Wannenträger einbauen, einschließlich Ab- und Überlauf", "Steel bathtub on a tub support, installed including waste and overflow"),
  entry("S-160", "pc", 45, "Wohnungswasserzähler-Station montieren", "Apartment water meter station, mounted"),
  entry("S-161", "pc", 25, "Absperr- oder Strangventil bis DN 25 einbauen", "Shut-off or riser valve up to DN 25, fitted"),
  entry("S-170", "pc", 60, "Deckendurchbruch in Holzbalkendecke herstellen und schließen", "Ceiling opening in a timber-joist floor, made and closed"),
  entry("S-171", "pc", 45, "Kernbohrung in Stahlbetondecke bis DN 150, einschließlich Verschluss", "Core drilling in a reinforced concrete slab up to DN 150, including sealing"),
  entry("S-172", "pc", 90, "Deckendurchbruch in Ziegelgewölbe oder Kappendecke herstellen und schließen", "Ceiling opening in a brick vault or jack-arch ceiling, made and closed"),
  entry("S-180", "pc", 60, "Druckprobe und Spülen der Trinkwasserinstallation je Wohnung", "Pressure test and flushing of the water installation per apartment"),
];

const catalog = catalogOf(CATALOG);
const groupOf = (code: string): Group => {
  const number = Number(code.slice(2));
  return number < 110 || number >= 170 ? (number >= 180 ? "fit" : "strip") : number < 140 ? "pipe" : "fit";
};
const hours = (lines: Line<object>[], attrs: Building) =>
  lines.reduce((sum, line) => sum + standardMinutes(catalog(line.code), line.quantity) * FACTORS[attrs.building][groupOf(line.code)], 0) / 60;

const l = (de: string, en: string): L => ({ de, en });

const item = (id: string, trap: string, codes: string | string[], quantity: number, short: [string, string], long: [string, string]): Item<object> => ({
  id,
  trap,
  short: { de: short[0], en: short[1] },
  long: { de: long[0], en: long[1] },
  quantity,
  unit: catalog([codes].flat()[0]!).unit,
  lines: [codes].flat().map((code) => ({ code, quantity })),
});

const past = (code: string, quantity: number): PastItem<object> => ({ text: catalog(code).text, quantity, unit: catalog(code).unit, lines: [{ code, quantity }] });

export const PLUMBING: Fixture<object, Building> = {
  slug: "plumbing-old-building",
  title: "Plumbing labour hours for a riser renovation in an old building",
  description:
    "Plumbing in a vacant 1908 building: 18 Items. The catalog is for new builds and leaves old-building surcharges to experience; history books 1.00 × catalog in new builds and, in vacant old buildings, 1.40 for removals and ceiling openings, 1.15 for pipework, 1.00 for fixtures and tests; an occupied old building books more (1.55 / 1.30 / 1.20). Traps: one blanket factor, calibrating on the occupied project, composite Items that mix kinds of work (WC frame plus ceramic, bathtub out plus shower tray in), ceiling openings by slab type (timber-joist floors, jack-arch cellar ceiling, not concrete). Graded per Item and on the total (weight 5) by log deviation, 0 at a factor of 1.5.",
  company: l("Sanitär Wegener GmbH", "Sanitär Wegener GmbH"),
  project: l("Strangsanierung Mehrfamilienhaus Körnerstraße 12", "Riser renovation, apartment building Körnerstraße 12"),
  rules: l(
    `Zeitwertkatalog Sanitär Wegener GmbH, Ausgabe 2026 – Vorbemerkungen

1. Die Zeitwerte sind Minuten je Katalogeinheit für einen Monteur. Sie gelten für Neubau: Rohbau frei zugänglich, Material an der Einbaustelle.
2. Rohrleitungen einschließlich Formstücken und Befestigung; Dämmung ist ein eigener Eintrag.
3. Demontagen einschließlich Transport zum Container auf der Baustelle.
4. Der Katalog enthält keine Zuschläge für Altbau, bewohnte Gebäude oder sonstige Erschwernisse. Sie sind nach den Erfahrungswerten des Betriebs aus der Nachkalkulation anzusetzen.`,
    `Time catalog Sanitär Wegener GmbH, 2026 edition – general conditions

1. Standard times are minutes per catalog unit for one fitter. They apply to new builds: shell freely accessible, material at the point of installation.
2. Pipes include fittings and fixings; insulation is a separate entry.
3. Removals include transport to the skip on site.
4. The catalog holds no surcharges for old buildings, occupied buildings or other difficulties. Set them from the company's experience in its post-calculations.`,
  ),
  catalog: CATALOG,
  site: [
    {
      title: l("Allgemeines", "General"),
      text: l(
        "Strangsanierung des Mehrfamilienhauses Körnerstraße 12, Baujahr 1908: Keller, Erdgeschoss und 1. bis 3. Obergeschoss, 8 Wohnungen (2 je Geschoss), zwei Sanitärstränge vom Keller bis ins 3. Obergeschoss. Erneuert werden die Trinkwasser- und Abwasserleitungen und die Bäder.",
        "Riser renovation of the apartment building Körnerstraße 12, built 1908: cellar, ground floor and 1st to 3rd upper floor, 8 apartments (2 per floor), two plumbing risers from the cellar to the 3rd upper floor. The water and drain pipes and the bathrooms are renewed.",
      ),
    },
    {
      title: l("Nutzung während der Bauzeit", "Use during the works"),
      text: l(
        "Das Gebäude steht während der gesamten Bauzeit leer (Leerstand nach Auszug aller Mieter). Es muss keine Rücksicht auf Bewohner genommen werden. Arbeitszeit Mo–Fr 7–17 Uhr.",
        "The building is vacant for the whole of the works (all tenants have moved out). No consideration for residents is needed. Working hours Mon–Fri 7 am–5 pm.",
      ),
    },
    {
      title: l("Konstruktion", "Structure"),
      text: l(
        "Altbau: Die Geschossdecken über Erdgeschoss bis 3. Obergeschoss sind Holzbalkendecken mit Dielung und Schüttung. Die Kellerdecke ist eine preußische Kappendecke (Ziegelgewölbe zwischen Stahlträgern). Tragende Wände aus Vollziegelmauerwerk. Die alten Leitungen liegen auf Putz und in gemauerten Schächten.",
        "Old building: the floors above the ground floor up to the 3rd upper floor are timber-joist floors with boarding and fill. The cellar ceiling is a Prussian jack-arch ceiling (brick vaults between steel beams). Load-bearing walls are solid brick masonry. The old pipes run on the wall surface and in brick shafts.",
      ),
    },
    {
      title: l("Baustellenlogistik", "Site logistics"),
      text: l(
        "Container im Hof, Materialtransport über das Treppenhaus, kein Aufzug.",
        "Skip in the courtyard, material carried through the stairwell, no lift.",
      ),
    },
  ],
  attrs: { building: "vacant" },
  items: [
    item("01.01", "removal ×1.40", "S-101", 210, ["Demontage Trinkwasserleitungen", "Removal of water pipes"],
      ["Alte Trinkwasserleitungen Stahl verzinkt bis DN 32 demontieren und entsorgen, beide Stränge mit Wohnungsanbindungen.", "Remove and dispose of the old galvanised steel water pipes up to DN 32, both risers with apartment connections."]),
    item("01.02", "removal ×1.40", "S-102", 34, ["Demontage Fallleitungen", "Removal of drain stacks"],
      ["Gusseiserne Fallleitungen DN 100 beider Stränge demontieren und entsorgen.", "Remove and dispose of the cast-iron DN 100 drain stacks of both risers."]),
    item("01.03", "removal ×1.40", "S-103", 8, ["Demontage WC-Anlagen", "Removal of WCs"],
      ["WC-Anlagen mit Spülkasten demontieren und entsorgen, je Wohnung eine.", "Remove and dispose of the WCs with cisterns, one per apartment."]),
    item("01.04", "removal ×1.40", "S-104", 8, ["Demontage Waschtische", "Removal of washbasins"],
      ["Waschtische demontieren und entsorgen, je Wohnung einer.", "Remove and dispose of the washbasins, one per apartment."]),
    item("02.01", "timber-joist floor, opening ×1.40", "S-170", 8, ["Deckendurchbrüche Geschossdecken", "Openings in upper floors"],
      ["Deckendurchbrüche für die neuen Stränge herstellen und nach der Montage schließen, Geschossdecken über EG bis 3. OG, 2 Stränge je 4 Decken.", "Make openings for the new risers and close them after installation, floors above ground floor up to 3rd upper floor, 2 risers through 4 floors each."]),
    item("02.02", "jack-arch ceiling, opening ×1.40", "S-172", 2, ["Deckendurchbrüche Kellerdecke", "Openings in cellar ceiling"],
      ["Deckendurchbrüche für die neuen Stränge durch die Kellerdecke herstellen und schließen, 2 Stränge.", "Make openings for the new risers through the cellar ceiling and close them, 2 risers."]),
    item("03.01", "pipework ×1.15", "S-113", 44, ["Mehrschichtverbundrohr 32x3", "Multilayer composite pipe 32x3"],
      ["Steigleitungen Trinkwasser kalt und warm aus Mehrschichtverbundrohr 32x3 verlegen, beide Stränge.", "Lay cold and hot water risers in multilayer composite pipe 32x3, both risers."]),
    item("03.02", "pipework ×1.15", "S-111", 96, ["Mehrschichtverbundrohr 20x2", "Multilayer composite pipe 20x2"],
      ["Wohnungsverteilleitungen aus Mehrschichtverbundrohr 20x2 verlegen.", "Lay apartment distribution pipes in multilayer composite pipe 20x2."]),
    item("03.03", "pipework ×1.15", "S-110", 128, ["Mehrschichtverbundrohr 16x2", "Multilayer composite pipe 16x2"],
      ["Anbindeleitungen zu den Entnahmestellen aus Mehrschichtverbundrohr 16x2 verlegen.", "Lay connection pipes to the outlets in multilayer composite pipe 16x2."]),
    item("03.04", "PP not cast iron, pipework ×1.15", "S-121", 36, ["Abwasserrohr PP DN 100", "PP drain pipe DN 100"],
      ["Fallleitungen aus schallgedämmtem PP-Abwasserrohr DN 100 verlegen, beide Stränge.", "Lay drain stacks in sound-insulated PP drain pipe DN 100, both risers."]),
    item("03.05", "pipework ×1.15", "S-120", 64, ["Abwasserrohr PP DN 50", "PP drain pipe DN 50"],
      ["Anschlussleitungen aus schallgedämmtem PP-Abwasserrohr DN 50 verlegen.", "Lay branch drains in sound-insulated PP drain pipe DN 50."]),
    item("03.06", "pipework ×1.15", "S-130", 268, ["Rohrdämmung Trinkwasser", "Water pipe insulation"],
      ["Rohrdämmung für alle neuen Trinkwasserleitungen der Pos. 03.01 bis 03.03 anbringen.", "Insulate all new water pipes of Items 03.01 to 03.03."]),
    item("04.01", "composite: frame + ceramic", ["S-140", "S-150"], 8, ["WC-Anlage komplett", "Complete WC"],
      ["WC-Anlage komplett: Vorwandelement für Wand-WC montieren und Wand-WC-Keramik darauf montieren, je Wohnung eine.", "Complete WC: mount a pre-wall frame for a wall-hung WC and mount the wall-hung WC ceramic on it, one per apartment."]),
    item("04.02", "fixture ×1.00", "S-151", 8, ["Waschtisch mit Armatur", "Washbasin with tap"],
      ["Waschtisch 60 cm mit Einhebelmischer montieren und anschließen.", "Mount and connect 60 cm washbasins with single-lever mixers."]),
    item("04.03", "composite: tub out ×1.40 + shower in ×1.00", ["S-105", "S-152"], 8, ["Duschplatz statt Badewanne", "Shower in place of bathtub"],
      ["Gusseiserne Badewanne ausbauen und entsorgen, an ihrer Stelle eine bodenebene Duschwanne mit Ablauf einbauen, je Wohnung eine.", "Remove and dispose of the cast-iron bathtub and install a walk-in shower tray with drain in its place, one per apartment."]),
    item("04.04", "fixture ×1.00", "S-160", 8, ["Wohnungswasserzähler", "Apartment water meters"],
      ["Wohnungswasserzähler-Station montieren, je Wohnung eine.", "Mount apartment water meter stations, one per apartment."]),
    item("04.05", "fixture ×1.00", "S-161", 4, ["Strangabsperrventile", "Riser shut-off valves"],
      ["Strangabsperrventile DN 25 im Keller einbauen, kalt und warm je Strang.", "Fit DN 25 riser shut-off valves in the cellar, cold and hot per riser."]),
    item("04.06", "test ×1.00", "S-180", 8, ["Druckprobe und Spülen", "Pressure test and flushing"],
      ["Druckprobe und Spülen der Trinkwasserinstallation, je Wohnung.", "Pressure test and flushing of the water installation, per apartment."]),
  ],
  projects: [
    {
      id: "P-2311",
      name: l("Neubau Mehrfamilienhaus Am Mühlbach", "New build apartment building Am Mühlbach"),
      year: 2023,
      conditions: l("Neubau, 10 Wohnungen, Stahlbetondecken, Aufzug, Rohbau frei zugänglich.", "New build, 10 apartments, reinforced concrete slabs, lift, shell freely accessible."),
      attrs: { building: "new" },
      items: [
        past("S-113", 40), past("S-111", 120), past("S-110", 150), past("S-121", 30), past("S-120", 70), past("S-130", 310), past("S-140", 10),
        past("S-150", 10), past("S-151", 10), past("S-153", 6), past("S-152", 4), past("S-160", 10), past("S-171", 12), past("S-180", 10),
      ],
    },
    {
      id: "P-2404",
      name: l("Strangsanierung Bergstraße 7", "Riser renovation Bergstraße 7"),
      year: 2024,
      conditions: l("Altbau, Baujahr 1896, Holzbalkendecken, Kellerdecke Kappendecke, Leerstand während der Bauzeit, kein Aufzug.", "Old building, built 1896, timber-joist floors, jack-arch cellar ceiling, vacant during the works, no lift."),
      attrs: { building: "vacant" },
      items: [
        past("S-101", 180), past("S-102", 30), past("S-103", 6), past("S-104", 6), past("S-105", 6), past("S-170", 8), past("S-172", 2),
        past("S-113", 36), past("S-110", 100), past("S-121", 32), past("S-120", 50), past("S-140", 6), past("S-152", 6), past("S-180", 6),
      ],
    },
    {
      id: "P-2410",
      name: l("Badsanierung Wohnanlage Lessingstraße 21–25", "Bathroom renovation, Lessingstraße 21–25"),
      year: 2024,
      conditions: l(
        "Altbau, Baujahr 1912, bewohnt: Die Mieter blieben während der Arbeiten in den Wohnungen, Arbeiten je Bad in Etappen, kein Aufzug.",
        "Old building, built 1912, occupied: the tenants stayed in their apartments during the works, each bathroom done in stages, no lift.",
      ),
      attrs: { building: "occupied" },
      items: [
        past("S-103", 12), past("S-104", 12), past("S-105", 12), past("S-110", 90), past("S-111", 60), past("S-120", 60),
        past("S-140", 12), past("S-150", 12), past("S-151", 12), past("S-152", 12), past("S-180", 12),
      ],
    },
    {
      id: "P-2507",
      name: l("Sanierung Hafenstraße 3", "Renovation Hafenstraße 3"),
      year: 2025,
      conditions: l("Altbau, Baujahr 1905, Holzbalkendecken, Leerstand während der Bauzeit, kein Aufzug.", "Old building, built 1905, timber-joist floors, vacant during the works, no lift."),
      attrs: { building: "vacant" },
      items: [
        past("S-101", 120), past("S-102", 22), past("S-170", 6), past("S-113", 28), past("S-111", 70), past("S-121", 26),
        past("S-130", 98), past("S-160", 6), past("S-161", 4), past("S-150", 6), past("S-151", 6),
      ],
    },
  ],
  hours,
  cluster: (lines) => groupOf(lines[0]!.code),
  seed: 23,
};

export const plumbingOldBuilding = hoursTask(PLUMBING);
