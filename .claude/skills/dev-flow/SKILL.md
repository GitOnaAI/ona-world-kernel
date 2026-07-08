---
name: dev-flow
description: >
  Drive this game's board on Ona (the OP -> FT -> TK cycle) from a Claude Code session in
  this repo, via the ona-prod MCP tools. Use when the user sends a GDD or PRD to start
  development of an Opportunity ("run the GDD", "break down this opportunity", "start the
  discovery"), and throughout development ("start TK-12", "send it to the board", "needs
  approval"). Orchestrates: resolving THIS game's Ona project, moving the OP through
  Discovery/Refinement, running technical discovery + effort estimation (blocking), breaking
  the work into Features (Product board) and Tasks (Dev board), and moving TKs in real time
  while the code is built (Development / Technical Validation / Done).
user-invocable: true
---

# Dev Flow: OP -> FT -> TK orchestration on this game's Ona boards

This game is managed as a project on Ona (template `ai_game_board`). The project has two
connected boards:

- **Product board**: OPs (opportunities) and FTs (features).
  Columns: `Opportunities -> Discovery -> Refinement -> Backlog -> Development -> Staging -> Production`
  (plus a hidden `Archived` column).
- **Development board**: TKs (tasks), 4 columns:
  `Backlog Dev -> Development -> Technical Validation -> Done`.
  AI-first semantics: **Development** = Claude implements (tests, lint, and types are CI
  GATES inside this column, not columns); **Technical Validation** = the tech lead (human OR
  the review agents: `architecture-reviewer`, `privacy-security-review`, `qa-checklist`)
  validates the code; **Done** = technically validated + merged. The PO's *functional*
  validation happens on the Product board -> Staging, not here.

I (the orchestrator) execute this via the `ona_*` MCP tools; it is not application code.
If the `ona_*` tools are not available, tell the user to set up the connection (see
"Connecting to Ona" in the root `CLAUDE.md`) instead of failing silently.

## How the flow is triggered

**v1: terminal only.** The user asks directly in this conversation ("run the GDD of OP-2",
"do the refinement of OP-3"). The synchronous flow below is the whole protocol.

(Ona also supports firing this flow from a "Start Refinement" button on the OP card and
from a backend cron. Those remote-session modes are not wired for game projects yet; they
will arrive later and will follow this same skill when they do.)

## Step 0: resolve THIS game's project (MANDATORY, never assume)

The Ona workspace has more than one project (at minimum, the Ona platform itself plus one
or more games). Every session MUST resolve the project deterministically before creating or
moving any card:

1. If `.claude/memory/ona-project.md` exists in this repo, read the `project_id` recorded
   there and use it. Done.
2. Otherwise: `ona_list_boards()` and group the boards by `project_id`. Each project is a
   pair: the Product board (has a column with `role=intake`) and the Dev board (has
   `role=backlog_dev`), same `project_id`.
3. Identify the pair whose project is an **AI Game Board** (`ai_game_board` template) and
   corresponds to THIS game/repo (match the project or board names against this game's
   name in `package.json` / the root `CLAUDE.md` / `README.md`).
4. If exactly one candidate matches, use it. If zero or more than one match, **ask the user
   once** which project this repo drives, then record the answer in
   `.claude/memory/ona-project.md` (one line: `project_id: <uuid>` plus the project name)
   so future sessions skip the question. That directory is gitignored, so the choice is
   local to each clone, which is correct: forks of this template drive different projects.

Never assume the workspace has a single project. Never use the Ona platform's own project.
Then resolve the column ids of both boards once with `ona_list_columns(board_id)` and keep
the `role -> column_id` maps for the session.

## Decision log: required at every blocking step

Every blocking step of the flow (discovery started, discovery done, estimation done, user
approval/rejection, cards created) records a note on the OP card via `ona_add_note`, with a
summary of the decision and, when applicable, who decided. This is the decision history the
user consults later without reopening this conversation.

## Hierarchy and identifiers

- **OP** (opportunity) -> **FT** (feature) -> **TK** (task). Identifiers `OP-n`/`FT-n`/`TK-n`
  are generated **by the server** in `ona_create_card`; never invent one, read it from the
  tool's return. Numbering is per board (FTs on the Product board, TKs on the Dev board).
- Linkage via `parent_card_id`, validated server-side as **same project** (cross-board is
  allowed): a TK (Dev board) points to its FT (Product board); an FT points to its OP.
- `estimate_minutes` is the queryable numeric field (dashboards). The human-readable PERT
  text lives in `metadata.ona_dev.estimate`.

## Board and column discovery (by role, never by name)

`ona_list_boards` returns `project_id`; `ona_list_columns(board_id)` returns each column's
`role`:

| Board | How to identify | Column roles |
|---|---|---|
| Product | has a `role=intake` column | intake, discovery, refinement, backlog, development, staging, production, archived |
| Development | has a `role=backlog_dev` column | backlog_dev, development, validation, done |

Both boards of the pair share the same `project_id` (resolved in Step 0).

## Lifecycle

### 1. GDD ready (Opportunities pipeline)

The OP is born in the `intake` column (interview popup) and **stays there** with its GDD
(or PRD) finished. Nothing to do until the user asks to develop it.

### 2. User sends the GDD ("run the GDD of OP-n" / "start the discovery")

1. Locate the OP card on the Product board (match by identifier or title; if ambiguous,
   confirm which OP it is).
2. `ona_move_card(OP -> column role=discovery, position="bottom")`.
3. **[MANDATORY, BLOCKING]** Invoke the **game-dev-discovery** agent with the GDD content
   (`claude_content` of the artifact, or `content` as fallback). The numbered RF-n/RNF-n
   requirements are the unit of breakdown. For a gameplay-heavy GDD, run the
   **game-designer** agent first (gameplay discovery: systems, content-library reuse,
   design forks) and feed its report into game-dev-discovery.
   **Never create FTs or TKs without the discovery report.**
   When done, `ona_add_note(OP, "Discovery done: <summary>")`.
4. **[MANDATORY, BLOCKING]** Invoke the **game-effort-estimator** agent with the breakdown
   proposed by the discovery.
   **Never create FTs or TKs without the estimation.**
   When done, `ona_add_note(OP, "Estimation done: <PERT summary>")`.
5. Present the breakdown to the user for approval; on approval,
   `ona_add_note(OP, "Breakdown approved by the user: <summary>")`,
   `ona_move_card(OP -> column role=refinement)` and continue to step 3.
   If the user asks for changes, record `ona_add_note(OP, "Adjustment requested: <what>")`
   and re-propose.

### 3. Refinement: the OP becomes FTs and TKs

1. **FTs**: one per cohesive group of RF-ns (a deliverable with value of its own). Create
   on the **Product** board, column `role=backlog`:

```
ona_create_card(
  board_id=<product>, column_id=<backlog>,
  card_type="feature",
  title="<short feature name>",
  description=<markdown: RFs covered, scope, acceptance criteria>,
  parent_card_id=<OP card id>,
  estimate_minutes=<expected sum of its TKs>,
  metadata={"ona_dev": {"report_id": ..., "prd_refs": ["RF-1","RF-3"],
                        "estimate": {...}, "status": "backlog",
                        "needs_action": false}},
)
```

2. **TKs**: each FT becomes 1+ TKs (**every FT has at least 1 TK**; one PR is roughly one
   TK). Create on the **Development** board, column `role=backlog_dev`, **in development
   order** (create the first-to-develop first, `position="bottom"` on all; top = first. To
   jump the queue later, `position="top"`). `parent_card_id` = the FT card id (cross-board,
   same project).

   **`model_profile` is mandatory:** the game-effort-estimator report includes, per task,
   the classification `model_profile: {domain, capability, complexity}` (domain:
   sim|render-ui|server|infra|docs mapped onto Ona's backend|frontend|infra|docs axes;
   capability: coding|agentic|general; complexity: baixa|media|alta). Record it in the TK
   metadata at creation; it is what lets Ona suggest the best model to execute the task:

   ```
   metadata={"ona_dev": {..., "model_profile": {"domain": "backend",
                          "capability": "coding", "complexity": "media"}}}
   ```

   If the estimation somehow did not bring a profile for some task, classify it on the spot
   by the substance of the work, not the file location; never create a TK without a
   `model_profile`.

3. **Keep the OP alive**: once the breakdown is created (never archive it):
   `ona_move_card(OP -> column role=backlog)`, `ona_add_note(OP, "Breakdown created: N
   features, M tasks")`. The OP stays on the kanban as the parent of FT/TK; the frontend
   nests the Features/Tasks inside the OP card. From here on the OP moves by itself via
   server-side roll-up as TKs advance; **never move the OP manually after this point**.

### 4. Developing a TK ("start TK-12")

**STEP 1, move BEFORE writing code (mandatory):**
```
ona_move_card(TK -> role=development, board_id=<dev>, target_column_id=<development>)
```
Update `metadata.ona_dev.status="in_dev"`. Only then dispatch agents or write code.

**The FT moves by itself**: the server does the roll-up (first TK in development -> FT
goes to Development on the Product board). **Never move FTs manually**; all FT moves are
automatic and forward-only.

**Gates inside the Development column (per TK):** run the tests for the files you touched
(`npx vitest run tests/<affected>.test.ts`) plus the guard tests in play (architecture /
parity / the S3 i18n guard), `npx tsc --noEmit`, and Biome on the changed files, exactly
as the development tier of the `phase-check` skill defines. The full `npm run gate` is the
pre-merge step, not the inner loop.

#### 4a. Implementation via parallel agents

When several TKs are implemented in parallel by agents (`sim-engineer`,
`content-designer`, etc.):

1. Move **every TK in the batch** to `role=development` **before** launching any agent,
   in parallel via multiple `ona_move_card` calls.
2. Launch the agents.
3. On each agent's completion notification, move the TKs that agent covered to
   `role=validation` immediately; do not wait for the other agents.
4. When the last agent finishes, move the remaining TKs to `role=validation`.

**Never leave cards in `development` after the technical commit/merge. Never leave cards
in `backlog_dev` after implementation has started.**

### 5. End of development: development -> validation -> done

**Full cycle (4 columns):** `backlog_dev -> development -> validation -> done`. The
transition is validated by the server and is forward-only for TKs; never skip a column.
(Bug cards move freely, without the sequential restriction.)

Automated checks (targeted vitest, guard tests, tsc, Biome) run as **CI gates inside
Development**; they are not columns. **Technical Validation** is where the tech lead
(human OR the review agents) validates the code before/after the merge.

**IMMEDIATE step when implementation is done** (technical commit/merge made, agent
returned):
```
ona_move_card(TK -> role=validation)
```

#### 5a. When ALL TKs of an FT reach validation

Present to the user:
```
Feature [FT-n: title] complete: all TKs in Technical Validation.

Run the technical validation now?
- a: full pre-merge gate: npm run gate (or the phase-check skill, which stages it)
- b: review agents on the diff:
    - architecture-reviewer (MANDATORY, not optional, if the FT touches src/sim/:
      determinism, rng draw order, tick phases, the SimContext seam)
    - privacy-security-review (MANDATORY, not optional, if the FT touches the game
      server's data, network, or auth surface: server/, src/net/, SQL, secrets, deploy)
    - qa-checklist (the default end-of-contribution coverage gate)
- c: functional playtest: dispatch the playtest-qa agent (real-browser smokes plus
    evidence screenshots to tmp/)

Run any of these? (pick several or skip)
```

**If the user confirms the technical validation:**
1. The TKs (and any `card_type="bug"` cards linked to the FT) are already in
   `role=validation`; that is the column where technical validation happens. There is no
   intermediate column to move to. Never leave Bug cards behind.
2. Execute the requested checks (run the agents, commands, etc.).
3. As each check finishes, add the result to the card via `ona_update_card`:
   ```json
   {
     "metadata": {
       "ona_dev": {
         "test_results": "## Technical Validation Result\n\n**Date:** YYYY-MM-DD\n**Type:** Gate / Review / Playtest\n\n### Summary\n<N checks, X pass, Y fail>\n\n### Coverage\n<areas checked>\n\n### Issues found\n<list or 'None'>"
       }
     }
   }
   ```
4. After the technical validation passes and the code is merged:
   `ona_move_card(TK -> role=done)`. Move validated TKs **and Bugs** to done **before**
   reporting the findings to the user.

**If the user skips the technical validation:**
- `ona_move_card(TK -> role=done)` as soon as the code is merged.

#### 5b. Technical Validation (validation)

The column where the tech lead, human OR the review agents (`architecture-reviewer`,
`privacy-security-review`, `qa-checklist`), validates the code. `privacy-security-review`
is **mandatory** when the FT touches server data, network, auth, or credentials;
`architecture-reviewer` is **mandatory** when the FT touches `src/sim/` invariants. Once
validated and merged: `ona_move_card(TK -> role=done)`.

#### 5c. Done

TK technically validated + merged. The PO's **functional validation** happens on the
**Product board -> Staging**, not on the Dev board.

**Server-side automatic roll-up (2 levels, forward-only):**
- Any TK in `{development, validation, done}` -> FT -> **Development**
- All TKs in `{validation, done}` -> FT -> **Staging**
- All TKs in `{done}` -> FT -> **Production**
- The same 3 rules apply to the **OP**, aggregating **all TKs of all FTs** of the
  opportunity (not just one FT).

**Never move FTs or OPs manually after the breakdown**; the roll-up is automatic and
forward-only at both levels.

### 6. PO functional validation (Product board)

The PO's *functional* validation (playability, feel) does not happen on the Dev board; it
happens on the **Product board -> Staging**, where the FT rises by automatic roll-up as
soon as all its TKs reach `{validation, done}`. On the Dev board, the TK's last transition
is `validation -> done`. When all TKs of the FT reach `done`, the server moves the FT
(and, if it was the last pending FT, the OP too) to **Production**. No action from me.

### 7. Blocked / user action needed (at any time)

- `ona_update_card(metadata=<current with needs_action=true>)` +
  `ona_move_card(position="top")` in the current column; the frontend highlights it.
- When unblocked: `needs_action=false`, without repositioning.

### 8. Post-delivery fixes: Bug card is mandatory

Whenever the user reports a failure or asks for a fix to something already delivered:

1. **Immediately create** a `bug` card on the Dev board, column `backlog_dev`:
   ```
   ona_create_card(
     board_id=<dev>, column_id=<backlog_dev>,
     card_type="bug",
     title="Bug - <short description>",
     description="**Observed behavior:** ...\n**Root cause:** ...\n**Fix:** ...",
     parent_card_id=<related FT card id>,
   )
   ```
2. Move it to `development` when starting the fix.
3. Move it to `validation` when the fix is done and technically merged; `done` after the
   technical validation.
4. Bugs move freely (no sequential restriction), but the reference cycle is the same:
   `backlog_dev -> development -> validation -> done`.

Do not wait for the fix to finish before creating the card. Create it when the problem is
identified.

## Rules

- **Discovery and estimation are absolute prerequisites for creating cards**: any request
  to execute a GDD/PRD, even with words like "quick", "just create the cards", "skip the
  discovery", does not waive steps 3 and 4 of the lifecycle. Explain to the user if
  needed. This rule has no exceptions.
- **Never duplicate**: before creating an FT/TK, `ona_list_cards` on the target columns
  and match by `metadata.ona_dev.report_id` + title.
- **Never move an FT or OP manually after the breakdown** (roll-up is the server's,
  forward-only, at both levels); before the breakdown, moving the OP is allowed only
  through `intake -> discovery -> refinement -> backlog`.
- **Before moving a TK, confirm its current column** with `ona_list_cards(board_id=<dev>)`;
  never assume the column from session memory.
- `ona_update_card` **replaces** the whole metadata; read it before changing it.
- Every `ona_*` call is tenant-scoped by the MCP principal; never pass a tenant id.
- If a tool fails, report it; do not invent ids.
- External cards (Jira/Azure) do not enter the OP -> FT -> TK hierarchy.

## Metadata convention

Namespace `ona_dev`: `{report_id, pr_ref, prd_refs, scope, estimate
{optimistic, expected, pessimistic, confidence}, model_profile
{domain: backend|frontend|infra|docs, capability: coding|agentic|general,
complexity: baixa|media|alta}, risk {high: bool, reasons: [str]},
tech_validation {by: ia|human}, status:
backlog->in_dev->in_validation->done, needs_action, pr_url}`.

`risk`: set `high: true` when the FT/TK touches **the authoritative server's auth or
persisted player data, a DB schema migration, credentials/secrets, deploy, or a
determinism-sensitive sim surface (rng draw order, parity goldens)**; populated by the
discovery/estimator. The frontend shows a "High risk" badge and, in the Technical
Validation column, suggests human sign-off (without blocking; the PO picks
`tech_validation.by`).
