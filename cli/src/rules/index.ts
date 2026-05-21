// Rule registry. Add new rules here.
import type { Rule } from '../types.js';
import { staleClaudeMd } from './stale-claude-md.js';
import { missingAdrXref } from './missing-adr-xref.js';
import { mcpLiteralCredentials } from './mcp-literal-credentials.js';
import { oversizedClaudeMd } from './oversized-claude-md.js';
import { placeholderComments } from './placeholder-comments.js';
import { missingVerification } from './missing-verification.js';
import { secretsRegex } from './secrets-regex.js';
import { missingLicenseHeader } from './missing-license-header.js';
import { todoComments } from './todo-comments.js';
import { agentsClaudeSync } from './agents-claude-sync.js';
import { oversizedCursorRule } from './oversized-cursor-rule.js';
import { agentsMdDuplication } from './agents-md-duplication.js';

export const rules: Rule[] = [
  staleClaudeMd,
  missingAdrXref,
  mcpLiteralCredentials,
  oversizedClaudeMd,
  placeholderComments,
  missingVerification,
  secretsRegex,
  missingLicenseHeader,
  todoComments,
  agentsClaudeSync,
  oversizedCursorRule,
  agentsMdDuplication,
];
