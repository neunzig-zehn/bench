import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { REPO, copy, type Copy } from "./copy";
import { families, isSample, meta, rows, samplesPerTask, summary, taskCount, TRACKS, type Lang, type Row, type Track } from "./data";

type Format = ReturnType<typeof formats>;

const formats = (locale: string) => {
  const number = (digits: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const one = number(1);
  const zero = number(0);
  const cents = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const small = new Intl.NumberFormat(locale, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", minimumSignificantDigits: 2, maximumSignificantDigits: 2 });
  return {
    score: (value: number) => one.format(value),
    diff: (value: number) => (value > 0 ? "+" : value < 0 ? "−" : "±") + one.format(Math.abs(value)),
    seconds: (value: number) => (value < 120 ? `${zero.format(value)}\u202fs` : `${one.format(value / 60)}\u202fmin`),
    cost: (usd: number) => (usd >= 1 ? cents : small).format(usd),
    tick: (usd: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumSignificantDigits: 1 }).format(usd),
    steps: (value: number) => one.format(value),
    share: (value: number) => new Intl.NumberFormat(locale, { style: "percent" }).format(value),
    date: (iso: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso)),
  };
};

const ModelName = ({ base, effort }: { base: string; effort?: string }) => {
  const [provider, name] = base.includes("/") ? base.split("/", 2) : ["", base];
  return (
    <span className="model">
      <span className="model-name">{name}</span>
      {provider && <span className="model-provider">{provider}</span>}
      {effort && <span className="effort effort-inline">{effort}</span>}
    </span>
  );
};

const Effort = ({ effort }: { effort: string }) => (effort ? <span className="effort">{effort}</span> : <span className="muted">–</span>);

const ScoreBar = ({ score, f }: { score: number; f: Format }) => (
  <span className="score">
    <span className="bar" aria-hidden="true">
      <span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
    </span>
    <span className="score-num">{f.score(score)}</span>
  </span>
);

const ColLabel = ({ t, k }: { t: Copy; k: keyof Copy["colShort"] }) => (
  <>
    <span className="long">{t.col[k]}</span>
    <span className="short">{t.colShort[k]}</span>
  </>
);

type SortKey = "score" | "seconds" | "costUsd" | "steps" | "cacheHit";

