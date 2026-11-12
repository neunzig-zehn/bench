/**
 * A bill of quantities for drywall and screed as OCR text pages, in German and in English: titles
 * and subtitles with sums, positions whose kind is stated only in their text, long texts with
 * misleading words ("nach Bedarf", "alternativ"), positions broken across page breaks, repeated
 * headers with carry-overs, and OCR damage in quantities. Titles 01–04 are written by hand; the
 * rest come from the seeded generator in `boq-families.ts`, so the BoQ has the size of a real one
 * with near-duplicate positions. The ground truth is known by construction.
 */
import type { Lang } from "../../../src/types";
import type { GoldPosition, GoldTitle } from "../boq-positions";
import { formatNumber, type Text } from "../shared";
import { generateTitles, UNITS, type Position, type Title } from "./boq-families";

const { m2, m, pcs, h, ls } = UNITS;

const wall = (cw: number, double: boolean, fire: string | undefined, depth: string, depthEn: string): Pick<Position, "short" | "long"> => ({
  short: {
    de: `Metallständerwand CW ${cw}, ${double ? "doppelt" : "einfach"} beplankt${fire ? `, ${fire}` : ""}`,
    en: `Metal stud wall CW ${cw}, ${double ? "double" : "single"}-boarded${fire ? `, ${fire}` : ""}`,
  },
  long: {
    de: `Nichttragende Trennwand aus Metallständerprofilen CW ${cw}, Achsabstand 62,5 cm, beidseitig ${double ? "zweilagig" : "einlagig"} mit ${fire ? "Feuerschutzplatten GKF" : "Gipsplatten GKB"} 12,5 mm beplankt, Wanddicke ${depth} cm, Hohlraum mit Mineralwolle gedämmt.${fire ? ` Feuerwiderstand ${fire} mit allgemeinem bauaufsichtlichem Prüfzeugnis.` : ""} Anschlussprofile nach Bedarf.`,
    en: `Non-load-bearing partition of metal stud profiles CW ${cw}, centres 62.5 cm, boarded on both sides with ${double ? "two layers" : "one layer"} of ${fire ? "fire-resistant GKF boards" : "GKB plasterboard"} 12.5 mm, wall thickness ${depthEn} cm, cavity insulated with mineral wool.${fire ? ` Fire resistance ${fire} with a general building authority test certificate.` : ""} Connection profiles as required.`,
  },
});

export const PROJECT: Record<Lang, { name: string; boq: string }> = {
  de: { name: "Neubau Kita Sonnenweg", boq: "LV 420 Trockenbau und Estrich" },
  en: { name: "New Sonnenweg day-care centre", boq: "BoQ 420 Drywall and screed" },
};

