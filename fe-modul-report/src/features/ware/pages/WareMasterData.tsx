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
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const handleSearch = async () => {
    const allFilters: Record<string, any> = {};
  
    // filter YEAR
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
      offset,
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
    <div className="flex h-screen">
      <SidebarSearch
        table={table}
        setTable={setTable}
        columns={columns}
        setColumns={setColumns}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        limit={limit}
        setLimit={setLimit}
        offset={offset}
        setOffset={setOffset}
        year={year}
        setYear={setYear}
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <ResultPanel results={results} />
    </div>
  );
};

export default SearchMasterData;
