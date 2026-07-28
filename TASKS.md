# After Effects MCP Fork — Build & End-to-End Test Tracker

> **Open this first, every session.** This file is the running state for making the fork reliable enough to create, inspect, save, preview, and render a new motion project through MCP. Check a box only when the evidence exists; add a dated one-line note when partial. Deferred/v2+ work lives in [`ROADMAP.md`](ROADMAP.md); user-facing setup and tool documentation live in [`README.md`](README.md).

**Work in this directory:** `knowledge/projects/after-effects-mcp-fork/`. The path `.git/modules/knowledge/projects/after-effects-mcp-fork/` is this submodule's internal Git database, **not** the project worktree and not a place for project files.

## Two levels of done — do not conflate them

- **Bridge smoke — ✅ PASSED 2026-07-17.** With After Effects 2024 open, the bridge completed `getProjectInfo → createComposition → getProjectInfo`; the project item count changed from 0 to 1. This proved one read/write/read round trip.
- **Full motion-project workflow — ❌ NOT PASSED.** A clean AE session must build one deterministic motion fixture through MCP, verify its structure and animation, save the `.aep`, capture inspectable PNG frames, render a video, and reopen/inspect the saved project without stale, timeout, or mismatched results.

**Current goal:** pass the full motion-project workflow in **build-from-scratch mode** first. Figma → AEUX imported-assets mode is a separate follow-up in [`ROADMAP.md`](ROADMAP.md); mixing both now would make failures impossible to localize.

---

## ⚠️ Source-of-truth warning — read before any build

As of 2026-07-28, the worktree is detached at upstream commit `88d5fbf`, but the tested local integration work is committed and pushed at `local/integration` / `origin/local/integration` commit `52b02cc`.

- The ignored `build/` and the panel installed in After Effects contain the **integration prototype**, not the currently checked-out upstream `src/`.
- `build/scripts/mcp-bridge-auto.jsx` and the installed ScriptUI panel are byte-identical (`sha256 958a47d5…`).
- The staged copy at `C:/Users/melor/Documents/ae-mcp-bridge/mcp-bridge-auto.jsx` is the older upstream file (`sha256 ea1b593f…`). **Do not install that copy.**
- `npm install` runs `postinstall`, and `npm run build` regenerates the ignored build. **Do not run either while detached at `88d5fbf`** or the live integration prototype will be overwritten by the older source.

The integration branch is recoverable Git history, not an orphaned build:

| Commit | What it contains |
|---|---|
| `fdfb626` | Request/response `commandId` correlation, ExtendScript `toISOString` compatibility, WSL bridge-dir support, and `bridge-status` |
| `b14e334` + merged community work | Save frame/video, project save, layer/effect/text/matte/3D tools, introspection, keyframe removal, renderer controls |
| `52b02cc` | `mcp-selftest.mjs` tool-surface and bridge-timeout smoke |

**Hard ordering:** restore `local/integration` → build from that source → prove build/panel parity → restart AE/MCP → run the live gate → run the motion fixture. Never skip ahead.

---

## ✅ Done so far

- [x] **Fork exists and has separate remotes.** `origin` is `juansilvadesign/after-effects-mcp`; `upstream` is `Dakkshin/after-effects-mcp`.
- [x] **Integration work is committed and pushed.** `local/integration` and `origin/local/integration` both point to `52b02cc`.
- [x] **WSL ↔ Windows rendezvous path is configured.** The active root `.mcp.json` launches this fork's `build/index.js` with `AE_MCP_BRIDGE_DIR=/mnt/c/Users/melor/Documents/ae-mcp-bridge`.
- [x] **The live panel is installed.** It exists at `C:/Program Files/Adobe/Adobe After Effects 2024/Support Files/Scripts/ScriptUI Panels/mcp-bridge-auto.jsx`.
- [x] **The installed panel matches the integration build.** The current installed file and `build/scripts/mcp-bridge-auto.jsx` have the same SHA-256.
- [x] **Minimal live read/write/read smoke passed.** Verified 2026-07-17 against AE 2024.
- [x] **Reliability prototype exists on the integration branch.** Unique command IDs replace unreliable filesystem-mtime freshness checks; `bridge-status` supplies an explicit liveness probe.
- [x] **Expanded motion/project tool prototype exists.** The integration build exposes 35 tools, including `save-frame`, `render-video`, `save-project`, `get-layer-details`, `create-null`, parenting, mattes, easing, Trim Paths, and text animators.
- [x] **A headless MCP self-test exists.** `mcp-selftest.mjs` lists the tool surface and exercises the expected non-responsive result against a throwaway bridge directory.

