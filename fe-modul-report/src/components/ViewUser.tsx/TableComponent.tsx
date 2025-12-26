import React, { useState, useEffect } from "react";
import type { Table, TableItem } from "../../types/report";
import {
  BoldOutlined,
  BorderBottomOutlined,
  BorderLeftOutlined,
  BorderRightOutlined,
  BorderTopOutlined,
  ItalicOutlined,
  UnderlineOutlined,
} from "@ant-design/icons";
import { Modal, Input, Select, Table as TableAntd } from "antd";
import type { ColumnsType } from "antd/es/table";

const borderIcons = [
  BorderTopOutlined,
  BorderBottomOutlined,
  BorderLeftOutlined,
  BorderRightOutlined,
];

/* ------------------ Default Cell ------------------ */
const defaultCell = (r: number, c: number): TableItem => ({
  id: null,
  row: r,
  col: c,
  type: "text",
  text: "New Cell",
  fontName: "Times",
  fontSize: 12,
  fontStyle: [],
  align: "center",
  colSpan: 1,
  rowSpan: 1,
  border: "1 1 1 1",
  queryFilters: [],
  querySyntax: "",
});

interface Props {
  table: Table;
  editMode?: boolean;
  onChange?: (t: Table) => void;
}

const TableEditor: React.FC<Props> = ({
  table,
  editMode = false,
  onChange,
}) => {
  const [localTable, setLocalTable] = useState<Table>(() => {
    const widths = table.width
      ? table.width.split(",").map((w) => Number(w))
      : Array(10).fill(120);
    return {
      ...table,
      columns: (table.columns || []).map((c) => ({ ...c })),
      width: widths.join(","),
    };
  });

  const [selectedCells, setSelectedCells] = useState<TableItem[]>([]);
  const [editingCell, setEditingCell] = useState<TableItem | null>(null);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  const queryItems = localTable.columns.filter((item) => item.type === "query");

  const modalColumns: ColumnsType<TableItem> = [
    {
      title: "Tiêu đề",
      dataIndex: "text",
      width: 200,
      render: (_, record) => (
        <Input
          style={{ width: "100%" }}
          value={record.text}
          onChange={(e) =>
            setCell(record.row, record.col, {
              text: e.target.value,
            })
          }
        />
      ),
    },
    {
      title: "Hàng",
      dataIndex: "row",
      width: 80,
    },
    {
      title: "Cột",
      dataIndex: "col",
      width: 80,
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 120,
      render: (_, record) => (
        <Select
          style={{ width: "100%" }}
          value={record.type}
          onChange={(val) =>
            setCell(record.row, record.col, {
              type: val,
            })
          }
        >
          <Select.Option value="text">Text</Select.Option>
          <Select.Option value="query">Query</Select.Option>
        </Select>
      ),
    },
    {
      title: "Query",
      dataIndex: "querySyntax",
      render: (_, record) => (
        <Input.TextArea
          rows={2}
          style={{ width: "100%" }}
          value={record.querySyntax}
          onChange={(e) =>
            setCell(record.row, record.col, {
              querySyntax: e.target.value,
            })
          }
        />
      ),
    },
  ];
  
  

  useEffect(() => {
    onChange?.(localTable);
  }, [localTable]);

  const numRows = localTable.columns.length
    ? Math.max(...localTable.columns.map((c) => c.row)) + 1
    : 0;
  const numCols = localTable.columns.length
    ? Math.max(...localTable.columns.map((c) => c.col)) + 1
    : 0;

  /* ------------------ Matrix ------------------ */
  const matrix: (TableItem | null)[][] = Array.from(
    { length: Math.max(1, numRows) },
    () => Array.from({ length: Math.max(1, numCols) }, () => null)
  );
  localTable.columns.forEach((cell) => {
    if (matrix[cell.row]) matrix[cell.row][cell.col] = cell;
  });

  /* ------------------ Helpers ------------------ */
  const getCell = (r: number, c: number) =>
    localTable.columns.find((cc) => cc.row === r && cc.col === c);

  const setCell = (r: number, c: number, patch: Partial<TableItem>) => {
    const existing = getCell(r, c);
    if (existing) {
      const updated = localTable.columns.map((cc) =>
        cc.row === r && cc.col === c ? { ...cc, ...patch } : cc
      );
      setLocalTable({ ...localTable, columns: updated });
      if (selectedCells.find((s) => s.row === r && s.col === c)) {
        setSelectedCells((prev) =>
          prev.map((s) => (s.row === r && s.col === c ? { ...s, ...patch } : s))
        );
      }
    } else {
      const nc = { ...defaultCell(r, c), ...patch };
      setLocalTable({ ...localTable, columns: [...localTable.columns, nc] });
      setSelectedCells([nc]);
    }
  };

  const toggleSelectCell = (
    cell: TableItem | null,
    ctrlKey: boolean,
    row: number,
    col: number
  ) => {
    if (!cell) {
      const newCell = defaultCell(row, col);
      setLocalTable((prevTable) => ({
        ...prevTable,
        columns: [...prevTable.columns, newCell],
      }));
      setSelectedCells([newCell]);
      return;
    }

    if (!ctrlKey) setSelectedCells([cell]);
    else {
      setSelectedCells((prev) => {
        const exists = prev.find(
          (c) => c.row === cell.row && c.col === cell.col
        );
        return exists
          ? prev.filter((c) => !(c.row === cell.row && c.col === cell.col))
          : [...prev, cell];
      });
    }
  };

  const updateSelected = (patch: Partial<TableItem>) => {
    const updatedColumns = localTable.columns.map((cell) =>
      selectedCells.find(
        (selected) => selected.row === cell.row && selected.col === cell.col
      )
        ? { ...cell, ...patch }
        : cell
    );
    setLocalTable({ ...localTable, columns: updatedColumns });
    setSelectedCells((prev) => prev.map((cell) => ({ ...cell, ...patch })));
  };

  const getSharedValue = <K extends keyof TableItem>(key: K) => {
    if (!selectedCells.length) return "";
    const first = selectedCells[0][key];
    return selectedCells.every((c) => c[key] === first) ? first : "";
  };

  /* ------------------ Add/Delete Row/Col ------------------ */
  const addRow = () => {
    const rowIndex =
      selectedCells.length > 0 ? selectedCells[0].row + 1 : numRows;
    const shifted = localTable.columns.map((c) =>
      c.row >= rowIndex ? { ...c, row: c.row + 1 } : c
    );
    const newRow = Array.from({ length: numCols }, (_, cIdx) =>
      defaultCell(rowIndex, cIdx)
    );
    setLocalTable({ ...localTable, columns: [...shifted, ...newRow] });
  };

  const deleteRow = () => {
    if (!selectedCells.length) return;
    const rowIndex = selectedCells[0].row;
    const filtered = localTable.columns
      .filter((c) => c.row !== rowIndex)
      .map((c) => (c.row > rowIndex ? { ...c, row: c.row - 1 } : c));
    setLocalTable({ ...localTable, columns: filtered });
    setSelectedCells([]);
  };

  const addColumn = () => {
    const colIndex =
      selectedCells.length > 0 ? selectedCells[0].col + 1 : numCols;
    const shifted = localTable.columns.map((c) =>
      c.col >= colIndex ? { ...c, col: c.col + 1 } : c
    );
    const newCells = Array.from({ length: numRows }, (_, rIdx) =>
      defaultCell(rIdx, colIndex)
    );
    const newWidths = localTable.width.split(",").map(Number);
    newWidths.splice(colIndex, 0, 6);
    setLocalTable({
      ...localTable,
      columns: [...shifted, ...newCells],
      width: newWidths.join(","),
    });
  };

  const deleteColumn = () => {
    if (!selectedCells.length) return;
    const colIndex = selectedCells[0].col;
    const filtered = localTable.columns
      .filter((c) => c.col !== colIndex)
      .map((c) => (c.col > colIndex ? { ...c, col: c.col - 1 } : c));
    const newWidths = localTable.width.split(",").map(Number);
    newWidths.splice(colIndex, 1);
    setLocalTable({
      ...localTable,
      columns: filtered,
      width: newWidths.join(","),
    });
    setSelectedCells([]);
  };

  /* ------------------ Render ------------------ */
  return (
    <div className="w-full">
      {editMode && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-100 border-b text-sm items-center">
          {/* Type Selector */}
          <select
            value={getSharedValue("type") || "text"}
            onChange={(e) => updateSelected({ type: e.target.value as any })}
            className="border p-1 text-sm"
          >
            <option value="text">Text</option>
            <option value="query">Query</option>
          </select>

          {/* Nút mở Query Modal */}
          <button
            className="border px-2 py-1 rounded bg-white"
            onClick={() => {
              setIsQueryModalOpen(true);
            }}
          >
            +
          </button>

          {/* Font */}
          <select
            value={getSharedValue("fontName") || "Arial"}
            onChange={(e) => updateSelected({ fontName: e.target.value })}
            className="border p-1 text-sm"
          >
            <option>Times</option>
            <option>Arial</option>
            <option>Tahoma</option>
            <option>Verdana</option>
          </select>

          {/* Font Size */}
          <input
            type="number"
            min={8}
            max={72}
            value={getSharedValue("fontSize") || 14}
            onChange={(e) =>
              updateSelected({ fontSize: Number(e.target.value) })
            }
            className="border p-1 w-20"
          />

          {/* Bold / Italic / Underline */}
          {[
            { key: "bold", icon: <BoldOutlined /> },
            { key: "italic", icon: <ItalicOutlined /> },
            { key: "underline", icon: <UnderlineOutlined /> },
          ].map(({ key, icon }) => (
            <button
              key={key}
              className={`border px-2 py-1 rounded ${
                selectedCells.every((c) => c.fontStyle?.includes(key as any))
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              onClick={() => {
                const style = key as "bold" | "italic" | "underline";
                const updatedCells = selectedCells.map((cell) => {
                  const exists = cell.fontStyle?.includes(style);
                  const newStyle = exists
                    ? cell.fontStyle?.filter((x) => x !== style)
                    : [...(cell.fontStyle || []), style];
                  return { ...cell, fontStyle: newStyle };
                });
                updateSelected({ fontStyle: updatedCells[0].fontStyle });
              }}
            >
              {icon}
            </button>
          ))}

          {/* Align */}
          <select
            value={getSharedValue("align") || "left"}
            onChange={(e) => updateSelected({ align: e.target.value as any })}
            className="border p-1"
          >
            <option value="left">Căn trái</option>
            <option value="center">Căn giữa</option>
            <option value="right">Căn phải</option>
          </select>

          {/* Width */}
          {selectedCells.length === 1 && (
            <input
              type="number"
              value={Number(localTable.width.split(",")[selectedCells[0].col])}
              onChange={(e) => {
                const newWidths = localTable.width.split(",").map(Number);
                newWidths[selectedCells[0].col] = Number(e.target.value);
                setLocalTable({ ...localTable, width: newWidths.join(",") });
              }}
              placeholder="Width px"
              className="border p-1 w-24"
            />
          )}

          {/* Border */}
          <div className="flex items-center gap-2">
            {borderIcons.map((Icon, index) => (
              <button
                key={index}
                className={`border px-2 py-1 rounded ${
                  selectedCells.every(
                    (cell) => (cell.border?.split(" ")[index] || "1") === "1"
                  )
                    ? "bg-gray-300"
                    : ""
                }`}
                onClick={() => {
                  const updatedCells = selectedCells.map((cell) => {
                    const borders = cell.border?.split(" ") || [
                      "1",
                      "1",
                      "1",
                      "1",
                    ];
                    borders[index] = borders[index] === "1" ? "0" : "1";
                    return { ...cell, border: borders.join(" ") };
                  });
                  updateSelected({ border: updatedCells[0].border });
                }}
              >
                <Icon />
              </button>
            ))}
          </div>

          {/* Add/Delete Row/Col */}
          <button onClick={addRow} className="border px-2 py-1">
            + Hàng
          </button>
          <button onClick={deleteRow} className="border px-2 py-1 text-red-600">
            - Hàng
          </button>
          <button onClick={addColumn} className="border px-2 py-1">
            + Cột
          </button>
          <button
            onClick={deleteColumn}
            className="border px-2 py-1 text-red-600"
          >
            - Cột
          </button>
        </div>
      )}

      <div className="overflow-auto">
        <table
          className="border-collapse w-full"
          style={{ tableLayout: "fixed" }}
        >
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td
                    key={cell?.id || `${rIdx}-${cIdx}`}
                    style={{
                      width: Number(localTable.width.split(",")[cIdx]) * 10,
                      maxWidth: Number(localTable.width.split(",")[cIdx]) * 10,
                      minWidth: Number(localTable.width.split(",")[cIdx]) * 10,
                      fontFamily: cell?.fontName,
                      fontSize: cell?.fontSize,
                      fontWeight: cell?.fontStyle?.includes("bold")
                        ? "bold"
                        : "normal",
                      fontStyle: cell?.fontStyle?.includes("italic")
                        ? "italic"
                        : "normal",
                      textDecoration: cell?.fontStyle?.includes("underline")
                        ? "underline"
                        : "none",
                      textAlign: cell?.align,
                      borderTop:
                        cell?.border?.split(" ")[0] === "1"
                          ? "1px solid #000"
                          : "none",
                      borderBottom:
                        cell?.border?.split(" ")[1] === "1"
                          ? "1px solid #000"
                          : "none",
                      borderLeft:
                        cell?.border?.split(" ")[2] === "1"
                          ? "1px solid #000"
                          : "none",
                      borderRight:
                        cell?.border?.split(" ")[3] === "1"
                          ? "1px solid #000"
                          : "none",
                      padding: 4,
                      cursor: editMode ? "pointer" : "default",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      background: selectedCells.find(
                        (s) => s.row === cell?.row && s.col === cell?.col
                      )
                        ? "#FEF3C7"
                        : "transparent",
                    }}
                    onClick={(e) =>
                      editMode &&
                      toggleSelectCell(cell, e.ctrlKey || e.metaKey, rIdx, cIdx)
                    }
                    onDoubleClick={() => editMode && setEditingCell(cell)}
                  >
                    {editingCell &&
                    editingCell.row === cell?.row &&
                    editingCell.col === cell?.col ? (
                      <input
                        autoFocus
                        value={cell.text ?? ""}
                        className="w-full"
                        onBlur={() => setEditingCell(null)}
                        onChange={(e) =>
                          setCell(cell.row, cell.col, { text: e.target.value })
                        }
                      />
                    ) : cell?.type === "query" ? (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        {cell.text}
                      </span>
                    ) : (
                      cell?.text
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={isQueryModalOpen}
        width={1200}
        onCancel={() => setIsQueryModalOpen(false)}
        footer={null}
      >
        <TableAntd
          rowKey={(record) => `${record.row}-${record.col}`}
          columns={modalColumns}
          dataSource={queryItems}
          pagination={false}
          bordered
          size="small"
        />
      </Modal>
    </div>
  );
};

export default TableEditor;
