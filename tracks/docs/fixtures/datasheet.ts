/**
 * A six-page data sheet of a fictional LED high-bay luminaire series, in German and in English,
 * and the technical fields of two order codes derived from it by hand.
 */
import type { Lang } from "../../../src/types";

export type Variant = {
  orderCode: string;
  systemPowerW: number;
  luminousFluxLm: number;
  efficacyLmPerW: number;
  colorTemperatureK: number;
  criMin: number;
  beamAngleDeg: number;
  dimming: "none" | "dali2" | "1-10v";
  diameterMm: number;
  heightMm: number;
  weightKg: number;
  ipRating: string;
  ikRating: string;
  protectionClass: string;
  ambientMinC: number;
  ambientMaxC: number;
  lifetimeL80H: number;
  certifications: string[];
};

export const CERTIFICATIONS = ["CE", "UKCA", "ENEC", "DALI-2", "GS", "VDE"];

/**
 * HBP-150-840-90-D-S: 22,400 lm × 1.00 × 1.00 × 0.96 = 21,504 → 21,500 lm; 21,500 / 147 W = 146 lm/W;
 * height 150 + 12 mm; weight 5.9 kg (Rev. C) + 0.2 (DALI) + 0.6 (glass); glass makes it IP66/IK10.
 * HBP-200-940-60-V: 29,300 × 0.86 × 0.97 = 24,442.6 → 24,400 lm; 24,400 / 199 W = 123 lm/W;
 * weight 7.1 + 0.2 (1–10 V); 200 W: +45 °C and 80,000 h; 1–10 V has no ENEC and no DALI-2.
 * HBP-100-857-120-N-S: 15,200 × 1.03 × 0.98 × 0.96 = 14,729.2 → 14,700 lm; 14,700 / 98 W = 150 lm/W;
 * height 145 + 12 mm; weight 4.2 + 0.6; glass with 120° optics limits the ambient to +40 °C.
 */
export const VARIANTS: Variant[] = [
  {
    orderCode: "HBP-150-840-90-D-S",
    systemPowerW: 147,
    luminousFluxLm: 21500,
    efficacyLmPerW: 146,
    colorTemperatureK: 4000,
    criMin: 80,
    beamAngleDeg: 90,
    dimming: "dali2",
    diameterMm: 380,
    heightMm: 162,
    weightKg: 6.7,
    ipRating: "IP66",
    ikRating: "IK10",
    protectionClass: "I",
    ambientMinC: -30,
    ambientMaxC: 50,
    lifetimeL80H: 100000,
    certifications: ["CE", "UKCA", "ENEC", "DALI-2"],
  },
  {
    orderCode: "HBP-200-940-60-V",
    systemPowerW: 199,
    luminousFluxLm: 24400,
    efficacyLmPerW: 123,
    colorTemperatureK: 4000,
    criMin: 90,
    beamAngleDeg: 60,
    dimming: "1-10v",
    diameterMm: 430,
    heightMm: 160,
    weightKg: 7.3,
    ipRating: "IP65",
    ikRating: "IK08",
    protectionClass: "I",
    ambientMinC: -30,
    ambientMaxC: 45,
    lifetimeL80H: 80000,
    certifications: ["CE", "UKCA"],
  },
  {
    orderCode: "HBP-100-857-120-N-S",
    systemPowerW: 98,
    luminousFluxLm: 14700,
    efficacyLmPerW: 150,
    colorTemperatureK: 5700,
    criMin: 80,
    beamAngleDeg: 120,
    dimming: "none",
    diameterMm: 330,
    heightMm: 157,
    weightKg: 4.8,
    ipRating: "IP66",
    ikRating: "IK10",
    protectionClass: "I",
    ambientMinC: -30,
    ambientMaxC: 40,
    lifetimeL80H: 100000,
    certifications: ["CE", "UKCA", "ENEC"],
  },
];

