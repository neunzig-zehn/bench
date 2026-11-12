/**
 * Ventilation ducts timed by sheet surface. The LV gives rectangular ducts in metres with their
 * cross-section and fittings per piece with their developed surface, the catalog times per m² by
 * size class of the larger side. Traps: perimeter × length (2 × (a + b)), class boundaries (500 and
 * 1000 mm belong to the lower class), insulation in metres timed per m², fire dampers by
 * cross-section area (0.24 m² stays in the small class), and mounting heights from the site
 * description (plant room 4.60 m ×1.25, atrium 6.80 m ×1.50). History books 1.00 × catalog. Graded
 * per Item and on the total by log deviation.
 */
import { catalogOf, hoursTask, num, standardMinutes, type Entry, type Fixture, type Item, type L, type Line, type PastItem, type Unit } from "./kit";

type Work = { height: number };

const entry = (code: string, unit: Entry["unit"], minutes: number, de: string, en: string): Entry => ({ code, unit, minutes, text: { de, en } });

const CATALOG: Entry[] = [
  entry("L-101", "m2", 42, "Rechteckige Luftleitung, größere Kante bis 500 mm, je m² Blechoberfläche", "Rectangular duct, larger side up to 500 mm, per m² of sheet surface"),
  entry("L-102", "m2", 36, "Rechteckige Luftleitung, größere Kante 501 bis 1000 mm, je m² Blechoberfläche", "Rectangular duct, larger side 501 to 1000 mm, per m² of sheet surface"),
  entry("L-103", "m2", 32, "Rechteckige Luftleitung, größere Kante über 1000 mm, je m² Blechoberfläche", "Rectangular duct, larger side over 1000 mm, per m² of sheet surface"),
  entry("L-110", "m2", 60, "Rechteckige Formstücke (Bögen, Übergänge, T-Stücke), je m² Abwicklung", "Rectangular fittings (bends, transitions, tees), per m² of developed surface"),
  entry("L-120", "m", 12, "Wickelfalzrohr DN 100 bis 200", "Spiral duct DN 100 to 200"),
  entry("L-121", "m", 18, "Wickelfalzrohr DN 250 bis 400", "Spiral duct DN 250 to 400"),
  entry("L-125", "pc", 10, "Formstück rund DN 100 bis 200 (Bogen, Abzweig, Reduzierung)", "Round fitting DN 100 to 200 (bend, branch, reducer)"),
  entry("L-126", "pc", 16, "Formstück rund DN 250 bis 400 (Bogen, Abzweig, Reduzierung)", "Round fitting DN 250 to 400 (bend, branch, reducer)"),
  entry("L-130", "pc", 120, "Brandschutzklappe rechteckig, Querschnitt bis 0,25 m²", "Rectangular fire damper, cross-section up to 0.25 m²"),
  entry("L-131", "pc", 160, "Brandschutzklappe rechteckig, Querschnitt über 0,25 m²", "Rectangular fire damper, cross-section over 0.25 m²"),
  entry("L-132", "pc", 90, "Brandschutzklappe rund bis DN 200", "Round fire damper up to DN 200"),
  entry("L-140", "pc", 15, "Tellerventil einbauen", "Disc valve, fitted"),
  entry("L-141", "pc", 35, "Drallauslass in Decke einbauen und anschließen", "Swirl diffuser, built into a ceiling and connected"),
  entry("L-150", "m2", 20, "Dämmung Mineralwolle alukaschiert, je m² Oberfläche", "Mineral wool insulation with foil facing, per m² of surface"),
  entry("L-160", "pc", 45, "Volumenstromregler rund bis DN 200", "Round variable air volume controller up to DN 200"),
];

const catalog = catalogOf(CATALOG);
const heightFactor = (height: number) => (height > 6 ? 1.5 : height > 4 ? 1.25 : 1);
const hours = (lines: Line<Work>[]) => lines.reduce((sum, line) => sum + standardMinutes(catalog(line.code), line.quantity) * heightFactor(line.height), 0) / 60;

