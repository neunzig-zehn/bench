/** Documents of the outdoor-works task: an LV item measured on site, a route nobody has fixed yet, and a fixed-price request. */
import type { Doc } from "../dialog";
import { KALKULATION } from "./catalog";

export const FEEDER_DOCS: Doc[] = [
  {
    id: "lv",
    title: { de: "LV Hofgut Weiden, Umbau Scheune zum Hofladen – Titel 04 Außenanlagen (Stand 28.09.2026)", en: "LV Hofgut Weiden, barn conversion into a farm shop – section 04 outdoor works (as of 28 Sep 2026)" },
    pages: [
      [
        ["Pos. 04.01 Erdkabel NYY-J 5x16 mm² vom Hauptverteiler (Wohnhaus) zur Unterverteilung Scheune, in bauseits hergestellten Kabelgraben einlegen, Kabelenden anschließen. Menge: nach Aufmaß (Trassenführung noch nicht festgelegt)", "Item 04.01 Underground cable NYY-J 5x16 mm² from the main distribution board (farmhouse) to the barn sub-distribution board, laid in a cable trench dug by the client, cable ends connected. Quantity: as measured on site (cable route not yet fixed)"],
        ["Pos. 04.02 Pollerleuchte LED, Höhe 800 mm, Typ PL-80, Farbe nach Bemusterung durch den AG, einschließlich Betonfertigfundament, liefern, setzen und anschließen. Menge: 6 Stk", "Item 04.02 Bollard luminaire LED, height 800 mm, type PL-80, colour as selected by the client at the sampling, including precast concrete foundation; supply, set, and connect. Quantity: 6 pcs"],
        ["Pos. 04.03 Steckdosensäule IP44 mit 2 Schutzkontakt-Steckdosen und 1 CEE-Steckdose 16 A, liefern, setzen und anschließen. Menge: 2 Stk", "Item 04.03 Socket column IP44 with 2 Schuko sockets and 1 CEE socket 16 A; supply, set, and connect. Quantity: 2 pcs"],
        ["Pos. 04.04 Erdkabel NYY-J 5x2,5 mm² zu den Pollerleuchten und Steckdosensäulen (von Gerät zu Gerät durchgeschleift), in bauseits hergestellten Kabelgraben einlegen. Menge: 85 m", "Item 04.04 Underground cable NYY-J 5x2.5 mm² to the bollard luminaires and socket columns (looped from unit to unit), laid in a cable trench dug by the client. Quantity: 85 m"],
        ["Pos. 04.05 Kabelgraben herstellen und verfüllen: entfällt, wird bauseits erbracht.", "Item 04.05 Dig and backfill the cable trench: not applicable, provided by the client."],
      ],
    ],
  },
  {
    id: "baubeschreibung",
    title: { de: "Baubeschreibung – Hofgut Weiden, Umbau Scheune zum Hofladen (Auszug)", en: "Baubeschreibung (construction specification) – Hofgut Weiden, barn conversion (extract)" },
    pages: [
      [
        ["1. Denkmalschutz: Die Hofanlage steht unter Denkmalschutz. Leitungstrassen im Hof bedürfen der Zustimmung der Unteren Denkmalschutzbehörde; der Antrag ist gestellt, die Entscheidung steht aus.", "1. Heritage protection: The farmstead is a listed monument. Cable routes in the yard need the approval of the local heritage authority; the application has been filed, the decision is pending."],
        ["2. Erdarbeiten: Kabelgräben stellt der Bauherr in Eigenleistung her und verfüllt sie.", "2. Earthworks: The client digs and backfills the cable trenches themselves."],
        ["3. Außenbeleuchtung: Pollerleuchten Typ PL-80 entlang der Zufahrt; die Farbe legt der Bauherr bei der Bemusterung fest.", "3. Outdoor lighting: bollard luminaires type PL-80 along the driveway; the client chooses the colour at the sampling."],
        ["4. Vergabe: Der Bauherr wünscht für Titel 04 einen Festpreis.", "4. Award: The client wants a fixed price for section 04."],
      ],
    ],
  },
  {
    id: "lageplan",
    title: { de: "Lageplan Außenanlagen A-01 (unmaßstäblich)", en: "Site plan, outdoor works A-01 (not to scale)" },
    pages: [
      [
        ["Lageplan Außenanlagen A-01, unmaßstäblich (Stand 15.09.2026)", "Site plan, outdoor works A-01, not to scale (as of 15 Sep 2026)"],
        ["Abstand Wohnhaus (Hauptverteiler) – Scheune: ca. 40 m Luftlinie.", "Distance farmhouse (main distribution board) – barn: approx. 40 m in a straight line."],
        ["Trasse Erdkabel HV – Scheune: offen. Zwei Varianten in Prüfung: Nord entlang der Hofmauer, Süd über den Wirtschaftsweg.", "Route of the underground cable HV – barn: open. Two variants under review: north along the yard wall, south via the farm track."],
        ["Pollerleuchten P1–P6 entlang der Zufahrt; Steckdosensäulen S1 und S2 am Hofladen.", "Bollard luminaires P1–P6 along the driveway; socket columns S1 and S2 at the farm shop."],
      ],
    ],
  },
  {
    id: "email-bauherr",
    title: { de: "E-Mail Familie Weiden vom 03.11.2026: Festpreis Außenanlagen", en: "Email from the Weiden family, 3 Nov 2026: fixed price for outdoor works" },
    pages: [
      [
        ["Von: Anna Weiden – An: Brandt Elektrotechnik – 03.11.2026", "From: Anna Weiden – To: Brandt Elektrotechnik – 3 Nov 2026"],
        ["Betreff: Festpreis Außenanlagen", "Subject: Fixed price for outdoor works"],
        ["Hallo Herr Brandt, für die Finanzierung brauchen wir bis Ende der Woche Ihren Festpreis für die Außenanlagen. Die Bank möchte eine feste Zahl sehen.", "Hello Mr Brandt, for the financing we need your fixed price for the outdoor works by the end of the week. The bank wants to see a firm figure."],
        ["Viele Grüße, Anna Weiden", "Best regards, Anna Weiden"],
      ],
    ],
  },
  KALKULATION,
];
