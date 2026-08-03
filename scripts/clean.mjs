import { rm } from 'node:fs/promises';

for (const directory of ['dist', 'dist-electron', '.test-dist']) {
  try {
    await rm(directory, { recursive: true, force: true });
  } catch (error) {
    console.error(`Could not clean ${directory}:`, error);
    process.exitCode = 1;
  }
}