## ▶ Next session — start here

1. **Preserve the two new tracker files, then restore the real branch.** From this submodule, switch from detached `88d5fbf` to `local/integration`. Confirm `HEAD` is `52b02cc` and the only expected changes are these planning files.
2. **Prove source/build parity before touching AE.** Build from `local/integration`; confirm the generated panel still hashes to `958a47d5…`. If it does not, stop and diff source versus the currently installed panel before replacing anything.
3. **Make the self-test safe and repeatable.** Have it create its own temporary bridge directory, fail when any expected tool is absent, and expose it as an npm script. Run it with AE uninvolved.
4. **Close the AE panel before replacing it.** Copy only the freshly built `build/scripts/mcp-bridge-auto.jsx` to the ScriptUI Panels directory, restart After Effects, reopen `Window → mcp-bridge-auto.jsx`, and keep **Auto-run commands** enabled.
5. **Restart the MCP host after rebuilding.** A running MCP process keeps the old JavaScript in memory even when `build/index.js` changes.
6. **Pass Phase 2's live bridge gate.** Do not create the motion fixture until three consecutive `bridge-status` calls return `panelResponsive: true`, including one after a clean AE restart.
7. **Run the fixture one command at a time.** The transport is a single command file plus a single result file. Queue the next mutation only after the prior command's correlated result is confirmed.
8. **Capture durable evidence.** Write a dated test report with commit, AE version, panel/build hashes, command results, output-file hashes, visual findings, and the final PASS/FAIL verdict.

---

## Phase 0 — Restore one canonical implementation  ⚠️ prerequisite

- [ ] **0.1 Switch the submodule worktree to `local/integration` (`52b02cc`).** Do not implement against detached upstream `88d5fbf`.
- [ ] **0.2 Verify the integration source contains every live feature.** At minimum: `AE_MCP_BRIDGE_DIR`, command IDs, the ExtendScript date polyfill, `bridge-status`, `save-project`, `save-frame`, `render-video`, and `get-layer-details`.
- [ ] **0.3 Rebuild from source and compare artifacts.** The generated panel must match the integration source and the currently installed known-good panel before installation.
- [ ] **0.4 Establish this fork as the only runtime source.** The older `knowledge/skills/ae-mcp/dakkshin/` copy must not remain a competing build target.
- [ ] **0.5 Remove the stale staged-panel trap.** Replace or retire `C:/Users/melor/Documents/ae-mcp-bridge/mcp-bridge-auto.jsx`; never let it overwrite the installed integration panel.
- [ ] **0.6 Keep the parent repo pointer unchanged until acceptance passes.** Pin the parent submodule to the accepted commit only in Phase 5.

## Phase 1 — Automated reliability checks

> These checks run without Adobe After Effects. They prove the Node/MCP/file-bridge contract, not ExtendScript behavior inside AE.

- [x] **1.1 Correlate by request ID, not mtime.** Implemented on `fix/bridge-reliability`.
- [x] **1.2 Add a read-only liveness probe.** `bridge-status` queues `ping` and waits for the matching `_commandId`.
- [x] **1.3 Make response timestamps work in ExtendScript ES3.** The integration panel includes a `Date.prototype.toISOString` polyfill.
- [x] **1.4 Add a first MCP self-test.** It checks the exposed tool list and the expected timeout shape when no panel watches the directory.
- [ ] **1.5 Make `mcp-selftest.mjs` self-contained.** It must use a unique temp directory automatically, never default to the real bridge folder, assert instead of only printing, and clean up after itself.
- [ ] **1.6 Add package scripts.** At minimum: `test`, `test:self`, and a build check so the obvious command cannot silently run zero checks.
- [ ] **1.7 Add a simulated-panel contract test.** Cover matching ID, mismatched ID, partial JSON during write, timeout, panel error, and a command-file write failure.
- [ ] **1.8 Add server ↔ panel command-parity validation.** Every public tool/run-script command must have a corresponding allowed command and `executeCommand` case; fail on undocumented or unreachable handlers.
- [ ] **1.9 Stop reporting failed writes as “queued.”** `writeCommandFile` currently catches write errors and returns an ID; make failures propagate as MCP errors.
- [ ] **1.10 Record the single-slot transport contract.** Until a real queue exists, concurrent mutations are unsupported and tests/operators must serialize calls.

