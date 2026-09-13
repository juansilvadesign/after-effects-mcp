# After Effects MCP Fork — Roadmap (post first full-workflow pass)

> Deliberately **outside** the current acceptance build in [`TASKS.md`](TASKS.md). The immediate job is one deterministic, native build-from-scratch project that passes end to end. This table keeps later capability work visible without expanding that first failure domain.
>
> This follows the audit-engine deferred/v2+ format rather than a deadline-based release roadmap: the work is evidence-gated, and the next item is promoted only after the current live test passes.

| # | Item | Extends | Why deferred / notes |
|---|---|---|---|
| R1 | **Figma → AEUX → MCP imported-assets acceptance lane** | First E2E fixture | Prove the MCP alone first. Then test the named-layer contract from `storyboard-director`: Figma layer names survive AEUX, the operator resolves name → current index, and missing/drifted names fail closed. |
| R2 | **Real command queue + per-request result files** | File bridge | The current single command/result pair can overwrite concurrent work. Replace it with an inbox/outbox or append-only request directories, acknowledgements, retries, and cleanup before multi-agent or batch use. |
| R3 | **Synchronous MCP mutations / job handles** | Tool handlers | Most tools currently return “queued” and require a later `get-results`. Return the correlated result directly for short work and a job ID for long renders; reserve `get-results` for explicit job polling. |
| R4 | **Panel auto-start / persistent bridge host** | ScriptUI lifecycle | Today a human must reopen a floating panel after every AE restart. Investigate a startup script, CEP/UXP host, or another Adobe-supported persistent mechanism; do not label the current ScriptUI palette headless. |
| R5 | **Render-template discovery and stable media delivery** | `render-video` | Enumerate installed output-module templates, validate extension/codec compatibility, report render progress/cancel state, and optionally hand off to Adobe Media Encoder. The first test uses one known installed/default template only. |
| R6 | **Visual regression harness** | `save-frame` | Store approved start/mid/end reference frames, perceptual diffs, tolerances, and contact sheets so a tool change cannot silently alter the motion result. Keep human visual approval for composition quality. |
| R7 | **Deep motion introspection** | `get-layer-details` | Report transform values, keyframes, interpolation/ease, expressions, text animators, Trim Paths, matte source, motion blur, effect parameters, and comp render settings—not only layer/effect summaries. |
| R8 | **Transactional project safety and rollback** | Project mutation | Add undo groups, dry-run/preflight, explicit target-project identity, optional scratch-project creation, and rollback/cleanup after partial failures. Never let an automation test touch an unsaved client project. |
| R9 | **Cross-platform installer and path contract** | WSL/Windows/macOS setup | Detect native Windows vs WSL vs macOS, install the correct panel safely, normalize AE-facing vs host-facing paths, verify hashes, and remove the duplicate `knowledge/skills/ae-mcp/dakkshin/` runtime. |
| R10 | **Executable AE build-spec runner** | Motion suite | Compile a `motion-director` spec into an ordered, resumable command plan with name-based targeting, checkpoints, and a final conformance report. Start only after the low-level tools are trustworthy. |
| R11 | **Reusable native motion primitives** | Tool surface | Add pre-comps, camera/null rigs, motion-blur controls, adjustment/grade recipes, anchor-point helpers, safe-area guides, and expression controls as tested high-level operations—not one-off scripts. |
| R12 | **Imported footage and hybrid/3D fixture** | Native fixture | Exercise media import, footage replacement, audio, cameras/lights, renderer selection, and optional installed plugins. These widen the environment matrix and therefore follow the plugin-free native pass. |
| R13 | **Long-run stability and recovery test** | Live bridge | Run repeated builds/renders across AE restarts, injected timeouts, malformed files, and interrupted renders; measure latency and prove recovery without deleting user work. |
| R14 | **Versioned release + upstream contribution strategy** | Fork maintenance | Add changelog, semantic versioning, CI artifacts, compatibility matrix, and small upstream PRs. Keep locally necessary WSL behavior while avoiding a permanent unreviewable mega-diff. |

## Gaps found in the first real imported-assets run (2026-09-10)

