import React, { useState, useEffect } from "react";
import type { Data, Field, Filter, Order, Sub } from "../../types/report";
import { Tabs, Input, Checkbox, InputNumber } from "antd";
import { SubsComponent } from "../DataUpdateComponent/SubsComponent";
import { FieldComponent } from "../DataUpdateComponent/FieldComponent";
import { FilterComponent } from "../DataUpdateComponent/FilterComponent";
import { OrderCompoent } from "../DataUpdateComponent/OrderComponent";
import { useLocation } from "react-router-dom";
import { FilterUsingComponent } from "../DataUsingComponent/FilterUsingComponent";

interface DataProps {
  data: Data;
  editMode?: boolean; // true nếu modal, false nếu hiển thị ngoài
  onChange?: (updated: Data) => void;
}

const { TabPane } = Tabs;

const DataComponent: React.FC<DataProps> = ({
  data,
  editMode = false,
  onChange,
}) => {
  const [fields, setFields] = useState<Field[]>(data.fields);
  const [filters, setFilters] = useState<Filter[]>(data.filters);
  const [orders, setOrders] = useState<Order[]>(data.orders);
  const [subs, setSubs] = useState<Sub[]>(data.subs);
  const location = useLocation();
  const isEditMode = location.pathname.includes("/reports/template/edit/");
  const isUserMode = location.pathname.includes("/reports/template/us/");
  const [info, setInfo] = useState<
    Omit<Data, "fields" | "filters" | "orders" | "subs">
  >({
    id: data.id,
    mainTable: data.mainTable,
    showIndex: data.showIndex,
    weightIndex: data.weightIndex,
    description: data.description,
    fontName: data.fontName,
    fontSize: data.fontSize,
  });

  // Đồng bộ dữ liệu lên parent khi thay đổi
  useEffect(() => {
    onChange?.({
      ...info,
      fields,
      filters,
      orders,
      subs,
    });
  }, [info, fields, filters, orders, subs]);

  // Lọc các field hiển thị
  const visibleFields = fields
    .filter((f) => f.visible)
    .sort((a, b) => a.index - b.index);

  if (!visibleFields.length && !editMode)
    return <p>Không có cột để hiển thị</p>;

  if (!editMode) {
    // Chỉ hiển thị table preview bên ngoài
    return (
      <div className="overflow-x-auto">
        <table className="border-collapse w-full text-sm mb-2">
          <thead>
            <tr>
              {visibleFields.map((f) => (
                <th
                  key={f.id || f.fieldKey}
                  style={{ fontSize: 12, textAlign: "center" }}
                  className="border border-gray-400 px-2 py-1 bg-gray-200"
                >
                  {f.alias}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data as any).rows?.map((row: any, i: number) => (
              <tr key={i}>
                {visibleFields.map((f) => (
                  <td
                    key={f.id || f.fieldKey}
                    className="border px-2 py-1 text-center"
                  >
                    {row[f.fieldKey] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // editMode = true: hiển thị tabs
  return (
    <Tabs defaultActiveKey="1" type="card">
      {/* Thông tin chung */}
      <TabPane tab="Thông tin chung" key="1">
        <div className="p-2 border rounded bg-gray-50 space-y-2">
          {/* Dòng 1 */}
          <div className="flex justify-between space-x-4">
            <div className="flex-1">
              <label className="block mb-1">Bảng chính:</label>
              <Input
                value={info.mainTable}
                onChange={(e) =>
                  setInfo({ ...info, mainTable: e.target.value })
                }
              />
            </div>

            <div className="flex-1">
              <label className="block mb-1">Hiển thị STT:</label>
              <Checkbox
                checked={!!info.showIndex}
                onChange={(e) =>
                  setInfo({ ...info, showIndex: e.target.checked })
                }
              >
                Show
              </Checkbox>
            </div>
          </div>

          {/* Dòng 2 */}
          <div className="flex justify-between space-x-4">
            <div className="flex-1">
              <label className="block mb-1">Tiêu đề của bảng:</label>
              <Input.TextArea
                value={info.description}
                onChange={(e) =>
                  setInfo({ ...info, description: e.target.value })
                }
                rows={1}
              />
            </div>

            <div className="flex-1">
              <label className="block mb-1">Độ rộng cột STT:</label>
              <InputNumber
                min={0}
                value={(info.weightIndex ?? 0) as number}
                onChange={(val) => setInfo({ ...info, weightIndex: val ?? 0 })}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Dòng 3: Font size và Font name */}
          <div className="flex justify-between space-x-4">
            <div className="flex-1">
              <label className="block mb-1">Font Size:</label>
              <InputNumber
                min={1}
                value={(info.fontSize ?? 12) as number}
                onChange={(val) => setInfo({ ...info, fontSize: val ?? 12 })}
                style={{ width: "100%" }}
              />
            </div>

            <div className="flex-1">
              <label className="block mb-1">Font Name:</label>
              <select
                value={info.fontName ?? "Times New Roman"}
                onChange={(e) => setInfo({ ...info, fontName: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Calibri">Calibri</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
          </div>
        </div>
      </TabPane>

      {/* Bảng liên kết */}
      {isEditMode && (
        <TabPane tab="Bảng liên kết" key="2">
        <SubsComponent subs={subs} onUpdate={setSubs} />
      </TabPane>
      )}
      

      {/* Fields */}
      <TabPane tab="Fields" key="3">
        <FieldComponent fields={fields} onUpdate={setFields} />
      </TabPane>

      {/* Bộ lọc */}
      <TabPane tab="Bộ lọc" key="4">
        {isEditMode && (
          <FilterComponent filters={filters} onUpdate={setFilters} />
        )}
        {isUserMode && (
          <FilterUsingComponent filters={filters} onUpdate={setFilters} />
        )}
      </TabPane>

      {/* Sắp xếp */}
      <TabPane tab="Sắp xếp" key="5">
        <OrderCompoent orders={orders} onUpdate={setOrders} />
      </TabPane>
    </Tabs>
  );
};

export default DataComponent;