const HAND_TITLES: Title[] = [
  {
    rno: "01",
    label: { de: "Trennwände", en: "Partition walls" },
    subtitles: [
      {
        rno: "01",
        label: { de: "Metallständerwände", en: "Metal stud walls" },
        positions: [
          { rno: "0010", ...wall(75, true, "EI 30", "12,5", "12.5"), qty: 412.25, unit: m2, kind: "normal" },
          {
            rno: "0020",
            ...wall(100, true, "EI 90", "15", "15"),
            qty: 186.5,
            unit: m2,
            kind: "base",
            marker: { de: "Grundposition, Alternative siehe 01.01.0030", en: "Base item, see alternative 01.01.0030" },
          },
          {
            rno: "0030",
            short: { de: "Metallständerwand CW 75, Brandschutzplatten, EI 90", en: "Metal stud wall CW 75, fire boards, EI 90" },
            long: {
              de: "Wie vor, jedoch mit Ständerprofilen CW 75 und beidseitig zweilagiger Beplankung aus Brandschutzplatten 15 mm, Wanddicke 13,5 cm.",
              en: "As before, but with CW 75 stud profiles and two layers of 15 mm fire boards on both sides, wall thickness 13.5 cm.",
            },
            qty: 186.5,
            unit: m2,
            kind: "alternative",
            marker: { de: "Alternativposition zu 01.01.0020", en: "Alternative item to 01.01.0020" },
            alternativeTo: "01.01.0020",
          },
          {
            rno: "0040",
            ...wall(50, false, undefined, "7,5", "7.5"),
            long: {
              de: "Nichttragende Trennwand aus Metallständerprofilen CW 50, beidseitig einlagig mit Gipsplatten GKB 12,5 mm beplankt, Wanddicke 7,5 cm. In Feuchträumen alternativ imprägnierte Platten GKBI ohne Mehrpreis.",
              en: "Non-load-bearing partition of metal stud profiles CW 50, boarded on both sides with one layer of GKB plasterboard 12.5 mm, wall thickness 7.5 cm. In wet rooms alternatively impregnated GKBI boards at no extra cost.",
            },
            qty: 96.75,
            unit: m2,
            kind: "normal",
            ocr: "merged",
          },
          {
            rno: "0050",
            short: { de: "Zulage zu 01.01.0010 für Wandhöhen über 4,00 m", en: "Extra over 01.01.0010 for wall heights above 4.00 m" },
            long: {
              de: "Mehrpreis für Wandflächen oberhalb 4,00 m Höhe einschließlich verstärkter Profile und Gerüst.",
              en: "Additional price for wall areas above 4.00 m height including reinforced profiles and scaffold.",
            },
            qty: 84,
            unit: m2,
            kind: "surcharge",
          },
          {
            rno: "0060",
            short: { de: "Türöffnung in Metallständerwand, 1,01 x 2,13 m", en: "Door opening in metal stud wall, 1.01 x 2.13 m" },
            long: {
              de: "Türöffnung mit UA-Aussteifungsprofilen und Sturzausbildung herstellen, für Türzargen bis 50 kg.",
              en: "Form a door opening with UA stiffening profiles and lintel, for door frames up to 50 kg.",
            },
            qty: 38,
            unit: pcs,
            kind: "normal",
          },
          {
            rno: "0070",
            short: { de: "Schallschutzstreifen unter Ständerwand", en: "Acoustic strip under stud wall" },
            long: {
              de: "Elastischen Dämmstreifen unter dem Bodenanschlussprofil einbauen, nur auf Anordnung der Bauleitung.",
              en: "Fit an elastic insulating strip under the floor track, only on the site manager's instruction.",
            },
            qty: 145,
            unit: m,
            kind: "optional_without_total",
            marker: { de: "Bedarfsposition, nur Einheitspreis", en: "Provisional item, unit price only" },
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Vorsatzschalen und Schachtwände", en: "Wall linings and shaft walls" },
        positions: [
          {
            rno: "0010",
            short: { de: "Vorsatzschale CW 50, einlagig beplankt", en: "Wall lining CW 50, single-boarded" },
            long: {
              de: "Freistehende Vorsatzschale aus CW-50-Profilen, einseitig einlagig mit Gipsplatten GKB 12,5 mm beplankt.",
              en: "Free-standing wall lining of CW 50 profiles, boarded on one side with one layer of GKB plasterboard 12.5 mm.",
            },
            qty: 132.4,
            unit: m2,
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: "Installationswand Sanitär, d = 15 cm", en: "Sanitary installation wall, d = 15 cm" },
            long: {
              de: "Installationswand für Vorwandelemente, doppelt beplankt mit imprägnierten Platten GKBI, Traversen nach Angabe Sanitär.",
              en: "Installation wall for pre-wall elements, double-boarded with impregnated GKBI boards, cross members as specified by plumbing.",
            },
            qty: 48.6,
            unit: m2,
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: "Schachtwand EI 90, einseitig beplankt", en: "Shaft wall EI 90, boarded on one side" },
            long: {
              de: "Schachtwand aus CW-Profilen mit dreilagiger Beplankung aus Feuerschutzplatten auf der Raumseite, Feuerwiderstand EI 90.",
              en: "Shaft wall of CW profiles with three layers of fire-resistant boards on the room side, fire resistance EI 90.",
            },
            qty: 36.25,
            unit: m2,
            kind: "normal",
          },
          {
            rno: "0040",
            short: { de: "Revisionsklappe in Schachtwand, 40 x 40 cm", en: "Access panel in shaft wall, 40 x 40 cm" },
            long: {
              de: "Revisionsklappe EI 90 mit Rahmen und Schloss in die Schachtwand einbauen.",
              en: "Install an EI 90 access panel with frame and lock in the shaft wall.",
            },
            qty: 12,
            unit: pcs,
            kind: "optional_with_total",
            marker: { de: "Bedarfsposition mit GB", en: "Provisional item with total" },
          },
          {
            rno: "0050",
            short: { de: "Eckschutzschiene verzinkt", en: "Galvanised corner bead" },
            long: {
              de: "Eckschutzschienen an Außenecken einspachteln, Stückelung nach Bedarf.",
              en: "Embed corner beads at external corners in filler, lengths as required.",
            },
            qty: 210,
            unit: m,
            kind: "normal",
            ocr: "letter-o",
          },
        ],
      },
    ],
  },
  {
    rno: "02",
    label: { de: "Deckenarbeiten", en: "Ceiling works" },
    subtitles: [
      {
        rno: "01",
        label: { de: "Abgehängte Decken", en: "Suspended ceilings" },
        positions: [
          {
            rno: "0010",
            short: { de: "Gipsplattendecke, abgehängt, einlagig", en: "Plasterboard ceiling, suspended, single layer" },
            long: {
              de: "Abgehängte Decke aus Gipsplatten GKB 12,5 mm auf CD-Unterkonstruktion, Abhängehöhe bis 60 cm, Fugen gespachtelt Q2.",
              en: "Suspended ceiling of GKB plasterboard 12.5 mm on CD substructure, suspension height up to 60 cm, joints filled to Q2.",
            },
            qty: 640.8,
            unit: m2,
            kind: "base",
            marker: { de: "Grundposition, Wahlposition siehe 02.01.0060", en: "Base item, see option 02.01.0060" },
          },
          {
            rno: "0020",
            short: { de: "Akustikdecke gelocht, 8/18 R", en: "Perforated acoustic ceiling, 8/18 R" },
            long: {
              de: "Akustikdecke aus gelochten Gipsplatten mit Rundlochung 8/18, Akustikvlies rückseitig, Absorberklasse C.",
              en: "Acoustic ceiling of perforated plasterboard with 8/18 round perforation, acoustic fleece on the back, absorber class C.",
            },
            qty: 318,
            unit: m2,
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: "Zulage zu 02.01.0010 für Deckenschürzen", en: "Extra over 02.01.0010 for ceiling bulkheads" },
            long: {
              de: "Mehrpreis für senkrechte Deckenschürzen bis 50 cm Höhe einschließlich Kantenschutz.",
              en: "Additional price for vertical ceiling bulkheads up to 50 cm high including edge protection.",
            },
            qty: 74,
            unit: m,
            kind: "surcharge",
          },
          {
            rno: "0040",
            short: { de: "Deckensprung herstellen, Höhe bis 30 cm", en: "Form ceiling step, height up to 30 cm" },
            long: {
              de: "Deckensprung als Abkofferung mit Unterkonstruktion und Beplankung, gerade geführt.",
              en: "Ceiling step as a boxed-in drop with substructure and boarding, straight.",
            },
            qty: 52.5,
            unit: m,
            kind: "normal",
          },
          {
            rno: "0050",
            short: { de: "Unterkonstruktion für Deckenleuchten verstärken", en: "Reinforce substructure for ceiling luminaires" },
            long: {
              de: "Zusätzliche Abhänger und Querprofile für Leuchten über 6 kg einbauen.",
              en: "Install additional hangers and cross profiles for luminaires above 6 kg.",
            },
            qty: 96,
            unit: pcs,
            kind: "optional_without_total",
            marker: { de: "Eventualposition (nur EP)", en: "Contingency item (unit price only)" },
          },
          {
            rno: "0060",
            short: { de: "Mineralfaserdecke 62,5 x 62,5 cm, abgehängt", en: "Mineral fibre ceiling 62.5 x 62.5 cm, suspended" },
            long: {
              de: "Abgehängte Rasterdecke aus Mineralfaserplatten auf sichtbarem T-Profil-System, Kante SK.",
              en: "Suspended grid ceiling of mineral fibre tiles on an exposed T-profile system, square edge.",
            },
            qty: 640.8,
            unit: m2,
            kind: "alternative",
            marker: { de: "Wahlposition zu 02.01.0010", en: "Optional item instead of 02.01.0010" },
            alternativeTo: "02.01.0010",
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Revisionsöffnungen und Einbauten", en: "Access panels and fittings" },
        positions: [
          {
            rno: "0010",
            short: { de: "Revisionsklappe in Decke, 60 x 60 cm", en: "Ceiling access panel, 60 x 60 cm" },
            long: {
              de: "Revisionsklappe mit Aluminiumrahmen und Push-Lock-Verschluss in Gipsplattendecke einbauen.",
              en: "Install an access panel with aluminium frame and push lock in the plasterboard ceiling.",
            },
            qty: 18,
            unit: pcs,
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: "Ausschnitt für Einbauleuchte, bis Ø 200 mm", en: "Cut-out for recessed luminaire, up to Ø 200 mm" },
            long: {
              de: "Runden Ausschnitt in der Decke herstellen, Lage nach Elektroplanung.",
              en: "Cut a round opening in the ceiling, position as per electrical design.",
            },
            qty: 124,
            unit: pcs,
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: "Brandschutzkanal EI 30 aus Gipsplatten", en: "Fire-rated duct enclosure EI 30 of plasterboard" },
            long: {
              de: "Selbständiger Kanal für Leitungen mit Feuerwiderstand EI 30, Querschnitt bis 30 x 20 cm.",
              en: "Self-supporting enclosure for services with fire resistance EI 30, cross-section up to 30 x 20 cm.",
            },
            qty: 26.8,
            unit: m,
            kind: "optional_with_total",
            marker: { de: "Eventualposition mit Gesamtbetrag", en: "Contingency item with total" },
          },
        ],
      },
    ],
  },
  {
    rno: "03",
    label: { de: "Estricharbeiten", en: "Screed works" },
    subtitles: [
      {
        rno: "01",
        label: { de: "Dämmung und Trennlagen", en: "Insulation and separating layers" },
        positions: [
          {
            rno: "0010",
            short: { de: "Trittschalldämmung EPS-T 30-3", en: "Impact sound insulation EPS-T 30-3" },
            long: {
              de: "Trittschalldämmplatten aus elastifiziertem Polystyrol, Dicke 30 mm, dicht gestoßen verlegt.",
              en: "Impact sound insulation boards of elasticised polystyrene, 30 mm thick, laid with tight joints.",
            },
            qty: 1120.5,
            unit: m2,
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: "Wärmedämmung EPS 040, d = 60 mm", en: "Thermal insulation EPS 040, d = 60 mm" },
            long: {
              de: "Wärmedämmplatten aus Polystyrol als untere Lage, Druckspannung mindestens 100 kPa.",
              en: "Polystyrene thermal insulation boards as bottom layer, compressive stress at least 100 kPa.",
            },
            qty: 1120.5,
            unit: m2,
            kind: "normal",
            ocr: "letter-o",
          },
          {
            rno: "0030",
            short: { de: "Randdämmstreifen 10 mm", en: "Edge insulation strip 10 mm" },
            long: {
              de: "Randdämmstreifen aus PE-Schaum an allen aufgehenden Bauteilen, Überstand erst nach Belagsverlegung abschneiden.",
              en: "PE foam edge strips at all rising components, trim the overhang only after laying the floor finish.",
            },
            qty: 860,
            unit: m,
            kind: "normal",
          },
          {
            rno: "0040",
            short: { de: "PE-Folie als Trennlage", en: "PE sheet as separating layer" },
            long: {
              de: "PE-Folie 0,2 mm, Stöße 20 cm überlappend, an Wänden hochgezogen.",
              en: "PE sheet 0.2 mm, joints overlapping 20 cm, turned up at walls.",
            },
            qty: 1120.5,
            unit: m2,
            kind: "normal",
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Estriche", en: "Screeds" },
        positions: [
          {
            rno: "0010",
            short: { de: "Zementestrich CT-C25-F4, d = 50 mm, schwimmend", en: "Cement screed CT-C25-F4, d = 50 mm, floating" },
            long: {
              de: "Schwimmender Zementestrich auf Dämmschicht, Nenndicke 50 mm, Oberfläche abgerieben, belegreif für Linoleum.",
              en: "Floating cement screed on insulation, nominal thickness 50 mm, surface floated, ready for linoleum.",
            },
            qty: 1084.25,
            unit: m2,
            kind: "base",
            marker: { de: "Grundposition, Alternative siehe 03.02.0020", en: "Base item, see alternative 03.02.0020" },
          },
          {
            rno: "0020",
            short: { de: "Calciumsulfat-Fließestrich CA-C25-F5, d = 45 mm", en: "Calcium sulphate flowing screed CA-C25-F5, d = 45 mm" },
            long: {
              de: "Schwimmender Calciumsulfat-Fließestrich, Nenndicke 45 mm, Oberfläche geschliffen.",
              en: "Floating calcium sulphate flowing screed, nominal thickness 45 mm, surface sanded.",
            },
            qty: 1084.25,
            unit: m2,
            kind: "alternative",
            marker: { de: "Alternativposition zu 03.02.0010", en: "Alternative item to 03.02.0010" },
            alternativeTo: "03.02.0010",
          },
          {
            rno: "0030",
            short: { de: "Zulage zu 03.02.0010 für Gefälleestrich bis 2 %", en: "Extra over 03.02.0010 for sloped screed up to 2 %" },
            long: {
              de: "Mehrpreis für Estrich im Gefälle zu Bodenabläufen.",
              en: "Additional price for screed laid to falls towards floor drains.",
            },
            qty: 36.3,
            unit: m2,
            kind: "surcharge",
          },
          {
            rno: "0040",
            short: { de: "Bewegungsfuge im Estrich mit Profil", en: "Movement joint in screed with profile" },
            long: {
              de: "Bewegungsfuge mit Fugenprofil in Türdurchgängen und nach Fugenplan herstellen.",
              en: "Form movement joints with joint profile at door openings and as per joint plan.",
            },
            qty: 118,
            unit: m,
            kind: "normal",
            ocr: "merged",
          },
          {
            rno: "0050",
            short: { de: "Estrich schleifen und absaugen", en: "Sand and vacuum screed" },
            long: {
              de: "Estrichoberfläche maschinell schleifen und absaugen, falls der Bodenleger dies fordert.",
              en: "Machine-sand and vacuum the screed surface if the floor layer requires it.",
            },
            qty: 1084.25,
            unit: m2,
            kind: "optional_without_total",
            marker: { de: "Bedarfsposition ohne GB", en: "Provisional item without total" },
          },
          {
            rno: "0060",
            short: { de: "Belegreifheitsprüfung mit CM-Messung", en: "Readiness test by CM measurement" },
            long: {
              de: "Feuchtemessung nach dem CM-Verfahren mit Protokoll, je Messstelle.",
              en: "Moisture measurement by the CM method with report, per measuring point.",
            },
            qty: 24,
            unit: pcs,
            kind: "normal",
          },
        ],
      },
    ],
  },
  {
    rno: "04",
    label: { de: "Allgemeine Leistungen", en: "General works" },
    subtitles: [
      {
        rno: "01",
        label: { de: "Baustelle und Stundenlohnarbeiten", en: "Site and daywork" },
        positions: [
          {
            rno: "0010",
            short: { de: "Baustelleneinrichtung", en: "Site setup" },
            long: {
              de: "Einrichten, Vorhalten und Räumen der Baustelle für alle Leistungen dieses LV.",
              en: "Setting up, maintaining and clearing the site for all works of this BoQ.",
            },
            qty: 1,
            unit: ls,
            kind: "lump_sum",
          },
          {
            rno: "0020",
            short: { de: "Schutzabdeckung fertiger Estrichflächen", en: "Protective covering of finished screed" },
            long: {
              de: "Fertige Estrichflächen mit Hartfaserplatten abdecken, vorhalten und wieder entfernen.",
              en: "Cover finished screed areas with hardboard, maintain and remove the covering.",
            },
            qty: 450,
            unit: m2,
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: "Stundenlohnarbeiten Facharbeiter", en: "Daywork skilled worker" },
            long: {
              de: "Stundenlohnarbeiten nur auf schriftliche Anordnung, Abrechnung nach Nachweis.",
              en: "Daywork only on written instruction, paid against timesheets.",
            },
            qty: 40,
            unit: h,
            kind: "optional_without_total",
            marker: { de: "Bedarfsposition ohne GB", en: "Provisional item without total" },
          },
          {
            rno: "0040",
            short: { de: "Stundenlohnarbeiten Helfer", en: "Daywork labourer" },
            long: {
              de: "Wie vor, jedoch Helfer.",
              en: "As before, but labourer.",
            },
            qty: 24,
            unit: h,
            kind: "optional_without_total",
            marker: { de: "Bedarfsposition ohne GB", en: "Provisional item without total" },
          },
          {
            rno: "0050",
            short: { de: "Bestandsdokumentation und Prüfzeugnisse", en: "As-built documentation and test certificates" },
            long: {
              de: "Revisionsunterlagen, Prüfzeugnisse und Übereinstimmungserklärungen zusammenstellen und übergeben.",
              en: "Compile and hand over as-built documents, test certificates and declarations of conformity.",
            },
            qty: 1,
            unit: ls,
            kind: "lump_sum",
          },
        ],
      },
    ],
  },
];

