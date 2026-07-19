import { create } from 'zustand';
import type { GameMapDefinition, LocationId, MapId, MapLocation, MapStore } from '../types';

const SAINAN_HIGH_LOCATION_IDS = [
  'gate',
  'classroom',
  'library',
  'cafeteria',
  'gym',
  'musicRoom',
  'rooftop',
  'courtyard',
] as const satisfies readonly LocationId[];

const SAINAN_TOWN_LOCATION_IDS = [
  'station',
  'shoppingStreet',
  'park',
  'riverbank',
  'residentialArea',
] as const satisfies readonly LocationId[];

export const LOCATIONS: Record<LocationId, MapLocation> = {
  gate: {
    id: 'gate',
    name: '校门',
    x: 0.8,
    y: 3.2,
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
  station: {
    id: 'station',
    name: '彩南站',
    x: 5,
    y: 4,
    color: '#2563eb',
    description: '连接彩南町与周边地区的车站。',
  },
  shoppingStreet: {
    id: 'shoppingStreet',
    name: '商店街',
    x: 2,
    y: 4.2,
    color: '#db2777',
    description: '放学后很热闹的商店街。',
  },
  park: {
    id: 'park',
    name: '彩南公园',
    x: 7,
    y: 2,
    color: '#16a34a',
    description: '住宅区旁安静开阔的公园。',
  },
  riverbank: {
    id: 'riverbank',
    name: '河堤',
    x: 5,
    y: 2,
    color: '#0891b2',
    description: '沿着彩南町河道延伸的堤岸。',
  },
  residentialArea: {
    id: 'residentialArea',
    name: '住宅区',
    x: 8,
    y: 1,
    color: '#7c3aed',
    description: '彩南町居民生活的住宅街。',
  },
};

export const MAPS: Record<MapId, GameMapDefinition> = {
  sainanHigh: {
    id: 'sainanHigh',
    name: '彩南高中',
    background: '/artsource/backgrounds/map.png',
    entryLocationId: 'gate',
    locationIds: SAINAN_HIGH_LOCATION_IDS,
  },
  sainanTown: {
    id: 'sainanTown',
    name: '彩南町',
    background: '/artsource/backgrounds/map1.png',
    entryLocationId: 'station',
    locationIds: SAINAN_TOWN_LOCATION_IDS,
  },
};

export function getMapForLocation(locationId: LocationId): GameMapDefinition {
  return Object.values(MAPS).find(map => map.locationIds.includes(locationId)) ?? MAPS.sainanHigh;
}

export const useMapStore = create<MapStore>(() => ({
  maps: MAPS,
  locations: LOCATIONS,
  width: 10,
  height: 6,
  cellSize: 140,
}));