function Leaderboard({ t, f }: { t: Copy; f: Format }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "score", desc: true });
  const sorted = [...rows].sort((a, b) => (sort.desc ? -1 : 1) * (a.cell[sort.key] - b.cell[sort.key]));
  const ranks = new Map([...rows].sort((a, b) => b.cell.score - a.cell.score).map((row, index) => [row.label, index + 1]));
  const header = (key: SortKey, extra = "") => (
    <th aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : undefined} className={`num ${extra}`}>
      <button type="button" onClick={() => setSort({ key, desc: sort.key === key ? !sort.desc : key === "score" || key === "cacheHit" })}>
        {sort.key === key && <span className="arrow" aria-hidden="true">{sort.desc ? "↓" : "↑"}</span>}
        <ColLabel t={t} k={key} />
      </button>
    </th>
  );
  return (
    <div className="table-wrap">
      <table className="leaderboard">
        <thead>
          <tr>
            <th className="num">{t.col.rank}</th>
            <th>{t.col.model}</th>
            <th className="col-effort">{t.col.effort}</th>
            {header("score")}
            {header("seconds")}
            {header("costUsd")}
            {header("steps", "col-extra")}
            {header("cacheHit", "col-extra")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.label}>
              <td className="num muted">{ranks.get(row.label)}</td>
              <td><ModelName base={row.base} effort={row.effort} /></td>
              <td className="col-effort"><Effort effort={row.effort} /></td>
              <td className="num"><ScoreBar score={row.cell.score} f={f} /></td>
              <td className="num">{f.seconds(row.cell.seconds)}</td>
              <td className="num">{f.cost(row.cell.costUsd)}</td>
              <td className="num col-extra">{f.steps(row.cell.steps)}</td>
              <td className="num col-extra">{f.share(row.cell.cacheHit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const costs = rows.map((row) => row.cell.costUsd).filter((cost) => cost > 0);
const costDomain: [number, number] = costs.length ? [Math.min(...costs) / 1.6, Math.max(...costs) * 1.6] : [0.001, 1];

const costTicks = (() => {
  const ticks: number[] = [];
  for (let power = Math.floor(Math.log10(costDomain[0])); power <= Math.ceil(Math.log10(costDomain[1])); power++)
    for (const step of [1, 2, 5]) {
      const tick = step * 10 ** power;
      if (tick >= costDomain[0] && tick <= costDomain[1]) ticks.push(tick);
    }
  return ticks.length > 4 ? ticks.filter((tick) => String(tick).replace(/0|\./g, "") === "1") : ticks;
})();

function TradeOff({ levels, t, f, width, className }: { levels: Row[]; t: Copy; f: Format; width: number; className: string }) {
  const height = 220;
  const pad = { left: 32, right: 0, top: 24, bottom: 40 };
  const x = (cost: number) =>
    pad.left + ((Math.log(Math.max(cost, costDomain[0])) - Math.log(costDomain[0])) / (Math.log(costDomain[1]) - Math.log(costDomain[0]))) * (width - pad.left - pad.right);
  const y = (score: number) => pad.top + (1 - score / 100) * (height - pad.top - pad.bottom);
  const points = levels.map((row) => [x(row.cell.costUsd), y(row.cell.score)] as const);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${t.col.score} / ${t.costAxis}`} className={`chart ${className}`}>
      {[0, 25, 50, 75, 100].map((score) => (
        <g key={score}>
          <line x1={pad.left} x2={width - pad.right} y1={y(score)} y2={y(score)} className="grid" />
          <text x={0} y={y(score)} className="tick" dominantBaseline="middle">{score}</text>
        </g>
      ))}
      {costTicks.map((cost) => (
        <text key={cost} x={x(cost)} y={height - pad.bottom + 18} className="tick" textAnchor="middle">{f.tick(cost)}</text>
      ))}
      <text x={width - pad.right} y={height - 4} className="tick" textAnchor="end">{t.costAxis} →</text>
      <polyline points={points.map((point) => point.join(",")).join(" ")} className="trade" />
      {levels.map((row, index) => (
        <g key={row.label}>
          <circle cx={points[index]![0]} cy={points[index]![1]} r={4.5} className="dot" />
          <text x={points[index]![0]} y={points[index]![1] - 10} className="dot-label" textAnchor="middle">{row.effort || "–"}</text>
        </g>
      ))}
    </svg>
  );
}

function Levels({ t, f }: { t: Copy; f: Format }) {
  return (
    <div className="cards two">
      {families.map(({ base, levels }) => (
        <figure key={base} className="card">
          <figcaption><ModelName base={base} /></figcaption>
          <TradeOff levels={levels} t={t} f={f} width={500} className="chart-wide" />
          <TradeOff levels={levels} t={t} f={f} width={320} className="chart-narrow" />
          <table className="compact">
            <thead>
              <tr>
                <th><ColLabel t={t} k="effort" /></th>
                <th className="num">{t.col.score}</th>
                <th className="num"><ColLabel t={t} k="costUsd" /></th>
                <th className="num"><ColLabel t={t} k="seconds" /></th>
              </tr>
            </thead>
            <tbody>
              {levels.map((row) => (
                <tr key={row.label}>
                  <td><Effort effort={row.effort} /></td>
                  <td className="num strong">{f.score(row.cell.score)}</td>
                  <td className="num">{f.cost(row.cell.costUsd)}</td>
                  <td className="num">{f.seconds(row.cell.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      ))}
    </div>
  );
}

function Tracks({ t, f }: { t: Copy; f: Format }) {
  const [track, setTrack] = useState<Track>("docs");
  const ran = rows
    .flatMap((row) => {
      const cell = summary.cells[row.label]?.[track];
      return cell ? [{ ...row, cell }] : [];
    })
    .sort((a, b) => b.cell.score - a.cell.score);
  return (
    <>
      <div className="tracks">
        {TRACKS.map((id) => (
          <button type="button" key={id} className="track" aria-pressed={id === track} onClick={() => setTrack(id)}>
            <span className="track-name">{t.tracks[id].name}</span>
            <span className="track-text">{t.tracks[id].text}</span>
            <span className="track-metric">
              <span className="label">{t.metric}</span> {t.tracks[id].metric}
            </span>
          </button>
        ))}
      </div>
      <h3 className="track-title">{t.tracks[track].name}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.col.model}</th>
              <th className="col-effort">{t.col.effort}</th>
              <th className="num">{t.col.score}</th>
              <th className="num"><ColLabel t={t} k="seconds" /></th>
              <th className="num"><ColLabel t={t} k="costUsd" /></th>
            </tr>
          </thead>
          <tbody>
            {ran.map((row) => (
              <tr key={row.label}>
                <td><ModelName base={row.base} effort={row.effort} /></td>
                <td className="col-effort"><Effort effort={row.effort} /></td>
                <td className="num"><ScoreBar score={row.cell.score} f={f} /></td>
                <td className="num">{f.seconds(row.cell.seconds)}</td>
                <td className="num">{f.cost(row.cell.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Languages({ t, f }: { t: Copy; f: Format }) {
  const score = (row: Row, lang: Lang) => summary.langs[row.label]?.[lang]?.score;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t.col.model}</th>
            <th className="col-effort">{t.col.effort}</th>
            <th className="num">{t.langCol.de}</th>
            <th className="num">{t.langCol.en}</th>
            <th className="num">{t.langCol.diff}</th>
          </tr>
        </thead>
        <tbody>
          {[...rows].sort((a, b) => b.cell.score - a.cell.score).map((row) => {
            const de = score(row, "de");
            const en = score(row, "en");
            return (
              <tr key={row.label}>
                <td><ModelName base={row.base} effort={row.effort} /></td>
                <td className="col-effort"><Effort effort={row.effort} /></td>
                <td className="num">{de === undefined ? "–" : f.score(de)}</td>
                <td className="num">{en === undefined ? "–" : f.score(en)}</td>
                <td className="num muted">{de === undefined || en === undefined ? "–" : f.diff(de - en)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Section = ({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) => (
  <section id={id} className="section">
    <div className="container">
      <h2>{title}</h2>
      {intro && <p className="intro">{intro}</p>}
      {children}
    </div>
  </section>
);

export function Results({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const f = formats(t.locale);
  const date = meta?.date ? f.date(meta.date) : undefined;
  return (
    <>
      {isSample && (
        <div className="banner" role="status">
          <div className="container">{t.sample}</div>
        </div>
      )}
      <header className="header">
        <div className="container header-row">
          <a href="https://9010.berlin" className="wordmark" aria-label="90/10">
            <img src="/wordmark-violet.svg" alt="90/10" width={91} height={28} />
          </a>
          <nav className="header-nav">
            <a href={REPO}>{t.repo}</a>
            <Link to={t.switchTo.to} hrefLang={lang === "en" ? "de" : "en"} aria-label={t.switchTo.label} className="lang">
              {t.switchTo.short}
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="container">
            <p className="kicker">{t.kicker}</p>
            <h1>{t.title}</h1>
            <p className="lead">{t.lead}</p>
            <div className="split" aria-hidden="true">
              <div className="split-routine"><span>{t.routine}</span></div>
              <div className="split-last"><span>{t.last}</span></div>
            </div>
            <ol className="hero-tracks">
              {TRACKS.map((id) => (
                <li key={id}>
                  <span className="track-name">{t.tracks[id].name}</span>
                  <span className="track-text">{t.tracks[id].text}</span>
                </li>
              ))}
            </ol>
            <p className="run">{t.run(meta?.version, date, taskCount, samplesPerTask)}</p>
            <nav className="toc">
              {Object.entries(t.nav).map(([id, label]) => (
                <a key={id} href={`#${id}`}>{label}</a>
              ))}
            </nav>
          </div>
        </section>
        <Section id="leaderboard" title={t.nav.leaderboard} intro={t.leaderboardIntro}>
          <Leaderboard t={t} f={f} />
        </Section>
        <Section id="levels" title={t.nav.levels} intro={t.levelsIntro}>
          <Levels t={t} f={f} />
        </Section>
        <Section id="tracks" title={t.nav.tracks} intro={t.tracksIntro}>
          <Tracks t={t} f={f} />
        </Section>
        <Section id="langs" title={t.nav.langs} intro={t.langsIntro}>
          <Languages t={t} f={f} />
        </Section>
        <Section id="method" title={t.nav.method}>
          <div className="method">
            <ul>
              {t.method.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <dl className="facts">
              {date && (
                <div><dt>{t.facts.date}</dt><dd>{date}</dd></div>
              )}
              <div><dt>{t.facts.tasks}</dt><dd>{taskCount}</dd></div>
              <div><dt>{t.facts.samples}</dt><dd>{samplesPerTask}</dd></div>
              <div><dt>{t.facts.models}</dt><dd>{rows.length}</dd></div>
            </dl>
          </div>
          <p className="repo-link"><a href={REPO}>{t.repoLink} →</a></p>
        </Section>
      </main>
      <footer className="footer">
        <div className="container footer-row">
          <div>
            <p>{t.madeBy} <a href="https://9010.berlin">90/10</a>.</p>
            <p className="muted">{t.footer}</p>
          </div>
          <a href={REPO}>{t.repo}</a>
        </div>
      </footer>
    </>
  );
}
