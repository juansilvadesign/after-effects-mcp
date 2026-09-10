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
| R16 | **Layer lifecycle + time placement** | `move-layer` | ⛔ There is **no delete-layer**, and **`move-layer` reorders the stack only** (`front`/`back`/`before`/`after`/`toIndex` — no time argument). So a layer's `startTime`, in/out points and time-stretch cannot be set, and a wrong layer cannot be removed. Combined with R15 this makes the master comp a **human-only artifact from creation through layer timing**. Add: delete, duplicate, set start/in/out, time-stretch, enable/solo/lock. |
| R17 | **Address comps and layers by NAME everywhere** | Tool surface | ⛔ **`setLayerKeyframe` and `setLayerExpression` require `compIndex` — the project-panel index — while every other tool takes `compName`** (`apply-trim-paths`, `add-text-animator`, `set-keyframe-ease`, `apply-effect`, `get-layer-details`, `save-frame`, `render-video`). At ~95 comps the index is impractical to obtain: **`listCompositions`' order is NOT the project item index** (folders and footage occupy indices too), and nothing resolves name → index. Also missing: a **`set-active-comp`** tool. Cost in the field: 7 keyframes were sent to `compIndex: 1` and all 7 returned *"Composition not found at index 1"* — the comp was at 2, found only by trial. |
| R18 | **Mutate composition settings** | `create-composition` | Nothing can change an existing comp's frame rate, duration, resolution or background. AEUX imported every comp at **60fps/5s**, and the target was 30fps/14s; the only options were to re-time in ffmpeg or have a human open Composition Settings. (Here 60fps was *kept* as a quality win — but that was luck, not control.) |
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
