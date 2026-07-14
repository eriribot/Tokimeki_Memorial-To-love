import { useState } from 'react';
import { MAP_MENU_ITEMS, MENU_CURSOR, MENU_TOGGLE } from '../data/menuAssets';
import { returnToStart } from '../services/gameSession';
import { resolveAssetPath } from '../utils/assetPath';
import './Menu.css';

interface MapMenuProps {
  onOpenSave: () => void;
  onOpenLoad: () => void;
}

export default function MapMenu({ onOpenSave, onOpenLoad }: MapMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('save');

  const openMenu = () => {
    setSelectedId('save');
    setIsOpen(true);
  };

  const handleMenuAction = (item: (typeof MAP_MENU_ITEMS)[number]) => {
    setSelectedId(item.id);

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

    if (item.placeholder) return;

    if (item.id === 'title') {
      returnToStart();
      return;
    }
    setIsOpen(false);
  };

  return (
    <div className={`map-menu ${isOpen ? 'open' : ''}`}>
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
