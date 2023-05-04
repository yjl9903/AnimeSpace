import fs from 'fs-extra';
import { bundle } from 'unbuild-sea';

const main = './bin/index.js';

// Replace require("node:os") -> require("os")
const content = await fs.readFile(main, 'utf-8');
const patched = content.replace(/require\("node:(\w+)"\)/g, `require("$1")`);
await fs.writeFile(main, patched, 'utf-8');

await bundle(process.cwd(), { main, outDir: './bin' });
