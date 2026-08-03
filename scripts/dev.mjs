import { spawn } from 'node:child_process';
import http from 'node:http';

const children = [];
let shuttingDown = false;

function run(command, args, options = {}) {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  children.push(child);
  child.on('error', (error) => {
    console.error(`Could not start ${command}:`, error);
    shutdown(1);
  });
  return child;
}

function waitForServer(url, attempts = 80) {
  return new Promise((resolve, reject) => {
    const tryRequest = (remaining) => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on('error', () => {
        if (remaining <= 0) {
          reject(new Error(`Vite server did not start at ${url}`));
          return;
        }
        setTimeout(() => tryRequest(remaining - 1), 250);
      });
      request.setTimeout(1000, () => request.destroy());
    };
    tryRequest(attempts);
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

try {
  const build = run('npm', ['run', 'build:main']);
  const buildCode = await new Promise((resolve) => build.on('exit', (code) => resolve(code ?? 1)));
  if (buildCode !== 0) shutdown(buildCode);

  run('npx', ['tsc', '-p', 'tsconfig.main.json', '--watch', '--preserveWatchOutput']);
  run(process.execPath, ['node_modules/vite/bin/vite.js']);
  await waitForServer('http://127.0.0.1:5173');

  const electron = run('npx', ['electron', '.'], {
    env: { ...process.env, VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
  });
  electron.on('exit', (code) => shutdown(code ?? 0));
} catch (error) {
  console.error('Development mode failed:', error);
  shutdown(1);
}
