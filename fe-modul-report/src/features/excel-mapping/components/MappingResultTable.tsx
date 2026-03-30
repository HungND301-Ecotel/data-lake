import { Table, Tag, Card, Descriptions, Typography, Badge, Button, Space } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import type { ExcelMappingResponse, ColumnMapping } from "../types/excelMapping";

const { Text } = Typography;

interface Props {
  result: ExcelMappingResponse;
}

export default function MappingResultTable({ result }: Props) {
  const { result: data } = result;
  const mappedCount = data.column_mapping.filter((c) => c.mapped_key).length;
  const totalCount = data.column_mapping.length;

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const name = result.filename.replace(/\.[^.]+$/, "") + "_mapping.json";
    saveAs(blob, name);
  };

  const downloadExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Mapping Result");

    // Info rows
    ws.addRow(["File", result.filename]);
    ws.addRow(["Công ty", data.company_name || data.company_id || ""]);
    ws.addRow(["Ngày", data.day && data.month && data.year ? `${data.day}/${data.month}/${data.year}` : ""]);
    ws.addRow(["Header row", data.header_row]);
    ws.addRow(["Data start row", data.data_start_row]);
    ws.addRow(["Mapped", `${mappedCount} / ${totalCount}`]);
    ws.addRow([]);

    // Header
    const headerRow = ws.addRow(["Index", "Cột Excel", "Mapped Key", "Tên tiếng Việt", "Kiểu dữ liệu", "Độ dài", "Trạng thái"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1890FF" } };
    });

    // Data
    for (const col of data.column_mapping) {
      const row = ws.addRow([
        col.excel_column_index,
        col.excel_column_name,
        col.mapped_key || "",
        col.mapped_name || "",
        col.data_type || "",
        col.data_length ?? "",
        col.mapped_key ? "Mapped" : "Chưa map",
      ]);
      if (!col.mapped_key) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3E0" } };
        });
      }
    }

    // Auto width
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = String(cell.value || "").length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 40);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const name = result.filename.replace(/\.[^.]+$/, "") + "_mapping.xlsx";
    saveAs(new Blob([buffer]), name);
  };

  const columns = [
    {
      title: "Index",
      dataIndex: "excel_column_index",
      key: "index",
      width: 70,
      render: (v: number) => <Text type="secondary">{v}</Text>,
    },
    {
      title: "Cột Excel",
      dataIndex: "excel_column_name",
      key: "excel",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 100,
      render: (_: unknown, record: ColumnMapping) =>
        record.mapped_key ? (
          <Badge status="success" text="Mapped" />
        ) : (
          <Badge status="error" text="Chưa map" />
        ),
    },
    {
      title: "Mapped Key",
      dataIndex: "mapped_key",
      key: "mapped_key",
      render: (v: string | null) =>
        v ? <Tag color="blue">{v}</Tag> : <Tag>-</Tag>,
    },
    {
      title: "Tên tiếng Việt",
      dataIndex: "mapped_name",
      key: "mapped_name",
      render: (v: string | null) =>
        v ? <Text>{v}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: "Kiểu dữ liệu",
      dataIndex: "data_type",
      key: "data_type",
      width: 120,
      render: (v: string | null) =>
        v ? <Tag color="purple">{v}</Tag> : <Tag>-</Tag>,
    },
    {
      title: "Độ dài",
      dataIndex: "data_length",
      key: "data_length",
      width: 80,
      render: (v: number | null) => (v !== null ? v : "-"),
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small">
        <Descriptions size="small" column={4} bordered>
          <Descriptions.Item label="File">{result.filename}</Descriptions.Item>
          <Descriptions.Item label="Công ty">
            {data.company_name || data.company_id || <Text type="secondary">Không xác định</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày">
            {data.day && data.month && data.year
              ? `${String(data.day).padStart(2, "0")}/${String(data.month).padStart(2, "0")}/${data.year}`
              : <Text type="secondary">-</Text>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Mapping">
            <span className="flex items-center gap-2">
              {mappedCount === totalCount
                ? <CheckCircleOutlined className="text-green-500" />
                : <CloseCircleOutlined className="text-orange-500" />
              }
              <Text strong>{mappedCount}</Text> / {totalCount} cột
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Header row">
            <Tag>Dòng {data.header_row}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Data start row">
            <Tag>Dòng {data.data_start_row}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        size="small"
        title="Kết quả mapping cột"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} size="small" onClick={downloadJson}>
              JSON
            </Button>
            <Button icon={<FileExcelOutlined />} size="small" type="primary" onClick={downloadExcel}>
              Excel
            </Button>
          </Space>
        }
      >
        <Table<ColumnMapping>
          dataSource={data.column_mapping}
          columns={columns}
          rowKey="excel_column_index"
          size="small"
          pagination={false}
          rowClassName={(record) => (!record.mapped_key ? "bg-orange-50" : "")}
        />
      </Card>
    </div>
  );
}
