import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import styles from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { name: "theme-color", content: "#ffffff" }],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ...["Regular", "Medium", "SemiBold"].map((weight) => ({ rel: "preload", href: `/fonts/Geist-${weight}.ttf`, as: "font", type: "font/ttf", crossOrigin: "anonymous" as const })),
    ],
  }),
  component: () => (
    <Document>
      <Outlet />
    </Document>
  ),
});

function Document({ children }: { children: ReactNode }) {
  const lang = useLocation({ select: (location) => (location.pathname.startsWith("/de") ? "de" : "en") });
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
