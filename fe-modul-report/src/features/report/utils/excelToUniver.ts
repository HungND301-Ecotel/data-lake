import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KeyMapping {
  /** Column index (0-based) in the spreadsheet */
  colIndex: number;
  /** JSON key name, e.g. "dmbtr_01", "stt", "BUKRS" */
  key: string;
}

export interface ExcelParseResult {
  /** UniversJS IWorkbookData — pass directly to univerAPI.createWorkbook() */
  workbookData: any;
  /** Mapping from column index → JSON key, derived from the key row */
  keyMappings: KeyMapping[];
  /** 0-based row index of the key row (the row containing field names) */
  keyRowIndex: number;
  /** 0-based row index where user data starts (= keyRowIndex + 1) */
  dataStartRowIndex: number;
}

// ─── Key detection ───────────────────────────────────────────────────────────

/**
 * Matches typical JSON field names used in report data:
 * - dmbtr_01 … dmbtr_99
 * - stt, matnr, BUKRS, YEAR, PERIOD, dvt, name_matnr, table_name
 */
const KEY_PATTERN =
  /^dmbtr_\d+$|^(stt|matnr|BUKRS|YEAR|PERIOD|dvt|name_matnr|table_name|ma_chi_tieu|chi_tieu|thuc_hien|giai_ngan)$/i;

function isKeyCell(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return KEY_PATTERN.test(value.trim());
}

// ─── Color & Style Helpers for ExcelJS → UniversJS ──────────────────────────

function argbToHex(argb: string | undefined): string | undefined {
  if (!argb || typeof argb !== "string") return undefined;
  let clean = argb.trim();
  if (clean.startsWith("#")) clean = clean.substring(1);
  if (clean.length === 8) {
    // AARRGGBB -> RRGGBB
    clean = clean.substring(2);
  }
  if (clean.length === 6) {
    return "#" + clean.toUpperCase();
  }
  return undefined;
}

function mapBorderStyle(style: string | undefined): number {
  if (!style) return 1;
  switch (style.toLowerCase()) {
    case "thin":
      return 1;
    case "medium":
      return 2;
    case "dashed":
      return 3;
    case "dotted":
      return 4;
    case "thick":
      return 5;
    case "double":
      return 6;
    case "hair":
      return 7;
    case "mediumdashed":
      return 8;
    case "dashdot":
      return 9;
    case "mediumdashdot":
      return 10;
    case "dashdotdot":
      return 11;
    case "mediumdashdotdot":
      return 12;
    case "slanteddashdot":
      return 13;
    default:
      return 1;
  }
}

function parseBorder(borderObj: any) {
  if (!borderObj) return undefined;
  const bd: any = {};

  if (borderObj.top && borderObj.top.style) {
    bd.t = {
      s: mapBorderStyle(borderObj.top.style),
      cl: { rgb: argbToHex(borderObj.top.color?.argb) || "#000000" },
    };
  }
  if (borderObj.bottom && borderObj.bottom.style) {
    bd.b = {
      s: mapBorderStyle(borderObj.bottom.style),
      cl: { rgb: argbToHex(borderObj.bottom.color?.argb) || "#000000" },
    };
  }
  if (borderObj.left && borderObj.left.style) {
    bd.l = {
      s: mapBorderStyle(borderObj.left.style),
      cl: { rgb: argbToHex(borderObj.left.color?.argb) || "#000000" },
    };
  }
  if (borderObj.right && borderObj.right.style) {
    bd.r = {
      s: mapBorderStyle(borderObj.right.style),
      cl: { rgb: argbToHex(borderObj.right.color?.argb) || "#000000" },
    };
  }

  return Object.keys(bd).length > 0 ? bd : undefined;
}

/**
 * Parses full styles, fonts, alignments, colors, borders, row heights, and column widths
 * from ExcelJS workbook into UniversJS sheetData and styles dictionary.
 */
