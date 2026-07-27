# 艾尔登特当前状态

```yaml
status: implementation_updated_user_manual_test_pending
current_loop: fixed_width_resource_values_and_rest_only_limit_2026-07-27
authorized_by: user_identified_multi_digit_stress_and_full_stress_rest_only_case_2026-07-27
authorized_scope:
  - reserve stable three-character numeric width for stamina and stress values from 0 through 100
  - when stamina is 0 or stress is 100, disable non-rest personal actions and character talk
  - keep rest executable at the resource limit and enforce the same rule inside the action handlers
  - preserve the system-title-row resource placement without restoring the removed divider
forbidden_scope:
  - change AP costs, resource deltas, maximum values, dates, story settlement, saves, prompts, or host/plugin chains
  - run tests, builds, formatting, lint, browser automation, or screenshots against the user's explicit no-test request
untouched_scope:
  - playerStore resource formulas and schema, gameStore settlement, story modules, save/message modules, and Tavern bridges
verification:
  passed:
    - static source inspection confirms both values reserve 3ch and use tabular numerals
    - static source inspection confirms non-rest activity and talk buttons share the resource-limit guard
    - static source inspection confirms handlers reject bypassed non-rest actions while rest bypasses that guard
  failed: []
  not_run:
    - TypeScript, lint, build, browser, screenshot, and inline artifact checks by explicit user request
connection: local_store_backed_ui_and_settlement_only
human_review: pending_user_visual_and_interaction_confirmation
```

```yaml
status: implementation_updated_user_manual_test_pending
current_loop: nearest_same_name_wrapper_pair_isolation_2026-07-27
authorized_by: user_runtime_screenshot_showed_planning_text_entering_gal_despite_wrapper_contract_2026-07-27
authorized_scope:
  - replace non-overlapping whole-response wrapper regex selection with nearest same-name token pairing
  - select only the most recent complete supported wrapper and discard all text outside its exact opening/closing boundaries
  - keep tolerant cue defaults inside the selected body without allowing them to admit container-external planning text
  - update active module and Aldent documentation for the corrected isolation boundary
forbidden_scope:
  - add, edit, or run tests or test scripts
  - run lint, TypeScript, builds, browser automation, screenshots, inline checks, or real Tavern generation
  - change prompts, worldbook content, story beats, minimum line count, required scene sequence, AP/date/affection settlement, persistence, or rendering
  - claim the screenshot proves the exact hidden raw Assistant tag nesting beyond the visible leaked planning text
untouched_scope:
  - story templates and lore, stores, settlement, save/message ownership, generation and World Info hooks, portrait assets, renderer, and host bridges
connection_state: wrapper_isolation_source_updated_only_no_generated_artifact_or_real_tavern_rerun
overall_connection_label: 正文边界已改为最近同名标签对隔离；等待用户在真实酒馆手工确认规划文字不再进入 GAL
verification:
  passed:
    - source inspection confirms an unmatched earlier playable opening can no longer consume the closing tag of a later complete wrapper
    - source inspection confirms only text sliced between the selected opening end and matching closing start reaches cue normalization
  failed: []
  not_run:
    - all automated tests and test scripts, by explicit user request
    - lint, TypeScript, development/production build, browser review, screenshots, and inline artifact verification
    - corrected real Tavern replay of the screenshot floor
evidence:
  - extraction keeps an independent opening stack per supported tag name and pairs each close with the nearest preceding open
  - malformed or unsupported planning tags never enter those stacks
  - MODULES.md records the corrected exact-wrapper boundary
human_review: pending_user_real_tavern_replay_and_visible_text_review
counterevidence:
  - the screenshot proves leaked planning text but does not expose the full raw tag sequence needed to reconstruct the exact malformed nesting
  - no fresh dist artifact was built, so the current inline HTML does not contain this source correction yet
```

```yaml
status: implementation_updated_user_manual_test_pending
current_loop: tolerant_gal_cue_defaults_plain_lines_and_string_concat_unwrap_2026-07-27
authorized_by: user_reported_missing_expression_exact_line_rejections_and_supplied_real_raw_shape_2026-07-27
authorized_scope:
  - replace cue-field rejection with code-owned defaults constrained by current-act scenes, cast, portrait rules, and character manifests
  - fall back from haruna/changer-room panic to that rig's registered default expression shy
  - accept full cues, partial cues, speaker-prefixed lines, and plain narration while carrying the previous valid scene/focus when appropriate
  - unwrap the supplied JavaScript-style newline concatenation around the parsing copy without changing the archived Assistant raw text
  - stop rejecting an otherwise playable story solely because every line is narration
  - update active module and Aldent documentation for the tolerant normalization contract
forbidden_scope:
  - add, edit, or run tests or test scripts
  - run lint, TypeScript, builds, browser automation, screenshots, inline checks, or real Tavern generation
  - change prompts, worldbook content, story beats, minimum line count, required scene sequence, AP/date/affection settlement, persistence, or renderer assets
  - claim real Tavern, host-message, plugin, shujuku, ACU, or database verification
untouched_scope:
  - story templates and lore, stores, settlement, save/message ownership, generation and World Info hooks, portrait assets, rendering components, and host bridges
connection_state: extraction_and_cue_normalization_source_updated_only_no_generated_artifact_or_real_tavern_run
overall_connection_label: 字符串拼接外壳与不完整演出字段已由代码宽容归一；等待用户在真实酒馆手工确认
verification:
  passed:
    - supplied representation shows newline-plus-quote concatenation that would cause exact-format rejection if those characters are literal Assistant text
    - source inspection confirms haruna/changer-room resolves an unavailable panic expression to its registered default shy
    - source inspection confirms plain and speaker-prefixed lines produce complete StoryPresentationCue values instead of the former exact-format error
    - source inspection confirms scene-specific portrait rules and current-act cast restrictions still bound any rendered portrait
  failed: []
  not_run:
    - all automated tests and test scripts, by explicit user request
    - lint, TypeScript, development/production build, browser review, screenshots, and inline artifact verification
    - corrected real Tavern generation with the user's exact Assistant output
evidence:
  - storyTextExtraction restores literal concatenated newline boundaries only in the extracted parsing copy
  - storyPresentation resolves missing or invalid scene, focus, portrait, expression, and effect values through current act metadata and character defaults
  - paragraph parsing carries the previous normalized presentation forward, while the first line starts from the act's first registered scene
  - tavernStoryGeneration retains empty-body, minimum-line, required-scene, and JSON guards but no longer requires at least one parsed speaker
  - MODULES.md records the distinction between strict prompt guidance, tolerant runtime normalization, and unchanged raw-message archival
human_review: pending_user_real_tavern_generation_and_visual_cue_review
counterevidence:
  - the screenshot proves three parse failures but does not prove whether the pasted newline-plus-quote concatenation is literal Assistant text or a console/source representation
  - if those concatenation markers are display-only, the supplied cue lines are syntactically valid and only haruna/changer-room panic needs fallback
  - source inspection does not prove the supplied raw output will satisfy the unchanged minimum-line and required-scene checks after normalization
  - no fresh dist artifact was built, so the current inline HTML does not contain this source correction yet
```

```yaml
status: implementation_updated_user_manual_test_pending
current_loop: tolerant_complete_playable_wrapper_extraction_2026-07-27
authorized_by: user_reported_valid_content_rejected_and_requested_simple_tag_matching_without_tests_2026-07-27
authorized_scope:
  - replace whole-response supported-tag counting with direct multiline matching of complete same-name playable wrappers
  - use the last complete supported wrapper when planning text repeats tag examples before the final正文
  - discard text outside that wrapper and strip inner tag markup before the existing line-level GAL parser
  - update active module and Aldent documentation to match the relaxed extraction behavior
forbidden_scope:
  - add, edit, or run tests, test scripts, lint, TypeScript, builds, browser automation, screenshots, or inline checks
  - change the generation prompt, line-level GAL protocol, story beats, AP/date/affection settlement, persistence, or rendering
  - claim real Tavern, host-message, plugin, shujuku, ACU, or database verification
untouched_scope:
  - Tavern generation and World Info hooks, stores, story templates, presentation validation, save/message modules, and host bridges
connection_state: extraction_source_updated_only_no_generated_artifact_or_real_tavern_run
overall_connection_label: 正文容器改为宽容的跨行完整标签对检索；等待用户在真实酒馆手工确认
verification:
  passed:
    - source inspection confirms the required-wrapper route no longer rejects a valid final wrapper because other supported tags appeared elsewhere
    - source inspection confirms multiline body capture and the existing downstream line-level parser remain in place
  failed: []
  not_run:
    - all automated tests and test scripts, by explicit user request
    - lint, TypeScript, development/production build, browser review, screenshots, and inline artifact verification
    - corrected real Tavern generation and malformed planning-tag reproduction
evidence:
  - storyTextExtraction now searches complete supported same-name pairs with a multiline regular expression and selects the last complete match
  - requirePlayableWrapper returns the selected body after tag-markup removal instead of recursively treating inner supported tag names as more wrappers
  - MODULES.md separates the prompt's one-wrapper instruction from the runtime extractor's tolerant acceptance behavior
human_review: pending_user_real_tavern_generation_result
counterevidence:
  - source inspection is not runtime acceptance and cannot prove the user's exact preset output until they regenerate in Tavern
  - no fresh dist artifact was built, so the existing inline HTML does not contain this source correction yet
```

```yaml
status: implementation_updated_user_manual_test_pending
current_loop: controls_resource_status_between_system_and_personal_actions_2026-07-27
authorized_by: user_explicit_final_placement_and_no_more_tests_2026-07-27
authorized_scope:
  - keep the blue heart-pulse stamina and orange gauge stress treatment approved from the trial sketch
  - show the live stamina and stress values from playerStore beside those labels
  - place the resource block in the right side of the System group, immediately left of the Personal Actions group
  - keep the six exact attribute values below the System row and do not restore the removed standalone StatPanel
forbidden_scope:
  - run builds, formatting, lint, browser automation, screenshots, inline checks, or other tests after the final placement correction
  - change playerStore values, activity settlement, AP/date/story behavior, persistence, prompts, or Galgame rendering
  - claim real Tavern, host-message, plugin, shujuku, ACU, or database verification
untouched_scope:
  - stores, settlement services, story modules, save/message modules, host bridges, and archive presentation
connection_state: Controls reads the existing authoritative playerStore values; final placement is source-updated but not rebuilt or browser-checked by user request
overall_connection_label: 已接入真实状态读取（playerStore）；最终位置等待人工页面确认
verification:
  passed:
    - source inspection confirms System now renders buttons and the live resource block in one system-control-main row, with six attributes after that row
  failed: []
  not_run:
    - Prettier and ESLint after the final placement correction, by explicit user request
    - development/production build after the final placement correction, by explicit user request
    - desktop and 844x390 browser review after the final placement correction, by explicit user request
    - exact Tavern inline safety check because verify-inline-bundle.mjs is absent and the final source was not rebuilt
evidence:
  - Controls subscribes directly to stamina/stress and renders their values next to the approved heart-pulse/gauge icons
  - App.css gives system-control-main a buttons-left/resources-right grid; the Personal Actions group remains the next outer grid column
  - MODULES.md records the final resource and six-dimension placement
human_review: pending_user_visual_confirmation_in_the_target_game_frame
counterevidence:
  - the earlier local screenshots and production hash were captured before the user's final placement correction and are superseded for layout acceptance
  - dist/webgame-ui/index.html still represents the pre-correction layout because the user stopped further builds/tests
  - earlier standalone-browser Tavern save/generation errors only prove the host APIs were absent; they do not affect or validate the final source layout
```

```yaml
status: implementation_updated_user_manual_test_pending
current_loop: remove_adopted_son_older_brother_identity_marker_2026-07-27
authorized_by: user_team_lead_reject_gpt_drafted_identity_loosen_generation_restriction_2026-07-27
authorized_scope:
  - remove the '养子'(adopted son)/'老哥'(older brother) phrasing and its requiredContentMarker hard runtime check from
    GalMainStory/characters/*.ts, all 8 episode act files, data/lore-books/*.txt recovery sources, data/default-cards/*.json,
    and MODULES.md/AGENTS.md/ALDENT_STATUS.md/AI生文与GAL前端整合方案.md/data/lore-books/README.md documentation
  - replace '老哥' dialogue lines in fallbackBeats with '你'
  - update verify-episode03.cjs assertions from requiring the old marker to forbidding '养子'/'老哥' regression
forbidden_scope:
  - change User's underlying protagonist-role authority (still the fixed protagonist living with the Yuuki family)
  - alter Riko's independent childhood-friend identity or Mikan/Lala/Haruna's core relationship functions
  - add, edit or run tests, lint, TypeScript, builds beyond the verification already covered by pnpm build:dev and
    verify-episode03.cjs
connection_state: source_and_recovery_lore_edited_build_and_verify_script_pass_no_real_tavern_worldbook_sync_performed
overall_connection_label: 养子/老哥身份措辞已从运行时合同、恢复源和文档中移除，用户确认已在真实酒馆世界书中同步剔除；等待人工复核
evidence:
  - grep across GalMainStory, data/lore-books, data/default-cards and docs shows no remaining '养子'/'老哥' identity
    assertions outside verify-episode03.cjs's negative guards and one explicit prohibition line in
    tolove-character-mikan.txt
  - requiredContentMarker fields removed from all 4 character loreReferences and all 8 episode act plotLore entries
  - pnpm build:dev succeeded after the edits
  - verify-episode03.cjs passed after updating its assertions to forbid rather than require the old marker
verification_after_latest_change: pnpm_build_dev_and_verify_episode03_cjs_both_passed_locally
human_review: pending_user_review_of_worldview_wording_and_real_tavern_worldbook_consistency
counterevidence:
  - real Tavern worldbook entries were not inspected or modified by the assistant in this loop; user states they
    already removed the phrasing there, but this remains unverified by the assistant
  - a loose untracked-by-runtime file '出包王女 (2).json' at the repo root still contains unrelated explicit content
    and was left untouched as out of scope for this identity-only change
```

```yaml
status: implementation_updated_user_manual_test_pending
current_loop: riko_archive_cursor_identity_and_palette_correction
authorized_by: user_clarified_fix_cursor_shape_and_color_without_reusing_mikan_2026-07-27
authorized_scope:
  - preserve the original slot-12 unlocked Riko character artwork, wink, hair, face, pose, and label
  - recolor only the existing unlocked ellipse and locked-state treatment to a distinct Riko mint/teal palette
  - regenerate cursor_data12 from Riko's own icon_data12a alpha instead of copying Mikan's cursor_data10, while retaining the archive's standard yellow selection color
  - preserve the existing archive paths, dimensions, slot mapping, and 梨子 / ??? labels
forbidden_scope:
  - redraw, mirror, replace, or otherwise modify Riko's character face and hair pixels
  - reuse Mikan's cursor alpha, overwrite Mikan's slot-10 assets, or alter runtime TypeScript/CSS
  - replace the shared yellow selection feedback with a character-specific cursor color
  - change Riko's independent childhood-friend identity or transfer User's protagonist relationships to her
  - add, edit or run tests, lint, TypeScript, builds or browser automation
connection_state: riko_specific_standard_yellow_cursor_and_palette_assets_written_no_automated_validation
overall_connection_label: 梨子原头像保持不变；12 号光标改用梨子自身轮廓并保留统一黄色，椭圆与锁定态使用青绿色，等待用户手工检查
evidence:
  - icon_data12a keeps the original Riko character pixels and only remaps the orange ellipse color
  - icon_data12b keeps its original alpha silhouette and ??? label while shifting the orange/peach treatment to mint/teal
  - cursor_data12 is generated by scaling icon_data12a's own alpha to the existing 149x150 cursor contract and uses the shared #FFDF00 cursor color
  - the previous cursor_data12 was byte-identical to Mikan cursor_data10; the new cursor follows Riko's short hair and ellipse instead
  - Mikan icon_data10a/icon_data10b/cursor_data10 and all runtime code remain untouched
  - no image generation call was needed because the approved correction is a deterministic alpha and palette operation on the original asset
verification_after_latest_change: asset_and_white_background_composite_visual_inspection_only_no_automated_validation_by_user_request
human_review: pending_user_cursor_shape_color_and_runtime_position_review
counterevidence:
  - the rejected replacement chibi and mirrored-eye revisions were fully restored before this cursor-only correction
  - the mint/teal cursor revision was rejected by the user's runtime screenshot because selection color is intentionally shared yellow; only Riko's cursor shape may differ
  - local asset and composite inspection does not prove the final Tavern game-frame appearance
  - no runtime rendering, interaction, build, lint, TypeScript, browser, or test evidence was collected because the user reserved validation
superseded_evidence:
  - the permanent-gender-swapped Riko protagonist and four-act episode-03 package below are invalidated by the user's
    later explicit correction and remain only as failure history
  - ep01-panc-contract invalidated by user runtime screenshot and existing content protocol documentation
  - content-tree-parser acceptance invalidated by a complete content container hidden below malformed planning-tag
    nesting
  - single-content-wrapper acceptance invalidated by the existing 正文/story_scene tags and the user-provided
    story_scence alias
prior_pending_reviews:
  - episode03_aquarium_mutual_confession_anchor_correction
  - data_archive_monochrome_stage_and_manual_summary_disabled_revision
  - memory_plain_text_local_envelope_and_fixed_6_messages_2_5_hierarchy
  - ep01-act01-mikan-runtime-rendering-alignment-fix
  - ep02-act03-mikan-haruna-worldbook-recovery-sources
  - ep01-supported-playable-wrapper-set
  - tokimemo4-special-skill-progression-and-map-drawer
  - worldbook-authoritative-ai-directed-presentation
  - dual-map-landscape-overlay-responsiveness
  - story-progression-character-availability-and-raw-reader
  - merge-local-scenes-with-remote-story-display
  - ep01-act1-background-sequence
  - haruna-cross-page-blink-continuity
completed_human_reviews: []
next_loop: freeze_without_automated_tests_and_wait_for_user_manual_exact_style_result
```

