import { useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Checkbox,
  Row,
  Col,
  Card,
  Space,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";

interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  categories: ReportCategory[];
}

interface ReportCategory {
  id: string;
  code: string;
  name: string;
  description: string;
}

const DepartmentCategoryPage = () => {
  const [departments] = useState<Department[]>([
    {
      id: "1",
      code: "KD",
      name: "Kinh doanh",
      description: "Phòng kinh doanh",
      categories: [
        { id: "c1", code: "SALE01", name: "Báo cáo doanh thu", description: "Theo tháng" },
        { id: "c2", code: "SALE02", name: "Báo cáo KPI", description: "Nhân viên" },
      ],
    },
    {
      id: "2",
      code: "TC",
      name: "Tài chính",
      description: "Phòng tài chính",
      categories: [
        { id: "c3", code: "FIN01", name: "Báo cáo chi phí", description: "" },
        { id: "c4", code: "FIN02", name: "Báo cáo ngân sách", description: "" },
      ],
    },
  ]);

  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  /** SEARCH STATE */
  const [searchDept, setSearchDept] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  /** FILTER STATE */
  const [deptFilterVisible, setDeptFilterVisible] = useState(false);
  const [categoryFilterVisible, setCategoryFilterVisible] = useState(false);

  const [deptFilters, setDeptFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);

  /** SELECTED FOR DELETE */
  const [selectedDeptKeys, setSelectedDeptKeys] = useState<React.Key[]>([]);
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<React.Key[]>([]);

  /** FILTER DEPARTMENT */
  const filteredDepts = departments.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(searchDept.toLowerCase());
    const matchFilter = deptFilters.length ? deptFilters.includes(d.code) : true;
    return matchSearch && matchFilter;
  });

  /** FILTER CATEGORIES */
  const filteredCategories = selectedDept
    ? selectedDept.categories.filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(searchCategory.toLowerCase());
        const matchFilter = categoryFilters.length ? categoryFilters.includes(c.code) : true;
        return matchSearch && matchFilter;
      })
    : [];

  /** DEPARTMENT COLUMNS */
  const deptColumns = [
    { title: "Mã", dataIndex: "code", key: "code" },
    {
      title: "Tên phòng ban",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Department) => (
        <a onClick={() => setSelectedDept(record)}>{text}</a>
      ),
    },
    { title: "Mô tả", dataIndex: "description", key: "description" },
  ];

  /** CATEGORY COLUMNS */
  const categoryColumns = [
    { title: "Mã", dataIndex: "code", key: "code" },
    { title: "Tên danh mục", dataIndex: "name", key: "name" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
  ];

  return (
    <div className="p-4 w-full bg-white h-full flex gap-4">

      {/* LEFT SIDE – DEPARTMENTS */}
      <Card title="Danh mục phòng ban" style={{ width: "35%" }}>

        {/* SEARCH + FILTER + DELETE */}
        <Row gutter={12} align="middle" className="mb-3">
          <Col flex="auto">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm phòng ban"
              value={searchDept}
              onChange={(e) => setSearchDept(e.target.value)}
            />
          </Col>
          <Col>
            <Button icon={<FilterOutlined />} onClick={() => setDeptFilterVisible(true)}>
              Bộ lọc
            </Button>
          </Col>
          {selectedDeptKeys.length > 0 && (
            <Col>
              <Button danger icon={<DeleteOutlined />}>
                Xóa ({selectedDeptKeys.length})
              </Button>
            </Col>
          )}
        </Row>

        <Table
          dataSource={filteredDepts}
          columns={deptColumns}
          rowKey="id"
          size="middle"
          rowSelection={{
            selectedRowKeys: selectedDeptKeys,
            onChange: (keys) => setSelectedDeptKeys(keys),
          }}
          pagination={false}
        />
      </Card>

      {/* RIGHT SIDE – CATEGORIES */}
      <Card
        title={`Đầu mục báo cáo ${selectedDept ? "- " + selectedDept.name : ""}`}
        style={{ flex: 1 }}
      >
        {/* SEARCH + FILTER + DELETE */}
        <Row gutter={12} align="middle" className="mb-3">
          <Col flex="auto">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm danh mục"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            />
          </Col>
          <Col>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setCategoryFilterVisible(true)}
              disabled={!selectedDept}
            >
              Bộ lọc
            </Button>
          </Col>

          {selectedCategoryKeys.length > 0 && (
            <Col>
              <Button danger icon={<DeleteOutlined />}>
                Xóa ({selectedCategoryKeys.length})
              </Button>
            </Col>
          )}
        </Row>

        <Table
          dataSource={filteredCategories}
          columns={categoryColumns}
          rowKey="id"
          size="middle"
          rowSelection={{
            selectedRowKeys: selectedCategoryKeys,
            onChange: (keys) => setSelectedCategoryKeys(keys),
          }}
          pagination={false}
        />
      </Card>

      {/* FILTER MODAL – DEPARTMENT */}
      <Modal
        title="Bộ lọc phòng ban"
        open={deptFilterVisible}
        onOk={() => setDeptFilterVisible(false)}
        onCancel={() => setDeptFilterVisible(false)}
      >
        <Checkbox.Group
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
          value={deptFilters}
          onChange={(values) => setDeptFilters(values as string[])}
        >
          {departments.map((d) => (
            <Checkbox key={d.id} value={d.code}>
              {d.name} ({d.code})
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal>

      {/* FILTER MODAL – CATEGORY */}
      <Modal
        title="Bộ lọc đầu mục báo cáo"
        open={categoryFilterVisible}
        onOk={() => setCategoryFilterVisible(false)}
        onCancel={() => setCategoryFilterVisible(false)}
      >
        {selectedDept ? (
          <Checkbox.Group
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
            value={categoryFilters}
            onChange={(values) => setCategoryFilters(values as string[])}
          >
            {selectedDept.categories.map((c) => (
              <Checkbox key={c.id} value={c.code}>
                {c.name} ({c.code})
              </Checkbox>
            ))}
          </Checkbox.Group>
        ) : (
          <p>Hãy chọn phòng ban trước.</p>
        )}
      </Modal>
    </div>
  );
};

export default DepartmentCategoryPage;