async function parseSheetWithExcelJS(
  arrayBuffer: ArrayBuffer,
  sheetName: string,
  sheetId: string,
): Promise<{ sheetData: any; styles: Record<string, any> }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);

  const ws = wb.getWorksheet(sheetName) || wb.worksheets[0];
  if (!ws) {
    throw new Error("Worksheet not found in ExcelJS parser");
  }

  const cellData: Record<number, Record<number, any>> = {};
  const styles: Record<string, any> = {};
  const styleMap = new Map<string, string>();
  let styleCounter = 1;

  function getStyleId(styleObj: any): string | undefined {
    if (!styleObj || Object.keys(styleObj).length === 0) return undefined;
    const styleKey = JSON.stringify(styleObj);
    if (styleMap.has(styleKey)) {
      return styleMap.get(styleKey);
    }
    const styleId = `s_${styleCounter++}`;
    styleMap.set(styleKey, styleId);
    styles[styleId] = styleObj;
    return styleId;
  }

  let maxRow = ws.rowCount || 1;
  let maxCol = ws.columnCount || 1;

  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const r = rowNumber - 1; // 0-based row index
    if (r > maxRow) maxRow = r;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const c = colNumber - 1; // 0-based col index
      if (c > maxCol) maxCol = c;

      const univCell: any = {};

      // 1. Extract Value & Formula
      let rawVal: any = cell.value;
      let formulaStr: string | undefined = undefined;
      let formulaResult: any = undefined;

      if (rawVal !== null && rawVal !== undefined) {
        if (typeof rawVal === "object") {
          if (rawVal.formula) {
            formulaStr = rawVal.formula;
            formulaResult = rawVal.result;
          } else if (rawVal.sharedFormula) {
            formulaStr = rawVal.sharedFormula;
            formulaResult = rawVal.result;
          }
        }
      }

      if (!formulaStr && cell.formula) {
        formulaStr = cell.formula;
        formulaResult = cell.result;
      }

      if (formulaStr) {
        let cleanFormula = String(formulaStr).trim();
        if (!cleanFormula.startsWith("=")) {
          cleanFormula = "=" + cleanFormula;
        }
        univCell.f = cleanFormula;
        if (formulaResult !== undefined && formulaResult !== null) {
          const res =
            typeof formulaResult === "object" &&
            formulaResult.result !== undefined
              ? formulaResult.result
              : formulaResult;
          if (res !== undefined && res !== null) {
            univCell.v = res;
            univCell.t = typeof res === "number" ? 2 : 1;
          }
        }
        if (!univCell.t) {
          univCell.t = 2; // Default to number for formula cells
        }
      } else if (rawVal !== null && rawVal !== undefined) {
        if (typeof rawVal === "object") {
          // RichText object
          if (Array.isArray(rawVal.richText)) {
            univCell.v = rawVal.richText.map((item: any) => item.text).join("");
            univCell.t = 1;
          }
          // Hyperlink object
          else if (rawVal.text) {
            univCell.v = rawVal.text;
            univCell.t = 1;
          }
          // Date object
          else if (rawVal instanceof Date) {
            univCell.v = rawVal.toLocaleDateString("vi-VN");
            univCell.t = 1;
          }
        } else if (typeof rawVal === "number") {
          univCell.v = rawVal;
          univCell.t = 2;
        } else if (typeof rawVal === "boolean") {
          univCell.v = rawVal;
          univCell.t = 3;
        } else {
          const strVal = String(rawVal);
          if (strVal !== "") {
            univCell.v = strVal;
            univCell.t = 1;
          }
        }
      }

      // 2. Extract Styles
      const styleObj: any = {};

      // Font
      if (cell.font) {
        if (cell.font.name) styleObj.ff = cell.font.name;
        if (cell.font.size) styleObj.fs = cell.font.size;
        if (cell.font.bold) styleObj.bl = 1;
        if (cell.font.italic) styleObj.it = 1;
        if (cell.font.underline) styleObj.ul = { s: 1 };
        if (cell.font.strike) styleObj.st = { s: 1 };
        if (cell.font.color?.argb) {
          const hex = argbToHex(cell.font.color.argb);
          if (hex) styleObj.fc = hex;
        }
      }

      // Background Fill
      if (cell.fill && cell.fill.type === "pattern") {
        const fgColor = (cell.fill as any).fgColor;
        if (fgColor?.argb) {
          const hex = argbToHex(fgColor.argb);
          if (hex) styleObj.bg = hex;
        }
      }

      // Alignment
      if (cell.alignment) {
        if (cell.alignment.horizontal) {
          switch (cell.alignment.horizontal) {
            case "left":
              styleObj.ht = 1;
              break;
            case "center":
              styleObj.ht = 2;
              break;
            case "right":
              styleObj.ht = 3;
              break;
            case "justify":
              styleObj.ht = 4;
              break;
          }
        }
        if (cell.alignment.vertical) {
          switch (cell.alignment.vertical) {
            case "top":
              styleObj.vt = 1;
              break;
            case "middle":
              styleObj.vt = 2;
              break;
            case "bottom":
              styleObj.vt = 3;
              break;
          }
        }
        if (cell.alignment.wrapText) {
          styleObj.tb = 2; // WRAP
        }
      }

      // Border
      if (cell.border) {
        const bd = parseBorder(cell.border);
        if (bd) styleObj.bd = bd;
      }

      const styleId = getStyleId(styleObj);
      if (styleId) {
        univCell.s = styleId;
      }

      if (Object.keys(univCell).length > 0) {
        if (!cellData[r]) cellData[r] = {};
        cellData[r][c] = univCell;
      }
    });
  });

  // 3. Merged Cells
  const mergeData: any[] = [];
  const merges = (ws as any).model?.merges || [];
  for (const rangeStr of merges) {
    if (typeof rangeStr === "string") {
      const range = XLSX.utils.decode_range(rangeStr);
      mergeData.push({
        startRow: range.s.r,
        startColumn: range.s.c,
        endRow: range.e.r,
        endColumn: range.e.c,
      });
    }
  }

  // 4. Column widths
  const columnData: Record<number, { w: number }> = {};
  if (ws.columns) {
    ws.columns.forEach((col, index) => {
      if (col.width) {
        const pxWidth = Math.max(Math.round(col.width * 8), 45);
        columnData[index] = { w: pxWidth };
      }
    });
  }

  // 5. Row heights
  const rowData: Record<number, { h: number }> = {};
  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (row.height) {
      const pxHeight = Math.max(Math.round(row.height * 1.33), 20);
      rowData[rowNumber - 1] = { h: pxHeight };
    }
  });

  const sheetData = {
    id: sheetId,
    name: sheetName,
    cellData,
    mergeData,
    columnData,
    rowData,
    rowCount: Math.max(maxRow + 25, 100),
    columnCount: Math.max(maxCol + 10, 30),
  };

  return { sheetData, styles };
}

