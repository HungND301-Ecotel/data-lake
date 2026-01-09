import type { Dispatch, SetStateAction } from "react";

interface SidebarSearchProps {
  table: string;
  setTable: Dispatch<SetStateAction<string>>;
  year?: number;
  setYear: Dispatch<SetStateAction<number | undefined>>;
  onSearch: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

const SidebarSearch = ({
  table,
  setTable,
  year,
  setYear,
  onSearch,
  sidebarOpen,
  setSidebarOpen,
}: SidebarSearchProps) => {
  return (
    <div 
      className={`bg-green-50 border-r px-4 py-4 border-green-300 transition-all duration-300 ${
        sidebarOpen ? "w-64 p-4" : "w-12 p-2"
      }`}
    >
      <button
        className="mb-4 w-full text-left text-green-800 font-bold"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "«" : "»"}
      </button>

      {sidebarOpen && (
        <>
          <div className="mb-4">
            <label className="block mb-1 text-green-800 font-semibold">Table</label>
            <input
              type="text"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="w-full border border-green-300 rounded px-2 py-1 bg-green-100 text-green-900"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-green-800 font-semibold">Year</label>
            <input
              type="number"
              value={year || ""}
              onChange={(e) =>
                setYear(e.target.value ? +e.target.value : undefined)
              }
              className="w-full border border-green-300 rounded px-2 py-1 bg-green-100 text-green-900"
            />
          </div>

          <button
            onClick={onSearch}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Search
          </button>
        </>
      )}
    </div>
  );
};

export default SidebarSearch;
