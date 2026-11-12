# Docs track

Parsing tender documents: bills of quantities (LV) as GAEB XML and as OCR text, supplier offers as OCR text and as scanned images, a product data sheet, and the contract terms spread over a set of tender documents. The metric is extracted fields compared with ground truth.

Every task exists as `-de` and `-en`: same data, same grader; prompts, tool descriptions, tool outputs, and documents are fully translated (German documents format numbers as `1.234,50`, English ones as `1,234.50`). The data is synthetic and the ground truth is known by construction: hand-written fixtures, plus a seeded generator for the larger BoQs. The model reaches the documents only through tools (pages, line windows, search, image views), so every run takes several calls.

| Task | Size | What it measures |
| --- | --- | --- |
| `docs-datasheet-fields` | 6 pages, 3 order codes × 17 fields | Technical fields of a product variant from a data sheet |
| `docs-offer-ocr-lines` | 4 OCR pages, 31 lines | Supplier offer lines and the corrected net total from OCR text |
| `docs-gaeb-lv-structure` | ~2,900 XML lines, 30 titles, 129 positions | BoQ structure from a GAEB DA XML (X83) file |
| `docs-lv-ocr-structure` | 23 OCR pages, 26 titles, 124 positions | BoQ structure from an LV printed to PDF and OCR'd |
| `docs-contract-terms` | 9 documents, 32 fields | Contract terms in force after precedence and amendments |
| `docs-offer-scan-lines` | 3 scanned pages, 24 lines | Supplier offer lines and the corrected net total from images |

## Tasks

**Data sheet fields** (`datasheet.ts`). The model gets three order codes of an LED high-bay series (`HBP-150-840-90-D-S` and two more) and a six-page data sheet with page and search tools. It returns power, luminous flux, efficacy, colour temperature, CRI, beam angle, dimming interface, diameter and height in mm, weight, IP and IK rating, protection class, ambient temperature range, L80 lifetime, and certifications.
- Traps: decoding the order code; flux from a base value × colour, optics, and glass factors with a rounding rule; efficacy from the derived flux; dimensions printed in cm but asked in mm; the glass option changes height, IP, and IK; weight from a base plus option surcharges, with an erratum that only the revision history carries; the 200 W class has its own temperature limit and lifetime; glass with 120° optics limits the ambient temperature; certifications depend on the driver, and a photobiological test report is no certificate.
- Grading: one check per variant and field. Flux is checked within 0.3 %, efficacy within 1 lm/W, weight within 0.05 kg, and dimensions within 0.5 mm. Certifications must match as an exact set.

**Offer lines from OCR** (`offer-ocr.ts`, `fixtures/offer-ocr.ts`). This is a port of 90/10's synthetic `bench/extract`, made harder. Four OCR pages are read one at a time. The model returns every line with article number, quantity, unit, unit price per unit, printed total, and flags (alternative, provisional, discontinued), plus the net total after all corrections.
- Traps: price units come from a section header (per 100), an inline note (price/12), or a page footnote (per 10 m). Discounts come from the line, the section, a quantity threshold, or a separate row. A second footnote adds a metal surcharge. OCR misreads two prices (`l68,0O`, `B6,4O`), which the printed totals resolve. A correction note sits at the end of the document. The offer also has a discontinued line and its replacement, a merged quantity and unit, figures on the row below, and a description that continues on the next page. The printed net total is not the corrected one.
- Grading: per line, checks on article, quantity, unit, unit price (0.05 % or half a cent), printed total, and flags. The printed total is not graded for the corrected line. Item 10's description is checked across the page break. There is a check for no extra lines (weight 2) and one for the net total within 15 cents (weight 5).

**GAEB BoQ structure** (`gaeb-lv.ts`, `fixtures/gaeb-lv.ts`). A GAEB DA XML 3.3 X83 file is read through a line-windowed file tool (at most 120 lines per call) and a search tool. The model returns every title and subtitle with OZ and label, and every position with OZ, short text, quantity, unit, kind (`normal`, `base`, `alternative`, `optional_with_total`, `optional_without_total`, `lump_sum`, `surcharge`), and the base OZ of each alternative.
- Traps: the OZ has to be composed from nested `RNoPart` values, because the ids are opaque. Remarks are not positions. Kinds come from GAEB flags (`ALNGroupNo`/`ALNSerNo`, `Provis`, `LumpSumItem`) or, for Zulage/Mehrpreis, from the text. An alternative's base can sit in another subtitle or come after it, and one group has two alternatives. Repeated descriptions (`RefDescr Rep`) point by opaque `IDRef` to the item whose short text applies. The long text comes before the short text, and one short text is split across spans. Titles 06–10 come from the shared generator with near-duplicate positions.
- Grading (`boq-positions.ts`): per position, checks on kind, quantity, unit (spellings normalised across languages), short text (compared without case, spacing, or punctuation), and the base of an alternative. Each title label is a check of weight 0.5. Extra positions (weight 3) fail one check. An OZ matches by its numeric parts, so `1.2.30` equals `01.02.0030`.

