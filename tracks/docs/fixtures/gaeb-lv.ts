/**
 * A GAEB DA XML 3.3 (X83) bill of quantities for the shell of a fire station, in German and in
 * English, built from one item list so the ground truth is known by construction: titles 01–05
 * by hand, the finishing trades from the shared generator. Items with a repeated description
 * reference another item by its opaque id.
 */
import type { Lang } from "../../../src/types";
import type { GoldPosition, GoldTitle, Kind } from "../boq-positions";
import type { Text } from "../shared";
import { generateTitles } from "./boq-families";

type Item = {
  rno: string;
  /** The short text, as spans: a list renders as several spans in one paragraph. */
  short: Record<Lang, string[]>;
  long: Text;
  qty: number;
  unit: Text;
  kind: Kind;
  aln?: { group: number; serial: number };
};
/** A repeated description (Wiederholungsbeschreibung): the text of the item with OZ `repeats`. */
type Repeat = { rno: string; repeats: string; qty: number; unit: Text; kind: "normal" };
type Remark = { remark: Text };
type Category = { rno: string; label: Text; entries: Array<Item | Repeat | Remark> };
type Title = { rno: string; label: Text; categories: Category[] };

const pcs = { de: "St", en: "pcs" };
const ls = { de: "psch", en: "LS" };
const same = (unit: string) => ({ de: unit, en: unit });

export const PROJECT: Record<Lang, { name: string; boq: string }> = {
  de: { name: "Neubau Feuerwehrgerätehaus Lindenau", boq: "LV 300 Rohbauarbeiten" },
  en: { name: "New fire station Lindenau", boq: "BoQ 300 Shell construction" },
};

