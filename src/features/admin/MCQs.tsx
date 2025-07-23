import { useState } from 'react'
import { 
  Card, 
  Typography, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Space, 
  Badge,
  Popconfirm,
  message,
  Row,
  Col
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface MCQOption {
  text: string
  points: number
}

interface MCQ {
  id: string
  question: string
  options: MCQOption[]
  createdAt: string
}

interface FormValues {
  question: string
  options: MCQOption[]
}

export default function MCQs() {
  const [mcqs, setMcqs] = useState<MCQ[]>([
    {
      id: "1",
      question: "What year was the Eiffel Tower completed?",
      options: [
        { text: "1887", points: 0 },
        { text: "1889", points: 10 },
        { text: "1891", points: 0 },
        { text: "1893", points: 0 },
      ],
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      question: "Which planet is known as the Red Planet?",
      options: [
        { text: "Venus", points: 0 },
        { text: "Mars", points: 10 },
        { text: "Jupiter", points: 0 },
        { text: "Saturn", points: 0 },
      ],
      createdAt: "2024-01-14",
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null)
  const [form] = Form.useForm()

  const handleSubmit = (values: FormValues) => {
    if (editingMCQ) {
      setMcqs(prev => 
        prev.map(mcq => 
          mcq.id === editingMCQ.id 
            ? { ...mcq, question: values.question, options: values.options }
            : mcq
        )
      )
      message.success('MCQ updated successfully')
    } else {
      const newMCQ: MCQ = {
        id: Date.now().toString(),
        question: values.question,
        options: values.options,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setMcqs(prev => [...prev, newMCQ])
      message.success('MCQ created successfully')
    }

    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    form.resetFields()
    setEditingMCQ(null)
  }

  const handleEdit = (mcq: MCQ) => {
    setEditingMCQ(mcq)
    form.setFieldsValue({
      question: mcq.question,
      options: mcq.options
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setMcqs(prev => prev.filter(mcq => mcq.id !== id))
    message.success('MCQ deleted successfully')
  }

  const handleAdd = () => {
    setEditingMCQ(null)
    form.setFieldsValue({
      question: '',
      options: [
        { text: '', points: 0 },
        { text: '', points: 0 },
        { text: '', points: 0 },
        { text: '', points: 0 }
      ]
    })
    setIsModalOpen(true)
  }

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      render: (text: string) => <Text className="font-medium">{text}</Text>
    },
    {
      title: 'Options',
      dataIndex: 'options',
      key: 'options',
      render: (options: MCQOption[]) => (
        <div className="space-y-1">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Text className="text-sm">{option.text}</Text>
              {option.points > 0 && (
                <Badge count={`${option.points}pts`} className="text-xs" />
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <Text className="text-sm text-gray-500">{date}</Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: MCQ) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete MCQ"
            description="Are you sure you want to delete this MCQ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const stats = [
    { title: "Total Questions", value: mcqs.length, color: "text-blue-600" },
    { title: "Active Questions", value: mcqs.length, color: "text-green-600" },
    { title: "Draft Questions", value: 0, color: "text-yellow-600" }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <Title level={2} className="!mb-1">MCQ Management</Title>
          <Text className="text-gray-600">Create and manage multiple choice questions for checkpoints</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          Add New Question
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        {stats.map((stat, index) => (
          <Col xs={8} key={index}>
            <Card className="bg-gray-50 border border-gray-200">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MCQs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={mcqs}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <QuestionCircleOutlined className="text-4xl text-gray-400 mb-4" />
                <Title level={4} className="text-gray-500">No questions found</Title>
                <Text className="text-gray-400">Get started by creating your first MCQ question.</Text>
              </div>
            )
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingMCQ ? "Edit MCQ" : "Add New MCQ"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: 'Please enter the question' }]}
          >
            <TextArea
              placeholder="Enter your question here..."
              rows={3}
            />
          </Form.Item>

          <Form.List name="options">
            {(fields) => (
              <>
                <Text strong>Options (4 required)</Text>
                {fields.map(({ key, name }) => (
                  <Row gutter={16} key={key} className="mt-2">
                    <Col span={16}>
                      <Form.Item
                        name={[name, 'text']}
                        rules={[{ required: true, message: 'Option text is required' }]}
                      >
                        <Input placeholder={`Option ${name + 1}`} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={[name, 'points']}
                        rules={[{ required: true, message: 'Points required' }]}
                      >
                        <InputNumber
                          placeholder="Points"
                          min={0}
                          max={100}
                          className="w-full"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => {
              setIsModalOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingMCQ ? 'Update' : 'Create'} MCQ
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
