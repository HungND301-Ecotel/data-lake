import {useNavigate } from "react-router-dom";
import {
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import logoUb from "../../file/logo-ub.jpg";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full">
      <div
        className={`bg-black border-b border-black transition-all duration-300 overflow-hidden`}
      >
        <div
          className={`flex items-center justify-center px-6 py-3 text-white transition-all duration-300 `}
        >
          <img
            src={logoUb}
            className="h-14 w-14 rounded-full cursor-pointer"
            onClick={() => navigate("/dashboard")}
          />

          <div className="ml-4 text-center">
            <div className="text-2xl font-bold">
              PHẦN MỀM QUẢN LÝ KHO DỮ LIỆU
            </div>
            <div className="text-base font-bold">
              CÔNG TY CỔ PHẦN THAN MÔNG DƯƠNG
            </div>

            <div className="flex justify-center gap-6 text-sm mt-1">
              <span className="flex items-center gap-1">
                <PhoneOutlined /> 033 3868271
              </span>
              <span className="flex items-center gap-1">
                <MailOutlined /> thanmongduongvnc@gmail.com
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
