import { useState } from "react";
import { Alert, message } from "antd";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Phone, Mail } from "lucide-react";

import type { LoginResponse } from "../../employee/types/user";
import { useAuthStore } from "../../../stores/authStore";
import { userApi } from "../api/userApi";
import logoUb from "../../../file/logo-ub.jpg";


const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setRole = useAuthStore((s) => s.setRole);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!username.trim()) {
      setLoginError(null);
      message.error('Vui lòng nhập tài khoản');
      return;
    }

    if (!password.trim()) {
      setLoginError(null);
      message.error('Vui lòng nhập mật khẩu');
      return;
    }

    setLoginError(null);
    setLoading(true);
    try {
      const res: LoginResponse = await userApi.login({ username, password });

      localStorage.setItem("token", res.token);
      localStorage.setItem("refreshToken", res.refreshToken);
      setRole(res.role);
      message.success("Đăng nhập thành công");
      navigate("/");
    } catch (err: any) {
      console.log(err);
      const errorMessage =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data ||
        "Đăng nhập thất bại";

      setLoginError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Header */}
      <header className="h-auto border-b bg-[#39b6f9]! backdrop-blur flex items-center justify-center px-6 relative z-20">
        <div className="flex items-center gap-3 text-primary-foreground py-4">
          <span className="flex flex-col gap-1 text-white">
            <div className="text-base sm:text-5xl font-bold text-center">
              KHO DỮ LIỆU TẬP TRUNG
            </div>
            <div className="text-base sm:text-xl font-bold text-center">
              CÔNG TY CỔ PHẦN THAN MÔNG DƯƠNG
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-end sm:justify-center gap-2 sm:gap-4 text-white text-sm sm:text-xl sm:text-center font-medium">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white" />
                <span>Hotline: 033 3868271</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white" />
                <span>Email: thanmongduongvnc@gmail.com</span>
              </div>
            </div>
          </span>
        </div>
      </header>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://media.baoquangninh.vn/upload/image/202406/medium/2228683_toan_canh_khai_truong_san_xuat_cua_cong_ty_cp_than_mong_duong_22410527.jpg"
          alt="HR Background"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center flex-1 w-full px-6 py-8">
        {/* Card chứa form */}
        <div className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Logo - thay thế bằng text hoặc thêm logo của bạn */}
          <div className="mb-5 sm:mb-1 flex justify-center">
            <img
              src={logoUb}
              className="h-14 w-20 rounded-full cursor-pointer"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#39b6f9]! dark:text-blue-400!">
              Đăng nhập
            </h2>
          </div>

          {/* Divider */}
          <div className="relative py-3 sm:py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Nhập tài khoản"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <Eye className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                    ) : (
                      <EyeOff className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#39b6f9]! hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </div>

              {loginError ? (
                <Alert
                  type="error"
                  showIcon
                  message={loginError}
                  className="mt-2"
                />
              ) : null}
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 CÔNG TY CỔ PHẦN THAN MÔNG DƯƠNG. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
