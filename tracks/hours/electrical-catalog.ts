/** The time catalog of Elektro Albers GmbH, shared by its electrical tasks. */
import { num, type Entry, type L } from "./kit";

const l = (de: string, en: string): L => ({ de, en });

const entry = (code: string, unit: Entry["unit"], minutes: number, de: string, en: string, per?: number): Entry => ({
  code,
  unit,
  minutes,
  text: { de, en },
  ...(per ? { per } : {}),
});

export const CATALOG: Entry[] = [
  entry("E-110", "m", 300, "NYM-J 3x1,5 mm² unter Putz in Schlitz oder Leerrohr verlegen", "NYM-J 3x1.5 mm² cable, laid under plaster in a chase or conduit", 100),
  entry("E-111", "m", 160, "NYM-J 3x1,5 mm² auf Kabelrinne oder Trasse verlegen", "NYM-J 3x1.5 mm² cable, laid on a cable tray or rack", 100),
  entry("E-112", "m", 220, "NYM-J 5x2,5 mm² auf Kabelrinne oder Trasse verlegen", "NYM-J 5x2.5 mm² cable, laid on a cable tray or rack", 100),
  entry("E-113", "m", 360, "NYM-J 5x2,5 mm² unter Putz in Schlitz oder Leerrohr verlegen", "NYM-J 5x2.5 mm² cable, laid under plaster in a chase or conduit", 100),
  entry("E-114", "m", 550, "NYY-J 5x16 mm² auf Kabelrinne oder Trasse verlegen", "NYY-J 5x16 mm² cable, laid on a cable tray or rack", 100),
  entry("E-115", "m", 720, "NYY-J 5x16 mm² auf der Wand mit Schellen befestigen", "NYY-J 5x16 mm² cable, clipped to a wall", 100),
  entry("E-120", "m", 18, "Kabelrinne 200x60 mm montieren, einschließlich Abhängung", "Cable tray 200x60 mm, installed including suspension"),
  entry("E-121", "m", 15, "Kabelrinne 100x60 mm montieren, einschließlich Abhängung", "Cable tray 100x60 mm, installed including suspension"),
  entry("E-122", "m", 21, "Kabelrinne 300x60 mm montieren, einschließlich Abhängung", "Cable tray 300x60 mm, installed including suspension"),
  entry("E-130", "m", 6, "Schlitz 30x30 mm in Mauerwerk fräsen und schließen", "Chase 30x30 mm, milled in masonry and closed"),
  entry("E-131", "m", 14, "Schlitz 30x30 mm in Beton stemmen und schließen", "Chase 30x30 mm, cut in concrete and closed"),
  entry("E-140", "pc", 9, "Gerätedose unter Putz in Mauerwerk setzen", "Flush device box, set in masonry"),
  entry("E-141", "pc", 22, "Gerätedose unter Putz in Beton setzen, einschließlich Kernbohrung", "Flush device box, set in concrete, including core drilling"),
  entry("E-142", "pc", 6, "Hohlwanddose in Trockenbauwand setzen", "Cavity wall box, set in a drywall partition"),
  entry("E-150", "pc", 8, "Schalter oder Taster unter Putz einsetzen und anschließen", "Flush switch or push-button, fitted and connected"),
  entry("E-151", "pc", 7, "Schutzkontaktsteckdose unter Putz einsetzen und anschließen", "Flush Schuko socket, fitted and connected"),
  entry("E-152", "pc", 12, "Schutzkontaktsteckdose Aufputz, Feuchtraum, montieren und anschließen", "Surface-mounted Schuko socket, damp-proof, mounted and connected"),
  entry("E-160", "pc", 20, "LED-Panel 625x625 mm in Rasterdecke einlegen und anschließen", "LED panel 625x625 mm, laid into a grid ceiling and connected"),
  entry("E-161", "pc", 35, "LED-Hallenstrahler abhängen und anschließen", "LED high-bay luminaire, suspended and connected"),
  entry("E-162", "pc", 16, "LED-Downlight in Decke einbauen und anschließen", "LED downlight, built into a ceiling and connected"),
  entry("E-163", "pc", 25, "Sicherheits- oder Rettungszeichenleuchte mit Einzelbatterie montieren und anschließen", "Emergency or exit-sign luminaire with single battery, mounted and connected"),
  entry("E-164", "pc", 22, "LED-Anbauleuchte an der Decke montieren und anschließen", "LED surface-mounted luminaire, mounted on a ceiling and connected"),
  entry("E-170", "pc", 480, "Unterverteilung bis 72 TE setzen und verdrahten", "Sub-distribution board up to 72 modules, set and wired"),
  entry("E-171", "pc", 6, "Leitungsschutzschalter einbauen und anschließen", "Miniature circuit breaker, fitted and connected"),
  entry("E-172", "pc", 12, "Fehlerstromschutzschalter 4-polig einbauen und anschließen", "Residual current device, 4-pole, fitted and connected"),
  entry("E-180", "pc", 10, "Leuchte demontieren und entsorgen", "Luminaire removed and disposed of"),
  entry("E-181", "pc", 4, "Schalter, Steckdose oder Gerätedose demontieren und entsorgen", "Switch, socket or device box removed and disposed of"),
  entry("E-182", "m", 150, "Alte Leitung auf Putz oder auf Rinne demontieren und entsorgen", "Old cable on the wall surface or on a tray, removed and disposed of", 100),
  entry("E-183", "pc", 120, "Alte Unterverteilung demontieren und entsorgen", "Old sub-distribution board removed and disposed of"),
  entry("E-190", "pc", 10, "Prüfen und Messen je Stromkreis (Erstprüfung)", "Testing and measuring per circuit (initial verification)"),
];

