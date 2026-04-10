import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

export default function App() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                const allowed = new Set(["HEAD", "BODY"]);
                const sanitizeRoot = () => {
                  const root = document.documentElement;
                  if (!root) return;
                  for (const node of Array.from(root.children)) {
                    if (!allowed.has(node.tagName)) {
                      node.remove();
                    }
                  }
                };

                sanitizeRoot();
                const observer = new MutationObserver(sanitizeRoot);
                observer.observe(document.documentElement, { childList: true });
                window.addEventListener("load", () => observer.disconnect(), { once: true });
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
