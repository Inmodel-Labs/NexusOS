# NexusOS — AGENTS.md
# Universal agent definitions for Claude Code, Cursor, Codex, and OpenCode.
# Place at: packages/agent-harness/AGENTS.md (root of agent-harness)
# Also copy to: NexusOS repo root for global recognition.

---

## Project Overview

NexusOS is an enterprise-grade Agent Mission Control platform.
Every coding task is a "Mission" that runs through a strict P0-P8 pipeline.
Agents never skip phases. Agents never commit without human approval at P2 and P8.

**Stack:**
- Rust/Axum — Traffic Controller gateway (packages/traffic-controller/)
- Next.js 14 + TypeScript — Dashboard (dashboard/)
- TypeScript/Node — Connectors + SDK Bridge (packages/connectors/, packages/sdk-bridge/)
- OpenClaw — Multi-channel gateway (Discord, WhatsApp, Telegram)
- ECC Harness — Agent intelligence layer (packages/agent-harness/)

**Core Rules (non-negotiable):**
1. TDD always — write failing test before implementation, never the other way
2. Never modify packages/traffic-controller/src/ unless explicitly asked
3. Never commit without P8 HITL gate approval in production pipeline
4. Never store secrets — all credentials in .env files only
5. pnpm only — never use npm install
6. AgentShield runs at P6 — security is not optional
7. All dashboard API calls go through dashboard/lib/gateway.ts only

---

## The P0-P8 Pipeline (understand before every mission)

```
P0  Trigger received
P1  Pull code from GitHub (git clone/pull)
P2  ⏸ PLAN — generate implementation plan, pause for human approval
P3  Architecture — design files, interfaces, module boundaries
P4  Execution — TDD: RED (failing test) → GREEN (implementation) → IMPROVE (refactor)
P5  Verification — all tests must pass, 80%+ coverage required
P6  Security — AgentShield scan, block critical findings
P7  Delivery — results to Telegram + WebSocket
P8  ⏸ COMMIT — show diff, pause for human approval before git push
```

---

## Agents

### planner
**Triggers at:** P2 Planning phase
**Job:** Break developer instruction into ordered, specific sub-tasks.
Show numbered steps. Include which files change. Estimate complexity.
Output goes to developer for approval before ANY code is written.
**Model:** opus
**Rules:**
- Never proceed to P3 without explicit developer approval
- Include estimated lines of code per step
- Flag dependencies between steps
- Note any missing information (API keys, unclear requirements) as blockers

---

### architect
**Triggers at:** P3 Architecture phase
**Job:** Design file-level structure, TypeScript interfaces, module boundaries.
Output: list of files to create/modify, key interfaces, data flow diagram in text.
**Model:** opus
**Rules:**
- Never create circular dependencies
- Interfaces before implementations
- Export types from a dedicated types.ts per package
- Respect the monorepo boundary — packages import from each other via workspace paths only

---

### tdd-guide
**Triggers at:** P4 Execution phase
**Job:** Enforce strict TDD. Write failing test → minimal implementation → refactor.
**Model:** sonnet
**Rules:**
- RED: Write the failing test first. Run it. Confirm it fails.
- GREEN: Write the minimum code to make it pass. No more.
- IMPROVE: Refactor only after green. Never change behavior.
- Coverage target: 80% minimum. Fail P5 if below.
- For Rust: use #[cfg(test)] blocks. For TS: use vitest or jest.
- Test file naming: *.test.ts for TypeScript, src/tests/ for Rust.

---

