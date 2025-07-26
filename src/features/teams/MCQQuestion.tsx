import { useState } from 'react'
import { Card, Radio, Button, Typography, Space, Alert } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
// Import timer hook if needed for countdown functionality
// import { useCountdownTimer } from './hooks'

const { Title, Text } = Typography

/**
 * BACKEND INTEGRATION:
 * This interface should match the structure of MCQ options in Firestore
 * See the MCQOption interface in types/index.ts for reference
 */
interface MCQOption {
  id: string
  text: string
  points: number
}

/**
 * BACKEND INTEGRATION:
 * This interface defines the props expected by the MCQQuestion component
 * The 'question' prop should be populated from Firestore data
 */
interface MCQQuestionProps {
  question?: {
    id: string
    text: string
    options: MCQOption[]
  }
  onSubmit: (answer: { optionId: string; points: number }) => void
}

export default function MCQQuestion({ question, onSubmit }: MCQQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  /**
   * BACKEND INTEGRATION:
   * 1. The mock question should be replaced with actual data from Firestore
   * 2. Consider adding a countdown timer for MCQ answering
   * 3. The timeLimit could be a configurable setting in Firestore
   * 
   * Example of timer implementation:
   * const { timeLeft, formatTime } = useCountdownTimer(180, () => {
   *   // Auto-submit on timeout with no points
   *   handleSubmit();
   * });
   */

  // Mock question data
  const mockQuestion = {
    id: '1',
    text: 'What year was this landmark built?',
    options: [
      { id: '1', text: '1920', points: 10 },
      { id: '2', text: '1925', points: 20 }, // Correct answer
      { id: '3', text: '1930', points: 5 },
      { id: '4', text: '1935', points: 0 }
    ]
  }

  const currentQuestion = question || mockQuestion

  const handleSubmit = async () => {
    if (!selectedOption) return

    setIsSubmitting(true)
    
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const selectedOptionData = currentQuestion.options.find(opt => opt.id === selectedOption)
    
    onSubmit({
      optionId: selectedOption,
      points: selectedOptionData?.points || 0
    })
    
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircleOutlined className="text-4xl text-green-500 mb-2" />
        <Title level={4}>Answer the Question</Title>
        <Text className="text-gray-600">
          Choose the correct answer to earn points
        </Text>
      </div>

      <Alert
        message="Quick Tip"
        description="Different answers may give different points. Choose wisely!"
        type="info"
        showIcon
        className="mb-4"
      />

      <br/>

      <Card className="border-2 border-blue-200">
        <Title level={5} className="mb-4">{currentQuestion.text}</Title>
        
        <Radio.Group 
          onChange={(e) => setSelectedOption(e.target.value)}
          value={selectedOption}
          className="w-full"
        >
          <Space direction="vertical" className="w-full">
            {currentQuestion.options.map((option) => (
              <Card 
                key={option.id}
                size="small" 
                className={`cursor-pointer transition-colors ${
                  selectedOption === option.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-gray-400'
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <Radio value={option.id} className="w-full">
                  <Text>{option.text}</Text>
                </Radio>
              </Card>
            ))}
          </Space>
        </Radio.Group>
      </Card>

      <br/>

      <div className="flex gap-3">
        <Button 
          type="primary" 
          size="large"
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          loading={isSubmitting}
          className="flex-1"
          icon={<CheckCircleOutlined />}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </div>

      <div className="text-center">
        <Text className="text-sm text-gray-500">
          <ClockCircleOutlined className="mr-1" />
          Take your time to think about the answer
        </Text>
      </div>
    </div>
  )
}