import { useState } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Checkbox,
  Row,
  Col,
  Avatar,
  Card
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined
} from "@ant-design/icons";

interface Employee {
  id: string;
  name: string;
  phone: string;
  department: string;
  birth_date: string;
  avatar: string;
  position: string;
}

const EmployeePage = () => {
  const [employees] = useState<Employee[]>([
    {
      id: "1",
      name: "Nguyễn Văn A",
      phone: "0123456789",
      department: "Kinh doanh",
      birth_date: "1995-02-12",
      avatar: "https://i.pravatar.cc/100?img=1",
      position: "Trưởng phòng",
    },
    {
      id: "2",
      name: "Trần Thị B",
      phone: "0987654321",
      department: "Tài chính",
      birth_date: "1998-07-21",
      avatar: "https://i.pravatar.cc/100?img=2",
      position: "Nhân viên",
    },
    {
      id: "3",
      name: "Lê Văn C",
      phone: "0911222333",
      department: "Kho",
      birth_date: "1993-11-04",
      avatar: "https://i.pravatar.cc/100?img=3",
      position: "Quản lý kho",
    },
  ]);

  /** Search */
  const [searchText, setSearchText] = useState("");

  /** Filter */
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  /** Department options */
  const departmentOptions = Array.from(
    new Set(employees.map((e) => e.department))
  );

  /** Filter employees */
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesDept =
      selectedDepts.length ? selectedDepts.includes(e.department) : true;
    return matchesSearch && matchesDept;
  });

  /** Table columns */
  const columns = [
    {
      title: "",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar: string) => <Avatar src={avatar} size={40} />,
      width: 60,
    },
    { title: "Tên", dataIndex: "name", key: "name" },
    { title: "Chức vụ", dataIndex: "position", key: "position" },
    { title: "SĐT", dataIndex: "phone", key: "phone" },
    { title: "Phòng ban", dataIndex: "department", key: "department" },
    { title: "Ngày sinh", dataIndex: "birth_date", key: "birth_date" },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Employee) => (
        <Button type="link" icon={<EyeOutlined />}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white w-full h-full">
      <Card title="Danh mục nhân viên">
        {/* Search + Filter */}
        <Row gutter={12} className="mb-4" align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm nhân viên"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterModalVisible(true)}
            >
              Bộ lọc
            </Button>
          </Col>
        </Row>

        {/* Table */}
        <Table
          dataSource={filteredEmployees}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>

      {/* Filter Modal */}
      <Modal
        title="Lọc theo phòng ban"
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onOk={() => setFilterModalVisible(false)}
      >
        <h4>Chọn phòng ban</h4>
        <Checkbox.Group
          value={selectedDepts}
          onChange={(checked) => setSelectedDepts(checked as string[])}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {departmentOptions.map((dept) => (
            <Checkbox key={dept} value={dept}>
              {dept}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal>
    </div>
  );
};

export default EmployeePage;
