/**
 * Seeded bilingual text families for the finishing trades (doors, plaster, paint, floor coverings,
 * tiles) that make a bill of quantities as large as a real one, with near-duplicate positions,
 * alternative pairs, provisional items, extra-over items, and OCR damage. The BoQ fixtures use it.
 */
import type { Kind } from "../boq-positions";
import type { Text } from "../shared";

export type Position = {
  rno: string;
  short: Text;
  long: Text;
  qty: number;
  unit: Text;
  kind: Kind;
  /** The line that states the kind, as an LV prints it. */
  marker?: Text;
  alternativeTo?: string;
  /** OCR damage in the quantity line: a letter O for a zero, or quantity and unit run together. */
  ocr?: "letter-o" | "merged";
};
export type Subtitle = { rno: string; label: Text; positions: Position[] };
export type Title = { rno: string; label: Text; subtitles: Subtitle[] };

export const UNITS = {
  m2: { de: "m2", en: "m2" },
  m: { de: "m", en: "m" },
  pcs: { de: "St", en: "pcs" },
  h: { de: "h", en: "h" },
  ls: { de: "psch", en: "LS" },
};
const { m2, m, pcs } = UNITS;

/** mulberry32: a small seeded generator, so the generated titles never change. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

type Variant = Pick<Position, "short" | "long" | "unit"> & { range: [number, number]; decimals: number };
type Family = { label: Text; variants: Variant[] };

const combine = <A, B, C>(as: A[], bs: B[], cs: C[]) => as.flatMap((a) => bs.flatMap((b) => cs.map((c) => [a, b, c] as const)));
const fixed = (unit: Text, range: [number, number], decimals: number, items: Array<[string, string, string, string]>): Variant[] =>
  items.map(([shortDe, shortEn, longDe, longEn]) => ({ short: { de: shortDe, en: shortEn }, long: { de: longDe, en: longEn }, unit, range, decimals }));

const FAMILIES: Array<{ label: Text; surcharge: Text; families: Family[] }> = [
  {
    label: { de: "Innentüren", en: "Internal doors" },
    surcharge: { de: "für Ausführung mit Oberlicht", en: "for version with fanlight" },
    families: [
      {
        label: { de: "Türelemente", en: "Door sets" },
        variants: combine(
          [760, 885, 1010, 1135],
          [
            { de: "Röhrenspan", en: "tubular chipboard core" },
            { de: "Vollspan", en: "solid chipboard core" },
          ],
          [
            { de: "Stahlzarge", en: "steel frame" },
            { de: "Holzzarge", en: "timber frame" },
          ],
        ).map(([width, leaf, frame], index) => ({
          short: { de: `Innentür ${width} x 2130 mm, ${leaf.de}, ${frame.de}`, en: `Internal door ${width} x 2130 mm, ${leaf.en}, ${frame.en}` },
          long: {
            de: `Einflügelige Innentür, Türblatt mit ${leaf.de}-Einlage, Oberfläche CPL weiß, ${frame.de} für Wanddicke ${100 + (index % 3) * 25} mm, einschließlich Bänder und Schloss.`,
            en: `Single-leaf internal door, leaf with ${leaf.en}, white CPL surface, ${frame.en} for wall thickness ${100 + (index % 3) * 25} mm, including hinges and lock.`,
          },
          unit: pcs,
          range: [2, 26],
          decimals: 0,
        })),
      },
      {
        label: { de: "Türzubehör", en: "Door accessories" },
        variants: fixed(pcs, [4, 60], 0, [
          ["Drückergarnitur Edelstahl, Rosette", "Stainless steel lever set, rose", "Drückergarnitur aus Edelstahl mit Rundrosetten, für Buntbart- oder Profilzylinderschloss.", "Stainless steel lever set with round roses, for warded or profile cylinder locks."],
          ["Bodentürstopper Edelstahl", "Stainless steel floor door stop", "Türstopper zum Verschrauben im Estrich, mit schwarzem Gummipuffer.", "Door stop screwed into the screed, with black rubber buffer."],
          ["Obentürschließer mit Gleitschiene", "Overhead door closer with slide rail", "Obentürschließer Größe EN 2–4 mit Gleitschiene, Schließgeschwindigkeit einstellbar.", "Overhead door closer size EN 2–4 with slide rail, adjustable closing speed."],
          ["Absenkbare Bodendichtung", "Automatic drop-down seal", "Absenkbare Bodendichtung in das Türblatt einfräsen und einstellen.", "Mill an automatic drop-down seal into the door leaf and adjust it."],
          ["Lüftungsgitter im Türblatt, 450 x 90 mm", "Ventilation grille in door leaf, 450 x 90 mm", "Ausschnitt im Türblatt und beidseitiges Lüftungsgitter aus Aluminium.", "Cut-out in the door leaf and aluminium ventilation grille on both sides."],
          ["Profilzylinder für Schließanlage", "Profile cylinder for master key system", "Profilzylinder nach Schließplan des Auftraggebers liefern und einbauen.", "Supply and fit profile cylinders according to the client's key plan."],
          ["Türschild mit Raumnummer", "Door sign with room number", "Türschild aus Aluminium mit Raumnummer und Raumbezeichnung, geklebt.", "Aluminium door sign with room number and name, bonded."],
        ]),
      },
    ],
  },
  {
    label: { de: "Putzarbeiten", en: "Plastering" },
    surcharge: { de: "für Arbeiten über 3,50 m Höhe", en: "for work above 3.50 m height" },
    families: [
      {
        label: { de: "Wandputz", en: "Wall plaster" },
        variants: combine(
          [
            { de: "Kalkzementputz", en: "Lime-cement plaster" },
            { de: "Gipsputz", en: "Gypsum plaster" },
            { de: "Kalkputz", en: "Lime plaster" },
          ],
          [10, 15],
          ["Q2", "Q3"],
        )
          .slice(0, 9)
          .map(([material, thickness, quality]) => ({
            short: { de: `${material.de}, d = ${thickness} mm, Oberfläche ${quality}`, en: `${material.en}, d = ${thickness} mm, finish ${quality}` },
            long: {
              de: `${material.de} als Innenwandputz einlagig auftragen, mittlere Dicke ${thickness} mm, Oberfläche geglättet in Qualitätsstufe ${quality}.`,
              en: `Apply ${material.en.toLowerCase()} as single-coat internal wall plaster, average thickness ${thickness} mm, surface smoothed to quality level ${quality}.`,
            },
            unit: m2,
            range: [40, 900],
            decimals: 2,
          })),
      },
      {
        label: { de: "Putzprofile und Putzträger", en: "Plaster beads and lath" },
        variants: [
          ...fixed(m, [20, 400], 1, [
            ["Eckschutzprofil verzinkt, Putzdicke 10 mm", "Galvanised corner bead, plaster thickness 10 mm", "Eckschutzprofil an Außenecken in Putzmörtel ansetzen.", "Set corner beads at external corners in plaster mortar."],
            ["Putzabschlussprofil an Fenstern und Türen", "Plaster stop bead at windows and doors", "Abschlussprofil an Laibungen und Anschlüssen setzen.", "Fix stop beads at reveals and junctions."],
            ["Sockelprofil Aluminium", "Aluminium base bead", "Sockelabschlussprofil an der Wandunterkante setzen.", "Fix a base bead at the bottom edge of the wall."],
            ["Fugen zwischen Bauteilen mit Gewebe überbrücken", "Bridge joints between components with mesh", "Übergänge zwischen unterschiedlichen Baustoffen mit Armierungsgewebe überspannen.", "Span transitions between different materials with reinforcing mesh."],
          ]),
          ...fixed(m2, [10, 300], 2, [
            ["Putzträger aus Streckmetall", "Expanded metal lath", "Putzträger aus Streckmetall über Installationsschlitzen befestigen.", "Fix expanded metal lath over service chases."],
            ["Haftbrücke auf Betonflächen", "Bonding agent on concrete surfaces", "Haftbrücke auf glatten Betonflächen vor dem Verputzen auftragen.", "Apply a bonding agent on smooth concrete surfaces before plastering."],
          ]),
        ],
      },
    ],
  },
  {
    label: { de: "Malerarbeiten", en: "Painting" },
    surcharge: { de: "für Anstrich auf Sichtbeton", en: "for coating on fair-faced concrete" },
    families: [
      {
        label: { de: "Wand- und Deckenanstriche", en: "Wall and ceiling coatings" },
        variants: combine(
          [
            { de: "Wände", en: "walls" },
            { de: "Decken", en: "ceilings" },
          ],
          [
            { de: "Dispersionsfarbe", en: "emulsion paint" },
            { de: "Silikatfarbe", en: "silicate paint" },
          ],
          [
            { de: "weiß", en: "white" },
            { de: "getönt", en: "tinted" },
          ],
        ).map(([surface, paint, colour]) => ({
          short: { de: `Anstrich ${surface.de} mit ${paint.de}, ${colour.de}`, en: `Coating of ${surface.en} with ${paint.en}, ${colour.en}` },
          long: {
            de: `Grundierung und zweimaliger Anstrich der ${surface.de} mit ${paint.de}, Nassabriebklasse 2, Farbton ${colour.de}.`,
            en: `Primer and two coats on ${surface.en} with ${paint.en}, wet abrasion class 2, colour ${colour.en}.`,
          },
          unit: m2,
          range: [60, 1200],
          decimals: 2,
        })),
      },
      {
        label: { de: "Lackierungen", en: "Lacquering" },
        variants: [
          ...fixed(pcs, [4, 40], 0, [
            ["Stahlzarge lackieren", "Lacquer steel door frame", "Stahlzarge anschleifen, grundieren und zweimal lackieren.", "Sand, prime and lacquer the steel frame twice."],
            ["Heizkörper lackieren, bis 1,0 m²", "Lacquer radiator, up to 1.0 m²", "Heizkörper reinigen und mit Heizkörperlack zweimal streichen.", "Clean the radiator and apply two coats of radiator enamel."],
            ["Holzfenster innen lasieren", "Stain timber windows inside", "Holzfenster innenseitig anschleifen und zweimal lasieren.", "Sand the inside of timber windows and apply two coats of stain."],
          ]),
          ...fixed(m, [10, 160], 1, [
            ["Geländer aus Stahl lackieren", "Lacquer steel railing", "Stahlgeländer entfetten, grundieren und zweimal lackieren.", "Degrease, prime and lacquer the steel railing twice."],
            ["Rohrleitungen lackieren bis DN 50", "Lacquer pipes up to DN 50", "Sichtbare Rohrleitungen reinigen und zweimal lackieren.", "Clean exposed pipes and lacquer them twice."],
            ["Kantenschutz an Stützen lackieren", "Lacquer corner guards on columns", "Kantenschutzwinkel an Stützen grundieren und gelb-schwarz lackieren.", "Prime the corner guards on columns and lacquer them yellow and black."],
          ]),
        ],
      },
    ],
  },
  {
    label: { de: "Bodenbelagsarbeiten", en: "Floor coverings" },
    surcharge: { de: "für Verlegung im Fischgrätmuster", en: "for herringbone laying" },
    families: [
      {
        label: { de: "Elastische Bodenbeläge", en: "Resilient floor coverings" },
        variants: combine(
          [
            { de: "Linoleum 2,5 mm", en: "Linoleum 2.5 mm" },
            { de: "Kautschukbelag 3,0 mm", en: "Rubber flooring 3.0 mm" },
            { de: "PVC-Designbelag 2,5 mm", en: "PVC design flooring 2.5 mm" },
          ],
          [
            { de: "Gruppenräume", en: "group rooms" },
            { de: "Flure", en: "corridors" },
          ],
          [
            { de: "uni", en: "plain" },
            { de: "marmoriert", en: "marbled" },
          ],
        ).map(([material, room, pattern]) => ({
          short: { de: `${material.de}, ${pattern.de}, ${room.de}`, en: `${material.en}, ${pattern.en}, ${room.en}` },
          long: {
            de: `${material.de} in Bahnen, Dessin ${pattern.de}, vollflächig verklebt, Nähte verschweißt, für ${room.de}; Untergrund spachteln und grundieren.`,
            en: `${material.en} in sheets, ${pattern.en} design, fully bonded, seams welded, for ${room.en}; level and prime the substrate.`,
          },
          unit: m2,
          range: [30, 700],
          decimals: 2,
        })),
      },
      {
        label: { de: "Sockelleisten und Profile", en: "Skirtings and profiles" },
        variants: fixed(m, [15, 380], 1, [
          ["Sockelleiste Holz, 60 mm, weiß", "Timber skirting, 60 mm, white", "Sockelleiste aus Holz, weiß lackiert, geschraubt.", "Timber skirting, white lacquered, screwed."],
          ["Hohlkehlsockel aus Belag, 100 mm", "Coved skirting from flooring, 100 mm", "Belag an der Wand als Hohlkehlsockel hochziehen, mit Stützprofil.", "Turn the flooring up the wall as coved skirting, with support profile."],
          ["Übergangsprofil Edelstahl", "Stainless steel transition profile", "Übergangsprofil zwischen unterschiedlichen Belägen, geschraubt.", "Transition profile between different floor finishes, screwed."],
          ["Treppenkantenprofil mit Kontraststreifen", "Stair nosing with contrast strip", "Treppenkantenprofil mit kontrastierendem Einleger nach DIN 18040.", "Stair nosing with contrasting insert to DIN 18040."],
          ["Abschlussprofil an Fliesenbelag", "Edge profile at tiled floor", "Abschlussprofil am Übergang zu Fliesenflächen setzen.", "Fix an edge profile at the transition to tiled areas."],
        ]),
      },
    ],
  },
  {
    label: { de: "Fliesenarbeiten", en: "Tiling" },
    surcharge: { de: "für Verlegung im Diagonalverband", en: "for diagonal laying" },
    families: [
      {
        label: { de: "Wand- und Bodenfliesen", en: "Wall and floor tiles" },
        variants: combine(
          ["30 x 60", "60 x 60", "20 x 20"],
          [
            { de: "Wandfliesen", en: "Wall tiles", fix: { de: "im Dünnbett an Wänden", en: "in thin bed on walls" } },
            { de: "Bodenfliesen", en: "Floor tiles", fix: { de: "im Dünnbett auf Estrich", en: "in thin bed on screed" } },
          ],
          [
            { de: "matt", en: "matt" },
            { de: "R10", en: "R10" },
          ],
        ).map(([format, location, finish]) => ({
          short: { de: `${location.de} ${format} cm, ${finish.de}`, en: `${location.en} ${format} cm, ${finish.en}` },
          long: {
            de: `Feinsteinzeugfliesen ${format} cm, Oberfläche ${finish.de}, ${location.fix.de} verlegen, Fugenbreite 3 mm, Fugen zementär verfugt.`,
            en: `Lay porcelain tiles ${format} cm, ${finish.en} surface, ${location.fix.en}, joint width 3 mm, cementitious grout.`,
          },
          unit: m2,
          range: [8, 260],
          decimals: 2,
        })),
      },
      {
        label: { de: "Abdichtung und Fugen", en: "Waterproofing and joints" },
        variants: [
          ...fixed(m2, [6, 120], 2, [
            ["Verbundabdichtung an Wänden, 2-lagig", "Bonded waterproofing on walls, two coats", "Flüssig zu verarbeitende Verbundabdichtung in zwei Lagen unter Fliesen.", "Liquid-applied bonded waterproofing in two coats under tiles."],
            ["Verbundabdichtung auf Böden, 2-lagig", "Bonded waterproofing on floors, two coats", "Verbundabdichtung auf Estrich in zwei Lagen, Dichtband in Ecken.", "Bonded waterproofing on screed in two coats, sealing tape in corners."],
          ]),
          ...fixed(m, [10, 240], 1, [
            ["Silikonfuge sanitär", "Sanitary silicone joint", "Elastische Anschlussfuge mit Sanitärsilikon, Farbe nach Wahl.", "Elastic junction joint with sanitary silicone, colour as selected."],
            ["Dichtband in Wand-Boden-Anschlüssen", "Sealing tape at wall-floor junctions", "Dichtband in die Abdichtung einbetten.", "Embed sealing tape in the waterproofing."],
            ["Edelstahl-Abschlussschiene für Wandfliesen", "Stainless steel edge trim for wall tiles", "Abschlussschiene an freien Fliesenkanten einbauen.", "Fit an edge trim at free tile edges."],
          ]),
        ],
      },
    ],
  },
];

const PROVISIONAL: Array<{ kind: Kind; marker: Text }> = [
  { kind: "optional_without_total", marker: { de: "Bedarfsposition ohne GB", en: "Provisional item without total" } },
  { kind: "optional_without_total", marker: { de: "Bedarfsposition, nur Einheitspreis", en: "Provisional item, unit price only" } },
  { kind: "optional_without_total", marker: { de: "Eventualposition (nur EP)", en: "Contingency item (unit price only)" } },
  { kind: "optional_with_total", marker: { de: "Bedarfsposition mit GB", en: "Provisional item with total" } },
];

/**
 * Finishing-trade titles numbered from `first`: every subtitle takes a seeded share of its family
 * with provisional items and OCR damage; the first subtitle of each title also gets an alternative
 * pair of similar variants and an extra-over item.
 */
