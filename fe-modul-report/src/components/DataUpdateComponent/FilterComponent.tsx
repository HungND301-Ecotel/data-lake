import React from "react";
import { Table, Input, Select, Button, Popconfirm, Modal, message } from "antd";
import type { Filter } from "../../types/report";
import reportApi from "../../services/reportApi";

const { Option } = Select;

interface Props {
  filters: Filter[];
  onUpdate: (updated: Filter[]) => void;
}

export const FilterComponent: React.FC<Props> = ({ filters, onUpdate }) => {
  const [modal, contextHolderModal] = Modal.useModal();
  const [messageApi, contextHolderMessage] = message.useMessage();
  // Cập nhật filter
  const updateFilter = (index: number, key: keyof Filter, value: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate(updated);
  };

  // Xóa filter
  const deleteFilter = (index: number) => {
    const item = filters[index];
    if (!item) return;
  
    modal.confirm({
      title: "Xác nhận xoá",
      content: "Bạn có chắc chắn muốn xoá bộ lọc này không?",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",
      async onOk() {
        try {
          // Nếu id null → xoá trực tiếp
          if (!item.id) {
            const updated = filters.filter((_, i) => i !== index);
            onUpdate(updated.map((f, i) => ({ ...f, index: i + 1 })));
            messageApi.success("Đã xoá bộ lọc");
            return;
          }
  
          // Nếu có id → gọi API
          await reportApi.deleteFilterById(item.id);
  
          const updated = filters.filter((_, i) => i !== index);
          onUpdate(updated.map((f, i) => ({ ...f, index: i + 1 })));
          messageApi.success("Xoá bộ lọc thành công!");
        } catch (err) {
          console.error("Xoá thất bại:", err);
          messageApi.error("Xoá thất bại, vui lòng thử lại");
        }
      },
    });
  };

  // Thêm filter mới
  const addFilter = () => {
    const newFilter: Filter = {
      id: null,
      alias: "",
      fieldKey: "",
      operatorList: "",
      valueType: "String",
    };
    onUpdate([...filters, newFilter]);
  };

  const columns = [
    {
      title: "Alias",
      dataIndex: "alias",
      render: (_: string, record: Filter, index: number) => (
        <Input
          value={record.alias}
          onChange={(e) => updateFilter(index, "alias", e.target.value)}
        />
      ),
    },
    {
      title: "Field",
      dataIndex: "fieldKey",
      render: (_: string, record: Filter, index: number) => (
        <Input
          value={record.fieldKey}
          onChange={(e) => updateFilter(index, "fieldKey", e.target.value)}
        />
      ),
    },
    {
      title: "Operators",
      dataIndex: "operatorList",
      render: (_: string[], record: Filter, index: number) => (
        <Input
          value={record.operatorList}
          onChange={(e) => updateFilter(index, "operatorList", e.target.value)}
          placeholder="VD: =, >, <="
        />
      ),
    },

    {
      title: "Value Type",
      dataIndex: "valueType",
      render: (_: string, record: Filter, index: number) => (
        <Select
          value={record.valueType}
          onChange={(val) => updateFilter(index, "valueType", val)}
          style={{ width: "100%" }}
        >
          <Option value="String">String</Option>
          <Option value="Number">Number</Option>
          <Option value="Date">Date</Option>
          <Option value="Boolean">Boolean</Option>
        </Select>
      ),
    },
    {
      title: "Default Value",
      dataIndex: "defaultValue",
      render: (_: string, record: Filter, index: number) => (
        <Input
          value={
            record.defaultValue !== undefined && record.defaultValue !== null
              ? String(record.defaultValue)
              : ""
          }
          onChange={(e) => updateFilter(index, "defaultValue", e.target.value)}
        />
      ),
    },
    {
      title: "Default Operator",
      dataIndex: "defaultOperator",
      render: (_: string, record: Filter, index: number) => (
        <Input
          value={record.defaultOperator}
          onChange={(e) =>
            updateFilter(index, "defaultOperator", e.target.value)
          }
        />
      ),
    },
    {
      title: "Thao tác",
      dataIndex: "action",
      render: (_: any, __: Filter, index: number) => (
        <Popconfirm
          title="Bạn có chắc muốn xóa?"
          onConfirm={() => deleteFilter(index)}
        >
          <Button danger size="small">
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
        dataSource={filters}
        columns={columns}
        rowKey={(record, index) => record.id || `tmp-${index}`} // <- dùng index nếu id rỗng
        size="small"
        pagination={false}
      />

      <Button type="primary" onClick={addFilter} style={{ marginTop: 8 }}>
        Thêm bộ lọc
      </Button>
    </div>
  );
};
