# Calc track

Deterministic construction maths: fill ratios, loads, quantities and sums. Every task has one exact answer, known by construction from synthetic fixtures, and is graded without a judge at the precision the task states.

Each task exists as `-de` and `-en`: the same data, the same reference answer and the same grader, with prompts, tool descriptions, tool output keys and texts, and documents translated. Numbers, units, ids and cable types are identical; documents use the language's decimal separator.

## Shared setup

- **Data behind tools.** The prompt names the job only. Lists come page by page, catalogs through search, documents through read tools, so a run takes several model calls.
- **`calculate`.** Every task has the same calculator, since production agents can run code: numbers with a decimal point, `+ - * /` (also `× ÷`), parentheses, `^`/`**`, `sqrt`, `abs`, `min`, `max`, `floor`, `ceil`, `round(x, digits)` half away from zero, and `pi`. It is a small recursive-descent parser (`calculator.ts`), never `eval`.
- **Exact grading.** A number passes when it equals the reference at the stated precision (within half a unit of the last stated digit). Strings with German or English decimals are read too. Every reference value sits at least 0.1 of a last-digit unit away from a rounding boundary (tested), so a correct method never fails on rounding.

## Tasks

### `calc-paint-takeoff` – wall paint take-off (moderate)

Paintable wall area of six office rooms from room data, an opening schedule and explicit measurement rules (DIN 18363 style).

- **Traps:** suspended ceilings lower the wall height; the 2.5 m² deduction threshold with a French window just above it (2.565 m²) and a ribbon window exactly at it (2.50 m², measured over); reveals only for deducted openings that have a reveal depth (doors with wrap-around frames have none); a 1.44 m² tiled splashback that is deducted regardless of size; openings occurring several times.
- **Grading:** each room's area to 0.01 m² (weight 1 each), the total to 0.01 m² (weight 2).

### `calc-cable-tray` – cable tray fill ratios (moderate to hard)

Size the power trays of three routes: per route the narrowest permitted tray whose fill ratio including the reserve stays at or below 40 %, at equal width the lower side height.

- **Tools:** paged cable list (34 cables, 8 per page), cable catalog search (outer diameters), tray catalog, design rules.
- **Traps:** telecom cables (fire alarm, data, public address) and E30 cables share the routes but not the power tray; cancelled cables; existing cables that remain (count) or are removed (do not); parallel counts; a revision note that changes one cable's type; 30 % reserve, but 50 % on the main route KR-1; inner width × usable fill height instead of nominal dimensions; KR-2 permits only 60 mm side height; KR-3 has a width limit (not binding). Including telecom cables, dropping the reserve, the wrong reserve on KR-1, ignoring parallel counts, allowing 85 mm on KR-2 or dropping the remaining existing cables on KR-3 each picks a different tray (tested).
- **Grading per route:** cable count (1), cross-section sum to whole mm² (2), tray designation (3), fill ratio to 0.1 % (2).

### `calc-feeder-sizing` – feeder: demand, current, fuse, cross-section (hard)

Size the feeder to a canteen kitchen sub-distribution.

- **Method (stated):** loads in kW (W converted, kVA × the consumer's cos φ); group sums × simultaneity factors, for cooking by number of appliances; I_B = P/(√3·U·cosφ); smallest standard fuse I_n ≥ I_B; smallest NYY-J section with I_n ≤ I_r·f_temp·f_group in every route section and voltage drop Δu = √3·I_B·L·cosφ/(κ·A·U) ≤ 1.5 %.
- **Traps:** a load in W and two in kVA with their own cos φ; the cooking factor counts appliances (quantities), not rows, and not the three spare circuits (which would change the band); a cancelled consumer and spare circuits; the route lists the *other* cables per section while the rule counts the feeder itself, and 5 cables is not in the grouping table (next larger count applies); the hotter, more crowded section governs; ampacity alone gives 120 mm², the voltage drop forces 150 mm².
- **Grading:** demand to 0.01 kW (2), I_B to 0.1 A (2), fuse (2), cross-section (3), voltage drop to 0.01 % (2).

### `calc-heating-load` – room heat loads of a flat (hard)

Seven room heat loads Φ = Σ U·A·Δθ + 0.34·n·V·Δθ with a stated simplified method, and their sum.

- **Tools:** paged room list, per-room components (walls with gross dimensions, windows and doors with the wall they sit in, floor, ceiling, adjacent space), U-value catalog, method document.
- **Traps:** gross wall areas with openings to deduct; the bathroom at 24 °C and the hall at 18 °C, so internal walls count and the hall has heat gains (negative contributions); other units (upper and neighbouring flat) at 15 °C, so every ceiling and party wall counts; unheated cellar (+6 °C) and stairwell (+10 °C); a thermal-bridge surcharge on external components only; adjacent rooms given by id, so their temperature comes from their room type; air change by room type, but the extract fan's flow governs in bathroom and WC; lower clear heights in bathroom and WC.
- **Grading:** each room to the watt (1 each), total (3).

### `calc-offer-total` – offer total (hard)

Offer total of a 123-item sanitary tender, ported from the 90/10 totals eval (`packages/evals/bench/totals.eval.ts`) and made multi-step: the LV comes 15 items per page; the preliminary notes (4 pages), the answers to bidder questions and the cover letter come through a document tool.

- **Traps:** contingency, alternative and "without total" items, also under their synonyms (provisional item, alternative to, unit price only); title 03 consists of contingency items without being marked, and amendment 2 reinstates 03.02; amendments listed newest first (01.04 replaced by 01.05; 02.04 deleted; 01.03's quantity changed twice, the later amendment wins at 72.5 m); bidder answers that reinstate a provisional item and change 02.01's quantity; daywork stays in the total although it is not evaluated; the 4 % discount applies above a threshold that sits less than EUR 5,000 below the true net total and only to titles 01 and 02; a lump-sum discount; distractors (site utilities at 0.4 %, cash discount).
- **Grading:** 19 decided items counted or excluded (1 each), no other item excluded (1), the two amended quantities (2 each), no other quantity change claimed (1), net before discount, percentage discount, net after discount and gross to the cent (3 each), lump-sum discount and VAT to the cent (1 each).

### `calc-pipe-cutting` – cutting plan, fewest pipe bars (hard)

Pack the pieces of an isometric cut list into the fewest 6 m bars per diameter (DN 15: 32 pieces, DN 22: 26 pieces), each piece using its length plus a 4 mm cutting allowance.

- **Construction:** a seeded generator fills each bar to within 45 mm, so the total offcut per diameter is far below one bar: the constructed bar count equals the lower bound ⌈Σ(length + 4) / 6000⌉ and is optimal. First-fit decreasing needs one bar more per diameter (tested), so the task needs real search, not a greedy pass.
- **Traps:** riser ST-5 is cancelled in the riser list while its pieces stay in the cut list; the allowance on every piece; keeping the diameters apart.
- **Grading per diameter:** a valid plan (every live piece exactly once, no bar over 6000 mm; weight 2) and the optimal bar count with that valid plan (3); the total bar count (1). Any valid optimal plan scores, not only the reference.

## Files

- `index.ts` exports `TASKS`; one file per task (`<task>.ts`) holds its tools, translations and grader.
- `fixtures/<task>.ts` holds the data, the documents in both languages and the ground-truth solver.
- `calculator.ts` is the expression evaluator, `shared.ts` the calculate tool and helpers.
- `calc.test.ts` tests the calculator, rounding margins, that every trap changes the answer, the graders, and the tools.
