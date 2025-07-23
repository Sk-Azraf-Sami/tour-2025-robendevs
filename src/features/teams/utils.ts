import { VALID_QR_CODES, POINTS_CONFIG } from './constants'
import type { QRScanResult, MCQQuestionData } from '../../types'

// QR Code validation utility
export const validateQRCode = (code: string): QRScanResult => {
  const normalizedCode = code.trim().toUpperCase()
  const isValid = (VALID_QR_CODES as readonly string[]).includes(normalizedCode)
  
  return {
    code: normalizedCode,
    isValid,
    checkpointId: isValid ? normalizedCode : undefined
  }
}

// Mock QR scan simulation
export const simulateQRScan = (successRate: number = 0.7): Promise<QRScanResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() < successRate
      if (success) {
        const randomCode = VALID_QR_CODES[Math.floor(Math.random() * VALID_QR_CODES.length)]
        resolve(validateQRCode(randomCode))
      } else {
        resolve(validateQRCode('INVALID_CODE_123'))
      }
    }, 2000)
  })
}

// Calculate MCQ points
export const calculateMCQPoints = (isCorrect: boolean, timeSpent: number, timeLimit: number): number => {
  if (!isCorrect) return POINTS_CONFIG.INCORRECT_MCQ
  
  const basePoints = POINTS_CONFIG.CORRECT_MCQ
  const timeBonus = Math.max(0, Math.floor((timeLimit - timeSpent) / 60) * POINTS_CONFIG.TIME_BONUS_PER_MINUTE)
  
  return basePoints + timeBonus
}

// Format time for display
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

// Generate mock MCQ data
export const generateMockMCQ = (): MCQQuestionData => {
  const questions = [
    {
      question: 'What year was the Eiffel Tower completed?',
      options: [
        { id: 'a', text: '1887', points: 0 },
        { id: 'b', text: '1889', points: 10 },
        { id: 'c', text: '1891', points: 0 },
        { id: 'd', text: '1893', points: 0 },
      ],
      correctAnswer: 'b'
    },
    {
      question: 'Which planet is known as the Red Planet?',
      options: [
        { id: 'a', text: 'Venus', points: 0 },
        { id: 'b', text: 'Jupiter', points: 0 },
        { id: 'c', text: 'Mars', points: 10 },
        { id: 'd', text: 'Saturn', points: 0 },
      ],
      correctAnswer: 'c'
    },
    {
      question: 'What is the capital of Australia?',
      options: [
        { id: 'a', text: 'Sydney', points: 0 },
        { id: 'b', text: 'Melbourne', points: 0 },
        { id: 'c', text: 'Canberra', points: 10 },
        { id: 'd', text: 'Perth', points: 0 },
      ],
      correctAnswer: 'c'
    }
  ]
  
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
  
  return {
    id: `mcq_${Date.now()}`,
    timeLimit: 180,
    ...randomQuestion
  }
}

// Calculate progress percentage
export const calculateProgress = (current: number, total: number): number => {
  return Math.round((current / total) * 100)
}

// Get next location for demonstration
export const getNextLocation = (checkpointIndex: number): string => {
  const locations = [
    'Central Library - Main Entrance',
    'University Museum - Garden', 
    'Clock Tower - East Side',
    'Student Plaza - Fountain',
    'Academic Building - Red Door',
    'Science Hall - Laboratory Wing',
    'Sports Complex - Main Gate',
    'Arts Center - Sculpture Garden'
  ]
  
  return locations[checkpointIndex % locations.length] || 'Unknown Location'
}

// Mock team activity generator
export const generateRecentActivity = () => {
  const activities = [
    'Completed Checkpoint',
    'Solved puzzle',
    'Answered MCQ correctly',
    'Scanned QR code',
    'Found hidden clue',
    'Reached milestone'
  ]
  
  const locations = [
    'Museum',
    'Library',
    'Clock Tower',
    'Student Center',
    'Garden',
    'Plaza'
  ]
  
  const timeAgo = ['2 minutes ago', '5 minutes ago', '8 minutes ago', '12 minutes ago']
  const points = ['+10 pts', '+15 pts', '+5 pts', '+20 pts']
  
  return Array.from({ length: 3 }, (_, index) => ({
    action: `${activities[Math.floor(Math.random() * activities.length)]} ${index + 1} at ${locations[Math.floor(Math.random() * locations.length)]}`,
    time: timeAgo[index] || `${(index + 1) * 5} minutes ago`,
    points: points[Math.floor(Math.random() * points.length)]
  }))
}
