import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, "dist");
const files = ["index.html", "styles.css", "app.js", "wedding-config.js", "favicon.svg"];

await mkdir(output, { recursive: true });
for (const file of files) await copyFile(join(root, file), join(output, file));
await writeFile(join(output, ".nojekyll"), "");
console.log(`Built ${files.length} static files in dist/`);
