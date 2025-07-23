import { useState } from 'react'
import { 
  Card, 
  Typography, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Popconfirm,
  message,
  Row,
  Col,
  Upload,
  Image
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  QrcodeOutlined,
  UploadOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

interface PuzzleData {
  id: string
  text: string
  imageURL?: string
  code: string
  createdAt: string
}

interface FormValues {
  text: string
  imageURL?: string
  code: string
}

export default function Puzzles() {
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([
    {
      id: "1",
      text: "Find the statue of the famous explorer who discovered this land. Look for the bronze plaque at its base.",
      imageURL: "/placeholder.svg",
      code: "EXPLORER_STATUE_001",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      text: "Locate the red door with the golden handle. Count the windows above it and multiply by 3.",
      code: "RED_DOOR_PUZZLE_002",
      createdAt: "2024-01-14",
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPuzzle, setEditingPuzzle] = useState<PuzzleData | null>(null)
  const [form] = Form.useForm()

  const generateCode = () => {
    const randomCode = `PUZZLE_${Date.now().toString().slice(-6)}`
    form.setFieldValue('code', randomCode)
  }

  const handleSubmit = (values: FormValues) => {
    if (editingPuzzle) {
      setPuzzles(prev => 
        prev.map(puzzle => 
          puzzle.id === editingPuzzle.id 
            ? { ...puzzle, ...values }
            : puzzle
        )
      )
      message.success('Puzzle updated successfully')
    } else {
      const newPuzzle: PuzzleData = {
        id: Date.now().toString(),
        ...values,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setPuzzles(prev => [...prev, newPuzzle])
      message.success('Puzzle created successfully')
    }

    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    form.resetFields()
    setEditingPuzzle(null)
  }

  const handleEdit = (puzzle: PuzzleData) => {
    setEditingPuzzle(puzzle)
    form.setFieldsValue(puzzle)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setPuzzles(prev => prev.filter(puzzle => puzzle.id !== id))
    message.success('Puzzle deleted successfully')
  }

  const handleAdd = () => {
    setEditingPuzzle(null)
    form.setFieldsValue({
      text: '',
      imageURL: '',
      code: ''
    })
    setIsModalOpen(true)
  }

  const columns = [
    {
      title: 'Puzzle',
      dataIndex: 'text',
      key: 'text',
      render: (text: string, record: PuzzleData) => (
        <div className="flex items-start gap-3">
          {record.imageURL && (
            <Image
              src={record.imageURL}
              alt="Puzzle"
              width={60}
              height={60}
              className="rounded-lg object-cover"
              fallback="/placeholder.svg"
            />
          )}
          <div className="flex-1">
            <Text className="font-medium">{text}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <div className="flex items-center gap-2">
          <QrcodeOutlined className="text-gray-500" />
          <Text code className="text-sm">{code}</Text>
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
      render: (_: unknown, record: PuzzleData) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete Puzzle"
            description="Are you sure you want to delete this puzzle?"
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

  const categories = [
    { name: "Logic Puzzles", count: 0, icon: "🧩" },
    { name: "Word Puzzles", count: 0, icon: "📝" },
    { name: "Math Puzzles", count: 0, icon: "🔢" }
  ]

  const stats = [
    { title: "Total Puzzles", value: puzzles.length, color: "text-green-600" },
    { title: "Active Puzzles", value: puzzles.length, color: "text-blue-600" },
    { title: "Draft Puzzles", value: 0, color: "text-yellow-600" },
    { title: "Completed", value: 0, color: "text-purple-600" }
  ]

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title level={2} className="!mb-1 text-lg sm:text-xl lg:text-2xl">Puzzle Management</Title>
          <Text className="text-gray-600 text-sm sm:text-base">Create, edit, and manage puzzles and challenges for the tour</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Create New </span>Puzzle
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[12, 12]} className="sm:gutter-16">
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card className="bg-gray-50 border border-gray-200">
              <div className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">{stat.title}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Categories */}
      <Card title={<span className="text-sm sm:text-base">Puzzle Categories</span>}>
        <Row gutter={[12, 12]} className="sm:gutter-16">
          {categories.map((category, index) => (
            <Col xs={12} sm={8} lg={6} key={index}>
              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                <div className="text-xl sm:text-2xl mb-2">{category.icon}</div>
                <Title level={5} className="!mb-1 text-sm sm:text-base">{category.name}</Title>
                <Text className="text-xs sm:text-sm text-gray-500">{category.count} puzzles</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Puzzles Table */}
      <Card title={<span className="text-sm sm:text-base">Puzzles Library</span>}>
        <Table
          columns={columns}
          dataSource={puzzles}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            responsive: true
          }}
          scroll={{ x: 800 }}
          size="middle"
          locale={{
            emptyText: (
              <div className="py-6 sm:py-8 text-center">
                <PictureOutlined className="text-2xl sm:text-4xl text-gray-400 mb-2 sm:mb-4" />
                <Title level={4} className="text-gray-500 text-sm sm:text-base">No puzzles found</Title>
                <Text className="text-gray-400 text-xs sm:text-sm">Get started by creating your first puzzle.</Text>
              </div>
            )
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingPuzzle ? "Edit Puzzle" : "Create New Puzzle"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
        className="mobile-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="text"
            label="Puzzle Text"
            rules={[{ required: true, message: 'Please enter the puzzle text' }]}
          >
            <TextArea
              placeholder="Enter your puzzle description here..."
              rows={4}
            />
          </Form.Item>

          <Form.Item
            name="imageURL"
            label="Puzzle Image (Optional)"
          >
            <Input
              placeholder="Enter image URL or upload image"
              addonAfter={
                <Upload
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={(info) => {
                    // Handle image upload logic here
                    console.log('Upload:', info)
                  }}
                >
                  <Button icon={<UploadOutlined />} size="small">Upload</Button>
                </Upload>
              }
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Unique Code"
            rules={[{ required: true, message: 'Please enter or generate a unique code' }]}
          >
            <Input
              placeholder="Enter unique code for this puzzle"
              addonAfter={
                <Button onClick={generateCode} size="small">
                  Generate
                </Button>
              }
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => {
              setIsModalOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPuzzle ? 'Update' : 'Create'} Puzzle
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