## 2026-07-27：User 主角、三幕整天事件与持续改编 skill v2

- 当前身份权威已经统一：User 是唯一主角、与结城家共同生活；男性梨斗不存在。夕崎梨子是 User
  的青梅竹马、有限情报提醒者和独立可攻略角色，不继承菈菈婚约、美柑亲缘、春菜关系或前三集主角经历。第一、二集的活动模板、恢复源和四份人物 lore 已同步该边界。
- `episodeTemplate.ts` 新增通用 `single-action / whole-day` 时间成本。整天幕只能在当天第一次行动触发；开始生成不会提前跨日，完成或跳过后才由共享 Store
  消耗余下时间、推进一次日期并恢复日初 AP。实现没有第三集 ID 特判，也没有修改存档 schema。
- 第三集改为三个整天幕：`04-11 action 1 / order 155`、`04-12 action 1 / order 156`、`04-13 action 1 / order 157`。
  `04-14` 星期一上学路摔倒属于第三幕尾声，不另建第四幕。event ID 改为
  `main.love-triangle-user-2008-04-11`，避免旧梨子主角版楼层继续满足当前合同。
- 第二幕邀请因果固定为：美柑先邀请春菜第二天同行，菈菈随后撒娇并提出水族馆，春菜最后同意。`04-12`
  不进入水族馆；主体留在 `04-13`。
- 用户手工校对补回第三幕被粗略概述漏掉的情感链：春菜先重提 User 与菈菈“很般配”，再说明自己从初中起就注意到 User 在无人要求时自发照料教室里的花；春菜与 User 都把告白说到开头，随后被菈菈造成的鱼群骚动打断。未完成的告白动作是本集锚点，但关系、路线与好感仍不结算。
- `第三集改编证据.json` 升级为 schema v2，旧梨子主角结论进入 `counterevidence`；每幕同时登记日期、行动序号、`timeCost`
  与 must-keep beats。证据包还冻结了正向改写、漏锚点、角色漂移、因果漂移、时间成本漂移、越界收尾和玩家状态越权七类语义用例；当前只通过结构校验，尚未调用模型执行这些语义用例。`adapt-fandom-episodes` skill 及校验器同步增加活动态脏数据扫描、角色职能映射、因果所有者、整天结算和旧采用楼层失效规则。
- 本地恢复源不能改写真实 Tavern 世界书。实机前仍需替换 `order 100-103`、`150-157`，移除或禁用旧
  `order 158`，再检查加载 marker 与真实生成。

| Check                                      | Status          | Evidence                                                                                 |
| ------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------- |
| Current role and stale-data scan           | passed          | 活动模板、默认卡、人物/剧情恢复源和当前态文档统一为 User 主角、梨子青梅；历史脏数据单列       |
| Whole-day settlement regressions           | passed          | `test:main-story-time` 5/5；另覆盖三幕连续触发并在 4 月 14 日结束                          |
| Episode 03 static contract                 | not run         | verifier 已按最新水族馆锚点改写；遵照用户要求未执行                                        |
| Evidence packet and reusable skill         | not run         | 证据包已同步最新纠正；遵照用户要求未执行 validator 或 skill 校验                           |
| Semantic acceptance fixtures               | not run         | 正向用例已同步双方未完成告白；没有执行结构或模型语义校验                                    |
| Generated semantic execution               | not run         | 尚未让目标模型实际生成并逐例判定接受/拒绝                                                   |
| Changed-source ESLint                      | not run         | 最新 `act03.ts` 与 verifier 修改后未执行                                                   |
| Story text regression                      | not run         | 最新剧情文本纠正后未执行                                                                   |
| Direct webpack development compilation     | not run         | 最新剧情文本纠正后未执行                                                                   |
| Project TypeScript                         | failed-existing | 10 个既有错误位于上下文预览、剧情上下文与记忆摘要模块；本轮文件没有新增报错                 |
| Stale-output retry lifecycle               | failed-existing | 上下文不符的晚到楼层会被拒绝，但切换旧楼层后的 loading 取消/重试仍有既有缺口               |
| Independent skill forward review           | not run         | 先前独立复核早于本次水族馆纠正；本次未重新执行                                              |
| Real Tavern World Info scan and generation | not run         | 真实条目尚未替换，未取得 `WORLDINFO_ENTRIES_LOADED`、宿主楼层或生成正文                    |
| Human story review                         | pending         | 等待用户阅读三幕节拍、称呼、角色声音与情感连续性                                           |

当前最强接通标签：**水族馆互相告白锚点已写入本地合同；未做改后自动验证，等待用户手工测试。**

## 已撤销记录：2026-07-27 梨子主角四幕版第三集

以下内容保留为当时的失败记录，已被本节上方的 User 主角三幕版完全取代，不能再作为当前实现或角色权威。

- 资料策略改为“剧情页给骨架，截图/字幕/时间码锁经典锚点，企划身份表负责改编”。Fandom 第 3 话页能覆盖本集主要事件链，对应漫画章节页补充连续换装、抓娃娃、沛凯耗能和服装店偶遇；两者都不能覆盖用户明确的角色映射。
- `剧情参考/游戏开发知识库/出包王女/第三集改编证据.json`
  单独保存来源、可信度、梨斗到梨子的身份继承、User 权限、13 个必保留情节点和四幕边界。`第三集剧情总结.md`
  已按同一权威重写，保留本地截图锚点。
- 第三集登记为 event `main.love-triangle-2008-04-11`，四幕依次使用 `order 155/156/157/158`。新增
  `townStreet`、`aquarium` 场景和四份关闭的世界书恢复源；四幕只选择菈菈与梨子人物 lore。
- `tolove-character-riko.txt`、梨子默认卡与角色模块统一为：梨子是结城梨斗的永久性转版本，继承固定剧情和关系，男性梨斗不另行存在，User 不重复继承。水族馆和收尾事故保留喜剧因果，但去掉男性视角下的露骨身体构图。
- 个人技能 `C:/Users/weijunxiang/.codex/skills/adapt-fandom-episodes`
  已创建。技能要求先产出证据包，再做身份继承与玩家权限表，然后分幕、生成恢复源和数据包，最后分开验证格式、语义、宿主和人工验收。
- 当前没有反向改写旧集。第一、二集运行时及春菜、美柑恢复源仍采用旧的 User 主角映射，因此“第三集内部身份映射”通过，“三集身份连续性”失败；两者不能合并成一个通过结论。

| Check                                  | Status          | Evidence                                                                                        |
| -------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Fandom/local evidence reconciliation   | passed          | 第 3 话页、对应漫画章节页、本地总结与 12 张截图已分层登记                                       |
| Reusable skill package                 | passed          | `quick_validate.py` 通过，真实第三集证据包通过 `validate_evidence_packet.py`                    |
| Episode 03 package contract            | passed          | `verify-episode03.cjs` 核对生产注册、四幕 order、角色 lore、场景资源、立绘/表情和 fallback 顺序 |
| Changed-source ESLint                  | passed          | 第三集、场景、梨子、注册表和 verifier 定向 lint 通过                                            |
| Story text regression                  | passed          | `pnpm test:story-text`，21/21 通过                                                              |
| Direct webpack development compilation | passed          | `pnpm exec webpack --mode development` 成功，包含 To-love 入口与其余配置入口                    |
| Project TypeScript / build:dev         | failed-existing | 10 个既有错误位于摘要与上下文模块；本轮没有修改这些文件                                         |
| Aquarium SVG structure                 | passed          | XML 解析通过，`viewBox=0 0 1280 720`                                                            |
| Aquarium visual review                 | not run         | 本地图片查看器不能处理 SVG，等待实际游戏画面或可渲染截图                                        |
| Real Tavern World Info scan/generation | not run         | 本地恢复源和 bundle 不能证明 `WORLDINFO_ENTRIES_LOADED`、生成质量或宿主楼层                     |
| Cross-episode role continuity          | failed          | EP01/EP02 与旧春菜、美柑 lore 仍采用 User 主角映射                                              |

## 2026-07-26：资料页最新全框档案布局与五阶段雷达

- 上一轮文档中的“1:1 正方形
  `contain`、显示当前位置、六条横向属性、移除四条占位和雷达图”已被最新实现撤销，不能继续作为 active
  truth。当前资料页仍绝对挂载在 `.map-section`，不使用浏览器级全屏或 archive-only 视口高度。
- `CharacterArchivePanel` 的 stage 以 `100% × 100%` 覆盖现有地图框；`bg_data1.png` / `bg_data2.png` 当前使用
  `object-fit: fill`。页面不保留灰色侧边，也没有资料页毛玻璃、卡片边框或面板阴影。
- 主角页不显示当前位置，标题固定为“主角”。生日、身高、体重、血型四行固定显示“未登记”；体力使用心形槽，压力使用独立状态槽，并显示零用钱。主角区没有人物图片节点，也不读取梨斗资源。
- 体力与压力共用 `/artsource/ui/archive/player-status/stamina-track.png`，分别使用 `heart.png` 与
  `pressure-icon.png`，并以粉色和青色填充区分；3 个路径都经 `resolveAssetPath()`。`bg_data1.png`
  保持唯一完整底图，官方书脊 `x=508–575` 原样露出；同 hash 复制到 `artsource` 的官方 `bg_ht01.png`
  只在左上旧字段区域局部羽化，中心不再有重复书脊或 CSS 白页拼接。此前 `pressure-frame.png` / `pressure-fill.png`
  与临时 pressure-gauge 复制品已从 `artsource` 删除，官方原件仍保留在 `D:\素材`。
- 六轴 SVG 雷达标签为“文系 / 理系 / 艺术 / 运动 / 容姿 / 根性”，当前依次读取
  `intelligence / intelligence / art / athletics / charm / athletics`。原始成长值仍为 `0–999`
  并直接显示；展示阶段按普通大学进路线阈值派生为
  `0–159=1`、`160–199=2`、`200–239=3`、`240–259=4`、`260+=5`，默认六维原始值 `30`
  均从阶段 1 开始。雷达只保留单色五层同心环、六条轴线和一个阶段多边形；彩色扇区、菱形节点和中心 `MAX`
  徽章已撤销。`stores/playerStore.ts` 持有阈值和 resolver，`render_game_to_text()` 同时暴露精确 `radar` 与派生
  `radarStages`。本轮没有扩展 `PlayerState`、`GameSnapshot` 或存档 schema。
- Persona 风格彩色五级雷达与 risei 风格压力表都是已被用户否决的历史候选，不得从旧截图、旧文档或素材目录恢复为当前实现。
- 底部 `StatPanel` 已删除，属性权威展示迁入资料页；`Controls`
  成为唯一底部操作区并占满宽度。资料页打开时它仍保留在地图框上下文中，但处于 inert/灰化状态。
- `CardImporter` 的按钮、面板、文件/URL action、PNG/URL loader 与相关类型已删除；默认角色初始化所需的
  `addCardFromJSON()` 保留。
- 副 API 未启用时，“手动生成小总结”保持原生 disabled 并明确显示灰色。API 启用后，只有正在运行的任务或与当前 save/source 仍匹配的失败任务会阻断；来源已过期的失败记录仍可查看，但不会永久锁死按钮。

| Check                                       | Status  | Evidence                                                                                                                                 |
| ------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Static source/reference inspection          | passed  | 已只读核对当前挂载、三素材共轨双槽、五阶段阈值、单色雷达、`radar/radarStages` 投影、API 关闭灰色 disabled 与当前失败任务判断；未执行代码 |
| Build / production build                    | not run | 用户明确要求“不要测试”                                                                                                                   |
| ESLint / TypeScript                         | not run | 用户明确要求“不要测试”                                                                                                                   |
| Game-page browser / screenshot / Playwright | not run | 用户明确要求“不要测试”；仅浏览攻略页核对阈值，不是游戏运行证据                                                                           |
| Inline artifact / bundle verification       | not run | 用户明确要求“不要测试”                                                                                                                   |
| New archive asset publication               | not run | 三个运行时状态素材和 `bg_ht01.png` 已在源码 `artsource`，本轮未构建或核对 `dist`                                                         |
| Secondary API call                          | not run | 未替用户启用或调用副 API                                                                                                                 |
| Real Tavern / host / plugin / database      | not run | 本轮没有新增或验证真实宿主链路                                                                                                           |
| Human acceptance                            | pending | 等待用户在目标 Tavern game-frame 审查三素材状态槽、五阶段单色雷达、主角档案、尺寸、清晰度和交互                                          |

当前最强接通标签：**只是本地状态演示**。实现已完成，自动证据按用户要求全部未运行；人工视觉和交互审查仍是接受门。

以下分节是更早循环的历史记录，不覆盖本轮资料页状态。末尾旧的“资料页清晰度与 `record`”证据，以及上一轮“1:1 contain
/ 当前地点 / 六横条”方案，都属于已被后续实现撤销的候选。

## 2026-07-23：目录窗口与自动总结首轮闭环

- 用户在真实 Tavern 打开“总结与重试”后得到 React 19 `getSnapshot should be cached` 与 `Maximum update depth`
  反例。根因是 `SummaryReviewTab` 的两个 Zustand selector 在每次快照读取时执行 `filter().sort()`
  并返回新数组。现在 selector 只订阅 store 原始数组，按当前 `saveUuid` 的筛选和排序移入
  `useMemo`；同文件其余 selector 返回数字或字符串，不属于同类问题。
- 用户随后在真实 Tavern 证明副 API 已返回正文，但旧解析器要求模型生成 JSON，因此任务以“内容不是有效JSON”失败。现在大小总结 prompt 都只要求纯文本正文；本地
  `createMemorySummaryPayloadFromText()`
  负责空白、控制字符、长度和批次校验，并生成固定标题与空 facts。来源指纹、全部来源 ID、状态、模型和时间戳仍由 runtime 本地写入，再由 archive 序列化。
- 当前幕运行时，目录按该幕投影的 `messageIds`
  显示“当前幕连续性窗口”；空闲时按当前跨集规范时间线显示“下一轮连续性窗口”。两者最多选择 6 条完整 User/Assistant 原文。历史楼层没有持久化跨集 history 回执，所以空闲窗口明确标成按当前采用版重建，不冒充当时真实发送记录。每条原文默认折叠，弹窗正文和原文列表各自滚动。
