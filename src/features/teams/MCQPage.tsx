import { useState, useEffect } from 'react'
import { Card, Button, Radio, Typography, Progress, Alert, message, notification } from 'antd'
import { QuestionCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface MCQOption {
  id: string
  text: string
  points: number
}

interface MCQData {
  question: string
  options: MCQOption[]
  correctAnswer: string
}

export default function MCQPage() {
  const navigate = useNavigate()
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const [api, contextHolder] = notification.useNotification();

  const mcqData: MCQData = {
    question: 'What year was the Eiffel Tower completed?',
    options: [
      { id: 'a', text: '1887', points: 0 },
      { id: 'b', text: '1889', points: 10 },
      { id: 'c', text: '1891', points: 0 },
      { id: 'd', text: '1893', points: 0 },
    ],
    correctAnswer: 'b',
  }

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isSubmitted) {
      // Auto-submit when time runs out
      setIsSubmitted(true)
      setResult('incorrect')
      message.warning('Time\'s up! Don\'t worry, you can still continue to the puzzle.')
      setTimeout(() => {
        navigate('/team/puzzle')
      }, 2000)
    }
  }, [timeLeft, isSubmitted, navigate])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = () => {
    if (!selectedAnswer && timeLeft > 0) return

    setIsSubmitted(true)
    const isCorrect = selectedAnswer === mcqData.correctAnswer
    setResult(isCorrect ? 'correct' : 'incorrect')

    // Show notification after MCQ submission
    api.open({
    message: "Your answer is submitted",
    description: "Proceeding to the next step(s).",
    showProgress: true,
    pauseOnHover: true,
  });

    if (isCorrect) {
      message.success('Correct Answer! Well done! You earned 10 points.')
      setTimeout(() => {
        navigate('/team/puzzle')
      }, 2000)
    } else {
      message.error('Incorrect Answer - Don\'t worry, you can still continue to the puzzle.')
      setTimeout(() => {
        navigate('/team/puzzle')
      }, 2000)
    }
  }

  const getProgressPercentage = () => {
    return ((180 - timeLeft) / 180) * 100
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {contextHolder}
      <div className="text-center px-2">
        <Title level={2} className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Checkpoint Question</Title>
        <Text type="secondary" className="text-sm sm:text-base">Answer the multiple choice question to proceed</Text>
      </div>

      {/* Timer Card */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mx-2 sm:mx-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClockCircleOutlined className="text-orange-600 text-base sm:text-lg" />
            <Text strong className="text-sm sm:text-base">Time Remaining</Text>
          </div>
          <Text className="text-xl sm:text-2xl font-bold text-orange-600">{formatTime(timeLeft)}</Text>
        </div>
        <Progress percent={getProgressPercentage()} strokeColor="#ea580c" className="mb-0" />
      </Card>

      {/* Question Card */}
      <Card className="mx-2 sm:mx-0">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <QuestionCircleOutlined className="text-base sm:text-lg" />
          <Title level={4} className="!mb-0 text-base sm:text-lg">Question</Title>
        </div>
        <Text type="secondary" className="block mb-3 sm:mb-4 text-sm sm:text-base">Choose the correct answer from the options below</Text>
        
        <div className="space-y-4 sm:space-y-6">
          <Title level={3} className="leading-relaxed text-base sm:text-lg md:text-xl">{mcqData.question}</Title>

          <Radio.Group
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={isSubmitted}
            className="w-full"
          >
            <div className="space-y-2 sm:space-y-3">
              {mcqData.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center p-3 sm:p-4 border rounded-lg transition-colors ${
                    isSubmitted
                      ? option.id === mcqData.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : option.id === selectedAnswer && option.id !== mcqData.correctAnswer
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200'
                      : selectedAnswer === option.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Radio value={option.id} className="mr-2 sm:mr-3 flex-shrink-0" />
                  <Text className="flex-1 text-sm sm:text-base">{option.text}</Text>
                  {isSubmitted && (
                    <div className="flex items-center ml-2 flex-shrink-0">
                      {option.id === mcqData.correctAnswer ? (
                        <CheckCircleOutlined className="text-green-500 text-base sm:text-lg" />
                      ) : option.id === selectedAnswer ? (
                        <CloseCircleOutlined className="text-red-500 text-base sm:text-lg" />
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Radio.Group>

          {!isSubmitted && (
            <Button 
              type="primary" 
              size="large" 
              onClick={handleSubmit} 
              disabled={!selectedAnswer} 
              className="w-full h-12 sm:h-auto text-sm sm:text-base"
            >
              Submit Answer
            </Button>
          )}

          {isSubmitted && (
            <div className="text-center space-y-3 sm:space-y-4">
              {result === 'correct' ? (
                <Alert
                  message="Correct Answer!"
                  description="You earned 10 points. Proceeding to puzzle..."
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  className="text-sm sm:text-base"
                />
              ) : (
                <Alert
                  message="Incorrect Answer"
                  description={`The correct answer was: ${mcqData.options.find((opt) => opt.id === mcqData.correctAnswer)?.text}. Don't worry, you can still continue!`}
                  type="error"
                  showIcon
                  icon={<CloseCircleOutlined />}
                  className="text-sm sm:text-base"
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Help Card */}
      <Card className="mx-2 sm:mx-0">
        <Title level={4} className="text-base sm:text-lg">Need Help?</Title>
        <ul className="text-xs sm:text-sm space-y-1 text-gray-600 mt-3 sm:mt-4 pl-4">
          <li>• Read the question carefully before selecting an answer</li>
          <li>• You have 3 minutes to answer</li>
          <li>• Correct answers earn you bonus points</li>
          <li>• You can still proceed even if you answer incorrectly</li>
        </ul>
      </Card>
    </div>
  )
}
