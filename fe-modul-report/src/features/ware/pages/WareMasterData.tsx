import { useState } from "react";
import type { GetRequest, GetResponse } from "../types/getMaster";
import { wareTkvApi } from "../api/wareTkvApi";
import SidebarSearch from "../components/SidebarSearchProps";
import ResultPanel from "../components/ResultPanel";

const SearchMasterData = () => {
  const [table, setTable] = useState("T_SXT_62");
  const [year, setYear] = useState<number | undefined>();
  const [columns, setColumns] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<string[]>([]);
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
  const [offset, setOffset] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    const allFilters: Record<string, any> = {};

    if (year) allFilters["YEAR"] = year;

    filters.forEach((f) => {
      if (f.key && f.value) {
        allFilters[f.key] = f.value;
      }
    });

    const request: GetRequest = {
      table,
      columns: columns.length ? columns : undefined,
      order_by: orderBy.length ? orderBy : undefined,
      limit,
      filters: Object.keys(allFilters).length ? allFilters : undefined,
    };

    try {
      const res: GetResponse = await wareTkvApi.searchTkv(request);
      setResults(res.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-x-hidden">
      <SidebarSearch
        table={table}
        setTable={setTable}
        columns={columns}
        setColumns={setColumns}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        limit={limit}
        setLimit={setLimit}
        year={year}
        setYear={setYear}
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        offset={offset}
        setOffset={setOffset}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <ResultPanel results={results} />
      </main>    
    </div>
  );
};

export default SearchMasterData;