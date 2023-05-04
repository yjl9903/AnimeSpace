import { bundle } from 'unbuild-sea';

await bundle(process.cwd(), { main: './bin/index.js', outDir: './bin' });
