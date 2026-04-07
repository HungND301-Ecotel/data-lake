  export const ExcelMetaRows = ({ metaRows, totalCols }: { metaRows: any[][]; totalCols: number }) => {
    if (!metaRows || metaRows.length === 0) return null;

    return (
      <div style={{
        background: "#f0f7ff",
        borderBottom: "2px solid #1677ff",
        padding: "0",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <tbody>
            {metaRows.map((row, rIdx) => {
              const cells: JSX.Element[] = [];
              let cIdx = 0;
              for (const cell of row) {
                if (cell.mergeInfo && !cell.mergeInfo.isOrigin) {
                  cIdx++;
                  continue;
                }
                const colspan = cell.mergeInfo?.colspan || 1;
                const rowspan = cell.mergeInfo?.rowspan || 1;
                cells.push(
                  <td
                    key={cIdx}
                    colSpan={colspan}
                    rowSpan={rowspan}
                    style={{
                      padding: "10px 12px",
                      fontSize: colspan > 1 ? 16 : 13,
                      fontWeight: colspan > 1 ? 600 : 500,
                      textAlign: colspan > 1 ? "center" : "left",
                      color: "#1a3c6e",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {cell.value != null && cell.value !== "" ? String(cell.value) : ""}
                  </td>
                );
                cIdx++;
              }
              // Nếu row ít cells hơn totalCols, pad thêm
              while (cIdx < totalCols) {
                cells.push(<td key={cIdx++} />);
              }
              return <tr key={rIdx}>{cells}</tr>;
            })}
          </tbody>
        </table>
      </div>
    );
  };