// ─── SheetJS fallback for basic cell conversion ─────────────────────────────

function mapCellType(xlsType: string): number {
  switch (xlsType) {
    case "n":
      return 2;
    case "b":
      return 3;
    case "s":
    default:
      return 1;
  }
}

function sheetToUniverSheetJS(
  ws: XLSX.WorkSheet,
  sheetName: string,
  sheetId: string,
): any {
  const ref = ws["!ref"];
  if (!ref) return null;

  const range = XLSX.utils.decode_range(ref);
  const cellData: Record<number, Record<number, any>> = {};

  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell: XLSX.CellObject | undefined = ws[addr];
      if (!cell) continue;

      const univCell: any = {};
      if (cell.f) {
        let cleanF = String(cell.f).trim();
        if (!cleanF.startsWith("=")) cleanF = "=" + cleanF;
        univCell.f = cleanF;
      }
      if (cell.v !== undefined && cell.v !== null && cell.v !== "") {
        univCell.v = cell.v;
        univCell.t = mapCellType(cell.t ?? "s");
      } else if (cell.f && !univCell.v) {
        univCell.t = 2;
      }

      if (Object.keys(univCell).length > 0) {
        if (!cellData[r]) cellData[r] = {};
        cellData[r][c] = univCell;
      }
    }
  }

  const mergeData = (ws["!merges"] ?? []).map((m: XLSX.Range) => ({
    startRow: m.s.r,
    startColumn: m.s.c,
    endRow: m.e.r,
    endColumn: m.e.c,
  }));

  return {
    id: sheetId,
    name: sheetName,
    cellData,
    mergeData,
    rowCount: Math.max(range.e.r + 20, 100),
    columnCount: Math.max(range.e.c + 5, 30),
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Parse an Excel Blob:
 * 1. Convert to ArrayBuffer → read with SheetJS for key detection
 * 2. Parse styles, fonts, alignments, colors, borders, row heights, and column widths with ExcelJS
 * 3. Convert to UniversJS IWorkbookData format
 *
 * @param blob  Blob returned by fileApi.getFile(fileKey) or exportTemplateExcel
 */
export async function parseExcelBlob(blob: Blob): Promise<ExcelParseResult> {
  const arrayBuffer = await blob.arrayBuffer();

  // 1. Read with SheetJS for key row detection
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellFormula: true,
  });

  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];

  if (!ws || !ws["!ref"]) {
    throw new Error("File Excel rỗng hoặc không đọc được sheet đầu tiên.");
  }

  const range = XLSX.utils.decode_range(ws["!ref"]);

  // ── Find key row ──────────────────────────────────────────────────────────
  let keyRowIndex = -1;
  let keyMappings: KeyMapping[] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const candidates: KeyMapping[] = [];

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && isKeyCell(cell.v)) {
        candidates.push({ colIndex: c, key: String(cell.v).trim() });
      }
    }

    if (candidates.length >= 2) {
      keyRowIndex = r;
      keyMappings = candidates;
      break;
    }
  }

  if (keyRowIndex === -1) {
    console.warn(
      "[excelToUniver] Key row not detected by pattern. Using data extraction fallback.",
    );
    keyRowIndex = 0;
  }

  // ── Convert to UniversJS format using ExcelJS (with styles & dimensions) ──
  const sheetId = "sheet-1";
  let sheetData: any;
  let styles: Record<string, any> = {};

  try {
    const excelJsResult = await parseSheetWithExcelJS(
      arrayBuffer.slice(0),
      sheetName,
      sheetId,
    );
    sheetData = excelJsResult.sheetData;
    styles = excelJsResult.styles;
  } catch (err) {
    console.warn(
      "[excelToUniver] ExcelJS style parsing failed, falling back to basic parser:",
      err,
    );
    sheetData = sheetToUniverSheetJS(ws, sheetName, sheetId);
  }

  const workbookData: any = {
    id: "workbook-report",
    locale: "enUS",
    name: sheetName || "Báo cáo",
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: sheetData,
    },
    styles: styles,
    resources: [],
    appVersion: "0.5.0",
  };

  return {
    workbookData,
    keyMappings,
    keyRowIndex,
    dataStartRowIndex: keyRowIndex + 1,
  };
}

