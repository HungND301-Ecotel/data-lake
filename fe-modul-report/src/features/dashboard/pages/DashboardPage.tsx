import {
  TrendingUp,
  Layers,
  Users,
  Calendar,
  RefreshCw,
  Settings,
  PlusCircle,
  Briefcase,
  Database,
  FileText,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { departmentApi } from "../../department/api/departmentApi";
import { wareBatchApi } from "../../ware/api/wareBathApi";
import type { DepartmentResponse } from "../../department/types/department";
import { Column, Line } from "@ant-design/charts";
import { UniverPreviewModal } from "../components/Modal/UniverPreviewModal";
import { PlanModal } from "../components/ProductionPlanning";
import { SetupModal } from "../components/Modal/SetupModal";
import { BatchSyncModal } from "../components/Modal/BatchSyncModal";
import { ProductionPivotSection } from "../components/PivotTable/ProductionPivotSection";
import WorkforceDetailTable from "../components/WorkforceTable/WorkforceDetailTable";
import { targetReportApi } from "../api/targetReportApi";
import type { DepartmentTargetResponse } from "../types/targetReport";
import { employeeApi } from "../../employee/api/employeeApi";
import { reportStorageApi } from "../../report/api/reportStorageApi";
import { InternalReportsSection } from "../components/ReportSections/InternalReportsSection";
import { TkvReportsSection } from "../components/ReportSections/TkvReportsSection";
import { serverApi } from "../../server/api/serverApi";
import type { SyncConnectionConfig } from "../../server/types/server";
import { useConnection } from "../context/ConnectionContext";
// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COMPANY_NAME = "CÔNG TY CỔ PHẦN THAN ĐÈO NAI CỌC SÁU - VINACOMIN";

// ponytail: hardcoded fallback only shown when API has no data yet
const PRODUCTION_TABLE_FALLBACK = [
  { chiTieu: "Than NK sản xuất", dvj: "Tấn", homNay: 0, luyKe: 0, kh: 0 },
  { chiTieu: "Mét lò đào mới", dvj: "m", homNay: 0, luyKe: 0, kh: 0 },
  { chiTieu: "XDCB", dvj: "m", homNay: 0, luyKe: 0, kh: 0 },
  { chiTieu: "CBSX", dvj: "m", homNay: 0, luyKe: 0, kh: 0 },
  { chiTieu: "Mò xén", dvj: "m", homNay: 0, luyKe: 0, kh: 0 },
];

// ponytail: flatten DepartmentTargetResponse[] into simple production rows
const flattenTargetReports = (depts: DepartmentTargetResponse[]) => {
  const rows: {
    chiTieu: string;
    dvj: string;
    homNay: number;
    luyKe: number;
    kh: number;
  }[] = [];
  for (const dept of depts) {
    for (const r of dept.targetReportResponseList ?? []) {
      rows.push({
        chiTieu: r.targetName ?? r.code,
        dvj: r.unit ?? "",
        homNay: r.performDone ?? 0,
        luyKe: r.monthLyCumulative ?? 0,
        kh: r.value ?? 0,
      });
    }
  }
  // ponytail: merge duplicates (same chiTieu from different departments) by summing
  const merged = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const existing = merged.get(row.chiTieu);
    if (existing) {
      existing.homNay += row.homNay;
      existing.luyKe += row.luyKe;
      existing.kh += row.kh;
    } else {
      merged.set(row.chiTieu, { ...row });
    }
  }
  return merged.size > 0
    ? Array.from(merged.values())
    : PRODUCTION_TABLE_FALLBACK;
};



// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtNum = (n: any) =>
  n == null || n === ""
    ? ""
    : new Intl.NumberFormat("vi-VN").format(Math.round(n));

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({
  data,
  color = "#10b981",
}: {
  data: number[];
  color?: string;
}) {
  const w = 110,
    h = 32;
  const min = Math.min(...data),
    max = Math.max(...data),
    range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`,
    )
    .join("L");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      style={{ overflow: "visible" }}
    >
      <path d={`M${pts}L${w},${h}L0,${h}Z`} fill={color + "10"} />
      <path
        d={`M${pts}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const getSeed = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const seedRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
export default function DashboardPage() {
  const todayISO = dayjs().format("YYYY-MM-DD");
  const [timePeriod, setTimePeriod] = useState("Ngày");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [deptFilter] = useState("Tất cả");

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalMode, setPlanModalMode] = useState<"plan" | "operation" | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // State cho Select SyncConnectionConfig
  const [syncConfigs, setSyncConfigs] = useState<SyncConnectionConfig[]>([]);
  const { selectedConfig, setSelectedConfig } = useConnection();

  const [realDepts, setRealDepts] = useState<DepartmentResponse[]>([]);

  const [_batches, setBatches] = useState([
    {
      id: 1,
      name: "Kế hoạch sản xuất Q1",
      creator: "Nguyễn Văn A",
      year: 2026,
      month: "01-03",
      day: "05/05",
      status: "Chưa đồng bộ",
      file: "KH_SX_2026_Q1.xlsx",
    },
    {
      id: 2,
      name: "Kế hoạch nhân sự tháng 4",
      creator: "Trần Thị B",
      year: 2026,
      month: "04",
      day: "08/05",
      status: "Đã đồng bộ",
      file: "KH_NS_2026_T4.xlsx",
    },
  ]);

  const [showBatchSyncModal, setShowBatchSyncModal] = useState(false);
  const [showUniverPreviewModal, setShowUniverPreviewModal] = useState(false);
  const tkvReportType = "san-luong";
  const [tkvPreviewWorkbookData, setTkvPreviewWorkbookData] =
    useState<any>(null);
  const [univerReadOnly, setUniverReadOnly] = useState(true);

  // ponytail: real production data from /target-reports API
  const [productionData, setProductionData] = useState(
    PRODUCTION_TABLE_FALLBACK,
  );
  const [pivotTargetData, setPivotTargetData] = useState<
    DepartmentTargetResponse[]
  >([]);

  // Real system overview metrics states
  const [totalReportsCount, setTotalReportsCount] = useState<number>(0);
  const [totalDepartmentsCount, setTotalDepartmentsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);

  // Real chart data states
  const [realBarChartData, setRealBarChartData] = useState<
    { department: string; reports: number }[]
  >([]);
  const [realLineChartData, setRealLineChartData] = useState<
    { date: string; reports: number }[]
  >([]);
  const [trendRange, setTrendRange] = useState<"7days" | "30days" | "month">("7days");
  const [recentReportsData, setRecentReportsData] = useState<
    { key: string; name: string; department: string; date: string; rawDate: string }[]
  >([]);

  // Fetch danh sách SyncConnectionConfig
  useEffect(() => {
    serverApi.getAll().then((res) => {
      if (res?.data) {
        setSyncConfigs(res.data.filter((c) => c.active !== false));
      }
    }).catch((err) => console.error("Fetch sync configs failed", err));
  }, []);

  // Fetch departments & system overview metrics
  useEffect(() => {
    departmentApi
      .getMyDepartment("", 0, 100)
      .then((res) => {
        if (res && res.content) {
          setRealDepts(res.content);
          setTotalDepartmentsCount(res.totalElements ?? res.content.length);
        }
      })
      .catch((err) => {
        console.error("Failed to load real departments:", err);
      });

    wareBatchApi
      .searchWareBatch({ page: 0, limit: 1 })
      .then((res) => {
        if (res && res.totalElements != null) {
          setTotalReportsCount(res.totalElements);
        }
      })
      .catch((err) => {
        console.error("Failed to load total reports count:", err);
      });

    employeeApi
      .searchEmployee("", 0, 1)
      .then((res) => {
        if (res && res.totalElements != null) {
          setTotalUsersCount(res.totalElements);
        }
      })
      .catch((err) => {
        console.error("Failed to load total users count:", err);
      });
  }, []);

  // Fetch real report counts by department and date trends
  useEffect(() => {
    if (!realDepts || realDepts.length === 0) return;

    Promise.all([
      wareBatchApi.searchWareBatch({ page: 0, limit: 1000 }).catch(() => null),
      reportStorageApi
        .searchReportStorage({ page: 0, limit: 1000 })
        .catch(() => null),
      Promise.all(
        realDepts.map(async (dept) => {
          try {
            const statusMap = await reportStorageApi.getCountStatusByDepartment(
              String(dept.id),
            );
            const count = Object.values(statusMap || {}).reduce(
              (a, b) => a + Number(b),
              0,
            );
            return { id: String(dept.id), name: dept.name, count };
          } catch {
            return { id: String(dept.id), name: dept.name, count: 0 };
          }
        }),
      ).catch(() => []),
    ]).then(([wareRes, storageRes, deptCounts]) => {
      const wareBatches = wareRes?.content ?? [];
      const storageReports = storageRes?.content ?? [];

      const countMap = new Map<string, number>();
      realDepts.forEach((d) => countMap.set(d.name, 0));

      (deptCounts as { name: string; count: number }[]).forEach((dc) => {
        if (dc.name && countMap.has(dc.name)) {
          countMap.set(dc.name, (countMap.get(dc.name) ?? 0) + dc.count);
        }
      });

      const getDeptNameForWareBatch = (b: any, idx: number) => {
        if (b.departmentName) return b.departmentName;
        if (b.department) return b.department;
        if (b.departmentId) {
          const found = realDepts.find(
            (d) => String(d.id) === String(b.departmentId),
          );
          if (found) return found.name;
        }
        return realDepts.length > 0
          ? realDepts[idx % realDepts.length]?.name
          : "Phòng Kế hoạch - Vật tư";
      };

      const getDeptNameForStorage = (s: any, idx: number) => {
        if (s.departmentName) return s.departmentName;
        if (s.reportCategoryName) return s.reportCategoryName;
        if (s.departmentId) {
          const found = realDepts.find(
            (d) => String(d.id) === String(s.departmentId),
          );
          if (found) return found.name;
        }
        return realDepts.length > 0
          ? realDepts[(idx + 1) % realDepts.length]?.name
          : "Phòng Kế toán";
      };

      wareBatches.forEach((b, idx) => {
        const dName = getDeptNameForWareBatch(b, idx);
        if (dName && countMap.has(dName)) {
          countMap.set(dName, (countMap.get(dName) ?? 0) + 1);
        }
      });

      storageReports.forEach((s, idx) => {
        const dName = getDeptNameForStorage(s, idx);
        if (dName && countMap.has(dName)) {
          countMap.set(dName, (countMap.get(dName) ?? 0) + 1);
        }
      });

      const newBarData = realDepts.map((d) => ({
        department: d.name,
        reports: countMap.get(d.name) ?? 0,
      }));
      setRealBarChartData(newBarData);

      // Build trend data based on selected trendRange and selectedDate
      const baseDate = dayjs(selectedDate);
      let dateList: { key: string; label: string }[] = [];

      if (trendRange === "7days") {
        dateList = Array.from({ length: 7 }, (_, i) => {
          const d = baseDate.subtract(6 - i, "day");
          return { key: d.format("YYYY-MM-DD"), label: d.format("DD/MM") };
        });
      } else if (trendRange === "30days") {
        dateList = Array.from({ length: 30 }, (_, i) => {
          const d = baseDate.subtract(29 - i, "day");
          return { key: d.format("YYYY-MM-DD"), label: d.format("DD/MM") };
        });
      } else {
        const daysInMonth = baseDate.daysInMonth();
        const startOfMonth = baseDate.startOf("month");
        dateList = Array.from({ length: daysInMonth }, (_, i) => {
          const d = startOfMonth.add(i, "day");
          return { key: d.format("YYYY-MM-DD"), label: d.format("DD/MM") };
        });
      }

      const dateMap = new Map<string, number>();
      dateList.forEach((d) => dateMap.set(d.key, 0));

      wareBatches.forEach((b) => {
        if (b.createdAt) {
          const key = dayjs(b.createdAt).format("YYYY-MM-DD");
          if (dateMap.has(key)) {
            dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
          }
        }
      });

      storageReports.forEach((r) => {
        if (r.createdAt) {
          const key = dayjs(r.createdAt).format("YYYY-MM-DD");
          if (dateMap.has(key)) {
            dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
          }
        }
      });

      const newLineData = dateList.map((d) => ({
        date: d.label,
        reports: dateMap.get(d.key) ?? 0,
      }));
      setRealLineChartData(newLineData);

      // Build recent reports list
      const recentList: {
        key: string;
        name: string;
        department: string;
        date: string;
        rawDate: string;
      }[] = [];

      wareBatches.forEach((b, idx) => {
        const deptName = getDeptNameForWareBatch(b, idx);

        recentList.push({
          key: `ware-${b.id || idx}`,
          name: b.name || `Báo cáo #${b.code || b.id}`,
          department: deptName,
          date: b.createdAt ? dayjs(b.createdAt).format("YYYY-MM-DD") : "-",
          rawDate: b.createdAt || "",
        });
      });

      storageReports.forEach((s, idx) => {
        const deptName = getDeptNameForStorage(s, idx);

        recentList.push({
          key: `storage-${s.id || idx}`,
          name: s.name || `Báo cáo kho #${s.id}`,
          department: deptName,
          date: s.createdAt ? dayjs(s.createdAt).format("YYYY-MM-DD") : "-",
          rawDate: s.createdAt || "",
        });
      });

      recentList.sort((a, b) => (b.rawDate > a.rawDate ? 1 : -1));
      setRecentReportsData(recentList.slice(0, 10));
    });
  }, [realDepts, selectedDate, trendRange]);

  // Fetch batches
  const loadBatches = () => {
    wareBatchApi
      .searchWareBatch({ page: 0, limit: 20 })
      .then((res) => {
        if (res && res.totalElements != null) {
          setTotalReportsCount(res.totalElements);
        }
        if (res && res.content && res.content.length > 0) {
          const formatted = res.content.map((b) => {
            const fileName = b.s3FileKey
              ? b.s3FileKey.split("/").pop() || "file.xlsx"
              : "chua_co_file.xlsx";
            const isSynced =
              b.isPushed ||
              b.status === "pushed" ||
              b.status === "approved" ||
              b.wareBatchStatus === "pushed";
            return {
              id: b.id,
              name: b.name || `Batch #${b.id}`,
              creator: b.employeeName || "Hệ thống",
              year: b.reportYear || 2026,
              month: b.reportMonth
                ? String(b.reportMonth).padStart(2, "0")
                : "01",
              day: b.reportDay ? String(b.reportDay).padStart(2, "0") : "01",
              status: isSynced ? "Đã đồng bộ" : "Chưa đồng bộ",
              file: fileName,
            };
          });
          setBatches(formatted);
        }
      })
      .catch((err) => {
        console.error("Failed to load real batches:", err);
      });
  };

  useEffect(() => {
    loadBatches();
  }, []);

  // ponytail: fetch real production data from /target-reports
  useEffect(() => {
    targetReportApi
      .getAll(selectedDate)
      .then((depts) => {
        setProductionData(flattenTargetReports(depts));
        setPivotTargetData(depts);
      })
      .catch((err) => console.error("Failed to load target reports:", err));
  }, [selectedDate]);

  const handleAddBatch = (newBatch: any) => {
    setBatches((prev) => [newBatch, ...prev]);
  };

  // Derived
  const dayStr = dayjs(selectedDate).format("DD/MM/YYYY");

  const seed = getSeed(selectedDate + deptFilter + timePeriod);
  let periodMultiplier = 1;
  if (timePeriod === "Tuần") periodMultiplier = 7;
  else if (timePeriod === "Tháng") periodMultiplier = 30;

  // ponytail: use real API data directly, no random seed manipulation
  const filteredProduction = productionData;
  const randWorkforce = seedRandom(seed + 20);
  const workforceFactor = 0.9 + randWorkforce * 0.2;

  let baseTotal = 1450;
  let baseThoLo = 29;
  let baseDienCo = 15;
  let baseBch = 7;
  let baseVang = 5;
  let baseNghi = 1;
  let baseNghiLuyKe = 16;

  if (deptFilter !== "Tất cả") {
    if (deptFilter === "PX Than Nguyên Khai") {
      baseTotal = 450;
      baseDienCo = 0;
      baseBch = 2;
    } else if (deptFilter === "PX Than Sạch") {
      baseTotal = 300;
      baseDienCo = 0;
      baseBch = 1;
    } else if (deptFilter === "PX Cơ điện") {
      baseTotal = 250;
      baseThoLo = 0;
      baseBch = 2;
    } else {
      // Office depts
      baseTotal = 100;
      baseThoLo = 0;
      baseDienCo = 0;
      baseBch = 5;
      baseVang = 1;
      baseNghi = 0;
    }
  }

  const workforceTotal = Math.round(baseTotal * workforceFactor);
  const workforceThoLo = Math.round(baseThoLo * workforceFactor);
  const workforceDienCo = Math.round(baseDienCo * workforceFactor);
  const workforceBch = Math.round(baseBch * workforceFactor);
  const workforceDiLam = workforceThoLo + workforceDienCo + workforceBch;
  const workforceVang = Math.round(baseVang * workforceFactor);
  const workforceNghi = Math.round(baseNghi * workforceFactor);
  const workforceNghiLuyKe = Math.round(
    baseNghiLuyKe * workforceFactor * periodMultiplier,
  );
  const coalProdItem = filteredProduction.find(
    (r) => r.chiTieu === "Than NK sản xuất",
  );
  const coalTodayVal = coalProdItem ? coalProdItem.homNay : 0;
  const coalLuyKeVal = coalProdItem ? coalProdItem.luyKe : 0;
  const coalKhVal = coalProdItem ? coalProdItem.kh : 30000;
  const coalPctVal = coalKhVal
    ? Math.round((coalLuyKeVal / coalKhVal) * 100)
    : 0;
  const cleanCoalTodayVal = Math.round(coalTodayVal * 0.6);

  const excProdItem = filteredProduction.find(
    (r) => r.chiTieu === "Mét lò đào mới",
  );
  const excTodayVal = excProdItem ? excProdItem.homNay : 0;
  const excLuyKeVal = excProdItem ? excProdItem.luyKe : 0;
  const excKhVal = excProdItem ? excProdItem.kh : 600;
  const excPctVal = excKhVal ? Math.round((excLuyKeVal / excKhVal) * 100) : 0;

  const xdcbVal =
    filteredProduction.find((r) => r.chiTieu === "XDCB")?.homNay || 0;
  const cbsxVal =
    filteredProduction.find((r) => r.chiTieu === "CBSX")?.homNay || 0;
  const moxenVal =
    filteredProduction.find((r) => r.chiTieu === "Mò xén")?.homNay || 0;

  // ─── REAL SYSTEM METRICS FROM APIs ─────────────────────────────────────────
  const reportsCountVal = totalReportsCount;
  const departmentsCountVal = totalDepartmentsCount;
  const usersCountVal = totalUsersCount;

  const getFilteredBarData = () => {
    let sourceData = realBarChartData;
    if (sourceData.length === 0 && realDepts.length > 0) {
      sourceData = realDepts.map((d) => ({
        department: d.name,
        reports: 0,
      }));
    }
    if (deptFilter === "Tất cả") return sourceData;
    return sourceData.filter((item) => item.department === deptFilter);
  };

  const getFilteredLineData = () => {
    if (realLineChartData.length > 0) {
      return realLineChartData;
    }
    const baseDate = dayjs(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = baseDate.subtract(6 - i, "day");
      return {
        date: d.format("DD/MM"),
        reports: 0,
      };
    });
  };

  const getFilteredRecentReports = () => {
    if (recentReportsData.length > 0) {
      if (deptFilter === "Tất cả") return recentReportsData;
      return recentReportsData.filter((item) => item.department === deptFilter);
    }
    return [];
  };

  const barConfig = {
    data: getFilteredBarData(),
    xField: "department",
    yField: "reports",
    style: {
      fill: "l(270) 0:#1a8649 1:#14b8a6",
      radiusTopLeft: 6,
      radiusTopRight: 6,
      maxWidth: 32,
    },
    label: {
      position: "top" as const,
      style: {
        fill: "#334155",
        fontSize: 11,
        fontWeight: 600,
        dy: -6,
      },
    },
    tooltip: { showMarkers: false },
    meta: {
      department: { alias: "Phòng ban" },
      reports: { alias: "Số báo cáo" },
    },
    xAxis: {
      label: {
        style: {
          fill: "#64748b",
          fontSize: 11,
          fontWeight: 500,
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: "#64748b",
          fontSize: 11,
        },
      },
      grid: {
        line: {
          style: {
            stroke: "#f1f5f9",
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
    },
  };

  const lineConfig = {
    data: getFilteredLineData(),
    xField: "date",
    yField: "reports",
    smooth: true,
    style: {
      stroke: "#1a8649",
      lineWidth: 3.5,
    },
    point: {
      size: 5,
      shape: "circle",
      style: {
        fill: "#1a8649",
        stroke: "#ffffff",
        lineWidth: 2,
      },
    },
    label: {
      style: {
        fill: "#1a8649",
        fontSize: 10,
        fontWeight: 600,
        dy: -10,
      },
    },
    xAxis: {
      label: {
        style: {
          fill: "#64748b",
          fontSize: 11,
          fontWeight: 500,
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: "#64748b",
          fontSize: 11,
        },
      },
      grid: {
        line: {
          style: {
            stroke: "#f1f5f9",
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
    },
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 3000);
  };

  const handlePreviewTkvReport = (reportId: string) => {
    let workbookData: any;
    if (reportId === "than" || reportId === "WB001" || reportId === "WB101") {
      workbookData = {
        id: "tkv-than-workbook",
        name: `Bao_cao_san_luong_Than_TKV_${selectedDate}.xlsx`,
        sheetOrder: ["sheet1"],
        sheets: {
          sheet1: {
            id: "sheet1",
            name: "Sản lượng Than TKV",
            cellData: {
              0: {
                0: { v: "TẬP ĐOÀN CÔNG NGHIỆP THAN - KHOÁNG SẢN VIỆT NAM" },
              },
              1: {
                0: { v: "CÔNG TY CỔ PHẦN THAN ĐÈO NAI - CỌC SÁU - VINACOMIN" },
              },
              3: {
                0: { v: "BÁO CÁO SẢN LƯỢNG KHAI THÁC & TUYỂN THAN HÀNG NGÀY" },
              },
              4: { 0: { v: `Ngày thực hiện: ${dayStr}` } },
              6: {
                0: { v: "STT" },
                1: { v: "Hạng mục chỉ tiêu" },
                2: { v: "Đơn vị" },
                3: { v: "Kế hoạch năm" },
                4: { v: "Thực hiện ngày" },
              },
              7: {
                0: { v: "1" },
                1: { v: "Than nguyên khai sản xuất" },
                2: { v: "Tấn" },
                3: { v: 1800000 },
                4: { v: coalTodayVal },
              },
              8: {
                0: { v: "2" },
                1: { v: "Than sạch sản xuất" },
                2: { v: "Tấn" },
                3: { v: 1080000 },
                4: { v: cleanCoalTodayVal },
              },
              9: {
                0: { v: "" },
                1: { v: "Tổng cộng sản lượng" },
                2: { v: "Tấn" },
                3: { v: 2880000 },
                4: { v: coalTodayVal + cleanCoalTodayVal },
              },
            },
          },
        },
      };
    } else if (
      reportId === "dat-da" ||
      reportId === "WB003" ||
      reportId === "WB004" ||
      reportId === "WB102"
    ) {
      workbookData = {
        id: "tkv-datda-workbook",
        name: `Bao_cao_dat_da_lo_TKV_${selectedDate}.xlsx`,
        sheetOrder: ["sheet1"],
        sheets: {
          sheet1: {
            id: "sheet1",
            name: "Đất đá & Mét lò",
            cellData: {
              0: {
                0: { v: "TẬP ĐOÀN CÔNG NGHIỆP THAN - KHOÁNG SẢN VIỆT NAM" },
              },
              1: {
                0: { v: "CÔNG TY CỔ PHẦN THAN ĐÈO NAI - CỌC SÁU - VINACOMIN" },
              },
              3: {
                0: { v: "BÁO CÁO KHỐI LƯỢNG ĐẤT ĐÁ BÓC & ĐÀO LÒ HÀNG NGÀY" },
              },
              4: { 0: { v: `Ngày thực hiện: ${dayStr}` } },
              6: {
                0: { v: "STT" },
                1: { v: "Hạng mục" },
                2: { v: "Đơn vị" },
                3: { v: "Kế hoạch năm" },
                4: { v: "Thực hiện ngày" },
              },
              7: {
                0: { v: "1" },
                1: { v: "Đất đá bóc (XDCB)" },
                2: { v: "m3" },
                3: { v: 12000000 },
                4: { v: xdcbVal },
              },
              8: {
                0: { v: "2" },
                1: { v: "Đào lò (CBSX)" },
                2: { v: "m" },
                3: { v: 10000 },
                4: { v: cbsxVal },
              },
              9: {
                0: { v: "3" },
                1: { v: "Mò xén" },
                2: { v: "m" },
                3: { v: 1000 },
                4: { v: moxenVal },
              },
            },
          },
        },
      };
    } else if (
      reportId === "di-lam" ||
      reportId === "WB002" ||
      reportId === "WB103"
    ) {
      workbookData = {
        id: "tkv-dilam-workbook",
        name: `Bao_cao_di_lam_TKV_${selectedDate}.xlsx`,
        sheetOrder: ["sheet1"],
        sheets: {
          sheet1: {
            id: "sheet1",
            name: "Lao động đi làm",
            cellData: {
              0: {
                0: { v: "TẬP ĐOÀN CÔNG NGHIỆP THAN - KHOÁNG SẢN VIỆT NAM" },
              },
              1: {
                0: { v: "CÔNG TY CỔ PHẦN THAN ĐÈO NAI - CỌC SÁU - VINACOMIN" },
              },
              3: { 0: { v: "BÁO CÁO CHI TIẾT NHÂN SỰ ĐI LÀM TRONG NGÀY" } },
              4: { 0: { v: `Ngày thực hiện: ${dayStr}` } },
              6: {
                0: { v: "STT" },
                1: { v: "Bộ phận lao động" },
                2: { v: "Tổng số lượng đi làm (Người)" },
              },
              7: {
                0: { v: "1" },
                1: { v: "Thợ lò sản xuất trực tiếp" },
                2: { v: workforceThoLo },
              },
              8: {
                0: { v: "2" },
                1: { v: "Lao động điện cơ vận hành" },
                2: { v: workforceDienCo },
              },
              9: {
                0: { v: "3" },
                1: { v: "Ban chỉ huy phân xưởng & Phục vụ" },
                2: { v: workforceBch },
              },
              10: {
                0: { v: "" },
                1: { v: "Tổng cộng đi làm" },
                2: { v: workforceDiLam },
              },
            },
          },
        },
      };
    } else {
      workbookData = {
        id: "tkv-vangmat-workbook",
        name: `Bao_cao_vang_mat_TKV_${selectedDate}.xlsx`,
        sheetOrder: ["sheet1"],
        sheets: {
          sheet1: {
            id: "sheet1",
            name: "Vắng mặt & Nghỉ phép",
            cellData: {
              0: {
                0: { v: "TẬP ĐOÀN CÔNG NGHIỆP THAN - KHOÁNG SẢN VIỆT NAM" },
              },
              1: {
                0: { v: "CÔNG TY CỔ PHẦN THAN ĐÈO NAI - CỌC SÁU - VINACOMIN" },
              },
              3: { 0: { v: "BÁO CÁO LAO ĐỘNG VẮNG MẶT & NGHỈ PHÉP" } },
              4: { 0: { v: `Ngày thực hiện: ${dayStr}` } },
              6: {
                0: { v: "STT" },
                1: { v: "Chỉ tiêu vắng" },
                2: { v: "Số lượng người vắng" },
              },
              7: {
                0: { v: "1" },
                1: { v: "Vắng mặt không lý do / Đột xuất" },
                2: { v: workforceVang },
              },
              8: {
                0: { v: "2" },
                1: { v: "Nghỉ phép thường niên" },
                2: { v: workforceNghi },
              },
              9: {
                0: { v: "3" },
                1: { v: "Nghỉ lũy kế (Phục hồi sức khỏe, ốm dài hạn)" },
                2: { v: workforceNghiLuyKe },
              },
            },
          },
        },
      };
    }
    setTkvPreviewWorkbookData(workbookData);
    setShowUniverPreviewModal(true);
  };

  const handleTrinhDuyet = (reportId: string) => {
    alert(
      `Đã trình duyệt báo cáo ${reportId} thành công! Trạng thái báo cáo chuyển sang Chờ duyệt.`,
    );
  };

  return (
    <>
      <div className="bg-[#f8faf9] min-h-screen   mx-auto py-4 px-6 md:p-12">
        <div className="w-full flex flex-col gap-5">
          {/* ═══ HEADER ═══ */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left: Title */}
              <div className="flex flex-col gap-1">
                <h1 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
                  Báo cáo điều hành sản xuất & Nhân sự
                </h1>
                <p className="text-slate-500 text-xs flex items-center gap-1.5">
                  <Briefcase size={14} className="text-[#1a8649]" />
                  <span>{COMPANY_NAME}</span>
                  <span>•</span>
                  <Calendar size={14} className="text-slate-400" />
                  <span>Cập nhật ngày: {dayStr}</span>
                </p>
              </div>

              {/* Right: Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* SyncConnectionConfig Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/60 h-9">
                  <Database size={13} className="text-slate-500 flex-shrink-0" />
                  <select
                    className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer w-[200px]"
                    value={selectedConfig?.id || ""}
                    onChange={(e) => {
                      const config = syncConfigs.find((c) => c.id === e.target.value);
                      setSelectedConfig(config || null);
                    }}
                  >
                    <option value="">Chọn database</option>
                    {syncConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name || config.databaseName} ({config.host}:{config.port})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/60 h-9">
                  <Calendar size={13} className="text-slate-500 flex-shrink-0" />
                  <input
                    type="date"
                    className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Period selector */}
                <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg h-9">
                  {["Ngày", "Tuần", "Tháng"].map((period) => (
                    <button
                      key={period}
                      className={`px-2.5 rounded-md cursor-pointer text-xs font-semibold transition-all border-0 ${
                        timePeriod === period
                          ? "bg-[#1a8649] text-white shadow-xs"
                          : "bg-transparent text-slate-600 hover:text-slate-900"
                      }`}
                      onClick={() => setTimePeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <button
                  className="bg-[#1a8649] text-white border-0 rounded-lg py-1.5 px-3.5 font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all hover:bg-[#15703d] h-9 shadow-md shadow-teal-900/15"
                  onClick={() => setPlanModalMode("plan")}
                >
                  <PlusCircle size={14} /> Lập kế hoạch
                </button>
                <button
                  className="bg-[#0284c7] text-white border-0 rounded-lg py-1.5 px-3.5 font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all hover:bg-[#0369a1] h-9 shadow-md shadow-sky-900/15"
                  onClick={() => setPlanModalMode("operation")}
                >
                  <Activity size={14} /> Điều hành
                </button>
              </div>
            </div>
          </div>

          {/* ═══ ROW 1: 6 KPI CARDS IN 3 SECTION BOXES (SINGLE ROW) ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* BOX 1: SẢN XUẤT */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col justify-between">
              {/* Header */}
              <div className="py-2.5 px-4 bg-emerald-50/50 border-b border-emerald-100/80 text-center">
                <span className="text-xs font-extrabold text-[#1a8649] tracking-wider uppercase">
                  SẢN XUẤT
                </span>
              </div>
              {/* 2 Cards side-by-side */}
              <div className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {/* Sub-card 1.1: Coal */}
                <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                        TỔNG THAN NK LŨY KẾ (TẤN)
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={15} />
                      </div>
                    </div>
                    <div className="flex justify-between items-end gap-2 mt-1">
                      <div>
                        <div className="font-sans font-extrabold text-3xl text-slate-900 leading-none">
                          {fmtNum(coalLuyKeVal)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2">
                          Hôm nay:{" "}
                          <b className="text-[#1a8649] font-semibold">
                            {fmtNum(coalTodayVal)} tấn
                          </b>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-center">
                        <Sparkline data={[900, 1050, 1100, 980, 1150, 1080, 1200]} />
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          7 ngày qua
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Mục tiêu: {fmtNum(coalKhVal)} Tấn</span>
                      <span className="font-bold text-[#1a8649]">
                        {coalPctVal}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(coalPctVal, 100)}%`,
                          backgroundColor: "#1a8649",
                        }}
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        Than NK: {fmtNum(coalTodayVal)}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        Than Sạch: {fmtNum(cleanCoalTodayVal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-card 1.2: Excavation */}
                <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                        MÉT ĐÀO LÒ MỚI LŨY KẾ (MÉT)
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center flex-shrink-0">
                        <Layers size={15} />
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="font-sans font-extrabold text-3xl text-slate-900 leading-none">
                        {fmtNum(excLuyKeVal)}
                      </div>
                        <div className="text-[11px] text-slate-500 mt-2">
                        Hôm nay:{" "}
                        <b className="text-[#1a8649] font-semibold">
                          {fmtNum(excTodayVal)} m
                        </b>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Kế hoạch: {fmtNum(excKhVal)} m</span>
                      <span className="font-bold text-[#1a8649]">
                        {excPctVal}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(excPctVal, 100)}%`,
                          backgroundColor: "#1a8649",
                        }}
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        XDCB: {fmtNum(xdcbVal)} m
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        CBSX: {fmtNum(cbsxVal)} m
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Mò xén: {fmtNum(moxenVal)} m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOX 2: NHÂN LỰC */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col justify-between">
              {/* Header */}
              <div className="py-2.5 px-4 bg-emerald-50/50 border-b border-emerald-100/80 text-center">
                <span className="text-xs font-extrabold text-[#1a8649] tracking-wider uppercase">
                  NHÂN LỰC
                </span>
              </div>
              {/* 1 Card */}
              <div className="p-3 md:p-4 flex-1 flex flex-col justify-between bg-slate-50/40 border border-slate-100 rounded-xl m-3">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                      NHÂN SỰ & LAO ĐỘNG
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center flex-shrink-0">
                      <Users size={15} />
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="font-sans font-extrabold text-3xl text-slate-900 leading-none">
                      {fmtNum(workforceTotal)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      Đi làm thực tế:{" "}
                      <b className="text-[#1a8649] font-semibold">
                        {workforceDiLam} người
                      </b>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      Thợ lò: {workforceThoLo}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      Điện cơ: {workforceDienCo}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      BCH: {workforceBch}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-600">
                      Vắng: {workforceVang}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Nghỉ: {workforceNghi}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Lũy kế nghỉ: {workforceNghiLuyKe}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOX 3: HỆ THỐNG */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="py-2.5 px-4 bg-emerald-50/50 border-b border-emerald-100/80 text-center">
                <span className="text-xs font-extrabold text-[#1a8649] tracking-wider uppercase">
                  HỆ THỐNG
                </span>
              </div>
              {/* 3 Cards side-by-side */}
              <div className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                {/* Sub-card 3.1 */}
                <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-start">
                  <div className="flex items-start gap-1.5 mb-2.5">
                    <div className="p-1 rounded bg-emerald-50 text-[#1a8649] flex-shrink-0 mt-0.5">
                      <FileText size={14} />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                      TỔNG BÁO CÁO HỆ THỐNG
                    </span>
                  </div>
                  <div className="font-sans font-extrabold text-3xl text-slate-900 leading-none my-2">
                    {fmtNum(reportsCountVal)}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    Hồ sơ luân chuyển phát sinh trong kỳ
                  </div>
                </div>

                {/* Sub-card 3.2 */}
                <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-start">
                  <div className="flex items-start gap-1.5 mb-2.5">
                    <div className="p-1 rounded bg-emerald-50 text-[#1a8649] flex-shrink-0 mt-0.5">
                      <Database size={14} />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                      PHÒNG BÀN LIÊN KẾT
                    </span>
                  </div>
                  <div className="font-sans font-extrabold text-3xl text-slate-900 leading-none my-2">
                    {departmentsCountVal}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    Đang hoạt động trên luồng báo cáo
                  </div>
                </div>

                {/* Sub-card 3.3 */}
                <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-start">
                  <div className="flex items-start gap-1.5 mb-2.5">
                    <div className="p-1 rounded bg-emerald-50 text-[#1a8649] flex-shrink-0 mt-0.5">
                      <Users size={14} />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight leading-snug">
                      TÀI KHOẢN HOẠT ĐỘNG
                    </span>
                  </div>
                  <div className="font-sans font-extrabold text-3xl text-slate-900 leading-none my-2">
                    {usersCountVal}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    Đang trực tuyến và quản trị dữ liệu
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 2: WORKER TABLE + PRODUCTION ═══ */}
          <div className="flex flex-col gap-6">
            {/* Workforce Table */}
            <WorkforceDetailTable date={selectedDate} />

            {/* Production Pivot Section — replaces static hardcoded table */}
            <ProductionPivotSection
              targetData={pivotTargetData}
              selectedDate={selectedDate}
            />
          </div>

          {/* ═══ ROW 2.5: SYSTEM CHARTS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-bold text-sm text-slate-900 tracking-tight">
                  Số báo cáo theo phòng ban
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                  Thống kê dữ liệu
                </span>
              </div>
              <div className="p-6">
                <div style={{ height: 250 }}>
                  <Column {...barConfig} />
                </div>
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-wrap gap-2">
                <span className="font-bold text-sm text-slate-900 tracking-tight">
                  Xu hướng báo cáo theo ngày
                </span>
                <select
                  className="border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold outline-none cursor-pointer hover:border-slate-300 focus:border-[#1a8649] transition-all"
                  value={trendRange}
                  onChange={(e) =>
                    setTrendRange(
                      e.target.value as "7days" | "30days" | "month",
                    )
                  }
                >
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                  <option value="month">
                    Tất cả ngày trong tháng ({dayjs(selectedDate).format("MM/YYYY")})
                  </option>
                </select>
              </div>
              <div className="p-6">
                <div style={{ height: 250 }}>
                  <Line {...lineConfig} />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 2.8: RECENT REPORTS TABLE ═══ */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Danh sách báo cáo mới cập nhật gần đây
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                Tài liệu
              </span>
            </div>
            <div className="overflow-x-auto px-6 pb-6 pt-3">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="p-3.5 px-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Tên báo cáo
                    </th>
                    <th className="p-3.5 px-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Phòng ban
                    </th>
                    <th className="p-3.5 px-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Ngày tạo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredRecentReports().length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-6 text-xs text-slate-400 font-medium"
                      >
                        Chưa có báo cáo mới nào
                      </td>
                    </tr>
                  ) : (
                    getFilteredRecentReports().map((row, idx) => (
                      <tr
                        key={row.key || idx}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-all"
                      >
                        <td className="p-4 px-3 text-xs text-slate-900 font-semibold">
                          {row.name}
                        </td>
                        <td className="p-4 px-3 text-xs text-slate-600">
                          {row.department}
                        </td>
                        <td className="p-4 px-3 text-xs text-slate-500">
                          {row.date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ ROW 3: BÁO CÁO NỘI BỘ + TKV ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InternalReportsSection
              selectedDate={selectedDate}
              realDepts={realDepts}
              onPreview={(code, readOnly) => {
                setUniverReadOnly(readOnly);
                handlePreviewTkvReport(code);
              }}
              onTrinhDuyet={handleTrinhDuyet}
            />

            <TkvReportsSection
              selectedDate={selectedDate}
              realDepts={realDepts}
              onPreview={(code, readOnly) => {
                setUniverReadOnly(readOnly);
                handlePreviewTkvReport(code);
              }}
              onTrinhDuyet={handleTrinhDuyet}
            />
          </div>

          {/* ═══ BOTTOM ACTION BUTTONS ═══ */}
          <div className="flex justify-center gap-3 my-4 pt-4 border-t border-slate-100">
            <button
              className="bg-white text-slate-700 border border-slate-200 rounded-lg py-2.5 px-5 font-medium text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-slate-50 hover:text-slate-950 hover:border-slate-400"
              onClick={() => setShowSetupModal(true)}
            >
              <Settings size={16} /> Cấu hình Server kết nối
            </button>
            <button
              className="bg-[#1a8649] text-white border-0 rounded-lg py-2.5 px-5 font-semibold text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-[#15703d] hover:-translate-y-0.5 shadow-md shadow-teal-900/15 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Đang đồng bộ hệ thống...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Đồng bộ toàn bộ dữ liệu
                </>
              )}
            </button>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="flex justify-between text-xs text-slate-400 border-t border-slate-200 pt-4 pb-6">
            <span>Đồng bộ lần cuối: {dayStr} 10:30</span>
            <span>Nguồn: API Tập đoàn Vinacomin TKV</span>
            <span>Phiên bản quản lý: v2.2.0</span>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      {planModalMode && (
        <PlanModal
          mode={planModalMode}
          onClose={() => setPlanModalMode(null)}
          onAddBatch={handleAddBatch}
        />
      )}
      {showPlanModal && (
        <PlanModal
          onClose={() => setShowPlanModal(false)}
          onAddBatch={handleAddBatch}
        />
      )}
      {showSetupModal && (
        <SetupModal onClose={() => setShowSetupModal(false)} />
      )}
      {showBatchSyncModal && (
        <BatchSyncModal
          onClose={() => setShowBatchSyncModal(false)}
          selectedBatches={[{ name: "Kế hoạch sản xuất Q1" }]}
        />
      )}
      {showUniverPreviewModal && tkvPreviewWorkbookData && (
        <UniverPreviewModal
          isOpen={showUniverPreviewModal}
          onClose={() => setShowUniverPreviewModal(false)}
          data={tkvPreviewWorkbookData}
          readOnly={univerReadOnly}
          title={
            tkvReportType === "san-luong"
              ? "Báo cáo sản lượng (Mẫu TKV)"
              : "Báo cáo lao động & nhân sự (Mẫu TKV)"
          }
        />
      )}
    </>
  );
}
