#!/usr/bin/env node
import('../dist/index.js').catch((err) => {
  console.error('groundwork: failed to start');
  console.error(err);
  process.exit(2);
});
