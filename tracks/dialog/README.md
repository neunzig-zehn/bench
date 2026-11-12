# Dialog track

Measures how a model works with the person who asked: whether it asks the colleague the questions it
needs, avoids the ones the documents already answer, notices contradictions between documents, and
flags what nobody can supply instead of inventing it.

Every task is a request from a colleague at an electrical contractor about a German tender. The
documents (LV, Baubeschreibung, plan notes, emails, our Kalkulationsgrundlagen) sit behind
`list_documents`, `read_document` (one page), and `search_documents` (up to 8 lines); purchase prices
and labour times behind `search_articles` (up to 8 articles). All makes, prices, and projects are
synthetic, and every result is computed from the fixtures by the same rules the documents state.
Each task exists as `-de` and `-en` with the same data, numbers, and grader; documents, tool
descriptions, tool outputs, and the colleague's replies are in the task's language.

## The simulated colleague

`ask_user` is backed by a deterministic colleague (`dialog.ts`). Each task defines:

- **Facts** the colleague knows, each with bilingual keyword patterns. A question matching a fact
  gets that fact's answer (several facts in one question get several answers). Required facts are
  those the right result depends on; some facts are optional (asking is fine, not asking is fine).
- **Documented topics**: a question that matches no fact but asks about one of these gets "That is in
  the documents." / "Das steht in den Unterlagen." and counts as redundant. Only the sentences that
  ask (those with a question mark) are checked, so context quoted before a question does not count.
- Anything else gets "I don't know." / "Weiß ich nicht."

Patterns run on lowercased text with umlauts spelled out (`ä` → `ae`), and German and English
patterns apply in both variants, so a model asking in the other language is still understood.

## Grading

`gradeDialog` adds the same dialog checks to every task, then the task's own result checks:

| Check | Weight | Score |
| --- | ---: | --- |
| `asked: <fact>` | 1 each | the required fact was asked |
| `no redundant questions` | 1 | 1 − 0.5 per redundant question |
| `asked nothing` (fully specified task only, replaces the line above) | 2 | 1 − 0.5 per question |
| `flagged: <issue>` | 1 each | one submitted issue matches the flag's patterns |
| `no spurious issues` | 1 | 1 − 0.25 per issue that matches no flag and no tolerated pattern (0.5 when the task has no flags); 0 without an answer |
| result checks | 2–4 | exact to the cent or hour, see below |

The `issues` list follows the system prompt: every contradiction between documents (also when the
colleague settled it) and every piece of information nobody could supply; gaps the colleague filled
and points the documents settle stay out. Metrics: questions, redundant and unanswered questions,
flags found, spurious issues.

## Tasks

### `dialog-wallbox-unit-price` (moderate)

Unit price of a wallbox item whose make is left blank for the bidder and whose supply cable length
the plan does not dimension. The model must ask for both. The colleague's answer on the make points
to an old offer from construction phase 1 (Hagenau eCharge 11), whose 2025 unit price and 18 m
cable must not be reused; the measured length is 22 m. Mounting height, mounting type, power,
cross-section, load management, protection, and quantity are documented, so asking about them is
redundant. Traps: a 22 kW variant of another make, a pedestal, cable prices per 100 m. Result: unit
price 1,246.28 EUR (weight 4); no issues expected.

### `dialog-lighting-contradictions` (hard)

Section total of a lighting LV across documents that disagree. Required questions: 10 downlights in
the LV vs 12 in the newer lighting plan (the colleague says 12), NYM cable in a required corridor vs
the Baubeschreibung's halogen-free rule (the colleague says NHXMH-J). Flags: those two, the
deadline (Baubeschreibung 15 May vs a later email 30 Apr; the colleague does not know), and item
03.02 naming a panel make that lacks the UGR < 19 the same item demands. Unprompted domain
inference: the foyer downlights sit in a two-storey void, so the +25 % height surcharge applies.
Decoys: neutral white = 4000 K, 4 × 2 panels = 8, a contingency item excluded from the total.
Result: section total 5,969.16 EUR (weight 4).

### `dialog-feeder-unknown-length` (moderate)

The client wants a fixed price for outdoor works, but the underground cable to the barn is billed as
measured and its route waits on the heritage authority: nobody, not even the colleague, knows its
length, and the site plan's 40 m is a straight line. The model must ask the bollard colour chosen at
the sampling (anthracite), price everything else, leave the cable out, and flag it. Results: total
4,816.82 EUR (weight 4) and no invented length (weight 2: the total holds less than 20 m of that
cable).

### `dialog-sockets-fully-specified` (moderate)

Total price of a socket item whose parameters are spread over the LV long text (cable length), the
Baubeschreibung (series and colour), and the installation plan (mounting height). Nothing needs
asking or flagging: every question costs 0.5 of a weight-2 check, every issue 0.5 of the spurious
check. Traps that look like gaps but are settled: conduit (included in the cable price by the
Kalkulationsgrundlagen), RAL 7035 in the plan (= the Baubeschreibung's light grey), a held-back item
in an email; plus colour and IP variants and cables per 100 m. Result: 1,585.78 EUR (weight 4).

### `dialog-schedule-decision` (hard)

Can two fitters finish a floor by the deadline? Installation hours come from LV quantities and
catalog times with the height surcharge for the 3.40 m open-plan office. Required questions: the
crew size (only the colleague knows: two), which deadline applies (Baubeschreibung 30 Apr vs newer
Bauzeitenplan 16 Apr; the colleague says 16 Apr), and the downlight count (LV 36 vs the floor plan's
room counts 14 + 3 × 6 = 32, which nothing points out; the colleague says 32). Flags: those two
contradictions and lay-in panels in the LV for an office with no grid ceiling. 518 hours → 33
working days needed; 32 available between 1 Mar and 16 Apr 2027 with Berlin's holidays (Women's Day,
Good Friday, Easter Monday), so the answer is no. Skipping the height surcharge (32 days) or the
holidays turns it into a wrong yes. Results: hours (weight 2), working days (weight 2), decision
(weight 3).

## Files

- `dialog.ts`: document and catalog tools, the simulated colleague, the shared grader, the system
  prompt.
- `fixtures/catalog.ts`: the article catalog and the Kalkulationsgrundlagen shared by all tasks.
- `fixtures/<task>.ts`: each task's documents, every line in German and English.
- `<task>.ts`: the task factory `(lang) => Task` with its facts, documented topics, flags, and result.
- `dialog.test.ts`: hand-checked results, document parity, question and flag matching in both
  languages (including phrasings taken from live transcripts), and grader behaviour.

## Known limitations

- Keyword matching is lenient by design: a question that touches a fact's words gets the answer even
  if it was phrased about something adjacent, and a question that matches a fact is never counted as
  redundant, so a compound question mixing a real and a redundant ask goes unpenalised.
- Flags match per issue text; an issue that names the right object and a hint of the problem counts
  even if its reasoning is thin. Tolerated patterns (schedule outcomes, trench by the client, heritage
  notes, contingency items) are neither credited nor penalised.
- The result checks are exact; a run that asks and flags perfectly but slips on arithmetic loses the
  result weight entirely.