## Phase 2 — Live bridge gate

> Requires Windows After Effects 2024, **Allow Scripts to Write Files and Access Network**, the current panel open, and Auto-run enabled.

- [ ] **2.1 Prove negative liveness.** With the panel closed, `bridge-status` returns a clean non-responsive result—not stale data and not a malformed response.
- [ ] **2.2 Prove positive liveness.** Open the panel and get `panelResponsive: true` with a matching command ID.
- [ ] **2.3 Prove restart recovery.** Restart AE, reopen the panel, and get three consecutive positive probes without the old 48-second/one-shot scheduler behavior.
- [ ] **2.4 Prove one read.** `getProjectInfo` returns the current project and AE state.
- [ ] **2.5 Prove one reversible write.** Create a uniquely named temporary composition, inspect it, delete it, and confirm it is gone.
- [ ] **2.6 Confirm every result is fresh.** Zero stale warnings, mismatched IDs, orphaned `pending` commands, or blind fixed-delay reads.

## Phase 3 — Define the deterministic motion fixture

- [ ] **3.1 Write `fixtures/e2e-motion-project.md`.** One native, asset-free, plugin-free vertical motion piece: `1080×1920`, 30 fps, 6 seconds.
- [ ] **3.2 Use unique, inspectable layer names.** Minimum fixture:
  - `E2E_BG` — full-frame solid.
  - `E2E_ORBIT` — stroked ellipse/shape with animated Trim Paths.
  - `E2E_MATTE_TITLE` — explicit reveal matte.
  - `E2E_TITLE` — live text with a text animator.
  - `E2E_ACCENT` — shape with keyframed Position/Scale and Easy Ease.
  - `E2E_CTRL` — null parent for at least one child layer.
  - `E2E_GRADE` — adjustment layer with one native effect.
- [ ] **3.3 Make the fixture exercise the real surface.** Composition creation, shape/text/solid/null creation, layer reorder, parenting, keyframes, easing, expression or text animator, Trim Paths, track matte, blend mode/effect, inspection, project save, frame save, and video render.
- [ ] **3.4 Keep file paths explicit across OSes.** Paths consumed by After Effects use Windows form (`C:/…`); WSL verifies the same outputs through `/mnt/c/…`. Do not pass a WSL-only path to ExtendScript.
- [ ] **3.5 Define a unique run ID.** Names and output folders include the date/time so a retry cannot mutate or “pass” against an old comp or file.
- [ ] **3.6 Define visual acceptance before the run.** At 0s the title is hidden; mid-animation the orbit/title reveal is visible; at the final frame all hero elements are settled, centered, and readable with no empty-frame edges.

## Phase 4 — Execute and pass the full workflow

- [ ] **4.1 Start from a clean, user-approved AE project.** No existing client project may be the test target.
- [ ] **4.2 Run a preflight.** Record git commit, Node version, AE version, build hash, installed-panel hash, bridge path, and positive liveness.
- [ ] **4.3 Build the fixture sequentially.** Confirm each correlated result before issuing the next dependent command.
- [ ] **4.4 Verify structure.** `getProjectInfo`, `listCompositions`, `getLayerInfo`, and `get-layer-details` must confirm the expected comp settings, unique layer names/count/order, parent, 3D/blend/matte state, masks, and effects.
- [ ] **4.5 Verify animation operations.** Each keyframe/ease/expression/text-animator/Trim-Paths command returns success; any warning is a failed gate until explained.
- [ ] **4.6 Save the project through MCP.** `save-project` writes a new `.aep`; the WSL mirror exists, is non-empty, and its SHA-256 is recorded.
- [ ] **4.7 Save three frames through MCP.** Capture start, midpoint, and final PNGs; inspect all three visually and record findings.
- [ ] **4.8 Render through MCP.** Use an installed/default output-module template, write a deterministic video path, and verify the file exists, is non-empty, has the intended duration/dimensions, and plays.
- [ ] **4.9 Reopen and inspect persistence.** After a clean AE restart, open the saved `.aep`, restore the panel, and confirm the comp/layers still match.
- [ ] **4.10 Write `test-runs/<run-id>/REPORT.md`.** Include every artifact path/hash, commands exercised, failures/retries, screenshots, and an explicit verdict.

