# The Last 10 · results site

The public results page of the benchmark at https://bench.9010.berlin, a TanStack Start app on a
Cloudflare Worker named `bench`. `/` is English, `/de` German.

It reads `../results/latest/summary.json` (the `Summary` from `../src/report.ts`) and the optional
`../results/latest/meta.json` (`{ "date": "2026-11-12", "samples": 3, "models": [...] }`) at build
time. Without them it shows `src/sample-summary.json`, made-up numbers, under a "sample data" banner.

```sh
bun install
bun run dev       # vite dev server
bun run build     # client and worker into dist/, then tsc
bun run preview   # the built worker in workerd
bun run deploy    # build, then wrangler deploy (needs CLOUDFLARE_API_TOKEN)
```
