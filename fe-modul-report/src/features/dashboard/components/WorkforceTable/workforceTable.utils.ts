import type { WorkforceRow, WorkforceCaRow } from "../../types/workforce";

export interface FlatWorkforceRow extends Omit<
  WorkforceRow,
  "children" | "shifts"
> {
  isShift?: boolean;
  parentId?: string;
  tongNhanLuc: number;
  diLamTong: number;
  diLamThoLo: number;
  diLamCoDien: number;
  diLamQlpv: number;
  vangTong: number;
  vangO: number;
  vangP: number;
  vangTt: number;
  vangH: number;
  vangV: number;
  tLoVang: number;
}

export function sumRowNumbers(
  row: WorkforceRow,
): Omit<WorkforceCaRow, "shiftName"> {
  const result = {
    tongNhanLuc: 0,
    diLamTong: 0,
    diLamThoLo: 0,
    diLamCoDien: 0,
    diLamQlpv: 0,
    vangTong: 0,
    vangO: 0,
    vangP: 0,
    vangTt: 0,
    vangH: 0,
    vangV: 0,
    tLoVang: 0,
  };

  // 1. Sum shifts of this row
  if (row.shifts && row.shifts.length > 0) {
    for (const s of row.shifts) {
      result.diLamTong += s.diLamTong || 0;
      result.diLamThoLo += s.diLamThoLo || 0;
      result.diLamCoDien += s.diLamCoDien || 0;
      result.diLamQlpv += s.diLamQlpv || 0;
      result.vangTong += s.vangTong || 0;
      result.vangO += s.vangO || 0;
      result.vangP += s.vangP || 0;
      result.vangTt += s.vangTt || 0;
      result.vangH += s.vangH || 0;
      result.vangV += s.vangV || 0;
      result.tLoVang += s.tLoVang || 0;
    }
  }

  // 2. Sum children recursively
  if (row.children && row.children.length > 0) {
    for (const child of row.children) {
      const childTotals = sumRowNumbers(child);
      result.diLamTong += childTotals.diLamTong;
      result.diLamThoLo += childTotals.diLamThoLo;
      result.diLamCoDien += childTotals.diLamCoDien;
      result.diLamQlpv += childTotals.diLamQlpv;
      result.vangTong += childTotals.vangTong;
      result.vangO += childTotals.vangO;
      result.vangP += childTotals.vangP;
      result.vangTt += childTotals.vangTt;
      result.vangH += childTotals.vangH;
      result.vangV += childTotals.vangV;
      result.tLoVang += childTotals.tLoVang;
    }
  }

  result.tongNhanLuc =
    row.tongNhanLuc && row.tongNhanLuc > 0
      ? row.tongNhanLuc
      : result.diLamTong + result.vangTong;

  return result;
}

export function flattenWorkforceRows(
  rows: WorkforceRow[],
  collapsedIds: Set<string>,
  parentId?: string,
): FlatWorkforceRow[] {
  const result: FlatWorkforceRow[] = [];

  for (const row of rows) {
    const totals = sumRowNumbers(row);
    const flatRow: FlatWorkforceRow = {
      id: row.id,
      stt: row.stt,
      ten: row.ten,
      level: row.level,
      isTotal: row.isTotal,
      highlight: row.highlight,
      parentId,
      ...totals,
    };

    result.push(flatRow);

    const isCollapsed = collapsedIds.has(row.id);
    if (!isCollapsed) {
      // 1. Add virtual shift rows immediately under the parent row
      if (row.shifts && row.shifts.length > 0) {
        for (const shift of row.shifts) {
          const shiftTongNhanLuc =
            shift.tongNhanLuc && shift.tongNhanLuc > 0
              ? shift.tongNhanLuc
              : (shift.diLamTong || 0) + (shift.vangTong || 0);
          result.push({
            id: `${row.id}_${shift.shiftName}`,
            ten: shift.shiftName,
            level: row.level + 1,
            isShift: true,
            parentId: row.id,
            tongNhanLuc: shiftTongNhanLuc,
            diLamTong: shift.diLamTong,
            diLamThoLo: shift.diLamThoLo,
            diLamCoDien: shift.diLamCoDien,
            diLamQlpv: shift.diLamQlpv,
            vangTong: shift.vangTong,
            vangO: shift.vangO,
            vangP: shift.vangP,
            vangTt: shift.vangTt,
            vangH: shift.vangH,
            vangV: shift.vangV,
            tLoVang: shift.tLoVang,
          });
        }
      }

      // 2. Add children recursively
      if (row.children && row.children.length > 0) {
        const flatChildren = flattenWorkforceRows(
          row.children,
          collapsedIds,
          row.id,
        );
        result.push(...flatChildren);
      }
    }
  }

  return result;
}

export function fmtWf(n?: number): string {
  if (n === undefined || n === null || n === 0) {
    return "-";
  }
  return n.toLocaleString("vi-VN");
}