export const TITLES: Title[] = [...HAND_TITLES, ...generateTitles(420, 5)];

const positions = TITLES.flatMap((title) =>
  title.subtitles.flatMap((subtitle) => subtitle.positions.map((position) => ({ oz: `${title.rno}.${subtitle.rno}.${position.rno}`, position }))),
);

export const GOLD_POSITIONS: GoldPosition[] = positions.map(({ oz, position }) => ({
  oz,
  shortText: position.short,
  quantity: position.qty,
  unit: position.unit,
  kind: position.kind,
  ...(position.alternativeTo ? { alternativeTo: position.alternativeTo } : {}),
}));

export const GOLD_TITLES: GoldTitle[] = TITLES.flatMap((title) => [
  { oz: title.rno, label: title.label },
  ...title.subtitles.map((subtitle) => ({ oz: `${title.rno}.${subtitle.rno}`, label: subtitle.label })),
]);

const COPY = {
  de: {
    header: (page: number, pages: number) => [`${PROJECT.de.name} · ${PROJECT.de.boq}                         Seite ${page} von ${pages}`, "OZ           Leistungsbeschreibung                                    Menge    ME        EP          GP"],
    footer: "Stadt Lindenau · Hochbauamt · LV-Datum 03.11.2026 · Druck 05.11.2026 14:32",
    carry: "Übertrag",
    title: "Titel",
    sum: "Summe",
  },
  en: {
    header: (page: number, pages: number) => [`${PROJECT.en.name} · ${PROJECT.en.boq}                         Page ${page} of ${pages}`, "OZ           Description                                              Qty      Unit      UP          Total"],
    footer: "City of Lindenau · Building Department · BoQ date 03/11/2026 · Printed 05/11/2026 14:32",
    carry: "Carried forward",
    title: "Title",
    sum: "Total",
  },
};

