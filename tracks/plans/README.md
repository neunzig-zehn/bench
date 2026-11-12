# Plans track

Reading technical drawings. Every task works on one synthetic project, the conversion of an office
building at Lindenstraße 12, drawn as SVG and rendered to PNG on request. The model never sees the
whole drawing at full resolution: it lists the sheets, reads a sheet's title block, notes, and
legend, and views a sheet or a zone of its frame grid (`B2:D4`) at a chosen zoom, as an estimator
pans and zooms in a PDF viewer. Each view stays at or below about 1600 px on its long side, so
fine lettering is legible only when zoomed in. Every task runs in German and in English with the
same building, the same grader, and the same ground truth; only the language of the lettering,
legends, notes, prompts, and tool texts changes. German drawings use German dimension notation
(`8,55⁵` for 8.555 m).

The building is generated from one model in [building.ts](building.ts): floors UG, EG, and OG with
rooms, openings, electrical devices, cable trays, heating and water pipes, risers, and an axis grid.
The ground truth is computed from that model, so every answer is known by construction. No data is
copied from real projects.

## Sheets

| Sheet | Content |
| --- | --- |
| A-100 | Basement, old survey plan inserted as a 96 % copy, overall dimensions only |
| A-101 | Ground floor plan 1:50, clear room dimensions, room stamps, openings |
| A-301 | Sections with floor levels, slab and suspended-ceiling heights |
| E-101 | Ground floor electrical plan: devices, wiring, new and existing cable trays |
| E-102 | Upper floor electrical plan |
| H-101 | Basement heating and water distribution with axis grid |
| H-501 | Heating riser diagram (levels only) |

Tools: `list_sheets`, `get_sheet_info`, `get_legend`, `view(sheet, region?, zoom?)`, and
`get_lv` in the combined takeoff. Code: drawing primitives in [drawing.ts](drawing.ts), plan
rendering in [floorplan.ts](floorplan.ts), sheets in [sheets.ts](sheets.ts), tools and shared grading
curves in [tools.ts](tools.ts).

## Grading

Two curves, both in [tools.ts](tools.ts). Lengths and areas use `takeoffScore`: 1 within 2 %
deviation, falling linearly to 0 at 25 %. A careful estimator measures within a few percent; a
missed segment, a wrong height, or the wrong scale costs more. Counts use `countScore`: 1 when exact,
losing 1 / max(2, 25 % of the true count) per piece missed or extra. Each task reports a deviation or
error metric next to its checks.

## Tasks

| Task | Measures | Graded on |
| --- | --- | --- |
| `plans-symbol-count` | Counting new devices per room by legend code on the upper floor electrical plan | Each room's counts (`countScore` over the room's devices) |
| `plans-room-areas` | Net floor areas from clear dimensions and wall areas from plan and sections | Each room's area, each wall area (weight 2) |
| `plans-cable-tray` | Tray lengths per size and fittings on the ground floor electrical plan | Length per size (weight 2), exact tee and bend counts |
| `plans-pipe-runs` | Heating pipe lengths per DN across the basement plan and the riser diagram | Length per DN |
| `plans-survey-areas` | Areas measured on an undimensioned, not-to-scale survey copy | Each room's area |
| `plans-combined-takeoff` | Quantities for a 7-Item electrical LV over two floors | Each count, each tray length (weight 2) |

### Symbol count

The model counts the new devices of every OG room by legend code and submits counts per room.

Traps: look-alike symbols (single and double socket, one-way and two-way switch, ceiling and
emergency light, smoke alarm and motion detector), existing devices in grey that do not count,
multipliers such as `3×` beside a symbol, wiring that crosses symbols, the ground floor sheet with
the same legend, and lettering legible only when zoomed in.

### Room areas

Net floor area of every EG room from the clear dimensions on A-101, and the paintable wall area of
six rooms.

Traps: half-centimetre superscripts, an L-shaped room with a store cut out of it, wall heights that
come only from the sections (a suspended ceiling at 2,55 below a 2,80 slab), and the 2.5 m² opening
rule (smaller openings are measured over, larger ones deducted, on both sides of a wall), including a
corridor whose entrance door is just over the limit.

### Cable tray

Tray length per size (KT 300, KT 200) and the number of tees and horizontal 90° bends on E-101.

Traps: trays are dimensioned only from the axis grid, so lengths are differences of axis positions;
the main run changes size at two tees; an existing tray in grey; a run whose underlined dimension
is not drawn to scale; a vertical riser that does not count; dimensions spread over the whole sheet.

### Pipe runs

Heating pipe length (supply plus return) per DN, from the basement distribution on H-101 and the
risers on H-501.

Traps: supply and return share one dimension and both count; drinking-water lines on the same sheet
with their own DN; DN changes at tees and reducers; an underlined dimension not drawn to scale; riser
lengths from signed levels (−0,45 to +3,60); a short boiler connection in DN 50.

### Survey areas

Net floor areas of the nine basement rooms on A-100, an old survey plan with only the overall
dimensions. The plan is inserted as a reduced, slightly rotated copy (96 %, 0.6°) and the notes say so.

Traps: scaling at the nominal 1:100 is 4 % off in length and about 8 % in area, so the model has to
calibrate on the overall dimensions or the copied scale bar (the axis grid on H-101 also works);
partitions do not line up with the floors above; walls are thin at 1:100.

### Combined takeoff

Quantities for a small electrical LV: five device positions over EG and OG and two tray positions,
one including the riser between the floors.

Traps: everything in the symbol and tray tasks, on two sheets; the LV note that existing
installations are not billed; the riser measured from tray underside to tray underside, which needs
both plans' tray heights and the upper floor level from the sections.
