import { Divider, Typography } from "antd";
import LakehouseDashboardPage from "../../ingestion/pages/LakehouseDashboardPage";
import DashboardWare from "../../ware/pages/WareBatchDasboard";

const { Title } = Typography;

/**
 * Trang chủ: gộp hai bảng điều hành vốn nằm rời nhau.
 *
 * Phần tổng quan kho dữ liệu lên trên vì nó nêu việc cần xử lý ngay — tệp bị
 * cách ly, việc rơi vào hàng đợi thất bại, yêu cầu chờ duyệt. Thống kê nhập
 * liệu kho xuống dưới vì đó là số liệu để đọc, không phải để hành động.
 *
 * Người không có quyền với kho dữ liệu sẽ chỉ thấy phần thống kê kho: khối trên
 * tự ẩn thay vì báo lỗi, vì trang chủ là chỗ mọi vai trò đều đi qua.
 */
export default function TrangChuPage() {
  return (
    <div style={{ padding: 16 }}>
      <LakehouseDashboardPage nhung />

      <Divider style={{ margin: "24px 0 16px" }} />

      <Title level={4} style={{ margin: "0 0 12px" }}>
        Thống kê nhập liệu kho
      </Title>
      <DashboardWare />
    </div>
  );
}