> ⭐ **This is R1 actually executed**, on a live job: a 4-scene, 1920×1080 Figma → AEUX → AE build
> (`upos-permissions-loop`, ~95 comps). The named-layer contract **held end to end** — every unique Figma
> name survived AEUX into AE. The items below are the capability holes that stopped the run, and each one
> is a *blocker observed in the field*, not a wishlist entry.
>
> ✅ **Confirmed working, so do not re-litigate:** `render-video` exists and renders (AE 24.2.1x2, `Lossless`
> → AVI) — any doc still saying "build-only, no render tool" is stale; `apply-trim-paths` succeeds on an
> AEUX-imported vector layer (open SVG paths survive); `add-text-animator` succeeds on an AEUX-imported
> text layer (live text survives).

| # | Item | Extends | Why it blocked the run |
|---|---|---|---|
| R15 | **Nest an existing comp as a layer** | Comp structure | ⛔ **Hard blocker.** No tool adds an existing comp into another comp — `create-composition` makes empty comps, `precompose` collapses *existing layers* (the opposite direction), `import-footage` only takes files. A multi-scene master timeline therefore **cannot be assembled through the bridge at all**, and had to be built by hand. This is the single largest hole. |
| R16 | ~~Layer lifecycle + time placement~~ → **ships already; only the MCP surface is missing** | `move-layer` | ⛔🔴 **This row was WRONG — corrected 2026-09-10, see R23.** The loaded panel implements **`deleteLayer`** (resolves the comp **by name**, so the target need not be active), **`duplicateLayer`**, and both **`setLayerProperties`** and **`batchSetLayerProperties`** accepting **`startTime` *and* `outPoint`** — applied in that order, i.e. move-then-trim. All six are on the `run-script` allow-list. **Proven in the field:** 87 layers deleted and 4 scenes placed at 0/3.6/7.8/12.4s over the bridge. ⚠️ Still genuinely absent: **time-stretch**, and enable/solo/lock. Real remaining work = R25 (expose as tools), not re-implementation. |
| R17 | **Address comps and layers by NAME everywhere** | Tool surface | ⛔ **`setLayerKeyframe` and `setLayerExpression` require `compIndex` — the project-panel index — while every other tool takes `compName`** (`apply-trim-paths`, `add-text-animator`, `set-keyframe-ease`, `apply-effect`, `get-layer-details`, `save-frame`, `render-video`). At ~95 comps the index is impractical to obtain: **`listCompositions`' order is NOT the project item index** (folders and footage occupy indices too), and nothing resolves name → index. Also missing: a **`set-active-comp`** tool. Cost in the field: 7 keyframes were sent to `compIndex: 1` and all 7 returned *"Composition not found at index 1"* — the comp was at 2, found only by trial. |
| R18 | ~~Mutate composition settings~~ → **ships already; only the MCP surface is missing** | `create-composition` | ⛔🔴 **This row was WRONG — corrected 2026-09-10, see R23.** **`setCompositionProperties`** exists in the loaded panel and is allow-listed for `run-script`; it sets `duration` (and other comp settings) on an active **or named** comp. ⭐ The 60fps/5s import was ultimately *not* re-timed — 60fps was **kept as the locked quality decision**, and the 5s comps were handled by **trimming each layer in the master** instead, which preserves per-scene headroom. So the field need was never comp mutation at all. |
| R19 | **Batch property/keyframe writes** | `setLayerKeyframe` | One keyframe per round trip **plus a `get-results` poll** to know whether it worked. A 14s four-scene piece is ~60–100 keyframes ≈ **150–200 round trips**, which is slow enough that hand-keyframing in the AE UI is faster than driving it. Accept an array of {layer, property, time, value, ease} and apply under one undo group. |
| R20 | **Fix `save-frame`'s false-negative race** | `save-frame` | ⛔ Returned `"saveFrameToPng reported no error but the output file was not created"` **twice while both files did exist**, written moments later — the existence check races AE's write. A caller that trusts the error concludes the render is broken. Await/retry the stat with a timeout, and never report failure for a file that subsequently appears. ⭐ *An error after the side effect is not a failure.* |
| R21 | **Honour declared script parameters, or reject them** | `run-script` | ⛔ **`getLayerInfo` silently IGNORES a `compName` parameter** and always reads the *active* comp — asked for `UI733_ck_agenda_ver`, it returned `S4_scene_seam`. With no comp open it returns `{"error":"No active composition"}`, so the one call that dumps every layer at once is unavailable exactly when it is most useful. Either read the parameter or refuse it; a script that accepts a parameter object it does not consult is worse than one that takes none. |
| R22 | **AEUX dual-import lint** | R1 acceptance lane | ⛔ AEUX imports **both a comp and a flattened PNG for every Figma frame**, with confusable names (`S1_scene` vs `S1_scene_22013-2740.png`). A master built on the raster twins renders **none** of the animation — no live text, no shape paths — and looks identical in the viewer. Add a lint that flags any comp whose layers reference a raster twin of an available comp. Cost in the field: a 95-layer master was assembled from the wrong items and had to be rebuilt. |

