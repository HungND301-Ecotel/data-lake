import { useNavigate } from "react-router-dom";
import logo from "../../file/logo.png";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full">
      <div
        className={`bg-[#1a8649] border-b border-green-600 transition-all duration-300 overflow-hidden`}
      >
        <div
          className={`flex items-center justify-center px-6 py-3 text-white transition-all duration-300 `}
        >
          <img
            src={logo}
            className="h-14 w-14 rounded-full cursor-pointer"
            onClick={() => navigate("/dashboard")}
          />

          <div className="ml-4 text-center">
            <div className="text-2xl font-bold">
              PHẦN MỀM QUẢN LÝ KHO DỮ LIỆU
            </div>
            <div className="text-base font-bold">
              CÔNG TY THAN CAO SƠN - TKV
            </div>

            <div className="flex justify-center gap-6 text-sm mt-1">
              <span className="flex items-center gap-1">
                Điện thoại: (84)0203 3862 337
              </span>
              <span className="flex items-center gap-1">Fax: 0203 3863 945</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
