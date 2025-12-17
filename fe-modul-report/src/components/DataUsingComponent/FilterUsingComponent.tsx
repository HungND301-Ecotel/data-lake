import React, { useState } from "react";
import { Input, Select, Modal, Checkbox, Button, message, Spin } from "antd";
import type { Filter } from "../../types/report";
import reportApi from "../../services/reportApi";

const { Option } = Select;

/* =======================
   MAP OPERATOR LABEL
======================= */
const OPERATOR_LABEL_MAP: Record<string, string> = {
  "=": "So sánh bằng",
  "!=": "Không bằng",
  ">": "Lớn hơn",
  ">=": "Lớn hơn hoặc bằng",
  "<": "Nhỏ hơn",
  "<=": "Nhỏ hơn hoặc bằng",
  LIKE: "Chứa",
  IN: "Chọn nhiều",
  BETWEEN: "Trong khoảng",
};

const VALUE_TYPE_PLACEHOLDER_MAP: Record<string, string> = {
  SELECT: "Click để chọn nhiều",
  INPUT: "Nhập giá trị",
  RANGE: "Nhập khoảng",
  DATE: "Chọn ngày",
  DATE_RANGE: "Chọn khoảng thời gian",
};

interface Props {
  filters: Filter[];
  onUpdate: (updated: Filter[]) => void;
}

export const FilterUsingComponent: React.FC<Props> = ({
  filters,
  onUpdate,
}) => {
  /* =======================
      SELECT MODAL STATE
  ======================= */
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectValues, setSelectValues] = useState<string[]>([]);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  /* =======================
        UPDATE FILTER
  ======================= */
  const updateFilter = (index: number, key: keyof Filter, value: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate(updated);
  };

  /* =======================
      OPEN SELECT MODAL
  ======================= */
  const openSelectModal = async (filter: Filter, index: number) => {
    setCurrentIndex(index);

    // map defaultValue "A,B" -> ["A","B"]
    if (filter.defaultValue) {
      setSelectValues(String(filter.defaultValue).split(","));
    } else {
      setSelectValues([]);
    }

    setSelectModalOpen(true);
    setLoadingOptions(true);

    try {
      const queryText = filter.queryValue || filter.fieldKey;

      const res = await reportApi.queryList(queryText);
      setSelectOptions(res);
    } catch (e) {
      message.error("Không lấy được danh sách lựa chọn");
      setSelectOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const saveSelectValue = () => {
    if (currentIndex === null) return;

    updateFilter(
      currentIndex,
      "defaultValue",
      selectValues.join(",")
    );

    setSelectModalOpen(false);
  };

  const renderInputByType = (filter: Filter, index: number) => {
    let value = filter.defaultValue ?? "";
    if (typeof value === "boolean" || typeof value === "number") {
      value = String(value);
    }

    const placeholder =
      VALUE_TYPE_PLACEHOLDER_MAP[filter.valueType] ?? "Nhập giá trị";

    if (filter.valueType === "SELECT") {
      return (
        <Input
          readOnly
          value={value}
          placeholder={placeholder}
          onClick={() => openSelectModal(filter, index)}
        />
      );
    }

    return (
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          updateFilter(index, "defaultValue", e.target.value)
        }
      />
    );
  };

  return (
    <>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filters.map((f, index) => {
          const operatorOptions = f.operatorList
            ?.split(",")
            .map((op) => op.trim())
            .filter(Boolean);

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
                gap: 8,
              }}
            >
              {/* ALIAS */}
              <div style={{ width: 140, fontWeight: 600 }}>
                {f.alias}
              </div>

              {/* OPERATOR */}
              <Select
                value={f.defaultOperator ?? "..."}
                style={{ width: 160 }}
                onChange={(v) =>
                  updateFilter(
                    index,
                    "defaultOperator",
                    v === "..." ? null : v
                  )
                }
              >
                <Option value="...">-----</Option>
                {operatorOptions?.map((op) => (
                  <Option key={op} value={op}>
                    {OPERATOR_LABEL_MAP[op] ?? op}
                  </Option>
                ))}
              </Select>

              {/* VALUE */}
              <div style={{ flex: 1 }}>
                {renderInputByType(f, index)}
              </div>
            </div>
          );
        })}
      </div>


      <Modal
        open={selectModalOpen}
        title="Chọn giá trị"
        onCancel={() => setSelectModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setSelectModalOpen(false)}>
            Huỷ
          </Button>,
          <Button key="ok" type="primary" onClick={saveSelectValue}>
            Lưu
          </Button>,
        ]}
      >
        {loadingOptions ? (
          <Spin />
        ) : (
          <Checkbox.Group
            value={selectValues}
            onChange={(vals) => setSelectValues(vals as string[])}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 300,
              overflow: "auto",
            }}
          >
            {selectOptions.map((opt) => (
              <Checkbox key={opt} value={opt}>
                {opt}
              </Checkbox>
            ))}
          </Checkbox.Group>
        )}
      </Modal>
    </>
  );
};
