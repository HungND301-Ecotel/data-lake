import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Tooltip,
  message,
} from "antd";
import type { Dayjs } from "dayjs";
import { Edit, MapPin, Plus, PlusCircle, Trash2 } from "lucide-react";
import { targetApi } from "../../api/targetApi";
import { departmentApi } from "../../../department/api/departmentApi";
import type { TargetResponse } from "../../types/target";
import type { DepartmentResponse } from "../../../department/types/department";

interface Props {
  selectedWorkshop: string;
  selectedPeriod: Dayjs;
  onWorkshopChange: (val: string) => void;
  onPeriodChange: (val: Dayjs) => void;
}

const getNodeDepth = (node: TargetResponse, map: Map<string, TargetResponse>): number => {
  let depth = 0;
  let current = node;
  while (current.parentId != null) {
    const parent = map.get(current.parentId);
    if (!parent) break;
    depth++;
    current = parent;
  }
  return depth;
};

const getDisplayOrder = (items: TargetResponse[]): TargetResponse[] => {
  const byParent = new Map<string | null, TargetResponse[]>();
  items.forEach((item) => {
    const key = item.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), item]);
  });

  const sortNodes = (nodes: TargetResponse[]) =>
    [...nodes].sort((a, b) => {
      const aRank = a.parentId == null ? 0 : 1;
      const bRank = b.parentId == null ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return (a.name || "").localeCompare(b.name || "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

  const visited = new Set<string>();
  const result: TargetResponse[] = [];

  const walk = (nodes: TargetResponse[]) => {
    for (const node of sortNodes(nodes)) {
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      result.push(node);
      const children = byParent.get(node.id) ?? [];
      if (children.length > 0) walk(children);
    }
  };

  walk(byParent.get(null) ?? []);
  for (const node of sortNodes(items)) {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      result.push(node);
    }
  }
  return result;
};

export function InitPlan({
  selectedWorkshop,
  selectedPeriod,
  onWorkshopChange,
  onPeriodChange,
}: Props) {
  const [depts, setDepts] = useState<DepartmentResponse[]>([]);
  const [targets, setTargets] = useState<TargetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalNodeValues, setOriginalNodeValues] =
    useState<Partial<TargetResponse> | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const monthStr = selectedPeriod.format("YYYY-MM");

  useEffect(() => {
    let cancelled = false;
    departmentApi
      .searchDepartment("", 0, 1000)
      .then((res) => {
        if (cancelled) return;
        if (res?.content) {
          setDepts(res.content);
          if (!selectedWorkshop && res.content.length > 0) {
            const first = res.content.find((d) => d.id);
            if (first?.id) onWorkshopChange(first.id);
          }
        }
      })
      .catch((err) => console.error("Failed to load departments:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedWorkshop || !monthStr) return;
    let cancelled = false;
    setLoading(true);
    targetApi
      .getTargets(selectedWorkshop, monthStr)
      .then((res) => {
        if (!cancelled) setTargets(res ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load targets:", err);
          setTargets([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedWorkshop, monthStr]);

  const displayTargets = useMemo(() => getDisplayOrder(targets), [targets]);
  const targetsMap = useMemo(
    () => new Map(displayTargets.map((t) => [t.id, t])),
    [displayTargets],
  );

  const workshopOptions = useMemo(
    () =>
      depts
        .filter((d) => d.id)
        .map((d) => ({
          value: d.id as string,
          label: d.name?.trim() || d.code?.trim() || "Phòng ban",
        })),
    [depts],
  );

  const addTarget = useCallback(
    (parentId: string | null): string => {
      const newId = `new-${Date.now()}`;
      setTargets((prev) => [
        ...prev,
        {
          id: newId,
          name: "",
          code: "",
          unit: "",
          value: 0,
          month: monthStr,
          departmentId: selectedWorkshop,
          parentId,
        },
      ]);
      return newId;
    },
    [monthStr, selectedWorkshop],
  );

  const updateTarget = useCallback(
    (id: string, patch: Partial<TargetResponse>) => {
      setTargets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
    },
    [],
  );

  const saveTarget = useCallback(
    async (id: string) => {
      const target = targets.find((t) => t.id === id);
      if (!target) return;

      const payload = {
        name: target.name,
        code: target.code,
        unit: target.unit,
        value: target.value,
        month: monthStr,
        departmentId: selectedWorkshop,
        parentId: target.parentId ?? null,
      };

      if (id.startsWith("new-")) {
        const res = await targetApi.createTarget(payload);
        setTargets((prev) => prev.map((t) => (t.id === id ? res : t)));
      } else {
        const res = await targetApi.updateTarget({ ...payload, id });
        setTargets((prev) => prev.map((t) => (t.id === id ? res : t)));
      }
    },
    [targets, monthStr, selectedWorkshop],
  );

  const deleteTarget = useCallback(async (id: string) => {
    if (id.startsWith("new-")) {
      setTargets((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    await targetApi.deleteTarget(id);
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddInline = (parentId: string | null) => {
    const newId = addTarget(parentId);
    setEditingId(newId);
    setOriginalNodeValues(null);
  };

  const startEdit = (node: TargetResponse) => {
    setEditingId(node.id);
    setOriginalNodeValues({ ...node });
  };

  const cancelEdit = (node: TargetResponse) => {
    setEditingId(null);
    if (node.id.startsWith("new-")) {
      deleteTarget(node.id);
    } else if (originalNodeValues) {
      updateTarget(node.id, originalNodeValues);
    }
    setOriginalNodeValues(null);
  };

  const saveEdit = async (node: TargetResponse) => {
    if (!node.name?.trim()) {
      message.error("Vui lòng nhập tên chỉ tiêu");
      return;
    }
    try {
      await saveTarget(node.id);
      setEditingId(null);
      setOriginalNodeValues(null);
      message.success("Lưu chỉ tiêu thành công!");
    } catch (err) {
      console.error(err);
      message.error("Lưu chỉ tiêu thất bại!");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteTarget(deleteTargetId);
      message.success("Xóa chỉ tiêu thành công!");
    } catch (err) {
      console.error(err);
      message.error("Xóa chỉ tiêu thất bại!");
    }
    setDeleteTargetId(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full lg:w-[320px] bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5 shrink-0 overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Thông tin chung
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">
                Phòng ban / Phân xưởng
              </label>
              <Select
                className="w-full"
                value={selectedWorkshop || undefined}
                onChange={onWorkshopChange}
                options={workshopOptions}
                placeholder="Chọn phòng ban"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">
                Kỳ kế hoạch
              </label>
              <DatePicker
                picker="month"
                className="w-full"
                value={selectedPeriod}
                onChange={(date) => {
                  if (date) onPeriodChange(date);
                }}
                format="[Tháng] MM/YYYY"
                allowClear={false}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Tác vụ chỉ tiêu
          </h3>
          <button
            type="button"
            onClick={() => handleAddInline(null)}
            disabled={!selectedWorkshop}
            className="w-full bg-[#1a8649] text-white border-0 py-2.5 px-4 rounded-lg font-semibold text-xs cursor-pointer flex items-center justify-center gap-2 hover:bg-[#15703d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle size={15} /> Thêm chỉ tiêu gốc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="font-bold text-xs text-slate-700">
            KHAI BÁO CHỈ TIÊU SẢN XUẤT
          </span>
          {loading && <Spin size="small" />}
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                <th className="p-3 w-[350px]">Chỉ tiêu sản xuất</th>
                <th className="p-3 w-[150px] text-center">Mã IF</th>
                <th className="p-3 w-[100px] text-center">ĐVT</th>
                <th className="p-3 w-[120px] text-right">KH ĐH Tháng</th>
                <th className="p-3 w-[120px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!selectedWorkshop ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-400 font-medium"
                  >
                    Vui lòng chọn phòng ban để xem chỉ tiêu.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Spin />
                  </td>
                </tr>
              ) : (
                <>
                  <tr className="bg-[#1a8649]/10 border-b border-[#1a8649]/20">
                    <td colSpan={5} className="p-3 font-bold text-[#1a8649] text-xs uppercase">
                      {workshopOptions.find((w) => w.value === selectedWorkshop)?.label || "Phòng ban"}
                    </td>
                  </tr>
                  {displayTargets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-slate-400 font-medium"
                      >
                        Chưa có chỉ tiêu nào. Nhấn "Thêm chỉ tiêu gốc" để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    displayTargets.map((node) => {
                  const depth = getNodeDepth(node, targetsMap);
                  const hasChildren = displayTargets.some(
                    (n) => n.parentId === node.id,
                  );
                  const khTh = node.value ?? 0;
                  const isEditing = editingId === node.id;
                  const isRoot = node.parentId == null;

                  const rowBg = !isRoot
                    ? "bg-slate-50/50 hover:bg-slate-100 transition-all border-b border-slate-100"
                    : "hover:bg-slate-50/60 transition-all border-b border-slate-100";
                  const fontStyle = !isRoot
                    ? "font-semibold text-slate-700"
                    : "font-semibold text-slate-800";

                  return (
                    <tr key={node.id} className={rowBg}>
                      <td
                        className="p-3 flex items-center gap-1"
                        style={{ paddingLeft: `${12 + depth * 18}px` }}
                      >
                        <span className="w-5 h-5 flex items-center justify-center text-slate-400 select-none">
                          {isRoot ? (
                            <MapPin size={15} className="text-slate-600" />
                          ) : (
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full inline-block" />
                          )}
                        </span>
                        {isEditing ? (
                          <div className="flex flex-col gap-1 w-full max-w-[260px] my-1">
                            <Input
                              size="small"
                              value={node.name}
                              placeholder="Tên chỉ tiêu"
                              onChange={(e) =>
                                updateTarget(node.id, { name: e.target.value })
                              }
                            />
                          </div>
                        ) : (
                          <span className={fontStyle}>{node.name}</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {isEditing ? (
                          <Input
                            size="small"
                            className="w-full text-center font-mono"
                            value={node.code}
                            placeholder="Mã IF"
                            onChange={(e) =>
                              updateTarget(node.id, { code: e.target.value })
                            }
                          />
                        ) : (
                          <span className="font-mono text-slate-600 font-semibold">{node.code || "-"}</span>
                        )}
                      </td>

                      <td className="p-3 text-center text-slate-500 font-medium">
                        {isEditing ? (
                          <Input
                            size="small"
                            className="w-full text-center"
                            value={node.unit}
                            placeholder="ĐVT"
                            onChange={(e) =>
                              updateTarget(node.id, { unit: e.target.value })
                            }
                          />
                        ) : (
                          node.unit || "-"
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-semibold text-slate-800">
                        {isEditing && !hasChildren ? (
                          <InputNumber
                            size="small"
                            className="w-full text-right font-mono"
                            value={node.value}
                            min={0}
                            onChange={(val) =>
                              updateTarget(node.id, { value: val || 0 })
                            }
                          />
                        ) : (
                          hasChildren ? khTh : (node.value ?? 0)
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {isEditing ? (
                          <Space size="middle">
                            <Button
                              type="link"
                              size="small"
                              className="text-emerald-600 hover:text-emerald-800 font-bold p-0"
                              onClick={() => saveEdit(node)}
                            >
                              Lưu
                            </Button>
                            <Button
                              type="link"
                              size="small"
                              className="text-slate-500 hover:text-slate-700 font-bold p-0"
                              onClick={() => cancelEdit(node)}
                            >
                              Hủy
                            </Button>
                          </Space>
                        ) : (
                          <Space size="middle">
                            <Tooltip title="Thêm chỉ tiêu con">
                              <button
                                type="button"
                                onClick={() => handleAddInline(node.id)}
                                className="border-0 bg-transparent text-emerald-600 hover:text-emerald-800 cursor-pointer"
                              >
                                <Plus size={15} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <button
                                type="button"
                                onClick={() => startEdit(node)}
                                className="border-0 bg-transparent text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                <Edit size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <button
                                type="button"
                                onClick={() => setDeleteTargetId(node.id)}
                                className="border-0 bg-transparent text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </Space>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
              </>
            )}
            </tbody>
          </table>
        </div>

        <Modal
          title="Xác nhận xóa"
          open={!!deleteTargetId}
          onOk={confirmDelete}
          onCancel={() => setDeleteTargetId(null)}
          okText="Xóa"
          okButtonProps={{ danger: true }}
          cancelText="Hủy"
        >
          <p>
            Bạn có chắc chắn muốn xóa chỉ tiêu này và toàn bộ các chỉ tiêu con
            trực thuộc không?
          </p>
        </Modal>
      </div>
    </div>
  );
}
