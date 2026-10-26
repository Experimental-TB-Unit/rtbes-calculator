import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const sections = [
  "# Third-party package notices\n\nThe project-owner software licence is not assigned by this file.\nThese are dependency notices; all installed package licences are included conservatively.\n",
];
for (const [folder, meta] of Object.entries(lock.packages)) {
  if (!folder || !folder.includes("node_modules/")) continue;
  try {
    const pkg = JSON.parse(
      await readFile(join(folder, "package.json"), "utf8"),
    );
    sections.push(
      `\n## ${pkg.name} ${pkg.version}\nDeclared licence: ${JSON.stringify(pkg.license ?? "see package")}\n`,
    );
    for (const file of await readdir(folder))
      if (/^(license|licence|copying|notice)(\.|$|-)/i.test(file))
        try {
          sections.push(
            `\n${file}\n${await readFile(join(folder, file), "utf8")}\n`,
          );
        } catch {}
  } catch {}
}
await writeFile("THIRD_PARTY_NOTICES.txt", sections.join("\n"));
