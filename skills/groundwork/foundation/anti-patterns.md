# Anti-Patterns

Things that look like good context engineering and are not. Reject every one of these, including in your own output.

## 1. Monolithic prompt bloat

**Symptom.** A `CLAUDE.md` or system prompt that runs to thousands of words and includes the product roadmap, the customer personas, the architecture diagram, and the brand voice guidelines.

**Why it fails.** The model has a finite attention budget. Burying the actual rules under marketing copy means the actual rules get ignored. Also, every token of bloat costs money on every invocation.

**Fix.** Put each kind of content in its own file. Reference docs are pulled in on demand via `@docs` or filepath mentions. The Project layer file stays under 200 lines and contains only the rules that apply to every interaction.

## 2. Vague principles without examples

**Symptom.** Rules like "Use good judgment", "Write clean code", "Follow our style guide", "Maintain high test coverage".

**Why it fails.** "Clean" is a vibe, not a rule. The agent has seen every "clean code" book in training and will pick whichever interpretation produces the most output. There is no shared definition.

**Fix.** Every rule is **behaviorally anchored**: it names the exact technology, command, or pattern the agent should reach for. Anchored beats abstract in every category.

| Category | Anchored (good) | Vague (bad) |
| --- | --- | --- |
| Error handling | Wrap external API calls in try/catch; log via `Logger`; never swallow exceptions. | "Write robust error handling." |
| Styling | Tailwind utilities only; conditional classes via `cn()`; assets in `/assets/`. | "Use clean styling patterns." |
| Testing | Vitest; assert on user actions; run `npm run test:coverage` before staging. | "Maintain high test coverage." |
| Git workflow | Conventional Commits; one-file scope where reasonable; humans sole authors of record. | "Commit often with helpful messages." |
| Dependencies | Pin critical packages; named imports; `npm run build` to verify types on modified modules. | "Keep dependencies updated." |

Anchored rules carry: a verb, a named tool or pattern, and a verification path. Vague rules carry an adjective and hope.

The Preferred/Avoid code pair is the canonical pattern for showing an anchored rule:

```typescript
// Preferred
const user = await db.user.findUnique({ where: { id } });
if (!user) throw new NotFoundError('user', id);

// Avoid
const user = await db.user.findUnique({ where: { id } });
if (!user) return null; // We always throw, we never silently null
```

## 3. Placeholder comments

**Symptom.** The agent leaves `// TODO: implement this` or `pass  # come back later` in shipped code.

**Why it fails.** TODOs never come back. They become permanent. Worse, the next agent reading the file thinks "implement this" is a real instruction and writes something speculative.

**Fix.** Every function is either fully implemented or not included. If the agent does not have enough information to implement something, it must stop and ask, not leave a placeholder.

State this explicitly in the Project layer: "No placeholder comments. If you do not have enough context, ask."

## 4. Implicit local assumptions

**Symptom.** Instructions that say "use the local Postgres" or "open the file in VS Code" without specifying which Postgres, which path, which user.

**Why it fails.** The agent does not know your timezone, your OS, your shell, your installed Node version, your default browser, or where your scratch directory is. It will guess, and its guess is statistically the wrong one.

**Fix.** Either state the assumption explicitly in the Session layer ("I'm on macOS, Node 22 via fnm, Postgres on port 5433") or have the agent ask before assuming. Never bake personal-environment assumptions into the Project layer.

## 5. Over-exposing tools

**Symptom.** An MCP configuration that exposes every tool the agent could possibly need, "just in case".

**Why it fails.** Every tool description costs tokens. Twenty tool descriptions in the prompt means twenty competing things to consider before doing anything. The agent picks wrong more often, costs more, and the security blast radius is huge.

**Fix.** Route tools by intent. Read-only context servers are physically separate from write-capable mutation servers. The agent gets the read-only ones by default; the write-capable ones require explicit invocation. See `foundation/mcp-principles.md`.

## 6. Rules that fire everywhere

**Symptom.** A `.cursor/rules/global.mdc` that applies to every file in the repo and contains both frontend and backend conventions.

**Why it fails.** When the agent edits a React component, it does not need the SQL migration conventions. They distract.

**Fix.** Scope rules to file patterns. `src/components/**/*.tsx` gets the frontend rules. `db/migrations/**/*.sql` gets the migration rules. The `scope` command exists to do this.

## 7. Stale context

**Symptom.** A `CLAUDE.md` that still says "we use Yarn 1" three months after the team migrated to pnpm.

**Why it fails.** The agent confidently follows the stale instructions and produces non-working scripts. The team blames "AI" when the real failure is ContextOps.

**Fix.** Pre-commit hook that validates context files against detected stack. The `verify` command sets this up. The `audit` command catches existing drift.

## 8. Treating memory as repo context

**Symptom.** "Magnus prefers terse responses" written into `CLAUDE.md`.

**Why it fails.** That is a fact about Magnus, not about the repo. Another engineer joins, reads `CLAUDE.md`, and the agent now thinks they prefer terse responses too. Cross-contamination.

**Fix.** User preferences live in agent memory or per-user config, not in versioned repo files. The Project layer describes the *project*, not the *people*.

## 9. Negative-space silence

**Symptom.** No record anywhere of approaches the team considered and rejected.

**Why it fails.** The agent will eventually suggest the rejected approach, because it does not know it was rejected. Every time. Forever.

**Fix.** Capture rejections in ADRs with a "considered alternatives" section, or in a dedicated `docs/decisions/negative-space.md`. The `adr` command's template includes this section by default.

## 10. Verification as an afterthought

**Symptom.** Context files that tell the agent what to do but not how to check the result.

**Why it fails.** The agent has no way to self-correct. The human becomes the verification step, which is slow and unreliable.

**Fix.** Every instruction that produces an artifact also names the command that verifies it. "Run `pnpm test` after any change in `src/`." Bake this in via the `verify` command.
