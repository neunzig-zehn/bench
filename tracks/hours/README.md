# Hours

Labour hours per LV Item, measured as the deviation from the hours the crew actually books.

Each task is a synthetic contractor with a hidden, deterministic labour model. The model reads the
new LV (short and long texts), the site description, the company's time catalog (standard minutes
per unit and its general conditions), and completed projects with the hours actually booked per
Item. It submits hours per Item and the total. Nothing is in the prompt; a run takes a dozen or more
tool calls in at least three model calls.

## How the data is built

- **Catalog and rules.** Standard minutes per catalog unit (some per 100 m) and general conditions:
  what the times cover, published factors such as working height or a quantity scale, and what is
  left to the company's experience.
- **Hidden model.** The true hours of an Item are a function of its catalog lines and conditions:
  standard minutes × published factors × the company's own factors (old building, occupied rooms,
  crew speed), plus a set-up time where the task has one. The new LV's actual hours come from this
  model without noise, rounded to 0.01 h.
- **History.** Completed projects are generated from the same model with seeded scatter of up to
  ±6 % per Item, rounded to 0.1 h. The scatter is shifted to a zero hours-weighted mean within each
  project and, where a task has groups that behave differently, within each group, so a careful
  estimator recovers every hidden factor or set-up time exactly from the bookings. Each historic
  row names the catalog entries used and its conditions (height, building, occupancy).
- **Languages.** Every task exists as `-de` and `-en` with the same data and grader; documents,
  catalog texts, tool descriptions and outputs are translated, numbers, units and codes are the same
  (German `St`, English `pc`).

## Tools

`list_items` (10 per page), `get_item`, `read_site_description` (table of contents, then one
section), `read_catalog_rules`, `search_catalog` (words or code prefix, 8 hits), `get_catalog_entry`,
`list_projects`, `get_project` (10 rows per page with booked hours). All are read-only; the answer
is the `submit` call.

## Grading

Each Item scores `deviationScore(estimate, actual, 1.5)`: 1 − |ln(estimate / actual)| / ln 1.5, at
least 0. The total hours are one more check with weight 5 beside weight 1 per Item.

| Deviation | +5 % | −5 % | +10 % | −10 % | +20 % | −20 % | +50 % | −33 % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Score | 0.88 | 0.87 | 0.76 | 0.74 | 0.55 | 0.45 | 0 | 0 |

Item ids match without leading zeros (`1.2` = `01.02`) and hours may be strings with a German
decimal comma. Metrics: `itemDeviationPct` (mean absolute deviation over Items, capped at 100 %),
`itemsWithin10Pct` (share of Items within ±10 %), `totalDeviationPct`. The reference answer
scores 1; no answer scores 0.

## Tasks

| Task | Trade | Items | Difficulty |
| --- | --- | ---: | --- |
| `hours-electrical-new-build` | Electrical | 20 | moderate |
| `hours-plumbing-old-building` | Plumbing | 18 | moderate to hard |
| `hours-heating-small-quantities` | Heating | 17 | hard |
| `hours-drywall-rules` | Drywall | 15 | hard |
| `hours-ventilation-duct-surface` | Ventilation | 17 | moderate |
| `hours-electrical-occupied-renovation` | Electrical | 23 | moderate to hard |

### Electrical, new build

New office wing and warehouse; the catalog fits this company (history books 1.00 × catalog), so
the task measures careful reading. Traps: cable times per 100 m; the catalog's height bands applied
from the site description (hall roof 6.50 m ×1.40, foyer ceiling 4.60 m ×1.20), while hall sockets,
exit signs and the sub-board sit low; the box and chase entry chosen by wall material (masonry outer
walls, concrete stair core, drywall partitions); testing as its own entry.

### Plumbing, old building

Riser renovation of a vacant 1908 building. The catalog is for new builds and leaves old-building
surcharges to experience. In the history, vacant old buildings book 1.40 × catalog for removals and
ceiling openings, 1.15 for pipework and insulation, 1.00 for fixtures and tests; new builds 1.00
throughout; an occupied old building books 1.55 / 1.30 / 1.20. Traps: a blanket factor (scores about
0.78), calibrating on the occupied project, composite Items mixing groups (WC frame plus ceramic,
bathtub out plus shower tray in), ceiling openings by slab (timber-joist floors, jack-arch cellar
ceiling, not concrete).

### Heating, small quantities

Repairs with mostly 1–3 pieces per Item. Catalog times are for series work and exclude set-up; the
history shows a fixed time per LV Item on top of the catalog, 45 min for Items with a water-side
entry and 20 min for dry ones (the catalog marks water-side entries and says they take longer to set
up; the site description says each Item is its own work order). Traps: catalog-only estimates are
30–60 % low on small Items (scores below 0.6), set-up per piece overshoots large Items, one pooled
set-up time misses both kinds (scores about 0.75–0.85), valve plus head is water-side as a whole, an
exchange is removal plus mounting, heads only differ from valve plus head.

### Drywall with rules

New school. The catalog publishes height factors (×1.15 above 3.25 m, ×1.35 above 5 m) and a quantity
scale per Item (×1.30 under 20, ×1.10 under 100, ×0.92 from 500 catalog units, none for pieces).
Recomputed with those rules, the history shows the crew books 0.90 × catalog, and above 5 m, where
the company works from its own aerial platform, a height factor of 1.20 instead of the published
1.35. Traps: 3.20 m walls stay at ×1.00; the scale applies to the catalog quantity; soffits and
bulkheads are billed in metres but timed per m² of developed surface; the crew factor only shows
once the rules are applied; trusting the published factor above 5 m.

### Ventilation, duct surface

New laboratory building. Rectangular ducts come in metres with their cross-section; the catalog
times them per m² of sheet surface by size class of the larger side. Traps: perimeter × length; the
class boundaries (500 and 1000 mm stay in the lower class); fittings per piece with an average
developed surface; insulation in metres timed per m²; fire dampers by cross-section area (0.24 m²
is the small class); heights (plant room 4.60 m ×1.25, atrium 6.80 m ×1.50). History books 1.00.

### Electrical, occupied renovation

1968 administration building: east wing vacant, west wing, stairwell and entrance hall in use. The
history covers all four combinations of new or existing and vacant or occupied (1.00, 1.20, 1.25,
1.50 × catalog), so two multiplying factors must be inferred. Traps: the wing of an Item only via
room names and the site description; quantities the long text splits across wings; circuits per
wing only in the site description; composite Items (two boxes plus two sockets per piece); concrete
corridor and stairwell walls; the entrance hall at 4.80 m with the height factor on top.

## Known limits

- The hidden models are clean products of factors and fixed set-up times; real bookings have
  learning curves, crew mix and weather that no estimator could recover from the data.
- Balanced scatter makes every factor exactly recoverable, so a perfect run is possible; the
  difficulty is finding, separating and applying the factors, not statistics.
- One shared tool set across tasks; tasks differ in data, not in tool mechanics.
