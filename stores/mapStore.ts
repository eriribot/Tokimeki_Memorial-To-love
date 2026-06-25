import { create } from 'zustand'

// 学校大地图：不同地点，不同时间段会出现不同角色
export const LOCATIONS = {
  gate: {
    id: 'gate',
    name: '校门',
    x: 0,
    y: 3,
    color: '#78350f',
    description: '每天上学放学的必经之地。',
  },
  classroom: {
    id: 'classroom',
    name: '教室',
    x: 2,
    y: 2,
    color: '#f59e0b',
    description: '上课和自习的地方。',
  },
  library: {
    id: 'library',
    name: '图书馆',
    x: 4,
    y: 1,
    color: '#10b981',
    description: '安静学习，偶遇文静系角色的好地方。',
  },
  cafeteria: {
    id: 'cafeteria',
    name: '食堂',
    x: 4,
    y: 3,
    color: '#f97316',
    description: '午休时间最热闹的地方。',
  },
  gym: {
    id: 'gym',
    name: '体育馆',
    x: 6,
    y: 2,
    color: '#ef4444',
    description: '运动系角色常在这里练习。',
  },
  musicRoom: {
    id: 'musicRoom',
    name: '音乐室',
    x: 6,
    y: 4,
    color: '#8b5cf6',
    description: '传来钢琴声的地方。',
  },
  rooftop: {
    id: 'rooftop',
    name: '天台',
    x: 8,
    y: 1,
    color: '#60a5fa',
    description: '午休和放课后会有人在吃便当。',
  },
  courtyard: {
    id: 'courtyard',
    name: '中庭',
    x: 8,
    y: 4,
    color: '#22c55e',
    description: '课间休息和约会的好去处。',
  },
}

export const useMapStore = create(() => ({
  locations: LOCATIONS,
  width: 10,
  height: 6,
  cellSize: 140,
}))