- 系统设定只保存 API 连接配置，并只读显示固定的 6 条最近原文、2 楼小总结、5 条已接受小总结和 600/1200 字上限。自动存档运行器在挂载时立即检查当前游戏态；只有主存档和 MessageArchive 同次写入成功后才建立摘要锚点。一次自动存档或设置刷新最多启动一个批次，不会在旧档启用 API 后连续清空全部积压。
- 小总结始终排除最近 6 条消息，并恰好消费更旧的 2 个完整楼层；因此首次触发需要 5 个规范楼层。大总结按规范剧情顺序选择恰好 5 条已接受小总结，而不是按 API 返回时间。候选接受、编辑、人工重试、已拒绝候选重新生成和大总结复用前都会同时核对已保存锚点与当前 live 采用楼层。
- 候选可接受、编辑标题/正文或拒绝；拒绝本身不调用 API，玩家可在同一记录上显式重新生成。新纯文本候选的 facts 固定为空；结构化事实或变量信号留给未来独立协议，不能从 prose 反推伪证据。
- 自动任务和人工重试共用同一互斥运行链。当前来源存在失败任务时后续自动批次暂停，失败不会自动循环；重试只在“总结与重试”页出现。地图进度条只短时显示运行、完成或失败，不承担重试。
- 每条候选和失败任务都把冻结来源放在默认折叠的审查区内。小总结按来源 ID 原顺序回查 4 条本地 User/Assistant 原文，并显示幕、楼层与 Tavern/fallback；大总结按来源 ID 原顺序显示 5 条已接受小总结的标题和正文。展开区独立滚动，缺失来源逐项显示，不用过滤隐藏。
- jobs 与候选以 v3 键完整保存在浏览器 `localStorage`。空白活动 UUID 会归一为
  `null`，不会清空同一份 archive 中其余合法记录；candidate/job 自身的 UUID 必须非空且 `revision >= 1`。旧 v1
  JSON 候选与旧 6 楼层 v2 候选不再读取。存档槽可以共用 UUID，所以删除或覆盖槽位不再按 UUID 自动清空浏览器摘要；孤立记录先保留，并由活动身份和来源重验隔离。它仍不是 Tavern 文件侧档，尚不进入剧情上下文，也不写 AP、日期、属性、好感或关系轴。
- 普通自动存档完成主档与原文档配对之前不会清空上一份记忆锚点；写入失败时既有总结和失败任务仍可见，成对成功后才采用新 revision。显式切换失败会恢复并重新排队最新可用的成对上下文。前端 generation/CAS 只能拒绝旧回调；已经发给宿主的固定自动档写入仍不可撤销，关页或纠正写入失败时不能宣称原子切换。

| Check                                  | Status  | Evidence                                                                                                     |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Static source review                   | passed  | 独立复核确认纯文本边界、冻结来源回查、UUID 共享清理风险、revision/活动身份校验、成对成功后采用及显式切换回滚 |
| TypeScript / lint / formatting         | not run | 用户明确禁止本轮运行任何测试或格式化                                                                         |
| Build / watch artifact                 | not run | 用户明确禁止测试；未检查 `pnpm watch` 产物                                                                   |
| User pre-fix Tavern runtime            | failed  | 用户控制台出现 getSnapshot 缓存警告、Maximum update depth 与 SummaryReviewTab 崩溃                           |
| User pre-fix summary runtime           | failed  | 副 API 正文到达后被旧 JSON parser 拒绝；小总结任务错误消费 1 个楼层                                          |
| Post-fix browser / screenshot          | not run | 遵照用户要求未打开页面、未截图，等待用户刷新现有 watch 页面复验                                              |
| Post-fix secondary API                 | not run | 本轮未发送连接测试或摘要请求；纯文本候选仍待用户实机回读                                                     |
| Save/message runtime                   | not run | 未代替用户触发真实 Tavern 文件读写                                                                           |
| Tavern memory side archive             | not run | 尚未实现                                                                                                     |
| Story context injection                | not run | 尚未实现                                                                                                     |
| Host floors / shujuku / ACU / database | not run | 未接通                                                                                                       |
| Human acceptance                       | not run | 等待用户实机验收                                                                                             |

当前最强接通标签：**用户实机证明副 API 响应已到达本地解析层；纯文本到本地候选 v3 的修复后路径尚未复验。**

当前残余：手动另存到空槽会取得新 UUID，但不会复制或重锚既有 accepted 浏览器摘要；这需要未来记忆侧档/显式复制合同，未混入本轮。宿主固定自动档写入不是可取消事务，前端只能在旧响应返回后安排纠正写入。

以下分节是被本轮现状取代的历史记录，只说明当时范围，不再作为当前接通结论。

## 历史记录：2026-07-23 大小总结提示词与地图内进度反馈

- `memory/summaryPrompts.ts` 新增独立的 `createSmallSummaryPrompt()` 与 `createLargeSummaryPrompt()`。按
  `prompt-architect`
  的 TIDD-EC 框架，两套 prompt 都包含任务、步骤、必须、禁止、正确结构和错误示例；输出严格限制为带来源指纹、摘要和证据 facts 的 JSON 对象。
- 小总结只接收同
  `floorId`、按 User/Assistant 排列的完整消息对；User 生成指令不自动算作已发生剧情。大总结只接收按时间顺序传入的已接受小总结，不读取原始消息，也不能改写既有 claim/evidence。
- 两套 prompt 都携带日期、时段、地点、玩家属性、`affection/friendship/romance`
  和已完成事件的只读状态锚点。它只用于阻止叙事覆盖权威状态；模型不得结算或推断 AP、关系值、`hurt`、约会资格或路线结果。
- `memory/summaryProgress.ts` 是独立的非持久化 Zustand 运行态。网络等待以 `progress: null`
  表示不定进度；只有未来执行器提供真实可计数值时才显示百分比。模式/阶段冲突和复位后的迟到结果不会污染 UI。
- `MemorySummaryProgress` 直接挂在 `.map-section`，不进入 `SchoolMap`、`MapMenu`
  或全屏 GAL。它位于地图顶部中央，`pointer-events: none`，复用四张 `push_0~3`
  以 125ms/帧播放，reduced-motion 时只显示首帧。
- `render_game_to_text()` 回显同一进度状态。`window.toloveMemorySummaryProgressPreview()` 与
  `?toloveMemorySummaryPreview=` 只是截图诊断入口，只能切换本地进度预设或复位，不发送 API、不生成摘要、不写存档。

| Check                                   | Status  | Evidence                                                                                                                     |
| --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Memory summary contract                 | passed  | `node verify-memory-summary.cjs`；覆盖完整消息对、提示词注入防护、状态权威、大小总结来源隔离、证据串源、重复来源和进度状态机 |
| Memory timeline contract                | passed  | `node verify-memory-timeline.cjs`                                                                                            |
| TypeScript                              | passed  | `pnpm exec tsc -p src/webgame-ui/tsconfig.json --noEmit`                                                                     |
| Changed-file ESLint                     | passed  | prompt/progress/UI/App/index/global/contract 范围无错误                                                                      |
| Existing story-generation contract      | pending | 最终回归时执行                                                                                                               |
| `pnpm build` / `pnpm build:dev`         | not run | 用户明确要求使用正在运行的 `pnpm watch` 产物，不另行 build                                                                   |
| Watch artifact                          | pending | 最终记录精确 `dist/webgame-ui/index.html` 的 mtime 与新模块命中                                                              |
| Browser screenshot / text state         | pending | 用诊断预设证明地图内 running 与 fallback 外壳；不冒充真实执行器                                                              |
| Real secondary API / response parser    | not run | 本轮禁止接通                                                                                                                 |
| Memory side archive / context injection | not run | 本轮禁止接通                                                                                                                 |
| Host floors / shujuku / ACU / database  | not run | 本轮禁止接通                                                                                                                 |
| Human acceptance                        | not run | 等待用户审查 prompt 内容和地图进度条观感                                                                                     |

当前最强接通标签：**只是本地状态演示**。prompt 构造器和进度 UI 已实现，但没有摘要运行器、候选解析/审查、记忆侧档或正式上下文注入；诊断截图不得升级该标签。

## 2026-07-23：本地记忆第一轮规范时间线投影

- 新增 `memory/storyTimeline.ts`，提供只读纯函数 `getCanonicalStoryTimeline()`。
- 函数按 `MAIN_STORY_EPISODES` 的生产注册顺序跨集遍历；每幕只读取 `activeFloorId` 指向的楼层。
- 只有 `outcome === 'accepted'`、楼层事件/幕 ID 与注册表一致且包含同 ID `act`
  的楼层才进入时间线；草稿、解析失败、空 active、未知事件和不完整楼层被排除。
- `before` 边界为排他的跨集边界，未登记边界显式抛错；投影不修改输入 archive。
- 新增
  `verify-memory-timeline.cjs`；主合同 fixture 先通过 schema-v2 严格恢复，再覆盖打乱输入顺序、跨集排序、未采用候选、fallback 来源、解析失败、空 active、未知事件、边界和输入不变性。
- 时间线函数只确认 active
  floor 有两条消息引用；消息实体存在性、User/Assistant 角色和楼层 metadata 一致性仍由 MessageArchive/严格恢复校验负责。

| Check                                | Status  | Evidence                                                                                                  |
| ------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------- |
| Memory timeline contract             | passed  | `node verify-memory-timeline.cjs`；合法主 fixture 通过严格恢复，并输出 `memory timeline contract: passed` |
| Changed-file ESLint                  | passed  | `pnpm exec eslint src/webgame-ui/memory/storyTimeline.ts src/webgame-ui/verify-memory-timeline.cjs`       |
| New-file Prettier                    | passed  | `pnpm exec prettier --check ...`                                                                          |
| Existing story-generation contract   | passed  | `node src/webgame-ui/verify-story-generation.cjs`                                                         |
| Git whitespace check                 | passed  | `git diff --check`                                                                                        |
| Build / watch artifact               | not run | 本轮为未接线纯函数；按用户要求不运行 build，UI 进入后再在 `pnpm watch` 产物上验收                         |
| Browser / screenshot                 | not run | 没有 UI 或渲染路径变化                                                                                    |
| Host floors / shujuku / ACU / 副 API | not run | 本轮明确禁止接通                                                                                          |
| Human acceptance                     | not run | 等待用户审查本轮函数合同                                                                                  |

本轮最强接通标签仍为：**不涉及接通**。该函数只投影本地已校验的主线档案，不代表摘要、记忆库、关系变量、心跳回忆约会或任何 Tavern/插件/数据库链路已经实现。

## 2026-07-23：OpenAI 兼容记忆 API 设置

- 地图菜单“系统设定”已启用。弹层挂在地图容器内并居中，不再覆盖整个浏览器；地图框使用
  `overflow: clip`，不会因缩放前内容或焦点产生内部滑动。
- 一级页只显示“AI 记忆设定”，点击后才渲染 API 表单；表单“返回”回到一级页，右上角关闭按钮退出设置。两个页面都没有独立滚动区。
- `window_kani.png` 现在是弹层唯一的窗口主体；原生 `midashi_op.png`
  保持 255:49 比例并叠在左上承载“系统设定”。设置组件不再引用会产生上下粗蓝带的 `window_system.png`。
- 一级菜单在 800×480 地图中约占 64%×51%；输入页约占 75%×77%。小地图切换为紧凑的双列或三列字段布局，不新增滚动区。
- API 地址现在与酒馆“自定义（兼容 OpenAI）”同义：把输入值直接作为完整 API 基址，只追加 `/models` 或
  `/chat/completions`，不自动插入 `/v1`。模型直连在网络层失败时，若检测到 SillyTavern 请求头接口，则回退到酒馆
  `/api/backends/chat-completions/status` 只读代发；密钥只随本次请求进入 Authorization header，不写酒馆密钥库。
- 模型字段新增“拉取”：直接 `GET {baseUrl}/models`，按 OpenAI 标准读取 `data[].id`，也兼容常见的 `models`
  数组与字符串条目；结果只作为当前弹层的候选，不自动改写已填模型。
- OpenCode 官方 issue #6231 记录的缺口是自定义 OpenAI 兼容 provider 没有自动查询自身
  `/models`，不是标准端点不存在。本实现绕过那条自动发现路径，直接请求用户填写的地址；遇到 401/403、404/405、非 JSON、非标准结构、超时、网络或 CORS 失败时显示原因并保留手动输入。
- 配置以版本化键长期保存在当前浏览器的
  `localStorage`。密钥不会进入 GameSnapshot、MessageArchive、上下文预览或剧情请求；页面明确提示浏览器长期保存的边界。
- `requestOpenAICompatibleCompletion()` 提供后续记忆业务调用，`probeOpenAICompatibleApi()` 只发送一条要求回复 `OK`
  的手动测试。测试结果不写入剧情消息或宿主楼层。
- 本轮没有接自动摘要、摘要缓存、跨集楼层修复、关系提示注入或真实宿主链。真实外部 API 成功仍需用户使用自己的地址、模型和密钥验收。

| Check                              | Status          | Evidence                                                                                                                               |
| ---------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                         | passed          | `npm run typecheck:tolove`；开发构建内 `tsc` 也通过                                                                                    |
| Changed-file ESLint                | passed          | 新配置模块、设置弹窗、菜单和 App 无 lint 错误                                                                                          |
| New-file Prettier                  | passed          | `config/openaiCompatible/*` 与 `SystemSettingsModal` 已格式化                                                                          |
| Model-list contract                | passed          | `npm run test:memory-models`；6 项覆盖标准/兼容响应、去重排序、GET/Bearer、无密钥本地服务与 404 手动退路                               |
| Tavern-compatible URL/proxy change | not run         | 用户明确要求本轮不要测试，只修改代码                                                                                                   |
| Development build                  | passed          | `npm run build:dev`；目标 `index.html` 更新为 2.09 MiB                                                                                 |
| Inline artifact model discovery    | passed          | `dist/Tokimeki_Memorial-To-love/index.html` 同时包含 `/models` 请求与“拉取模型列表”入口                                                |
| Browser UI                         | passed          | 新游戏 → 展开菜单 → 系统设定；一级页输入框数量为 0，点击“AI 记忆设定”后为 4                                                            |
| Asset composition                  | passed          | 最新 `index.html` 中 `window_kani.png` 与 `midashi_op.png` 各引用 1 次，`window_system.png` 为 0 次；两张构建产物与源文件 SHA-256 一致 |
| Body geometry                      | passed          | 主体固定为 478:281：800×480 地图为 520×306、767×460 为 506×298、400×240 为 335×197、358×215 为 300×176                                 |
| Title geometry                     | passed          | 按 255:49 固定比例计算：800px 地图为 382×73、767px 为 368×71、400px 为 192×37、358px 为 172×33；标题字号分别为 32/31/16/16px           |
| Latest composition browser visual  | not run         | 内置浏览器停留在旧的本地连接错误页，URL 安全策略阻止返回本地地址；不得把旧截图当作本轮证据                                             |
| PC game frame                      | passed          | 800×480 地图；输入页 602×371，内容无溢出                                                                                               |
| Tablet game frame                  | passed          | 900×700 iframe 内地图 767×460；输入页 576×354，完全位于地图内且无溢出                                                                  |
| Phone landscape                    | passed          | 844×390 iframe 内地图 400×240；输入页 376×216，空表单与错误提示均无溢出                                                                |
| Phone portrait                     | passed          | 390×844 iframe 内地图 358×215；输入页 334×191，空表单与错误提示均无溢出                                                                |
| Back/close navigation              | passed          | 输入页“返回”恢复一级页且卸载输入框；右上角关闭后弹层数量为 0                                                                           |
| Empty validation                   | passed          | 空配置测试会逐项提示地址、模型和密钥                                                                                                   |
| Long-term persistence              | passed          | 假配置保存后刷新页面仍能回读；验收结束后已清空                                                                                         |
| Visible request failure            | passed          | 本地非 JSON 响应显示“接口没有返回可读取的 JSON”且未写入剧情状态                                                                        |
| Real external API success          | not run         | 未使用用户的真实地址、模型或密钥                                                                                                       |
| Real external model discovery      | not run         | 未使用用户的真实 OpenCode、自建服务或密钥；跨域能力仍取决于目标服务                                                                    |
| Automatic memory summary           | not implemented | 不在本轮授权范围                                                                                                                       |

当前最强接通标签：**本地设置与浏览器长期保存已接通；OpenAI 兼容请求客户端已实现，真实外部接口成功尚未验证。**

## 2026-07-23：目录入口与记忆后续计划

- 地图菜单“目录”现在打开只读的“上下文预览”；原“数据”入口暂时禁用。地图顶部“已读剧情”和角色档案均未改动。
- 已确认当前的“6”指六条消息，不是六轮：每个已采用版本由一条 User 提示和一条 Assistant 原文组成，因此窗口最多是三轮。
- 已定位第二集第三幕的少算原因：历史楼层先按当前 `eventId`
  过滤，所以只会拿到第二集前两幕的四条消息；若按全主线顺序包含第一集两幕，应有四轮、八条消息（从 0 编号即 0—7），再由最近六条原文窗口与待总结区分工。
- 本轮只写清修复方案，没有改 `contextFloorIds`、重生成校验或 schema
  v2。真正实施时必须把跨集楼层选择、成对裁剪、存档恢复和重生成校验一起修改，不能只放宽一个过滤条件。
- `relationship.ts`
  只借“关系阶段短提示 + 身份隔离”的结构；不复制整份人物小传、强制规则和执念轴。认知边界改为代码按已采用的
  `eventId + actId` 投影，不再让角色世界书常驻未来集认知。
- 本段记录形成时副 API 尚未实现；配置 UI、长期保存和手动连接测试现已由上方同日新一轮实现取代，自动摘要仍未接入。