// ─── Data extraction helper ───────────────────────────────────────────────────

/**
 * Extract JSON rows from a UniversJS workbook snapshot (IWorkbookData).
 *
 * @param snapshot      Result of univerAPI.getActiveWorkbook().save()
 * @param keyMappings   Column-to-key mapping from parseExcelBlob
 * @param dataStartRow  First data row index (0-based)
 * @returns             Array of JSON objects, one per non-empty data row
 */
export function extractRowsFromSnapshot(
  snapshot: any,
  keyMappings: KeyMapping[],
  dataStartRow: number,
  workbookFacade?: any
): Record<string, any>[] {
  const sheetId = snapshot.sheetOrder?.[0];
  if (!sheetId) return [];

  const sheet = snapshot.sheets?.[sheetId];
  if (!sheet) return [];

  const cellData: Record<number, Record<number, any>> = sheet.cellData ?? {};
  const mergeData: any[] = sheet.mergeData ?? [];

  const rows: Record<string, any>[] = [];

  const rowIndices = Object.keys(cellData)
    .map(Number)
    .filter((r) => r >= dataStartRow)
    .sort((a, b) => a - b);

  for (const rowIndex of rowIndices) {
    const rowData = cellData[rowIndex] ?? {};
    const obj: Record<string, any> = {};
    let hasData = false;

    if (keyMappings.length > 0) {
      for (const km of keyMappings) {
        let value = getCellValueFromSheet(
          cellData,
          mergeData,
          rowIndex,
          km.colIndex,
          workbookFacade
        );
        if (value !== null) {
          hasData = true;
        }
        obj[km.key] = value;
      }
    } else {
      Object.keys(rowData).forEach((colIdxStr) => {
        const cIdx = Number(colIdxStr);
        let value = getCellValueFromSheet(
          cellData,
          mergeData,
          rowIndex,
          cIdx,
          workbookFacade
        );
        if (value !== null) {
          obj[`col_${cIdx}`] = value;
          hasData = true;
        }
      });
    }

    if (hasData) {
      rows.push(obj);
    }
  }

  return rows;
}

// ─── WebBatchSubmitPayload Helper ─────────────────────────────────────────────

export interface WebDataRowDto {
  rowIndex: number;
  values: Record<string, any>;
}

export interface WebBatchSubmitPayload {
  wareTemplateId: number;
  name?: string;
  description?: string;
  reportYear?: number;
  reportMonth?: number;
  reportDay?: number;
  cellData: Record<string, any>;
  rows: WebDataRowDto[];
}

/**
 * Converts a 1-based column number ("1", "2") or column letter ("A", "B", "AA") to 0-based index.
 */
