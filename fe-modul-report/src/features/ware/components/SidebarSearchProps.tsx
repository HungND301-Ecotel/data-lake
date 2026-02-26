import { useState } from "react";
import {
  Button,
  Input,
  InputNumber,
  List,
  Spin,
  Modal,
  Tooltip,
  Empty,
  Card,
  Tag,
} from "antd";
import {
  VerticalLeftOutlined,
  VerticalRightOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  TableOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import type { TableOption } from "../types/wareTemplate";
import { wareTemplateApi } from "../api/wareTemplateApi";

/* ====================== Types ====================== */
interface Filter {
  key: string;
  value: string;
}

interface SidebarSearchProps {
  table: string;
  setTable: (val: string) => void;
  columns: string[];
  setColumns: (val: string[]) => void;
  orderBy: string[];
  setOrderBy: (val: string[]) => void;
  limit: number;
  setLimit: (val: number) => void;
  offset: number;
  setOffset: (val: number) => void;
  year?: number;
  setYear: (val?: number) => void;
  filters: Filter[];
  setFilters: (val: Filter[]) => void;
  onSearch: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

/* ====================== Constants ====================== */
const FILTER_KEYS = ["PERIOD", "ngay", "matnr"];

/* ====================== Component ====================== */
const SidebarSearch = ({
  table,
  setTable,
  columns,
  setColumns,
  orderBy,
  setOrderBy,
  limit,
  setLimit,
  offset,
  setOffset,
  year,
  setYear,
  filters,
  setFilters,
  onSearch,
  sidebarOpen,
  setSidebarOpen,
}: SidebarSearchProps) => {
  /* ---------- State ---------- */
  const [tableLabel, setTableLabel] = useState("");
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableOptions, setTableOptions] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- Handlers ---------- */
  const fetchTables = async (keyword = "") => {
    setLoading(true);
    try {
      const res = await wareTemplateApi.getOptionTable(keyword);
      setTableOptions(res);
    } finally {
      setLoading(false);
    }
  };

  // Thêm function để fetch thông tin 1 bảng cụ thể
  const fetchTableInfo = async (tableCode: string) => {
    if (!tableCode) return;
    try {
      const res = await wareTemplateApi.getOptionTable(tableCode);
      if (res && res.length > 0) {
        setTableLabel(res[0].tableName);
      }
    } catch (error) {
      console.error("Error fetching table info:", error);
    }
  };

  // Sửa lại handler search
  const handleSearch = async () => {
    await onSearch();
    // Sau khi search thành công, fetch thông tin bảng để cập nhật label
    if (table) {
      await fetchTableInfo(table);
    }
  };

  const updateFilter = (index: number, field: keyof Filter, value: string) => {
    const next = [...filters];
    next[index][field] = value;
    setFilters(next);
  };

  const removeFilter = (index: number) => {
    const next = [...filters];
    next.splice(index, 1);
    setFilters(next);
  };

  /* ====================== Render ====================== */
  return (
    <div
      className={`shrink-0 bg-linear-to-b from-blue-50 to-blue-100 
                  border-r border-blue-300 shadow-lg transition-all duration-300
                  ${sidebarOpen ? "w-96" : "w-12"} h-screen`}
    >
      <div className="h-full overflow-y-auto p-4">
        <button
          className="mb-4 w-full text-center font-bold text-blue-700 hover:text-blue-900"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <VerticalRightOutlined className="text-xl" />
          ) : (
            <VerticalLeftOutlined className="text-xl" />
          )}
        </button>

        {sidebarOpen && (
          <div className="space-y-4">
            {/* ================= Table ================= */}
            <Card className="rounded-lg shadow-sm border-0">
              {tableLabel && (<Tag color={tableLabel ? "green" : "red"} className="w-full text-center py-1 mb-3 font-bold">
                {tableLabel || null}
              </Tag>)}

              <label className="block mb-2 text-sm font-semibold text-blue-900">
                Nhập mã bảng
              </label>

              {/* Sửa lại cấu trúc input với nút + */}
              <div className="relative mb-3">
                <Input
                  size="large"
                  value={table}
                  prefix={<TableOutlined />}
                  placeholder="Nhập tableCode"
                  className="pr-10"
                  onChange={(e) => {
                    setTable(e.target.value);
                    setTableLabel("");
                  }}
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 
                             text-blue-600 hover:text-blue-800 text-2xl font-bold 
                             w-8 h-8 flex items-center justify-center
                             bg-white rounded hover:bg-blue-50
                             transition-colors z-10"
                  onClick={() => {
                    setTableModalOpen(true);
                    fetchTables();
                  }}
                  type="button"
                >
                  +
                </button>
              </div>

              <Button
                block
                size="large"
                type="primary"
                icon={<SearchOutlined />}
                className="bg-[#0891b2]! hover:bg-cyan-7000!"
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
            </Card>

            {/* ================= Columns ================= */}
            <Card className="rounded-lg shadow-sm border-0">
              <label className="block mb-2 text-sm font-semibold text-blue-900">
                Cột hiển thị
              </label>
              <Input.TextArea
                rows={3}
                value={columns.join(", ")}
                placeholder="id, bukrs, year, period"
                onChange={(e) =>
                  setColumns(e.target.value.split(",").map((x) => x.trim()))
                }
              />
            </Card>

            {/* ================= Order By ================= */}
            <Card className="rounded-lg shadow-sm border-0">
              <label className="block mb-2 text-sm font-semibold text-blue-900">
                Sắp xếp theo
              </label>
              <Input.TextArea
                rows={3}
                value={orderBy.join(", ")}
                placeholder="year DESC, period ASC"
                onChange={(e) =>
                  setOrderBy(e.target.value.split(",").map((x) => x.trim()))
                }
              />
            </Card>

            {/* ================= Limit / Offset ================= */}
            <Card className="rounded-lg shadow-sm border-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-blue-900 block mb-1">
                    Số dòng
                  </label>
                  <InputNumber
                    size="large"
                    min={1}
                    className="w-full"
                    value={limit}
                    onChange={(v) => setLimit(v || 50)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-900 block mb-1">
                    Offset
                  </label>
                  <InputNumber
                    size="large"
                    min={0}
                    className="w-full"
                    value={offset}
                    onChange={(v) => setOffset(v || 0)}
                  />
                </div>
              </div>
            </Card>

            {/* ================= Year & Filters ================= */}
            <Card className="rounded-lg shadow-sm border-0">
              <label className="block mb-2 text-sm font-semibold text-blue-900">
                Năm
              </label>
              <InputNumber
                size="large"
                className="w-full mb-3"
                min={1900}
                max={2100}
                value={year}
                placeholder="2024"
                onChange={(v) => setYear(v || undefined)}
              />

              <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-blue-900">
                <FilterOutlined /> Lọc dữ liệu
              </label>

              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {filters.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      list="filterKeys"
                      placeholder="Cột"
                      size="small"
                      value={f.key}
                      onChange={(e) =>
                        updateFilter(i, "key", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Giá trị"
                      size="small"
                      value={f.value}
                      onChange={(e) =>
                        updateFilter(i, "value", e.target.value)
                      }
                    />
                    <Tooltip title="Xóa">
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFilter(i)}
                      />
                    </Tooltip>
                  </div>
                ))}

                <Button
                  size="large"
                  icon={<PlusOutlined />}
                  className="bg-blue-500 text-white"
                  onClick={() =>
                    setFilters([...filters, { key: "", value: "" }])
                  }
                >
                  Thêm bộ lọc
                </Button>
              </div>

              <datalist id="filterKeys">
                {FILTER_KEYS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </Card>
          </div>
        )}

        {/* ================= Modal ================= */}
        <Modal
          open={tableModalOpen}
          footer={null}
          width={600}
          title={
            <div className="flex items-center gap-2">
              <TableOutlined /> Chọn bảng dữ liệu
            </div>
          }
          onCancel={() => setTableModalOpen(false)}
        >
          <Input.Search
            size="large"
            placeholder="Nhập tên hoặc mã bảng..."
            className="mb-4"
            onChange={(e) => fetchTables(e.target.value)}
          />

          {loading ? (
            <div className="text-center py-8">
              <Spin />
            </div>
          ) : tableOptions.length === 0 ? (
            <Empty description="Không có dữ liệu" />
          ) : (
            <List
              dataSource={tableOptions}
              renderItem={(item) => (
                <List.Item
                  className="cursor-pointer hover:bg-blue-50 rounded-lg px-3"
                  onClick={() => {
                    setTable(item.tableCode);
                    setTableLabel(item.tableName);
                    setTableModalOpen(false);
                  }}
                >
                  <div>
                    <div className="font-semibold">{item.tableName}</div>
                    <div className="text-xs text-gray-500">
                      Mã: <Tag color="blue">{item.tableCode}</Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default SidebarSearch;
