/** Documents of the wallbox task: an LV item with blanks, a Baubeschreibung, plan notes, and an email. */
import type { Doc } from "../dialog";
import { KALKULATION } from "./catalog";

export const WALLBOX_DOCS: Doc[] = [
  {
    id: "lv",
    title: { de: "LV Neubau Bürogebäude Lindenstraße 14 – Titel 02 Elektromobilität (Stand 12.10.2026)", en: "LV new office building Lindenstraße 14 – section 02 e-mobility (as of 12 Oct 2026)" },
    pages: [
      [
        ["Pos. 02.01 Kabelrinne 200 x 60 mm, verzinkt, an der Decke der Tiefgarage, einschließlich Abhängung. Menge: 48 m", "Item 02.01 Cable tray 200 x 60 mm, galvanised, on the underground car park ceiling, including suspension. Quantity: 48 m"],
        ["Pos. 02.02 Leitung NYM-J 5x10 mm² auf Kabelrinne verlegen, Hauptzuleitung zur UV-TG. Menge: 35 m", "Item 02.02 Lay cable NYM-J 5x10 mm² on the cable tray, main supply to the UV-TG. Quantity: 35 m"],
        ["Pos. 02.03 Unterverteilung UV-TG, Aufputz, 3-reihig, bestücken und anschließen. Menge: 1 Stk", "Item 02.03 Sub-distribution board UV-TG, surface-mounted, 3 rows, equip and connect. Quantity: 1 pc"],
        ["Pos. 02.04 Wallbox 11 kW. Menge: 6 Stk", "Item 02.04 Wallbox 11 kW. Quantity: 6 pcs"],
        ["Langtext 02.04: Wallbox (AC-Ladestation) 11 kW mit Typ-2-Ladedose und integrierter DC-Fehlerstromerkennung, Wandmontage, liefern, montieren, anschließen und in Betrieb nehmen.", "Long text 02.04: Wallbox (AC charging station) 11 kW with type 2 socket and integrated DC residual current detection, wall-mounted; supply, install, connect, and commission."],
        ["Einschließlich Zuleitung NYM-J 5x6 mm² ab UV-TG, auf der Kabelrinne verlegt (im Einheitspreis enthalten).", "Including the supply cable NYM-J 5x6 mm² from the UV-TG, laid on the cable tray (included in the unit price)."],
        ["Fabrikat: .................... Typ: .................... (vom Bieter einzutragen)", "Make: .................... Type: .................... (to be entered by the bidder)"],
      ],
      [
        ["Pos. 02.05 Dynamisches Lastmanagement für 6 Ladepunkte, Steuereinheit in der UV-TG, einschließlich Parametrierung. Menge: 1 psch", "Item 02.05 Dynamic load management for 6 charging points, control unit in the UV-TG, including configuration. Quantity: 1 lump sum"],
        ["Pos. 02.06 Leitungsschutzschalter B32, 3-polig, und Fehlerstromschutzschalter Typ A je Ladepunkt in der UV-TG. Menge: 6 Stk", "Item 02.06 Miniature circuit breaker B32, 3-pole, and residual current device type A per charging point in the UV-TG. Quantity: 6 pcs"],
        ["Pos. 02.07 Beschilderung der Ladeplätze. Menge: 6 Stk", "Item 02.07 Signage of the charging bays. Quantity: 6 pcs"],
      ],
    ],
  },
  {
    id: "baubeschreibung",
    title: { de: "Baubeschreibung Elektro – Bürogebäude Lindenstraße 14 (Auszug)", en: "Baubeschreibung (construction specification), electrical – office building Lindenstraße 14 (extract)" },
    pages: [
      [
        ["1. Allgemeines: Bauherr ist die Lindenhof Immobilien GmbH, Potsdam. Ausführung ab Frühjahr 2027.", "1. General: The client is Lindenhof Immobilien GmbH, Potsdam. Execution from spring 2027."],
        ["2. Fabrikate: Fabrikate und Typen bestimmt der Bauherr, soweit das LV keine Vorgabe enthält. Vom Bieter eingetragene Fabrikate gelten erst nach Freigabe durch den Bauherrn.", "2. Makes: The client decides makes and types unless the LV specifies them. Makes entered by the bidder apply only once the client has approved them."],
        ["3. Leitungsanlagen: Leitungen in der Tiefgarage werden auf Kabelrinnen geführt; Querschnitte gemäß LV.", "3. Wiring: Cables in the underground car park run on cable trays; cross-sections as in the LV."],
      ],
      [
        ["4. Elektromobilität: In der Tiefgarage erhalten die Stellplätze 1–6 je eine Wallbox 11 kW.", "4. E-mobility: In the underground car park, parking spaces 1–6 get one 11 kW wallbox each."],
        ["Montage an der Wand, Unterkante Wallbox 1,20 m über Fertigfußboden.", "Wall-mounted, bottom edge of the wallbox 1.20 m above finished floor level."],
        ["Ein dynamisches Lastmanagement (LV-Pos. 02.05) begrenzt die gesamte Ladeleistung auf den Netzanschluss.", "A dynamic load management system (LV item 02.05) limits the total charging power to the grid connection."],
        ["Die Absicherung je Ladepunkt (LS B32 und FI Typ A) erfolgt in der UV-TG (LV-Pos. 02.06).", "Each charging point is protected in the UV-TG (MCB B32 and RCD type A, LV item 02.06)."],
        ["5. Brandschutz: Leitungsdurchführungen durch Brandwände werden mit zugelassenen Abschottungen verschlossen (separates Gewerk).", "5. Fire protection: Cable penetrations through fire walls are sealed with approved fire stops (separate trade)."],
      ],
    ],
  },
  {
    id: "plan-tiefgarage",
    title: { de: "Planhinweise Grundriss Tiefgarage E-TG-01, Index B", en: "Plan notes, underground car park floor plan E-TG-01, revision B" },
    pages: [
      [
        ["Grundriss Tiefgarage E-TG-01, Index B (Stand 01.10.2026)", "Underground car park floor plan E-TG-01, revision B (as of 1 Oct 2026)"],
        ["Stellplätze 1–6 an der Nordwand (Achse A), je eine Wallbox (Symbol WB).", "Parking spaces 1–6 on the north wall (axis A), one wallbox each (symbol WB)."],
        ["UV-TG im Technikraum der Tiefgarage, Achse D.", "UV-TG in the car park plant room, axis D."],
        ["Kabelrinne 200 x 60 mm entlang Achse A, Unterkante 2,40 m.", "Cable tray 200 x 60 mm along axis A, bottom edge 2.40 m."],
        ["Leitungslängen sind nicht bemaßt; Grundriss nicht maßstäblich.", "Cable lengths are not dimensioned; floor plan not to scale."],
      ],
    ],
  },
  {
    id: "email-bauleitung",
    title: { de: "E-Mail Bauleitung vom 20.10.2026: Wallboxen TG", en: "Email from site management, 20 Oct 2026: wallboxes in the car park" },
    pages: [
      [
        ["Von: Markus Krüger (Bauleitung) – An: Kalkulation – 20.10.2026", "From: Markus Krüger (site management) – To: estimating – 20 Oct 2026"],
        ["Betreff: Wallboxen TG Lindenstraße", "Subject: Wallboxes, car park, Lindenstraße"],
        ["Hallo zusammen, der Bauherr will den Preis für die Wallboxen bis Freitag haben.", "Hello all, the client wants the price for the wallboxes by Friday."],
        ["Das Fabrikat bitte mit Jana abstimmen, sie war beim Bauherrn. Die Zuleitungslängen habe ich vor Ort aufgenommen, Jana hat die Zahlen.", "Please agree the make with Jana; she met the client. I measured the supply cable lengths on site; Jana has the figures."],
        ["Gruß, Markus", "Regards, Markus"],
      ],
    ],
  },
  {
    id: "angebot-ba1",
    title: { de: "Unser Angebot Nr. 2025-031 vom 14.03.2025 – Lindenstraße 12, 1. Bauabschnitt", en: "Our offer no. 2025-031 of 14 Mar 2025 – Lindenstraße 12, construction phase 1" },
    pages: [
      [
        ["Angebot Nr. 2025-031 vom 14.03.2025 an die Lindenhof Immobilien GmbH: Bürogebäude Lindenstraße 12, 1. Bauabschnitt, Titel 02 Elektromobilität", "Offer no. 2025-031 of 14 Mar 2025 to Lindenhof Immobilien GmbH: office building Lindenstraße 12, construction phase 1, section 02 e-mobility"],
        ["Preise gültig bis 30.06.2025, kalkuliert nach den Kalkulationsgrundlagen 2025.", "Prices valid until 30 Jun 2025, calculated with the estimating rules 2025."],
        ["Pos. 02.01 Kabelrinne 200 x 60 mm, verzinkt, einschließlich Abhängung. Menge: 32 m, EP 34,10 €", "Item 02.01 Cable tray 200 x 60 mm, galvanised, including suspension. Quantity: 32 m, unit price EUR 34.10"],
        ["Pos. 02.04 Wallbox 11 kW, Wandmontage, einschließlich Zuleitung NYM-J 5x6 mm², Länge 18 m je Stück. Fabrikat: Hagenau, Typ: eCharge 11. Menge: 4 Stk, EP 1.163,52 €", "Item 02.04 Wallbox 11 kW, wall-mounted, including supply cable NYM-J 5x6 mm², length 18 m each. Make: Hagenau, type: eCharge 11. Quantity: 4 pcs, unit price EUR 1,163.52"],
        ["Pos. 02.05 Dynamisches Lastmanagement für 4 Ladepunkte. Menge: 1 psch, EP 1.980,00 €", "Item 02.05 Dynamic load management for 4 charging points. Quantity: 1 lump sum, unit price EUR 1,980.00"],
      ],
    ],
  },
  KALKULATION,
];
