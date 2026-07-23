import { useState } from "react";

interface SetupModalProps {
  onClose: () => void;
}

export function SetupModal({ onClose }: SetupModalProps) {
  const [connections, setConnections] = useState<
    Record<
      string,
      { ip: string; port: string; db: string; user: string; pass: string }
    >
  >({
    "PX Than Nguyên Khai": {
      ip: "192.168.1.100",
      port: "1433",
      db: "QLSX_DB",
      user: "sa",
      pass: "••••••",
    },
    "PX Than Sạch": {
      ip: "192.168.1.102",
      port: "1433",
      db: "QLSX_DB",
      user: "sa",
      pass: "••••••",
    },
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [tempConfig, setTempConfig] = useState<{
    ip: string;
    port: string;
    db: string;
    user: string;
    pass: string;
  } | null>(null);

  const deptOptions = ["PX Than Nguyên Khai", "PX Than Sạch", "PX Cơ điện"];

  const handleEditStart = (dept: string) => {
    setEditingDept(dept);
    setTempConfig({ ...connections[dept] });
  };

  const handleEditSave = () => {
    if (editingDept && tempConfig) {
      setConnections((prev) => ({
        ...prev,
        [editingDept]: tempConfig,
      }));
      setEditingDept(null);
      setTempConfig(null);
    }
  };

  const handleEditCancel = () => {
    setEditingDept(null);
    setTempConfig(null);
  };

  const handleDeleteConnection = (dept: string) => {
    if (confirm(`Xác nhận xóa cấu hình: ${dept}?`)) {
      setConnections((prev) => {
        const newConnections = { ...prev };
        delete newConnections[dept];
        return newConnections;
      });
    }
  };

  const handleAddNewStart = () => {
    setIsAddingNew(true);
    setNewDept("");
    setTempConfig({
      ip: "",
      port: "1433",
      db: "QLSX_DB",
      user: "sa",
      pass: "",
    });
  };

  const handleAddNewSave = () => {
    if (!newDept || !tempConfig) {
      alert("Vui lòng nhập tên phòng ban");
      return;
    }
    if (connections[newDept]) {
      alert("Phòng ban này đã tồn tại!");
      return;
    }
    setConnections((prev) => ({
      ...prev,
      [newDept]: tempConfig,
    }));
    setIsAddingNew(false);
    setNewDept("");
    setTempConfig(null);
  };

  const handleAddNewCancel = () => {
    setIsAddingNew(false);
    setNewDept("");
    setTempConfig(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 w-full max-w-[520px] animate-slideUp">
        {/* Header */}
        <div className="p-5 px-7 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex flex-col">
            <div className="font-semibold text-sm text-slate-900">
              Cấu hình kết nối Server
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Quản lý kết nối cơ sở dữ liệu các phân xưởng
            </div>
          </div>
          <button
            className="bg-transparent border-0 text-slate-400 text-lg cursor-pointer transition-all hover:text-slate-950"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-7 overflow-y-auto">
          {/* Main List */}
          {!isAddingNew && !editingDept && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Danh sách máy chủ kết nối
                </span>
                <button
                  className="bg-teal-700 text-white border-0 rounded-lg py-1.5 px-3 font-semibold text-xs cursor-pointer hover:bg-teal-800"
                  onClick={handleAddNewStart}
                >
                  + Thêm mới
                </button>
              </div>

              {Object.entries(connections).length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400">
                    Chưa cấu hình Server nào kết nối
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(connections).map(([dept, cfg]) => (
                    <div
                      key={dept}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {dept}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {cfg.ip}:{cfg.port} • DB: <b>{cfg.db}</b> • User:{" "}
                          <b>{cfg.user}</b>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="bg-white text-slate-700 border border-slate-200 rounded-lg py-1 px-3 font-medium text-xs cursor-pointer hover:bg-slate-50"
                          onClick={() => handleEditStart(dept)}
                        >
                          Sửa
                        </button>
                        <button
                          className="bg-white text-red-600 border border-red-100 rounded-lg py-1 px-3 font-medium text-xs cursor-pointer hover:bg-red-50"
                          onClick={() => handleDeleteConnection(dept)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Add New */}
          {isAddingNew && tempConfig && (
            <div className="flex flex-col gap-4">
              <div className="font-bold text-xs text-teal-800">
                + Tạo cấu hình máy chủ mới
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Chọn phòng ban phụ trách *
                </label>
                <select
                  className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {deptOptions
                    .filter((opt) => !connections[opt])
                    .map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    IP / Hostname
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.ip}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, ip: e.target.value })
                    }
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Port
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.port}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, port: e.target.value })
                    }
                    placeholder="1433"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Database Name
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.db}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, db: e.target.value })
                    }
                    placeholder="QLSX_DB"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Username
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.user}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, user: e.target.value })
                    }
                    placeholder="sa"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Password
                </label>
                <input
                  className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                  type="password"
                  value={tempConfig.pass}
                  onChange={(e) =>
                    setTempConfig({ ...tempConfig, pass: e.target.value })
                  }
                  placeholder="••••••"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  className="bg-teal-700 text-white border-0 rounded-lg py-2.5 px-5 font-semibold text-xs cursor-pointer flex-1 flex items-center justify-center hover:bg-teal-800 shadow-md"
                  onClick={handleAddNewSave}
                >
                  Lưu cấu hình
                </button>
                <button
                  className="bg-white text-slate-700 border border-slate-200 rounded-lg py-2.5 px-5 font-semibold text-xs cursor-pointer flex-1 flex items-center justify-center hover:bg-slate-50"
                  onClick={handleAddNewCancel}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Form Edit */}
          {editingDept && tempConfig && (
            <div className="flex flex-col gap-4">
              <div className="text-xs font-semibold text-slate-700">
                Sửa cấu hình: <b>{editingDept}</b>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    IP / Hostname
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.ip}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, ip: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Port
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.port}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, port: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Database Name
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.db}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, db: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Username
                  </label>
                  <input
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={tempConfig.user}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, user: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Password
                </label>
                <input
                  className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                  type="password"
                  value={tempConfig.pass}
                  onChange={(e) =>
                    setTempConfig({ ...tempConfig, pass: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  className="bg-teal-700 text-white border-0 rounded-lg py-2.5 px-5 font-semibold text-xs cursor-pointer flex-1 flex items-center justify-center hover:bg-teal-800 shadow-md"
                  onClick={handleEditSave}
                >
                  Lưu thay đổi
                </button>
                <button
                  className="bg-white text-slate-700 border border-slate-200 rounded-lg py-2.5 px-5 font-semibold text-xs cursor-pointer flex-1 flex items-center justify-center hover:bg-slate-50"
                  onClick={handleEditCancel}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 px-7 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            className="bg-teal-700 text-white border-0 rounded-lg py-2 px-5 font-semibold text-xs cursor-pointer hover:bg-teal-800"
            onClick={onClose}
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
