/**
 * Bảng màu dùng chung của phần mềm.
 *
 * Trước đây khung web (thanh tiêu đề, menu, nút đăng nhập) dùng xanh lá thương
 * hiệu, còn toàn bộ thành phần Ant Design vẫn để mặc định xanh dương. Kết quả
 * là cùng một màn hình có hai hệ màu: nút chính xanh lá ở chỗ này, xanh dương ở
 * chỗ kia; link, tab, thanh tiến trình, ô chọn đều lệch tông.
 *
 * Gốc rễ là chưa ai khai ConfigProvider, nên sửa từng chỗ bằng tay sẽ không bao
 * giờ hết. Tệp này là nguồn duy nhất cho màu, và `ConfigProvider` ở App.tsx nạp
 * nó cho mọi thành phần Ant.
 */

/** Xanh lá thương hiệu — màu đã dùng ở thanh tiêu đề và nút đăng nhập. */
export const XANH_CHINH = "#1a8649";
/** Sắc đậm hơn cho trạng thái di chuột và nhấn. */
export const XANH_DAM = "#15703d";
/** Nền nhạt cho vùng được chọn, dòng bảng đang trỏ tới. */
export const XANH_NHAT = "#f0f9f4";

/**
 * Màu trạng thái. Giữ tông quen thuộc để người dùng đọc được ngay ý nghĩa —
 * đỏ là hỏng, cam là cần chú ý — nhưng chọn sắc hoà với xanh lá thương hiệu
 * thay vì lấy nguyên mặc định.
 */
export const DO_LOI = "#d4380d";
export const CAM_CANH_BAO = "#d46b08";
export const XANH_THANH_CONG = "#237804";
/**
 * "Thông tin" cũng dùng xanh lá thay vì xanh dương: đây chính là chỗ khiến giao
 * diện trông hai màu, vì mọi Alert dạng info và link đều ăn theo token này.
 */
export const XANH_THONG_TIN = XANH_CHINH;

/** Token cấp cho ConfigProvider của Ant Design. */
export const tokenAnt = {
  colorPrimary: XANH_CHINH,
  colorLink: XANH_CHINH,
  colorLinkHover: XANH_DAM,
  colorInfo: XANH_THONG_TIN,
  colorSuccess: XANH_THANH_CONG,
  colorWarning: CAM_CANH_BAO,
  colorError: DO_LOI,
  borderRadius: 6,
  fontFamily:
    '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif',
};

/**
 * Vài thành phần cần chỉnh riêng: mặc định của Ant lấy nền chọn từ colorPrimary
 * pha rất nhạt, nhìn ra xám chứ không ra xanh lá.
 */
export const componentAnt = {
  Menu: {
    itemSelectedBg: XANH_NHAT,
    itemSelectedColor: XANH_DAM,
    itemHoverBg: XANH_NHAT,
  },
  Table: {
    rowSelectedBg: XANH_NHAT,
    rowSelectedHoverBg: XANH_NHAT,
    rowHoverBg: "#fafafa",
  },
  Tabs: {
    itemSelectedColor: XANH_CHINH,
    inkBarColor: XANH_CHINH,
  },
  Segmented: {
    itemSelectedBg: XANH_NHAT,
    itemSelectedColor: XANH_DAM,
  },
};
