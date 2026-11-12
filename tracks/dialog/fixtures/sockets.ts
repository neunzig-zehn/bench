/** Documents of the fully specified socket task: everything needed sits in the LV, the Baubeschreibung, and the plan. */
import type { Doc } from "../dialog";
import { KALKULATION } from "./catalog";

export const SOCKET_DOCS: Doc[] = [
  {
    id: "lv",
    title: { de: "LV Neubau Kita Sonnenblume, Leipzig – Titel 05 Technikräume (Stand 20.10.2026)", en: "LV new daycare centre Kita Sonnenblume, Leipzig – section 05 plant rooms (as of 20 Oct 2026)" },
    pages: [
      [
        ["Pos. 05.01 Ausschalter Aufputz, Feuchtraumausführung IP44, Serie gemäß Baubeschreibung, Technikraum UG. Menge: 6 Stk", "Item 05.01 On/off switch, surface-mounted, damp-proof IP44, series as in the Baubeschreibung, basement plant room. Quantity: 6 pcs"],
        ["Pos. 05.02 Steckdose 2-fach (Doppelsteckdose) Aufputz, Feuchtraumausführung IP44, Serie gemäß Baubeschreibung, Technikraum UG. Menge: 14 Stk", "Item 05.02 Socket outlet, double, surface-mounted, damp-proof IP44, series as in the Baubeschreibung, basement plant room. Quantity: 14 pcs"],
        ["Langtext 05.02: Liefern, montieren und anschließen, einschließlich Zuleitung NYM-J 3x2,5 mm² ab Unterverteilung UV-UG, Leitungslänge 12 m je Stück (im Einheitspreis enthalten). Montagehöhe gemäß Installationsplan.", "Long text 05.02: Supply, install, and connect, including the supply cable NYM-J 3x2.5 mm² from the sub-distribution board UV-UG, cable length 12 m per piece (included in the unit price). Mounting height as in the installation plan."],
        ["Pos. 05.03 Feuchtraum-Wannenleuchte LED 1500 mm, IP65, Technikraum UG. Menge: 8 Stk", "Item 05.03 Damp-proof batten luminaire LED 1500 mm, IP65, basement plant room. Quantity: 8 pcs"],
      ],
    ],
  },
  {
    id: "baubeschreibung",
    title: { de: "Baubeschreibung Elektro – Kita Sonnenblume (Auszug)", en: "Baubeschreibung (construction specification), electrical – Kita Sonnenblume (extract)" },
    pages: [
      [
        ["1. Schalterprogramme: Gruppen- und Aufenthaltsräume Serie Linea, reinweiß, mit erhöhtem Berührungsschutz.", "1. Switch ranges: group rooms and common rooms Linea series, pure white, with increased shock protection."],
        ["2. Technik- und Nassräume: Serie Aqua, Feuchtraumausführung IP44, Farbe lichtgrau.", "2. Plant rooms and wet rooms: Aqua series, damp-proof IP44, colour light grey."],
        ["3. Leitungen in Technikräumen auf Putz in Installationsrohr; Leitungslängen gemäß LV.", "3. Cables in plant rooms surface-mounted in conduit; cable lengths as in the LV."],
        ["4. Fabrikate: Die in Abschnitt 1 und 2 genannten Serien sind verbindlich; Alternativen sind nicht zugelassen.", "4. Makes: The series named in sections 1 and 2 are binding; alternatives are not allowed."],
      ],
    ],
  },
  {
    id: "installationsplan",
    title: { de: "Installationsplan Untergeschoss E-UG-02, Index A", en: "Installation plan, basement E-UG-02, revision A" },
    pages: [
      [
        ["Installationsplan Untergeschoss E-UG-02, Index A (Stand 05.10.2026)", "Installation plan, basement E-UG-02, revision A (as of 5 Oct 2026)"],
        ["Technikraum UG: 14 Doppelsteckdosen (Serie Aqua, RAL 7035) an den Wänden, 6 Ausschalter neben den Türen, 8 Wannenleuchten.", "Basement plant room: 14 double sockets (Aqua series, RAL 7035) on the walls, 6 switches next to the doors, 8 batten luminaires."],
        ["Montagehöhe Steckdosen und Schalter im Technikraum: 1,05 m über Fertigfußboden.", "Mounting height of sockets and switches in the plant room: 1.05 m above finished floor level."],
        ["Raumhöhe Technikraum: 2,80 m.", "Plant room height: 2.80 m."],
      ],
    ],
  },
  {
    id: "email-bauleitung",
    title: { de: "E-Mail Bauleitung vom 06.11.2026: Titel 05", en: "Email from site management, 6 Nov 2026: section 05" },
    pages: [
      [
        ["Von: Peter Hahn (Bauleitung) – An: Kalkulation – 06.11.2026", "From: Peter Hahn (site management) – To: estimating – 6 Nov 2026"],
        ["Betreff: Kita Sonnenblume, Titel 05", "Subject: Kita Sonnenblume, section 05"],
        ["Hallo, der Bauherr möchte vorab die Preise für die Technikräume sehen. Die Wannenleuchten (05.03) bitte noch zurückstellen, da wird das Fabrikat noch abgestimmt.", "Hello, the client would like to see the prices for the plant rooms in advance. Please hold back the batten luminaires (05.03) for now; their make is still being agreed."],
        ["Gruß, Peter", "Regards, Peter"],
      ],
    ],
  },
  KALKULATION,
];