### Field evidence attached to existing rows

- **R2** (command queue) — ⛔ confirmed as a *correctness* bug, not just concurrency: firing 7 mutations without
  polling meant the single result file overwrote **7 consecutive failures unread**, and the comp looked built.
  ⭐ The first diagnosis ("the bridge drops unread commands") was **wrong** — the commands ran and *failed*.
  Fire-and-forget does not lose work here; it **hides errors**. That is the stronger argument for R2.
- **R3** (synchronous mutations) — the mismatch guard is good and should be kept: `get-results` correctly
  reports `commandId` mismatch rather than returning a stale result as if fresh.
- **R4** (panel lifecycle) — the panel went unresponsive mid-session (`panelResponsive: false` at 10s **and**
  15s) and needed an AE restart plus a manual reopen. ⭐ `bridge-status` reporting the **project name**
  (`upos-test.aep` vs `Untitled Project`) is the cheapest available "was this saved before the restart" check.
- **R7** (deep introspection) — ⛔ `get-layer-details` returns **no transform or keyframe data**, so it cannot
  verify that a keyframe landed. The workaround was to render two frames and compare bytes: identical
  `29,255 / 29,255` proved keyframes were absent; `7,210` (empty) vs `43,439` (populated) proved they applied.
  A `getLayerProperties` that reports values + keyframes would have replaced two renders and a hash compare.

## Second imported-assets run (2026-09-10/12) — two roadmap rows were WRONG, and one split install explains both

> ⭐ **R1 executed again, and it finished the job R15/R16 had declared impossible.** The 4-scene master
> `MASTER_permissions_loop` went from 91 layers to exactly 4, timed to 0 / 3.6 / 7.8 / 12.4s, contiguous and
> ending on 14.0s — **entirely over the bridge**: 87 `deleteLayer` calls plus **one** `batchSetLayerProperties`.
>
> ⛔🔴 **Why the first run concluded the opposite: two different panels share one filename.** Every capability
> R16 and R18 called missing was read from the repo's `src/` copy. The panel After Effects actually loads is
> the larger `build/` one, and it has all of them. A roadmap row asserting a capability is absent, sourced from
> the wrong copy, is more expensive than a missing row — it re-plans work around a hole that is not there.

| # | Item | Extends | Why it matters |
|---|---|---|---|
| R23 | **Reconcile the panel copies, and fix `install-bridge.js`** | Repo integrity | ⛔🔴 **Highest-severity repo defect found so far.** `mcp-bridge-auto.jsx` exists in three locations with **two** contents: the installed panel and `build/scripts/` are **119,937 B**; `src/scripts/` **and** the bridge working dir are **75,293 B**. The stale copy is missing **22 commands** — including `applyTrimPaths`, `addTextAnimator`, `precompose`, `moveLayer`, `saveFrame`, `renderComposition` and even `ping` (so `bridge-status` itself would stop answering). ⛔ **`install-bridge.js` copies from `src/`**, so a routine reinstall silently **downgrades a working install and deletes 22 commands with no error.** Make `build/` the single source, have the installer verify a hash post-copy, and fail loudly on a capability regression. |
| R24 | **Fix the command-status writeback race** | File bridge / R2 | ⛔🔴 **Silent, reproducible command loss.** The panel calls `updateCommandStatus("completed")` *after* writing its result, by re-reading `ae_command.json` and rewriting it. If the caller has already queued the next `pending` command, that writeback stamps **the new command** `completed`, and it **never executes** — no error, on either side. **Cost in the field: 3 of the first 32 deletes silently did not run** and were only caught by re-reading the comp's layer count. Fix: make the writeback match on `commandId` and refuse to modify a command it did not execute. Interim workaround: leave ~1.3 s after a result before queuing the next (58/58, zero errors). |
| R25 | **Expose panel-only commands as first-class MCP tools** | Tool surface | **A capability nobody can see does not exist.** `deleteLayer`, `duplicateLayer`, `batchSetLayerProperties`, `setCompositionProperties`, `createCamera` and `setLayerMask` are implemented in the panel and allow-listed for `run-script`, but have **no dedicated MCP tool** — so they are invisible in the tool list while `precompose`, `move-layer` and `delete-composition` are not. That asymmetry is exactly why R16 and R18 were written as blockers. Promote them, or document `run-script` as the supported path for each. |
| R26 | **Refuse, or repair, an unsaved project** | Panel lifecycle / R4 | ⛔ **The panel does not run commands when the open project is new/unsaved** — commands sit `pending` and the caller only sees a timeout. Recovery is to close AE, reopen the saved `.aep` from disk, then reopen the panel. ⭐ `bridge-status` already reports the project name, so the panel can detect this itself: on an unsaved project it should say so explicitly rather than silently not polling. |
| R27 | **Report a layer's SOURCE TYPE** | `get-layer-details` / R22 | ⛔ **No read command exposes whether a layer's source is a `CompItem` or a `FootageItem`**, which is precisely the comp-vs-raster-twin distinction R22 needs — and the installed `getLayerInfo` returns **neither `type` nor `startTime`** (the `src/` copy returns both; another face of R23). The only workaround found is **set equality against `listCompositions`**, which enumerates `CompItem`s exclusively: if every layer name in a comp resolves to a listed composition, no raster twin is present. That works, but it is an inference, not a read. |

