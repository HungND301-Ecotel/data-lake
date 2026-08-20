import { Select } from "antd";
import type { AggregationType, PivotField } from "../../types/table";

export interface PivotConfigBarProps {
  rowFieldKeys: string[];
  onRowFieldsChange: (keys: string[]) => void;
  colFieldKeys: string[];
  onColFieldsChange: (keys: string[]) => void;
  valueFieldKeys: string[];
  onValueFieldsChange: (keys: string[]) => void;
  aggregation: AggregationType;
  onAggregationChange: (agg: AggregationType) => void;
  availableRowFields?: PivotField[];
  availableColumnFields?: PivotField[];
  availableValueFields?: PivotField[];
}

export default function PivotConfigBar({
  rowFieldKeys,
  onRowFieldsChange,
  colFieldKeys,
  onColFieldsChange,
  valueFieldKeys,
  onValueFieldsChange,
  aggregation,
  onAggregationChange,
  availableRowFields = [],
  availableColumnFields = [],
  availableValueFields = [],
}: PivotConfigBarProps) {
  const toggleValueField = (key: string) => {
    if (valueFieldKeys.includes(key)) {
      if (valueFieldKeys.length > 1) {
        onValueFieldsChange(valueFieldKeys.filter((k) => k !== key));
      }
    } else {
      onValueFieldsChange([...valueFieldKeys, key]);
    }
  };

  const aggOptions = [
    { label: "Tổng (Sum)", value: "sum" },
    { label: "Trung bình (Avg)", value: "avg" },
    { label: "Nhỏ nhất (Min)", value: "min" },
    { label: "Lớn nhất (Max)", value: "max" },
  ];

  return (
    <div className="flex flex-wrap items-end gap-5 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
      {/* Hàng (Row fields) */}
      {availableRowFields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
            Hàng
          </span>
          <Select
            mode="multiple"
            size="middle"
            value={rowFieldKeys}
            onChange={onRowFieldsChange}
            options={availableRowFields.map((f) => ({
              label: f.label,
              value: f.key,
              disabled:
                rowFieldKeys.length === 1 && rowFieldKeys.includes(f.key),
            }))}
            style={{ minWidth: 160 }}
            maxTagCount="responsive"
            popupMatchSelectWidth={false}
          />
        </div>
      )}

      {/* Cột (Column fields) */}
      {availableColumnFields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
            Cột
          </span>
          <Select
            mode="multiple"
            size="middle"
            value={colFieldKeys}
            onChange={onColFieldsChange}
            options={availableColumnFields.map((f) => ({
              label: f.label,
              value: f.key,
              disabled:
                colFieldKeys.length === 1 && colFieldKeys.includes(f.key),
            }))}
            style={{ minWidth: 160 }}
            maxTagCount="responsive"
            popupMatchSelectWidth={false}
          />
        </div>
      )}

      {/* Giá trị (Value fields - Pill style) */}
      {availableValueFields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
            Giá trị
          </span>
          <div className="flex items-center gap-2 py-1 flex-wrap">
            {availableValueFields.map((f) => {
              const isActive = valueFieldKeys.includes(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => toggleValueField(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/10"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hàm (Aggregation) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
          Hàm
        </span>
        <Select
          size="middle"
          value={aggregation}
          onChange={(val) => onAggregationChange(val)}
          options={aggOptions}
          style={{ minWidth: 140 }}
          popupMatchSelectWidth={false}
        />
      </div>
    </div>
  );
}
