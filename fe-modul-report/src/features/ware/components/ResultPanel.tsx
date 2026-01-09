interface ResultPanelProps {
    results: any[];
  }
  
  const PRIORITY_COLUMNS = ["id", "bukrs", "year", "period", "ngay", "type_data", "matnr", "kunnr"];
  
  const ResultPanel = ({ results }: ResultPanelProps) => {
    if (results.length === 0) {
      return (
        <div className="flex-1 overflow-auto bg-green-50">
          <p className="text-green-900">No data</p>
        </div>
      );
    }
  
    const allKeys = Object.keys(results[0]);
    const sortedKeys = [
      ...PRIORITY_COLUMNS.filter((k) => allKeys.includes(k)), 
      ...allKeys.filter((k) => !PRIORITY_COLUMNS.includes(k)),
    ];
  
    return (
      <div className="px-4 py-4 overflow-auto bg-green-50">
        <table className="w-full border border-green-300 rounded">
          <thead>
            <tr className="bg-green-200">
              {sortedKeys.map((key) => (
                <th
                  key={key}
                  className="border border-green-300 px-2 py-1 text-left text-green-900"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i} className="even:bg-green-100">
                {sortedKeys.map((key) => {
                  let val = row[key];
  
                  // Rút gọn id
                  if (key.toLowerCase() === "id" && typeof val === "string") {
                    val = val.slice(0, 6) + (val.length > 6 ? "..." : "");
                  }
                  if (key.toLowerCase() === "data_upload_id" && typeof val === "string") {
                    val = val.slice(0, 6) + (val.length > 6 ? "..." : "");
                  }
  
                  return (
                    <td key={key} className="border px-2 py-1 text-green-900">
                      {val?.toString() || ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default ResultPanel;
  