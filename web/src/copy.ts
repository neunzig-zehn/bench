import type { Lang, Track } from "./data";

export const REPO = "https://github.com/neunzig-zehn/bench";
export const SITE = "https://bench.9010.berlin";

const en = {
  locale: "en-GB",
  path: "/",
  title: "The Last 10",
  description: "A multi-step construction-estimating benchmark for language models, by 90/10.",
  kicker: "A benchmark for language models in construction estimating",
  lead: "90% of estimating is routine. The last 10% decide whether an offer wins and earns money. This benchmark measures how well language models handle them.",
  routine: "Routine",
  last: "The last 10%",
  run: (version: string | undefined, date: string | undefined, tasks: number, samples: number) =>
    [version && `Version ${version}`, date && `Run of ${date}`, `${tasks} tasks`, `${samples} ${samples === 1 ? "sample" : "samples"} per task`].filter(Boolean).join(" · "),
  sample: "Sample data. These numbers are made up to preview the page; real results follow.",
  repo: "GitHub",
  switchTo: { label: "Deutsch", short: "DE", to: "/de" },
  nav: { leaderboard: "Leaderboard", levels: "Reasoning levels", tracks: "Tracks", langs: "By language", method: "Method" },
  leaderboardIntro:
    "Score runs from 0 to 100, the mean over the six tracks. Reasoning is the effort setting the provider offers (low, medium, high). Time and cost are per task, one full multi-step run. Select a column to sort.",
  col: { rank: "#", model: "Model", effort: "Reasoning", score: "Score", seconds: "Time per task", costUsd: "Cost per task", steps: "Steps", cacheHit: "Cache hits" },
  colShort: { effort: "Reasoning", score: "Score", seconds: "Time", costUsd: "Cost", steps: "Steps", cacheHit: "Cache" },
  levelsIntro: "Each chart shows one model's reasoning levels: score against cost per task, on a log scale. The table below it adds the time.",
  costAxis: "Cost per task",
  tracksIntro: "Six tracks, each a part of estimating. Select one to see its results.",
  metric: "Metric",
  tracks: {
    docs: { name: "Docs", text: "Parsing tenders, bills of quantities, specs, and data sheets.", metric: "Extracted fields vs. ground truth." },
    plans: { name: "Plans", text: "Reading drawings: routes, dimensions, symbols, and quantities.", metric: "Takeoff vs. a verified measurement." },
    calc: { name: "Calc", text: "Deterministic math: fill ratio, loads, quantities, and sums.", metric: "Exact answer." },
    hours: { name: "Hours", text: "Estimating labor time per item.", metric: "Deviation from actual hours." },
    cost: { name: "Cost", text: "Estimating unit prices and total cost.", metric: "Deviation from actual cost." },
    dialog: { name: "Dialog", text: "Working with the user: asking clarifying questions, flagging missing information.", metric: "Questions asked and issues flagged vs. the task's hidden facts." },
  } satisfies Record<Track, { name: string; text: string; metric: string }>,
  langsIntro: "Every task runs in German and in English, with the same data, prompts, and grading.",
  langCol: { de: "German", en: "English", diff: "Difference" },
  method: [
    "Multi-step: every task starts from a short brief. The model reaches the data only through tools and ends by submitting an answer.",
    "Synthetic ground truth: the tasks are generated, so the correct answer is known by construction.",
    "Scores are means over tasks, and every task weighs the same. The overall score is the mean over the tracks.",
    "Cost is what OpenRouter billed, including cache reads and writes.",
    "Time is the wall time of one full task, from the first model call to the answer.",
  ],
  facts: { date: "Run date", tasks: "Tasks", samples: "Samples per task", models: "Models and reasoning levels" },
  repoLink: "Tasks, graders and raw results on GitHub",
  footer: "90/10 turns GAEB, PDF, and Excel tenders into reviewable draft offers with products, prices, and labor times.",
  madeBy: "The Last 10 is made by",
};

export type Copy = typeof en;

