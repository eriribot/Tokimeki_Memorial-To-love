Original prompt: $ponytail  $develop-web-game   现在sidebar 把 components\StatPanel.tsx以及进行学习哪些指令弄在地图下面就是从sidebar分离出来注意充分利用weight而不是高度不要有空白，就是尽量矮但是宽

- Moved StatPanel and Controls out of Sidebar and under the map in App.tsx.
- Reserved vertical budget in map scaling so the new bottom panel fits below the map.
- Fixed React mount timing for inline built HTML.
- Restyled bottom panel as one Tokimeki-style notebook board with lighter separators and mixed pastel button colors.
- Build passed: npm run build.
- Browser check passed: sidebar is portrait-only; bottom panel contains StatPanel and Controls; no console errors.
- Latest screenshot: layout-final.png.
- TODO: none.- 2026-06-26: Fixed classroom character sizing with ponytail scope: tachie images now use equal display width, portrait fallback keeps the existing box size. Kept map glass/background and chibi white card styling intact.
- Build passed: npm run build from repository root.
- 2026-06-26: Kept scene tachie grounded at the bottom of the map-stage, removed unused Player avatar from map rendering, and allowed library to enter the reused scene flow like classroom.
- Build passed: npm run build. Playwright localhost check passed against http://localhost:5500/dist/webgame-ui/.
- 2026-06-26: Library scene now uses existing /artsource/backgrounds/library.png via sceneBackground mapping in ClassroomScene.
- Build passed and localhost Playwright check passed.
- 2026-06-27: Moved map chibi avatars below location cards so they do not cover enter-scene buttons. Added scene-characters count class and wider/flexible tachie layout for 4-character scenes. Not built or browser-tested per user request.
