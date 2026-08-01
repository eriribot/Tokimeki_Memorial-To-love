---
name: aldent-harness
description: Use when substantial AI changes need human-reviewed acceptance, especially prompt/preset, webgame or Galgame, same-layer UI, database/plugin/host hooks, shujuku, Tavern inline bundles, universal or production-ready pattern claims, or tests that may be passing the wrong contract.
---

# Aldent Harness

**Version:** 1.0.1

## Outcome

Deliver one reproducible package inside the authorized scope. AI checks are evidence; a human decides acceptance and later scope.

## Current-loop contract

- An explicit request or completed review form authorizes one implementation loop.
- Finish that change, run non-destructive validation, and fix failures caused by it.
- Do not add adjacent cleanup, new features, external writes, destructive actions, or new side-effecting host/plugin chains without authorization.
- When reviewable, emit the review result for the active output gear and freeze modifications; only `实战验收` expands the full review invitation.
- No completed human review form means no next implementation loop.

## Evidence contract

- Report checks as `passed`, `failed`, or `not run`; evidence is not acceptance.
- Use the strongest connection label proved by runtime evidence.
- For host work, separate generation, host-message, plugin/database, and UI-mirror paths.
- A check cannot validate itself by weakening the expected behavior, changing the fixture to match the implementation, or reading a stale artifact.
- Stop when missing evidence could change a real side effect or allowed path; otherwise disclose the uncertainty.

## Output gears

- `普通出击`（默认）：短报结果、本轮出击范围、`failed/not run` 和需要人的决定；通过项只汇总，不展开 eval 或证据账本。
- `模拟战`（找问题时）：只有失败难复现、反复回归、语义争议或宣传结论待核实时，才展开 frozen case、eval、逐项证据或 claim ledger。
- `实战验收`（高风险或真实链路）：使用完整审查邀请。UI 先做人工视觉与交互验收；模拟战补可重复检查，不替代人的观感。

机器字段继续使用原名；对人说明时优先说“出击范围、模拟战、实战、战斗记录、整备、下一次出击”。

## Workflow

1. State result, authorized scope, untouched paths, and acceptance evidence.
2. Read only matched references; implement and validate the scope.
3. Update the project's current Aldent status when present.
4. 普通出击给短版审查结论；实战验收才展开 `references/aldent-review-invitation.md`。发出后停止编辑。

## Reference routing

Read only the rows that match the task:

| Trigger                                                | Required reference                                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Scope or connection points                             | `references/aldent-components.md`                                                              |
| Named module or cross-module authority                 | `references/module-registry.md`                                                                |
| Universal/default/production-ready claim or UI shell   | `references/experience-pattern-maturity.md`                                                    |
| Semantic tests, fixtures, stale artifacts, counterevidence | `references/experience-semantic-acceptance.md`                                              |
| Tavern inline HTML or regex replacement artifact       | `references/tavern-inline-bundle-safety.md`                                                    |
| Replay, regenerate, import/export, prompt history      | `references/experience-message-pollution.md`                                                   |
| Selective worldbook/character context                  | `references/experience-worldbook-routing.md`                                                   |
| Real hidden host floors, shujuku, ACU, qrf_plot        | `references/experience-host-floor-bridge.md`                                                   |
| Isolated and normal host routes                        | `references/experience-host-hook-isolation.md`                                                 |
| Entrypoint/state/prompt/action/render boundaries       | `references/experience-module-boundaries.md`                                                   |
| Cross-task review recovery                             | `references/experience-review-record.md`                                                       |
| Same-layer CSS or host avatar/layout pollution         | `references/experience-same-layer-style.md`                                                    |
| Webgame/Galgame options, settlement, regenerate        | `references/experience-webgame-galgame.md`                                                     |
| Correct state but stale visible identity               | `references/experience-identity-display.md`                                                    |
| Layered portrait sheets, masks, coordinates, animation | `references/experience-layered-portrait.md` and `references/gal-layered-portrait-animation.md` |
| Aggregate many read-only results                       | `references/programmatic-evidence-collection.md`                                               |

Use `references/experience-library.md` only as a human-facing index; do not load it as a substitute for the matched file.

## Review and resumption

- 普通出击使用短版审查结论；实战验收使用 `references/aldent-review-invitation.md`。下一轮仍由 human 完成 `references/aldent-human-review-form.md`。
- Extract allowed issues, forbidden content, criteria, evidence, and stop conditions.
- `references/next-loop-contract.md` is an AI-generated normalization; never ask the human to fill both.

The next loop may implement only the normalized approved scope.

## Maintenance

修改本 Skill 或任一 reference 时，同一改动必须 bump 上方版本并追加 `CHANGELOG.md`；除此之外不增加发布仪式。
