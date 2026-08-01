# Tavern Inline Bundle Safety

## Use when

The exact shipped artifact is inline HTML or is pasted into a Tavern Helper/SillyTavern regex replacement field.

## Correctness boundary

Minified tokens can change after regex replacement and legacy HTML entity decoding. For example, `currentDate&&currentDate` can expose an `&curren` prefix and become invalid JavaScript. TypeScript, ESLint, webpack, source inspection, and direct-browser loading do not prove this final boundary.

## Invariants

- Fix source or build/minifier configuration; never hand-edit `dist` as the solution.
- Preserve the required delivery shape. Inline, compact, or obfuscated artifacts must remain so when those properties are part of the contract.
- Remove known risky source expressions before bundling. Build configuration is defense in depth, not a substitute.
- Do not use global beautification, disabled obfuscation, whole-bundle Base64, or broad string-array encoding merely to hide a proven unsafe token.
- Treat obfuscator output as generated-code input. Disable only the transform that emits unsafe replacement tokens while retaining the required compact identifier obfuscation.

## Required validation

Run the repository checker against the exact freshly built inline HTML used by Tavern. It must:

1. simulate regex replacement;
2. apply legacy entity decoding;
3. parse every resulting inline script;
4. prove `legacyEntityPrefix`, `currencySign`, `replacementChar`, `replacementSpecial`, and syntax-error counts are all zero;
5. prove the checked file is the intended fresh artifact, not a patched, stale, or differently configured copy.

A successful build is evidence only. Without this exact-artifact check, report the blocker and do not call the artifact reviewable. Create a checker only when that implementation is inside the authorized scope.
