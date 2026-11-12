import { SITE, copy } from "./copy";
import type { Lang } from "./data";

export const head = (lang: Lang) => {
  const t = copy[lang];
  const title = `${t.title} · 90/10`;
  return {
    meta: [
      { title },
      { name: "description", content: t.description },
      { property: "og:title", content: title },
      { property: "og:description", content: t.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE + (lang === "de" ? "/de" : "/") },
    ],
    links: [
      { rel: "canonical", href: SITE + (lang === "de" ? "/de" : "/") },
      { rel: "alternate", hrefLang: "en", href: `${SITE}/` },
      { rel: "alternate", hrefLang: "de", href: `${SITE}/de` },
    ],
  };
};
