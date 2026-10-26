import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const dest = resolve("../deliverables");
await mkdir(dest, { recursive: true });
const html = await readFile("dist-offline/RTBES.html");
const hash = createHash("sha256").update(html).digest("hex");
await writeFile("HTML_SHA256.txt", `${hash}  RTBES.html\n`);
// Explicit allowlist: no dependencies, original uploads, inspection material,
// credentials, cached user records, or generated browser JSON data are packaged.
const files = [
  "App.tsx",
  "index.tsx",
  "index.html",
  "model.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "styles.css",
  "styles.input.css",
  ".gitignore",
  "components/QuadrantSelector.tsx",
  "components/ScoreEvolutionGraph.tsx",
  "components/ui/IconComponents.tsx",
  "services/engine.ts",
  "services/storage.ts",
  "services/transfer.ts",
  "tests/engine.test.ts",
  "tests/browser.mjs",
  "scripts/offline.mjs",
  "scripts/notices.mjs",
  "scripts/package.mjs",
];
const docs = [
  "START_HERE_CA.md",
  "README_REVIEW.md",
  "SCORING_SPEC.md",
  "VERIFICATION.md",
  "CHANGELOG.md",
  "docs/SOURCE_RULE_AUDIT.md",
  "docs/RULE_SOURCE_MATRIX.md",
  "docs/CLINICAL_ACCEPTANCE_CASES_CA.md",
  "THIRD_PARTY_NOTICES.txt",
  "HTML_SHA256.txt",
  "CITATION.cff",
  "TERMS_OF_USE.md",
];
// The controlled SOP is internal and is deliberately excluded from the public package.
const releaseDocs = [];
// Python stdlib creates only the compiled ZIP artifact, not source edits.
const program = `import sys,json,zipfile,hashlib\nfrom pathlib import Path\na=json.loads(sys.stdin.read())\nout=Path(a['dest'])/'RTBES-web-v1.0.0-rc3.zip'\nwith zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:\n z.write('dist-offline/RTBES.html','RTBES.html')\n for f in a['docs']: z.write(f,f)\n for f in a['files']: z.write(f,'source/'+f)\n for f in a['docs']: z.write(f,'source/'+f)\n z.write('README_REVIEW.md','source/README.md')\n for p in Path('dist-web').rglob('*'):\n  if p.is_file(): z.write(p,'web/'+str(p.relative_to('dist-web')))\nwith zipfile.ZipFile(out) as z: assert z.testzip() is None\nprint(str(out))\nprint('SHA256',hashlib.sha256(out.read_bytes()).hexdigest())\n`;
console.log(
  execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON || "python3", ["-c", program], {
    input: JSON.stringify({ dest, files, docs, releaseDocs }),
    encoding: "utf8",
  }),
);
