import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const out = await build({
  entryPoints: ["index.tsx"],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  minify: true,
  target: "es2022",
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".css": "empty" },
  legalComments: "inline",
});
const css = await readFile("styles.css", "utf8");
const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
await mkdir("dist-offline", { recursive: true });
await writeFile(
  "dist-offline/RTBES.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><title>RTBES Calculator 1.0.0-rc3</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`,
);
