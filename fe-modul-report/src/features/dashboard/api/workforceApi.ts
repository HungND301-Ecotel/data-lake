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

  // 1. Group by departmentCode / departmentName
  const deptMap = new Map<
    string,
    { tenPban: string; tenNhomPban: string; shifts: WorkforceCaRow[] }
  >();

  for (const item of apiData) {
    const deptKey = item.departmentCode || item.departmentName;
    if (!deptKey) continue;

    if (!deptMap.has(deptKey)) {
      deptMap.set(deptKey, {
        tenPban: item.departmentName || deptKey,
        tenNhomPban: item.departmentGroupName || "KHỐI TRỰC TIẾP",
        shifts: [],
      });
    }

    const diLamTong = item.totalWorking ?? 0;
    const vangTong = item.totalAbsent ?? 0;
    const tongNhanLuc =
      item.totalHeadcount && item.totalHeadcount > 0
        ? item.totalHeadcount
        : diLamTong + vangTong;

    const shiftRow: WorkforceCaRow = {
      shiftName: item.shiftName || (item.shiftCode ? `Ca ${item.shiftCode}` : "Ca 1"),
      tongNhanLuc,
      diLamTong,
      diLamThoLo: item.undergroundWorkers ?? 0,
      diLamCoDien: item.electricalAndOtherWorkers ?? 0,
      diLamQlpv: item.managementAndSupport ?? 0,
      vangTong,
      vangO: item.sickLeave ?? 0,
      vangP: item.annualLeave ?? 0,
      vangTt: item.maternityLeave ?? 0,
      vangH: item.meetingAndTraining ?? 0,
      tuTuc: item.maternityLeave ?? 0,
      hoiHop: item.meetingAndTraining ?? 0,
      vangV: item.unauthorizedAbsence ?? 0,
      tLoVang: item.undergroundWorkersAbsent ?? 0,
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
    configId?: string,
  ): Promise<WorkforceRow[]> => {
    try {
      const res = await axiosClient.get<WorkforceApiResponse[]>(
        "/dashboard/work-force",
        {
          params: { date, configId },
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
