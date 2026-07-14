const MENU_ROOT = '/artsource/ui/menu';

export const MENU_TOGGLE = `${MENU_ROOT}/menu.png`;
export const MENU_CURSOR = `${MENU_ROOT}/menu_cursor.png`;
export const START_MENU_CURSOR = '/artsource/ui/cursor.png';

export const START_MENU_ITEMS = [
  {
    id: 'restart',
    label: '重新开始',
    normal: `${MENU_ROOT}/menu_A01.png`,
    active: `${MENU_ROOT}/menu_B01.png`,
  },
  {
    id: 'continue',
    label: '继续游戏',
    normal: `${MENU_ROOT}/menu_A02.png`,
    active: `${MENU_ROOT}/menu_B02.png`,
  },
  {
    id: 'next-tolove',
    label: 'NextToLOVE3',
    normal: `${MENU_ROOT}/menu_A03.png`,
    active: `${MENU_ROOT}/menu_B03.png`,
  },
  {
    id: 'tolove-dictionary',
    label: 'ToLOVE3辞典',
    normal: `${MENU_ROOT}/menu_A04.png`,
    active: `${MENU_ROOT}/menu_B04.png`,
  },
  {
    id: 'gallery',
    label: '鉴赏',
    normal: `${MENU_ROOT}/menu_A05.png`,
    active: `${MENU_ROOT}/menu_B05.png`,
  },
  {
    id: 'settings',
    label: '系统设定',
    normal: `${MENU_ROOT}/menu_A06.png`,
    active: `${MENU_ROOT}/menu_B06.png`,
  },
] as const;

export const MAP_MENU_ITEMS = [
  { id: 'save', label: '保存', icon: `${MENU_ROOT}/menu_icon01.png`, placeholder: false },
  { id: 'load', label: '读取', icon: `${MENU_ROOT}/menu_icon02.png`, placeholder: false },
  { id: 'index', label: '目录', icon: `${MENU_ROOT}/menu_icon03.png`, placeholder: true },
  { id: 'data', label: '数据', icon: `${MENU_ROOT}/menu_icon04.png`, placeholder: true },
  { id: 'dictionary', label: '辞典', icon: `${MENU_ROOT}/menu_icon05.png`, placeholder: true },
  { id: 'settings', label: '系统设定', icon: `${MENU_ROOT}/menu_icon06.png`, placeholder: true },
  { id: 'title', label: '返回标题', icon: `${MENU_ROOT}/menu_icon07.png`, placeholder: false },
  { id: 'back', label: '返回', icon: `${MENU_ROOT}/menu_icon08.png`, placeholder: false },
] as const;
