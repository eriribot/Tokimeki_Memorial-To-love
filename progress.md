Original prompt: $ponytail  $develop-web-game   现在sidebar 把 components\StatPanel.tsx以及进行学习哪些指令弄在地图下面就是从sidebar分离出来注意充分利用weight而不是高度不要有空白，就是尽量矮但是宽

- Moved StatPanel and Controls out of Sidebar and under the map in App.tsx.
- Reserved vertical budget in map scaling so the new bottom panel fits below the map.
- Fixed React mount timing for inline built HTML.
- Restyled bottom panel as one Tokimeki-style notebook board with lighter separators and mixed pastel button colors.
- Build passed: npm run build.
- Browser check passed: sidebar is portrait-only; bottom panel contains StatPanel and Controls; no console errors.
- Latest screenshot: layout-final.png.
- TODO: none.