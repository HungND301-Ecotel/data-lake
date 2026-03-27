import { Spin } from "antd";
import { useState, useEffect } from "react";

export default function ReportTargetsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableauUrl, setTableauUrl] = useState<string>("");
  const [loadingTicket, setLoadingTicket] = useState(false);

  useEffect(() => {
    loadDashboardData();
    getTrustedTicket();
  }, []);

  const getTrustedTicket = async () => {
    try {
      setLoadingTicket(true);
      setError(null);

      // Gọi API backend để lấy trusted ticket
      const response = await fetch('/api/tableau-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Gửi cookies để xác thực
      });

      if (!response.ok) {
        throw new Error('Không thể lấy trusted ticket');
      }

      const data = await response.json();
      const ticket = data.ticket;

      // Tạo URL với trusted ticket
      const baseUrl = 'https://bi.vinacomin.vn/trusted';
      const viewPath = 't/TKV/views/Thchinmtschtiuchyu/Chtiuchyusnxut-tiuth-tnkho';
      const params = ':embed=y&:tabs=no&:toolbar=top&:showVizHome=no';
      
      const trustedUrl = `${baseUrl}/${ticket}/${viewPath}?${params}`;
      setTableauUrl(trustedUrl);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi tải trusted ticket"
      );
      console.error("Error getting trusted ticket:", err);
    } finally {
      setLoadingTicket(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    getTrustedTicket();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Báo cáo thực hiện các chỉ tiêu chủ yếu
          </h1>
          
        </div>
        <button
          onClick={refreshDashboard}
          disabled={loadingTicket}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loadingTicket ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">
            <strong>Lỗi:</strong> {error}
          </p>
          <button
            onClick={refreshDashboard}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading || loadingTicket ? (
        <div className="flex justify-center items-center min-h-96">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hiển thị iframe với Trusted URL */}
          {tableauUrl ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white p-3 flex justify-between items-center">
                <span className="font-semibold">📊 Dashboard Tableau</span>
                <span className="text-xs bg-blue-700 px-2 py-1 rounded">
                  Trusted Authentication
                </span>
              </div>
              <iframe
                key={tableauUrl} // Force re-render khi URL thay đổi
                src={tableauUrl}
                width="100%"
                height="900px"
                frameBorder="0"
                allowFullScreen
                title="BI Dashboard Report Targets"
                style={{ display: "block" }}
              />
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-800 font-semibold mb-2">
                Chưa thể tải dashboard
              </p>
              <p className="text-yellow-700 text-sm mb-4">
                Vui lòng đảm bảo backend API đã được cấu hình đúng
              </p>
              <button
                onClick={refreshDashboard}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}