/** Sheet surface of a rectangular duct in m²: perimeter × length, sides in mm. */
const surface = (a: number, b: number, length: number) => (2 * (a + b) * length) / 1000;
const ductCode = (a: number, b: number) => (Math.max(a, b) <= 500 ? "L-101" : Math.max(a, b) <= 1000 ? "L-102" : "L-103");

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

const duct = (id: string, trap: string, a: number, b: number, length: number, height: number, where: [string, string]): Item<Work> =>
  item(id, trap, ductCode(a, b), length, "m", surface(a, b, length), height, [`Rechteckige Luftleitung ${a}x${b} mm`, `Rectangular duct ${a}x${b} mm`], [
    `Rechteckige Luftleitung aus verzinktem Stahlblech, ${a}x${b} mm, mit Abhängungen montieren, ${where[0]}. Abrechnung nach Länge.`,
    `Rectangular galvanised sheet steel duct, ${a}x${b} mm, install with hangers, ${where[1]}. Billed by length.`,
  ]);

const below = (height: number): L => ({ de: `Unterkante ${num(height).de} m`, en: `underside ${num(height).en} m` });

const pastDuct = (a: number, b: number, length: number, height: number): PastItem<Work> => ({
  text: { de: `Rechteckige Luftleitung ${a}x${b} mm`, en: `Rectangular duct ${a}x${b} mm` },
  quantity: length,
  unit: "m",
  note: below(height),
  lines: [{ code: ductCode(a, b), quantity: surface(a, b, length), height }],
});

const pastFittings = (count: number, each: number, height: number): PastItem<Work> => ({
  text: { de: "Rechteckige Formstücke", en: "Rectangular fittings" },
  quantity: count,
  unit: "pc",
  note: {
    de: `Abwicklung im Mittel ${num(each).de} m² je Stück; ${below(height).de}`,
    en: `developed surface ${num(each).en} m² per piece on average; ${below(height).en}`,
  },
  lines: [{ code: "L-110", quantity: count * each, height }],
});

const pastInsulation = (a: number, b: number, length: number, height: number): PastItem<Work> => ({
  text: { de: `Dämmung der Luftleitung ${a}x${b} mm`, en: `Insulation of the ${a}x${b} mm duct` },
  quantity: length,
  unit: "m",
  note: below(height),
  lines: [{ code: "L-150", quantity: surface(a, b, length), height }],
});

const past = (code: string, quantity: number, height: number, text?: L): PastItem<Work> => ({
  text: text ?? catalog(code).text,
  quantity,
  unit: catalog(code).unit,
  note: below(height),
  lines: [{ code, quantity, height }],
});