function columnAddressToIndex(colStr: string): number | null {
  const clean = colStr.trim().toUpperCase();
  if (/^\d+$/.test(clean)) {
    const num = Number(clean);
    return num > 0 ? num - 1 : null;
  }
  if (/^[A-Z]+$/.test(clean)) {
    let col = 0;
    for (let i = 0; i < clean.length; i++) {
      col = col * 26 + (clean.charCodeAt(i) - 64);
    }
    return col - 1;
  }
  return null;
}

/**
 * Convert template WareMappingResponse[] configuration into KeyMapping[].
 * Supports 1-based column numbers ("1", "4") or letters ("A", "D") to 0-based colIndex (0, 3).
 */
export function parseKeyMappingsFromWareMappings(
  mappings: any[],
): KeyMapping[] {
  const result: KeyMapping[] = [];

  for (const m of mappings) {
    if (!m.fieldName || !m.cellAddress) continue;

    // Skip CELL mappings (e.g. "3-2", "4-2")
    if (m.fieldType === "CELL" || String(m.cellAddress).includes("-")) {
      continue;
    }

    const colIdx = columnAddressToIndex(String(m.cellAddress));
    if (colIdx !== null && colIdx >= 0) {
      result.push({
        colIndex: colIdx, // 0-based col index
        key: String(m.fieldName).trim(),
      });
    }
  }

  return result;
}

/**
 * Helper to check if an extracted row object is a header label row or title cell row.
 */
function isHeaderRow(
  valuesObj: Record<string, any>,
  templateMappings?: any[],
): boolean {
  // Check stt cell
  const sttVal = String(valuesObj.stt ?? "")
    .trim()
    .toUpperCase();
  if (
    sttVal === "STT" ||
    sttVal === "ST T" ||
    sttVal.startsWith("CÔNG TY") ||
    sttVal.startsWith("NĂM") ||
    sttVal.startsWith("THÁNG") ||
    sttVal.startsWith("KỲ")
  ) {
    return true;
  }

  // Check matnr cell
  const matnrVal = String(valuesObj.matnr ?? "")
    .trim()
    .toLowerCase();
  if (
    matnrVal === "mã chỉ tiêu" ||
    matnrVal === "mã vật tư" ||
    matnrVal === "mã hàng"
  ) {
    return true;
  }

  // Check name_matnr cell
  const nameVal = String(valuesObj.name_matnr ?? "")
    .trim()
    .toLowerCase();
  if (
    nameVal === "chỉ tiêu" ||
    nameVal === "danh mục vật tư" ||
    nameVal === "tên vật tư"
  ) {
    return true;
  }

  // Check if values match fieldTitle or fieldName from templateMappings
  if (templateMappings && templateMappings.length > 0) {
    let matchCount = 0;
    for (const m of templateMappings) {
      if (!m.fieldName) continue;
      const val = String(valuesObj[m.fieldName] ?? "").trim();
      if (!val) continue;
      const title = String(m.fieldTitle ?? "").trim();
      const name = String(m.fieldName ?? "").trim();
      if (
        (title && val.toLowerCase() === title.toLowerCase()) ||
        (name && val.toLowerCase() === name.toLowerCase())
      ) {
        matchCount++;
      }
    }
    if (matchCount >= 2) return true;
  }

  return false;
}

/**
 * Safely extract raw value or rich text stream from a UniversJS cell object.
 */
function getCellValue(cell: any): any {
  if (!cell) return null;
  if (cell.v !== undefined && cell.v !== null && cell.v !== "") {
    return cell.v;
  }
  if (cell.p?.body?.dataStream) {
    const text = String(cell.p.body.dataStream)
      .replace(/[\r\n]+$/, "")
      .trim();
    if (text) return text;
  }
  return null;
}

/**
 * Extract cell value with fallback to merged cell origin (top-left) if part of a merged range.
 * Optionally queries UniversJS workbookFacade for live recalculated formula results.
 */
