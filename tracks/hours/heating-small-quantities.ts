/**
 * Heating repairs in small quantities. The catalog times are for series work and exclude set-up
 * and side times per work step; the company's history shows a fixed time per LV Item on top of the
 * catalog, 45 minutes for water-side Items and 20 minutes for dry ones, which the estimator must fit
 * from bookings at different quantities (the catalog marks water-side entries and says they take
 * longer to set up; the site description says each Item is its own work order). Traps: set-up
 * dominates Items of 1–3 pieces, it counts once per Item and not per piece, one pooled set-up time
 * misses both kinds, a valve-plus-head Item is water-side as a whole, and an exchange is removal plus
 * mounting. Graded per Item and on the total by log deviation.
 */
import { catalogOf, hoursTask, standardMinutes, type Entry, type Fixture, type Item, type L, type Line, type PastItem } from "./kit";

/** Hidden set-up and side time per LV Item, in minutes. */
const SETUP_MINUTES = { wet: 45, dry: 20 };

const WET = new Set<string>();
const entry = (code: string, unit: Entry["unit"], minutes: number, de: string, en: string, wet: boolean, note?: L): Entry => {
  if (wet) WET.add(code);
  return { code, unit, minutes, text: wet ? { de: `${de} (wasserseitig)`, en: `${en} (water side)` } : { de, en }, ...(note ? { note } : {}) };
};

const l = (de: string, en: string): L => ({ de, en });

const CATALOG: Entry[] = [
  entry("H-101", "pc", 25, "Heizkörper demontieren (Platten- oder Gliederheizkörper), Anlage entleert", "Radiator removed (panel or sectional), system drained", true),
  entry("H-102", "pc", 55, "Kompaktheizkörper bis 1200 mm Baulänge montieren und anschließen", "Compact radiator up to 1200 mm length, mounted and connected", true),
  entry("H-103", "pc", 75, "Kompaktheizkörper über 1200 mm Baulänge montieren und anschließen", "Compact radiator over 1200 mm length, mounted and connected", true),
  entry("H-110", "pc", 20, "Thermostatventilunterteil tauschen, Anlage entleert", "Thermostatic valve body exchanged, system drained", true),
  entry("H-111", "pc", 4, "Thermostatkopf tauschen (alten Kopf abnehmen, neuen montieren)", "Thermostatic head exchanged (old head removed, new one fitted)", false),
  entry("H-112", "pc", 12, "Rücklaufverschraubung tauschen, Anlage entleert", "Return lockshield valve exchanged, system drained", true),
  entry("H-120", "m", 18, "Stahlrohr bis DN 25 verlegen, mit Formstücken und Befestigung", "Steel pipe up to DN 25, laid with fittings and fixings", true),
  entry("H-121", "m", 12, "Kupferrohr 15 bis 22 mm verlegen, mit Formstücken und Befestigung", "Copper pipe 15 to 22 mm, laid with fittings and fixings", true),
  entry("H-125", "m", 7, "Rohrleitung bis DN 25 demontieren und entsorgen", "Pipe up to DN 25, removed and disposed of", true),
  entry("H-130", "m", 6, "Rohrdämmung bis DN 25 anbringen", "Pipe insulation up to DN 25, fitted", false),
  entry("H-140", "pc", 90, "Heizungsumwälzpumpe tauschen", "Heating circulation pump exchanged", true, l("Austausch komplett: alte Pumpe demontieren, neue Pumpe montieren und einstellen.", "Complete exchange: remove the old pump, mount and set the new one.")),
  entry("H-141", "pc", 60, "Absperrklappe DN 50 einbauen", "Butterfly shut-off valve DN 50, fitted", true),
  entry("H-142", "pc", 10, "Schnellentlüfter einbauen", "Automatic air vent, fitted", true),
  entry("H-150", "pc", 8, "Ventil für den hydraulischen Abgleich voreinstellen, je Heizkörper", "Valve preset for hydraulic balancing, per radiator", false),
  entry("H-160", "pc", 50, "Strang entleeren, befüllen und entlüften", "Riser drained, refilled and vented", true),
];

const catalog = catalogOf(CATALOG);
const kind = (lines: Line<object>[]) => (lines.some((line) => WET.has(line.code)) ? "wet" : "dry");
const hours = (lines: Line<object>[]) => (SETUP_MINUTES[kind(lines)] + lines.reduce((sum, line) => sum + standardMinutes(catalog(line.code), line.quantity), 0)) / 60;