| Check                     | Status                    | Evidence                                                                          |
| ------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| TypeScript                | passed                    | `npm run typecheck:tolove`                                                        |
| Changed-file ESLint       | passed                    | `App.tsx`、`MapMenu.tsx`、`menuAssets.ts` 无 lint 错误                            |
| Development build         | passed                    | `npm run build:dev`；所有 webpack 构建成功                                        |
| Diff whitespace           | passed                    | `git diff --check`                                                                |
| Prettier                  | not applied               | 目标文件原有整体格式与当前配置不一致；避免无关全文件重排                          |
| Story generation contract | blocked before assertions | `ts-node` 被 TypeScript 6 的 `moduleResolution=node10` 弃用错误拦截；未改全局配置 |
| Browser menu interaction  | passed                    | 新游戏 → 展开菜单 → “目录”唯一按钮 → 打开“上下文预览”                             |
| Memory step 1 / side API  | not implemented           | 本轮授权仅为诊断、分析和待办                                                      |

当前最强接通标签仍是：**本地状态演示**。浏览器验收只证明入口和只读面板可用，不证明真实 Tavern 世界书命中、宿主消息、shujuku 或副 API 已接通。

本轮台式机验收按 `references/aldent-review-invitation.md` 执行，结果填写在
`references/aldent-human-review-form.md`。手册已经单独标出真实 Tavern order 扫描、schema
v2 存读档和第二集河边版本，历史段落中的旧 UID 与旧产物路径不再作为本轮证据。

## 本轮结构改造

- `episodeTemplate.ts`
  统一登记日期/行动序号触发器、剧情世界书 order、人物 lore、演出素材、生成合同和 fallback；`episodes/index.ts`
  是唯一生产注册清单。
- 共享触发、生成、GAL、历史和存档只认
  `eventId + actId`。Store 不再并列保存 active/progress/actIndex/acts，快照也不再重建旧第一集结构。
- 通用主线动作移到 `stores/mainStoryStore.ts`；`gameStore.ts` 只装配行动结算和稳定 slice 接口，不再随着剧集增加而增长。
- 主线快照升级为 schema v2，对话档升级为 schema v2；旧开发存档明确不兼容。
- 新增未注册虚构剧集契约，证明通用触发器可以只读取模板工作；新增剧集复用现有素材时不改 `gameStore.ts`、`snapshot.ts`
  或渲染器。
- 防止删除仍被后续版本引用的楼层，并拒绝历史页异步生成返回后的过期写入。

| Check                             | Status  | Evidence                                                                  |
| --------------------------------- | ------- | ------------------------------------------------------------------------- |
| TypeScript                        | passed  | `npm run typecheck:tolove`                                                |
| Generic episode template contract | passed  | `node verify-story-template.cjs`                                          |
| Episode 02 lore/runtime contracts | passed  | `verify-episode02-lore.cjs`、`verify-episode02-runtime.cjs`               |
| Existing story contracts          | passed  | `verify-story-generation.cjs`、`verify-character-lore.cjs`、21 项正文测试 |
| Development build                 | passed  | `npm run build:dev`                                                       |
| Tavern message bridge artifact    | passed  | 已重建；无 `entryReason/generationId/extra.actIndex`                      |
| Real Tavern order scan            | not run | 仍需在真实酒馆确认下一次 World Info 扫描命中 152/153/154                  |

## 保留的上一轮增量：Photoshop 通用分层立绘处理流程

- `菈菈分层动态立绘制作与接入指南.md`
  新增角色无关的 PS 流程，先按症状区分坐标错误、帧外圈差异、跨帧采样、小数像素与完整人物 mask 问题。
- PSD 母板固定逻辑舞台、角色自己的 region 和层级；用 Difference 模式只测中性参考帧，所有表情继续共享同一组坐标。
- 旧 `256x512 / 256x256` 三帧纹理先整图非等比重采样为 `230x393 / 230x171`，再按整数参考线切成
  `230x131 / 230x57`，避免从旧图上猜 `170/171` 或 `85/86` 分界。
- 每帧以同一份 body crop 作为
  `edge-reference`，通过收缩选区与小范围 Feather 建立共同外圈；文档区分了 1024 母板中的 region 选区和独立单帧文档中的
  `Select All`。
- clean atlas、2x
  atlas、legacy 容器、独立帧/显式 rect 的职责分开记录；加入 Timeline、缩放、多背景与分层定位的验收清单及禁止做法。
- 本轮没有修改 `mikan.ts`、共享组件、CSS、任何 PNG/PSD、构建产物或宿主链。

| Check                    | Status  | Evidence                                                            |
| ------------------------ | ------- | ------------------------------------------------------------------- |
| Guide structure          | passed  | PS 流程包含诊断、母板、Difference、整数帧、安全带、导出与时间轴验收 |
| Existing route coherence | passed  | “自己制作新表情”已改为角色自身 region，并区分 clean/legacy 路线     |
| Prettier                 | not run | 最终文档与审查邀请完成后运行                                        |
| Runtime build/tests      | not run | 纯文档增量，明确禁止把未改运行时写成重新验证                        |
| Human reproducibility    | not run | 等待用户按 PS 步骤实际制作一组帧                                    |

### 人工复现

1. 在 PS 建立 1024x1024 母板，放入 body，并登记当前角色的眼嘴 region。
2. 用 Difference 模式对齐第 0 帧；确认外圈接近黑色后锁定坐标，其他帧不得单独移动。
3. 把旧 eyes/mouth 完整图集分别缩放为 230x393 与 230x171，再按整数参考线切出三帧。
4. 给三帧复用同一个 `edge-reference`，mouth 从 3～4px Contract、2～3px Feather 起步；逐帧检查五官没有被蒙版侵蚀。
5. 拼回 clean atlas，在 Timeline 和 50%/100%/125%/200% 下检查，再进入游戏实测。

### 已知风险

- Bilinear 是当前网页采样的实用起点，不代表所有原引擎都使用同一滤镜；原引擎证据不同时应记录并改用对应采样方式。
- mouth 只有 57px 高，统一大羽化会侵蚀嘴型；应从小值开始，必要时只处理出现接缝的一条边。
- PS 中静态无缝不能代替最终浏览器的动画、缩放和 mask 验收。

## 保留的既有待审范围：第一集第一幕美柑实际渲染

- `characters/mikan.ts` 保留用户草稿的
  `arrival-default`、`neutral:c / worried:a / happy:b / serious:f / panic:e / shy:d`、禁眨眼 `worried/panic`
  和人物世界书 UID `7`。含空格与 `#` 的 body URL 使用等价编码 `%20%23`，避免浏览器把文件名后半段当 fragment。
- 美柑的实测眼窗为 `394,270,230,131`，嘴窗为 `394,398,230,57`；旧实现误用了菈菈的 `237/365`，已由用户截图证明错误。
- `characters/index.ts` 已登记美柑；第一幕 cast 与 `characterLoreIds` 都加入 `mikan`。生成路线现在会按 UID `7`、名称
  `结城美柑`、根标签 `Mikan Yuuki` 和姓名标记验证关闭条目，并将副本武装到下一次原生 World Info 扫描。
- 第一幕保底回家页由美柑说“回来了？怎么一副又失败了的表情。”，演出 cue 为
  `home / mikan / arrival-default / neutral / none`，因此本地环境也能完整检查姓名牌、body、mask、`c_eye`、`c_mouth`、眨眼和口型链。
- 之前桌面与 `844x390` 截图仍使用旧坐标，已被用户提供的桌面截图否决，不能继续作为视觉通过证据。

| Check                               | Status  | Evidence                                                                                         |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Runtime source Prettier / ESLint    | passed  | 美柑模块、角色注册表和第一幕定义无格式或 lint 错误                                               |
| Webgame subtree TypeScript          | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json --pretty false`                          |
| Story generation contract           | passed  | `node src/webgame-ui/verify-story-generation.cjs`                                                |
| Character / episode lore contracts  | passed  | `verify-character-lore.cjs` 与 `verify-episode02-lore.cjs` 均通过                                |
| Character validator ESLint          | failed  | 既有 CJS `require()` 触发 3 条 error 和 3 条 warning；脚本执行本身通过                           |
| Development build                   | passed  | `pnpm build:dev`; fresh inline artifact 包含美柑、UID 7 与全部素材 URL                           |
| Prior desktop player flow           | failed  | 用户截图显示旧眼嘴窗口切过刘海、额头和脸部；旧坐标证据已失效                                     |
| Prior mobile landscape player flow  | failed  | 使用同一错误坐标，不能证明修正版视觉                                                             |
| Mikan source-pixel alignment        | passed  | `a-f` 六组表情三帧边缘复核；新坐标边缘 MAE 约 `5-6`，旧坐标约 `39/60`                            |
| Corrected browser player flow       | not run | 当前浏览器 URL 策略阻止重新抓取本地页面；等待用户刷新实际页面                                    |
| Fixed diagnostic composite          | passed  | `output/web-game-mikan/mikan-face-alignment-before-after.png` 与三帧诊断图                       |
| Resource decode and animation state | passed  | body `1024x1024`、eye `256x512`、mouth `256x256`; mask/body/eye/mouth 请求成功，眼嘴动画名已命中 |
| Standalone console                  | passed  | 仅有缺少 Tavern save/generate 接口的预期隔离错误；没有新增 React、资源解码或路径错误             |
| Real Tavern UID 7 World Info scan   | not run | 本地页面没有 Tavern Helper；需要真实酒馆复验一次性扫描与关闭条目状态                             |
| Human visual acceptance             | not run | 用户已否决旧画面；修正版仍等待实际页面确认坐标、表情语义和接缝                                   |

### 人工复现

1. 打开 `http://localhost:5500/dist/webgame-ui/`，点击“重新开始”。
2. 点击一次“学习”；本地页面出现生成失败时点击“使用保底版”。
3. 从第一幕第 1 页点击十次“下一页”，停在第 11/17 页。
4. 确认页面显示结城美柑、美柑姓名牌和“回来了？怎么一副又失败了的表情。”，并人工检查眼嘴高度、接缝、闭眼 neutral 与口型是否符合你的素材配置。
5. 在真实 Tavern 中重新生成第一幕，确认 UID `7` 的 `结城美柑` 条目保持关闭、扫描副本被临时启用且生成后没有改写保存状态。

### 已知风险

- 本地 fallback 只能证明角色注册和 UI 渲染，不能证明真实 Tavern 世界书 UID `7` 已命中。
- 当前 neutral 按用户配置映射到 `c`，禁眨眼集合按用户配置仍为
  `worried/panic`；是否符合表情语义和逐帧接缝由本轮人工画面审查决定。
- standalone 页面缺少 Tavern save 与 generate 接口，因此控制台会记录对应隔离错误；这不是美柑资源失败。
- `verify-character-lore.cjs` 仍使用项目既有的 CommonJS 脚本格式；将校验工具迁为 ESM 不属于本轮运行时接线范围。

## 2026-07-22：第二集完整接线与河边版本

- 时间线采用当前企划的连续映射：4 月 7 日 20:43 首次触碰与公园对峙，4 月 8 日早晨误告白，4 月 9 日第二集开场与校内骚动，4 月 10 日 20:43 三日冷静期结束，4 月 11 日早晨菈菈作为转学生登场。
- TBS 第 2 话简介确认婚约成立与三日内解除；日文字幕进一步给出“一昨日の20時43分”、再次触碰并宣告解除、最后一小时谈话、警报和转学生台词。恢复源没有写成 24 小时、八字不合或让菈菈讨厌 User。
- 用户提供的动画截图确认最后一小时谈话发生在河边。第二幕以 User 请菈菈去河边收尾，第三幕从河堤开始，沛凯仍在场；20:43 警报也在河边响起。
- 菈菈说出长期相亲、王室身份让人替她作决定、除沛凯外没人倾听，并感谢 User 曾经听她说话、相信她和保护她。User 只表现为几次开口未果，没有被正文规定成因为春菜、愧疚或爱意而犹豫。
- 警报在 4 月 10 日 20:43 响起，User 未再次触碰也未完成解除宣言；次晨亲卫庆祝，User 到校后短暂以为菈菈不在，老师随即介绍她为转学生。第三幕停在春菜认出她和全班骚动，不续写第三集。
- `tolove-character-mikan.txt` 与 `tolove-character-haruna.txt`
  按菈菈人物书的分区方式保存基础资料、行为性格、经历、情感驱动、关系、前两集认知、称呼、口吻、台词和禁止偏移。两人都明确隔开原作男主、User 与夕崎梨子。
- 美柑保持小学生与未成年边界，重点是家务、观察和责任提醒；春菜保持文静但有边界的普通同学，第二集更衣室反应来自惊吓，不写成争宠。春菜不知道三日规则、沛凯变装原理、解除婚约的尝试或河边最后谈话。
- TBS 官方人物页只用于身份和核心性格。生日、血型、身高和体重来自已标明的二级资料；恢复源和 README 都明确说明 TBS 页面未列这些数值。
- 世界书条目不再依赖不可控 UID；人物使用 `order 100/101/102`，两集剧情使用 `order 150-154`。所有保存条目仍须保持关闭。
- 菈菈校园常驻已经改为 EP02 三幕完成后解锁，与 4 月 11 日转学生登场一致。
- `stores/mapStore.ts` 与 `components/MapMenu.tsx` 未修改；二者不拥有剧情日期或角色解锁。构建与 inline
  artifact 不受这些未导入 bundle 的恢复源影响。

| Check                        | Status  | Evidence                                                                                         |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Episode 02 lore contract     | passed  | 三幕根标签、河边版本、order 定位、日期/AP 触发与场景登记通过                                     |
| Episode 02 runtime contract  | passed  | 4 月 9 日至 11 日的行动触发、跨日、完成记录与菈菈解锁通过                                        |
| Character lore contract      | passed  | `node src/Tokimeki_Memorial-To-love/verify-character-lore.cjs`；人物结构、身份边界与自然台词通过 |
| Story generation regression  | passed  | `node src/Tokimeki_Memorial-To-love/verify-story-generation.cjs`；两集生成与正文协议合同通过     |
| Story text regression        | passed  | `npm run test:story-text`；21 项正文抽取与提示合同测试通过                                       |
| Changed-file Prettier        | passed  | 运行时、校验脚本、测试与当前文档已按项目 Prettier 整理                                           |
| Build / inline verification  | passed  | `npm run build:dev`；TypeScript 与 webpack 开发构建通过                                          |
| Real Tavern worldbook scan   | not run | 代码按 order 武装扫描副本；仍须在真实酒馆核对 `WORLDINFO_ENTRIES_LOADED`                         |
| Human story and voice review | not run | 等待用户审阅第三幕节拍、美柑与春菜是否自然、是否符合当前企划                                     |

### 人工复现

1. 阅读三份第二集恢复源，确认时间依次为 4 月 9 日、4 月 10 日 20:43 前、4 月 10 日最后一小时至 4 月 11 日早晨；第三幕谈话发生在河边。
2. 检查第三幕：菈菈说起相亲、王室压力、沛凯例外并感谢 User；User 没有被写死内心理由，也没有再次触碰或完成解除宣言。
3. 检查片尾：警报越线后才有亲卫庆祝；到校后老师介绍转学生，菈菈说自己也来学校，春菜只认出她，剧情随即结束。
4. 阅读美柑人物书，确认她仍是未成年小学生，不承担恋爱或身体笑料；User 没有自动亲属关系，夕崎梨子没有默认亲属关系。
5. 阅读春菜人物书，确认原作感情不迁移给 User；4 月 9 日更衣室反应来自受惊，她不知道家中解除规则和最后谈话。
6. 在真实 Tavern 中检查 `order 100-102` 人物条目和 `order 150-154` 剧情条目保持关闭，并核对一次性扫描证据。

### 已知风险

- 4 月 7 日至 4 月 11 日是依据当前游戏锚点与字幕相对时间得到的内部映射，不是动画画面显示的官方日历。
- TBS 官方人物页不含生日、血型、身高和体重；这些数值已经降级标注，但仍需人工决定是否保留二级资料。
- 自动检查只能验证结构、关键词和禁用边界，不能证明人物说话自然或每个动画情绪点都写对。
- 第二集、角色解锁、保存恢复、历史投影和重新生成上下文已经按 `eventId` 接入；真实酒馆扫描仍需人工证据。

## 保留的既有待审范围：直接抽取唯一受支持正文容器与场景立绘唯一绑定

- 用户截图明确指出运行时出现了错误的 `<panc>`，并确认协议应为 `<content>`。既有 `AI生文与GAL前端整合方案.md`
  第 54-58 行也以 `<content>...</content>` 为标准示例；上一轮 panc 合同及其自动测试结论因此作废并已归档。
