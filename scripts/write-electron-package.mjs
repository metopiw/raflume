import { mkdir, writeFile } from 'node:fs/promises';

try {
  await mkdir('dist-electron', { recursive: true });
  await writeFile('dist-electron/package.json', '{"type":"commonjs"}\n', 'utf8');
} catch (error) {
  console.error('Could not write dist-electron/package.json:', error);
  process.exitCode = 1;
}
