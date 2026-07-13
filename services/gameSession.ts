import { PERIODS, useGameStore } from '../stores/gameStore'
import { usePlayerStore } from '../stores/playerStore'
import { useCardStore } from '../stores/cardStore'

export function startNewSession() {
  usePlayerStore.getState().resetPlayer()

  const cards = useCardStore.getState()
  cards.resetTargets()
  cards.spawnTargetsForPeriod(PERIODS[0].key)

  useGameStore.getState().resetGameState()
}

export function resumeSession() {
  useGameStore.getState().resumeSession()
}

export function returnToStart() {
  useGameStore.getState().returnToStart()
}
