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
import { whBatchApi } from "../api/whBatchApi";
import type { WhBatchDashboardResponse } from "../types/whBatch";
import { ProductionPivotSection } from "../components/PivotTable/ProductionPivotSection";
import WorkforceDetailTable from "../components/WorkforceTable/WorkforceDetailTable";
import { targetReportApi } from "../api/targetReportApi";
import type { DepartmentTargetResponse } from "../types/targetReport";
import { employeeApi } from "../../employee/api/employeeApi";
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

  const [syncing, setSyncing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);


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
  const [sectionADeptId, setSectionADeptId] = useState<string>("all");
  const [tkvReports, setTkvReports] = useState<WhBatchDashboardResponse[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
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

  const fetchDashboardReports = async () => {
    try {
      setLoadingReports(true);
      const parsedDate = dayjs(selectedDate);
      const year = parsedDate.year();
      const month = parsedDate.month() + 1;
      const day = parsedDate.date();

      // Fetch danh sách WareBatch từ BE (GET /wh-batch/dashboard)
      const resTkv = await whBatchApi.getDashboard({
        departmentId: sectionADeptId === "all" ? undefined : sectionADeptId,
        reportType: "Noi_Bo",
        reportYear: year,
        reportMonth: month,
        reportDay: day,
      });

      setTkvReports(resTkv);
    } catch (err) {
      console.error("Failed to load dashboard reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchDashboardReports().then(() =>
      console.log("Fetched dashboard reports:", { tkv: tkvReports }),
    );
  }, [sectionADeptId, selectedDate]);

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
    const base = [
      { department: "Phòng Kế hoạch - Vật tư", reports: 40 },
      { department: "PX Than Nguyên Khai", reports: 30 },
      { department: "PX Than Sạch", reports: 50 },
      { department: "PX Cơ điện", reports: 25 },
      { department: "Phòng Kế toán", reports: 15 },
      { department: "Phòng Nhân sự", reports: 20 },
    ];
    const scaled = base.map((item, idx) => ({
      ...item,
      reports: Math.round(
        item.reports * (0.8 + seedRandom(seed + idx) * 0.4) * periodMultiplier,
      ),
    }));
    if (deptFilter === "Tất cả") return scaled;
    return scaled.filter((item) => item.department === deptFilter);
  };

  const getFilteredLineData = () => {
    return [
      {
        date: "25/11",
        reports: Math.round(
          5 * periodMultiplier * (0.8 + seedRandom(seed) * 0.4),
        ),
      },
      {
        date: "26/11",
        reports: Math.round(
          8 * periodMultiplier * (0.8 + seedRandom(seed + 1) * 0.4),
        ),
      },
      {
        date: "27/11",
        reports: Math.round(
          6 * periodMultiplier * (0.8 + seedRandom(seed + 2) * 0.4),
        ),
      },
      {
        date: "28/11",
        reports: Math.round(
          10 * periodMultiplier * (0.8 + seedRandom(seed + 3) * 0.4),
        ),
      },
      {
        date: "29/11",
        reports: Math.round(
          7 * periodMultiplier * (0.8 + seedRandom(seed + 4) * 0.4),
        ),
      },
      {
        date: "30/11",
        reports: Math.round(
          12 * periodMultiplier * (0.8 + seedRandom(seed + 5) * 0.4),
        ),
      },
    ];
  };

  const getFilteredRecentReports = () => {
    const base = [
      {
        key: "1",
        name: "Báo cáo bán hàng tháng 5",
        type: "Word",
        department: "Phòng Kế hoạch - Vật tư",
        date: "2026-05-30",
      },
      {
        key: "2",
        name: "Báo cáo tồn kho vật tư",
        type: "Excel",
        department: "Phòng Kế hoạch - Vật tư",
        date: "2026-05-29",
      },
      {
        key: "3",
        name: "Báo cáo tài chính Q1",
        type: "PDF",
        department: "Phòng Kế toán",
        date: "2026-05-28",
      },
      {
        key: "4",
        name: "Báo cáo lao động tiền lương",
        type: "Excel",
        department: "Phòng Nhân sự",
        date: "2026-05-27",
      },
      {
        key: "5",
        name: "Nhật ký khai thác ca 1",
        type: "Excel",
        department: "PX Than Nguyên Khai",
        date: "2026-05-26",
      },
      {
        key: "6",
        name: "Nhật ký khai thác ca 2",
        type: "Excel",
        department: "PX Than Sạch",
        date: "2026-05-25",
      },
    ];
    if (deptFilter === "Tất cả") return base;
    return base.filter((item) => item.department === deptFilter);
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
    setTkvReports((prev) =>
      prev.map((r) =>
        r.code === reportId ? { ...r, wareBatchStatus: "PENDING" } : r,
      ),
    );
  };

  return (
    <>
      <div className="bg-[#f8faf9] min-h-screen   mx-auto py-4 px-6 md:p-12">
        <div className="w-full flex flex-col gap-5">
          {/* ═══ HEADER ═══ */}
          <div className="bg-white rounded-2xl p-5 md:p-6 flex justify-between items-center shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] border border-slate-100 relative overflow-hidden before:content-[''] before:absolute ">
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

            <div className="flex gap-3 items-center flex-wrap">
              {/* Date Selector */}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
                <Calendar size={14} className="text-slate-500" />
                <input
                  type="date"
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Period selector */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mr-2">
                {["Ngày", "Tuần", "Tháng"].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer text-xs font-semibold transition-all border-0 ${
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
                className="bg-white text-slate-700 border border-slate-100 rounded-lg py-2.5 px-5 font-medium text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-slate-50 hover:text-slate-950 hover:border-slate-400"
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
              <button
                className="bg-[#1a8649] text-white border-0 rounded-lg py-2.5 px-5 font-semibold text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-[#15703d] hover:-translate-y-0.5 shadow-md shadow-teal-900/15"
                onClick={() => setShowPlanModal(true)}
              >
                <PlusCircle size={16} /> Lập kế hoạch
              </button>
            </div>
          </div>

          {/* ═══ ROW 1: KPI CARDS ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1: Coal Production */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Tổng than NK lũy kế (Tấn)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="font-sans font-bold text-3xl text-slate-900 leading-none">
                    {fmtNum(coalLuyKeVal)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Hôm nay:{" "}
                    <b className="text-[#1a8649] font-semibold">
                      {fmtNum(coalTodayVal)} tấn
                    </b>
                  </div>
                </div>
                <div className="flex-shrink-0 text-center">
                  <Sparkline data={[900, 1050, 1100, 980, 1150, 1080, 1200]} />
                  <div className="text-[10px] text-slate-400 mt-1">
                    7 ngày qua
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Mục tiêu: {fmtNum(coalKhVal)} Tấn</span>
                    <span className="font-bold text-[#1a8649]">
                      {coalPctVal}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(coalPctVal, 100)}%`,
                        backgroundColor: "#1a8649",
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                    Than NK: {fmtNum(coalTodayVal)}
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 inline-flex items-center gap-1">
                    Than Sạch: {fmtNum(cleanCoalTodayVal)}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 2: Excavation */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Mét đào lò mới lũy kế (Mét)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center">
                  <Layers size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="font-sans font-bold text-3xl text-slate-900 leading-none">
                    {fmtNum(excLuyKeVal)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Hôm nay:{" "}
                    <b className="text-[#1a8649] font-semibold">
                      {fmtNum(excTodayVal)} m
                    </b>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Kế hoạch: {fmtNum(excKhVal)} m</span>
                    <span className="font-bold text-[#1a8649]">
                      {excPctVal}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(excPctVal, 100)}%`,
                        backgroundColor: "#1a8649",
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                    XDCB: {fmtNum(xdcbVal)} m
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 inline-flex items-center gap-1">
                    CBSX: {fmtNum(cbsxVal)} m
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                    Mò xén: {fmtNum(moxenVal)} m
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 3: Workforce */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Nhân sự & Lao động
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="font-sans font-bold text-3xl text-slate-900 leading-none">
                    {fmtNum(workforceTotal)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Đi làm thực tế:{" "}
                    <b className="text-[#1a8649] font-semibold">
                      {workforceDiLam} người
                    </b>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 inline-flex items-center gap-1">
                    Thợ lò: {workforceThoLo}
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 inline-flex items-center gap-1">
                    Điện cơ: {workforceDienCo}
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                    BCH: {workforceBch}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-600 inline-flex items-center gap-1">
                    Vắng: {workforceVang}
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                    Nghỉ: {workforceNghi}
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                    Lũy kế nghỉ: {workforceNghiLuyKe}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 1.5: SYSTEM OVERVIEW KPI CARDS (FROM OLD DASHBOARD) ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 4: Total Reports */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Tổng báo cáo hệ thống
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center">
                  <FileText size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="font-sans font-bold text-3xl text-slate-900 leading-none">
                    {fmtNum(reportsCountVal)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Hồ sơ luân chuyển phát sinh trong kỳ
                  </div>
                </div>
              </div>
            </div>

            {/* KPI 5: Departments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Phòng ban liên kết
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center">
                  <Database size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="font-sans font-bold text-3xl text-slate-900 leading-none">
                    {departmentsCountVal}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Đang hoạt động trên luồng báo cáo
                  </div>
                </div>
              </div>
            </div>

            {/* KPI 6: Users */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Tài khoản hoạt động
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1a8649] flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="font-sans font-bold text-3xl text-slate-900 leading-none">
                    {usersCountVal}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Đang trực tuyến và quản trị dữ liệu
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 2: WORKER TABLE + PRODUCTION ═══ */}
          <div className="flex flex-col gap-6">
            {/* Workforce Table */}
            <WorkforceDetailTable
              date={selectedDate}
              departmentId={
                sectionADeptId !== "all" ? sectionADeptId : undefined
              }
            />

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
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-bold text-sm text-slate-900 tracking-tight">
                  Xu hướng báo cáo theo ngày
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 inline-flex items-center gap-1">
                  Xu hướng tuần
                </span>
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
                      Loại file
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
                  {getFilteredRecentReports().map((row, idx) => {
                    const badgeClass =
                      row.type === "Word"
                        ? "bg-blue-50 text-blue-600"
                        : row.type === "Excel"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600";
                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-all"
                      >
                        <td className="p-4 px-3 text-xs text-slate-900 font-semibold">
                          {row.name}
                        </td>
                        <td className="p-4 px-3 text-xs">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${badgeClass}`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="p-4 px-3 text-xs text-slate-600">
                          {row.department}
                        </td>
                        <td className="p-4 px-3 text-xs text-slate-500">
                          {row.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ ROW 3: BÁO CÁO NỘI BỘ + TKV ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A: Internal Reports */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
              <div className="p-4 px-5 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
                <span className="font-bold text-sm tracking-wide text-slate-900 uppercase">
                  A. BÁO CÁO NỘI BỘ — TỪ CÁC PHÒNG BAN
                </span>
              </div>
              <div className="p-6 flex flex-col gap-5">
                {/* Selector */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 w-24">
                    Phòng ban:
                  </label>
                  <select
                    className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer flex-1 transition-all hover:border-slate-300 focus:border-[#1a8649] focus:bg-white"
                    value={sectionADeptId}
                    onChange={(e) => setSectionADeptId(e.target.value)}
                  >
                    <option value="all">Tất cả phòng ban</option>
                    {realDepts.map((dept) => (
                      <option key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cards List */}
                <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-1">
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Đang tải danh sách báo cáo...
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                      <div className="font-semibold text-slate-700">
                        Chưa có dữ liệu báo cáo nội bộ
                      </div>
                      <div>
                        Khối này đang để ở trạng thái khung, chưa cần đổ dữ liệu
                        thật.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* B: TKV Reports */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
              <div className="p-4 px-5 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
                <span className="font-bold text-sm tracking-wide text-slate-900 uppercase">
                  B. BÁO CÁO TKV — TỔNG HỢP GỬI TẬP ĐOÀN
                </span>
              </div>
              <div className="p-6 flex flex-col gap-5">
                {/* Selector */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 w-24">
                    Phòng ban:
                  </label>
                  <select
                    className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer flex-1 transition-all hover:border-slate-300 focus:border-[#1a8649] focus:bg-white"
                    value={sectionADeptId}
                    onChange={(e) => setSectionADeptId(e.target.value)}
                  >
                    <option value="all">Tất cả phòng ban</option>
                    {realDepts.map((dept) => (
                      <option key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Report Content Panels */}
                <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-1">
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Đang tải danh sách báo cáo...
                    </div>
                  ) : tkvReports.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      Không có báo cáo TKV nào cho ngày {dayStr}
                    </div>
                  ) : (
                    tkvReports.map((report) => {
                      let statusBg =
                        "bg-amber-50 text-amber-700 border-amber-100";
                      let statusText = "Chờ duyệt";
                      if (report.wareBatchStatus === "SUCCESS") {
                        statusBg =
                          "bg-emerald-50 text-emerald-700 border-emerald-100";
                        statusText = "Thành công";
                      } else if (report.wareBatchStatus === "FAILURE") {
                        statusBg = "bg-rose-50 text-rose-700 border-rose-100";
                        statusText = "Lỗi đồng bộ";
                      }

                      const formattedTime = dayjs(report.updatedAt).format(
                        "HH:mm - DD/MM/YYYY",
                      );

                      return (
                        <div
                          key={report.id}
                          className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.02)] hover:shadow-md transition-all duration-300 p-5 flex flex-col gap-4 group"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex flex-col gap-1 flex-1">
                              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                                {report.code} | {report.tableCode}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1a8649] transition-colors leading-snug">
                                {report.name}
                              </h4>
                              {report.description && (
                                <p className="text-xs text-slate-400 italic mt-0.5  px-2 py-1">
                                  {report.description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusBg}`}
                            >
                              {statusText}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-col gap-2.5 bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">
                                Loại báo cáo:
                              </span>
                              <span className="font-semibold text-slate-800">
                                {report.reportName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">
                                Người cập nhật:
                              </span>
                              <span className="font-medium text-slate-700">
                                {report.employeeName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">
                                Thời gian cập nhật:
                              </span>
                              <span className="text-slate-700">
                                {formattedTime}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => {
                                setUniverReadOnly(true);
                                handlePreviewTkvReport(report.code);
                              }}
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-2 rounded-lg border border-slate-200 cursor-pointer transition-all active:scale-[0.98] text-center"
                            >
                              Xem
                            </button>
                            <button
                              onClick={() => {
                                setUniverReadOnly(false);
                                handlePreviewTkvReport(report.code);
                              }}
                              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs py-2 px-2 rounded-lg border border-blue-200 cursor-pointer transition-all active:scale-[0.98] text-center"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleTrinhDuyet(report.code)}
                              className="flex-1 bg-[#1a8649] hover:bg-[#15703d] text-white font-semibold text-xs py-2 px-2 rounded-lg border-0 cursor-pointer transition-all active:scale-[0.98] text-center shadow-sm"
                            >
                              Trình duyệt
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
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
