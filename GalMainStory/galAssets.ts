export const GALBOX_ASSETS = {
  messageWindow: '/artsource/galbox/msg_window.png',
  choiceWindows: {
    blue: '/artsource/galbox/choice_window_blue.png',
    pink: '/artsource/galbox/choice_window_pink.png',
  },
  headings: {
    blue: '/artsource/galbox/midashi01.png',
    pink: '/artsource/galbox/midashi02.png',
  },
  nextIndicatorFrames: [0, 1, 2, 3].map(frame => `/artsource/galbox/push_${frame}.png`),
} as const;