export const PAGES: Record<Lang, Array<{ title: string; text: string }>> = {
  de: [
    {
      title: "Übersicht",
      text: `NORDLICHT HBP PRO – LED-Hallenleuchte
Datenblatt Rev. C · Stand 09/2026 · Nordlicht Leuchten GmbH, Gera

Robuste LED-Hallenleuchte für Lager-, Produktions- und Sporthallen. Aluminium-Druckgussgehäuse mit passiver Kühlung, Linsenoptik aus PMMA, Aufhängung an Ringöse oder Montagebügel.

Merkmale
- Nennleistung 100 W, 150 W oder 200 W
- Lichtfarben 4000 K und 5700 K, Farbwiedergabe Ra ≥ 80 oder Ra ≥ 90
- Abstrahlwinkel 60°, 90° oder 120°
- Treiber nicht dimmbar, DALI-2 oder 1–10 V
- Schutzart IP65, Stoßfestigkeit IK08 (Ausführungen mit Schutzglas siehe Seite 4)
- Schutzklasse I
- Umgebungstemperatur −30 °C bis +50 °C (Einschränkungen siehe Seite 3)
- 5 Jahre Garantie

Inhalt: 1 Übersicht · 2 Bestellschlüssel · 3 Technische Daten · 4 Abmessungen und Zubehör · 5 Normen und Zertifikate · 6 Änderungshistorie

Seite 1 von 6`,
    },
    {
      title: "Bestellschlüssel",
      text: `Bestellschlüssel   HBP-[Leistung]-[Lichtfarbe]-[Optik]-[Treiber][-Option]

Leistung     100 | 150 | 200     Nennleistung in W (Systemleistung siehe Seite 3)
Lichtfarbe   840 = Ra ≥ 80, 4000 K
             857 = Ra ≥ 80, 5700 K
             940 = Ra ≥ 90, 4000 K
Optik        60 | 90 | 120       Abstrahlwinkel in Grad
Treiber      N = nicht dimmbar (EIN/AUS)
             D = DALI-2 (DT6)
             V = 1–10 V
Option       S = Schutzglas aus Polycarbonat; ohne Angabe: keine Option

Beispiel: HBP-100-857-120-N = 100 W, Ra ≥ 80, 5700 K, 120°, nicht dimmbar, ohne Schutzglas.

Seite 2 von 6`,
    },
    {
      title: "Technische Daten",
      text: `Technische Daten (Ta = 25 °C)

                               HBP-100        HBP-150        HBP-200
Systemleistung                 98 W           147 W          199 W
Lichtstrom¹ (840, 90°)         15.200 lm      22.400 lm      29.300 lm
Leistungsfaktor                ≥ 0,95         ≥ 0,95         ≥ 0,95
Gewicht²                       4,2 kg         5,6 kg         7,1 kg
Lebensdauer L80B10             100.000 h      100.000 h      siehe Seite 6
Umgebungstemperatur Ta         −30 … +50 °C   −30 … +50 °C   −30 … +45 °C
Schutzart / Stoßfestigkeit     IP65 / IK08    IP65 / IK08    IP65 / IK08

¹ Lichtstrom anderer Ausführungen: Tabellenwert × Faktor Lichtfarbe × Faktor Optik, mit Schutzglas (Option S) zusätzlich × 0,96; das Ergebnis auf volle 100 lm gerundet.
  Faktor Lichtfarbe: 840 = 1,00 · 857 = 1,03 · 940 = 0,86
  Faktor Optik: 60° = 0,97 · 90° = 1,00 · 120° = 0,98
² Gewicht der Ausführung mit Treiber N ohne Option. Dimmbare Treiber (D, V): +0,2 kg. Schutzglas (Option S): +0,6 kg.
Lichtausbeute = Lichtstrom / Systemleistung, auf ganze lm/W gerundet.

Seite 3 von 6`,
    },
    {
      title: "Abmessungen und Zubehör",
      text: `Abmessungen (alle Maße in cm)

              Ø Gehäuse    Höhe ohne Bügel    Höhe mit Montagebügel
HBP-100       33,0         14,5               21,0
HBP-150       38,0         15,0               21,5
HBP-200       43,0         16,0               22,5

Option S – Schutzglas aus Polycarbonat: Höhe + 1,2 cm. Mit Schutzglas erreicht die Leuchte Schutzart IP66 und Stoßfestigkeit IK10. Schutzglas in Verbindung mit Optik 120°: zulässige Umgebungstemperatur höchstens +40 °C.

Zubehör
- Montagebügel MB-1, verzinkt (im Lieferumfang)
- Ringöse RA-8 für Seilabhängung
- Reflektoraufsatz 60°, nicht mit Option S kombinierbar
- Ballwurfschutzkorb BK-40 für Sporthallen (DIN 18032-3)

Seite 4 von 6`,
    },
    {
      title: "Normen und Zertifikate",
      text: `Konformität und Zertifikate
- CE: alle Ausführungen (EN 60598-1, EN 60598-2-1, EN 55015, EN 61547, EN 61000-3-2)
- UKCA: alle Ausführungen
- ENEC: Ausführungen mit Treiber N und D. Ausführungen mit Treiber V (1–10 V): Zertifizierung in Vorbereitung.
- DALI-2: Ausführungen mit Treiber D, DiiA-zertifiziert
- Photobiologische Sicherheit: Risikogruppe RG1 nach EN 62471 (Prüfbericht, kein Zertifikat)

Schutzklasse I – Schutzleiteranschluss erforderlich.
Einbau nur durch eine Elektrofachkraft.

Seite 5 von 6`,
    },
    {
      title: "Änderungshistorie",
      text: `Änderungshistorie

Rev. A   03/2025   Erstausgabe
Rev. B   11/2025   Lichtfarbe 940 ergänzt. Faktor Optik 60° von 0,96 auf 0,97 korrigiert.
Rev. C   09/2026   Gewicht HBP-150 korrigiert: 5,9 kg statt 5,6 kg (die Tabelle auf Seite 3 wird mit Rev. D angepasst).
                   Lebensdauer L80B10 HBP-200 ergänzt: 80.000 h.

Seite 6 von 6`,
    },
  ],
  en: [
    {
      title: "Overview",
      text: `NORDLICHT HBP PRO – LED high-bay luminaire
Data sheet Rev. C · Issue 09/2026 · Nordlicht Leuchten GmbH, Gera

Rugged LED high-bay luminaire for warehouses, production halls, and sports halls. Die-cast aluminium housing with passive cooling, PMMA lens optics, suspended from an eyebolt or mounting bracket.

Features
- Rated power 100 W, 150 W, or 200 W
- Colour temperatures 4000 K and 5700 K, colour rendering CRI ≥ 80 or CRI ≥ 90
- Beam angle 60°, 90°, or 120°
- Driver non-dimmable, DALI-2, or 1–10 V
- Ingress protection IP65, impact resistance IK08 (versions with protective glass see page 4)
- Protection class I
- Ambient temperature −30 °C to +50 °C (restrictions see page 3)
- 5-year warranty

Contents: 1 Overview · 2 Order code · 3 Technical data · 4 Dimensions and accessories · 5 Standards and certificates · 6 Revision history

Page 1 of 6`,
    },
    {
      title: "Order code",
      text: `Order code   HBP-[Power]-[Light colour]-[Optics]-[Driver][-Option]

Power          100 | 150 | 200     rated power in W (system power see page 3)
Light colour   840 = CRI ≥ 80, 4000 K
               857 = CRI ≥ 80, 5700 K
               940 = CRI ≥ 90, 4000 K
Optics         60 | 90 | 120       beam angle in degrees
Driver         N = non-dimmable (ON/OFF)
               D = DALI-2 (DT6)
               V = 1–10 V
Option         S = polycarbonate protective glass; none given: no option

Example: HBP-100-857-120-N = 100 W, CRI ≥ 80, 5700 K, 120°, non-dimmable, without protective glass.

Page 2 of 6`,
    },
    {
      title: "Technical data",
      text: `Technical data (Ta = 25 °C)

                               HBP-100        HBP-150        HBP-200
System power                   98 W           147 W          199 W
Luminous flux¹ (840, 90°)      15,200 lm      22,400 lm      29,300 lm
Power factor                   ≥ 0.95         ≥ 0.95         ≥ 0.95
Weight²                        4.2 kg         5.6 kg         7.1 kg
Lifetime L80B10                100,000 h      100,000 h      see page 6
Ambient temperature Ta         −30 … +50 °C   −30 … +50 °C   −30 … +45 °C
Ingress / impact protection    IP65 / IK08    IP65 / IK08    IP65 / IK08

¹ Luminous flux of other versions: table value × light colour factor × optics factor, with protective glass (option S) additionally × 0.96; the result rounded to whole 100 lm.
  Light colour factor: 840 = 1.00 · 857 = 1.03 · 940 = 0.86
  Optics factor: 60° = 0.97 · 90° = 1.00 · 120° = 0.98
² Weight of the version with driver N and no option. Dimmable drivers (D, V): +0.2 kg. Protective glass (option S): +0.6 kg.
Luminous efficacy = luminous flux / system power, rounded to whole lm/W.

Page 3 of 6`,
    },
    {
      title: "Dimensions and accessories",
      text: `Dimensions (all dimensions in cm)

              Housing Ø    Height without bracket    Height with mounting bracket
HBP-100       33.0         14.5                      21.0
HBP-150       38.0         15.0                      21.5
HBP-200       43.0         16.0                      22.5

Option S – polycarbonate protective glass: height + 1.2 cm. With protective glass the luminaire achieves ingress protection IP66 and impact resistance IK10. Protective glass combined with 120° optics: permitted ambient temperature at most +40 °C.

Accessories
- Mounting bracket MB-1, galvanised (included)
- Eyebolt RA-8 for cable suspension
- Reflector attachment 60°, cannot be combined with option S
- Ball guard BK-40 for sports halls (DIN 18032-3)

Page 4 of 6`,
    },
    {
      title: "Standards and certificates",
      text: `Conformity and certificates
- CE: all versions (EN 60598-1, EN 60598-2-1, EN 55015, EN 61547, EN 61000-3-2)
- UKCA: all versions
- ENEC: versions with driver N and D. Versions with driver V (1–10 V): certification in preparation.
- DALI-2: versions with driver D, DiiA certified
- Photobiological safety: risk group RG1 to EN 62471 (test report, no certificate)

Protection class I – protective earth connection required.
To be installed by a qualified electrician only.

Page 5 of 6`,
    },
    {
      title: "Revision history",
      text: `Revision history

Rev. A   03/2025   First issue
Rev. B   11/2025   Light colour 940 added. Optics factor 60° corrected from 0.96 to 0.97.
Rev. C   09/2026   Weight HBP-150 corrected: 5.9 kg instead of 5.6 kg (the table on page 3 will be updated with Rev. D).
                   Lifetime L80B10 HBP-200 added: 80,000 h.

Page 6 of 6`,
    },
  ],
};