const LINES_PER_PAGE = 34;
const INDENT = " ".repeat(13);
const wrap = (text: string, width = 64) =>
  text.split(" ").reduce<string[]>((lines, word) => {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
    return lines;
  }, []);

/** The BoQ's pages as OCR delivers them. */
export const lvPages = (lang: Lang): string[] => {
  const copy = COPY[lang];
  const blank = "..........";
  const quantityLine = (position: Position) => {
    let quantity = formatNumber(lang, position.qty, 3);
    if (position.ocr === "letter-o") quantity = quantity.replace(/0(?=[^0]*$)/u, "O");
    const figures = position.ocr === "merged" ? `${quantity}${position.unit[lang]}`.padEnd(19) : `${quantity.padStart(10)} ${position.unit[lang].padEnd(8)}`;
    return `${" ".repeat(56)}${figures} ${blank}  ${blank}`;
  };
  const body: string[] = [];
  for (const title of TITLES) {
    body.push("", `${copy.title} ${title.rno}  ${title.label[lang].toUpperCase()}`);
    for (const subtitle of title.subtitles) {
      body.push("", `${title.rno}.${subtitle.rno}        ${subtitle.label[lang]}`, "");
      for (const position of subtitle.positions) {
        body.push(
          `${title.rno}.${subtitle.rno}.${position.rno}   ${position.short[lang]}`,
          ...wrap(position.long[lang]).map((line) => `${INDENT}${line}`),
          ...(position.marker ? [`${INDENT}${position.marker[lang]}`] : []),
          quantityLine(position),
          "",
        );
      }
      body.push(`${" ".repeat(13)}${copy.sum} ${title.rno}.${subtitle.rno} ${subtitle.label[lang]} ${".".repeat(20)} ${blank}`);
    }
    body.push(`${" ".repeat(13)}${copy.sum} ${copy.title} ${title.rno} ${title.label[lang]} ${".".repeat(20)} ${blank}`);
  }
  const chunks: string[][] = [];
  for (let start = 0; start < body.length; start += LINES_PER_PAGE) chunks.push(body.slice(start, start + LINES_PER_PAGE));
  return chunks.map((chunk, index) =>
    [
      ...copy.header(index + 1, chunks.length),
      "-".repeat(104),
      ...(index > 0 ? [`${" ".repeat(13)}${copy.carry} ${".".repeat(48)} ${blank}`] : []),
      ...chunk,
      ...(index < chunks.length - 1 ? [`${" ".repeat(13)}${copy.carry} ${".".repeat(48)} ${blank}`] : []),
      "-".repeat(104),
      copy.footer,
    ].join("\n"),
  );
};
