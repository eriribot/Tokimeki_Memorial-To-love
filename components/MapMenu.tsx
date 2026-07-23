import { useState } from 'react';
import { MAP_MENU_ITEMS, MENU_CURSOR, MENU_TOGGLE } from '../data/menuAssets';
import { returnToStart } from '../services/gameSession';
import { useGameStore } from '../stores/gameStore';
import { getMapForLocation, useMapStore } from '../stores/mapStore';
import type { GameMapDefinition } from '../types';
import { resolveAssetPath } from '../utils/assetPath';
import './Menu.css';

interface MapMenuProps {
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onOpenIndex: () => void;
  onOpenSettings: () => void;
}

export default function MapMenu({ onOpenSave, onOpenLoad, onOpenIndex, onOpenSettings }: MapMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('save');
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const setLocation = useGameStore(state => state.setLocation);
  const addLog = useGameStore(state => state.addLog);
  const maps = useMapStore(state => state.maps);
  const currentMap = getMapForLocation(currentLocationId);
  const targetMap = currentMap.id === 'sainanHigh' ? maps.sainanTown : maps.sainanHigh;
  const targetMapButton =
    targetMap.id === 'sainanTown' ? '/artsource/backgrounds/map_next02.png' : '/artsource/backgrounds/map_next01.png';

  const selectMap = (map: GameMapDefinition) => {
    if (map.id === currentMap.id) return;
    setLocation(map.entryLocationId);
    addLog(`你打开了${map.name}的地图。`);
  };

  const openMenu = () => {
    setSelectedId('save');
    setIsOpen(true);
  };

  const handleMenuAction = (item: (typeof MAP_MENU_ITEMS)[number]) => {
    setSelectedId(item.id);

    if (item.placeholder) return;

    if (item.id === 'save') {
      setIsOpen(false);
      onOpenSave();
      return;
    }

    if (item.id === 'load') {
      setIsOpen(false);
      onOpenLoad();
      return;
    }

    if (item.id === 'index') {
      setIsOpen(false);
      onOpenIndex();
      return;
    }

    if (item.id === 'settings') {
      setIsOpen(false);
      onOpenSettings();
      return;
    }

    if (item.id === 'title') {
      returnToStart();
      return;
    }
    setIsOpen(false);
  };

  return (
    <div className={`map-menu ${isOpen ? 'open' : ''}`}>
      <div className={`map-edge-switcher ${targetMap.id === 'sainanTown' ? 'is-left' : 'is-right'}`}>
        <img className="map-edge-switcher__art" src={resolveAssetPath(targetMapButton)} alt="" aria-hidden="true" />
        <button
          type="button"
          className="map-edge-switcher__trigger"
          aria-label={`前往${targetMap.name}`}
          title={`前往${targetMap.name}`}
          onClick={() => selectMap(targetMap)}
        >
          <img src={resolveAssetPath(targetMapButton)} alt="" aria-hidden="true" />
        </button>
      </div>

      {!isOpen && (
        <button
          id="map-menu-toggle"
          className="map-menu-toggle"
          type="button"
          aria-label="展开菜单栏"
          aria-expanded="false"
          onClick={openMenu}
        >
          <img src={resolveAssetPath(MENU_TOGGLE)} alt="" />
        </button>
      )}

      {isOpen && (
        <button className="map-menu-backdrop" type="button" aria-label="返回地图" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <nav className="map-menu-panel" aria-label="地图菜单">
          {MAP_MENU_ITEMS.map(item => (
            <button
              key={item.id}
              id={`map-menu-${item.id}`}
              type="button"
              className={`map-menu-item ${item.placeholder ? 'is-placeholder' : ''} ${selectedId === item.id ? 'is-selected' : ''}`}
              aria-label={item.label}
              aria-disabled={item.placeholder}
              onMouseEnter={() => setSelectedId(item.id)}
              onFocus={() => setSelectedId(item.id)}
              onClick={() => handleMenuAction(item)}
            >
              <img className="map-menu-selection" src={resolveAssetPath(MENU_CURSOR)} alt="" aria-hidden="true" />
              <img className="map-menu-icon" src={resolveAssetPath(item.icon)} alt="" aria-hidden="true" />
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