### Field evidence attached to existing rows

- **R21** (declared parameters ignored) — ⭐ **confirmed a second time, independently, and now with its
  counter-example.** Asked `getLayerInfo` for `S1_scene` (4 layers) and received the **active** comp's **91**
  layers, no error. ⛔ A verification written against the repo's `src/` copy — which *does* honour the
  parameter — would have silently read the **wrong composition and reported PASS**. The sibling
  **`get-layer-details` DOES honour `compName`**, proven by a clean `Layer not found` at index 5 of the
  4-layer comp, where the ignoring version would have returned the active comp's layer 5. ⭐ A
  refusal-vs-value probe is what made this decidable; two reads that merely agree would not have.
- **R17** (name addressing) — `set-active-comp` is now **load-bearing, not convenience**: because
  `getLayerInfo` only ever reads the active comp (R21) and nothing can change it over the bridge, the one
  bulk-read tool is unreachable for any comp a human has not opened by hand.
- **R19** (batch writes) — ⭐ partially solved already: `batchSetLayerProperties` applies `startTime`,
  `outPoint`, position, scale, rotation, opacity, blend mode and 3D across many layers in **one** call. The
  gap is now specifically **keyframes**, which still cost one round trip each. ⭐ Interim pattern for bulk
  work: drive `ae_command.json` directly and poll `ae_mcp_result.json` for a matching `_commandId`, instead
  of paying two MCP calls per operation — 87 deletes ran as a single loop that way. Poll interval is 2000 ms.
- **R22** (AEUX dual-import lint) — ⭐ refined: the twins are imported into per-scene `Images` **folders** and
  survive as project items even after their layers are removed, so they stay a re-drag hazard. A lint should
  flag the *items*, not only their use.
- **R6 / R20** (`save-frame`) — no recurrence this run; the earlier false-negative race still stands unfixed.

## Out of scope for the first pass

- Designing production PsiAtiva/Locuz client motion.
- Figma authoring, AEUX fidelity, or layer-manifest debugging.
- Generative video (Higgsfield, Veo, Sora) and third-party particle/3D plugins.
- Publishing to Instagram, YouTube, or any client delivery channel.
- Multi-agent/concurrent AE control.
- Claiming unattended/headless AE operation while a human-opened ScriptUI panel remains required.

## Parking lot

- Read active fonts and substitute deterministically when a requested font is unavailable.
- Inspect installed effects/plugins and expose a capability manifest to the motion planner.
- Add project folders, labels, shy/lock switches, guide layers, and naming lint.
- Generate a compact HTML test report/contact sheet from the three saved frames.
- Record command latency and identify operations that need longer job timeouts.
- Add a safe “re-run from checkpoint” mode instead of rebuilding a whole comp after one failed command.
- Resolve `compName` → `compIndex` as a first-class helper, so index-only tools stay usable at ~100 comps.
- A non-destructive **identity probe**: `setLayerExpression` with `expressionString: ""` is a harmless no-op
  whose receipt names the layer it resolved — the only way found to identify which comp an index points at.
  Expose that intent directly instead of relying on a side effect of a removal.
- Report whether an AEUX-imported layer is a **shape/text/raster** layer, so callers stop having to prove it
  by attempting `apply-trim-paths` / `add-text-animator` and reading the error.
- Expose comp **item id** (stable across panel reordering) as an addressing option alongside name and index.
