/**
 * Our article catalog (purchase prices and labour times) and our estimating rules
 * (Kalkulationsgrundlagen), shared by every dialog task. Makes are fictional; prices are synthetic.
 */
import type { Article, Doc } from "../dialog";

const piece = (no: string, de: string, en: string, price: number, minutes: number): Article => ({ no, text: { de, en }, price, per: 1, unit: "pc", minutes });
const cable = (no: string, de: string, en: string, price: number, minutes: number): Article => ({ no, text: { de, en }, price, per: 100, unit: "m", minutes });

export const ARTICLES: Article[] = [
  piece("A-4101", "Wallbox Voltaro WB-11, 11 kW, Typ-2-Ladedose, DC-Fehlerstromerkennung", "Wallbox Voltaro WB-11, 11 kW, type 2 socket, DC residual current detection", 689, 90),
  piece("A-4102", "Wallbox Ladewerk Compact 11, 11 kW, Typ-2-Ladedose, DC-Fehlerstromerkennung", "Wallbox Ladewerk Compact 11, 11 kW, type 2 socket, DC residual current detection", 845, 90),
  piece("A-4103", "Wallbox Hagenau eCharge 11, 11 kW, Typ-2-Ladedose, DC-Fehlerstromerkennung", "Wallbox Hagenau eCharge 11, 11 kW, type 2 socket, DC residual current detection", 742, 90),
  piece("A-4104", "Wallbox Ladewerk Compact 22, 22 kW, Typ-2-Ladedose, DC-Fehlerstromerkennung", "Wallbox Ladewerk Compact 22, 22 kW, type 2 socket, DC residual current detection", 915, 90),
  piece("A-4105", "Standsäule für Wallbox, verzinkt, mit Fundamentanker", "Pedestal for wallbox, galvanised, with foundation anchor", 310, 45),
  cable("K-1015", "Leitung NYM-J 3x1,5 mm²", "Cable NYM-J 3x1.5 mm²", 58, 4),
  cable("K-1025", "Leitung NYM-J 3x2,5 mm²", "Cable NYM-J 3x2.5 mm²", 89, 4),
  cable("K-5025", "Leitung NYM-J 5x2,5 mm²", "Cable NYM-J 5x2.5 mm²", 142, 5),
  cable("K-5060", "Leitung NYM-J 5x6 mm²", "Cable NYM-J 5x6 mm²", 395, 6),
  cable("K-5100", "Leitung NYM-J 5x10 mm²", "Cable NYM-J 5x10 mm²", 640, 7),
  cable("K-H015", "Leitung NHXMH-J 3x1,5 mm², halogenfrei", "Cable NHXMH-J 3x1.5 mm², halogen-free", 112, 4),
  cable("K-H025", "Leitung NHXMH-J 3x2,5 mm², halogenfrei", "Cable NHXMH-J 3x2.5 mm², halogen-free", 165, 4),
  cable("K-Y525", "Erdkabel NYY-J 5x2,5 mm²", "Underground cable NYY-J 5x2.5 mm²", 168, 5),
  cable("K-Y510", "Erdkabel NYY-J 5x10 mm²", "Underground cable NYY-J 5x10 mm²", 980, 7),
  cable("K-Y516", "Erdkabel NYY-J 5x16 mm²", "Underground cable NYY-J 5x16 mm²", 1480, 8),
  { no: "K-R200", text: { de: "Kabelrinne 200 x 60 mm, verzinkt, einschließlich Abhängung", en: "Cable tray 200 x 60 mm, galvanised, including suspension" }, price: 14.2, per: 1, unit: "m", minutes: 18 },
  piece("L-2150", "LED-Downlight Lumena DL-150/840, Ø 150 mm, 1200 lm, 4000 K", "LED downlight Lumena DL-150/840, Ø 150 mm, 1200 lm, 4000 K", 86, 30),
  piece("L-2200", "LED-Downlight Lumena DL-200/840, Ø 200 mm, 2000 lm, 4000 K", "LED downlight Lumena DL-200/840, Ø 200 mm, 2000 lm, 4000 K", 118, 35),
  piece("L-2201", "LED-Downlight Lumena DL-200/830, Ø 200 mm, 2000 lm, 3000 K", "LED downlight Lumena DL-200/830, Ø 200 mm, 2000 lm, 3000 K", 112, 35),
  piece("L-6262", "LED-Rasterleuchte Lumena RL-625/840, 625 x 625 mm, 3600 lm, 4000 K", "LED panel luminaire Lumena RL-625/840, 625 x 625 mm, 3600 lm, 4000 K", 96, 40),
  piece("L-6263", "LED-Rasterleuchte Lumena RL-625/840-UGR, 625 x 625 mm, 3600 lm, 4000 K, UGR < 19", "LED panel luminaire Lumena RL-625/840-UGR, 625 x 625 mm, 3600 lm, 4000 K, UGR < 19", 124, 40),
  piece("L-9001", "Rettungszeichenleuchte LED, Wandmontage, Einzelbatterie 3 h", "Exit sign luminaire LED, wall-mounted, single battery 3 h", 164, 50),
  piece("L-9003", "Rettungszeichenleuchte LED, Wandmontage, Einzelbatterie 1 h", "Exit sign luminaire LED, wall-mounted, single battery 1 h", 141, 50),
  piece("L-9002", "Sicherheitsleuchte LED, Deckeneinbau, Einzelbatterie 1 h", "Emergency luminaire LED, ceiling-recessed, single battery 1 h", 139, 45),
  piece("L-1565", "Feuchtraum-Wannenleuchte LED, 1500 mm, IP65", "Damp-proof batten luminaire LED, 1500 mm, IP65", 54, 25),
  piece("S-3001", "Ausschalter UP, Serie Linea, reinweiß", "On/off switch, flush-mounted, Linea series, pure white", 5.9, 10),
  piece("S-3101", "Steckdose 1-fach UP, Serie Linea, reinweiß", "Socket outlet, single, flush-mounted, Linea series, pure white", 6.8, 15),
  piece("S-3102", "Steckdose 2-fach UP, Serie Linea, reinweiß", "Socket outlet, double, flush-mounted, Linea series, pure white", 12.4, 20),
  piece("S-3011", "Ausschalter AP, Feuchtraum IP44, Serie Aqua, lichtgrau", "On/off switch, surface-mounted, damp-proof IP44, Aqua series, light grey", 8.7, 15),
  piece("S-3201", "Steckdose 1-fach AP, Feuchtraum IP44, Serie Aqua, lichtgrau", "Socket outlet, single, surface-mounted, damp-proof IP44, Aqua series, light grey", 9.9, 18),
  piece("S-3202", "Steckdose 2-fach AP, Feuchtraum IP44, Serie Aqua, lichtgrau", "Socket outlet, double, surface-mounted, damp-proof IP44, Aqua series, light grey", 17.6, 22),
  piece("S-3204", "Steckdose 2-fach AP, Feuchtraum IP44, Serie Aqua, reinweiß", "Socket outlet, double, surface-mounted, damp-proof IP44, Aqua series, pure white", 18.9, 22),
  piece("S-3203", "Steckdose 2-fach AP, IP55, Serie Aqua, lichtgrau", "Socket outlet, double, surface-mounted, IP55, Aqua series, light grey", 21.3, 22),
  piece("D-1002", "Abzweigdose AP, IP54", "Junction box, surface-mounted, IP54", 3.1, 8),
  piece("O-7060", "Pollerleuchte LED PL-60, Höhe 600 mm, anthrazit", "Bollard luminaire LED PL-60, height 600 mm, anthracite", 249, 75),
  piece("O-7080", "Pollerleuchte LED PL-80, Höhe 800 mm, anthrazit", "Bollard luminaire LED PL-80, height 800 mm, anthracite", 289, 75),
  piece("O-7081", "Pollerleuchte LED PL-80, Höhe 800 mm, Edelstahl", "Bollard luminaire LED PL-80, height 800 mm, stainless steel", 334, 75),
  piece("O-7090", "Betonfertigfundament für Pollerleuchte", "Precast concrete foundation for bollard luminaire", 24.5, 20),
  piece("O-7500", "Steckdosensäule IP44, 2 Schutzkontakt-Steckdosen und 1 CEE-Steckdose 16 A", "Socket column IP44, 2 Schuko sockets and 1 CEE socket 16 A", 412, 120),
  piece("O-7501", "Steckdosensäule IP44, 2 Schutzkontakt-Steckdosen", "Socket column IP44, 2 Schuko sockets", 268, 90),
  piece("V-8030", "Kleinverteiler AP, 3-reihig, bestückt", "Small distribution board, surface-mounted, 3 rows, equipped", 410, 360),
  piece("V-8040", "Kleinverteiler AP, 4-reihig, bestückt", "Small distribution board, surface-mounted, 4 rows, equipped", 540, 480),
];

