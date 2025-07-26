import { useState, useEffect, useCallback } from 'react'
import type { TeamData } from '../../types'
import { TEAM_CONSTANTS } from './constants'

// Hook for managing team timer - this is for legacy components
// Modern components should fetch elapsed time from backend via GameService.getTeamProgress()
export const useTeamTimer = (initialTime: number, isActive: boolean) => {
  const [currentTime, setCurrentTime] = useState(initialTime)

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1)
      }, TEAM_CONSTANTS.TIMER_UPDATE_INTERVAL)
      return () => clearInterval(interval)
    }
  }, [isActive])

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return { currentTime, formatTime }
}

// Hook for managing team progress
export const useTeamProgress = (initialData: TeamData) => {
  const [teamData, setTeamData] = useState<TeamData>(initialData)

  const updateProgress = useCallback((updates: Partial<TeamData>) => {
    setTeamData(prev => ({ ...prev, ...updates }))
  }, [])

  const getProgressPercentage = useCallback(() => {
    return (teamData.currentCheckpoint / teamData.totalCheckpoints) * 100
  }, [teamData.currentCheckpoint, teamData.totalCheckpoints])

  const nextCheckpoint = useCallback(() => {
    setTeamData(prev => ({
      ...prev,
      currentCheckpoint: Math.min(prev.currentCheckpoint + 1, prev.totalCheckpoints)
    }))
  }, [])

  const addPoints = useCallback((points: number) => {
    setTeamData(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + points
    }))
  }, [])

  return {
    teamData,
    updateProgress,
    getProgressPercentage,
    nextCheckpoint,
    addPoints
  }
}

// Hook for countdown timer (MCQ, etc.)
export const useCountdownTimer = (initialTime: number, onTimeUp?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (timeLeft > 0 && isActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && onTimeUp) {
      onTimeUp()
    }
  }, [timeLeft, isActive, onTimeUp])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getProgressPercentage = useCallback(() => {
    return ((initialTime - timeLeft) / initialTime) * 100
  }, [timeLeft, initialTime])

  const pause = useCallback(() => setIsActive(false), [])
  const resume = useCallback(() => setIsActive(true), [])
  const reset = useCallback(() => {
    setTimeLeft(initialTime)
    setIsActive(true)
  }, [initialTime])

  return {
    timeLeft,
    formatTime,
    getProgressPercentage,
    pause,
    resume,
    reset,
    isActive
  }
}
