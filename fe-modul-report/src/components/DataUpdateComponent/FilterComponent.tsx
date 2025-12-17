import React, { useState } from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Popconfirm,
  Modal,
  message,
  Row,
  Col,
} from "antd";
import type { Filter } from "../../types/report";
import reportApi from "../../services/reportApi";
import { ArrowRightOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  filters: Filter[];
  onUpdate: (updated: Filter[]) => void;
}

export const FilterComponent: React.FC<Props> = ({ filters, onUpdate }) => {
  const [modal, contextHolderModal] = Modal.useModal();
  const [messageApi, contextHolderMessage] = message.useMessage();

  /* ===== STATE CHO QUERY MODAL ===== */
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [queryText, setQueryText] = useState("");
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  /* ===== FILTER CRUD ===== */
  const updateFilter = (index: number, key: keyof Filter, value: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate(updated);
  };

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
          if (item.id) {
            await reportApi.deleteFilterById(item.id);
          }
          const updated = filters.filter((_, i) => i !== index);
          onUpdate(updated.map((f, i) => ({ ...f, index: i + 1 })));
          messageApi.success("Đã xoá bộ lọc");
        } catch (err) {
          messageApi.error("Xoá thất bại");
        }
      },
    });
  };

  const addFilter = () => {
    onUpdate([
      ...filters,
      {
        id: null,
        alias: "",
        fieldKey: "",
        operatorList: "",
        valueType: "INPUT",
        queryValue: "",
      },
    ]);
  };

  /* ===== QUERY MODAL LOGIC ===== */
  const openQueryModal = (record: Filter, index: number) => {
    setCurrentIndex(index);
    setQueryText(record.queryValue || "");
    setPreviewResult(null);
    setQueryModalOpen(true);
  };

  const handleTestQuery = async () => {
    try {
      setLoadingPreview(true);

      // 👉 API preview (bạn có thể mock)
      const res = await reportApi.queryList(queryText);

      setPreviewResult(res);
    } catch (err) {
      messageApi.error("Không thể chạy query");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveQuery = () => {
    if (currentIndex === null) return;
    updateFilter(currentIndex, "queryValue", queryText);
    setQueryModalOpen(false);
    messageApi.success("Đã lưu query");
  };

  /* ===== TABLE COLUMNS ===== */
  const columns = [
    {
      title: "Alias",
      dataIndex: "alias",
      width: 150,
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
      width: 150,
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
      width: 150,
      render: (_: string, record: Filter, index: number) => (
        <Input
          value={record.operatorList}
          placeholder="VD: =, >, <="
          onChange={(e) => updateFilter(index, "operatorList", e.target.value)}
        />
      ),
    },
    {
      title: "Value Type",
      dataIndex: "valueType",
      width: 200,
      render: (_: string, record: Filter, index: number) => (
        <Select style={{ width: "100%" }}
          
          value={record.valueType}
          onChange={(val) => updateFilter(index, "valueType", val)}
        >
          <Option value="SELECT">Chọn nhiều</Option>
          <Option value="INPUT">Nhập liệu</Option>
          <Option value="RANGE">Nhập khoảng</Option>
          <Option value="DATE">Nhập ngày</Option>
          <Option value="DATE_RANGE">Khoảng thời gian</Option>
        </Select>
      ),
    },
    {
      title: "Default Operator",
      dataIndex: "defaultOperator",
      width: 200,
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
      title: "Default Value",
      dataIndex: "defaultValue",
      width: 200,
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
      title: "Query Value",
      dataIndex: "queryValue",
      render: (_: string, record: Filter, index: number) => (
        <Input
          readOnly
          value={record.queryValue}
          placeholder="Click để nhập query"
          onClick={() => openQueryModal(record, index)}
        />
      ),
    },
    {
      title: "Thao tác",
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
      {contextHolderModal}
      {contextHolderMessage}

      <Table
        dataSource={filters}
        columns={columns}
        rowKey={(record, index) => record.id || `tmp-${index}`}
        pagination={false}
        size="small"
      />

      <Button type="primary" onClick={addFilter} style={{ marginTop: 8 }}>
        Thêm bộ lọc
      </Button>

      {/* ===== QUERY MODAL ===== */}
      <Modal
        open={queryModalOpen}
        width={900}
        onCancel={() => setQueryModalOpen(false)}
        onOk={handleSaveQuery}
        okText="Lưu"
      >
        <Row gutter={24} align="middle">
          {" "}
          <Col span={11}>
            <h4>Query</h4>
            <TextArea
              rows={12}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Nhập query..."
              style={{ height: 320, resize: "none" }}
            />
            <div style={{ height: 16 }} />{" "}
          </Col>
          <Col span={2} style={{ textAlign: "center" }}>
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowRightOutlined />}
              size="large"
              onClick={handleTestQuery}
              loading={loadingPreview}
              style={{ marginTop: 0 }}
            />
          </Col>
          <Col span={11}>
            <h4>Kết quả</h4>
            <pre
              style={{
                background: "#f6f6f6",
                padding: 12,
                height: 320,
                overflow: "auto", // scroll khi nội dung dài
                border: "1px solid #ddd",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {previewResult
                ? JSON.stringify(previewResult, null, 2)
                : "Chưa có dữ liệu"}
            </pre>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};