function getCellValueFromSheet(
  cellDataMap: Record<number, Record<number, any>>,
  mergeData: any[],
  r: number,
  c: number,
  workbookFacade?: any
): any {
  // 1. Try UniversJS Facade API first (for live recalculated formula values)
  if (workbookFacade) {
    try {
      const sheet =
        typeof workbookFacade.getActiveSheet === "function"
          ? workbookFacade.getActiveSheet()
          : workbookFacade;
      if (sheet && typeof sheet.getRange === "function") {
        const range = sheet.getRange(r, c);
        if (range) {
          const val =
            typeof range.getValue === "function" ? range.getValue() : undefined;
          if (val !== undefined && val !== null && val !== "") {
            return val;
          }
        }
      }
    } catch (e) {
      // Fallback to snapshot if facade query fails
    }
  }

  // 2. Snapshot cellDataMap fallback
  const cell = cellDataMap[r]?.[c];
  let val = getCellValue(cell);
  if (val !== null) return val;

  // 3. Merged cell origin fallback
  if (mergeData && mergeData.length > 0) {
    const merge = mergeData.find(
      (m: any) =>
        r >= m.startRow &&
        r <= m.endRow &&
        c >= m.startColumn &&
        c <= m.endColumn
    );
    if (merge) {
      if (workbookFacade) {
        try {
          const sheet =
            typeof workbookFacade.getActiveSheet === "function"
              ? workbookFacade.getActiveSheet()
              : workbookFacade;
          if (sheet && typeof sheet.getRange === "function") {
            const topRange = sheet.getRange(merge.startRow, merge.startColumn);
            if (topRange) {
              const topVal =
                typeof topRange.getValue === "function"
                  ? topRange.getValue()
                  : undefined;
              if (topVal !== undefined && topVal !== null && topVal !== "") {
                return topVal;
              }
            }
          }
        } catch (e) {}
      }
      const topCell = cellDataMap[merge.startRow]?.[merge.startColumn];
      val = getCellValue(topCell);
      if (val !== null) return val;
    }
  }

  return null;
}

/**
 * Extract full WebBatchSubmitPayload (matching Backend POST /wh-batch/web-submit format)
 * dynamically using whatever WareMappingResponse[] configuration and startRow belongs to the current template.
 */
