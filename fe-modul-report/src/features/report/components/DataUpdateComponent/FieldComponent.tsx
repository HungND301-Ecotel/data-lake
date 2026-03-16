import React from "react";
import {
  Input,
  Checkbox,
  Button,
  InputNumber,
  Select,
  Modal,
  message,
} from "antd";
import { MenuOutlined } from "@ant-design/icons";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { Field } from "../../types/report";
import reportApi from "../../api/reportApi";

interface Props {
  fields?: Field[];
  onUpdate: (updated: Field[]) => void;
}

export const FieldComponent: React.FC<Props> = ({ fields = [], onUpdate }) => {
  const [modal, contextHolderModal] = Modal.useModal();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const isUserView = location.pathname.includes("/reports/template/us");
  const addField = () => {
    const newField: Field = {
      id: null,
      alias: "",
      fieldKey: "",
      dataType: "String",
      weight: 30,
      visible: true,
      groupName: "",
      alignment: 1,
      index: fields.length + 1,
    };
    onUpdate([...fields, newField]);
  };

  const deleteField = (idx: number) => {
    const item = fields[idx];
    if (!item) return;

    modal.confirm({
      title: "Xác nhận xoá",
      content: "Bạn có chắc chắn muốn xoá trường này không?",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      async onOk() {
        try {
          if (!item.id) {
            const updated = fields.filter((_, i) => i !== idx);
            onUpdate(updated.map((f, i) => ({ ...f, index: i + 1 })));
            messageApi.success("Đã xoá trường");
            return;
          }

          await reportApi.deleteFieldById(item.id);

          const updated = fields.filter((_, i) => i !== idx);
          onUpdate(updated.map((f, i) => ({ ...f, index: i + 1 })));
          messageApi.success("Xoá trường thành công!");
        } catch (err) {
          console.error("Xoá thất bại:", err);
          messageApi.error("Xoá thất bại, vui lòng thử lại");
        }
      },
    });
  };

  const updateField = (idx: number, key: keyof Field, value: any) => {
    const updated = [...fields];
    updated[idx] = { ...updated[idx], [key]: value };
    onUpdate(updated);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newFields = Array.from(fields);
    const [removed] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, removed);
    onUpdate(newFields.map((f, i) => ({ ...f, index: i + 1 })));
  };

  return (
    <div className="overflow-auto">
      {contextHolderMessage}
      {contextHolderModal}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <table
              className="table-auto w-full border-collapse border border-gray-300"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <thead>
                <tr className="bg-gray-100">
                  <th></th>
                  <th>Tên cột</th>
                  {!isUserView && <th>Key</th>}
                  <th>Kiểu dữ liệu</th>
                  <th>Hiển thị</th>
                  <th>Độ rộng</th>
                  <th>Căn lề</th>
                  <th>Nhóm tiêu đề</th>
                  {!isUserView && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-gray-500">
                      Chưa có thuộc tính nào
                    </td>
                  </tr>
                )}
                {fields
                  .slice()
                  .sort((a, b) => a.index - b.index)
                  .map((field, idx) => (
                    <Draggable
                      key={idx}
                      draggableId={`field-${idx}`}
                      index={idx}
                    >
                      {(dragProvided) => (
                        <tr
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className="border-b border-gray-300 hover:bg-gray-50"
                        >
                          <td
                            {...dragProvided.dragHandleProps}
                            className="cursor-grab p-2 text-center"
                          >
                            <MenuOutlined />
                          </td>
                          <td className="p-2">
                            <Input
                              value={field.alias}
                              onChange={(e) =>
                                updateField(idx, "alias", e.target.value)
                              }
                            />
                          </td>
                          {!isUserView && (
                            <td className="p-2">
                              <Input
                                value={field.fieldKey}
                                onChange={(e) =>
                                  updateField(idx, "fieldKey", e.target.value)
                                }
                              />
                            </td>
                          )}
                          <td className="p-2">
                            <Select
                              value={field.dataType}
                              onChange={(val) =>
                                updateField(idx, "dataType", val)
                              }
                              style={{ width: "100%" }}
                            >
                              <Select.Option value="String">
                                STRING
                              </Select.Option>
                              <Select.Option value="Date">DATE</Select.Option>
                              <Select.Option value="Number">
                                NUMBER
                              </Select.Option>
                            </Select>
                          </td>
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={!!field.visible}
                              onChange={(e) =>
                                updateField(idx, "visible", e.target.checked)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <InputNumber
                              value={field.weight}
                              min={0}
                              onChange={(val) =>
                                updateField(idx, "weight", val ?? 0)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Select<number>
                              value={field.alignment}
                              onChange={(val) =>
                                updateField(idx, "alignment", val)
                              }
                              style={{ width: "100%" }}
                            >
                              <Select.Option value={0}>Căn trái</Select.Option>
                              <Select.Option value={1}>Căn giữa</Select.Option>
                              <Select.Option value={2}>Căn phải</Select.Option>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Input
                              value={field.groupName}
                              onChange={(e) =>
                                updateField(idx, "groupName", e.target.value)
                              }
                            />
                          </td>
                          {!isUserView && (
                            <td className="p-2 text-center">
                              <Button
                                danger
                                size="small"
                                onClick={() => deleteField(idx)}
                              >
                                Xóa
                              </Button>
                            </td>
                          )}
                        </tr>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>
      <Button type="dashed" onClick={addField} className="mt-2 w-full">
        Thêm thuộc tính
      </Button>
    </div>
  );
};
