import axiosClient from "../../../services/axiosClient";
import type {
  WorkforceRow,
  WorkforceCaRow,
  WorkforceApiResponse,
} from "../types/workforce";

export const transformWorkforceApiToTree = (
  apiData: WorkforceApiResponse[],
): WorkforceRow[] => {
  if (!Array.isArray(apiData) || apiData.length === 0) {
    return [];
  }

  // 1. Group by maPban / tenPban
  const deptMap = new Map<
    string,
    { tenPban: string; tenNhomPban: string; shifts: WorkforceCaRow[] }
  >();

  for (const item of apiData) {
    const deptKey = item.maPban || item.tenPban;
    if (!deptKey) continue;

    if (!deptMap.has(deptKey)) {
      deptMap.set(deptKey, {
        tenPban: item.tenPban || deptKey,
        tenNhomPban: item.tenNhomPban || "KHỐI TRỰC TIẾP",
        shifts: [],
      });
    }

    const diLamTong = item.tongDiLam ?? 0;
    const vangTong = item.tongVangMat ?? 0;
    const tongNhanLuc =
      item.tongNhanLuc && item.tongNhanLuc > 0
        ? item.tongNhanLuc
        : diLamTong + vangTong;

    const shiftRow: WorkforceCaRow = {
      shiftName: item.tenCa || (item.maCa ? `Ca ${item.maCa}` : "Ca 1"),
      tongNhanLuc,
      diLamTong,
      diLamThoLo: item.thoLoDiLam ?? 0,
      diLamCoDien: item.coDien ?? 0,
      diLamQlpv: item.qlyPhongVu ?? 0,
      vangTong,
      vangO: item.om ?? 0,
      vangP: item.phep ?? 0,
      vangTt: item.ttuc ?? 0,
      vangH: item.h2 ?? 0,
      vangV: item.vang ?? 0,
      tLoVang: item.thoLoVangTrongNgay ?? 0,
    };

    deptMap.get(deptKey)!.shifts.push(shiftRow);
  }

  // 2. Group departments by tenNhomPban
  const groupMap = new Map<string, WorkforceRow[]>();

  for (const [deptKey, deptData] of deptMap.entries()) {
    const groupName = deptData.tenNhomPban || "KHỐI TRỰC TIẾP";
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
    }

    const deptRow: WorkforceRow = {
      id: deptKey,
      ten: deptData.tenPban,
      level: 2,
      shifts: deptData.shifts,
    };

    groupMap.get(groupName)!.push(deptRow);
  }

  // 3. Create group level rows
  const groupRows: WorkforceRow[] = [];
  let index = 1;
  for (const [groupName, deptRows] of groupMap.entries()) {
    groupRows.push({
      id: `group_${index}`,
      ten: groupName,
      level: 1,
      children: deptRows,
    });
    index++;
  }

  // 4. Wrap inside TOÀN CÔNG TY total row
  const rootRow: WorkforceRow = {
    id: "total",
    ten: "TOÀN CÔNG TY",
    level: 0,
    isTotal: true,
    children: groupRows,
  };

  return [rootRow];
};

export const workforceApi = {
  getWorkforceTree: async (
    date?: string,
    _departmentId?: string,
  ): Promise<WorkforceRow[]> => {
    try {
      const res = await axiosClient.get<WorkforceApiResponse[]>(
        "/dashboard/work-force",
        {
          params: { date },
        },
      );
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return transformWorkforceApiToTree(res.data);
      }
      return [];
    } catch {
      return [];
    }
  },
};
