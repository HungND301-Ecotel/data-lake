import { useState, useEffect } from "react";
import { Alert, message } from "antd";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, Eye, EyeOff } from 'lucide-react';

import type { LoginResponse } from "../../employee/types/user";
import { useAuthStore } from "../../../stores/authStore";
import { userApi } from "../api/userApi";
import iamApi from "../api/iamApi";
import logoUb from "../../../file/logo-ub.jpg";
import Banner from "../../../file/Banner.jpg";


const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  /** Token trung gian sau bước mật khẩu; chỉ dùng để xác minh MFA. */
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setAccess = useAuthStore((s) => s.setAccess);

  /** Lưu phiên và chuyển vào trong; dùng chung cho luồng có và không có MFA. */
  const startSession = (res: LoginResponse) => {
    localStorage.setItem("token", res.token);
    localStorage.setItem("refreshToken", res.refreshToken);
    setAccess({
      role: res.role,
      roles: res.roles,
      permissions: res.permissions,
      orgCode: res.orgCode,
      clearanceLevel: res.clearanceLevel,
    });
    message.success("Đăng nhập thành công");
    navigate("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

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

      if (res.mfaRequired && res.mfaToken) {
        setMfaToken(res.mfaToken);
        setMfaCode("");
        return;
      }

      startSession(res);
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

  const handleVerifyMfa = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mfaCode.trim().length !== 6) {
      message.error("Nhập đủ 6 chữ số của mã xác thực");
      return;
    }
    setLoading(true);
    try {
      startSession(await iamApi.verifyMfa(mfaToken as string, mfaCode.trim()));
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Mã xác thực không đúng");
    } finally {
      setLoading(false);
    }
  };

  const cancelMfa = () => {
    setMfaToken(null);
    setMfaCode("");
    setPassword("");
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Header */}
      <header className="h-auto border-b bg-[#1a8649] backdrop-blur flex items-center justify-center px-6 relative z-20">
        <div className="flex items-center gap-3 text-primary-foreground py-4">
          <span className="flex flex-col gap-1 text-white">
            <div className="text-base sm:text-5xl font-bold text-center">
              KHO DỮ LIỆU TẬP TRUNG
            </div>
            <div className="text-base sm:text-xl font-bold text-center">
              CÔNG TY THAN UÔNG BÍ - TKV
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-end sm:justify-center gap-2 sm:gap-4 text-white text-sm sm:text-xl sm:text-center font-medium">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white" />
                <span>Hotline: 02033.854491</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white" />
                <span>Email: ctythanub@gmail.com</span>
              </div>
            </div>
          </span>
        </div>
      </header>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={Banner}
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
            <h2 className="text-2xl font-bold text-green-600 dark:text-blue-400">
              {mfaToken ? "Xác thực hai lớp" : "Đăng nhập"}
            </h2>
            {mfaToken && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Nhập mã 6 chữ số từ ứng dụng xác thực của bạn
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative py-3 sm:py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
          </div>

          {mfaToken ? (
            <form onSubmit={handleVerifyMfa}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mã xác thực <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mfaCode"
                    name="mfaCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    autoFocus
                    className="w-full px-4 py-2 text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang xác thực..." : "Xác nhận"}
                </button>

                <button
                  type="button"
                  onClick={cancelMfa}
                  disabled={loading}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          ) : (
          /* Form */
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 CÔNG TY THAN UÔNG BÍ - TKV. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