const de: Copy = {
  locale: "de-DE",
  path: "/de",
  title: "Die Letzten 10",
  description: "Ein mehrstufiger Benchmark für Sprachmodelle in der Baukalkulation, von 90/10.",
  kicker: "Ein Benchmark für Sprachmodelle in der Baukalkulation",
  lead: "90\u202f% der Kalkulation sind Routine. Die letzten 10\u202f% entscheiden, ob ein Angebot den Zuschlag erhält und sich rechnet. Dieser Benchmark misst, wie gut Sprachmodelle diese letzten 10\u202f% beherrschen.",
  routine: "Routine",
  last: "Die letzten 10\u202f%",
  run: (version, date, tasks, samples) =>
    [version && `Version ${version}`, date && `Lauf vom ${date}`, `${tasks} Aufgaben`, `${samples} ${samples === 1 ? "Durchlauf" : "Durchläufe"} je Aufgabe`].filter(Boolean).join(" · "),
  sample: "Beispieldaten. Diese Zahlen sind erfunden und dienen nur der Vorschau; echte Ergebnisse folgen.",
  repo: "GitHub",
  switchTo: { label: "English", short: "EN", to: "/" },
  nav: { leaderboard: "Rangliste", levels: "Reasoning-Stufen", tracks: "Disziplinen", langs: "Nach Sprache", method: "Methode" },
  leaderboardIntro:
    "Der Score reicht von 0 bis 100 und ist das Mittel über die sechs Disziplinen. Die Reasoning-Stufe ist die Einstellung des Anbieters (low, medium, high); wir übernehmen seine Bezeichnungen. Zeit und Kosten gelten je Aufgabe, also für einen vollständigen Lauf über mehrere Schritte. Wählen Sie eine Spalte, um zu sortieren.",
  col: { rank: "#", model: "Modell", effort: "Reasoning-Stufe", score: "Score", seconds: "Zeit je Aufgabe", costUsd: "Kosten je Aufgabe", steps: "Schritte", cacheHit: "Cache-Treffer" },
  colShort: { effort: "Stufe", score: "Score", seconds: "Zeit", costUsd: "Kosten", steps: "Schritte", cacheHit: "Cache" },
  levelsIntro: "Jedes Diagramm zeigt die Reasoning-Stufen eines Modells: Score gegen Kosten je Aufgabe, auf logarithmischer Skala. Die Tabelle darunter ergänzt die Zeit.",
  costAxis: "Kosten je Aufgabe",
  tracksIntro: "Sechs Disziplinen, jede ein Teil der Kalkulation. Wählen Sie eine aus, um ihre Ergebnisse zu sehen.",
  metric: "Messgröße",
  tracks: {
    docs: { name: "Dokumente", text: "Ausschreibungen, Leistungsverzeichnisse (LV), Baubeschreibungen und Datenblätter auslesen.", metric: "Ausgelesene Felder im Vergleich zur Referenz." },
    plans: { name: "Pläne", text: "Zeichnungen lesen: Trassen, Maße, Symbole und Mengen.", metric: "Mengenermittlung im Vergleich zu einer geprüften Messung." },
    calc: { name: "Rechnen", text: "Deterministisch rechnen: Füllgrad, Lasten, Mengen und Summen.", metric: "Exakte Antwort." },
    hours: { name: "Stunden", text: "Lohnzeiten je LV-Position schätzen.", metric: "Abweichung von den tatsächlichen Stunden." },
    cost: { name: "Kosten", text: "Einheitspreise (EP) und Gesamtkosten schätzen.", metric: "Abweichung von den tatsächlichen Kosten." },
    dialog: { name: "Dialog", text: "Mit dem Nutzer arbeiten: Rückfragen stellen, fehlende Angaben benennen.", metric: "Gestellte Fragen und benannte Lücken im Vergleich zu den verborgenen Fakten der Aufgabe." },
  },
  langsIntro: "Jede Aufgabe läuft auf Deutsch und auf Englisch, mit denselben Daten, Vorgaben und Bewertungen.",
  langCol: { de: "Deutsch", en: "Englisch", diff: "Differenz" },
  method: [
    "Mehrstufig: Jede Aufgabe beginnt mit einer kurzen Vorgabe. Das Modell erreicht die Daten nur über Werkzeuge und reicht am Ende eine Antwort ein.",
    "Synthetische Referenz: Die Aufgaben sind erzeugt, die richtige Antwort steht also von vornherein fest.",
    "Scores sind Mittelwerte über die Aufgaben, jede Aufgabe zählt gleich. Der Gesamtscore ist das Mittel über die Disziplinen.",
    "Die Kosten sind der Betrag, den OpenRouter abgerechnet hat, einschließlich Lese- und Schreibzugriffen auf den Cache.",
    "Die Zeit ist die tatsächlich verstrichene Zeit einer vollständigen Aufgabe, vom ersten Modellaufruf bis zur Antwort.",
  ],
  facts: { date: "Datum des Laufs", tasks: "Aufgaben", samples: "Durchläufe je Aufgabe", models: "Modelle und Reasoning-Stufen" },
  repoLink: "Aufgaben, Bewertung und Rohdaten auf GitHub",
  footer: "90/10 analysiert Ausschreibungen, kalkuliert Positionen und bereitet Angebote vor.",
  madeBy: "„Die Letzten 10“ ist ein Benchmark von",
};

export const copy: Record<Lang, Copy> = { en, de };
