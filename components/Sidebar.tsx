import { useState } from 'react'
import CharacterPortrait from './CharacterPortrait'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside className={`game-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? '收起信息栏' : '展开信息栏'}
      >
        <span className="sidebar-toggle-icon">{isOpen ? '›' : '‹'}</span>
        <span className="sidebar-toggle-text">信息</span>
      </button>

      <div className="sidebar-content">
        <CharacterPortrait />
      </div>
    </aside>
  )
}
