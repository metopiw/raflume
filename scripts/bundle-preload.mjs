import { build } from 'esbuild';

try {
  await build({
    entryPoints: ['src/preload/index.ts'],
    outfile: 'dist-electron/preload/index.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    sourcemap: true,
    external: ['electron'],
    logLevel: 'info',
  });
} catch (error) {
  console.error('Could not bundle sandbox-safe preload:', error);
  process.exitCode = 1;
}