export const VENTILATION: Fixture<Work, object> = {
  slug: "ventilation-duct-surface",
  title: "Ventilation labour hours from duct surfaces",
  description:
    "Ventilation in a new laboratory building: 17 Items. Rectangular ducts come in metres with their cross-section, the catalog times them per m² of sheet surface by size class of the larger side; fittings per piece with an average developed surface; insulation in metres. Traps: perimeter × length, class boundaries (500 and 1000 mm stay in the lower class), fire dampers by cross-section area, and mounting heights (plant room 4.60 m ×1.25, atrium 6.80 m ×1.50, labs 3.40 m ×1.00). History books 1.00 × catalog. Graded per Item and on the total (weight 5) by log deviation, 0 at a factor of 1.5.",
  company: l("Klimatechnik Hoffmann GmbH", "Klimatechnik Hoffmann GmbH"),
  project: l("Neubau Laborgebäude Campus Süd, RLT-Anlage 2", "New build laboratory building Campus Süd, air handling system 2"),
  rules: l(
    `Zeitwertkatalog Klimatechnik Hoffmann GmbH, Ausgabe 2026 – Vorbemerkungen

1. Die Zeitwerte sind Minuten je Katalogeinheit für einen Monteur. Sie gelten für Neubau und eine Montagehöhe (Unterkante Bauteil über Fußboden) bis 4,00 m. Abhängungen und Befestigungen sind enthalten.
2. Rechteckige Luftleitungen werden nach Blechoberfläche in m² bemessen: Umfang × Länge. Die Größenklasse richtet sich nach der größeren Kantenlänge.
3. Rechteckige Formstücke werden nach ihrer Abwicklung in m² bemessen, Dämmungen nach der gedämmten Oberfläche in m².
4. Runde Luftleitungen (Wickelfalzrohr) je m, runde Formstücke je Stück, jeweils nach Nenndurchmesser.
5. Brandschutzklappen rechteckig nach der Querschnittsfläche (Breite × Höhe).
6. Montagehöhe über 4,00 m bis 6,00 m (Hubarbeitsbühne): Zeitwert × 1,25. Über 6,00 m (Gerüst): Zeitwert × 1,50.`,
    `Time catalog Klimatechnik Hoffmann GmbH, 2026 edition – general conditions

1. Standard times are minutes per catalog unit for one fitter. They apply to new builds and a mounting height (underside of the component above the floor) up to 4.00 m. Hangers and fixings are included.
2. Rectangular ducts are measured by sheet surface in m²: perimeter × length. The size class follows the larger side.
3. Rectangular fittings are measured by their developed surface in m², insulation by the insulated surface in m².
4. Round ducts (spiral duct) per m, round fittings per piece, each by nominal diameter.
5. Rectangular fire dampers by cross-section area (width × height).
6. Mounting height above 4.00 m up to 6.00 m (aerial work platform): standard time × 1.25. Above 6.00 m (scaffold): standard time × 1.50.`,
  ),
  catalog: CATALOG,
  site: [
    {
      title: l("Allgemeines", "General"),
      text: l(
        "Neubau Laborgebäude Campus Süd, RLT-Anlage 2 für Zu- und Abluft der Labore. Der Rohbau ist fertig; Hubarbeitsbühnen und Gerüste stellt der Betrieb.",
        "New build laboratory building Campus Süd, air handling system 2 for the labs' supply and extract air. The shell is complete; the company provides aerial work platforms and scaffolds.",
      ),
    },
    {
      title: l("Technikzentrale", "Plant room"),
      text: l(
        "Technikzentrale im Dachgeschoss mit dem Lüftungsgerät und den Hauptleitungen. Die Leitungen und Brandschutzklappen hängen mit Unterkante auf 4,60 m.",
        "Plant room on the top floor with the air handling unit and the main ducts. Ducts and fire dampers hang with their underside at 4.60 m.",
      ),
    },
    {
      title: l("Laborgeschosse", "Laboratory floors"),
      text: l(
        "1. bis 3. Obergeschoss. Alle Leitungen, Klappen und Regler liegen im Deckenhohlraum, Unterkante 3,40 m. Abgehängte Decke auf 3,00 m mit den Drallauslässen.",
        "1st to 3rd upper floor. All ducts, dampers and controllers run in the ceiling void, underside 3.40 m. Suspended ceiling at 3.00 m with the swirl diffusers.",
      ),
    },
    {
      title: l("Atrium", "Atrium"),
      text: l(
        "Die Verbindungsleitung 1000x400 mm zwischen Ost- und Westflügel überquert das Atrium frei sichtbar, Unterkante 6,80 m.",
        "The 1000x400 mm connecting duct between the east and west wings crosses the atrium exposed, underside 6.80 m.",
      ),
    },
    {
      title: l("Nebenräume", "Ancillary rooms"),
      text: l("WC-Anlagen und Lager: Tellerventile in der Decke auf 2,60 m.", "WCs and stores: disc valves in the ceiling at 2.60 m."),
    },
  ],
  attrs: {},
  items: [
    duct("01.01", "U × L = 95.2 m², >1000, 4.60 m ×1.25", 1200, 500, 28, 4.6, ["Außenluft- und Zuluft-Hauptleitung in der Technikzentrale", "outside and supply air main in the plant room"]),
    duct("01.02", "U × L = 110.4 m², 501–1000", 800, 400, 46, 3.4, ["Verteilleitungen der Laborgeschosse im Deckenhohlraum", "distribution ducts of the laboratory floors in the ceiling void"]),
    duct("01.03", "500 stays ≤500 class", 500, 250, 84, 3.4, ["Abzweigleitungen der Laborgeschosse im Deckenhohlraum", "branch ducts of the laboratory floors in the ceiling void"]),
    duct("01.04", "1000 stays 501–1000, atrium ×1.50", 1000, 400, 18, 6.8, ["Verbindungsleitung über das Atrium", "connecting duct across the atrium"]),
    item("01.05", "12 × 1.9 m², 4.60 m ×1.25", "L-110", 12, "pc", 22.8, 4.6, ["Rechteckige Formstücke Technikzentrale", "Rectangular fittings, plant room"],
      ["Bögen und Übergänge zur Hauptleitung der Pos. 01.01 in der Technikzentrale, Abwicklung im Mittel 1,90 m² je Stück.", "Bends and transitions for the main duct of Item 01.01 in the plant room, developed surface 1.90 m² per piece on average."]),
    item("01.06", "30 × 1.2 m²", "L-110", 30, "pc", 36, 3.4, ["Rechteckige Formstücke Laborgeschosse", "Rectangular fittings, laboratory floors"],
      ["Bögen, Übergänge und T-Stücke zu den Leitungen der Pos. 01.02 und 01.03, Abwicklung im Mittel 1,20 m² je Stück.", "Bends, transitions and tees for the ducts of Items 01.02 and 01.03, developed surface 1.20 m² per piece on average."]),
    item("02.01", "per m", "L-120", 210, "m", 210, 3.4, ["Wickelfalzrohr DN 160", "Spiral duct DN 160"],
      ["Wickelfalzrohr DN 160 zu den Laborauslässen im Deckenhohlraum montieren.", "Install DN 160 spiral duct to the lab outlets in the ceiling void."]),
    item("02.02", "per m", "L-121", 64, "m", 64, 3.4, ["Wickelfalzrohr DN 315", "Spiral duct DN 315"],
      ["Wickelfalzrohr DN 315 als Sammelleitung der Laborabluft im Deckenhohlraum montieren.", "Install DN 315 spiral duct as lab extract collector in the ceiling void."]),
    item("02.03", "per piece", "L-125", 85, "pc", 85, 3.4, ["Formstücke rund DN 160", "Round fittings DN 160"],
      ["Bögen, Abzweige und Reduzierungen DN 160 zu Pos. 02.01.", "Bends, branches and reducers DN 160 for Item 02.01."]),
    item("02.04", "per piece", "L-126", 18, "pc", 18, 3.4, ["Formstücke rund DN 315", "Round fittings DN 315"],
      ["Bögen und Abzweige DN 315 zu Pos. 02.02.", "Bends and branches DN 315 for Item 02.02."]),
    item("03.01", "0.24 m² ≤ 0.25", "L-130", 6, "pc", 6, 3.4, ["Brandschutzklappe 600x400 mm", "Fire damper 600x400 mm"],
      ["Brandschutzklappe rechteckig 600x400 mm in den Leitungen der Laborgeschosse an den Wanddurchführungen einbauen.", "Fit rectangular 600x400 mm fire dampers in the laboratory floor ducts at the wall penetrations."]),
    item("03.02", "0.32 m² > 0.25, 4.60 m ×1.25", "L-131", 2, "pc", 2, 4.6, ["Brandschutzklappe 800x400 mm", "Fire damper 800x400 mm"],
      ["Brandschutzklappe rechteckig 800x400 mm in der Technikzentrale an der Wanddurchführung zum Schacht einbauen.", "Fit rectangular 800x400 mm fire dampers in the plant room at the wall penetration to the shaft."]),
    item("03.03", "round damper", "L-132", 12, "pc", 12, 3.4, ["Brandschutzklappe rund DN 160", "Round fire damper DN 160"],
      ["Brandschutzklappe rund DN 160 in den Laborgeschossen einbauen.", "Fit round DN 160 fire dampers on the laboratory floors."]),
    item("03.04", "plain", "L-160", 24, "pc", 24, 3.4, ["Volumenstromregler DN 160", "VAV controller DN 160"],
      ["Volumenstromregler DN 160 je Labor einbauen.", "Fit a DN 160 VAV controller per lab."]),
    item("03.05", "suspended ceiling 3.00 m", "L-141", 48, "pc", 48, 3, ["Drallauslässe Labore", "Swirl diffusers, labs"],
      ["Drallauslass in die abgehängte Decke der Labore einbauen und anschließen.", "Build swirl diffusers into the labs' suspended ceiling and connect them."]),
    item("03.06", "plain", "L-140", 16, "pc", 16, 2.6, ["Tellerventile Nebenräume", "Disc valves, ancillary rooms"],
      ["Tellerventile in den Decken der WC-Anlagen und Lager einbauen.", "Fit disc valves in the ceilings of the WCs and stores."]),
    item("04.01", "m → 95.2 m², 4.60 m ×1.25", "L-150", 28, "m", surface(1200, 500, 28), 4.6, ["Dämmung Außenluftleitung", "Insulation of outside air duct"],
      ["Dämmung der Außenluftleitung 1200x500 mm aus Pos. 01.01 mit alukaschierter Mineralwolle, auf ganzer Länge. Abrechnung nach Länge.", "Insulate the 1200x500 mm outside air duct of Item 01.01 with foil-faced mineral wool over its full length. Billed by length."]),
  ],
  projects: [
    {
      id: "P-2304",
      name: l("Neubau Bürogebäude Westend, RLT-Anlage", "New build office building Westend, air handling"),
      year: 2023,
      conditions: l("Neubau, Bürogeschosse und Technikzentrale.", "New build, office floors and plant room."),
      attrs: {},
      items: [
        pastDuct(600, 300, 40, 3.2), pastDuct(400, 200, 60, 3.2), pastDuct(1400, 600, 20, 5), pastFittings(14, 1.5, 3.2), past("L-120", 120, 3.2, l("Wickelfalzrohr DN 200", "Spiral duct DN 200")),
        past("L-121", 30, 3.2, l("Wickelfalzrohr DN 250", "Spiral duct DN 250")), past("L-125", 50, 3.2, l("Formstücke rund DN 200", "Round fittings DN 200")),
        past("L-130", 4, 3.2, l("Brandschutzklappe 500x400 mm", "Fire damper 500x400 mm")), past("L-141", 30, 2.8), pastInsulation(1400, 600, 20, 5),
      ],
    },
    {
      id: "P-2501",
      name: l("Neubau Forschungszentrum Halle C", "New build research centre hall C"),
      year: 2025,
      conditions: l("Neubau, Versuchshalle und Büros.", "New build, test hall and offices."),
      attrs: {},
      items: [
        pastDuct(1200, 800, 15, 7), pastDuct(500, 300, 50, 3.1), pastFittings(20, 0.9, 3.1), past("L-160", 16, 3.1, l("Volumenstromregler DN 160", "VAV controller DN 160")),
        past("L-132", 8, 3.1, l("Brandschutzklappe rund DN 160", "Round fire damper DN 160")), past("L-131", 2, 3.1, l("Brandschutzklappe 1000x500 mm", "Fire damper 1000x500 mm")),
        past("L-140", 12, 2.6), past("L-121", 40, 3.1, l("Wickelfalzrohr DN 315", "Spiral duct DN 315")), past("L-126", 12, 3.1, l("Formstücke rund DN 315", "Round fittings DN 315")),
      ],
    },
  ],
  hours,
  seed: 53,
};

export const ventilationDuctSurface = hoursTask(VENTILATION);
