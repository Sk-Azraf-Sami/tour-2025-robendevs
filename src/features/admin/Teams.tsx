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
  Badge,
  Popconfirm,
  message,
  Row,
  Col,
  Progress
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  LockOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface Team {
  id: string
  name: string
  username: string
  password: string
  members: number
  progress: number
  status: 'active' | 'completed' | 'inactive'
  currentCheckpoint: number
  createdAt: string
}

interface FormValues {
  name: string
  username: string
  password: string
  members: number
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: "1",
      name: "Team Alpha",
      username: "team_alpha",
      password: "alpha123",
      members: 4,
      progress: 75,
      status: "active",
      currentCheckpoint: 6,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Team Beta",
      username: "team_beta",
      password: "beta456",
      members: 3,
      progress: 50,
      status: "active",
      currentCheckpoint: 4,
      createdAt: "2024-01-14",
    },
    {
      id: "3",
      name: "Team Gamma",
      username: "team_gamma",
      password: "gamma789",
      members: 5,
      progress: 100,
      status: "completed",
      currentCheckpoint: 8,
      createdAt: "2024-01-13",
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [form] = Form.useForm()

  const handleSubmit = (values: FormValues) => {
    if (editingTeam) {
      setTeams(prev => 
        prev.map(team => 
          team.id === editingTeam.id 
            ? { ...team, ...values }
            : team
        )
      )
      message.success('Team updated successfully')
    } else {
      const newTeam: Team = {
        id: Date.now().toString(),
        ...values,
        progress: 0,
        status: "inactive",
        currentCheckpoint: 0,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setTeams(prev => [...prev, newTeam])
      message.success('Team created successfully')
    }

    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    form.resetFields()
    setEditingTeam(null)
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    form.setFieldsValue({
      name: team.name,
      username: team.username,
      password: team.password,
      members: team.members
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setTeams(prev => prev.filter(team => team.id !== id))
    message.success('Team deleted successfully')
  }

  const handleAdd = () => {
    setEditingTeam(null)
    form.setFieldsValue({
      name: '',
      username: '',
      password: '',
      members: 1
    })
    setIsModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'processing'
      case 'completed': return 'success'
      case 'inactive': return 'default'
      default: return 'default'
    }
  }

  const columns = [
    {
      title: 'Team',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Team) => (
        <div>
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-blue-500" />
            <Text strong>{name}</Text>
          </div>
          <Text className="text-xs text-gray-500">{record.members} members</Text>
        </div>
      )
    },
    {
      title: 'Credentials',
      key: 'credentials',
      render: (_: unknown, record: Team) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserOutlined className="text-gray-400" />
            <Text code className="text-xs">{record.username}</Text>
          </div>
          <div className="flex items-center gap-2">
            <LockOutlined className="text-gray-400" />
            <Text code className="text-xs">{record.password}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: unknown, record: Team) => (
        <div className="w-32">
          <Progress 
            percent={record.progress} 
            size="small" 
            status={record.status === 'completed' ? 'success' : 'active'}
          />
          <Text className="text-xs text-gray-500">
            Checkpoint {record.currentCheckpoint}/8
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={getStatusColor(status) as "success" | "processing" | "default" | "error" | "warning"} 
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
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
      render: (_: unknown, record: Team) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete Team"
            description="Are you sure you want to delete this team?"
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
    { title: "Total Teams", value: teams.length, color: "text-blue-600" },
    { title: "Active Teams", value: teams.filter(t => t.status === 'active').length, color: "text-green-600" },
    { title: "Completed", value: teams.filter(t => t.status === 'completed').length, color: "text-purple-600" },
    { title: "Total Participants", value: teams.reduce((sum, team) => sum + team.members, 0), color: "text-orange-600" }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <Title level={2} className="!mb-1">Team Management</Title>
          <Text className="text-gray-600">Create and manage team accounts for the treasure hunt</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          Add New Team
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        {stats.map((stat, index) => (
          <Col xs={6} key={index}>
            <Card className="bg-gray-50 border border-gray-200">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Teams Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={teams}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <TeamOutlined className="text-4xl text-gray-400 mb-4" />
                <Title level={4} className="text-gray-500">No teams found</Title>
                <Text className="text-gray-400">Get started by creating your first team.</Text>
              </div>
            )
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingTeam ? "Edit Team" : "Create New Team"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: 'Please enter the team name' }]}
          >
            <Input placeholder="Enter team name" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter the username' }]}
          >
            <Input placeholder="Enter login username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter the password' }]}
          >
            <Input.Password placeholder="Enter login password" />
          </Form.Item>

          <Form.Item
            name="members"
            label="Number of Members"
            rules={[{ required: true, message: 'Please enter number of members' }]}
          >
            <Input type="number" min={1} max={10} placeholder="Number of team members" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => {
              setIsModalOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingTeam ? 'Update' : 'Create'} Team
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