export function extractWebBatchSubmitPayload(
  snapshot: any,
  keyMappings: KeyMapping[],
  dataStartRow: number,
  wareTemplateId: number,
  templateName?: string,
  templateMappings?: any[],
  templateInfo?: { startRow?: number; name?: string },
  fallbackYear?: number,
  fallbackMonth?: number,
  fallbackDay?: number,
  workbookFacade?: any
): WebBatchSubmitPayload {
  const sheetId = snapshot.sheetOrder?.[0];
  const sheet = sheetId ? snapshot.sheets?.[sheetId] : null;
  const cellDataMap: Record<number, Record<number, any>> = sheet?.cellData ??
  {};
  const mergeData: any[] = sheet?.mergeData ?? [];

  const cellData: Record<string, any> = {};
  const rows: WebDataRowDto[] = [];

  let reportYear = fallbackYear;
  let reportMonth = fallbackMonth;
  let reportDay = fallbackDay;

  // Determine active key mappings and cell mappings from templateMappings
  let activeKeyMappings = keyMappings;
  let maxCellRow = -1;

  if (templateMappings && templateMappings.length > 0) {
    const derivedKeys = parseKeyMappingsFromWareMappings(templateMappings);
    if (derivedKeys.length > 0) {
      activeKeyMappings = derivedKeys;
    }

    // 1. Process CELL mappings (e.g. "3-2" -> B3 = BUKRS, "4-2" -> B4 = YEAR, "5-2" -> B5 = PERIOD)
    for (const m of templateMappings) {
      if (!m.fieldName || !m.cellAddress) continue;
      const addrStr = String(m.cellAddress).trim();

      if (m.fieldType === "CELL" || addrStr.includes("-")) {
        const parts = addrStr.split("-");
        if (parts.length === 2) {
          const rIdx = Number(parts[0]) - 1; // 0-based row
          const cIdx = Number(parts[1]) - 1; // 0-based col
          if (rIdx > maxCellRow) maxCellRow = rIdx;

          const rawV = getCellValueFromSheet(
            cellDataMap,
            mergeData,
            rIdx,
            cIdx,
            workbookFacade
          );
          if (rawV !== null) {
            let parsedV: any = rawV;
            const fTypeUpper = String(m.fieldValue || "").toUpperCase();
            const fNameUpper = m.fieldName.toUpperCase();
            if (
              fTypeUpper === "INTEGER" ||
              fTypeUpper === "NUMBER" ||
              fTypeUpper === "DOUBLE" ||
              ["YEAR", "NAM", "PERIOD", "MONTH", "THANG", "QUY", "QUARTER", "DAY", "NGAY"].includes(fNameUpper)
            ) {
              const numV = Number(rawV);
              if (!isNaN(numV)) parsedV = numV;
            }
            cellData[m.fieldName] = parsedV;

            if (["YEAR", "NAM"].includes(fNameUpper)) {
              const y = Number(rawV);
              if (!isNaN(y)) reportYear = y;
            } else if (["PERIOD", "MONTH", "THANG", "QUY", "QUARTER"].includes(fNameUpper)) {
              const strVal = String(rawV).trim().toUpperCase();
              
              // Check the label cell to the left to detect if this field is a Quarter
              let isLabelQuarter = false;
              if (cIdx > 0) {
                const labelCell = cellDataMap[rIdx]?.[cIdx - 1];
                const labelVal = getCellValue(labelCell);
                if (labelVal) {
                  const labelStr = String(labelVal).toLowerCase();
                  if (labelStr.includes("quý") || labelStr.includes("quarter")) {
                    isLabelQuarter = true;
                  }
                }
              }

              const isQuarterValue = isLabelQuarter ||
                                     ["QUY", "QUARTER"].includes(fNameUpper) ||
                                     /^Q[1-4]$/.test(strVal) || 
                                     /QUÝ|QUY/.test(strVal) || 
                                     /^(I|II|III|IV)$/.test(strVal);

              if (isQuarterValue) {
                let qNum = parseInt(strVal.replace(/\D/g, ""), 10);
                if (isNaN(qNum)) {
                  if (strVal.includes("I") && !strVal.includes("V")) {
                    if (strVal.includes("III")) qNum = 3;
                    else if (strVal.includes("II")) qNum = 2;
                    else qNum = 1;
                  } else if (strVal.includes("IV")) {
                    qNum = 4;
                  }
                }
                if (qNum >= 1 && qNum <= 4) {
                  reportMonth = qNum * 3; // Q1 -> month 3, etc.
                }
              } else {
                const monthVal = Number(rawV);
                if (!isNaN(monthVal)) reportMonth = monthVal;
              }
            } else if (["DAY", "NGAY"].includes(fNameUpper)) {
              const d = Number(rawV);
              if (!isNaN(d)) reportDay = d;
            }
          }
        }
      }
    }
  }

  // Determine computedStartRow using templateInfo.startRow first
  let computedStartRow = 0;

  if (
    templateInfo?.startRow !== undefined &&
    templateInfo?.startRow !== null &&
    templateInfo.startRow > 0
  ) {
    // startRow from DB (e.g. 8 or 11) is 1-based, convert to 0-based row index (7 or 10)
    computedStartRow = templateInfo.startRow - 1;
  } else if (dataStartRow > 0) {
    computedStartRow = dataStartRow;
  } else if (maxCellRow >= 0) {
    computedStartRow = maxCellRow + 1;
  }

  // Fallback scan for BUKRS / YEAR / PERIOD / DAY / QUARTER if not extracted by CELL mappings
  if (!cellData["BUKRS"] || !cellData["YEAR"] || !cellData["PERIOD"] || !cellData["DAY"]) {
    for (let r = 0; r < computedStartRow; r++) {
      const rowObj = cellDataMap[r];
      if (!rowObj) continue;

      Object.keys(rowObj).forEach((cStr) => {
        const c = Number(cStr);
        const cell = rowObj[c];
        if (!cell) return;
        const valV = getCellValue(cell);
        if (valV === null) return;

        // Clean cell text by trimming and removing trailing colon
        const valStr = String(valV).trim().replace(/:$/, "").trim();
        const valLower = valStr.toLowerCase();
        const valUpper = valStr.toUpperCase();

        if (
          !cellData["BUKRS"] &&
          (valUpper === "BUKRS" || valLower === "mã công ty" || valLower === "ma cong ty")
        ) {
          const nextCell = rowObj[c + 1] || cellDataMap[r + 1]?.[c];
          const nextVal = getCellValue(nextCell);
          if (nextVal !== null) {
            cellData["BUKRS"] = String(nextVal).trim();
          }
        } else if (
          !cellData["YEAR"] &&
          (valUpper === "YEAR" || valLower === "năm" || valLower === "nam")
        ) {
          const nextCell = rowObj[c + 1] || cellDataMap[r + 1]?.[c];
          const nextVal = getCellValue(nextCell);
          if (nextVal !== null) {
            const y = Number(nextVal);
            if (!isNaN(y)) {
              cellData["YEAR"] = y;
              reportYear = y;
            }
          }
        } else if (
          !cellData["PERIOD"] &&
          (valUpper === "PERIOD" ||
            valUpper === "MONTH" ||
            valLower === "tháng" ||
            valLower === "thang" ||
            valLower === "kỳ" ||
            valLower === "ky")
        ) {
          const nextCell = rowObj[c + 1] || cellDataMap[r + 1]?.[c];
          const nextVal = getCellValue(nextCell);
          if (nextVal !== null) {
            const m = Number(nextVal);
            if (!isNaN(m)) {
              cellData["PERIOD"] = m;
              reportMonth = m;
            }
          }
        } else if (
          !cellData["DAY"] &&
          (valUpper === "DAY" || valLower === "ngày" || valLower === "ngay")
        ) {
          const nextCell = rowObj[c + 1] || cellDataMap[r + 1]?.[c];
          const nextVal = getCellValue(nextCell);
          if (nextVal !== null) {
            const d = Number(nextVal);
            if (!isNaN(d)) {
              cellData["DAY"] = d;
              reportDay = d;
            }
          }
        } else if (
          !cellData["QUARTER"] &&
          (valUpper === "QUARTER" || valLower === "quý" || valLower === "quy")
        ) {
          const nextCell = rowObj[c + 1] || cellDataMap[r + 1]?.[c];
          const nextVal = getCellValue(nextCell);
          if (nextVal !== null) {
            const qStr = String(nextVal).trim().toUpperCase();
            cellData["QUARTER"] = qStr;
            let qNum = parseInt(qStr.replace(/\D/g, ""), 10);
            if (isNaN(qNum)) {
              if (qStr.includes("I") && !qStr.includes("V")) {
                if (qStr.includes("III")) qNum = 3;
                else if (qStr.includes("II")) qNum = 2;
                else qNum = 1;
              } else if (qStr.includes("IV")) {
                qNum = 4;
              }
            }
            if (qNum >= 1 && qNum <= 4) {
              reportMonth = qNum * 3; // Q1 -> month 3, Q2 -> month 6, Q3 -> month 9, Q4 -> month 12
            }
          }
        }
      });
    }
  }

  // 2. Extract table data rows (rows >= computedStartRow)
  const rowIndices = Object.keys(cellDataMap)
    .map(Number)
    .filter((r) => r >= computedStartRow)
    .sort((a, b) => a - b);

  let outputRowIndex = 1;

  for (const r of rowIndices) {
    // Skip any row at or above maxCellRow (title / cell mapping rows like BUKRS, YEAR, PERIOD)
    if (maxCellRow >= 0 && r <= maxCellRow) {
      continue;
    }

    const valuesObj: Record<string, any> = {};
    let hasData = false;

    if (activeKeyMappings.length > 0) {
      for (const km of activeKeyMappings) {
        let val = getCellValueFromSheet(cellDataMap, mergeData, r, km.colIndex, workbookFacade);
        if (val !== null) {
          hasData = true;

          // Number conversion for numeric types / numeric keys
          const keyUpper = km.key.toUpperCase();
          if (
            typeof val === "string" &&
            !isNaN(Number(val)) &&
            (keyUpper === "STT" ||
              keyUpper.startsWith("GT_") ||
              keyUpper.startsWith("DMBTR_") ||
              keyUpper.startsWith("SL_") ||
              keyUpper.startsWith("NUM_"))
          ) {
            val = Number(val);
          }
        }
        valuesObj[km.key] = val;
      }
    } else {
      const rowData = cellDataMap[r] ?? {};
      Object.keys(rowData).forEach((cStr) => {
        const c = Number(cStr);
        let val = getCellValueFromSheet(cellDataMap, mergeData, r, c, workbookFacade);
        if (val !== null) {
          valuesObj[`col_${c}`] = val;
          hasData = true;
        }
      });
    }

    if (hasData) {
      // Ignore header label rows (e.g. row 8: STT, Mã chỉ tiêu, Chỉ tiêu, Thực hiện...)
      if (isHeaderRow(valuesObj, templateMappings)) {
        continue;
      }

      if (valuesObj.YEAR && !isNaN(Number(valuesObj.YEAR))) {
        reportYear = Number(valuesObj.YEAR);
      }
      if (valuesObj.PERIOD && !isNaN(Number(valuesObj.PERIOD))) {
        reportMonth = Number(valuesObj.PERIOD);
      }

      rows.push({
        rowIndex: outputRowIndex++,
        values: valuesObj,
      });
    }
  }

  return {
    wareTemplateId,
    name: templateName
      ? `Báo cáo - ${templateName}`
      : `Báo cáo Web Excel - ${new Date().toLocaleDateString("vi-VN")}`,
    description: "Nhập trực tiếp từ form Web Excel UniversJS",
    reportYear,
    reportMonth,
    reportDay,
    cellData,
    rows,
  };
}