### Full-workflow pass criteria

| Gate | Passing evidence |
|---|---|
| Revision parity | Source, generated build, active MCP config, and installed panel identify the same accepted commit |
| Liveness | Three positive correlated probes, including one after AE restart |
| Build | All required named layers and motion operations created with zero unexplained errors/warnings |
| Inspection | Reported comp/layer/effect/matte/parent state matches the fixture |
| Persistence | New `.aep` exists, reopens, and preserves the inspected state |
| Visual | Start/mid/end PNGs match the predefined visual states |
| Render | Video exists, is non-empty, has expected metadata, and plays |
| Freshness | Zero stale results, command-ID mismatches, overwritten pending commands, or false queue success |

**Only when every row passes may this tracker say “Full motion-project workflow — ✅ PASSED.”**

## Phase 5 — Consolidate, document, and pin

- [ ] **5.1 Update `README.md` from tested behavior.** Remove claims that were not exercised; document WSL output-path rules and the exact self-test/live-test commands.
- [ ] **5.2 Update the motion operator documentation.** The current operator notes still say no render tool exists; change them only after `render-video` passes live.
- [ ] **5.3 Update root `CODEX.md` / `CONTEXT.md`.** Point future sessions to this fork as canonical and remove the obsolete claim that the runtime lives under `knowledge/skills/ae-mcp/dakkshin/`.
- [ ] **5.4 Decide the accepted branch shape.** Fast-forward/merge the tested integration commit into the fork's mainline; do not leave production depending on an unexplained local branch.
- [ ] **5.5 Pin the parent repository's submodule pointer** to the accepted commit and verify a fresh submodule checkout can build.
- [ ] **5.6 Open focused upstream PRs where useful.** Keep reliability fixes separate from the large community tool bundle so upstream review remains tractable.

---

## Cross-cutting checklist

- [ ] **Never build from detached upstream while the integration build is live.**
- [ ] **Never copy the stale staged panel over the installed panel.**
- [ ] **Close the panel/AE before replacing the installed JSX; restart afterward.**
- [ ] **Restart the MCP host after changing `build/index.js`.**
- [ ] **One command in flight at a time** until a real queue/transaction layer exists.
- [ ] **Use names for fixture identity and re-resolve indices after layer add/delete/reorder.** AE indices are 1-based and shift.
- [ ] **Treat “queued” as pending, not success.** Success requires the correlated panel result.
- [ ] **No live test against a client `.aep`.** Use a clean, uniquely named test project and output directory.
- [ ] **No third-party plugins or imported assets in the first fixture.** Native-only keeps the failure domain inside this MCP.
- [ ] **Do not commit large `.aep`/video binaries by accident.** Commit the report and small approved evidence; record hashes/paths for larger artifacts.
- [ ] **Do not claim rendered output until the file has been inspected.**

## Known constraints

- The ScriptUI panel is not headless. It closes when AE restarts and must currently be reopened by a human.
- The bridge uses one command JSON file and one result JSON file. It is a single-slot transport, not a queue.
- Node runs in WSL while ExtendScript runs in Windows. Bridge paths and media/project output paths have different path syntax.
- The first self-test proves the MCP server path and a timeout response; it does **not** execute ExtendScript.
- `get-layer-details` currently reports effects, masks, parent, blend, 3D, and timing, but not a complete keyframe/easing/expression tree. The command acknowledgements plus frame evidence must cover that gap for the first run.
- The existing `test-animation` tool creates a script for manual execution and bypasses the bridge; it is not evidence for the full MCP workflow.

## Decisions already made

- **First acceptance lane:** native build-from-scratch, not Figma/AEUX.
- **Target application:** Windows Adobe After Effects 2024.
- **Target format:** vertical `1080×1920`, 30 fps, 6 seconds.
- **Current acceptance includes render.** The integration prototype claims `render-video`; the “full” test must either prove it or fail honestly.
- **Human actions allowed:** launch/restart AE, enable scripting access, open the panel, and reopen the saved project. No human timeline edits are allowed during the test.

