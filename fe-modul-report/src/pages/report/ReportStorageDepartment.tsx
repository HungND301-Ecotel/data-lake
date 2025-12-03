import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Collapse, Table, Tag, Button, Input, Dropdown, Space } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Panel } = Collapse;

type Report = {
  id: number;
  name: string;
  user_created: string;
  created_at: string;
  status: "pending" | "processing" | "success";
  file_url: string;
};

type ReportGroup = {
  type: string; // day / month / quarter
  reports: Report[];
};

const ReportStorageDepartment = () => {
  const { department_id } = useParams();
  const [groups, setGroups] = useState<ReportGroup[]>([]);
  const [searchText, setSearchText] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const fakeData: ReportGroup[] = [
      {
        type: "day",
        reports: [
          { id: 1, name: "Báo cáo ngày 01/12/2025", user_created: "Nguyễn A", created_at: "2025-12-01", status: "success", file_url: "/file1.pdf" },
          { id: 2, name: "Báo cáo ngày 02/12/2025 với tên cực dài thử xuống dòng", user_created: "Nguyễn B", created_at: "2025-12-02", status: "pending", file_url: "/file2.pdf" },
        ],
      },
      {
        type: "month",
        reports: [
          { id: 3, name: "Báo cáo tháng 11/2025", user_created: "Nguyễn C", created_at: "2025-11-30", status: "processing", file_url: "/file3.pdf" },
          { id: 4, name: "Báo cáo tháng 10/2025", user_created: "Nguyễn D", created_at: "2025-10-31", status: "success", file_url: "/file4.pdf" },
        ],
      },
      {
        type: "quarter",
        reports: [
          { id: 5, name: "Báo cáo quý 3/2025", user_created: "Nguyễn E", created_at: "2025-09-30", status: "success", file_url: "/file5.pdf" },
        ],
      },
    ];

    setGroups(fakeData);
  }, [department_id]);

  const typeLabel = (type: string) => {
    switch (type) {
      case "day": return "Báo cáo ngày";
      case "month": return "Báo cáo tháng";
      case "quarter": return "Báo cáo quý";
      default: return type;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "red";
      case "processing": return "blue";
      case "success": return "green";
      default: return "gray";
    }
  };

  const columns = [
    { 
      title: "Tên báo cáo", 
      dataIndex: "name", 
      key: "name",
      width: 250,
      render: (text: string) => <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{text}</div>
    },
    { 
      title: "Người tạo", 
      dataIndex: "user_created", 
      key: "user_created",
      width: 150,
      render: (text: string) => <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{text}</div>
    },
    { 
      title: "Ngày tạo", 
      dataIndex: "created_at", 
      key: "created_at",
      width: 120,
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      width: 120,
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>
    },
    { 
      title: "Thao tác", 
      key: "view",
      width: 100,
      render: (_: any, record: Report) => (
        <Button size="small" onClick={() => nav(`/report/${record.id}`)}>Xem</Button>
      )
    }
  ];

  const menuItems: MenuProps['items'] = [
    { key: 'type', label: <div>Loại báo cáo</div> },
    { key: 'status', label: <div>Trạng thái</div> },
    { key: 'date', label: <div>Khoảng ngày</div> },
  ];

  return (
    <div style={{  }}>
      {/* Thanh tìm kiếm + filter */}
      <Space style={{ marginBottom: 16, width: '100%' }}>
        <Input
          placeholder="Tìm kiếm báo cáo..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '100%' }}
        />
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button icon={<FilterOutlined />}>Bộ lọc</Button>
        </Dropdown>
      </Space>

      {/* Collapse báo cáo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((grp) => (
          <Collapse
            key={grp.type}
            accordion
            style={{
              borderRadius: 8,
              backgroundColor: "#e0f7fa",
              border: "1px solid #d9d9d9",
              overflow: "hidden",
            }}
          >
            <Panel header={typeLabel(grp.type)} key={grp.type}>
              <Table
                dataSource={grp.reports}
                columns={columns}
                rowKey="id"
                pagination={false}
                showHeader={false}
              />
            </Panel>
          </Collapse>
        ))}
      </div>
    </div>
  );
};

export default ReportStorageDepartment;
