/** Documents of the lighting task: an LV section, a Baubeschreibung, a lighting plan, and an email that disagree. */
import type { Doc } from "../dialog";
import { KALKULATION } from "./catalog";

export const LIGHTING_DOCS: Doc[] = [
  {
    id: "lv",
    title: { de: "LV Umbau Praxis Dr. Albers – Titel 03 Beleuchtung (Stand 15.09.2026)", en: "LV conversion of Dr Albers' practice – section 03 lighting (as of 15 Sep 2026)" },
    pages: [
      [
        ["LV Umbau Praxis Dr. Albers, Gartenstraße 3, Berlin – Titel 03 Beleuchtung", "LV conversion of Dr Albers' practice, Gartenstraße 3, Berlin – section 03 lighting"],
        ["Pos. 03.01 LED-Einbauleuchte (Downlight) Ø 200 mm, 2000 lm, 4000 K, Fabrikat Lumena DL-200/840 oder gleichwertig, Wartezimmer. Menge: 10 Stk", "Item 03.01 LED recessed luminaire (downlight) Ø 200 mm, 2000 lm, 4000 K, make Lumena DL-200/840 or equivalent, waiting room. Quantity: 10 pcs"],
        ["Pos. 03.02 LED-Rasterleuchte 625 x 625 mm, 3600 lm, 4000 K, UGR < 19, Fabrikat Lumena RL-625/840, Behandlungsräume 1–4. Menge: 8 Stk", "Item 03.02 LED panel luminaire 625 x 625 mm, 3600 lm, 4000 K, UGR < 19, make Lumena RL-625/840, treatment rooms 1–4. Quantity: 8 pcs"],
        ["Pos. 03.03 Rettungszeichenleuchte LED, Wandmontage, Einzelbatterie 3 h, Flur. Menge: 4 Stk", "Item 03.03 Exit sign luminaire LED, wall-mounted, single battery 3 h, corridor. Quantity: 4 pcs"],
        ["Pos. 03.04 Leitung NYM-J 3x1,5 mm² für die Beleuchtung im notwendigen Flur, auf Kabelrinne verlegen. Menge: 60 m", "Item 03.04 Cable NYM-J 3x1.5 mm² for the lighting in the required corridor, laid on cable tray. Quantity: 60 m"],
      ],
      [
        ["Pos. 03.05 Stundenlohnarbeiten Elektromonteur, nur auf Anordnung der Bauleitung. Eventualposition: nur Einheitspreis, ohne Gesamtbetrag. Menge: 5 h", "Item 03.05 Daywork, electrician, only on instruction of the site management. Contingency item (Eventualposition): unit price only, no total. Quantity: 5 h"],
        ["Pos. 03.06 LED-Downlight Ø 150 mm, 1200 lm, 4000 K, Fabrikat Lumena DL-150/840, Deckeneinbau im Foyer. Menge: 6 Stk", "Item 03.06 LED downlight Ø 150 mm, 1200 lm, 4000 K, make Lumena DL-150/840, recessed in the foyer ceiling. Quantity: 6 pcs"],
        ["Die Leuchten der Positionen 03.01 bis 03.03 und 03.06 sind einschließlich Montage und Anschluss anzubieten. Leitungen sind gesondert in Pos. 03.04 erfasst.", "The luminaires of items 03.01 to 03.03 and 03.06 are to be offered including installation and connection. Cables are covered separately by item 03.04."],
      ],
    ],
  },
  {
    id: "baubeschreibung",
    title: { de: "Baubeschreibung – Umbau Praxis Dr. Albers (Auszug)", en: "Baubeschreibung (construction specification) – conversion of Dr Albers' practice (extract)" },
    pages: [
      [
        ["1. Termine: Beginn der Elektroarbeiten 01.02.2027. Fertigstellung der Elektroarbeiten: 15.05.2027 (Vertragstermin).", "1. Schedule: Electrical work starts 1 Feb 2027. Completion of the electrical work: 15 May 2027 (contract date)."],
        ["2. Raumhöhen: Wartezimmer 2,75 m, Behandlungsräume 2,60 m, Flur 2,50 m (abgehängte Decken). Das Foyer ist als Luftraum über zwei Geschosse offen.", "2. Room heights: waiting room 2.75 m, treatment rooms 2.60 m, corridor 2.50 m (suspended ceilings). The foyer is an open void spanning two storeys."],
        ["3. Beleuchtung: Lichtfarbe einheitlich neutralweiß (4000 K). Behandlungsräume blendfrei mit UGR < 19.", "3. Lighting: uniform colour of light neutral white (4000 K). Treatment rooms glare-free with UGR < 19."],
      ],
      [
        ["4. Leitungsanlagen: In notwendigen Fluren (Rettungswegen) sind ausschließlich halogenfreie Leitungen (NHXMH-J) zulässig.", "4. Wiring: In required corridors (escape routes) only halogen-free cables (NHXMH-J) are permitted."],
        ["5. Sicherheitsbeleuchtung: Rettungszeichenleuchten mit Einzelbatterie, Nennbetriebsdauer 3 h.", "5. Emergency lighting: exit sign luminaires with single battery, rated duration 3 h."],
        ["6. Der Praxisbetrieb läuft während der Bauzeit im 1. OG weiter; laute Arbeiten nur nach Absprache.", "6. The practice keeps operating on the 1st floor during construction; noisy work only by arrangement."],
      ],
    ],
  },
  {
    id: "leuchtenplan",
    title: { de: "Leuchtenplan Erdgeschoss E-EG-03, Index C", en: "Lighting plan, ground floor E-EG-03, revision C" },
    pages: [
      [
        ["Leuchtenplan Erdgeschoss E-EG-03, Index C (Stand 02.11.2026)", "Lighting plan, ground floor E-EG-03, revision C (as of 2 Nov 2026)"],
        ["Wartezimmer: 12 × Typ A (Downlight Ø 200 mm, 2000 lm), in 3 Reihen zu je 4.", "Waiting room: 12 × type A (downlight Ø 200 mm, 2000 lm), in 3 rows of 4."],
        ["Behandlung 1–4: je 2 × Typ B (Rasterleuchte 625, UGR < 19).", "Treatment rooms 1–4: 2 × type B each (panel luminaire 625, UGR < 19)."],
        ["Flur: 4 × Typ N (Rettungszeichenleuchte, Wandmontage).", "Corridor: 4 × type N (exit sign luminaire, wall-mounted)."],
        ["Foyer: 6 × Typ D (Downlight Ø 150 mm) in der Decke über dem Luftraum.", "Foyer: 6 × type D (downlight Ø 150 mm) in the ceiling above the void."],
        ["Anmeldung: 2 × Typ P (Pendelleuchte), Lieferung bauseits, Anschluss in Titel 04.", "Reception: 2 × type P (pendant luminaire), supplied by the client, connection in section 04."],
        ["Lichtfarbe aller Leuchten: neutralweiß.", "Colour of light of all luminaires: neutral white."],
        ["Index C (02.11.2026): Leuchtenanordnung im Wartezimmer geändert.", "Revision C (2 Nov 2026): luminaire layout in the waiting room changed."],
      ],
    ],
  },
  {
    id: "email-planungsbuero",
    title: { de: "E-Mail Planungsbüro Roth vom 05.11.2026: Terminplan", en: "Email from Roth planning office, 5 Nov 2026: schedule" },
    pages: [
      [
        ["Von: Sabine Roth (Planungsbüro Roth) – An: Brandt Elektrotechnik – 05.11.2026", "From: Sabine Roth (Roth planning office) – To: Brandt Elektrotechnik – 5 Nov 2026"],
        ["Betreff: Terminplan Praxis Albers", "Subject: Schedule, Albers practice"],
        ["Guten Tag, die Praxis soll früher eröffnen als geplant. Die Elektroarbeiten müssen deshalb bis zum 30.04.2027 fertig sein.", "Good afternoon, the practice is to open earlier than planned. The electrical work must therefore be finished by 30 Apr 2027."],
        ["Bitte berücksichtigen Sie das in Ihrem Angebot. Mit freundlichen Grüßen, S. Roth", "Please take this into account in your offer. Kind regards, S. Roth"],
      ],
    ],
  },
  KALKULATION,
];
