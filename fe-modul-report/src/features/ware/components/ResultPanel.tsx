import { DownloadOutlined, TableOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Tooltip, Table } from "antd";
import * as XLSX from "xlsx";

interface ResultPanelProps {
  results: any[];
}

const PRIORITY_COLUMNS = [
  "id",
  "bukrs",
  "year",
  "period",
  "ngay",
  "type_data",
  "matnr",
  "kunnr",
];

const ResultPanel = ({ results }: ResultPanelProps) => {
  const exportToExcel = () => {
    if (results.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dữ liệu");
    XLSX.writeFile(workbook, `master_data_${new Date().getTime()}.xlsx`);
  };

  if (results.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full">
        <Empty description="Không có dữ liệu" />
      </div>
    );
  }

  // 1. Xử lý logic cột
  const allKeys = Object.keys(results[0] || {});
  const sortedKeys = [
    ...PRIORITY_COLUMNS.filter((k) => allKeys.includes(k)),
    ...allKeys.filter((k) => !PRIORITY_COLUMNS.includes(k)),
  ];

  const columns = sortedKeys.map((key) => ({
    title: key.toUpperCase(),
    dataIndex: key,
    key: key,
    width: 150, // Độ rộng mặc định cho mỗi cột
    ellipsis: true, // Tự động cắt chữ nếu quá dài
    render: (text: any) => {
      let val = text?.toString() || "-";
      // Xử lý cắt ID cho gọn giống logic cũ của bạn
      if (
        (key === "id" || key === "data_upload_id") &&
        typeof text === "string"
      ) {
        val = text.slice(0, 8) + (text.length > 8 ? "..." : "");
      }
      return <span title={text}>{val}</span>;
    },
  }));

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full">
      {/* Header cố định - flex-shrink-0 để không bị co lại */}
      <div className="shrink-0 px-6 py-4 bg-white border-b shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
            <TableOutlined className="text-blue-600 text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 m-0">
              Kết quả tìm kiếm
            </h2>
            <p className="text-xs text-gray-500 m-0">
              Tổng cộng: <span className="font-semibold">{results.length}</span>{" "}
              bản ghi
            </p>
          </div>
        </div>

        <Tooltip title="Tải xuống Excel">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportToExcel}
            className="bg-green-600! hover:bg-green-700!"
          >
            Tải Excel
          </Button>
        </Tooltip>
      </div>

      {/* Container chứa bảng - flex-1 và overflow-hidden để bảng chiếm trọn phần còn lại */}
      <div className="flex-1 min-h-0 p-4">
        <Card
          className="h-full shadow-sm border-0 rounded-xl 
  [&>.ant-card-body]:p-0 
  [&>.ant-card-body]:h-full 
  [&>.ant-card-body]:overflow-x-auto"
        >
          <Table
            dataSource={results}
            columns={columns}
            rowKey={(record, index) => record.id || index}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              size: "small",
            }}
            scroll={{ x: "max-content", y: "100%" }}
            tableLayout="fixed" 
            size="small"
            bordered
          />
        </Card>
      </div>
    </div>
  );
};

export default ResultPanel;
