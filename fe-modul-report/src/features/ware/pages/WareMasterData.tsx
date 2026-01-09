import { useState } from "react";
import type { GetRequest, GetResponse } from "../types/getMaster";
import { wareTkvApi } from "../api/wareTkvApi";
import SidebarSearch from "../components/SidebarSearchProps";
import ResultPanel from "../components/ResultPanel";

const SearchMasterData = () => {
  const [table, setTable] = useState("T_SXT_62");
  const [year, setYear] = useState<number | undefined>();
  const [results, setResults] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSearch = async () => {
    const request: GetRequest = {
      table,
      filters: year ? { YEAR: year } : undefined,
      limit: 50,
      offset: 0,
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
        year={year}
        setYear={setYear}
        onSearch={handleSearch}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <ResultPanel results={results} />
    </div>
  );
};

export default SearchMasterData;
