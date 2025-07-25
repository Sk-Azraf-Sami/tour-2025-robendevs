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
  Popconfirm,
  message,
  Row,
  Col,
  Upload,
  Image,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  QrcodeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { FirestoreService } from "../../services/FireStoreService";
import { GameService } from "../../services/GameService";
import type { Puzzle } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FormValues {
  text: string;
  imageURL?: string;
  code: string;
  hint?: string;
  checkpoint: string;
}

export default function Puzzles() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);

  // Load puzzles from Firestore
  useEffect(() => {
    async function fetchPuzzles() {
      setIsLoading(true);
      try {
        const data = await FirestoreService.getAllPuzzles();
        setPuzzles(data);
      } catch (err) {
        message.error("Failed to load puzzles");
      }
      setIsLoading(false);
    }
    fetchPuzzles();
  }, []);

  const generateCode = () => {
    const randomCode = `PUZZLE_${Date.now().toString().slice(-6)}`;
    form.setFieldValue("code", randomCode);
  };

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Find index for isStarting
      let puzzleIndex = editingPuzzle
        ? puzzles.findIndex((p) => p.id === editingPuzzle.id)
        : puzzles.length;

      const puzzleData: Partial<Puzzle> = {
        text: values.text.trim(),
        code: values.code.trim(),
        checkpoint: values.checkpoint.trim(),
        isStarting: puzzleIndex === 0,
      };

      // Only include imageURL if it has a valid value
      if (values.imageURL && values.imageURL.trim()) {
        puzzleData.imageURL = values.imageURL.trim();
      }

      // Only include hint if it has a valid value
      if (values.hint && values.hint.trim()) {
        puzzleData.hint = values.hint.trim();
      }

      if (editingPuzzle) {
        await FirestoreService.updatePuzzle(editingPuzzle.id, puzzleData);
        message.success("Puzzle updated successfully");
      } else {
        await FirestoreService.createPuzzle(puzzleData as Omit<Puzzle, "id">);
        message.success("Puzzle created successfully");
        const teams = await FirestoreService.getAllTeams();
        const allPuzzles = await FirestoreService.getAllPuzzles();
        const startingPuzzle = allPuzzles.find((p) => p.isStarting);
        const otherPuzzles = allPuzzles.filter((p) => !p.isStarting);
        for (const team of teams) {
          const shuffledOtherIds = otherPuzzles
            .map((p) => p.id)
            .sort(() => Math.random() - 0.5);
          const newRoadmap = startingPuzzle
            ? [startingPuzzle.id, ...shuffledOtherIds]
            : shuffledOtherIds;
          await FirestoreService.updateTeam(team.id, { roadmap: newRoadmap });
        }
        await GameService.resetGame();
        message.success("All teams' roadmaps updated and game reset");
      }

      // Refresh puzzles
      const data = await FirestoreService.getAllPuzzles();
      setPuzzles(data);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Firestore error details:", err);
      message.error(`Failed to save puzzle: ${err.message || "Unknown error"}`);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    form.resetFields();
    setEditingPuzzle(null);
  };

  const handleEdit = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    form.setFieldsValue({
      text: puzzle.text,
      imageURL: puzzle.imageURL,
      code: puzzle.code,
      hint: puzzle.hint,
      checkpoint: puzzle.checkpoint,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await FirestoreService.deletePuzzle(id);
      message.success("Puzzle deleted successfully");
      setPuzzles((prev) => prev.filter((puzzle) => puzzle.id !== id));
    } catch (err) {
      message.error("Failed to delete puzzle");
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    setEditingPuzzle(null);
    form.setFieldsValue({
      text: "",
      imageURL: "",
      code: "",
      hint: "",
      checkpoint: "",
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: "Puzzle",
      dataIndex: "text",
      key: "text",
      width: 260, // Fixed column width
      ellipsis: true, // Enable text truncation
      render: (text: string, record: Puzzle) => (
        <div className="flex items-start gap-3" style={{ minWidth: 0 }}>
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
          <div className="flex-1" style={{ minWidth: 0 }}>
            <Text
              className="font-medium"
              style={{
                display: "block",
                maxWidth: 180,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={text}
            >
              {text.length > 60 ? `${text.slice(0, 57)}...` : text}
            </Text>
            {record.hint && (
              <div>
                <Text
                  style={{
                    display: "block",
                    maxWidth: 180,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  type="secondary"
                  className="text-xs block mt-1"
                >
                  {" "}
                  Hint:{" "}
                  {record.hint.length > 40
                    ? `${record.hint.slice(0, 37)}...`
                    : record.hint}
                </Text>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <div className="flex items-center gap-2">
          <QrcodeOutlined className="text-gray-500" />
          <Text code className="text-sm">
            {code}
          </Text>
        </div>
      ),
    },
    {
      title: "Checkpoint",
      dataIndex: "checkpoint",
      key: "checkpoint",
      render: (checkpoint: string) => (
        <Text className="text-blue-600">{checkpoint}</Text>
      ),
    },
    {
      title: "Is Starting",
      dataIndex: "isStarting",
      key: "isStarting",
      render: (isStarting: boolean) => (
        <Text className={isStarting ? "text-green-600" : "text-gray-500"}>
          {isStarting ? "Yes" : "No"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Puzzle) => (
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
            <Button type="text" icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // const categories = [
  //   { name: "Logic Puzzles", count: 0, icon: "🧩" },
  //   { name: "Word Puzzles", count: 0, icon: "📝" },
  //   { name: "Math Puzzles", count: 0, icon: "🔢" }
  // ]

  const stats = [
    { title: "Total Puzzles", value: puzzles.length, color: "text-green-600" },
    { title: "Active Puzzles", value: puzzles.length, color: "text-blue-600" },
    { title: "Draft Puzzles", value: 0, color: "text-yellow-600" },
    { title: "Completed", value: 0, color: "text-purple-600" },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 space-y-3 sm:space-y-0">
        <div>
          <Title level={2} className="!mb-1 text-lg sm:text-xl lg:text-2xl">
            Puzzle Management
          </Title>
          <Text className="text-gray-600 text-sm sm:text-base">
            Create, edit, and manage puzzles and challenges for the tour
          </Text>
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
              <div className={`text-lg sm:text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">
                {stat.title}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Categories 
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
*/}
      {/* Puzzles Table */}
      <Card
        title={<span className="text-sm sm:text-base">Puzzles Library</span>}
      >
        {isLoading ? (
          <div className="py-12 text-center">
            <PictureOutlined className="text-4xl text-gray-400 mb-4" />
            <Text className="text-gray-500 text-lg">Loading puzzles...</Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={puzzles}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
              responsive: true,
            }}
            scroll={{ x: 800 }}
            size="middle"
            locale={{
              emptyText: (
                <div className="py-6 sm:py-8 text-center">
                  <PictureOutlined className="text-2xl sm:text-4xl text-gray-400 mb-2 sm:mb-4" />
                  <Title
                    level={4}
                    className="text-gray-500 text-sm sm:text-base"
                  >
                    No puzzles found
                  </Title>
                  <Text className="text-gray-400 text-xs sm:text-sm">
                    Get started by creating your first puzzle.
                  </Text>
                </div>
              ),
            }}
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingPuzzle ? "Edit Puzzle" : "Create New Puzzle"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          resetForm();
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
            rules={[
              { required: true, message: "Please enter the puzzle text" },
            ]}
          >
            <TextArea
              placeholder="Enter your puzzle description here..."
              rows={4}
            />
          </Form.Item>

          <Form.Item name="imageURL" label="Puzzle Image (Optional)">
            <Input
              placeholder="Enter image URL"
              addonAfter={
                <Upload
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={(info) => {
                    // Handle image upload logic here
                    console.log("Upload:", info);
                  }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    size="small"
                    onClick={() =>
                      window.open("https://imgur.com/upload", "_blank")
                    }
                  >
                    Upload
                  </Button>
                </Upload>
              }
            />
          </Form.Item>

          <Form.Item name="hint" label="Puzzle Hint (Optional)">
            <Input placeholder="Enter a hint for this puzzle (optional)" />
          </Form.Item>

          <Form.Item
            name="checkpoint"
            label="Checkpoint"
            rules={[{ required: true, message: "Please enter the checkpoint" }]}
          >
            <Input placeholder="Enter checkpoint for this puzzle" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Unique Code"
            rules={[
              {
                required: true,
                message: "Please enter or generate a unique code",
              },
            ]}
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
            <Button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {editingPuzzle ? "Update" : "Create"} Puzzle
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
