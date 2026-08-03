import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

async function findTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findTests(fullPath));
    } else if (entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

try {
  await writeFile('.test-dist/package.json', '{"type":"commonjs"}\n', 'utf8');
  const testFiles = await findTests('.test-dist/tests');
  if (testFiles.length === 0) {
    throw new Error('No compiled test files found.');
  }

  const child = spawn(process.execPath, ['--test', ...testFiles], { stdio: 'inherit' });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
  child.on('error', (error) => {
    console.error('Could not start Node test runner:', error);
    process.exitCode = 1;
  });
} catch (error) {
  console.error('Test runner failed:', error);
  process.exitCode = 1;
}
