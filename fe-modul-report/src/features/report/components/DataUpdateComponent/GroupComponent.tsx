import React from "react";
import { Input, Checkbox, Button, Modal, message } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { Group, Order } from "../../types/report";
import reportApi from "../../api/reportApi";

interface Props {
  groups?: Group[];
  onUpdate: (updated: Group[]) => void;
}

export const GroupCompoent: React.FC<Props> = ({ groups = [], onUpdate }) => {
  const [modal, contextHolderModal] = Modal.useModal();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const isUserView = location.pathname.includes("/reports/template/us");
  const updateOrder = (idx: number, key: keyof Order, value: any) => {
    const updated = [...groups];
    updated[idx] = { ...updated[idx], [key]: value };
    onUpdate(updated);
  };

  const deleteOrder = (idx: number) => {
    const item = groups[idx];
    if (!item) return;
    modal.confirm({
      title: "Xác nhận xoá",
      content: "Bạn có chắc chắn muốn xoá mục này không?",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      async onOk() {
        try {
          if (!item.id) {
            const updated = groups.filter((_, i) => i !== idx);
            onUpdate(updated.map((o, i) => ({ ...o, index: i + 1 })));
            messageApi.success("Đã xoá mục");
            return;
          }

          await reportApi.deleteGroupById(item.id);

          const updated = groups.filter((_, i) => i !== idx);
          onUpdate(updated.map((o, i) => ({ ...o, index: i + 1 })));
          messageApi.success("Xoá thành công!");
        } catch (err) {
          console.error("Xoá thất bại:", err);
          messageApi.error("Xoá thất bại, vui lòng thử lại");
        }
      },
    });
  };

  const addOrder = () => {
    const newOrder: Order = {
      id: null,
      title: "",
      fieldKey: "",
      orderType: "ASC",
      visible: true,
      index: groups.length + 1,
    };
    onUpdate([...groups, newOrder]);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newgroups = Array.from(groups);
    const [removed] = newgroups.splice(result.source.index, 1);
    newgroups.splice(result.destination.index, 0, removed);
    onUpdate(newgroups.map((o, i) => ({ ...o, index: i + 1 })));
  };

  return (
    <div className="overflow-auto">
      {contextHolderMessage}
      {contextHolderModal}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="groups">
          {(provided) => (
            <table
              className="table-auto w-full border-collapse border border-gray-300"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-8"></th>
                  <th className="p-2">Tên cột</th>
                  {!isUserView && <th className="p-2">Key</th>}
                  <th className="p-2">Áp dụng</th>
                  {!isUserView && <th className="p-2">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      Chưa có order nào
                    </td>
                  </tr>
                )}
                {groups
                  .slice()
                  .sort((a, b) => a.index - b.index)
                  .map((order, idx) => (
                    <Draggable
                      key={idx} 
                      draggableId={`order-${idx}`} 
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
                              value={order.title}
                              onChange={(e) =>
                                updateOrder(idx, "title", e.target.value)
                              }
                            />
                          </td>
                          {!isUserView && (
                            <td className="p-2">
                              <Input
                                value={order.fieldKey}
                                onChange={(e) =>
                                  updateOrder(idx, "fieldKey", e.target.value)
                                }
                              />
                            </td>
                          )}

                          <td className="p-2 text-center">
                            <Checkbox
                              checked={!!order.visible}
                              onChange={(e) =>
                                updateOrder(idx, "visible", e.target.checked)
                              }
                            />
                          </td>
                          {!isUserView && (
                            <td className="p-2 text-center">
                              <Button
                                danger
                                size="small"
                                onClick={() => deleteOrder(idx)}
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

      <Button type="dashed" onClick={addOrder} className="mt-2 w-full">
        Thêm order
      </Button>
    </div>
  );
};
