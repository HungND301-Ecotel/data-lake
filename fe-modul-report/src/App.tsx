import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { componentAnt, tokenAnt } from "./theme/thuongHieu";
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-calendars/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-react-spreadsheet/styles/material.css';

function App() {
  // ConfigProvider phải bọc toàn bộ router: mọi nút, link, tab, thanh tiến
  // trình của Ant đều lấy màu từ đây. Thiếu nó thì Ant dùng xanh dương mặc
  // định, lệch hẳn với xanh lá của thanh tiêu đề và menu.
  return (
    // locale tiếng Việt cho luôn ở đây: bảng rỗng của Ant vốn hiện "No data",
    // lịch và bộ lọc cũng bằng tiếng Anh, lạc lõng giữa giao diện tiếng Việt.
    <ConfigProvider
      locale={viVN}
      theme={{ token: tokenAnt, components: componentAnt }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