**BoQ structure from OCR** (`lv-ocr.ts`, `fixtures/lv-ocr.ts`, `fixtures/boq-families.ts`). The fields are the same as in the GAEB task, but the BoQ is a 23-page PDF read back as OCR text.
- Traps: positions break across pages, so the quantity line comes after the repeated header and the carry-over. Subtitles and sums look like positions. Kinds are stated only in prose, with varying wording (Bedarfsposition nur EP, Eventualposition mit Gesamtbetrag, Wahlposition, Grundposition, Zulage). Long texts carry misleading words ("nach Bedarf", "alternativ"). A letter O replaces a zero in some quantities, and some quantities run into their unit (`96,750m2`). Titles 05–09 come from the seeded generator with near-duplicate positions.
- Grading: same as the GAEB task.

**Contract terms** (`contract-terms.ts`, `fixtures/contract.ts`). Nine tender documents are reached through list, read, and search tools: the invitation, BVB, ZVB, preliminary notes, an ATV excerpt, three bidder information letters, and a holiday calendar. The model returns the dates, contractual penalty, securities, limitation periods, the prescribed products and whether an equivalent is allowed, and whether each of 10 services is included in the unit prices or paid separately.
- Traps: the invitation's order of precedence decides every conflict. Bidder information moves the tender deadline, so the binding period of 60 calendar days moves with it. It extends the interim deadline by working days, which have to be counted Monday to Saturday without Easter holidays. It moves the completion date, admits equivalent door handles until a later letter withdraws that, and makes scaffolds above 2 m separate again. The BVB's penalty (per working day, 5 % cap), defect security, and limitation period beat the ZVB's. The preliminary notes include samples, although the ATV lists them as special works. The BVB includes Saturday work. Floor protection is regulated only by the ATV.
- Grading: 32 checks, one per field. Dates are read from ISO or German forms, numbers must be exact, products are matched by manufacturer and product name, and each service must be classified correctly.

**Offer lines from scans** (`offer-scan.ts`, `fixtures/offer-scan.ts`). Three scanned pages are reached through a viewer that shows a low-resolution overview, full-resolution top and bottom halves, and a 180° turn. The fields are those of the OCR offer.
- Traps: price units sit in a PE column. Cables carry a metal surcharge per metre, computed from a printed copper formula (Cu weight × (DEL − base) / 100,000) in small print. A received stamp covers a printed total, which can be derived from quantity and price. The scans add handwritten corrections to a price and to a discount, a line struck out by hand, and a handwritten note that extends a discount to another line. The last page was scanned upside down. Tilt, blur, and noise make the print harder to read.
- Grading: same as the OCR offer. The printed total is not graded where handwriting changes the line.

## Files

- `index.ts` exports `TASKS`. Each task file has a factory `(lang) => Task` mapped over both languages.
- `shared.ts` holds the shared helpers: tool results, schemas, number formatting, unit normalisation, and lenient field comparison.
- `boq-positions.ts` and `offer-lines.ts` hold the schema and grader that two tasks each share.
- `fixtures/` holds the documents and their gold answers. The scans are committed JPEGs; `bun tracks/docs/render-scans.ts` re-renders them from `fixtures/offer-scan.ts` with headless Chromium (overview at 0.6×, halves at 1×, both orientations, both languages).
- `docs.test.ts` covers the contract (both languages, the reference grades 1, an empty answer grades 0), the gold derivations (prices, flux, deadlines), the tools (windows, pages, images), and the graders' penalties for typical mistakes.

## Results

`bun src/cli.ts --models openai/gpt-6.1-terra:medium,google/gemini-4-hydrogen:medium --tracks docs --samples 1` (one sample per task, both languages):

| Model | Score | Time per task | Cost per task |
| --- | ---: | ---: | ---: |
| openai/gpt-6.1-terra:medium | 100.0 | 38.9 s | $0.031 |
| google/gemini-4-hydrogen:medium | 100.0 | 70.3 s | $0.10 |

Both models scored 100 on every task in both languages. They read every page or window, zoomed and turned the scans, applied the precedence rules, counted working days over Easter, and computed the corrected net totals exactly. The track separates the two models only on time and cost. Whether it separates weaker or less careful models has not been measured.