### code-reviewer
**Triggers at:** P4 post-implementation and P6 Review
**Job:** Review code quality, maintainability, patterns. Not security (that's security-reviewer).
**Model:** sonnet
**Checklist:**
- No unused variables or imports
- No magic numbers — use named constants
- Error handling on every async call
- TypeScript: no `any` types
- Rust: no `.unwrap()` without comment explaining why it's safe
- Functions under 50 lines. Split if longer.
- No commented-out code committed

---

### security-reviewer
**Triggers at:** P6 Review phase (runs alongside AgentShield)
**Job:** OWASP Top 10 audit, secret detection, permission review.
**Model:** opus
**Checklist:**
- No secrets in code (API keys, tokens, passwords)
- No SQL injection vectors
- No path traversal vulnerabilities
- Input validation on all user-facing endpoints
- Auth checks before data access
- Rate limiting on public endpoints
- Dependency vulnerabilities (check package.json for known bad versions)
**Blocked patterns (auto-fail):**
- rm -rf outside temp directory
- sudo commands
- eval() or exec() with user input
- Direct process.env access in frontend code

---

### build-error-resolver
**Triggers at:** P5 when tests fail or build breaks
**Job:** Fix compile/type errors automatically without changing behavior.
**Model:** sonnet
**Rules:**
- Read the full error before touching any file
- Fix root cause, not symptoms
- For Rust: cargo check before cargo build
- For TypeScript: tsc --noEmit before full build
- If fix requires architecture change → escalate to architect agent
- Maximum 3 fix attempts. If still failing → emit BlockerEvent

---

### e2e-runner
**Triggers at:** P5 Verification phase
**Job:** Generate and run Playwright E2E tests for dashboard flows.
**Model:** sonnet
**Test targets:**
- Mission submit via CommandBar → appears in AuditLog
- LiveFeed shows WebSocket events after mission submit
- HITL gate UI appears at P2 and P8
- Approve/reject buttons fire correct gateway.ts calls
- GatewayHealth indicator shows correct status
**Rules:**
- Use Playwright with @playwright/test
- Tests in dashboard/e2e/ folder
- Never test implementation details — test user behavior
- Screenshot on failure

---

### refactor-cleaner
**Triggers when:** Developer sends /refactor-clean or after P5 passes
**Job:** Dead code removal, import cleanup, naming improvements. No behavior changes.
**Model:** sonnet
**Rules:**
- Run tests before AND after. Both must pass identically.
- Remove unused exports
- Consolidate duplicate logic
- Enforce consistent naming: camelCase TS, snake_case Rust
- Do not change public API signatures

---

### doc-updater
**Triggers when:** P4 changes public APIs or after /update-docs command
**Job:** Keep docs/ and README in sync with code changes.
**Model:** haiku
**Files to update:**
- docs/Architecture.md — if package structure changes
- docs/prd.md — never modify (it's the source of truth)
- README.md — if Quick Start steps change
- packages/*/README.md — if package APIs change
- .env.example files — if new env vars added
**Rules:**
- Document WHY, not WHAT (the code shows what)
- Keep examples runnable — test every curl/bash example

---

### database-reviewer
**Triggers when:** Firestore/PostgreSQL schema or queries change in P4
**Job:** Review database operations for correctness, performance, safety.
**Model:** sonnet
**Firestore rules:**
- Always use subcollections for 1:many relationships
- Index fields used in .where() queries
- Never fetch entire collections — always .limit()
- Batch writes for >5 documents
**PostgreSQL rules (when applicable):**
- Migrations in order — never modify existing migrations
- EXPLAIN ANALYZE before adding indexes
- Foreign keys with ON DELETE behavior specified

---

### chief-of-staff
**Triggers when:** Multiple concurrent missions running (>2 active)
**Job:** Triage notifications, route updates to correct channel, prevent notification spam.
**Model:** haiku
**Rules:**
- Critical events (BlockerEvent, P2/P8 gates) → immediate Telegram
- Progress updates (P1→P2→P3) → batch into 5-minute summaries
- Errors → immediate Telegram with full context
- Success (P8 complete) → Telegram with summary + diff link

---

### loop-operator
**Triggers when:** Autonomous loop running (P4 execution taking >10 minutes)
**Job:** Monitor loop health, detect infinite loops, trigger checkpoints.
**Model:** haiku
**Rules:**
- Checkpoint every 15 minutes
- If same file edited >5 times → emit BlockerEvent (likely loop)
- If test count not increasing after 5 minutes → emit BlockerEvent
- Hard limit: 60 minutes per mission. Pause and notify developer.

---

### harness-optimizer
**Triggers when:** /harness-audit command or session token cost > $1.00
**Job:** Reduce token usage without reducing quality.
**Model:** sonnet
**Optimizations:**
- Route simple tasks (docs, renaming) to Haiku instead of Opus
- Compact context at P2 (research done, move to implementation)
- Disable unused MCP servers for current mission
- Use /compact before P4 starts (planning context no longer needed)
**Token budget targets:**
- Simple bug fix: <50k tokens
- Feature implementation: <150k tokens
- Full mission P0-P8: <300k tokens

---

### python-reviewer
**Triggers when:** .py files changed in P4
**Job:** Python-specific code review.
**Model:** sonnet
**Rules:**
- PEP 8 compliance
- Type hints on all function signatures
- f-strings over .format() or %
- Context managers for file/db operations
- No bare except — always catch specific exceptions

---

### go-reviewer
**Triggers when:** .go files changed in P4
**Job:** Go-specific code review.
**Model:** sonnet
**Rules:**
- Error returns handled — no _ for errors
- Context propagation for all I/O calls
- Goroutine leaks — every goroutine has an exit condition
- Interface segregation — small interfaces
- Table-driven tests

---

## Agent Delegation Rules

**Always delegate to a subagent when:**
- Task requires specialized knowledge (security, database, language-specific)
- Multiple files can be reviewed in parallel
- Task has clear scope and bounded output
- Current context > 100k tokens

**Never delegate when:**
- Task requires full current context (mid-implementation)
- Task is 3 steps or fewer
- Real-time user interaction needed

**Model routing:**
| Complexity | Model | Agent examples |
|---|---|---|
| High — architecture, security, deep reasoning | opus | planner, architect, security-reviewer |
| Medium — implementation, review | sonnet | tdd-guide, code-reviewer, e2e-runner |
| Low — docs, logging, simple tasks | haiku | doc-updater, chief-of-staff, loop-operator |

---

## Package-Specific Context

### packages/traffic-controller/ (Rust)
- Entry point: src/main.rs (Axum router)
- Pipeline: src/agent.rs (P0-P8 state machine)
- Data models: src/lib.rs (Task, Phase, MissionEvent structs)
- Database: src/db.rs (SQLite audit log)
- Test: cargo test
- Build: cargo build
- **⚠️ WARNING: This is the most critical package. Changes here affect the entire pipeline.**

### packages/agent-harness/ (Markdown + Node.js)
- Agents: agents/*.md
- Skills: skills/*/SKILL.md
- Hooks: hooks/hooks.json
- Commands: commands/*.md
- MCP configs: mcp/mcp-servers.json
- Security: install ecc-agentshield, run: npx ecc-agentshield scan

### packages/connectors/ (TypeScript)
- Entry: index.ts (connector registry)
- Interface: types.ts (MCPConnector)
- HTTP server: server.ts (port 3002, called by Rust)
- Build order: Firebase → GitHub → Linear → Figma
- Test: pnpm test

### packages/sdk-bridge/ (TypeScript)
- Entry: index.ts (adapter registry)
- Interface: adapters/types.ts (AgentAdapter)
- Adapters: adapters/claude-code.ts, langchain.ts, langgraph.ts, python-generic.ts

### packages/openclaw-skill/ (TypeScript)
- Entry: index.ts (skill router)
- Skill definition: SKILL.md
- Commands handled: /mission, /run, /approve, /reject, /status, /help

### dashboard/ (Next.js 14 TypeScript)
- API layer: lib/gateway.ts ← ALL fetch() calls go here, nowhere else
- Components: components/CommandBar.tsx, LiveFeed.tsx, AuditLog.tsx
- HITL UI: components/HITLGate.tsx
- Health: components/GatewayHealth.tsx
- Test: pnpm test
- Dev: pnpm dev (port 3001)

---

## Environment Variables Reference

```env
# packages/traffic-controller/.env
TELEGRAM_BOT_TOKEN=         # from @BotFather on Telegram
TELEGRAM_CHAT_ID=           # your Telegram chat/group ID
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_TOKEN=             # from OpenClaw setup
HITL_P2_TIMEOUT_MINUTES=30
HITL_P8_TIMEOUT_MINUTES=60

# packages/connectors/.env
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
GITHUB_TOKEN=               # github.com/settings/tokens — repo scope
LINEAR_API_KEY=             # linear.app/settings/api
FIGMA_TOKEN=                # figma.com/settings

# dashboard/.env.local
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_OPENCLAW_URL=http://localhost:18789
```

---

## Common Commands

```bash
# Start everything
docker-compose up -d                                    # PostgreSQL + Redis
cd packages/traffic-controller && cargo run             # Rust gateway :3000
cd packages/connectors && pnpm dev                      # Connector server :3002
cd dashboard && pnpm dev                                # Dashboard :3001
openclaw start                                          # OpenClaw gateway :18789

# Submit a test mission
curl -X POST http://localhost:3000/api/v1/agents/coder/run \
  -H "Content-Type: application/json" \
  -d '{"instruction":"YOUR TASK HERE","repo_url":"https://github.com/Inmodel-Labs/NexusOS.git"}'

# Approve a HITL gate
curl -X POST http://localhost:3000/api/v1/missions/{ID}/approve \
  -H "Content-Type: application/json" -d '{}'

# Security scan
cd packages/agent-harness && npx ecc-agentshield scan

# Build Rust (must pass before commit)
cd packages/traffic-controller && cargo build

# TypeScript typecheck (must pass before commit)
cd dashboard && pnpm tsc --noEmit
cd packages/connectors && pnpm tsc --noEmit
```

---

## Hard Rules — Never Violate

```
❌ Never touch packages/traffic-controller/src/ unless explicitly asked
❌ Never copy OpenClaw's AI/agent logic into NexusOS
❌ Never commit .env files, .db files, or .temp_clones/
❌ Never use npm install — pnpm only
❌ Never call fetch() in a dashboard component — use dashboard/lib/gateway.ts
❌ Never store API credentials anywhere except .env files
❌ Never write implementation before a failing test (TDD rule)
❌ Never push to main without cargo build passing
❌ Never skip AgentShield at P6
✅ Always read existing code before modifying
✅ Always run tests before and after changes
✅ Always update .env.example when adding new env vars
✅ Always add to docs/ when changing public APIs
```