- `storyGenerationPrompt.ts` 默认使用 `<content>...</content>`，同时明确上层提示已指定
  `<正文>`、`<story_scene>`、`<story_scence>` 等正文标签时沿用一对同名开闭标签；运行时 prompt 中不包含 panc。
- 用户随后提供的真实输出同时包含完整 `<content>` 和 `</content>`，但其前面存在不匹配的
  `</konatan_planning~>`；旧实现按标签树遍历时把 content 视为 blocked
  planning 的子节点，因而错误提示“未包含”。此前抽取通过和 artifact 哈希已被该反例推翻并归档。
- 用户继续指出正文容器不只有 content：既有登记还包括 `<正文>` 与 `<story_scene>` 等，实际还需要兼容
  `<story_scence>`。单 content 门禁因此是错误合同；修复前这三个正例都会误报“未包含 `<content>`”。
- `storyTextExtraction.ts` 现在直接扫描既有 `PLAYABLE_TAG_GROUPS` 的开闭 token，并补登
  `story_scence`。整份返回只能有一对受支持且同名的正文标签；容器外内容全部丢弃，正文中的其他 `<...>`
  标签标记会被过滤；缺失、未闭合、错配、重复或并列多个受支持标签均进入 `parse_error`。
- `tavernStoryGeneration.ts` 的候选门禁改为 `requirePlayableWrapper: true`，不再指定某一个标签名。最终 inline
  artifact 中没有 panc 文本。
- 场景与立绘修复保持：完成合同读取当前幕 `requiredSceneSequence`；第二幕
  `washroom + lala -> washroom-swimsuit`，其余当前幕场景 `lala -> arrival-default`；错误 portrait 明确拒绝，不静默替换。
- 世界书条目、剧情情节点、AP/日期、fallback、立绘素材、宿主消息和插件/数据库链均未改动。

| Check                              | Status  | Evidence                                                                                                                                              |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| User contract counterexample       | passed  | 用户指出正文容器是既有标签集合，不是 content 单标签，并明确补充 `<正文>` 与 `<story_scence>`                                                          |
| Frozen before-failure reproduction | passed  | `<正文>`、`<story_scene>`、`<story_scence>` 三个完整正例在修复前均稳定抛出“未包含 `<content>`”                                                        |
| Story generation contract          | passed  | `node src/webgame-ui/verify-story-generation.cjs`；全部 18 个登记标签、畸形外层标签、其他标签过滤、缺失/截断/错配/重复/并列反例及 portrait 正反例通过 |
| Full subtree TypeScript            | passed  | `pnpm exec tsc --noEmit -p src/webgame-ui/tsconfig.json`                                                                                              |
| Changed-file ESLint                | passed  | prompt、抽取、演出解析、生成 adapter、共享规则和合同检查脚本无 error                                                                                  |
| Production build                   | passed  | `pnpm build`；最终 `dist/webgame-ui/index.html` 为 531402 bytes；仅有既有 asset-size 建议                                                             |
| Exact inline artifact verification | passed  | fresh artifact 的 legacy entity/currency/replacement/syntax error 均为 0，单 inline script                                                            |
| Artifact protocol scan             | passed  | fresh artifact 包含 content、`<正文>`、story_scene、story_scence 与受支持容器错误提示，不包含 panc                                                    |
| Artifact identity                  | passed  | SHA-256 `B28E9967E2DE66FC873C1552B3626B6AC8D9EC959819DC84BA7ACE56C5502B47`                                                                            |
| Corrected real Tavern generation   | not run | 尚未用本次正文标签集合 artifact 重新生成第二幕                                                                                                        |
| Host/plugin/database routes        | not run | 本轮禁止触发；hidden floors、MESSAGE_SENT、shujuku/ACU 和数据库仍未接通                                                                               |
| Human acceptance                   | not run | 等待用户用本次 artifact 重新验收                                                                                                                      |

### 人工复现

1. 用最终 artifact 在真实 Tavern 中重新生成第二幕，检查 User prompt 与原始 Assistant：默认可使用
   `<content>...</content>`；上层指定其他登记标签时，应保留那一对同名标签；不得出现 panc。
2. 分别用唯一的 `<content>`、`<正文>`、`<story_scene>`、`<story_scence>` 包裹同一段合法 GAL 正文，四种都应进入 GAL。
3. 即使正文容器前存在不匹配的
   `</konatan_planning~>`，只要唯一受支持标签对完整，正文仍应进入 GAL；容器外规划文字不得进入正文。
