import React, { useState } from "react";
import { Input, Select, Modal, Checkbox, Button, message, Spin } from "antd";
import type { Filter } from "../../types/report";
import reportApi from "../../services/reportApi";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { Option } = Select;


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
};

interface Props {
  filters: Filter[];
  onUpdate: (updated: Filter[]) => void;
}

export const FilterUsingComponent: React.FC<Props> = ({
  filters,
  onUpdate,
}) => {
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectValues, setSelectValues] = useState<string[]>([]);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);


  const updateFilter = (index: number, key: keyof Filter, value: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate(updated);
  };

  const openSelectModal = async (filter: Filter, index: number) => {
    setCurrentIndex(index);

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
  
    const isBetween = filter.defaultOperator === "BETWEEN";
  
    if (filter.valueType === "DATE") {
      if (isBetween) {
        const [start, end] = value
          ? value
              .split(" and ")
              .map((v) => v.replace(/'/g, "").trim())
          : [];
      
        return (
          <DatePicker.RangePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"   
            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            value={[
              start ? dayjs(start, "YYYY-MM-DD") : null,
              end ? dayjs(end, "YYYY-MM-DD") : null,
            ]}
            onChange={(dates) => {
              if (!dates || !dates[0] || !dates[1]) {
                updateFilter(index, "defaultValue", "");
                return;
              }
      
              const startVal = dates[0].format("YYYY-MM-DD");
              const endVal = dates[1].format("YYYY-MM-DD");
      
              updateFilter(
                index,
                "defaultValue",
                `'${startVal}' and '${endVal}'`
              );
            }}
          />
        );
      }
      
  
      return (
        <DatePicker
          style={{ width: "100%" }}
          format="DD/MM/YYYY"   
          placeholder={placeholder}
          value={value ? dayjs(value, "YYYY-MM-DD") : null}
          onChange={(date) =>
            updateFilter(
              index,
              "defaultValue",
              date ? date.format("YYYY-MM-DD") : ""
            )
          }
        />
      );
    }
  
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
              <div style={{ width: 140, fontWeight: 600 }}>
                {f.alias}
              </div>

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
