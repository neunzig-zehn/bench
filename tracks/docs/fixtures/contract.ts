/**
 * The tender documents of a fictional school refurbishment (lot 3, drywall and internal doors), in
 * German and in English: invitation with an order of precedence, special and additional contract
 * conditions that conflict, preliminary notes to the BoQ, an ATV excerpt, and two bidder
 * information letters that amend them (the later one revoking an earlier answer), and a holiday
 * calendar for deadlines in working days. The contract terms that follow are set by hand.
 */
import type { Lang } from "../../../src/types";

export type Classification = "included" | "separate";
export type Subject = "plasterboard" | "fire_doors" | "lock_cylinders" | "door_handles" | "door_closers";

export const SERVICES: Array<{ id: string; label: Record<Lang, string>; gold: Classification; why: string }> = [
  {
    id: "site_containers",
    label: { de: "Aufenthalts- und Sanitärcontainer für die eigenen Arbeitskräfte", en: "Welfare and sanitary containers for the contractor's own workers" },
    gold: "included",
    why: "ATV 4.1",
  },
  {
    id: "scaffold_up_to_2m",
    label: { de: "Arbeitsgerüste bis 2,00 m Arbeitshöhe", en: "Working scaffolds up to 2.00 m working height" },
    gold: "included",
    why: "ATV 4.1, preliminary note 3.4, kept by bidder information 1",
  },
  {
    id: "scaffold_over_2m",
    label: { de: "Gerüste über 2,00 m Arbeitshöhe", en: "Scaffolds above 2.00 m working height" },
    gold: "separate",
    why: "preliminary note 3.4 includes them, bidder information 1 overrides it",
  },
  {
    id: "own_waste",
    label: { de: "Beseitigen der eigenen Abfälle und Verpackungen", en: "Removing the contractor's own waste and packaging" },
    gold: "included",
    why: "ATV 4.1",
  },
  {
    id: "floor_protection",
    label: { de: "Schutzabdeckung vorhandener Bodenbeläge", en: "Protective covering of existing floor finishes" },
    gold: "separate",
    why: "ATV 4.2, regulated nowhere else",
  },
  {
    id: "dust_walls",
    label: { de: "Staubschutzwände zur Abtrennung des Schulbetriebs", en: "Dust screens separating the works from school operation" },
    gold: "separate",
    why: "preliminary note 3.5, own item",
  },
  {
    id: "fine_cleaning",
    label: { de: "Feinreinigung der Räume vor der Übergabe", en: "Fine cleaning of the rooms before handover" },
    gold: "separate",
    why: "preliminary note 3.7, own item; bidder information 2 confirms",
  },
  {
    id: "samples",
    label: { de: "Muster für Türdrücker und Oberflächen", en: "Samples of door handles and surfaces" },
    gold: "included",
    why: "ATV 4.2 lists samples, preliminary note 3.6 includes them",
  },
  {
    id: "saturday_work",
    label: { de: "Arbeiten an Samstagen", en: "Work on Saturdays" },
    gold: "included",
    why: "ATV 4.2 lists work outside normal hours, BVB 6 includes Saturdays",
  },
  {
    id: "fire_declarations",
    label: { de: "Übereinstimmungs- und Fachunternehmererklärungen für Brandschutzbauteile", en: "Declarations of conformity and specialist contractor declarations for fire protection components" },
    gold: "included",
    why: "preliminary note 3.8",
  },
];

export const PRODUCTS: Array<{ subject: Subject; manufacturer: string; product: string; equivalentAllowed: boolean }> = [
  { subject: "plasterboard", manufacturer: "Kandor", product: "Protekt GKF", equivalentAllowed: true },
  { subject: "fire_doors", manufacturer: "Hörbach", product: "FireLine T30-1", equivalentAllowed: true },
  { subject: "lock_cylinders", manufacturer: "Securan", product: "SK-7", equivalentAllowed: false },
  { subject: "door_handles", manufacturer: "Normos", product: "Linea 110", equivalentAllowed: false },
  { subject: "door_closers", manufacturer: "Clavis", product: "TS 300", equivalentAllowed: true },
];