export const KALKULATION: Doc = {
  id: "kalkulationsgrundlagen",
  title: { de: "Kalkulationsgrundlagen 2027 (Brandt Elektrotechnik)", en: "Estimating rules 2027 (Kalkulationsgrundlagen, Brandt Elektrotechnik)" },
  pages: [
    [
      ["Brandt Elektrotechnik GmbH – Kalkulationsgrundlagen 2027", "Brandt Elektrotechnik GmbH – estimating rules (Kalkulationsgrundlagen) 2027"],
      ["1. Verrechnungslohn: 68,00 € je Stunde (enthält alle Lohnzuschläge).", "1. Labour rate: EUR 68.00 per hour (all wage surcharges included)."],
      ["2. Material: Einkaufspreis laut Artikelstamm (search_articles) zuzüglich 20 % Materialzuschlag.", "2. Material: purchase price from the article catalog (search_articles) plus a 20 % material surcharge."],
      ["3. Einheitspreis (EP) einer Position = Material-Einkaufspreis × 1,20 + Montagezeit in Minuten ÷ 60 × 68,00 €. Die Montagezeiten im Artikelstamm enthalten Montage, Anschluss und Inbetriebnahme.", "3. Unit price (EP) of an item = material purchase price × 1.20 + installation time in minutes ÷ 60 × EUR 68.00. The installation times in the catalog include mounting, connection, and commissioning."],
      ["4. Leitungen: Preise im Artikelstamm teils je 100 m, Verlegezeit je m. Ist eine Zuleitung im EP enthalten, gehen ihre Länge × Preis je m in das Material und ihre Länge × Verlegezeit in die Montagezeit ein. Befestigungsmaterial und Installationsrohr sind in Leitungspreis und Verlegezeit enthalten.", "4. Cables: catalog prices are partly per 100 m, laying time is per m. If an item's unit price includes a supply cable, its length × price per m goes into the material and its length × laying time into the installation time. Fixings and conduit are included in the cable price and laying time."],
      ["5. Montagehöhe über 3,00 m (Deckenhöhe bzw. Montageort): Montagezeit von Geräten und Leuchten + 25 % (Hubarbeitsbühne). Gilt nicht für die Leitungsverlegung.", "5. Mounting height above 3.00 m (ceiling height or mounting point): installation time of devices and luminaires + 25 % (aerial work platform). Does not apply to cable laying."],
      ["6. Rundung: nur den EP auf 2 Nachkommastellen runden (kaufmännisch). Gesamtpreis = Menge × gerundeter EP; Titelsumme = Summe der Gesamtpreise. Eventualpositionen erhalten nur einen EP und gehen nicht in die Titelsumme ein. Alle Preise netto.", "6. Rounding: round only the unit price, to 2 decimals (half up). Total price = quantity × rounded unit price; section total = sum of the item totals. Contingency items (Eventualpositionen) get a unit price only and are not part of the section total. All prices net."],
      ["7. Terminplanung: Montagestunden = Summe über alle Positionen von Menge × Montagezeit (einschließlich Zuschlag nach 5.) ÷ 60. Ein Monteur arbeitet 8 Stunden je Arbeitstag, Montag bis Freitag; gesetzliche Feiertage am Baustellenort sind arbeitsfrei. Benötigte Arbeitstage = Montagestunden ÷ (Anzahl Monteure × 8), aufgerundet auf ganze Tage.", "7. Scheduling: installation hours = sum over all items of quantity × installation time (including the surcharge under 5.) ÷ 60. A fitter works 8 hours per working day, Monday to Friday; public holidays at the site are days off. Working days needed = installation hours ÷ (number of fitters × 8), rounded up to whole days."],
    ],
  ],
};