const item = (id: string, trap: string, codes: string[], quantity: number, short: [string, string], long: [string, string]): Item<object> => ({
  id,
  trap,
  short: { de: short[0], en: short[1] },
  long: { de: long[0], en: long[1] },
  quantity,
  unit: catalog(codes[0]!).unit,
  lines: codes.map((code) => ({ code, quantity })),
});

const EXCHANGE = l("Heizkörper bis 1200 mm tauschen", "Radiator up to 1200 mm exchanged");
const EXCHANGE_LONG = l("Heizkörper über 1200 mm tauschen", "Radiator over 1200 mm exchanged");
const VALVE = l("Thermostatventil mit Thermostatkopf tauschen", "Thermostatic valve with head exchanged");

const past = (codes: string[], quantity: number, text?: L): PastItem<object> => ({
  text: text ?? catalog(codes[0]!).text,
  quantity,
  unit: catalog(codes[0]!).unit,
  lines: codes.map((code) => ({ code, quantity })),
});

const CONDITIONS = l(
  "Bestandsgebäude, Arbeiten während der Ferien im leeren Gebäude, alle Arbeiten unter 3 m Höhe; jede LV-Position war ein eigener Arbeitsauftrag.",
  "Existing building, works during the holidays in the empty building, all work below 3 m height; each LV Item was its own work order.",
);

