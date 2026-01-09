import { useState } from "react";
import { Modal, Input, List, Spin } from "antd";
import type { TableOption } from "../types/wareTemplate";
import { wareTemplateApi } from "../api/wareTemplateApi";
import { VerticalLeftOutlined, VerticalRightOutlined } from "@ant-design/icons";

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

const FILTER_KEYS = ["PERIOD", "ngay", "matnr"];

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
  const [tableLabel, setTableLabel] = useState("");
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableOptions, setTableOptions] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(false);

  const searchTable = async (keyword: string) => {
    setLoading(true);
    try {
      const res = await wareTemplateApi.getOptionTable(keyword || "");
      setTableOptions(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-green-50 border-r border-green-300 transition-all duration-300 ${
        sidebarOpen ? "w-80 p-4" : "w-12 p-2"
      }`}
    >
      <button
        className="mb-4 w-full text-center font-bold text-green-800"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <VerticalRightOutlined /> : <VerticalLeftOutlined />}
      </button>

      {sidebarOpen && (
        <>
          <div className="mb-3">
            <div className="text-center text-base font-extrabold text-red-500 mb-2 tracking-wide">
              {tableLabel || "CHƯA CHỌN BẢNG"}
            </div>
            <label className="block mb-1 font-semibold text-green-800">
              Nhập mã bảng
            </label>
            <div className="relative">
              <input
                value={table}
                onChange={(e) => {
                  setTable(e.target.value);
                  setTableLabel("");
                }}
                placeholder="Nhập tableCode"
                className="w-full border border-green-400 rounded px-2 py-1 pr-8 text-sm"
              />

              <button
                onClick={() => {
                  setTableModalOpen(true);
                  searchTable("");
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-2">
            <label className="block mb-1 font-semibold text-green-800">
              Cột hiển thị (cách nhau bằng dấu , )
            </label>
            <input
              value={columns.join(",")}
              onChange={(e) =>
                setColumns(e.target.value.split(",").map((x) => x.trim()))
              }
              className="w-full border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="mb-2">
            <label className="block mb-1 font-semibold text-green-800">
              Sắp xếp theo ..(cách nhau bằng dấu , )
            </label>
            <input
              value={orderBy.join(",")}
              onChange={(e) =>
                setOrderBy(e.target.value.split(",").map((x) => x.trim()))
              }
              className="w-full border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block mb-1 text-sm font-semibold text-green-800">
                Số dữ liệu
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(+e.target.value)}
                placeholder="Limit"
                className="w-full border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-semibold text-green-800">
                Từ vị trí
              </label>
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(+e.target.value)}
                placeholder="Offset"
                className="w-full border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <label className="block mb-1 font-semibold text-green-800">Năm</label>
          <input
            type="number"
            value={year || ""}
            onChange={(e) =>
              setYear(e.target.value ? +e.target.value : undefined)
            }
            placeholder="Year"
            className="w-full border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
          />

          <div className="mb-2">
            <label className="block mb-1 font-semibold text-green-800 py-2">
              Lọc dữ liệu
            </label>

            {sidebarOpen && (
              <div className="flex flex-col gap-1 max-h-64 overflow-auto">
                {filters.map((f, idx) => (
                  <div key={idx} className="flex gap-1 items-center">
                    <input
                      list="filterKeys"
                      placeholder="Cột dữ liệu"
                      value={f.key}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[idx].key = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="flex-1 min-w-0 border rounded px-2 py-1  border-green-300"
                    />
                    <input
                      type="text"
                      placeholder="Giá trị"
                      value={f.value}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[idx].value = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="flex-1 min-w-0 border rounded px-2 py-1 border-green-300"
                    />
                    <button
                      onClick={() => {
                        const newFilters = [...filters];
                        newFilters.splice(idx, 1);
                        setFilters(newFilters);
                      }}
                      className="text-red-600 font-bold px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <datalist id="filterKeys">
                  {FILTER_KEYS.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>

                <button
                  onClick={() =>
                    setFilters([...filters, { key: "", value: "" }])
                  }
                  className="mt-1 w-full bg-green-400 text-white py-1 rounded hover:bg-green-500"
                >
                  + Thêm bộ lọc
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onSearch}
            className="w-full bg-green-600 text-white py-2 rounded mt-2"
          >
            Tìm kiếm
          </button>
        </>
      )}

      <Modal
        open={tableModalOpen}
        onCancel={() => setTableModalOpen(false)}
        footer={null}
        title="Chọn bảng dữ liệu"
        className="green-modal"
      >
        <Input.Search
          placeholder="Nhập tên bảng..."
          onChange={(e) => searchTable(e.target.value)}
        />

        <div className="mt-3 max-h-80 overflow-auto">
          {loading ? (
            <Spin />
          ) : (
            <List
              dataSource={tableOptions}
              renderItem={(item) => (
                <List.Item
                  className="cursor-pointer hover:bg-green-100"
                  onClick={() => {
                    setTable(item.tableCode);
                    setTableLabel(item.tableName);
                    setTableModalOpen(false);
                  }}
                >
                  <div>
                    <b>{item.tableName}</b>
                    <div className="text-xs text-gray-500">
                      {item.tableCode}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SidebarSearch;
