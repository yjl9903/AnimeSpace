import { bundle } from 'unbuild-sea';

await bundle(process.cwd(), { main: './bin/index.cjs', outDir: './bin' });