const HAND_TITLES: Title[] = [
  {
    rno: "01",
    label: { de: "Baustelleneinrichtung", en: "Site facilities" },
    categories: [
      {
        rno: "01",
        label: { de: "Einrichten und Räumen", en: "Setting up and clearing" },
        entries: [
          {
            rno: "0010",
            short: { de: ["Baustelle einrichten"], en: ["Set up construction site"] },
            long: {
              de: "Einrichten der Baustelle mit allen für die Ausführung der Leistungen erforderlichen Geräten, Unterkünften und Lagerflächen, einschließlich An- und Abtransport.",
              en: "Setting up the site with all equipment, accommodation and storage areas required for the works, including transport to and from site.",
            },
            qty: 1,
            unit: ls,
            kind: "lump_sum",
          },
          {
            rno: "0020",
            short: { de: ["Baustelle räumen"], en: ["Clear construction site"] },
            long: {
              de: "Räumen der Baustelle nach Abschluss der Arbeiten und Wiederherstellen der beanspruchten Flächen.",
              en: "Clearing the site after completion of the works and reinstating all areas used.",
            },
            qty: 1,
            unit: ls,
            kind: "lump_sum",
          },
          {
            rno: "0030",
            short: { de: ["Bauzaun, Mobilzaun h = 2,00 m"], en: ["Site fence, mobile fence h = 2.00 m"] },
            long: {
              de: "Mobilzaun aus verzinkten Gitterelementen mit Betonfüßen liefern, aufstellen, für die Vertragsdauer vorhalten und wieder abbauen. Abgerechnet wird die Zaunlänge.",
              en: "Supply and erect a mobile fence of galvanised mesh panels on concrete feet, keep it for the contract period and remove it. Measured by fence length.",
            },
            qty: 180,
            unit: same("m"),
            kind: "normal",
          },
          {
            rno: "0040",
            short: { de: ["Bauzaun über die Vertragszeit hinaus vorhalten"], en: ["Keep site fence beyond the contract period"] },
            long: {
              de: "Vorhalten des Bauzauns nach Pos. 0030 über die vereinbarte Vertragszeit hinaus, je Woche, nur auf Anordnung des Auftraggebers.",
              en: "Keeping the site fence of item 0030 beyond the agreed contract period, per week, only on the client's instruction.",
            },
            qty: 8,
            unit: { de: "Wo", en: "wk" },
            kind: "optional_without_total",
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Baustrom und Bauwasser", en: "Temporary power and water" },
        entries: [
          {
            remark: {
              de: "Hinweis: Die Verbrauchskosten für Strom und Wasser trägt der Auftraggeber. Die Zählerstände sind bei Übergabe gemeinsam festzustellen.",
              en: "Note: The client bears the consumption costs for power and water. Meter readings are to be recorded jointly on handover.",
            },
          },
          {
            rno: "0010",
            short: { de: ["Baustromverteiler 63 A vorhalten"], en: ["Provide site distribution board 63 A"] },
            long: {
              de: "Baustromverteiler 63 A mit FI-Schutzschaltern liefern, anschließen, für die Bauzeit vorhalten und wieder abbauen.",
              en: "Supply and connect a site distribution board 63 A with residual current devices, keep it for the construction period and remove it.",
            },
            qty: 2,
            unit: pcs,
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["Bauwasseranschluss mit Zähler"], en: ["Temporary water connection with meter"] },
            long: {
              de: "Bauwasseranschluss an den Hydranten des Versorgers einschließlich Standrohr und geeichtem Wasserzähler herstellen und vorhalten.",
              en: "Connect temporary water to the utility's hydrant including standpipe and calibrated water meter, and maintain it.",
            },
            qty: 1,
            unit: pcs,
            kind: "normal",
          },
        ],
      },
    ],
  },
  {
    rno: "02",
    label: { de: "Erdarbeiten", en: "Earthworks" },
    categories: [
      {
        rno: "01",
        label: { de: "Aushub", en: "Excavation" },
        entries: [
          {
            rno: "0010",
            short: { de: ["Oberboden abtragen, d = 30 cm, seitlich lagern"], en: ["Strip topsoil, d = 30 cm, stockpile on site"] },
            long: {
              de: "Oberboden in einer Dicke von 30 cm abtragen und auf der Baustelle in Mieten lagern. Mieten profilgerecht anlegen.",
              en: "Strip topsoil to a depth of 30 cm and store it in heaps on site. Form the heaps to profile.",
            },
            qty: 1250.5,
            unit: same("m2"),
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["Baugrubenaushub, Homogenbereich B1"], en: ["Excavate building pit, homogeneous zone B1"] },
            long: {
              de: "Boden der Baugrube lösen, laden und innerhalb der Baustelle bis 200 m fördern. Abrechnung nach Aufmaß im Abtrag.",
              en: "Loosen soil of the building pit, load it and move it up to 200 m within the site. Measured in situ.",
            },
            qty: 860.25,
            unit: same("m3"),
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: ["Zulage zu 02.01.0020 für Handaushub"], en: ["Extra over 02.01.0020 for hand excavation"] },
            long: {
              de: "Mehrpreis für das Lösen des Bodens von Hand im Bereich vorhandener Leitungen.",
              en: "Additional price for loosening soil by hand near existing services.",
            },
            qty: 35,
            unit: same("m3"),
            kind: "surcharge",
          },
          {
            rno: "0040",
            short: { de: ["Aushub Fundamentgräben, Homogenbereich B1"], en: ["Excavate foundation trenches, homogeneous zone B1"] },
            long: {
              de: "Fundamentgräben profilgerecht ausheben, Sohle verdichten, Aushub seitlich lagern.",
              en: "Excavate foundation trenches to profile, compact the bottom, stockpile the spoil alongside.",
            },
            qty: 142.8,
            unit: same("m3"),
            kind: "normal",
          },
          {
            rno: "0050",
            short: { de: ["Boden laden, abfahren und entsorgen, Z 1.1"], en: ["Load, haul away and dispose of soil, class Z 1.1"] },
            long: {
              de: "Überschüssigen Boden laden, zu einer zugelassenen Annahmestelle abfahren und entsorgen. Wiegescheine sind vorzulegen.",
              en: "Load surplus soil, haul it to a licensed receiving facility and dispose of it. Weighbridge tickets are to be submitted.",
            },
            qty: 640,
            unit: same("m3"),
            kind: "base",
            aln: { group: 1, serial: 0 },
          },
          {
            rno: "0060",
            short: { de: ["Boden seitlich lagern und wieder einbauen"], en: ["Stockpile soil on site and reuse as fill"] },
            long: {
              de: "Überschüssigen Boden auf dem Grundstück zwischenlagern und nach Fertigstellung der Gründung lagenweise wieder einbauen und verdichten.",
              en: "Store surplus soil on the plot and, after the foundations are complete, place it back in layers and compact it.",
            },
            qty: 640,
            unit: same("m3"),
            kind: "alternative",
            aln: { group: 1, serial: 1 },
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Verfüllen und Gründungspolster", en: "Backfill and sub-base" },
        entries: [
          {
            rno: "0010",
            short: { de: ["Arbeitsraum verfüllen mit Aushubmaterial"], en: ["Backfill working space with excavated material"] },
            long: {
              de: "Arbeitsräume mit seitlich gelagertem Aushub lagenweise verfüllen und verdichten, Lagenstärke höchstens 30 cm.",
              en: "Backfill working spaces with stockpiled spoil in layers and compact them, layer thickness at most 30 cm.",
            },
            qty: 210.4,
            unit: same("m3"),
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["Frostschutzschicht 0/32, d = 30 cm"], en: ["Frost protection layer 0/32, d = 30 cm"] },
            long: {
              de: "Frostschutzschicht aus Mineralgemisch 0/32 liefern, einbauen und verdichten, Ev2 mindestens 100 MN/m².",
              en: "Supply, place and compact a frost protection layer of mineral aggregate 0/32, Ev2 at least 100 MN/m².",
            },
            qty: 540,
            unit: same("m2"),
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: ["Bodenaustausch bei nicht tragfähigem Baugrund"], en: ["Replace unsuitable subsoil"] },
            long: {
              de: "Nicht tragfähigen Boden ausheben, entsorgen und durch verdichtungsfähiges Material ersetzen, nur nach Freigabe durch den Bodengutachter.",
              en: "Excavate unsuitable soil, dispose of it and replace it with compactable material, only after release by the geotechnical engineer.",
            },
            qty: 50,
            unit: same("m3"),
            kind: "optional_with_total",
          },
          {
            rno: "0040",
            short: { de: ["Offene Wasserhaltung, Pumpe vorhalten und betreiben"], en: ["Open dewatering, provide and operate pump"] },
            long: {
              de: "Tauchpumpe bis 10 m³/h einschließlich Schläuchen vorhalten und betreiben, Abrechnung nach Betriebsstunden.",
              en: "Provide and operate a submersible pump up to 10 m³/h including hoses, paid by operating hours.",
            },
            qty: 120,
            unit: same("h"),
            kind: "optional_without_total",
          },
        ],
      },
    ],
  },
  {
    rno: "03",
    label: { de: "Beton- und Stahlbetonarbeiten", en: "Concrete and reinforced concrete works" },
    categories: [
      {
        rno: "01",
        label: { de: "Gründung", en: "Foundations" },
        entries: [
          {
            rno: "0010",
            short: { de: ["Sauberkeitsschicht C12/15, d = 5 cm"], en: ["Blinding layer C12/15, d = 5 cm"] },
            long: {
              de: "Unbewehrte Sauberkeitsschicht aus Beton C12/15 unter Fundamenten und Bodenplatte herstellen.",
              en: "Place an unreinforced blinding layer of concrete C12/15 below foundations and ground slab.",
            },
            qty: 540,
            unit: same("m2"),
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["Streifenfundamente C25/30"], en: ["Strip foundations C25/30"] },
            long: {
              de: "Streifenfundamente aus Beton C25/30, Expositionsklasse XC2, gegen Erdreich betoniert, Bewehrung gesondert.",
              en: "Strip foundations of concrete C25/30, exposure class XC2, cast against soil, reinforcement measured separately.",
            },
            qty: 68.75,
            unit: same("m3"),
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: ["Bodenplatte C30/37 WU, d = 25 cm"], en: ["Ground slab C30/37 watertight, d = 25 cm"] },
            long: {
              de: "Bodenplatte als wasserundurchlässige Konstruktion aus Beton C30/37, Oberfläche flügelgeglättet.",
              en: "Ground slab as watertight construction of concrete C30/37, power-floated surface.",
            },
            qty: 135,
            unit: same("m3"),
            kind: "normal",
          },
          {
            rno: "0040",
            short: { de: ["Perimeterdämmung XPS, d = 120 mm"], en: ["Perimeter insulation XPS, d = 120 mm"] },
            long: {
              de: "Perimeterdämmung aus extrudiertem Polystyrol unter der Bodenplatte, WLS 035, druckfest, einlagig verlegt.",
              en: "Perimeter insulation of extruded polystyrene below the ground slab, thermal conductivity 0.035, compression-resistant, one layer.",
            },
            qty: 540,
            unit: same("m2"),
            kind: "base",
            aln: { group: 2, serial: 0 },
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Aufgehende Bauteile", en: "Walls and columns" },
        entries: [
          {
            remark: {
              de: "Hinweis: Sichtbetonflächen nach Ansichtsplänen A-201 bis A-204. Die Zulage für Sichtbeton wird nach Fläche abgerechnet.",
              en: "Note: Fair-faced concrete areas as per elevation drawings A-201 to A-204. The extra over for fair-faced concrete is measured by area.",
            },
          },
          {
            rno: "0010",
            short: { de: ["Stahlbetonwände C30/37, ", "d = 24 cm"], en: ["Reinforced concrete walls C30/37, ", "d = 24 cm"] },
            long: {
              de: "Wände aus Stahlbeton C30/37 einschließlich Schalung, Wandhöhe bis 3,50 m, Bewehrung gesondert.",
              en: "Reinforced concrete walls C30/37 including formwork, wall height up to 3.50 m, reinforcement measured separately.",
            },
            qty: 312.6,
            unit: same("m2"),
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["Stahlbetonstützen 30 x 30 cm"], en: ["Reinforced concrete columns 30 x 30 cm"] },
            long: {
              de: "Rechteckstützen 30 x 30 cm aus Beton C30/37, Kanten gefast, Abrechnung nach Stützenlänge.",
              en: "Rectangular columns 30 x 30 cm of concrete C30/37, chamfered edges, measured by column length.",
            },
            qty: 46.2,
            unit: same("m"),
            kind: "normal",
          },
          {
            rno: "0030",
            short: { de: ["Perimeterdämmung Schaumglas, d = 120 mm"], en: ["Perimeter insulation cellular glass, d = 120 mm"] },
            long: {
              de: "Perimeterdämmung aus Schaumglasplatten unter der Bodenplatte, vollflächig in Bitumen verklebt.",
              en: "Perimeter insulation of cellular glass boards below the ground slab, fully bonded in bitumen.",
            },
            qty: 540,
            unit: same("m2"),
            kind: "alternative",
            aln: { group: 2, serial: 1 },
          },
          {
            rno: "0040",
            short: { de: ["Betonstahl B500B liefern & einbauen"], en: ["Supply & fix reinforcing steel B500B"] },
            long: {
              de: "Betonstahl B500B als Stabstahl und Matten liefern, schneiden, biegen und einbauen, alle Durchmesser.",
              en: "Supply, cut, bend and fix reinforcing steel B500B as bars and mesh, all diameters.",
            },
            qty: 18.45,
            unit: same("t"),
            kind: "normal",
          },
          {
            rno: "0050",
            short: { de: ["Zulage zu 03.02.0010 für Sichtbeton SB 3"], en: ["Extra over 03.02.0010 for fair-faced concrete SB 3"] },
            long: {
              de: "Mehrpreis für Wandflächen in Sichtbetonklasse SB 3 mit Schalhaut nach Schalungsmusterplan.",
              en: "Additional price for wall faces in fair-faced concrete class SB 3 with formwork facing to the formwork pattern drawing.",
            },
            qty: 96,
            unit: same("m2"),
            kind: "surcharge",
          },
        ],
      },
    ],
  },
  {
    rno: "04",
    label: { de: "Mauerarbeiten", en: "Masonry" },
    categories: [
      {
        rno: "01",
        label: { de: "Innenwände", en: "Internal walls" },
        entries: [
          {
            rno: "0010",
            short: { de: ["KS-Mauerwerk 17,5 cm, Steinfestigkeitsklasse 12"], en: ["Calcium silicate masonry 17.5 cm, strength class 12"] },
            long: {
              de: "Tragendes Innenmauerwerk aus Kalksandstein im Dünnbettmörtel, Wanddicke 17,5 cm.",
              en: "Load-bearing internal masonry of calcium silicate units in thin-bed mortar, wall thickness 17.5 cm.",
            },
            qty: 285.3,
            unit: same("m2"),
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["KS-Mauerwerk 11,5 cm"], en: ["Calcium silicate masonry 11.5 cm"] },
            long: {
              de: "Nichttragende Innenwände aus Kalksandstein im Dünnbettmörtel, Wanddicke 11,5 cm.",
              en: "Non-load-bearing internal walls of calcium silicate units in thin-bed mortar, wall thickness 11.5 cm.",
            },
            qty: 148.9,
            unit: same("m2"),
            kind: "base",
            aln: { group: 3, serial: 0 },
          },
          {
            rno: "0030",
            short: { de: ["Porenbeton-Mauerwerk 11,5 cm"], en: ["Aerated concrete masonry 11.5 cm"] },
            long: {
              de: "Nichttragende Innenwände aus Porenbeton-Plansteinen im Dünnbettmörtel, Wanddicke 11,5 cm.",
              en: "Non-load-bearing internal walls of aerated concrete blocks in thin-bed mortar, wall thickness 11.5 cm.",
            },
            qty: 148.9,
            unit: same("m2"),
            kind: "alternative",
            aln: { group: 3, serial: 1 },
          },
          {
            rno: "0040",
            short: { de: ["Metallständerwand, beidseitig doppelt beplankt, d = 12,5 cm"], en: ["Metal stud partition, double-boarded both sides, d = 12.5 cm"] },
            long: {
              de: "Metallständerwand CW 75 mit beidseitig zweilagiger Beplankung aus Gipsplatten, Mineralwolle 60 mm.",
              en: "Metal stud partition CW 75 with two layers of gypsum board on each side, mineral wool 60 mm.",
            },
            qty: 148.9,
            unit: same("m2"),
            kind: "alternative",
            aln: { group: 3, serial: 2 },
          },
          {
            rno: "0050",
            short: { de: ["Fertigteilstürze für Innentüren, l = 1,26 m"], en: ["Precast lintels for internal doors, l = 1.26 m"] },
            long: {
              de: "Flachstürze aus Kalksandstein-Fertigteilen liefern und versetzen, Auflagerlänge je Seite mindestens 11,5 cm.",
              en: "Supply and place precast calcium silicate flat lintels, bearing length at least 11.5 cm on each side.",
            },
            qty: 24,
            unit: pcs,
            kind: "normal",
          },
          {
            rno: "0060",
            short: { de: ["Bewegungsfuge herstellen"], en: ["Form movement joint"] },
            long: {
              de: "Bewegungsfuge im Mauerwerk mit Mineralwollestreifen und dauerelastischer Versiegelung, nur auf Anordnung.",
              en: "Movement joint in masonry with mineral wool strip and permanently elastic sealant, only when instructed.",
            },
            qty: 36,
            unit: same("m"),
            kind: "optional_without_total",
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Nebenarbeiten", en: "Ancillary works" },
        entries: [
          {
            rno: "0010",
            short: { de: ["Mauerwerksanschluss an Stahlbeton mit Ankerschienen"], en: ["Tie masonry to concrete with anchor channels"] },
            long: {
              de: "Anschluss von Mauerwerk an Stahlbetonbauteile mit einbetonierten Ankerschienen und Mauerankern.",
              en: "Connect masonry to reinforced concrete members with cast-in anchor channels and wall ties.",
            },
            qty: 48,
            unit: same("m"),
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["Aussparungen und Schlitze nach Angaben TGA"], en: ["Openings and chases as specified by building services"] },
            long: {
              de: "Herstellen aller Aussparungen, Schlitze und Durchbrüche im Mauerwerk nach den Schlitz- und Durchbruchsplänen der TGA.",
              en: "Form all openings, chases and penetrations in the masonry according to the building services' opening drawings.",
            },
            qty: 1,
            unit: ls,
            kind: "lump_sum",
          },
          {
            rno: "0030",
            short: { de: ["Kernbohrung d = 100 mm in KS-Mauerwerk"], en: ["Core drilling d = 100 mm in calcium silicate masonry"] },
            long: {
              de: "Kernbohrung mit Durchmesser 100 mm durch Kalksandstein-Mauerwerk bis 24 cm Dicke, Bohrkern entsorgen.",
              en: "Core drilling with a diameter of 100 mm through calcium silicate masonry up to 24 cm thick, dispose of the core.",
            },
            qty: 62,
            unit: pcs,
            kind: "normal",
          },
        ],
      },
    ],
  },
  {
    rno: "05",
    label: { de: "Abdichtungsarbeiten", en: "Waterproofing works" },
    categories: [
      {
        rno: "01",
        label: { de: "Bauwerksabdichtung", en: "Structural waterproofing" },
        entries: [
          {
            rno: "0010",
            short: { de: ["Bitumen-Voranstrich auf Beton"], en: ["Bitumen primer on concrete"] },
            long: {
              de: "Voranstrich auf Bitumenbasis auf erdberührte Betonflächen auftragen, Untergrund staubfrei und trocken.",
              en: "Apply a bitumen-based primer to concrete surfaces in contact with soil, substrate dust-free and dry.",
            },
            qty: 410.5,
            unit: same("m2"),
            kind: "normal",
          },
          {
            rno: "0020",
            short: { de: ["Abdichtung erdberührter Wände, PMBC 2-lagig"], en: ["Waterproofing of walls in contact with soil, PMBC two layers"] },
            long: {
              de: "Abdichtung mit polymermodifizierter Bitumendickbeschichtung in zwei Arbeitsgängen, Trockenschichtdicke mindestens 4 mm, Wassereinwirkungsklasse W1-E.",
              en: "Waterproofing with polymer-modified bituminous thick coating in two coats, dry film thickness at least 4 mm, water exposure class W1-E.",
            },
            qty: 318.75,
            unit: same("m2"),
            kind: "normal",
          },
          { rno: "0030", repeats: "05.01.0020", qty: 91.75, unit: same("m2"), kind: "normal" },
          {
            rno: "0040",
            short: { de: ["Hohlkehle aus Dichtungsmörtel"], en: ["Mortar fillet at wall base"] },
            long: {
              de: "Hohlkehle am Übergang Bodenplatte/Wand aus Dichtungsmörtel herstellen, Schenkellänge 4 cm.",
              en: "Form a fillet of sealing mortar at the junction of slab and wall, leg length 4 cm.",
            },
            qty: 96,
            unit: same("m"),
            kind: "normal",
          },
          {
            rno: "0050",
            short: { de: ["Noppenbahn als Schutzschicht"], en: ["Dimpled membrane as protection layer"] },
            long: {
              de: "Noppenbahn aus HDPE vor der Abdichtung als Schutzschicht verlegen, Stöße überlappend.",
              en: "Lay an HDPE dimpled membrane in front of the waterproofing as protection layer, joints overlapping.",
            },
            qty: 410.5,
            unit: same("m2"),
            kind: "alternative",
            aln: { group: 4, serial: 1 },
          },
        ],
      },
      {
        rno: "02",
        label: { de: "Schutz und Dränung", en: "Protection and drainage" },
        entries: [
          {
            rno: "0010",
            short: { de: ["Schutz- und Dränplatte, d = 60 mm"], en: ["Protection and drainage board, d = 60 mm"] },
            long: {
              de: "Schutz- und Dränplatten aus Polystyrol-Hartschaum mit Filtervlies vor der Abdichtung verlegen.",
              en: "Lay protection and drainage boards of rigid polystyrene foam with filter fleece in front of the waterproofing.",
            },
            qty: 410.5,
            unit: same("m2"),
            kind: "base",
            aln: { group: 4, serial: 0 },
          },
          {
            rno: "0020",
            short: { de: ["Dränleitung DN 100, PVC, gelocht"], en: ["Drain pipe DN 100, PVC, perforated"] },
            long: {
              de: "Dränleitung aus gelochtem PVC-Rohr in Kiesbettung verlegen, Gefälle mindestens 0,5 %.",
              en: "Lay a perforated PVC drain pipe in a gravel bed, fall at least 0.5 %.",
            },
            qty: 124,
            unit: same("m"),
            kind: "normal",
          },
          { rno: "0030", repeats: "05.02.0020", qty: 36.5, unit: same("m"), kind: "normal" },
          {
            rno: "0040",
            short: { de: ["Kontrollschacht DN 300"], en: ["Inspection chamber DN 300"] },
            long: {
              de: "Kontroll- und Spülschacht DN 300 aus PP mit Abdeckung, Tiefe bis 1,50 m.",
              en: "Inspection and flushing chamber DN 300 of PP with cover, depth up to 1.50 m.",
            },
            qty: 4,
            unit: pcs,
            kind: "optional_with_total",
          },
          {
            rno: "0050",
            short: { de: ["Mehrpreis zu 05.02.0020 für Ummantelung mit Filtervlies"], en: ["Additional price over 05.02.0020 for filter fleece wrapping"] },
            long: {
              de: "Mehrpreis für die Ummantelung der Dränleitung mit Filtervlies GRK 3.",
              en: "Additional price for wrapping the drain pipe in filter fleece class GRK 3.",
            },
            qty: 48,
            unit: same("m"),
            kind: "surcharge",
          },
          {
            rno: "0060",
            short: { de: ["Dichtheitsprüfung der Dränage"], en: ["Leak test of the drainage"] },
            long: {
              de: "Spülung und Kamerabefahrung der Dränleitungen mit Protokoll.",
              en: "Flushing and camera inspection of the drain pipes with report.",
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

/** The finishing trades from the shared generator, as GAEB items: alternatives get an ALN group, provisional items a Provis flag. */
const generated = (): Title[] => {
  const groups = new Map<string, number>();
  return generateTitles(300, 6).map((title) => ({
    rno: title.rno,
    label: title.label,
    categories: title.subtitles.map((subtitle) => ({
      rno: subtitle.rno,
      label: subtitle.label,
      entries: subtitle.positions.map((position): Item => {
        const oz = `${title.rno}.${subtitle.rno}.${position.rno}`;
        if (position.kind === "base") groups.set(oz, 10 + groups.size);
        const aln =
          position.kind === "base" ? { group: groups.get(oz)!, serial: 0 } : position.kind === "alternative" ? { group: groups.get(position.alternativeTo!)!, serial: 1 } : undefined;
        return {
          rno: position.rno,
          short: { de: [position.short.de], en: [position.short.en] },
          long: position.long,
          qty: position.qty,
          unit: position.unit,
          kind: position.kind,
          ...(aln ? { aln } : {}),
        };
      }),
    })),
  }));
};

export const TITLES: Title[] = [...HAND_TITLES, ...generated()];

const isPosition = (entry: Item | Repeat | Remark): entry is Item | Repeat => "rno" in entry;
const isRepeat = (entry: Item | Repeat): entry is Repeat => "repeats" in entry;

const items = TITLES.flatMap((title) =>
  title.categories.flatMap((category) =>
    category.entries.filter(isPosition).map((item) => ({ oz: `${title.rno}.${category.rno}.${item.rno}`, item })),
  ),
);
const described = (oz: string): Item => {
  const item = items.find((entry) => entry.oz === oz)!.item;
  return isRepeat(item) ? described(item.repeats) : item;
};

/** Every position with its ordinal (OZ); an alternative names the OZ of its group's base. */
export const GOLD_POSITIONS: GoldPosition[] = items.map(({ oz, item }) => ({
  oz,
  shortText: { de: described(oz).short.de.join(""), en: described(oz).short.en.join("") },
  quantity: item.qty,
  unit: item.unit,
  kind: item.kind,
  ...(!isRepeat(item) && item.kind === "alternative"
    ? { alternativeTo: items.find(({ item: other }) => !isRepeat(other) && other.aln?.group === item.aln!.group && other.aln.serial === 0)!.oz }
    : {}),
}));

/** Every title and subtitle with its ordinal. */
export const GOLD_TITLES: GoldTitle[] = TITLES.flatMap((title) => [
  { oz: title.rno, label: title.label },
  ...title.categories.map((category) => ({ oz: `${title.rno}.${category.rno}`, label: category.label })),
]);

const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** Opaque ids, as GAEB tools write them, so the OZ has to come from the nesting. */
const idOf = (index: number) => `ID${((index + 1) * 2654435761 % 4294967296).toString(16).toUpperCase().padStart(8, "0")}`;

/** The X83 file, pretty-printed, one element per line. */
export const x83 = (lang: Lang) => {
  const lines: string[] = [];
  let depth = 0;
  let ids = 0;
  const positionIds = new Map<string, string>();
  const line = (text: string) => lines.push(`${"  ".repeat(depth)}${text}`);
  const open = (tag: string, attributes = "") => {
    line(`<${tag}${attributes}>`);
    depth++;
  };
  const close = (tag: string) => {
    depth--;
    line(`</${tag}>`);
  };
  const leaf = (tag: string, value: string) => line(`<${tag}>${escape(value)}</${tag}>`);
  const paragraph = (spans: string[]) => line(`<p>${spans.map((span) => `<span>${escape(span)}</span>`).join("")}</p>`);
  const description = (long: string, short: string[]) => {
    open("Description");
    open("CompleteText");
    open("DetailTxt");
    open("Text");
    paragraph([long]);
    close("Text");
    close("DetailTxt");
    open("OutlineText");
    open("OutlTxt");
    open("TextOutlTxt");
    paragraph(short);
    close("TextOutlTxt");
    close("OutlTxt");
    close("OutlineText");
    close("CompleteText");
    close("Description");
  };

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  open("GAEB", ' xmlns="http://www.gaeb.de/GAEB_DA_XML/DA83/3.3"');
  open("GAEBInfo");
  leaf("Version", "3.3");
  leaf("VersDate", "2021-05");
  leaf("Date", "2026-10-21");
  leaf("ProgSystem", "AVA-Studio 12");
  close("GAEBInfo");
  open("PrjInfo");
  leaf("NamePrj", "FWH-LIN");
  leaf("LblPrj", PROJECT[lang].name);
  leaf("Cur", "EUR");
  close("PrjInfo");
  open("Award");
  leaf("DP", "83");
  open("BoQ", ` ID="${idOf(ids++)}"`);
  open("BoQInfo");
  leaf("Name", "300");
  leaf("LblBoQ", PROJECT[lang].boq);
  for (const [type, label, length] of [
    ["BoQLevel", lang === "de" ? "Titel" : "Title", 2],
    ["BoQLevel", lang === "de" ? "Untertitel" : "Subtitle", 2],
    ["Item", lang === "de" ? "Position" : "Item", 4],
  ] as const) {
    open("BoQBkdn");
    leaf("Type", type);
    leaf("LblBoQBkdn", label);
    leaf("Length", String(length));
    leaf("Num", "Yes");
    close("BoQBkdn");
  }
  close("BoQInfo");
  open("BoQBody");
  for (const title of TITLES) {
    open("BoQCtgy", ` ID="${idOf(ids++)}" RNoPart="${title.rno}"`);
    open("LblTx");
    paragraph([title.label[lang]]);
    close("LblTx");
    open("BoQBody");
    for (const category of title.categories) {
      open("BoQCtgy", ` ID="${idOf(ids++)}" RNoPart="${category.rno}"`);
      open("LblTx");
      paragraph([category.label[lang]]);
      close("LblTx");
      open("BoQBody");
      open("Itemlist");
      for (const entry of category.entries) {
        if (!isPosition(entry)) {
          open("Remark", ` ID="${idOf(ids++)}"`);
          open("Description");
          open("CompleteText");
          open("DetailTxt");
          open("Text");
          paragraph([entry.remark[lang]]);
          close("Text");
          close("DetailTxt");
          close("CompleteText");
          close("Description");
          close("Remark");
          continue;
        }
        const id = idOf(ids++);
        positionIds.set(`${title.rno}.${category.rno}.${entry.rno}`, id);
        open("Item", ` ID="${id}" RNoPart="${entry.rno}"`);
        if (isRepeat(entry)) {
          leaf("Qty", entry.qty.toFixed(3));
          leaf("QU", entry.unit[lang]);
          leaf("RefDescr", "Rep");
          line(`<RefRNo IDRef="${positionIds.get(entry.repeats)}"/>`);
          close("Item");
          continue;
        }
        if (entry.aln) {
          leaf("ALNGroupNo", String(entry.aln.group));
          leaf("ALNSerNo", String(entry.aln.serial));
        }
        if (entry.kind === "optional_with_total") leaf("Provis", "WithTotal");
        if (entry.kind === "optional_without_total") leaf("Provis", "WithoutTotal");
        if (entry.kind === "lump_sum") leaf("LumpSumItem", "Yes");
        leaf("Qty", entry.qty.toFixed(3));
        leaf("QU", entry.unit[lang]);
        description(entry.long[lang], entry.short[lang]);
        close("Item");
      }
      close("Itemlist");
      close("BoQBody");
      close("BoQCtgy");
    }
    close("BoQBody");
    close("BoQCtgy");
  }
  close("BoQBody");
  close("BoQ");
  close("Award");
  close("GAEB");
  return lines;
};
