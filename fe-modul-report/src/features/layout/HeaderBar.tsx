import {useNavigate } from "react-router-dom";
import {
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import logo from "../../file/logo.png";
const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full">
      <div
        className={`bg-[#1976D2] border-b border-blue-600 transition-all duration-300 overflow-hidden`}
      >
        <div
          className={`flex items-center justify-center px-6 py-3 text-white transition-all duration-300 `}
        >
          <img
            src={logo}
            className="h-16 w-18 rounded-full cursor-pointer"
            onClick={() => navigate("/dashboard")}
          />

          <div className="ml-4 text-center">
            <div className="text-2xl font-bold">
              PHẦN MỀM QUẢN LÝ KHO DỮ LIỆU
            </div>
            <div className="text-base font-bold">
             CÔNG TY CỔ PHẦN THAN MAO KHÊ - TKV
            </div>

            <div className="flex justify-center gap-6 text-sm mt-1">
              <span className="flex items-center gap-1">
                <PhoneOutlined /> (020)33871240 
              </span>
              <span className="flex items-center gap-1">
                <MailOutlined /> (020)33871375
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
