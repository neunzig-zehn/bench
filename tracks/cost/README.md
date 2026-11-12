# Cost track

Unit prices and total cost estimation. Every task asks for prices that follow from its documents by
construction, so the score is the deviation from the actual cost. Each task runs in German and in
English with the same data and the same grader; only the language of prompts, tool descriptions,
tool outputs, and documents changes (numbers, units, and identifiers stay the same).

## Grading

All prices are graded with one curve (`costScore` in [shared.ts](shared.ts)): 1 within rounding (a
cent, or 0.05 % of the value), then falling with the log ratio of estimate to actual, to 0 at a
task-specific factor. The factor is steep where the documents fix the price exactly (5 % for offer
prices, 15–20 % for computed ones), because an estimator would call a few percent off a miss. Every
task reports the mean unit-price deviation in percent and the total (or amount) deviation as
metrics.

Every task has a calculator tool, as an estimator has a spreadsheet, so the score measures reading,
matching, and method rather than mental arithmetic.

## Tasks

| Task | Measures | Graded on |
| --- | --- | --- |
| `cost-supplier-offer-unit-prices` | Pricing 63 LV Items from a 107-line supplier offer | Each Item's written unit price (0 at 5 % off), unpriced Items marked unpriced, net material total (weight 5) |
| `cost-unit-price-build-up` | Costing a 13-Item drywall LV over the offer total from the company's costing scheme | Average wage, labour surcharge, each unit price (0 at 20 % off), offer total (weight 3) |
| `cost-historic-price-estimate` | Estimating an 11-Item LV from 134 historic awarded prices with index and regional factors | Each unit price (0 at 15 % off), total (weight 3) |
| `cost-change-order-pricing` | Pricing seven change orders from the deposited original calculation under VOB/B clauses | Each change order's unit price and amount (0 at 20 % off) |

### Unit prices from a supplier offer

The model searches and reads the offer of a plumbing merchant and writes a unit price per LV unit
for every Item, or marks it unpriced; then it submits the net material total.

Traps: prices per 100 pieces, bars, coils, packs, and cartons that must be converted to the LV unit;
a line discount and a group discount for sanitary ceramics (but not on the installation lines); a
metal surcharge per metre of copper pipe; a printed erratum in the conditions; tier prices that
apply to the total of an article over all Items; an expired promotional price; a discontinued
article and its replacement; consumption rates (kg/m², l/m²); synonyms between LV and offer; "or
equivalent" Items, where either the named make or the declared equivalent is right; and Items
nothing in the offer fits.

### Unit prices by costing over the offer total

The model prices a drywall LV by the company's costing guideline, the method of the German EFB
sheets (Kalkulation über die Angebotssumme): direct costs per Item, site overhead as an amount,
general overhead and risk and profit as shares of the offer total, the rest spread over labour.

Traps: the average wage includes the supervisor's share but not the apprentice, and on-costs are not
charged on the travel allowance; labour hours and material needs are composed per Item from
work-step norms (board layers, boarded sides, insulation thickness, Q2 or Q3 per side); a 20 %
height surcharge applies to the foyer ceiling and to a foyer wall whose height is only given by
cross-reference; norms per 100 m and in minutes; pack and per-1,000 price units; tier prices that
apply only by the total need of all base Items (the insulation tier is reached only with the foyer
wall); a 12 % discount that skips insulation; a near-miss board size; a subcontract discount; site
overhead that needs the construction period from the LV notes; general overhead and risk and profit
"of the offer total" (computed on the offer total, not on cost); daywork as a labour Item; and a
provisional Item that gets a unit price but stays out of every sum.

### Cost estimate from historic unit prices

The model searches a price database of awarded unit prices and normalizes them by a written
guideline: net prices, a quarterly construction price index per trade group, and regional factors;
the unit price is the median after removing outliers.

Traps: near-miss specifications under the same search words (thickness, strength class, bed, wet
abrasion class) and the same work in another unit; awards before the cutoff, and records exactly on
the date and quantity bounds (bounds included); quantities outside the 50–200 % band; gross prices;
change-order prices; notes that add or remove scope; annual averages next to the quarterly index
values; the index series of the right trade group; regional factors in the right direction; two
Items of the same work whose quantity bands admit different records; outliers more than 20 % from
the first median; and the median of an even count. The records are generated from a seed around
each Item's true price, so the guideline's estimate is known by construction.

### Change order prices from the original calculation

The model prices seven change orders on a tiling contract (VOB/B) from the deposited original
calculation (Urkalkulation), the contract's clauses, the client's instructions, a room-by-room
measurement sheet, a supplier offer, and a newer wage sheet.

Traps: a 3 % contract discount, in a different clause, that also applies to change order prices
(round, discount, round again); a newer wage sheet that the contract excludes; the right tile among
near misses and a discount on tiles only; format-specific labour norms, waste, and consumption; the
original calculation's adhesive price rather than the new offer's; quantities summed from the
measurement with openings deducted only above 1 m² (1 m² itself is measured over); the measured
area, not the tendered quantity, for the changed and added work; site overhead dropped only for
the quantity above 110 %; site and general overhead of the shortfall spread over the executed
quantity below 90 %; quantity changes exactly at 110 % and 90 % that earn no new price; and signed
amounts.

## Files

- [index.ts](index.ts) exports `TASKS`, each task built by a `(lang) => Task` factory.
- One file per task, with its data in [fixtures/](fixtures): `supplier-offer`, `unit-price-build-up`,
  `historic-prices`, `change-order`.
- [shared.ts](shared.ts): bilingual text, number formatting, the calculator and document tools, and
  `costScore`.
- [cost.test.ts](cost.test.ts): hand-computed gold values, grader behaviour, both languages carrying
  the same data, English free of German, and an independent recomputation of the historic estimate
  from the rendered records and documents.