4. 缺失、未闭合、开闭名错配、重复或并列多个受支持正文容器应显示 `parse_error`；正文内其他尖括号标签标记应被过滤。
5. 浴室中菈菈只能显示 `washroom-swimsuit`；从 `home` 起显示菈菈时只能使用 `arrival-default`，错误字段不能被静默替换。
6. 确认第二幕不少于 30 行，首次场景顺序为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`，并人工确认世界书最后情节点完整演完后结束。

### 已知风险

- 正文标签集合抽取后的真实 Tavern 生成尚未运行；本地合同和 artifact 扫描不能替代这次复验。
- 行数与场景顺序不能机器证明所有世界书语义情节点已覆盖，最终内容仍需人工阅读。
- 最终 inline checker 由当前 `HEAD:verify-inline-bundle.mjs` 通过管道执行；工作区中该脚本的既有删除保持未恢复。
- 生产构建仍报告现有 `index.html` 体积建议，本轮没有扩展到 bundle 拆分。

## 保留的既有待审范围：特技树、学期学习与 map 内手机抽屉

- `data/skills.ts` 现有 127 项，分类数量为
  `25/24/20/26/24/8`；130 条前置边在加载时检查重复 ID、缺失前置、重复前置、成本和环。
- `skilllogic/` 单独负责图、日期、EXP、学习、六槽实践、快照校验和 Zustand store。初始普通根节点为
  `available`，没有技能默认为已取得或实践。
- 每次被 `settlePlayerAction()` 接受的 AP 行动获得 1
  EXP；拒绝行动不增加。该值是本项目对“指令积累经验”的显式适配常量，不冒充原作未找到的精确换算公式。
- 第一次管理窗口为
  `2008-05-09`，之后按学期开放；当前窗口维持到下学期开始，漏过的旧学期不能在同一天连续补交。学习与实践配置分离，所有前置都是 AND，实践最多 6 项且每学期只提交一次。
- 技能快照是 V1 兼容可选顶层字段。新存档保存 EXP、学习历史和学期提交；旧存档缺字段时重置技能进度，坏字段会显式拒绝。自动存档订阅技能 store，新游戏统一重置。
- `SpecialSkillPanel` 使用真实四态和状态连线，依赖深度标为 `STEP`
  而不是伪等级。驾照节点显示“通过驾照考试取得”，不会用 EXP 学习。
- 面板仍是 `.map-section` 的直接子级；技能打开时 map 框获得独立可用高度。`390x844` 使用同框底部抽屉，`844x390`
  使用同框右侧抽屉，遮罩可点、`Esc` 可退、焦点返回触发节点，关键触控目标不小于 44px。
- `artsource/SkillUi/` 只保留最终 `skill-menu-paper-bg.png`。CLI fallback 临时环境和 Playwright 临时文件已删除。
- 技能效果尚未接到属性、成功率、AP、好感或剧情结算；驾照考试没有运行时入口。这两点不属于本轮完成声明。

| Check                              | Status  | Evidence                                                                                                              |
| ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| Skill graph/data smoke             | passed  | 127 项、六分类、130 边、无环；根节点 available，前置/EXP/六槽/单次提交与跳学期校验通过                                |
| Accepted-action EXP and save smoke | passed  | 接受行动 `0 -> 1`，随后拒绝行动保持 `1`；技能快照 `42 -> reset -> restore 42`，旧档恢复为 `0`                         |
| Changed-file ESLint                | passed  | 本轮 TS/TSX 文件局部 ESLint 无 error                                                                                  |
| Full subtree TypeScript            | failed  | 仍被未改动全局声明、VueUse Web Bluetooth 类型和 `global.d.ts` 重复声明阻断；本轮组件错误已修复，Webpack 类型构建通过  |
| Development build                  | passed  | `pnpm build:dev` 成功，技能背景进入 fresh inline artifact                                                             |
| Browser matrix                     | passed  | `1440x900`、`390x844`、`844x390` 的真实 game-frame；127 项、树线、抽屉几何、背景请求、遮罩、Esc、焦点与 44px 热区通过 |
| Standalone console                 | passed  | 除缺少 Tavern Helper 存档事件接口的预期隔离错误外，无新增 console error 或资源失败                                    |
| Production build / inline check    | not run | 最终文档完成后运行                                                                                                    |
| Skill effects / license exam       | not run | 本轮明确未接入                                                                                                        |
| Human acceptance                   | not run | 等待用户审查                                                                                                          |

### 人工复现

1. 新游戏在 4 月 7 日打开特技，确认 EXP/取得/实践均为 0；根技能只显示可学习，高阶技能锁定，操作显示“当前不可学习”。
2. 在手机竖屏点击任一节点，确认详情从 map 框底部打开；点暗色遮罩或按 `Esc`
   后焦点回到原节点。手机横屏重复操作，确认详情从 map 框右侧打开。
3. 推进到 5 月 9 日并积累 EXP，依次学习一个根技能和其后继；确认后继在根技能取得前不能学习，学习后 EXP 扣除。
4. 从已取得技能中选择不超过 6 项并确定配置；关闭重开、自动存档读取和新游戏重置后分别检查实践项保留、存档恢复和全清空。
5. 查看轻便摩托驾照，确认只能看到考试取得提示；检查属性和行动结果，确认本轮没有暗中应用技能效果。

## 保留的既有待审范围：世界书权威与 AI 导演式演出单

- 第一集剧情世界书已经按幕拆开：第一幕扫描 UID `101` / `剧情第一集·第一幕`，第二幕扫描 UID `102` /
  `剧情第一集·第二幕`，不再把两幕整条注入同一次生成；两幕都会同时扫描菈菈人物条目 UID `1`。
- prompt 要求 AI 每页生成
  `scene/focus/portrait/expression/effect`；解析器用当前幕素材表、角色注册表和具体立绘表情集合严格校验。
- prompt 动态提供当前幕真实立绘示例，并禁止把正在画面中或正在发言的已登记角色标为
  `focus=none`；这条规则对未来注册角色通用。
- 未登记人物可以用真实姓名或明确身份说话，并由现有 generic
  nameplate 显示姓名；他们不能带“临时角色”标签，也不能虚构 focus、portrait 或 expression。已登记但不在当前幕 cast 的角色仍会被拒绝。
- 每幕新增最少正文行数和必经场景顺序；第一幕少于 25 行或没有走完
  `space → school → schoolGate → home → washroom`，第二幕少于 30 行或没有走完
  `washroom → home → bedroom → rooftop → nightStreet → park → schoolRoad`，都会作为不完整正文拒绝，不需要 AI 输出完成标记。
- 重新生成按 `contextFloorIds` 只继承前面各幕当前采用楼层，不再把当前幕旧楼层送回模型续写。
- 已读剧情的每个候选楼层可删除；删除当前采用版会回退到剩余的最新可播放版，没有候选时取消采用。删除仅作用于游戏本地楼层及其 messagesave 原文。
- `characters/lala.ts`、`haruna.ts`、`riko.ts` 独立管理别名、人物 lore、姓名牌和多套立绘；当前 `a-f`
  文件后缀只存在于角色资源模块内部。
- `director.ts`、`lalaArrival.ts`、`LalaExpression`、`lalaExpression`
  和旧正文格式已直接删除；项目未发布，因此不提供兼容适配。
- React 播放器直接消费 AI cue；背景、出镜角色、立绘、表情与效果不再由页数、关键词或角色特判推断。
- 两幕世界书已撤销不属于 TV 第 1 话的旧校舍天台双向告白、保护春菜和校园疏散，恢复太空冷开场、校门退缩、回家电话、泡澡中爆炸、卧室说明、足球解围、屋顶逃跑和春菜遛狗目击。萨斯丁在公园乘飞船登场并被真空君卷走，次日误告白触发婚约；不再使用错误的婚约后太空收尾。代表性台词只以短句意图约束，不大段照抄。
- 第一集地点已拆成独立语义场景槽位，并从 `D:\出包女王素材库\Texture2D` 选择九张 `1024x512` 背景复制到项目。夜间遛狗使用
  `nightStreet/bg009_b`，次晨上学使用 `schoolRoad/bg006_a`，不再用一个标签掩盖两个时间段。
- 剧情世界书不再硬匹配某句结尾正文，只检查关闭状态、根标签和非空正文；用户追加“不写下一集内容”不会再被判为正文不完整。人物条目仍可保留可选身份标记。
- 按用户要求，本增量未运行类型检查、构建、脚本验证或浏览器验证；下方内容是历史记录，不是当前实现证据。

## 历史记录：已被当前增量取代的导演模块重排

本轮把第一集从单个 `lalaArrival.ts`
和散落的 UI/service 判断中拆成可审查的集、幕、场景、角色与导演模块。现有 event/act/floor/message ID、`lalaExpression`
存档字段、AP/日期结算、prompt、世界书选择和宿主接通状态保持不变。

- `episodes/episode01/acts/act01.ts` 与 `act02.ts` 分别保存本幕元数据、场景时间线和保底页。
- `episodes/episode01/director.ts` 集中背景、effect、菈菈表情推断和菈菈/春菜/梨子出镜 cue。
- `scenes/index.ts` 统一背景 ID、路径和 alt；`characters/index.ts` 统一三名角色的姓名牌、别名、表情和 rig。
- `storyRegistry.ts` 目前只登记第一集；`lalaArrival.ts`、`galAssets.ts` 只保留旧 import 兼容。
- `verify-story-modules.cjs` 检查稳定 ID、两次行动触发、fallback、场景/角色登记和实际资源存在性。

| Check                              | Status  | Evidence                                                                                     |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Story module contract              | passed  | `pnpm run verify:story`；稳定 ID、AP=1/0、lore、fallback、director cue、资源与兼容门面通过   |
| Changed-file ESLint                | passed  | 本轮 TS/TSX/CJS 文件无 lint error                                                            |
| Full subtree TypeScript            | failed  | 仅剩未改动 `stores/characterStore.ts:24` 的既有 `string \| null` 传给 `Set<string>.has` 错误 |
| Production build                   | passed  | 所有子任务结束后最终运行 `pnpm build`；`dist/webgame-ui/index.html` 为 488827 bytes          |
| Exact inline artifact verification | passed  | legacy entity/currency/replacement/syntax error 均为 0，单 inline script                     |
| Artifact identity                  | passed  | SHA-256 `EF43DC856706E67502CC7C0DFE76B3FF3B07B03571D0C30D12044FC9B3DF89E6`                   |
| Real Tavern generation             | not run | 未调用真实 `TavernHelper.generate()`，未复验 World Info 一次性扫描                           |
| Old save / two-act behavior        | not run | 等待人工读取旧存档并完成两次行动、两幕、背景和立绘回归                                       |
| Human acceptance                   | not run | 等待用户审查                                                                                 |

当前连接标签不升级：生成 API、一次性 World Info 扫描实现和本地 messagesave 镜像保持原状；hidden host floors、
`MESSAGE_SENT`、shujuku/ACU 和数据库仍未接通。

### 人工复现

1. 读取重构前的第一集存档，确认当前幕、采用楼层、AI 原文和页位置仍可恢复。
2. 新游戏在 2008-04-07 完成第一次有效行动，确认进入第一幕；完成第一幕后返回自由行动，再完成第二次行动进入第二幕。
3. 确认第一幕场景依次为 `space -> school -> schoolGate -> home -> washroom`，第二幕依次为
   `washroom -> home -> bedroom -> rooftop -> nightStreet -> park -> schoolRoad`。
4. 确认菈菈在第一幕太空冷开场和第二幕主要段落使用登记立绘，春菜与梨子各自使用独立角色模块；未登记人物只显示实名通用名牌。
5. 在真实 Tavern 中各生成一幕，确认选中的世界书保存条目继续保持关闭，生成后正文、fallback、重新生成和原文阅读器行为不变。

### 已知风险

- 第二集已经完成多集接线；store 正文投影、存档恢复、历史目录、重新生成上下文和文本导出均按 `eventId` 分集。
- 全量 TypeScript 尚被未改动的 `characterStore.ts` 既有空值类型错误阻断；本轮改动文件没有剩余 TypeScript 报错。
- 构建、lint 和 contract check 不能证明剧情语义、视觉节奏、旧存档或真实 Tavern World Info 行为。

## 保留的既有待审范围：双地图与默认 PC 嵌入菜单

用户曾于 2026-07-19 回复“我校验通过”，但随后提供了手机横屏重叠与默认 PC 嵌入态菜单过小的反例；旧通过结论已被后续反馈覆盖。三个目标尺寸的几何检查没有覆盖 SillyTavern 默认 PC 嵌入态，因此不能证明该状态的菜单比例。本记录只审查地图切换控件与相关布局，不接受或替代其他主线范围。

- 彩南高中使用 `map.png`，左侧 `map_next02.png` 前往彩南町；角色档案在右侧镜像位置。
- 彩南町使用 `map1.png`，右侧 `map_next01.png` 返回学校；角色档案切到左侧镜像位置。
- 护法完整可见图形可点击；反馈沿 PNG Alpha 图形描边，没有矩形毛玻璃底、整图模糊、整图阴影或整体缩放。
- 彩南高中校门最终坐标为 `(0.8, 3.2)`，位于护法右下方的道路入口，不再与护法或菜单重叠。
- 地图由当前地点推导，切图不消耗 AP，也不新增独立存档字段。
- `game-frame` 高度 `481-700px` 时，日历为 `82px`、护法为 `66px`、档案为 `40x96px`；菜单不再固定为
  `52px`，而是按实际宽度使用 `clamp(52px, 7.5cqw, 66px)`。
- 手机横屏档以 `game-frame` 高度 `<=480px` 为准：日历 `52px`、护法 `44px`、菜单 `40px`、档案
  `30x72px`；护法和档案共同下移到 `56%` 高度，保持左右镜像同轴并避开左上日历和左下菜单。

| Check                                 | Status  | Evidence                                                |
| ------------------------------------- | ------- | ------------------------------------------------------- |
| Final development compilation         | passed  | 最新菜单规则后运行 `pnpm build:dev`，Webpack 成功       |
| Port 8000 default PC embedded runtime | passed  | 地图框 `910x546px`，菜单 `66x66px`，左/下边距均为 `8px` |
| Port 5500 / fullscreen / other sizes  | not run | 用户明确限制本轮不得验证这些范围                        |
| Human visual review                   | not run | 等待用户确认默认 PC 嵌入态菜单比例                      |

本次地图调整不改变生成链、宿主消息链、插件/数据库链或 UI messagesave 镜像的既有接通标签。

## 仍待人工验收的既有范围

- 主线当前幕由 schema v2 的单一 `run(eventId, actId, phase, pageIndex)`
  恢复；采用正文从相应楼层档案投影，不再保存并行的幕序号或正文数组。
- 恢复或继续游戏时会按模板的日期与行动序号幂等检查等待中的幕；例如第一幕结束后的 `AP=1 + waiting act2`
  仍等待下一次行动触发第二幕。
- 角色卡继续保存在 Card
  store，出现位置由独立规则同步：梨子和春菜初始可见，菈菈完成第二集后可见，梦梦、唯和小暗当前锁定；未知导入角色默认可见。
- AI 原文通过既有楼层 `messageIds` 关联 Tavern
  Assistant 消息，按幕和楼层版本组织，并对原字符串做只读分页。已读目录中的每个楼层可直接打开其原文版本。
- 本轮修改了本地主线模板、消息镜像协议和存档结构；没有创建 Tavern 宿主消息，也没有接入 shujuku、插件或数据库链。

## 验证证据

| Check                                | Status  | Evidence                                                     |
| ------------------------------------ | ------- | ------------------------------------------------------------ |
| Source formatting / lint             | not run | 用户要求全部检验交给人工                                     |
| TypeScript / development build       | passed  | 地图尺寸调整后整包 `pnpm build:dev` 成功；不等于故事行为验收 |
| Production build                     | not run | 未运行 `pnpm build`                                          |
| Browser / Playwright interaction     | not run | 未启动页面或浏览器自动化                                     |
| Save/load AP progression             | not run | 等待人工在实际存档流程中验收                                 |
| Character visibility                 | not run | 等待人工检查地图、场景、档案和文本态                         |
| Raw reader act/version/page behavior | not run | 等待人工检查具体楼层选择与分页                               |
| Raw message immutability             | not run | 等待人工比较保存消息与重新生成上下文                         |
| Inline artifact verification         | not run | 未运行 `verify-inline-bundle.mjs`                            |
| Real Tavern generation               | not run | 未调用真实 Tavern Helper 生成                                |
| Human acceptance                     | not run | 等待用户审查                                                 |

## 当前接通状态

- 地图 UI 源码和开发产物已更新；故事进度、角色出场和原文阅读器仍没有新的运行时验收证据。
- 生成链、一次性 World Info 扫描链和游戏 messagesave 镜像保持原实现，本轮未验证也未改动其协议。
- 宿主消息链仍未创建 hidden user/assistant 楼层。
- 插件/数据库链仍未接通 `MESSAGE_SENT`、`/trigger`、shujuku/ACU 或数据库。
- 原文阅读器只读取游戏保存的 Tavern Assistant 消息，不新增消息，不修改 prompt history，也不代表宿主聊天权威。

## 人工复现

1. 开始新游戏，确认地图、地点提示、附近角色与角色档案中只有夕崎梨子和西连寺春菜，菈菈、梦梦、古手川唯和小暗都不出现。
2. 完成 4 月 7 日第一集两幕后，确认菈菈开始出现在校园；梦梦、古手川唯和小暗仍保持隐藏。
3. 第一幕完成后在 `AP=1`、日期仍为 4 月 7 日时保存并读取，确认已读第一幕和当前幕进度保留，且不会重复触发第一幕。
4. 读取上述存档后执行第二次有效行动，确认 AP 到 0 时进入第二幕 AI 正文，而不是直接跨到 4 月 8 日。
5. 打开已读剧情，分别从总入口和具体楼层的 `AI 原文`
   按钮进入，确认可以切换幕、生成版本和单页，并且具体楼层按钮会预选对应版本。
6. 检查长原文一次只显示一页，上一页/下一页和页数正确；把各页按顺序拼接后应与原 Assistant 消息完全一致。
7. 关闭阅读器并重新生成候选楼层，确认已保存原文、采用楼层以及用于连续性的历史消息没有因阅读、切页或切版本发生变化。

## 已知风险

- 本轮没有运行格式化、lint、生产构建或 inline
  artifact 检查；开发构建与边界测量只能证明本地实现可编译且几何不重叠，最终观感仍需人工确认。
- 角色出场规则当前只覆盖已有第一集进度；梦梦、唯和小暗在未来剧情事件落地前保持锁定。
- 恢复补触发依赖存档中的日期、AP、已采用幕和完成事件记录彼此一致；异常或手工修改过的存档仍需单独判断。
- 原文分页按字符上限优先寻找段落或句末断点，只影响阅读视图，不是 GAL 正文解析或消息迁移。
- 背景顺序、春菜跨页眨眼以及前次合并后的真实 Tavern 扫描仍是前序待验收项，本轮不自动接受它们。

本状态更新后只剩审查邀请；邀请发出后冻结修改。

## 本轮本地记忆闭环

- 新增 `AI记忆与自主规划调研报告.md`，记录自主规划不能直接取得游戏权威、成熟记忆方案的取舍，以及本轮明确不接通的宿主链。
- `services/storyGenerationContext.ts`
  把提示词和最多 6 条历史消息的选择抽成共享投影；Tavern 生成和“数据”预览使用同一份结果。
- `components/ContextPreviewModal.tsx` 从地图菜单“数据”打开，只读展示 GameSnapshot
  v2、当前消息镜像、提示词、历史窗口和世界书引用。
- `window.toloveContextPreview()` 提供本地调试 JSON；不创建聊天楼层、不触发 shujuku/database。

| Check                                 | Status  | Evidence                                                                                     |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Changed-file ESLint                   | passed  | `pnpm lint -- src/webgame-ui/...` 无输出错误                                                 |
| Story generation/context contract     | passed  | `node src/webgame-ui/verify-story-generation.cjs` 输出 `story generation contract: passed`   |
| Diff whitespace                       | passed  | `git diff --check`                                                                           |
| TypeScript full workspace             | failed  | 仓库现有 Vue/Tavern 类型声明错误；另有根 `global.d.ts` duplicate `content`，不是本轮新增模块 |
| Development build / watch artifact    | not run | 用户本轮未要求 build；应在 `pnpm watch` 产物上做人工截图验收                                 |
| Browser visual interaction            | not run | 数据面板需人工打开地图菜单“数据”验收                                                         |
| Real host floors / shujuku / database | not run | 本轮明确禁止接通                                                                             |

当前最强接通标签仍是：**本地状态演示**。本地 messagesave 镜像和真实 `TavernHelper.generate()`
的既有标签不升级；数据面板不能证明 World Info 实际命中或任何宿主/插件链成功。

## 本轮增量：第二集春菜更衣室立绘与提示词触发

- `characters/haruna.ts` 登记 `changer-room` 分层立绘；实际可用表情只有 `shy -> b` 与 `anger -> c`，默认 `shy`，且闭眼的
  `shy` 不播放眨眼。
- `episodes/episode02/acts/act01.ts` 复用菈菈既有的 `portraitRules` 形式： `scene=changingRoom + focus=haruna` 唯一允许
  `portrait=changer-room`，其他本幕场景使用 `portrait=school-uniform`；两套立绘都进入当前幕 cast。
- `storyGenerationContext.ts` 继续从角色 rig 自动投影可用表情，并把幕级 `portraitRules`
  传给共享提示词；没有新增 episode02 或春菜特判。
- `storyGenerationPrompt.ts` 保留首个必经场景的主示例，并从同一 `portraitRules`
  为未被主示例覆盖的场景专用立绘追加完整合法行。第二集会得到
  `scene=changingRoom;focus=haruna;portrait=changer-room;expression=shy`，同时仍保留场景 IF 强制规则。
- 本地解析器继续拒绝场景、portrait 或 expression 不匹配的模型正文；世界书、行动结算、宿主消息和数据库链未改动。

| Check                                | Status  | Evidence                                                        |
| ------------------------------------ | ------- | --------------------------------------------------------------- |
| Static trigger-chain source review   | passed  | cast、rig、prompt 投影、IF 规则、解析和渲染调用链已逐段对读     |
| Prompt generation execution          | not run | 用户明确要求本轮不测试，未执行提示词生成脚本或真实 Tavern 生成  |
| Formatting / lint / TypeScript       | not run | 用户明确要求本轮不测试                                          |
| Development / production build       | not run | 用户明确要求本轮不测试                                          |
| Browser / visual portrait acceptance | not run | 等待用户在实际更衣室剧情中检查 shy、anger、眨眼、口型和图层对齐 |
| Human acceptance                     | not run | 等待用户审查                                                    |

当前最强接通标签：**静态本地生成链实现**。提示词规则和本地解析边界已写入源码，但未以本轮运行证据证明真实 Tavern 返回会采用专用立绘，也未新增宿主 hidden
floor、shujuku/ACU、插件或数据库接通。

## 本轮增量：更衣室脸部校准与通用立绘 model 工具

- `characters/haruna.ts` 不再让 `changer-room`
  沿用校服脸部窗口；随后保留用户在 model 校准台确定的位置与尺寸并优化拼接软边：eyes `399,210,221,124,feather=8`，mouth
  `399,331,221,60,feather=4`。这只修正更衣室 rig，校服 rig 保持原值；`shy` 仍禁用眨眼，`anger` 仍允许眨眼。
- `artsource/model/` 新增角色无关的独立校准页，默认预载 `artsource/sephie/`
  示例，但不进入 React、Zustand、剧情、Tavern 或生产资源注册链。它支持替换 body/mask/eyes/mouth、拖动与缩放窗口、方向键微调、逐帧与动作预览、四边 feather、图层/背景诊断、尺寸与越界提示、manifest 导入导出，以及
  `regions`/单表情完整 rig 的 TypeScript 输出。
- 校准页的 body `contain`、正方形生产舞台、三帧纵排和四边 feather 语义与当前 `LayeredPortrait`
  对齐。844×390 默认采用现有 tablet 档 `width=48%, right=4%, bottom=0`；GAL 舞台值只作为构图记录，不伪装成 rig 字段。
- 校准页允许临时查看 1–12 帧图集，但会把非三帧标为与当前正式组件不兼容；默认表情的 `blinking`
  可直接切换，避免闭眼表情导出后遗漏手工修正。

| Check                                 | Status   | Evidence                                                       |
| ------------------------------------- | -------- | -------------------------------------------------------------- |
| Source implementation inventory       | recorded | changer-room 专用坐标、model 四文件及生产契约边界已写入源码    |
| Formatting / lint / TypeScript        | not run  | 用户明确要求本轮不运行任何测试或检查命令                       |
| Development / production build        | not run  | 用户明确要求本轮只写代码                                       |
| Browser / model interaction           | not run  | 未打开校准页，等待用户自行加载素材与操作                       |
| Actual GAL changer-room visual review | not run  | 等待用户在第二集更衣室页检查 shy/anger、接缝、眨眼、口型和构图 |
| Human acceptance                      | not run  | 本轮视觉结果与工具可用性均等待用户验收                         |

当前最强接通标签：**源码实现完成，待人工视觉验收**。本轮没有新增生成、宿主消息、World
Info、shujuku/ACU、插件或数据库接通证据，也不以校准页的本地预览替代真实 GAL/Tavern 画面验收。

## 本轮增量：model 构图与画布同级布局

- `artsource/model/index.html` 把逻辑画布预览与 GAL 构图预览改为同级并排区域；窄屏时恢复纵向排列，减少校准时的上下滚动。
- 右侧参数把“逻辑画布与图集”和“GAL 构图画布”改为两个同级 fieldset。GAL 构图新增预览宽、高，人物尺寸、right、bottom 仍在同一区块直接调整。
- 人物舞台继续遵守正式 `LayeredPortrait`
  的正方形约束，不新增虚假的独立人物高度字段；界面会从预览宽度和人物尺寸实时显示换算后的 `宽 × 高 px`。manifest 同步保存
  `galViewport`，该数据仍只是校准记录，不进入运行时 rig。
- 逻辑画布缩放改用预览容器百分比，避免两块预览并排后继续以固定 720px 宽度挤出可视区域。

| Check                        | Status   | Evidence                                 |
| ---------------------------- | -------- | ---------------------------------------- |
| Source implementation record | recorded | HTML/CSS/JS 与 README 已更新             |
| Browser visual interaction   | not run  | 等待用户检查并排构图、输入密度和滚动体验 |
| Formatting / lint / build    | not run  | 本轮未执行                               |
| Human acceptance             | not run  | 等待用户确认新的参数层级是否更顺手       |

当前最强接通标签仍是：**源码实现完成，待人工视觉验收**。

## 本轮增量：春菜更衣室脸部采用人工坐标并优化拼接

- 用户在 `artsource/model/` 中逐帧调整并提供截图；工作区随后把 eyes Y 微调为 `210`。最终保留该人工位置与窗口尺寸：eyes
  `x=399,y=210,w=221,h=124`，mouth `x=399,y=331,w=221,h=60`。
- 基于相同坐标静态合成 shy/anger 的三帧对照后，将 eyes feather 从 `1` 调整为 `8`、mouth feather 从 `0` 调整为
  `4`，软化 eyes 底边和 mouth 顶边的横向拼接带，同时避免 `10/6` 进一步削弱腮红与线稿。
- 截图中的 GAL `size=50%, right=4%, bottom=0`
  仍属于构图预览记录；本轮目标是优化春菜脸部，没有把该值写入角色 rig，也没有修改会影响其他角色的全局
  `.layered-portrait-stage`。

| Check                       | Status   | Evidence                                  |
| --------------------------- | -------- | ----------------------------------------- |
| User calibration screenshot | recorded | 用户提供 model 校准台坐标与窗口参数截图   |
| Static all-frame comparison | recorded | shy/anger 三帧比较 `1/0` 与 `8/4` feather |
| Actual GAL visual review    | not run  | 新参数仍需用户回到第二集更衣室画面确认    |
| Formatting / lint / build   | not run  | 本轮未执行                                |
| Human acceptance            | not run  | 等待用户确认脸部接缝、比例、眨眼与口型    |

当前最强接通标签：**人工坐标与静态拼接优化已写入源码，待实际 GAL 验收**。

## 本轮增量：官方全量脸部坐标映射 CSV

- 扩大只读调查到官方素材库的 `Texture2D` 与 `TextAsset`。`TextAsset/ToLove` 中的 `Chara_Eye_Pos`、`Chara_Mouth_Pos`
  是 60 组角色/服装原始坐标权威；没有把 `Animator` 的通用情绪 FBX 当成脸部坐标来源。
- `artsource/model/official-face-coordinate-map.csv`
  收录 270 个分层立绘家族、1,629 对 eye/mouth 表情图集，另保留 4 个官方有坐标但素材库没有对应图集家族的 `position_only`
  记录。每行同时记录 body、mask、眼嘴文件、官方原始坐标、1024 逻辑舞台 region、源图集尺寸、三帧合同、官方启用标记和坐标证据方法。
- 网页舞台坐标先由官方表定位，再以同家族 `a` 表情首帧和 1024 body 的外圈像素对齐；默认眼窗为 `230x131`、嘴窗为
  `230x57`。猿山与校长的 4 个家族无法从默认 mouth 帧取得可信边缘匹配，相关 24 行明确标为
  `official_projection_from_aligned_eye`，没有把低可信自动结果伪装成实测值。
- 春菜 `005_02_05_a..f` 全部映射为 eyes `394,221,230,131`、mouth
  `394,349,230,57`。这份证据进一步确认更衣室 body/mask 属于 `005_02_05` 家族；当前 `characters/haruna.ts` 仍使用
  `005_03_05_b/c` 与人工窗口，本轮未改运行时代码。
- 用户截图已经反证此前 `feather=8/4`
  的“优化”结论：较大羽化会暴露底图旧脸并产生白雾、重影。旧分节中的该结论仅是历史记录，不再作为当前建议；真正根因是跨家族混用，后续实施应先换成同编号素材再做人审。

| Check                                     | Status  | Evidence                                                                       |
| ----------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| Official coordinate/source inventory      | passed  | 60 个官方坐标键完整覆盖；270 个现存家族均可解析到坐标键                        |
| Atlas pairing and dimensions              | passed  | 1,629 个 eye 与 1,629 个 mouth 一一配对；尺寸分别固定为 `256x512` 与 `256x256` |
| CSV static artifact inspection            | passed  | 1,633 条数据行、50 列可读；错误标记扫描无命中                                  |
| Project tests / lint / TypeScript / build | not run | 遵照用户要求未运行项目测试或构建                                               |
| Browser / GAL runtime                     | not run | 未打开 model 页面或剧情页面，未验证实际动画与接缝                              |
| Human acceptance                          | not run | 坐标与特殊回退仍需用户按角色逐帧抽查                                           |

当前最强接通标签：**官方表与像素对齐形成的本地参考数据**。CSV 是可追溯证据，不等于所有 1,629 组表情已经逐帧通过人工美术验收。

## 本轮增量：地图菜单 ToLOVE 大百科基础功能

- 本轮只接通地图菜单 `dictionary`，标题页 `tolove-dictionary`
  保持原状；没有增加解锁、搜索、假名分类、生成、宿主消息、World Info、shujuku/ACU、插件或数据库链。
- `data/lore-books/dictionary/entries.json` 保存从厂家 `TextAsset/ToLoveArg` 的 `Dictionary`
  表机械提取的 103 条中文词条；`data/dictionary.ts` 只解析和校验随包静态资料，不读取或写入游戏状态。
- `DictionaryPanel.tsx` 在现有地图框内提供无假名的词条列表、详情、前后词条、返回列表及关闭回地图；背景和左右翻页复用
  `bg_ji.png`、`ji_guide_L.png`、`ji_guide_R.png`，横线和滚动条按原截图作为运行时 CSS 绘制。
- 浏览器实拍第一次发现左右翻页素材以详情文章为定位基准并压住正文；随后把按钮移到辞典画框根层，重新打包和重载最新产物后复查，箭头位于画框两侧且不再遮挡正文。

| Check                                 | Status  | Evidence                                                                                                                                                           |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Official dictionary source comparison | passed  | 官方表 `RowNum=104` 含表头，实际 ID `0..102` 共 103 条；提取文件保留同 ID、中文名称、标题和说明                                                                    |
| Changed-file ESLint                   | passed  | 本轮 TS/TSX 改动文件 ESLint 无输出错误                                                                                                                             |
| Full ToLove TypeScript                | failed  | `pnpm typecheck:tolove` 被既有 `ContextPreviewModal.tsx`、`memory/storyTimeline.ts`、`memory/summaryRuntime.ts` 错误阻断；没有辞典文件报错，本轮未越权修改这些模块 |
| Development webpack artifact          | passed  | 最新源码和 `entries.json?raw` 已编入 `dist/Tokimeki_Memorial-To-love/index.html`                                                                                   |
| Browser list/detail interaction       | passed  | 最新产物中由地图菜单打开 103 条列表；打开第 97 条“寻找幽灵的机器”，右翻到第 98 条“轻轻松松跑步君”，再返回列表并关闭回地图                                          |
| Browser visual review                 | passed  | 1280×720 本地页面实拍复查列表、详情、横线、滚动条和修正后的画框两侧箭头；仅证明该视口的实际画面                                                                    |
| Browser console                       | passed  | 辞典交互没有运行错误；仅有本地页面缺少 Tavern Helper 存档接口的既有自动存档报错                                                                                    |
| Production build                      | not run | 本轮只生成开发产物；全项目 TypeScript 断点尚未解除                                                                                                                 |
| Human acceptance                      | not run | 等待用户确认画风、字体密度、列表/详情布局和基础交互                                                                                                                |

当前最强接通标签：**本地状态演示**。官方静态词条与地图辞典 UI 已接通，但没有词条解锁权威、宿主或数据库状态，也不以浏览器实拍替代用户的最终观感接受。

## 本轮增量：大百科列表边界与标题锚点校准

- 用户提供的 1619×957 对照截图反证了上一轮 1280×720 浏览器视觉检查的覆盖范围：旧版名牌使用 `left: 12.5%`，正文使用
  `left: 14.5%`，两者越过纸张左侧粉色边界且不共线；因此上一轮“Browser visual review
  passed”不能作为当前几何布局的有效接受证据。
- 名牌与正文改用共同的 `left: 19%` 锚点；名牌宽度由 `clamp(220px, 31%, 350px)` 收至
  `clamp(220px, 28.5%, 320px)`，保持右侧方格装饰但不让名牌过长。
- 正文右边界改为 `20.5%`，列表标题横线增加 `30px`
  右侧收口，使标题线与词条横线均停在滚动条左侧；原有纵向位置和词条行高未调整。

| Check                        | Status   | Evidence                                                                                                                                                                      |
| ---------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User counterexample          | recorded | 1619×957 截图明确显示旧版名牌、标题及横线边界与参考图存在差距，已据此撤销上一轮视觉通过结论的适用性                                                                           |
| CSS formatting               | passed   | `DictionaryPanel.css` 通过 Prettier 检查；仅输出仓库既有的 `jsxBracketSameLine` 弃用警告                                                                                      |
| Changed-file ESLint          | passed   | `DictionaryPanel.tsx` 与 `data/dictionary.ts` ESLint 无错误                                                                                                                   |
| Development webpack artifact | passed   | 最新开发产物已生成；`dist/Tokimeki_Memorial-To-love/index.html` SHA-256 为 `BC125254498898F440D5E622828E04F359311C875DBFA7C6210FE2CF8BEAC437`                                 |
| Browser visual review        | passed   | 最新开发产物在 1619×957 浏览器视口复跑地图→菜单→辞典：面板 `x=216,w=1187`，名牌与正文同为 `x=441.5`，标题横线右端 `x=1129.7`，词条区右端 `x=1159.7`；实拍中横线在滚动条前收口 |
| Fullscreen visual path       | not run  | 浏览器测试容器拒绝 iframe 全屏权限；本轮没有把非全屏实拍伪装成全屏验收                                                                                                        |
| Human acceptance             | not run  | 等待用户对照厂家参考图确认边界、名牌位置与词条列表位置                                                                                                                        |

当前最强接通标签仍为：**本地状态演示**。这次修正有同视口浏览器实拍支撑，但不等于用户已接受，也不把局部几何校准扩张成 100% 复刻结论。

## 本轮增量：把 `005_03_05_b/c` 转成更衣室 body 专用图集

- 用户确认必须保留 `005_03_05_b/c` 的强害羞与生气表情语义，不能改用 `005_02_05` 中不同语义的字母图；直接把 `03` 图集套进
  `02` body 会让贴片边缘、人物锚点与保存后的 body 像素不一致。
- 新增四张不覆盖原图的 clean integer atlas： `005_02_05_from_03_b_eye.png`、`005_02_05_from_03_b_mouth.png`、
  `005_02_05_from_03_c_eye.png`、`005_02_05_from_03_c_mouth.png`。eye 为 `230x393`，mouth 为
  `230x171`，均为三帧纵排，可直接对应 `230x131` 与 `230x57` 的正式窗口。
- 转换没有用整块 feather，也没有用会残留睁眼的 RGB 差值迁移。每帧保留 `03_b/c`
  的完整表情内核；eyes 的上、左、右外圈和 mouth 的左、右、下外圈，直接取实际 `haruna_changer_room.png` 对应窗口的 edge
  reference，再在窄带内过渡。eyes 底部与 mouth 顶部继续使用同一个 `03` 表情家族，并由现有 3px region 重叠衔接。
- 目标 region 固定为官方 `02` 坐标：eyes `394,221,230,131`、mouth `394,349,230,57`，运行时不需要额外
  `feather`。本轮没有修改 `characters/haruna.ts`，因此新图尚未进入剧情渲染。
- 当前目录中没有裸文件 `haruna_changer_room.png`，只有包含该 PNG 的
  `haruna_changer_room.7z`；本轮只解压到临时证据目录进行转换，没有擅自恢复运行资源。正式接入前必须先由用户决定是否把 body
  PNG 恢复到代码已引用的位置。

| Check                           | Status   | Evidence                                                                               |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| Clean atlas dimensions          | passed   | b/c 两套 eye 均为 `230x393`，mouth 均为 `230x171`                                      |
| Body-edge equality              | passed   | 六个 eye 帧的上/左/右最外圈、六个 mouth 帧的左/右/下最外圈与实际 body 对应像素完全相同 |
| Static actual-body comparison   | recorded | 对照了旧人工窗口、原始 03 直贴官方 02 窗口与 edge-graft 转换三种结果                   |
| `haruna.ts` integration         | not run  | 本轮明确只产出转换素材，没有改角色配置                                                 |
| Project tests / build / browser | not run  | 未运行测试、构建或页面；等待用户先看转换结果                                           |
| Human acceptance                | not run  | shy/anger 六帧接缝与表情仍需用户人工确认                                               |

当前最强接通标签：**实际更衣室 body 专用的静态转换素材已生成，尚未接入运行时，待人工逐帧验收**。

## 本轮增量：把春菜跨家族转换过程放进 model 校准台

- `artsource/model/` 不再只提供难以直接操作的全量 CSV。页面新增独立的“跨家族表情转换”工作区，明确分开源 eye/mouth
  atlas、目标 body edge reference、官方目标窗口、烘焙边缘带、当前帧输出和下载结果。
- 春菜预设直接加载 `005_03_05_b`（shy）或 `005_03_05_c`（anger），并填入 `005_02_05` 的官方 windows：eyes
  `394,221,230,131`、mouth `394,349,230,57`。默认 edge bands 为 eyes `8/10/10/0`、mouth `0/10/10/8`
  （top/left/right/bottom）；它们只在导出的 PNG 中混入目标 body 边缘，不写进 `PortraitRegion.feather`。
- 算法按纵排帧数切开源 atlas、缩放到目标窗口；每个选定边缘的最外圈完全取目标 body，对应带内向源表情逐步过渡，未选中的内核保持源表情。它不提供会残留旧眼嘴的 RGB 差值迁移，也没有把全窗口透明 feather 当成修复手段。
- 页面把“源当前帧 → 目标 body crop 与边缘带 → 新 atlas 当前帧”并列展示，并新增较大的目标 body 合成检查画布。eye、mouth
  atlas 与转换 JSON 可分别下载；配置 JSON 会记录输入名、目标画布、坐标、edge bands 和输出尺寸。
- 逻辑画布所在的主预览也已扩宽：宽屏优先给合成区留空间，参数区收窄；在宽度不足时才把参数与双预览改为纵向排列。
- 目标更衣室 body 仍只有 `.7z` 内的 PNG，工具明确要求用户选择解出的
  `haruna_changer_room.png`，或把上方已经载入的 body 作为 edge
  reference；没有把 archive 伪装成浏览器可读取图片，也没有修改 `characters/haruna.ts`。

| Check                                     | Status   | Evidence                                                              |
| ----------------------------------------- | -------- | --------------------------------------------------------------------- |
| Static source implementation review       | recorded | `index.html`、`model.css`、`model.js`、`README.md` 与转换流程逐项对读 |
| Browser / canvas interaction              | not run  | 用户本轮要求不启动页面或运行测试，等待其手动载入更衣室 body 后检查    |
| Project tests / lint / TypeScript / build | not run  | 用户明确要求本轮不测试                                                |
| `haruna.ts` runtime integration           | not run  | 本轮只完善可视化转换与说明，未改角色接入                              |
| Human acceptance                          | not run  | 等待用户检查 shy/anger 六帧、body 合成接缝、边缘带参数与大预览布局    |

当前最强接通标签：**转换工具源码已实现并清楚暴露参数，未替代实际 GAL 人工验收**。

## 本轮增量：完整 02/03 家族反例、流水线试运行与旧算法撤销

- 用户明确反证先前 body-edge-graft 结果“更不对”。前述“边缘像素相等”只证明矩形外圈相等，不能证明眼位、眉位、脸红、刘海、脸型或下巴正确；因此先前转换可用结论已撤销，旧算法只保留为失败对照。
- 用户补入完整 `005_02_05_a-f` 与 `005_03_05_a-c` 素材；官方库还显示 03_d-f。跨家族字母不是一一语义对应，且 03
  atlas 同时包含眼嘴以外的脸部与头发内容，不能依靠 11px 窗口偏移、整块扭曲或边缘拼接直接恢复。
- `artsource/model/cases/haruna-03-to-02/` 新增隔离的可复现案例：用 03_a/02_a body 窗口求中性 dense flow，按
  `03_b/c - 03_a` 的预乘 RGBA 差异生成变化区，再由 02 家族底图承载低频皮肤、脸型、发际、下巴与窗口边界。
- 案例提供官方参考、直接套用、整块 warp、02 底图、变化区和候选六阶段，以及“高频替换”“线稿保真”“中性归一”三种公式。中性归一因 shy 眼部出现黄色/棕色偏移被明确否决；高频替换仍仅是研究候选。
- 试运行已为 shy/anger 三种公式分别导出 clean integer atlas：eye `230×393`、mouth `230×171`，全部位于案例
  `outputs/`，没有覆盖角色目录。
- `artsource/model/index.html`
  现在内嵌大尺寸流水线观察器并直接链接高频候选 atlas。原 body-edge-graft 区改名为“旧边缘补图实验（已否决）”，仍可复现旧失败，但不得晋升。
- 当前 `HARUNA_CHANGER_ROOM_PORTRAIT` 仍引用原始 `005_03_05_b/c` 与人工窗口；mask 仍指向当前工作区中已不存在的
  `005_02_05_a.png`。本轮没有把研究输出接入 `haruna.ts`。

| Check                           | Status      | Evidence                                                                               |
| ------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| Full-family structural evidence | recorded    | 02/03 a-f 图集、两个 body、官方窗口、逐帧配准与失败对照已记录                          |
| Reproducible pipeline case      | generated   | manifest、输入哈希、生成脚本、48 张 1024px 阶段图与 12 张 clean atlas 均在隔离案例目录 |
| Legacy edge-graft acceptance    | rejected    | 用户反例撤销；只保留失败研究区                                                         |
| Model index presentation        | implemented | 大画布案例 iframe、独立入口与 high 输出链接已写入源码                                  |
| Browser / canvas interaction    | not run     | 按用户连续要求不打开浏览器，由用户自行查看                                             |
| Project tests / lint / build    | not run     | 本轮不测试                                                                             |
| `haruna.ts` runtime integration | not run     | 未晋升候选；当前 direct-03 与缺失 mask 链仍保持原状                                    |
| Human acceptance                | not run     | 等待用户在 model 大画布逐帧比较后决定公式与底图                                        |

当前最强接通标签：**跨家族转换已形成隔离、可复现、可观察且可导出 clean
atlas 的试运行流水线；旧 edge-graft 已撤销，高频候选尚未通过人工验收且未进入运行时**。

## 本轮增量：反假验证的 eyes / mouth 分项验收 loop

- 用户指出“脚本成功”“边缘数值”等是假验证，明确要求 eyes 和 mouth 分开制定验收标准，并要求从成熟公开方法中寻找可嵌套的处理链。`cases/haruna-03-to-02/acceptance-contract.json`
  因此把审查冻结为 `shy/anger x frame 0/1/2 x eyes/mouth = 12` 项；任何一项拒绝都不能晋升运行时资源。
- 在线资料已写入案例 README 与 config：scikit-image TV-L1 registration、OpenCV seamless clone /
  inpaint、LearnOpenCV 的 landmark -> triangulation -> clone face-swap 结构，以及 piecewise
  affine 的控制点前提。这些资料用于约束实现，不被描述为自动美术验收。
- 实际原尺寸阶段图已反证三条处理型分支：TV-L1 会把官方窗口已经解决的局部几何再次拉坏；连续凸包 Poisson 会把 03 下巴带入 02；目标动态区 Telea
  inpaint 会抹掉同时位于图层中的刘海。`poisson_normal` 与 `poisson_mixed` 现均为
  `rejected-visual-artifact`，只可作为失败对照，不能默认选用或拷贝到角色目录。
- 当前唯一待人审的产物是 `official_window`：按 `official-face-coordinate-map.csv` 的 02
  window 原样落位 03 的完整 atlas，没有伪称它已经解决跨家族问题。它的边界自动 gate 明确为
  `not-applicable`，因为只有最终 alpha 合成后的原尺寸画面能判断是否存在接缝；没有把该缺口伪装成数值通过。
- 案例页面增加 eyes /
  mouth 独立放大、12 项可回读的人工判定矩阵、备注与审查 JSON 导出。每个候选的判定只存浏览器 localStorage，导出记录仍固定
  `promotionAllowed: false`。生成器还输出两张原尺寸审查表： `outputs/review/official_window-eye-review.png` 与
  `outputs/review/official_window-mouth-review.png`，均保留目标窗口外上下文。
- `haruna.ts`、正式 `haruna_changer_room_*` 资源、GAL 运行时、Tavern 宿主/消息/插件/数据库链均未改动。

| Check                                     | Status         | Evidence                                                                                                                 |
| ----------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| CSV coordinate authority                  | recorded       | `005_02_05`: eyes `394,221,230,131`, mouth `394,349,230,57`; `005_03_05`: eyes `394,232,230,131`, mouth `394,360,230,57` |
| Candidate material generation             | generated      | 隔离案例重新生成 manifest、阶段图、三套 clean atlas 与 eyes/mouth 原尺寸审查表；不覆盖运行时文件                         |
| TV-L1 / Poisson / inpaint visual result   | rejected       | 原尺寸画面分别出现额头/眉眼折线、下巴横带与刘海损坏；保留为失败对照                                                      |
| Official-window baseline visual result    | recorded       | shy/anger 六帧和两张审查表已生成，尚未由用户接受                                                                         |
| Automated boundary record                 | not applicable | `official_window` 是完整官方 alpha 层的坐标基线，不能以零 delta 取代最终组合观感                                         |
| Project tests / lint / TypeScript / build | not run        | 遵照用户本轮“不要测试”要求                                                                                               |
| Browser / actual GAL / Tavern host        | not run        | 本轮不以页面或宿主实机结果冒充验收                                                                                       |
| Human acceptance                          | not run        | 等待用户按 12 项 eyes/mouth 合同审查；未全部接受前不得接入 `haruna.ts`                                                   |

当前最强接通标签：**隔离素材研究与人工验收工具，待用户视觉审查**。它不证明正式 GAL、Tavern、World
Info、宿主消息、shujuku/ACU、插件或数据库接通，也不证明候选可用。

## 本轮增量：春菜 02 底板 + 语义遮罩候选

- 用户已拒绝完整 `03` 图层直接落到 `02` 官方窗口的额头与下巴结果。本轮不再调整 `haruna.ts` 的官方窗口，也没有覆盖
  `haruna_changer_room_*` 正式资源。
- 新增 `cases/haruna-03-to-02/semantic-occlusion-config.json` 与 `build_semantic_occlusion_candidate.py`。候选每帧以实际
  `haruna_changer_room.png` 的同坐标裁片为底板，`03_b/c`
  仅在手工语义多边形内覆盖；同一 body 的 edge-connected 紫发区域会在 eyes 最上层回盖，mouth 最后再回盖目标下巴多边形。这避免官方
  `005_02_05_a_mouth` 与当前运行时 body 的下巴边缘差异再次形成白色锯齿线。
- 生成的 shy/anger clean atlas 位于 `outputs/semantic-occlusion/`，eye 为 `230 x 393`、mouth 为
  `230 x 171`；六张全身候选和两张 `2 expressions x 3 frames`
  原尺寸审查表也只存在于该案例目录。案例页和 model 首页均默认指向该候选，旧方法仍为失败对照。
- `case-manifest.json` 和 `case-data.js` 将该分支标为 `awaiting-human-review`，并将边界记录显式标为
  `not-applicable-human-mask-candidate`；没有用像素数值替代刘海、下巴、重影或表情语义的人眼判断。

| Check                                     | Status    | Evidence                                                                                           |
| ----------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| Candidate material generation             | generated | `semantic-occlusion-manifest.json`、两套 clean atlas、六张合成候选与两张总审查表已写入隔离案例目录 |
| Runtime asset / `haruna.ts` promotion     | not run   | 本轮只产生待审候选，未修改正式更衣室 atlas 或角色配置                                              |
| Project tests / lint / TypeScript / build | not run   | 遵照用户要求未运行任何测试或构建命令                                                               |
| Browser / actual GAL / Tavern host        | not run   | 未把案例页面或本地输出描述为实机验收                                                               |
| Human acceptance                          | not run   | 等待用户逐帧检查 shy/anger 的 eyes、mouth、额头和下巴                                              |

当前最强接通标签：**可调语义遮罩候选已生成，待人工视觉验收**。它不证明候选能够进入运行时，也不证明真实 GAL 或宿主链路已接通。

## 本轮增量：拒绝语义遮罩 v1，改为 02 原生脸片 + 03 稀疏特征

- 用户提供的 eyes / mouth 原尺寸审查图已反证 `semantic_occlusion_v1`：eyes 仍带入 `03` 的整片额头与脸宽，mouth 则截断
  `02` 的下巴。该候选已降为 `rejected-human-review`；旧输出继续留作失败证据，不能恢复为默认候选。
- 新增 `target-native-feature-config.json` 与 `build_target_native_feature_candidate.py`。当前候选使用 `005_02_05_c`
  原生 atlas 承载皮肤、刘海、脸颊、脸型、发梢和完整下巴；shy 以原生闭眼帧为底，anger 保留原生 0/1/2 眼球开合。
- 目标旧线稿只在人工限定的小区域内由 `skimage.restoration.inpaint_biharmonic` 清除。`03_b/c`
  经局部锚点变换后仅迁入非肤色的挤眼线、斜眉、汗滴轮廓与嘴芯；源皮肤、额头、脸颊、侧发、脸轮廓和下巴均没有像素所有权。
- 为消除 `02_c` eye atlas 与实际 `005_02_05_a` body 的顶边采样直线，eyes 只在上 10px、左右 6px 使用同一 `02_a`
  body 的窄边界参考；mouth 只在左右 6px、下 8px 使用该参考，最外 4px 精确锁回 body。该边带不含任何 `03` 像素。
- 新 clean atlas、六张完整候选、逐帧像素归属图和 eyes / mouth 两张六帧审查表仅写入 `outputs/target-native-features/` 与
  `assets/target-native-features/`。manifest 仍为 `promotionAllowed: false`，没有覆盖 `haruna_changer_room_*`
  正式资源，也没有修改 `GalMainStory/characters/haruna.ts`。
- 当前 VS Code `5500` 静态服务以仓库根目录为根，真实页面位于 `/src/webgame-ui/artsource/model/index.html`。仓库根新增
  `/artsource/model/index.html` 跳转入口，使用户原地址无需改变；本轮按要求没有用浏览器打开或验证该路由。
- NAI 或其他重绘工具仅记录为现有素材无法通过时的后备预选方案，本轮没有生成式改图、外部调用或运行时接入。

| Check                                       | Status      | Evidence                                                                      |
| ------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| Human rejection of `semantic_occlusion_v1`  | failed      | 用户提供的两张原尺寸审查图显示错误额头比例与缺失下巴；旧候选已冻结为 rejected |
| Target-native candidate material generation | generated   | 两套 clean atlas、六张完整候选、像素归属图与两张六帧审查表均写入隔离案例目录  |
| Static 5500 source route                    | implemented | 仓库根入口只跳转到唯一的 `src/webgame-ui/artsource/model/index.html` 源页面   |
| Runtime asset / `haruna.ts` promotion       | not run     | 未得到 12 项人工接受，禁止晋升                                                |
| Project tests / lint / TypeScript / build   | not run     | 遵照用户本轮“不要测试”要求                                                    |
| Browser / route / actual GAL / Tavern host  | not run     | 未打开页面、未发起实机或宿主验证                                              |
| Human acceptance of new candidate           | not run     | 等待用户逐帧检查新 eyes / mouth 审查表                                        |

当前最强接通标签：**目标家族原生脸片上的稀疏特征迁移候选已生成，仍待人工视觉验收**。素材生成成功与静态入口源码存在均不等于页面、真实 GAL 或 Tavern 链路已通过；任何运行时替换必须等待本候选 12 项全部人工接受后的新一轮明确授权。

## 本轮增量：拒绝 mouth 肤色矩形 v1，生成中心连通嘴芯 v2

- 用户的新原尺寸截图圈出了 `target_native_features_v1` 的 shy
  F0/F1/F2 嘴周浅色矩形。像素归属图确认 v1 的绿色源区域是完整矩形而非嘴形：`mouthRednessFloor=18` 把正常偏红的 `03`
  肤色误判为嘴部特征。该真人反例撤销 v1 的待审状态并将其冻结为
  `rejected-human-review`；`outputs/target-native-features/` 保留为失败对照，不再覆盖。
- 当前 `target_native_features_v2` 不再使用 redness 门。它先从 mouth
  ROI 外圈像素估计局部肤色，再按亮度或与该肤色的 RGB 距离寻找候选连通域；任何接触 ROI 外边界的连通域直接丢弃，只有与嘴部中心 seed 相交的区域可以进入源 mask。
- 目标 `02_c`
  旧嘴也改用同一类中心连通形状定位，只对真实嘴形扩大 2px 后做局部修补，不再 inpaint 整块四边形。eyes 的底板、线稿迁移、body 窄边界和官方 region 坐标均保持上一候选不变。
- v2 的源像素归属图已由矩形收缩为嘴线/口腔内部与独立汗滴；新 atlas、六张完整候选、逐帧归属图和两张六帧审查表只写入
  `outputs/target-native-features-v2/` 与 `assets/target-native-features-v2/`。manifest 仍固定
  `promotionAllowed: false`。
- model 首页、案例页默认公式、clean
  atlas 链接、输出 manifest 与说明均已切到 v2；v1 与更早失败分支仍可在公式栏中对照。本轮没有覆盖正式
  `haruna_changer_room_*` 文件，也没有修改 `GalMainStory/characters/haruna.ts`。

| Check                                          | Status    | Evidence                                                                       |
| ---------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| Human rejection of `target_native_features_v1` | failed    | 用户截图圈出 shy 三帧嘴周浅色矩形；v1 归属图显示源肤色被整块选中               |
| V2 candidate material generation               | generated | v2 两套 clean atlas、六张完整候选、12 张局部归属图与两张六帧审查表写入独立目录 |
| V2 source ownership                            | recorded  | 当前归属图中的绿色 mouth 区域只覆盖中心嘴芯和独立汗滴，不再覆盖 ROI 矩形       |
| Runtime asset / `haruna.ts` promotion          | not run   | 新候选尚未取得人工接受，禁止晋升                                               |
| Project tests / lint / TypeScript / build      | not run   | 遵照用户要求未运行测试或构建                                                   |
| Browser / actual GAL / Tavern host             | not run   | 未以当前打开的 model 页面或本地输出冒充实机验收                                |
| Human acceptance of v2                         | not run   | 等待用户检查新的 eyes / mouth 六帧审查图                                       |

当前最强接通标签：**mouth 肤色误选已在隔离 v2 候选中移除，仍待人工原尺寸验收**。v1 人工反例继续有效；生成器运行成功、归属区缩小或页面默认项变化都不代表 v2 已被接受，也不授权运行时替换。

## 历史候选（已被本轮审核退回）：资料页清晰度与 `record` 运行时错误修复

- 用户本轮明确要求移除毛玻璃/网页卡片观感、提升资料页尺寸与清晰度，并禁止主角属性页使用男主/梨斗图像。
- `CharacterArchivePanel` 改为单一响应式 stage：背景仍使用授权
  `bg_data1/bg_data2`，但 DOM 字体和官方角色图标按容器高度独立定尺寸，移除整层非等比
  `scale(x,y)`；资料线坐标修正为官方背景的四条蓝线；主角属性页不再挂载任何人物图片节点。
- 历史候选曾在资料页打开时隐藏标题、底部行动板、角色卡导入和事件日志，并重新计算 archive-only 高度；该布局已被用户审核退回，当前实现不再采用。
- `StoryHistoryArchive` 不再读取不存在的 `gameStore.save.record`，改订阅
  `useMemorySummaryArchiveStore.activeSaveUuid`；该字段与摘要运行时成对存档上下文一致。远端只有 `main`，当前为 `70ecc44`
  且仍含原错误 selector，因此崩溃不是“少 pull 了一个修复”。本地两处 `.git`
  都是空目录，当前副本不能执行或证明 branch/pull/merge；此前关于本地 `HEAD` 与 `origin/main` 相等的记录已撤回。

| Check                             | Status          | Evidence                                                                                                                                          |
| --------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root cause / source-map mapping   | passed          | `StoryHistoryArchive.tsx:72` 原 selector 与 dist inline offset `482370` 对应；`GameStore` 没有 `save` 字段                                        |
| `record` fix in fresh artifact    | passed          | fresh 生产包 `dist/webgame-ui/index.html` 中 `save.record` 与 `state.save` 命中数均为 0，`activeSaveUuid` 正常存在                                |
| Player image ban and visual scale | passed          | `verify-archive.mjs` 桌面/`844x390` 两视口：主角区图片数 0、stage 无 transform、icon aspect error < 0.02、无 archive frame shadow/radius          |
| Archive interaction/privacy       | passed          | 14 项专项回归：11 槽、锁定去身份、详情、左右/键盘、Escape、旧侧边档案、关闭、资源与 overflow                                                      |
| Development build / scoped ESLint | passed          | `pnpm build:dev`；`pnpm exec eslint` 目标 TSX 文件无 error                                                                                        |
| Full TypeScript                   | failed-existing | 10 条错误位于 `ContextPreviewModal`、`storyContextValidation`、`storyTimeline`、`summaryRuntime`；本轮 `StoryHistoryArchive` 的 `save` 错误已消失 |
| Production build                  | passed          | `pnpm build`；仅有既有的 707 KiB 单文件体积提示                                                                                                   |
| Production artifact identity      | passed          | `dist/webgame-ui/index.html`，723584 bytes，SHA-256 `D3712A794BF6976AC258F46F8DC8AA2F97913E77F1AFC01E2A5EA1F18105FF49`                            |
| Exact inline safety               | passed          | 删除前项目检查器的 self-test 通过；`legacyEntityPrefix/currencySign/replacementChar/replacementSpecial/syntaxErrors` 均为 0，inline script 数为 1 |
| Production browser matrix         | passed          | 生产包在 `1440x1100` 与 `844x390` 共 14 项通过；控制台、资源、横向溢出、主角禁图、清晰缩放和档案交互均通过                                        |
| Screenshot inspection             | passed          | 已实际打开最新生产截图；桌面和手机横屏无资料页毛玻璃/阴影，图标未拉伸，短横屏占满可用高度                                                         |
| Remote branch inspection          | passed          | `git ls-remote` 显示远端仅 `main@70ecc44`；远端同文件第 72 行仍读取 `state.save.record`                                                           |
| Local Git merge                   | not run         | 当前工作副本的 `.git` 目录为空，无法安全执行 pull/merge；需先恢复 Git 元数据或在旁路干净 clone 中迁移本地改动                                     |
| Real Tavern/host/plugin/database  | not run         | 当前证据仍只是本地 Zustand/UI 与协议 mock，不证明真实宿主链路                                                                                     |
| Human visual acceptance           | pending         | 等用户在目标 Tavern game-frame 复核无毛玻璃、尺寸与手机横屏观感                                                                                   |

历史候选当时的标签是：**本地资料页 UI 与错误 selector 已修复，生产自动回归通过；真实 Tavern/宿主仍未证明，人工视觉验收待完成**。该候选已被用户视觉审核退回，不能作为当前实现结论。
