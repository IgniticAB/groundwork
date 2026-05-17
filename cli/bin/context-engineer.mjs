#!/usr/bin/env node
import('../dist/index.js').catch((err) => {
  console.error('context-engineer: failed to start');
  console.error(err);
  process.exit(2);
});
