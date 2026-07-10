import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';

const isWin = process.platform === 'win32';

function spawnSyncCross(command, args, options = {}) {
  const result = spawnSync(command, args, { ...options, shell: isWin });
  if (result?.error) {
    console.error(`[perf:soak] Failed to start: ${command} ${args.join(' ')}`);
    console.error(result.error);
  }
  return result;
}

function spawnCross(command, args, options = {}) {
  const child = spawn(command, args, { ...options, shell: isWin });
  child.on('error', (err) => {
    console.error(`[perf:soak] Failed to start: ${command} ${args.join(' ')}`);
    console.error(err);
  });
  return child;
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

const repoRoot = process.cwd();
const runsDir = path.join(repoRoot, 'documentation', 'automation', 'testing', 'perf-runs');

const args = process.argv.slice(2);
const useDevServer = args.includes('--dev');
const stamp = nowStamp();
const outFile = path.join(runsDir, `${stamp}.soak.json`);
fs.mkdirSync(path.dirname(outFile), { recursive: true });

async function waitForServer(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const req = http.get('http://127.0.0.1:5173', (res) => {
        res.resume();
        resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Timed out waiting for preview server at http://127.0.0.1:5173');
}

let serverProc = null;
if (!useDevServer) {
  const build = spawnSyncCross('npm', ['run', 'build'], { stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);

  serverProc = spawnCross('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    stdio: 'inherit',
    env: { ...process.env },
  });

  await waitForServer();
}

const env = {
  ...process.env,
  PW_WORKERS: '1',
  BASE_URL: 'http://127.0.0.1:5173',
  PW_REUSE_EXISTING_SERVER: useDevServer ? undefined : 'true',
};

// Capture stdout so we can extract the JSON payload emitted by the test.
const result = spawnSyncCross(
  'npx',
  ['playwright', 'test', 'tests/e2e/specs/performance/performance-soak-diagnose.spec.ts', '--headed', '--reporter=line'],
  { env, encoding: 'utf8' }
);

if (serverProc) {
  try {
    if (process.platform === 'win32' && serverProc.pid) {
      spawnSync('taskkill', ['/PID', String(serverProc.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      serverProc.kill('SIGTERM');
    }
  } catch {
    // Best-effort shutdown.
  }
}

const stdout = result.stdout ?? '';
const stderr = result.stderr ?? '';

process.stdout.write(stdout);
process.stderr.write(stderr);

if (result.status !== 0) process.exit(result.status ?? 1);

// Extract the last line that starts with "[soak] json:".
const lines = String(stdout).split(/\r?\n/);
const marker = '[soak] json:';
let jsonText = null;
for (const line of lines) {
  const idx = line.indexOf(marker);
  if (idx !== -1) jsonText = line.slice(idx + marker.length).trim();
}

const payload = {
  stamp,
  host: {
    os: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()?.[0]?.model ?? null,
  },
  note: 'Soak diagnostic output. Look for upward trends in heapUsedMB/domNodes/jsEventListeners and worsening frameP95Ms/longtaskCount over time.',
  data: jsonText ? JSON.parse(jsonText) : null,
};

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
console.log(`\n[perf:soak] wrote: ${path.relative(repoRoot, outFile)}`);
