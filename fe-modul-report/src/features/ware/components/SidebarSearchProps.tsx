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
  return (
    <div
      className={`bg-green-50 border-r border-green-300 transition-all duration-300 ${
        sidebarOpen ? "w-80 p-4" : "w-12 p-2"
      }`}
    >
      <button
        className="mb-4 w-full text-left font-bold text-green-800"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "« " : "»"}
      </button>

      {sidebarOpen && (
        <>
          {/* Table */}
          <div className="mb-2">
            <label onClick={() => setSidebarOpen(!sidebarOpen)} className="block mb-1 font-semibold text-green-800">
              Table
            </label>
            <input
              type="text"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          {/* Columns */}
          <div className="mb-2">
            <label className="block mb-1 font-semibold text-green-800">
              Lọc cột (cách nhau bằng dấu , )
            </label>
            <input
              type="text"
              value={columns.join(",")}
              onChange={(e) =>
                setColumns(e.target.value.split(",").map((c) => c.trim()))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>

          {/* Order By */}
          <div className="mb-2">
            <label className="block mb-1 font-semibold text-green-800">
              Sắp xếp theo ... (cách nhau bằng dấu , )
            </label>
            <input
              type="text"
              value={orderBy.join(",")}
              onChange={(e) =>
                setOrderBy(e.target.value.split(",").map((c) => c.trim()))
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="block mb-1 font-semibold text-green-800">
                Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-semibold text-green-800">
                Offset
              </label>
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Year */}
          <div className="mb-2">
            <label className="block mb-1 font-semibold text-green-800">
              Năm
            </label>
            <input
              type="number"
              value={year || ""}
              onChange={(e) =>
                setYear(e.target.value ? +e.target.value : undefined)
              }
              className="w-full border rounded px-2 py-1"
            />
          </div>

          {/* Filters */}
          <div className="mb-2">
            <label className="block mb-1 font-semibold text-green-800">
              Filters
            </label>

            {sidebarOpen && (
              <div className="flex flex-col gap-1 max-h-64 overflow-auto">
                {filters.map((f, idx) => (
                  <div key={idx} className="flex gap-1 items-center">
                    <input
                      list="filterKeys"
                      placeholder="Key"
                      value={f.key}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[idx].key = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="flex-1 min-w-0 border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={f.value}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[idx].value = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="flex-1 min-w-0 border rounded px-2 py-1"
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

                {/* datalist gợi ý key */}
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
                  + Add Filter
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onSearch}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-2"
          >
            Search
          </button>
        </>
      )}
    </div>
  );
};

export default SidebarSearch;
