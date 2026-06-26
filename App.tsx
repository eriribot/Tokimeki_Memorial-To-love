import { useEffect, useState } from 'react'
import SchoolMap from './components/SchoolMap'
import Sidebar from './components/Sidebar'
import ClassroomScene from './components/ClassroomScene'
import StatPanel from './components/StatPanel'
import Controls from './components/Controls'
import EventLog from './components/EventLog'
import CardImporter from './components/CardImporter'
import { useGameStore } from './stores/gameStore'
import { useMapStore } from './stores/mapStore'
import './App.css'
import './enhancements.css'
import './map-enhancements.css'

function useMapScale(mapWidth, mapHeight) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = Math.max(320, window.innerWidth - 32)
      const availableHeight = Math.max(240, window.innerHeight - 240)
      setScale(Math.min(1, availableWidth / mapWidth, availableHeight / mapHeight))
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [mapWidth, mapHeight])

  return scale
}

function App() {
  const { width, height, cellSize } = useMapStore()
  const currentSceneId = useGameStore((state) => state.currentSceneId)
  const mapWidth = width * cellSize
  const mapHeight = height * cellSize
  const mapScale = useMapScale(mapWidth, mapHeight)

  return (
    <div className="app">
      <header className="game-header">
        <h1>校园心动回忆</h1>
      </header>

      <main className="game-layout">
        <section className="play-section">
          <div
            className="map-section"
            style={{
              width: mapWidth * mapScale,
              height: mapHeight * mapScale,
            }}
          >
            <div
              className="map-stage"
              style={{
                width: mapWidth,
                height: mapHeight,
                transform: `scale(${mapScale})`,
              }}
            >
              {currentSceneId ? (
                <ClassroomScene />
              ) : (
                <>
                  <SchoolMap />
                </>
              )}
            </div>
            <Sidebar />
          </div>

          <div className="map-bottom-panel">
            <StatPanel />
            <Controls />
          </div>
        </section>
      </main>

      <CardImporter />
      <EventLog />
    </div>
  )
}

export default App


