import { useState, useEffect } from 'react'
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
  Col,
  Spin
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { FirestoreService } from '../../services/FireStoreService'
import type { MCQ, MCQOption } from '../../types'

const { Title, Text } = Typography
const { TextArea } = Input

interface FormValues {
  text: string
  options: MCQOption[]
}

export default function MCQs() {
  const [mcqs, setMcqs] = useState<MCQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null)
  const [form] = Form.useForm()

  // Load MCQs from Firestore
  useEffect(() => {
    async function fetchMCQs() {
      setIsLoading(true)
      try {
        const data = await FirestoreService.getAllMCQs()
        setMcqs(data)
      } catch (err) {
        message.error('Failed to load MCQs')
      }
      setIsLoading(false)
    }
    fetchMCQs()
  }, [])

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      if (editingMCQ) {
        await FirestoreService.updateMCQ(editingMCQ.id, {
          text: values.text,
          options: values.options
        })
        message.success('MCQ updated successfully')
      } else {
        await FirestoreService.createMCQ({
          text: values.text,
          options: values.options
        })
        message.success('MCQ created successfully')
      }
      // Refresh MCQs
      const data = await FirestoreService.getAllMCQs()
      setMcqs(data)
      setIsModalOpen(false)
      resetForm()
    } catch (err) {
      message.error('Failed to save MCQ')
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    form.resetFields()
    setEditingMCQ(null)
  }

  const handleEdit = (mcq: MCQ) => {
    setEditingMCQ(mcq)
    form.setFieldsValue({
      text: mcq.text,
      options: mcq.options
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    try {
      await FirestoreService.deleteMCQ(id)
      message.success('MCQ deleted successfully')
      setMcqs(prev => prev.filter(mcq => mcq.id !== id))
    } catch (err) {
      message.error('Failed to delete MCQ')
    }
    setIsLoading(false)
  }

  const handleAdd = () => {
    setEditingMCQ(null)
    form.setFieldsValue({
      text: '',
      options: [
        { text: '', value: 0 },
        { text: '', value: 0 },
        { text: '', value: 0 },
        { text: '', value: 0 }
      ]
    })
    setIsModalOpen(true)
  }

  const columns = [
    {
      title: 'Question',
      dataIndex: 'text',
      key: 'text',
      render: (text: string) => (
        <Text className="font-medium text-sm sm:text-base" ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Options',
      dataIndex: 'options',
      key: 'options',
      render: (options: MCQOption[]) => (
        <div className="space-y-1">
          {options.map((option, index) => (
            <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
              <Text ellipsis={{ tooltip: option.text }} className="flex-1 mr-2">
                {option.text}
              </Text>
              {option.value > 0 && (
                <Badge count={`${option.value}pts`} className="text-xs" />
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: MCQ) => (
        <Space size="small">
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
            placement="topRight"
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
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title level={2} className="!mb-1 text-lg sm:text-xl lg:text-2xl">MCQ Management</Title>
          <Text className="text-gray-600 text-sm sm:text-base">Create and manage multiple choice questions for checkpoints</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Add New Question</span>
          <span className="sm:hidden">Add Question</span>
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[12, 12]}>
        {stats.map((stat, index) => (
          <Col xs={8} sm={8} lg={8} key={index}>
            <Card className="bg-gray-50 border border-gray-200">
              <div className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">{stat.title}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MCQs Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={mcqs}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              responsive: true,
              showQuickJumper: false,
              size: 'small'
            }}
            size="middle"
            locale={{
              emptyText: (
                <div className="py-6 sm:py-8 text-center">
                  <QuestionCircleOutlined className="text-2xl sm:text-4xl text-gray-400 mb-2 sm:mb-4" />
                  <Title level={4} className="text-gray-500 text-base sm:text-lg">No questions found</Title>
                  <Text className="text-gray-400 text-sm">Get started by creating your first MCQ question.</Text>
                </div>
              )
            }}
          />
        )}
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
            name="text"
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
                        name={[name, 'value']}
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
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {editingMCQ ? 'Update' : 'Create'} MCQ
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}