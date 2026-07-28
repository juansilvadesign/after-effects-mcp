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