export const HEATING: Fixture<object, object> = {
  slug: "heating-small-quantities",
  title: "Heating labour hours for repairs in small quantities",
  description:
    "Heating repairs: 17 Items, most of 1–3 pieces. Catalog times are for series work and exclude set-up and side times; history shows a fixed time per LV Item on top, 45 min for water-side Items and 20 min for dry ones, which must be fitted from bookings at different quantities. Traps: catalog-only estimates are 30–60 % low on small Items, adding set-up per piece overshoots large Items, one pooled set-up time misses both kinds (small dry Items by more than half), valve plus head is water-side as a whole, an exchange is removal plus mounting, and one radiator size class over 1200 mm. Graded per Item and on the total (weight 5) by log deviation, 0 at a factor of 1.5.",
  company: l("Wärmetechnik Lorenz GmbH", "Wärmetechnik Lorenz GmbH"),
  project: l("Instandsetzung Heizung Verwaltungsgebäude Haus B", "Heating repairs, administration building B"),
  rules: l(
    `Zeitwertkatalog Wärmetechnik Lorenz GmbH, Ausgabe 2026 – Vorbemerkungen

1. Die Zeitwerte sind Minuten je Katalogeinheit für einen Monteur. Sie gelten für Neubau und Bestand gleichermaßen und für Arbeitshöhen bis 3,00 m.
2. Die Zeitwerte gelten für Serienmontage und enthalten nur die Arbeit an der Einheit selbst. Rüst- und Nebenzeiten je Arbeitsgang (Arbeitsstelle einrichten, Material und Werkzeug zur Einbaustelle bringen, Aufräumen) sind nicht enthalten; sie sind nach der Erfahrung des Betriebs anzusetzen. Wasserseitige Arbeitsgänge (Eingriff in die Anlage, im Katalog als „wasserseitig“ vermerkt) brauchen mehr Rüstzeit als Arbeiten ohne Eingriff in die Anlage. Eine Position mit mindestens einem wasserseitigen Eintrag gilt insgesamt als wasserseitig.
3. Ein Austausch besteht aus Demontage und Montage (zwei Einträge), außer der Eintrag nennt den Austausch selbst.
4. Entleeren und Befüllen einer Anlage ist ein eigener Eintrag.`,
    `Time catalog Wärmetechnik Lorenz GmbH, 2026 edition – general conditions

1. Standard times are minutes per catalog unit for one fitter. They apply to new and existing buildings alike and to working heights up to 3.00 m.
2. Standard times are for series work and cover only the work on the unit itself. Set-up and side times per work step (setting up the workplace, bringing material and tools to the point of installation, clearing up) are not included; set them from the company's experience. Water-side work steps (opening the system, marked "water side" in the catalog) need more set-up time than work without opening the system. An Item with at least one water-side entry counts as water-side as a whole.
3. An exchange consists of removal and mounting (two entries), unless the entry names the exchange itself.
4. Draining and refilling a system is a separate entry.`,
  ),
  catalog: CATALOG,
  site: [
    {
      title: l("Allgemeines", "General"),
      text: l(
        "Instandsetzung der Heizungsanlage im Verwaltungsgebäude Haus B (Baujahr 1994, drei Geschosse). Zweirohrheizung mit Stahlrohr und Kompaktheizkörpern, Heizkreise Nord und Süd, Heizzentrale im Keller.",
        "Repairs to the heating system of administration building B (built 1994, three storeys). Two-pipe system with steel pipes and compact radiators, heating circuits North and South, boiler room in the cellar.",
      ),
    },
    {
      title: l("Ausführungszeit und Nutzung", "Timing and use"),
      text: l(
        "Ausführung in den Sommerferien; das Gebäude ist in dieser Zeit geschlossen und leer. Alle Arbeiten liegen unter 3 m Höhe.",
        "Execution during the summer holidays; the building is closed and empty then. All work is below 3 m height.",
      ),
    },
    {
      title: l("Arbeitsorganisation", "Work organisation"),
      text: l(
        "Jede LV-Position wird als eigener Arbeitsauftrag ausgeführt und gebucht, wie in unseren bisherigen Instandsetzungsprojekten. Die Anlage wird je Position vom Kunden vorab entleert, soweit das LV das Entleeren nicht selbst ausschreibt.",
        "Each LV Item is executed and booked as its own work order, as in our previous repair projects. The client drains the system ahead of each Item unless the LV lists draining itself.",
      ),
    },
  ],
  attrs: {},
  items: [
    item("01.01", "1 piece, set-up dominates", ["H-101", "H-102"], 1, ["Heizkörper tauschen, Raum B.104", "Exchange radiator, room B.104"],
      ["Vorhandenen Plattenheizkörper demontieren und entsorgen, neuen Kompaktheizkörper 600x1000 mm montieren und anschließen, Raum B.104.", "Remove and dispose of the existing panel radiator, mount and connect a new 600x1000 mm compact radiator, room B.104."]),
    item("01.02", "over 1200 mm", ["H-101", "H-103"], 3, ["Heizkörper tauschen, Sitzungssaal", "Exchange radiators, meeting hall"],
      ["Vorhandene Heizkörper demontieren und entsorgen, neue Kompaktheizkörper 600x1400 mm montieren und anschließen, Sitzungssaal.", "Remove and dispose of the existing radiators, mount and connect new 600x1400 mm compact radiators, meeting hall."]),
    item("01.03", "large, set-up once", ["H-101", "H-102"], 14, ["Heizkörper tauschen, Büros 1. OG", "Exchange radiators, offices 1st floor"],
      ["Vorhandene Heizkörper demontieren und entsorgen, neue Kompaktheizkörper 600x1000 mm montieren und anschließen, Büros im 1. OG.", "Remove and dispose of the existing radiators, mount and connect new 600x1000 mm compact radiators, offices on the 1st floor."]),
    item("01.04", "valve plus head is water-side", ["H-110", "H-111"], 2, ["Thermostatventile tauschen, Flur EG", "Exchange thermostatic valves, ground-floor corridor"],
      ["Thermostatventilunterteil tauschen und neuen Thermostatkopf montieren, Flur EG.", "Exchange the thermostatic valve body and fit a new thermostatic head, ground-floor corridor."]),
    item("01.05", "heads only, dry", ["H-111"], 36, ["Thermostatköpfe tauschen, 2. OG", "Exchange thermostatic heads, 2nd floor"],
      ["Thermostatköpfe auf vorhandene Ventile tauschen, Ventilunterteile bleiben, Büros im 2. OG.", "Exchange thermostatic heads on the existing valves, valve bodies stay, offices on the 2nd floor."]),
    item("01.06", "2 pieces, set-up dominates", ["H-112"], 2, ["Rücklaufverschraubungen tauschen", "Exchange lockshield valves"],
      ["Rücklaufverschraubungen an zwei Heizkörpern im Archiv tauschen.", "Exchange the return lockshield valves of two radiators in the archive."]),
    item("01.07", "dry, 2 pieces", ["H-111"], 2, ["Thermostatköpfe tauschen, Hausmeisterbüro", "Exchange thermostatic heads, caretaker's office"],
      ["Thermostatköpfe auf vorhandene Ventile tauschen, Ventilunterteile bleiben, Hausmeisterbüro im EG.", "Exchange thermostatic heads on the existing valves, valve bodies stay, caretaker's office on the ground floor."]),
    item("02.01", "small length", ["H-120"], 6, ["Stahlrohr DN 20", "Steel pipe DN 20"],
      ["Neue Anbindeleitungen aus Stahlrohr DN 20 zu den Heizkörpern im Sitzungssaal verlegen.", "Lay new steel pipe DN 20 connections to the radiators in the meeting hall."]),
    item("02.02", "copper", ["H-121"], 4, ["Kupferrohr 18 mm", "Copper pipe 18 mm"],
      ["Anbindeleitung aus Kupferrohr 18 mm zum Heizkörper der Teeküche verlegen.", "Lay a copper pipe 18 mm connection to the kitchenette radiator."]),
    item("02.03", "small length", ["H-125"], 9, ["Rohrleitungen demontieren", "Remove pipes"],
      ["Alte Stahlrohrleitungen DN 20 im Sitzungssaal demontieren und entsorgen.", "Remove and dispose of the old DN 20 steel pipes in the meeting hall."]),
    item("02.04", "dry, medium length", ["H-130"], 48, ["Rohrdämmung DN 20", "Pipe insulation DN 20"],
      ["Rohrdämmung an den freiliegenden Verteilleitungen im Keller anbringen.", "Insulate the exposed distribution pipes in the cellar."]),
    item("02.05", "dry, small length", ["H-130"], 3, ["Rohrdämmung ergänzen, Heizzentrale", "Complete pipe insulation, boiler room"],
      ["Fehlende Rohrdämmung an den Anschlussleitungen in der Heizzentrale ergänzen.", "Add the missing pipe insulation on the connection pipes in the boiler room."]),
    item("03.01", "exchange is one entry", ["H-140"], 1, ["Heizungspumpe tauschen, Heizkreis Nord", "Exchange pump, circuit North"],
      ["Umwälzpumpe des Heizkreises Nord gegen Hocheffizienzpumpe tauschen und einstellen.", "Exchange the circuit North circulation pump for a high-efficiency pump and set it."]),
    item("03.02", "2 pieces", ["H-141"], 2, ["Absperrklappen DN 50", "Butterfly valves DN 50"],
      ["Absperrklappen DN 50 im Vor- und Rücklauf des Heizkreises Süd einbauen.", "Fit DN 50 butterfly valves in the flow and return of circuit South."]),
    item("03.03", "1 piece, set-up dominates", ["H-142"], 1, ["Schnellentlüfter", "Automatic air vent"],
      ["Schnellentlüfter am Hochpunkt des Heizkreises Nord einbauen.", "Fit an automatic air vent at the high point of circuit North."]),
    item("03.04", "dry, large", ["H-150"], 52, ["Hydraulischer Abgleich", "Hydraulic balancing"],
      ["Thermostatventile aller Heizkörper nach Berechnung voreinstellen, je Heizkörper.", "Preset the thermostatic valves of all radiators to the calculation, per radiator."]),
    item("03.05", "1 piece", ["H-160"], 1, ["Strang entleeren und befüllen", "Drain and refill riser"],
      ["Strang Nord nach Abschluss der Arbeiten befüllen und entlüften; vorher entleeren.", "Drain riser North before, refill and vent it after the works."]),
  ],
  projects: [
    {
      id: "P-2306",
      name: l("Heizungssanierung Grundschule Am Park", "Heating renovation, Am Park primary school"),
      year: 2023,
      conditions: CONDITIONS,
      attrs: {},
      items: [
        past(["H-101", "H-102"], 18, EXCHANGE), past(["H-101", "H-102"], 1, EXCHANGE), past(["H-111"], 40), past(["H-110", "H-111"], 3, VALVE), past(["H-125"], 24),
        past(["H-120"], 30), past(["H-130"], 30), past(["H-140"], 2), past(["H-150"], 64), past(["H-160"], 1), past(["H-142"], 4),
      ],
    },
    {
      id: "P-2412",
      name: l("Instandsetzung Heizung Feuerwehrhaus", "Heating repairs, fire station"),
      year: 2024,
      conditions: CONDITIONS,
      attrs: {},
      items: [
        past(["H-101", "H-103"], 2, EXCHANGE_LONG), past(["H-121"], 12), past(["H-112"], 8), past(["H-141"], 1), past(["H-140"], 1),
        past(["H-142"], 1), past(["H-160"], 2), past(["H-110", "H-111"], 10, VALVE), past(["H-130"], 6), past(["H-111"], 3),
      ],
    },
    {
      id: "P-2509",
      name: l("Heizkörpertausch Bürohaus Kantstraße", "Radiator exchange, Kantstraße office building"),
      year: 2025,
      conditions: CONDITIONS,
      attrs: {},
      items: [
        past(["H-101", "H-102"], 26, EXCHANGE), past(["H-101", "H-103"], 1, EXCHANGE_LONG), past(["H-112"], 26), past(["H-110", "H-111"], 27, VALVE),
        past(["H-150"], 27), past(["H-125"], 3), past(["H-120"], 4), past(["H-160"], 1), past(["H-121"], 2), past(["H-141"], 3), past(["H-130"], 2), past(["H-150"], 4),
      ],
    },
  ],
  hours,
  cluster: kind,
  seed: 37,
};

export const heatingSmallQuantities = hoursTask(HEATING);
