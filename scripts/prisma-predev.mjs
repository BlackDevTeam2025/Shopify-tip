import {existsSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const workspaceRoot = process.cwd();
const schemaPath = path.join(workspaceRoot, 'prisma', 'schema.prisma');
const generatedSchemaPath = path.join(
  workspaceRoot,
  'node_modules',
  '.prisma',
  'client',
  'schema.prisma',
);
const generatedClientPath = path.join(
  workspaceRoot,
  'node_modules',
  '.prisma',
  'client',
  'index.js',
);

function hasGeneratedClient() {
  return existsSync(generatedClientPath) && existsSync(generatedSchemaPath);
}

function generatedClientIsCurrent() {
  if (!hasGeneratedClient() || !existsSync(schemaPath)) {
    return false;
  }

  const sourceMtime = statSync(schemaPath).mtimeMs;
  const generatedMtime = statSync(generatedSchemaPath).mtimeMs;
  return generatedMtime >= sourceMtime;
}

function runPrismaGenerate() {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['prisma', 'generate'],
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
      shell: false,
    },
  );

  return result.status ?? 1;
}

if (generatedClientIsCurrent()) {
  console.log('[prisma-predev] Prisma client is up to date. Skipping generate.');
  process.exit(0);
}

console.log('[prisma-predev] Prisma client is stale or missing. Running prisma generate...');
const status = runPrismaGenerate();

if (status === 0) {
  process.exit(0);
}

if (hasGeneratedClient()) {
  console.warn(
    '[prisma-predev] prisma generate failed, but an existing generated client is available. Continuing dev startup.',
  );
  process.exit(0);
}

process.exit(status);
