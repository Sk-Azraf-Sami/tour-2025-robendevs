import { useState, useEffect } from "react";
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
  Progress,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { FirestoreService } from "../../services/FireStoreService";
import type { Team as FirestoreTeam, Puzzle } from "../../types";

const { Title, Text } = Typography;

interface Team {
  id: string;
  name: string;
  username: string;
  password: string;
  members: number;
  progress: number;
  status: "active" | "completed" | "inactive";
  currentCheckpoint: number;
  createdAt: string;
  roadmap?: string[];
}

interface FormValues {
  name: string;
  username: string;
  password: string;
  members: number;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);

  // Load teams and puzzles from Firestore
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [firestoreTeams, allPuzzles] = await Promise.all([
          FirestoreService.getAllTeams(),
          FirestoreService.getAllPuzzles(),
        ]);
        setPuzzles(allPuzzles);
        // Map Firestore data to local Team interface
        const mappedTeams: Team[] = firestoreTeams.map((t) => ({
          id: t.id,
          name: t.username,
          username: t.username,
          password: t.passwordHash || "",
          members: t.members,
          progress:
            t.roadmap && t.roadmap.length > 0
              ? Math.round(((t.currentIndex || 0) / t.roadmap.length) * 100)
              : 0,
          status: t.isActive
            ? t.currentIndex >= (t.roadmap?.length || 0)
              ? "completed"
              : "active"
            : "inactive",
          currentCheckpoint: (t.currentIndex || 0) + 1,
          createdAt: t.createdAt || "",
          roadmap: t.roadmap,
        }));
        setTeams(mappedTeams);
      } catch (err) {
        message.error("Failed to load teams or puzzles");
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (editingTeam) {
        // Update Firestore team
        await FirestoreService.updateTeam(editingTeam.id, {
          username: values.username,
          passwordHash: values.password,
          members: values.members,
        });
        message.success("Team updated successfully");
      } else {
        // Fetch all puzzles to set checkpoints
        const puzzles = await FirestoreService.getAllPuzzles();
        // Find the starting puzzle (isStarting: true)
        const startingPuzzle = puzzles.find((p) => p.isStarting);
        if (!startingPuzzle) throw new Error("No starting puzzle found");
        // Exclude starting puzzle and shuffle the rest
        const otherPuzzles = puzzles.filter((p) => !p.isStarting);
        const shuffledOtherIds = otherPuzzles
          .map((p) => p.id)
          .sort(() => Math.random() - 0.5);
        // Roadmap: starting puzzle first, then shuffled others
        const puzzleIds = [startingPuzzle.id, ...shuffledOtherIds];
        // Create new Firestore team
        const newTeam: Omit<FirestoreTeam, "id"> = {
          username: values.username,
          passwordHash: values.password,
          members: values.members,
          roadmap: puzzleIds,
          currentIndex: 0,
          totalTime: 0,
          totalPoints: 0,
          isActive: false,
          legs: [],
        };
        await FirestoreService.createTeam(newTeam);
        message.success("Team created successfully");
      }
      // Refresh teams and puzzles
      const [firestoreTeams, allPuzzles] = await Promise.all([
        FirestoreService.getAllTeams(),
        FirestoreService.getAllPuzzles(),
      ]);
      setPuzzles(allPuzzles);
      const mappedTeams: Team[] = firestoreTeams.map((t) => ({
        id: t.id,
        name: t.username,
        username: t.username,
        password: t.passwordHash || "",
        members: t.members,
        progress:
          t.roadmap && t.roadmap.length > 0
            ? Math.round(((t.currentIndex || 0) / t.roadmap.length) * 100)
            : 0,
        status: t.isActive
          ? t.currentIndex >= (t.roadmap?.length || 0)
            ? "completed"
            : "active"
          : "inactive",
        currentCheckpoint: (t.currentIndex || 0) + 1,
        createdAt: t.createdAt || "",
        roadmap: t.roadmap,
      }));
      setTeams(mappedTeams);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      message.error(`Failed to save team: ${err.message || "Unknown error"}`);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    form.resetFields();
    setEditingTeam(null);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    form.setFieldsValue({
      name: team.name,
      username: team.username,
      password: team.password,
      members: team.members,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await FirestoreService.deleteTeam(id);
      message.success("Team deleted successfully");
      setTeams((prev) => prev.filter((team) => team.id !== id));
    } catch (err) {
      message.error("Failed to delete team");
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    setEditingTeam(null);
    form.setFieldsValue({
      name: "",
      username: "",
      password: "",
      members: 1,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (team: Team) => {
    setIsLoading(true);
    try {
      await FirestoreService.updateTeam(team.id, {
        isActive: team.status !== "active",
      });
      message.success(
        `Team ${team.name} is now ${team.status === "active" ? "inactive" : "active"}`
      );
      // Refresh teams
      const firestoreTeams = await FirestoreService.getAllTeams();
      setTeams(
        firestoreTeams.map((t) => ({
          id: t.id,
          name: t.username,
          username: t.username,
          password: t.passwordHash || "",
          members: t.members,
          progress:
            t.roadmap && t.roadmap.length > 0
              ? Math.round(((t.currentIndex || 0) / t.roadmap.length) * 100)
              : 0,
          status: t.isActive
            ? t.currentIndex >= (t.roadmap?.length || 0)
              ? "completed"
              : "active"
            : "inactive",
          currentCheckpoint: (t.currentIndex || 0) + 1,
          createdAt: t.createdAt || "",
          roadmap: t.roadmap,
        }))
      );
    } catch (err) {
      message.error("Failed to update team status");
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "processing";
      case "completed":
        return "success";
      case "inactive":
        return "default";
      default:
        return "default";
    }
  };

  // Create a lookup map for puzzle IDs to names (or checkpoint/text)
  const puzzleNameMap = puzzles.reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = p.checkpoint || p.id;
    return acc;
  }, {});

  const columns = [
    {
      title: "Team",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Team) => (
        <div>
          <Text strong className="text-sm sm:text-base">
            {name}
          </Text>
          <div className="text-xs text-gray-500">
            {record.members} member{record.members !== 1 ? "s" : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Credentials",
      key: "credentials",
      className: "hidden sm:table-cell",
      render: (_: unknown, record: Team) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserOutlined className="text-gray-400" />
            <Text className="text-sm font-mono">{record.username}</Text>
          </div>
          <div className="flex items-center gap-2">
            <LockOutlined className="text-gray-400" />
            <Text className="text-sm font-mono">{record.password}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Roadmap",
      key: "roadmap",
      render: (_: unknown, record: Team) => (
        <div className="flex flex-wrap gap-1">
          {(record.roadmap || []).map((cp, idx) => (
            <span
              key={cp}
              className="inline-block bg-indigo-100 text-indigo-700 rounded px-2 py-0.5 text-xs"
            >
              {idx + 1}: {puzzleNameMap[cp] || cp}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: "Progress",
      key: "progress",
      render: (_: unknown, record: Team) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Text className="text-xs sm:text-sm">
              Checkpoint {record.currentCheckpoint - 1}/
              {record.roadmap?.length || 0}
            </Text>
            <Text className="text-xs sm:text-sm font-medium">
              {record.progress}%
            </Text>
          </div>
          <Progress percent={record.progress} size="small" />
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={
            getStatusColor(status) as
              | "success"
              | "processing"
              | "default"
              | "error"
              | "warning"
          }
          text={
            <span className="text-xs sm:text-sm">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          }
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Team) => (
        <Space size="small">
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
            placement="topRight"
          >
            <Button type="text" icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
          <Button
            type={record.status === "active" ? "default" : "primary"}
            size="small"
            onClick={() => handleToggleActive(record)}
          >
            {record.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    { title: "Total Teams", value: teams.length, color: "text-blue-600" },
    {
      title: "Active Teams",
      value: teams.filter((t) => t.status === "active").length,
      color: "text-green-600",
    },
    {
      title: "Completed",
      value: teams.filter((t) => t.status === "completed").length,
      color: "text-purple-600",
    },
    {
      title: "Total Members",
      value: teams.reduce((sum, team) => sum + Number(team.members), 0),
      color: "text-orange-600",
    },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title level={2} className="!mb-1 text-lg sm:text-xl lg:text-2xl">
            Team Management
          </Title>
          <Text className="text-gray-600 text-sm sm:text-base">
            Create and manage team accounts for the treasure hunt
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Add New Team</span>
          <span className="sm:hidden">Add Team</span>
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[8, 8]} className="sm:gutter-16">
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card className="bg-gray-50 border border-gray-200">
              <div className={`text-base sm:text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">
                {stat.title}
              </div>
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
          loading={isLoading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
            responsive: true,
            size: "small",
          }}
          size="middle"
          locale={{
            emptyText: (
              <div className="py-6 sm:py-8 text-center">
                <TeamOutlined className="text-4xl text-gray-400 mb-4" />
                <Title level={4} className="text-gray-500">
                  No teams found
                </Title>
                <Text className="text-gray-400">
                  Get started by creating your first team.
                </Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingTeam ? "Edit Team" : "Create New Team"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          resetForm();
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
          {/*<Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: "Please enter the team name" }]}
          >
            <Input placeholder="Enter team name" />
          </Form.Item>
          */}

          <Form.Item
            name="username"
            label="Username (Team Name)"
            rules={[{ required: true, message: "Please enter the username" }]}
          >
            <Input placeholder="Enter login username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter the password" }]}
          >
            <Input.Password placeholder="Enter login password" />
          </Form.Item>

          <Form.Item
            name="members"
            label="Number of Members"
            rules={[
              { required: true, message: "Please enter number of members" },
            ]}
          >
            <Input
              type="number"
              min={1}
              max={10}
              placeholder="Number of team members"
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {editingTeam ? "Update" : "Create"} Team
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
