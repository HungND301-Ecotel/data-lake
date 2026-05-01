import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { GetRequest, GetResponse } from "../types/getMaster";
import { wareTkvApi } from "../api/wareTkvApi";
import NavbarSearch from "../components/NavbarSearch";
import ResultPanel from "../components/ResultPanel";

const SearchMasterData = () => {
  const [searchParams] = useSearchParams();
  const [table, setTable] = useState(() => searchParams.get("table") || "");
  const [year, setYear] = useState<number | undefined>();
  const [period, setPeriod] = useState<string | undefined>();
  const [day, setDay] = useState<string | undefined>();
  const defaultLimit = 50;
  const defaultOffset = 0;
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    setTable(searchParams.get("table") || "");
  }, [searchParams]);

  const handleSearch = async (tableOverride?: string) => {
    const tableToSearch = tableOverride || table;

    const buildFilters = (dayKey?: "DAY" | "NGAY") => {
      const nextFilters: Record<string, any> = {};
      if (year) nextFilters["YEAR"] = year;
      if (period) nextFilters["PERIOD"] = period;
      if (day && dayKey) nextFilters[dayKey] = day;
      return Object.keys(nextFilters).length ? nextFilters : undefined;
    };

    const buildRequest = (filters?: Record<string, any>): GetRequest => ({
      table: tableToSearch,
      limit: defaultLimit,
      offset: defaultOffset,
      filters,
    });

    try {
      setResults([]);

      // Có filter ngày: ưu tiên DAY, nếu không có thì fallback sang NGAY
      if (day) {
        try {
          const resByDay: GetResponse = await wareTkvApi.searchTkv(
            buildRequest(buildFilters("DAY"))
          );

          if ((resByDay.rows?.length || 0) > 0) {
            setResults(resByDay.rows || []);
            return;
          }

          const resByNgay: GetResponse = await wareTkvApi.searchTkv(
            buildRequest(buildFilters("NGAY"))
          );
          setResults(resByNgay.rows || []);
          return;
        } catch (dayError) {
          console.warn("Search by DAY failed, fallback to NGAY", dayError);
          const resByNgay: GetResponse = await wareTkvApi.searchTkv(
            buildRequest(buildFilters("NGAY"))
          );
          setResults(resByNgay.rows || []);
          return;
        }
      }

      const res: GetResponse = await wareTkvApi.searchTkv(
        buildRequest(buildFilters())
      );
      setResults(res.rows || []);
    } catch (err) {
      console.error(err);
      // Quan trọng: Reset results khi có lỗi
      setResults([]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <NavbarSearch
        table={table}
        setTable={setTable}
        year={year}
        setYear={setYear}
        period={period}
        setPeriod={setPeriod}
        day={day}
        setDay={setDay}
        onSearch={handleSearch}
      />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <ResultPanel results={results} />
      </main>
    </div>
  );
};

export default SearchMasterData;