import React from "react";
import { Table, Button, Input, Select, Popconfirm, Modal, message } from "antd";
import type { Sub } from "../../types/report";
import reportApi from "../../services/reportApi";

const { Option } = Select;

interface Props {
  subs: Sub[];
  onUpdate: (updated: Sub[]) => void;
}

export const SubsComponent: React.FC<Props> = ({ subs, onUpdate }) => {
  // Cập nhật bản ghi
  const [modal, contextHolderModal] = Modal.useModal();
  const [messageApi, contextHolderMessage] = message.useMessage();
  
  const updateRecord = (index: number, key: keyof Sub, value: any) => {
    const updated = [...subs];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate(updated);
  };

  // Xóa bản ghi
  const deleteRecord = (index: number) => {
    const item = subs[index];
    if (!item) return;
  
    modal.confirm({
      title: "Xác nhận xoá",
      content: "Bạn có chắc chắn muốn xoá mục này không?",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      async onOk() {
        try {
          // Nếu id null → xoá trực tiếp
          if (!item.id) {
            console.log(item.id)
            onUpdate(subs.filter((_, i) => i !== index));
            messageApi.success("Đã xoá mục");
            return;
          }
  
          // Nếu có id → gọi API
          await reportApi.deleteSubById(item.id);
          console.log(item.id)
  
          onUpdate(subs.filter((_, i) => i !== index));
          messageApi.success("Xoá thành công!");
        } catch (err) {
          console.error("Xoá thất bại:", err);
          messageApi.error("Xoá thất bại, vui lòng thử lại");
        }
      },
    });
  };

  // Thêm bản ghi mới
  const addRecord = () => {
    const newSub: Sub = {
      id: null, // để trống
      tableName: "",
      joinType: "LEFT JOIN",
      joinOn: "",
    };
    onUpdate([...subs, newSub]);
  };

  const columns = [
    {
      title: "Table Name",
      dataIndex: "tableName",
      render: (text: string, _: Sub, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateRecord(index, "tableName", e.target.value)}
        />
      ),
    },
    {
      title: "Join Type",
      dataIndex: "joinType",
      render: (text: string, _: Sub, index: number) => (
        <Select
          value={text}
          onChange={(value) => updateRecord(index, "joinType", value)}
          style={{ width: "100%" }}
        >
          <Option value="INNER JOIN">INNER JOIN</Option>
          <Option value="LEFT JOIN">LEFT JOIN</Option>
          <Option value="RIGHT JOIN">RIGHT JOIN</Option>
          <Option value="FULL JOIN">FULL JOIN</Option>
        </Select>
      ),
    },
    {
      title: "Join On",
      dataIndex: "joinOn",
      render: (text: string, _: Sub, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateRecord(index, "joinOn", e.target.value)}
        />
      ),
    },
    {
      title: "Thao tác",
      dataIndex: "action",
      render: (_: any, __: Sub, index: number) => (
        <Popconfirm
          title="Bạn có chắc muốn xóa?"
          onConfirm={() => deleteRecord(index)}
        >
          <Button size="small" danger>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {contextHolderMessage}
      {contextHolderModal}
      <Table
        dataSource={subs}
        columns={columns}
        rowKey={(_, index) => (index ?? 0).toString()}
        size="small"
        pagination={false}
      />
      <Button type="primary" style={{ marginTop: 8 }} onClick={addRecord}>
        Thêm bảng liên kết
      </Button>
    </div>
  );
};

