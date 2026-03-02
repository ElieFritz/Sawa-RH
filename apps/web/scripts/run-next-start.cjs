const { spawnSync } = require('node:child_process');
const nextBin = require.resolve('next/dist/bin/next');

const result = spawnSync(process.execPath, [nextBin, 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || '.next-build',
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