/** The catalog's mounting-height factor (general condition 3). */
export const heightFactor = (height = 0) => (height > 5 ? 1.4 : height > 3.5 ? 1.2 : 1);

/** A historic row's note on its mounting height. */
export const mountedAt = (height: number): L => ({ de: `Montagehöhe ${num(height).de} m`, en: `mounting height ${num(height).en} m` });

export const RULES: L = l(
  `Zeitwertkatalog Elektro Albers GmbH, Ausgabe 2026 – Vorbemerkungen

1. Die Zeitwerte sind Minuten je Katalogeinheit für eine Elektrofachkraft. Sie gelten für Neubau, freien Zugang, Material an der Einbaustelle und eine Montagehöhe bis 3,50 m.
2. Leitungen und Kabel sind je 100 m angegeben, alle anderen Einträge je Einheit.
3. Montagehöhe ist die Höhe des Montageorts über dem Fußboden (Leitung, Rinne, Leuchte, Gerät). Über 3,50 m bis 5,00 m (Leiter, Rollgerüst): Zeitwert × 1,20. Über 5,00 m (Hubarbeitsbühne): Zeitwert × 1,40.
4. Unterputzdosen und Schlitze nach dem Wandbaustoff wählen: Mauerwerk, Beton oder Trockenbau.
5. Die Zeitwerte enthalten das Anschließen, aber nicht das Prüfen und Messen (eigener Eintrag).`,
  `Time catalog Elektro Albers GmbH, 2026 edition – general conditions

1. Standard times are minutes per catalog unit for one electrician. They apply to new builds, free access, material at the point of installation, and a mounting height up to 3.50 m.
2. Cables are given per 100 m, all other entries per unit.
3. The mounting height is the height of the installation point above the floor (cable, tray, luminaire, device). Above 3.50 m up to 5.00 m (ladder, mobile scaffold): standard time × 1.20. Above 5.00 m (aerial work platform): standard time × 1.40.
4. Choose flush boxes and chases by wall material: masonry, concrete, or drywall.
5. Standard times include connecting, but not testing and measuring (separate entry).`,
);