export const generateTitles = (seed: number, first: number): Title[] => {
  const random = seeded(seed);
  const rno = (index: number) => String((index + 1) * 10).padStart(4, "0");
  return FAMILIES.map((family, titleIndex) => ({ ...family, rno: String(first + titleIndex).padStart(2, "0") })).map((title) => ({
    rno: title.rno,
    label: title.label,
    subtitles: title.families.map((family, familyIndex) => {
      const sub = String(familyIndex + 1).padStart(2, "0");
      const variants = family.variants.filter((_, index) => index < 4 || random() < 0.85);
      const positions: Position[] = variants.map((variant, index) => {
        const [min, max] = variant.range;
        const qty = Math.round((min + random() * (max - min)) * 10 ** variant.decimals) / 10 ** variant.decimals;
        const draw = random();
        const ocr = draw < 0.07 ? "letter-o" : draw < 0.14 ? "merged" : undefined;
        const provisional = index > 2 && random() < 0.25 ? PROVISIONAL[Math.floor(random() * PROVISIONAL.length)]! : undefined;
        return { rno: rno(index), short: variant.short, long: variant.long, unit: variant.unit, qty, kind: provisional?.kind ?? "normal", ...(provisional ? { marker: provisional.marker } : {}), ...(ocr ? { ocr } : {}) };
      });
      if (familyIndex === 0) {
        const base = positions[1]!;
        const alternative = positions[2]!;
        const baseOz = `${title.rno}.${sub}.${base.rno}`;
        Object.assign(base, { kind: "base", marker: { de: `Grundposition, Alternative siehe ${title.rno}.${sub}.${alternative.rno}`, en: `Base item, see alternative ${title.rno}.${sub}.${alternative.rno}` } });
        Object.assign(alternative, { kind: "alternative", qty: base.qty, alternativeTo: baseOz, marker: { de: `Alternativposition zu ${baseOz}`, en: `Alternative item to ${baseOz}` } });
        const first = positions[0]!;
        const firstOz = `${title.rno}.${sub}.${first.rno}`;
        positions.push({
          rno: rno(positions.length),
          short: { de: `Zulage zu ${firstOz} ${title.surcharge.de}`, en: `Extra over ${firstOz} ${title.surcharge.en}` },
          long: { de: `Mehrpreis zu Position ${firstOz} ${title.surcharge.de}.`, en: `Additional price over item ${firstOz} ${title.surcharge.en}.` },
          qty: variants[0]!.decimals === 0 ? Math.max(1, Math.round(first.qty / 3)) : Math.round((first.qty / 3) * 100) / 100,
          unit: first.unit,
          kind: "surcharge",
        });
      }
      return { rno: sub, label: family.label, positions };
    }),
  }));
};