/**
 * The terms in force: bidder information (later over earlier) over BoQ over BVB over ZVB over ATV.
 * The binding period runs 60 calendar days from the extended tender deadline; the interim deadline
 * is 40 + 10 working days (Monday to Saturday without Saxon holidays) after the start.
 */
export const TERMS = {
  offerDeadline: "2026-12-10T11:00",
  bindingPeriodEnd: "2027-02-08",
  executionStart: "2027-03-01",
  interimDeadline: "2027-04-30",
  completionDate: "2027-08-13",
  penalty: { percentPerDay: 0.2, dayType: "working_day", capPercent: 5 },
  securities: { performancePercent: 5, warrantyPercent: 3 },
  warrantyYears: { general: 5, doorClosers: 2 },
};

type Document = { id: string; title: string; date: string; pages: string[] };

export const DOCUMENTS: Record<Lang, Document[]> = {
  de: [
    {
      id: "aufforderung",
      title: "Aufforderung zur Abgabe eines Angebots",
      date: "2026-11-09",
      pages: [
        `Stadt Lindenau · Amt für Gebäudemanagement
Vergabe-Nr. LIN-2026-117 · Sanierung Grundschule Am Mühlbach · Los 3: Trockenbau und Innentüren

Aufforderung zur Abgabe eines Angebots (Öffentliche Ausschreibung nach VOB/A)

1. Angebotsfrist: 03.12.2026, 10:00 Uhr. Die Angebote sind elektronisch über die Vergabeplattform einzureichen.
2. Bindefrist: Die Bieter sind bis zum Ablauf von 60 Kalendertagen nach Ablauf der Angebotsfrist an ihr Angebot gebunden.
3. Ausführungsfristen: siehe Besondere Vertragsbedingungen (BVB).
4. Nebenangebote sind nicht zugelassen.
5. Vertragsbestandteile und Rangfolge. Bei Widersprüchen gelten die Vertragsbestandteile in folgender Reihenfolge:
   a) die Bieterinformationen zu diesem Verfahren, die jüngere vor der älteren,
   b) die Leistungsbeschreibung mit den Vorbemerkungen zum LV,
   c) die Besonderen Vertragsbedingungen (BVB),
   d) die Zusätzlichen Vertragsbedingungen der Stadt Lindenau (ZVB),
   e) die Allgemeinen Technischen Vertragsbedingungen (ATV, VOB/C),
   f) die VOB/B.
6. Bieterfragen sind bis spätestens zehn Kalendertage vor Ablauf der Angebotsfrist über die Vergabeplattform zu stellen. Antworten werden allen Bietern als Bieterinformation bekanntgegeben und werden Vertragsbestandteil.`,
      ],
    },
    {
      id: "bvb",
      title: "Besondere Vertragsbedingungen (BVB)",
      date: "2026-11-09",
      pages: [
        `Besondere Vertragsbedingungen (BVB) · LIN-2026-117 · Los 3

1. Ausführungsfristen
1.1 Beginn der Ausführung: 01.03.2027.
1.2 Zwischenfrist: Fertigstellung der Trockenbauarbeiten im Erdgeschoss 40 Werktage nach Beginn der Ausführung.
1.3 Fertigstellung der gesamten Leistung: 30.07.2027.
1.4 Werktage sind alle Kalendertage außer Sonntagen und den gesetzlichen Feiertagen in Sachsen (siehe Anlage Feiertage). Der Tag des Beginns wird nicht mitgezählt.

2. Vertragsstrafe
2.1 Überschreitet der Auftragnehmer schuldhaft die Zwischenfrist nach 1.2 oder die Frist für die Fertigstellung nach 1.3, hat er für jeden Werktag der Überschreitung eine Vertragsstrafe von 0,2 % der Netto-Abrechnungssumme zu zahlen.
2.2 Die Vertragsstrafe ist insgesamt auf 5 % der Netto-Abrechnungssumme begrenzt.

3. Sicherheitsleistungen
3.1 Sicherheit für die Vertragserfüllung: 5 % der Auftragssumme einschließlich Umsatzsteuer.
3.2 Sicherheit für Mängelansprüche: 3 % der Abrechnungssumme einschließlich Umsatzsteuer.`,
        `Besondere Vertragsbedingungen (BVB) · Seite 2

4. Verjährungsfrist für Mängelansprüche
4.1 Die Verjährungsfrist für Mängelansprüche beträgt abweichend von § 13 Abs. 4 VOB/B 5 Jahre.
4.2 Für Türschließer und Feststellanlagen, bei denen die Wartung Einfluss auf Sicherheit und Funktionsfähigkeit hat, beträgt sie 2 Jahre, da die Wartung nicht an den Auftragnehmer vergeben wird.

5. Abrechnung
Abschlagsrechnungen sind prüfbar mit Aufmaß einzureichen. Die Schlussrechnung ist innerhalb von 4 Wochen nach Abnahme vorzulegen.

6. Arbeitszeiten
Der Schulbetrieb läuft während der Bauzeit weiter. Lärmintensive Arbeiten sind montags bis freitags nur zwischen 15:00 und 19:00 Uhr zulässig. Arbeiten an Samstagen sind zulässig und in die Einheitspreise einzukalkulieren; Zuschläge für Samstagsarbeit werden nicht vergütet.`,
      ],
    },
    {
      id: "zvb",
      title: "Zusätzliche Vertragsbedingungen der Stadt Lindenau (ZVB)",
      date: "2024-01-01",
      pages: [
        `Zusätzliche Vertragsbedingungen der Stadt Lindenau (ZVB), Fassung 2024

1. Vertragsstrafe: Für jeden Kalendertag der schuldhaften Überschreitung vereinbarter Fristen wird eine Vertragsstrafe von 0,3 % der Auftragssumme fällig, höchstens 10 % der Auftragssumme.
2. Sicherheiten: Sicherheit für die Vertragserfüllung 5 % der Auftragssumme; Sicherheit für Mängelansprüche 5 % der Abrechnungssumme.
3. Mängelansprüche: Es gilt die Verjährungsfrist nach § 13 Abs. 4 VOB/B (4 Jahre für Bauwerke).
4. Zahlungen: Zahlungen erfolgen bargeldlos. Skonto wird nur berücksichtigt, wenn es im Angebotsschreiben angeboten wird.
5. Baustellenordnung: Rauchen ist auf dem gesamten Schulgelände verboten.`,
      ],
    },
    {
      id: "vorbemerkungen",
      title: "Vorbemerkungen zum LV (Leistungsbeschreibung)",
      date: "2026-11-09",
      pages: [
        `Leistungsbeschreibung · Vorbemerkungen zum LV · Los 3: Trockenbau und Innentüren

1. Allgemeines
Die Arbeiten erfolgen im laufenden Schulbetrieb. Fristen und Vertragsstrafen siehe BVB.

2. Fabrikate
2.1 Gipsplatten: Leitfabrikat Kandor Protekt GKF 12,5 mm (Kandor Baustoffe GmbH) oder gleichwertig.
2.2 Brandschutztüren T30: Leitfabrikat Hörbach FireLine T30-1 oder gleichwertig. Der Gleichwertigkeitsnachweis ist mit dem Angebot zu führen.
2.3 Profilzylinder: Fabrikat Securan SK-7. Die Zylinder erweitern die vorhandene Schließanlage der Schule; gleichwertige Fabrikate sind ausgeschlossen.
2.4 Türdrücker: Fabrikat Normos Linea 110, Edelstahl. Vorgabe des Auftraggebers, ein Gleichwertigkeitsnachweis ist nicht zugelassen.
2.5 Obentürschließer: Leitfabrikat Clavis TS 300 mit Gleitschiene oder gleichwertig.`,
        `Vorbemerkungen zum LV · Seite 2

3. Leistungsumfang
3.1 Die Einheitspreise umfassen alle Leistungen nach der ATV, soweit im Folgenden nichts anderes bestimmt ist.
3.2 Die Baustelleneinrichtung ist in die Einheitspreise einzurechnen.
3.3 Strom und Wasser stellt der Auftraggeber kostenlos zur Verfügung.
3.4 Gerüste: Arbeitsgerüste jeder Höhe sind in die Einheitspreise einzurechnen und werden nicht gesondert vergütet.
3.5 Staubschutzwände zur Abtrennung des Schulbetriebs werden nach Pos. 01.0040 gesondert vergütet.
3.6 Muster für Türdrücker und Oberflächen sind dem Auftraggeber kostenlos zu stellen.
3.7 Die Feinreinigung der Räume vor der Übergabe wird nach Pos. 06.0010 gesondert vergütet.
3.8 Übereinstimmungserklärungen und Fachunternehmererklärungen für Brandschutzbauteile sind mit den Einheitspreisen abgegolten.`,
      ],
    },
    {
      id: "atv",
      title: "Auszug ATV Trockenbauarbeiten, Abschnitt 4 (sinngemäß)",
      date: "2026-11-09",
      pages: [
        `Auszug aus den ATV für Trockenbauarbeiten, Abschnitt 4 (sinngemäß, Stand dieses Verfahrens)

4.1 Nebenleistungen sind Teil der vertraglichen Leistung auch ohne Erwähnung im Vertrag und werden nicht gesondert vergütet, insbesondere:
- Einrichten und Räumen der Baustelle einschließlich der Aufenthalts- und Sanitärcontainer für die eigenen Arbeitskräfte,
- Vorhalten der Arbeitsgerüste bis 2,00 m Arbeitshöhe,
- Beseitigen aller vom Auftragnehmer herrührenden Abfälle und Verpackungen,
- Aufmaß und Abrechnungszeichnungen,
- besenreines Säubern der eigenen Arbeitsbereiche.

4.2 Besondere Leistungen sind nur Teil der vertraglichen Leistung, wenn sie in der Leistungsbeschreibung besonders erwähnt sind; sonst werden sie gesondert vergütet, insbesondere:
- Gerüste über 2,00 m Arbeitshöhe,
- besondere Schutzmaßnahmen für Bauteile und vorhandene Beläge, z. B. Schutzabdeckungen von Böden,
- Staubschutzwände und Einhausungen,
- Feinreinigung,
- Liefern von Mustern,
- Arbeiten außerhalb der regelmäßigen Arbeitszeit, an Samstagen, Sonn- und Feiertagen.`,
      ],
    },
    {
      id: "bieterinfo-1",
      title: "Bieterinformation Nr. 1",
      date: "2026-11-20",
      pages: [
        `Bieterinformation Nr. 1 vom 20.11.2026 · LIN-2026-117 · Los 3

Frage 1: Nach Vorbemerkung 3.4 sind Gerüste jeder Höhe einzurechnen. Im Treppenhaus sind Arbeitshöhen bis 7 m erforderlich. Wird daran festgehalten?
Antwort: Nein. Abweichend von Vorbemerkung 3.4 werden Gerüste über 2,00 m Arbeitshöhe gesondert vergütet; dafür wird die neue Pos. 01.0060 aufgenommen. Arbeitsgerüste bis 2,00 m Arbeitshöhe bleiben in die Einheitspreise einzurechnen.

Frage 2: Können für die Türdrücker gleichwertige Fabrikate angeboten werden?
Antwort: Ja. Für Türdrücker werden gleichwertige Fabrikate zugelassen; der Gleichwertigkeitsnachweis ist mit dem Angebot zu führen. Für die Profilzylinder bleibt es bei Vorbemerkung 2.3.

Frage 3: Ist der Fertigstellungstermin angesichts der Lieferzeiten für T30-Türen zu halten?
Antwort: Der Termin für die Fertigstellung der gesamten Leistung wird auf den 13.08.2027 verschoben. Die Zwischenfrist verlängert sich um 10 Werktage. Der Beginn bleibt unverändert.`,
      ],
    },
    {
      id: "bieterinfo-2",
      title: "Bieterinformation Nr. 2",
      date: "2026-11-27",
      pages: [
        `Bieterinformation Nr. 2 vom 27.11.2026 · LIN-2026-117 · Los 3

1. Die Angebotsfrist wird verlängert auf den 10.12.2026, 11:00 Uhr. Die übrigen Regelungen der Aufforderung gelten unverändert.

2. Frage: Ist das besenreine Säubern nach Abschluss der eigenen Arbeiten gesondert zu vergüten?
Antwort: Nein, es ist Nebenleistung. Die Feinreinigung vor der Übergabe wird weiterhin nach Pos. 06.0010 vergütet.

3. Frage: Kann die Bauzeit durch Arbeiten an Sonntagen verkürzt werden?
Antwort: Nein. Arbeiten an Sonn- und Feiertagen sind auf dem Schulgelände nicht zulässig.`,
      ],
    },
    {
      id: "bieterinfo-3",
      title: "Bieterinformation Nr. 3",
      date: "2026-12-02",
      pages: [
        `Bieterinformation Nr. 3 vom 02.12.2026 · LIN-2026-117 · Los 3

Die Antwort zu Frage 2 der Bieterinformation Nr. 1 (Türdrücker) wird zurückgenommen. Die Türdrücker müssen den im Bestand vorhandenen Drückern entsprechen; es gilt Vorbemerkung 2.4.

Im Übrigen bleiben die Bieterinformationen Nr. 1 und Nr. 2 unverändert gültig.`,
      ],
    },
    {
      id: "anlage-feiertage",
      title: "Anlage Feiertage: gesetzliche Feiertage in Sachsen 2026/2027",
      date: "2026-11-09",
      pages: [
        `Anlage zu den BVB: gesetzliche Feiertage im Freistaat Sachsen

2026: 25.12. (1. Weihnachtstag), 26.12. (2. Weihnachtstag)
2027: 01.01. (Neujahr), 26.03. (Karfreitag), 29.03. (Ostermontag), 01.05. (Tag der Arbeit), 06.05. (Christi Himmelfahrt), 17.05. (Pfingstmontag), 03.10. (Tag der Deutschen Einheit), 31.10. (Reformationstag), 17.11. (Buß- und Bettag), 25.12., 26.12.`,
      ],
    },
  ],
  en: [
    {
      id: "invitation",
      title: "Invitation to tender",
      date: "2026-11-09",
      pages: [
        `City of Lindenau · Facilities Management Department
Tender no. LIN-2026-117 · Refurbishment of Am Mühlbach primary school · Lot 3: Drywall and internal doors

Invitation to tender (open procedure under VOB/A)

1. Tender deadline: 3 December 2026, 10:00. Tenders are to be submitted electronically via the tender platform.
2. Binding period: Bidders are bound by their tender until 60 calendar days after the tender deadline expires.
3. Construction periods: see Special Contract Conditions (BVB).
4. Variant bids are not permitted.
5. Contract documents and order of precedence. In case of conflict, the contract documents apply in the following order:
   a) the bidder information letters of this procedure, the later before the earlier,
   b) the specification with the preliminary notes to the BoQ,
   c) the Special Contract Conditions (BVB),
   d) the Additional Contract Conditions of the City of Lindenau (ZVB),
   e) the General Technical Specifications (ATV, VOB/C),
   f) the VOB/B.
6. Bidder questions must be asked via the tender platform no later than ten calendar days before the tender deadline. Answers are published to all bidders as bidder information and become part of the contract.`,
      ],
    },
    {
      id: "bvb",
      title: "Special Contract Conditions (BVB)",
      date: "2026-11-09",
      pages: [
        `Special Contract Conditions (BVB) · LIN-2026-117 · Lot 3

1. Construction periods
1.1 Start of construction: 1 March 2027.
1.2 Interim deadline: completion of the drywall works on the ground floor 40 working days after the start of construction.
1.3 Completion of the entire works: 30 July 2027.
1.4 Working days are all calendar days except Sundays and the public holidays in Saxony (see annex Holidays). The day of the start is not counted.

2. Contractual penalty
2.1 If the contractor culpably exceeds the interim deadline under 1.2 or the completion deadline under 1.3, it shall pay a contractual penalty of 0.2 % of the net final account sum for each working day of delay.
2.2 The contractual penalty is capped at 5 % of the net final account sum in total.

3. Securities
3.1 Performance security: 5 % of the contract sum including VAT.
3.2 Security for defect claims: 3 % of the final account sum including VAT.`,
        `Special Contract Conditions (BVB) · Page 2

4. Limitation period for defect claims
4.1 Notwithstanding § 13 (4) VOB/B, the limitation period for defect claims is 5 years.
4.2 For door closers and hold-open systems, whose maintenance affects safety and function, it is 2 years, as maintenance is not awarded to the contractor.

5. Invoicing
Interim invoices are to be submitted in verifiable form with measurements. The final invoice is to be submitted within 4 weeks after acceptance.

6. Working hours
School operation continues during construction. Noisy works are permitted Monday to Friday only between 15:00 and 19:00. Work on Saturdays is permitted and is to be included in the unit prices; no surcharges are paid for Saturday work.`,
      ],
    },
    {
      id: "zvb",
      title: "Additional Contract Conditions of the City of Lindenau (ZVB)",
      date: "2024-01-01",
      pages: [
        `Additional Contract Conditions of the City of Lindenau (ZVB), 2024 edition

1. Contractual penalty: For each calendar day of culpable delay beyond agreed deadlines, a contractual penalty of 0.3 % of the contract sum is due, at most 10 % of the contract sum.
2. Securities: performance security 5 % of the contract sum; security for defect claims 5 % of the final account sum.
3. Defect claims: The limitation period under § 13 (4) VOB/B applies (4 years for buildings).
4. Payments: Payments are made cashless. Cash discounts are only considered if offered in the tender letter.
5. Site rules: Smoking is prohibited on the entire school grounds.`,
      ],
    },
    {
      id: "preliminary-notes",
      title: "Preliminary notes to the BoQ (specification)",
      date: "2026-11-09",
      pages: [
        `Specification · Preliminary notes to the BoQ · Lot 3: Drywall and internal doors

1. General
The works take place during school operation. For deadlines and contractual penalties see BVB.

2. Products
2.1 Plasterboard: reference product Kandor Protekt GKF 12.5 mm (Kandor Baustoffe GmbH) or equivalent.
2.2 Fire doors T30: reference product Hörbach FireLine T30-1 or equivalent. Proof of equivalence is to be submitted with the tender.
2.3 Profile cylinders: Securan SK-7. The cylinders extend the school's existing master key system; equivalent products are excluded.
2.4 Door handles: Normos Linea 110, stainless steel. Specified by the client; proof of equivalence is not permitted.
2.5 Overhead door closers: reference product Clavis TS 300 with slide rail or equivalent.`,
        `Preliminary notes to the BoQ · Page 2

3. Scope of works
3.1 The unit prices cover all work under the ATV unless stated otherwise below.
3.2 Site setup is to be included in the unit prices.
3.3 The client provides power and water free of charge.
3.4 Scaffolding: working scaffolds of any height are to be included in the unit prices and are not paid separately.
3.5 Dust screens separating the works from school operation are paid separately under item 01.0040.
3.6 Samples of door handles and surfaces are to be provided to the client free of charge.
3.7 Fine cleaning of the rooms before handover is paid separately under item 06.0010.
3.8 Declarations of conformity and specialist contractor declarations for fire protection components are covered by the unit prices.`,
      ],
    },
    {
      id: "atv",
      title: "ATV drywall works excerpt, section 4 (paraphrased)",
      date: "2026-11-09",
      pages: [
        `Excerpt from the ATV for drywall works, section 4 (paraphrased, as applicable to this procedure)

4.1 Ancillary works (Nebenleistungen) are part of the contractual work even if not mentioned in the contract and are not paid separately, in particular:
- setting up and clearing the site, including welfare and sanitary containers for the contractor's own workers,
- providing working scaffolds up to 2.00 m working height,
- removing all waste and packaging originating from the contractor,
- measurements and invoicing drawings,
- broom-clean cleaning of the contractor's own work areas.

4.2 Special works (Besondere Leistungen) are part of the contractual work only if specifically mentioned in the specification; otherwise they are paid separately, in particular:
- scaffolds above 2.00 m working height,
- special protective measures for building components and existing finishes, e.g. protective covering of floors,
- dust screens and enclosures,
- fine cleaning,
- supplying samples,
- work outside regular working hours, on Saturdays, Sundays, and public holidays.`,
      ],
    },
    {
      id: "bidder-info-1",
      title: "Bidder information No. 1",
      date: "2026-11-20",
      pages: [
        `Bidder information No. 1 dated 20 November 2026 · LIN-2026-117 · Lot 3

Question 1: Under preliminary note 3.4, scaffolds of any height are to be included. Working heights of up to 7 m are required in the stairwell. Does this still apply?
Answer: No. Notwithstanding preliminary note 3.4, scaffolds above 2.00 m working height are paid separately; new item 01.0060 is added for them. Working scaffolds up to 2.00 m working height remain included in the unit prices.

Question 2: May equivalent products be offered for the door handles?
Answer: Yes. Equivalent products are permitted for door handles; proof of equivalence is to be submitted with the tender. For the profile cylinders, preliminary note 2.3 still applies.

Question 3: Can the completion date be met given the delivery times for T30 doors?
Answer: The completion date for the entire works is postponed to 13 August 2027. The interim deadline is extended by 10 working days. The start remains unchanged.`,
      ],
    },
    {
      id: "bidder-info-2",
      title: "Bidder information No. 2",
      date: "2026-11-27",
      pages: [
        `Bidder information No. 2 dated 27 November 2026 · LIN-2026-117 · Lot 3

1. The tender deadline is extended to 10 December 2026, 11:00. All other provisions of the invitation remain unchanged.

2. Question: Is broom-clean cleaning after completing one's own work paid separately?
Answer: No, it is an ancillary work. Fine cleaning before handover continues to be paid under item 06.0010.

3. Question: Can the construction period be shortened by working on Sundays?
Answer: No. Work on Sundays and public holidays is not permitted on the school grounds.`,
      ],
    },
    {
      id: "bidder-info-3",
      title: "Bidder information No. 3",
      date: "2026-12-02",
      pages: [
        `Bidder information No. 3 dated 2 December 2026 · LIN-2026-117 · Lot 3

The answer to question 2 of bidder information No. 1 (door handles) is withdrawn. The door handles must match the handles in the existing building; preliminary note 2.4 applies.

Otherwise, bidder information No. 1 and No. 2 remain valid unchanged.`,
      ],
    },
    {
      id: "annex-holidays",
      title: "Annex Holidays: public holidays in Saxony 2026/2027",
      date: "2026-11-09",
      pages: [
        `Annex to the BVB: public holidays in the Free State of Saxony

2026: 25 Dec (Christmas Day), 26 Dec (Boxing Day)
2027: 1 Jan (New Year's Day), 26 Mar (Good Friday), 29 Mar (Easter Monday), 1 May (Labour Day), 6 May (Ascension Day), 17 May (Whit Monday), 3 Oct (German Unity Day), 31 Oct (Reformation Day), 17 Nov (Day of Prayer and Repentance), 25 Dec, 26 Dec`,
      ],
    },
  ],
};
