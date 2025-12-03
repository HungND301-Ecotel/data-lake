import React from "react";
import { Input, Select } from "antd";
import type { Filter } from "../../types/report";

const { Option } = Select;

interface Props {
  filters: Filter[];
  onUpdate: (updated: Filter[]) => void;
}

export const FilterUsingComponent: React.FC<Props> = ({ filters, onUpdate }) => {
  const updateFilter = (index: number, key: keyof Filter, value: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };

    console.log("🔥 FILTER UPDATED:", JSON.stringify(updated, null, 2));

    onUpdate(updated);
  };

  const renderInputByType = (filter: Filter, index: number) => {
    let value = filter.defaultValue;
    if (value === null || value === undefined) value = "";

    // convert number + boolean về string để input hoạt động
    if (typeof value === "boolean" || typeof value === "number") {
      value = String(value);
    }

    switch (filter.valueType) {
      case "Number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              updateFilter(index, "defaultValue", Number(e.target.value))
            }
          />
        );

      case "Date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFilter(index, "defaultValue", e.target.value)}
          />
        );

      case "Boolean":
        return (
          <Select
            value={value}
            onChange={(v) => updateFilter(index, "defaultValue", v === "true")}
            style={{ width: "100%" }}
          >
            <Option value="true">True</Option>
            <Option value="false">False</Option>
          </Select>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateFilter(index, "defaultValue", e.target.value)}
          />
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {filters.map((f, index) => {
        const operatorOptions = f.operatorList
          ?.split(",")
          .map((op) => op.trim())
          .filter((op) => op !== "");

        return (
          <div
            key={f.fieldKey}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              borderRadius: 6,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8, // HIỂN THỊ NGANG
            }}
          >
            {/* ALIAS */}
            <div style={{ width: 140, fontWeight: 600 }}>{f.alias}</div>

            {/* OPERATOR */}
            <Select
              value={f.defaultOperator ?? "..."}
              style={{ width: 120 }}
              onChange={(v) => {
                if (v === "...") {
                  updateFilter(index, "defaultOperator", null);
                } else {
                  updateFilter(index, "defaultOperator", v);
                }
              }}
            >
              <Option value="...">...</Option>
              {operatorOptions?.map((op) => (
                <Option key={op} value={op}>
                  {op}
                </Option>
              ))}
            </Select>

            {/* VALUE */}
            <div style={{ flex: 1 }}>{renderInputByType(f, index)}</div>
          </div>
        );
      })}
    </div>
  );
};
