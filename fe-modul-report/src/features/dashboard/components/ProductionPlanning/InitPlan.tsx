import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { Edit, MapPin, Plus, PlusCircle, Trash2, Check, X } from "lucide-react";
import { targetApi } from "../../api/targetApi";
import { departmentApi } from "../../../department/api/departmentApi";
import type { TargetResponse } from "../../types/target";
import type { DepartmentResponse } from "../../../department/types/department";

interface Props {
  selectedWorkshop: string;
  selectedPeriod: Dayjs;
  onWorkshopChange: (val: string) => void;
  onPeriodChange: (val: Dayjs) => void;
  workshopOptionsProp?: { value: string; label: string }[];
}

const getNodeDepth = (
  node: TargetResponse,
  map: Map<string, TargetResponse>,
): number => {
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
  workshopOptionsProp,
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
    if (workshopOptionsProp && workshopOptionsProp.length > 0) return;
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
  }, [workshopOptionsProp]);

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

  const workshopOptions = useMemo(() => {
    if (workshopOptionsProp && workshopOptionsProp.length > 0) {
      return workshopOptionsProp;
    }
    return depts
      .filter((d) => d.id)
      .map((d) => ({
        value: d.id as string,
        label: d.name?.trim() || d.code?.trim() || "Phòng ban",
      }));
  }, [depts, workshopOptionsProp]);
  interface NewTargetForm {
    parentId: string | null;
    name: string;
    code: string;
    unit: string;
    value: number;
  }

  const [newTarget, setNewTarget] = useState<NewTargetForm | null>(null);

  const updateTargetState = useCallback(
    (id: string, patch: Partial<TargetResponse>) => {
      setTargets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
    },
    [],
  );

  const handleAddRoot = () => {
    setEditingId(null);
    setNewTarget({
      parentId: null,
      name: "",
      code: "",
      unit: "",
      value: 0,
    });
  };

  const handleAddChild = (parentId: string) => {
    setEditingId(null);
    setNewTarget({
      parentId,
      name: "",
      code: "",
      unit: "",
      value: 0,
    });
  };

  const saveNewTarget = async () => {
    if (!newTarget) return;
    if (!newTarget.name?.trim()) {
      message.error("Vui lòng nhập tên chỉ tiêu");
      return;
    }
    try {
      const res = await targetApi.createTarget({
        name: newTarget.name,
        code: newTarget.code,
        unit: newTarget.unit,
        value: newTarget.value,
        month: monthStr,
        departmentId: selectedWorkshop,
        parentId: newTarget.parentId,
      });
      setTargets((prev) => [...prev, res]);
      setNewTarget(null);
      message.success("Thêm chỉ tiêu thành công!");
    } catch (err) {
      console.error(err);
      message.error("Thêm chỉ tiêu thất bại!");
    }
  };

  const startEdit = (node: TargetResponse) => {
    setNewTarget(null);
    setEditingId(node.id);
    setOriginalNodeValues({ ...node });
  };

  const cancelEdit = (node: TargetResponse) => {
    setEditingId(null);
    if (originalNodeValues) {
      updateTargetState(node.id, originalNodeValues);
    }
    setOriginalNodeValues(null);
  };

  const saveEdit = async (node: TargetResponse) => {
    if (!node.name?.trim()) {
      message.error("Vui lòng nhập tên chỉ tiêu");
      return;
    }
    try {
      const res = await targetApi.updateTarget({
        id: node.id,
        name: node.name,
        code: node.code,
        unit: node.unit,
        value: node.value,
        month: monthStr,
        departmentId: selectedWorkshop,
        parentId: node.parentId ?? null,
      });
      setTargets((prev) => prev.map((t) => (t.id === node.id ? res : t)));
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
      await targetApi.deleteTarget(deleteTargetId);
      setTargets((prev) => prev.filter((t) => t.id !== deleteTargetId));
      message.success("Xóa chỉ tiêu thành công!");
    } catch (err) {
      console.error(err);
      message.error("Xóa chỉ tiêu thất bại!");
    }
    setDeleteTargetId(null);
  };

  const renderNewRow = (depth: number) => {
    if (!newTarget) return null;
    const isRoot = newTarget.parentId === null;
    return (
      <tr
        key="new-target-row"
        className="bg-emerald-50/70 border-y border-emerald-200/80 shadow-[inset_0_2px_4px_rgba(16,185,129,0.04)] transition-all"
      >
        <td
          className="p-2.5 flex items-center gap-1.5"
          style={{ paddingLeft: `${12 + depth * 18}px` }}
        >
          <span className="w-6 h-6 flex items-center justify-center text-emerald-700 bg-emerald-100/90 rounded-md shrink-0 shadow-2xs">
            {isRoot ? (
              <MapPin size={13} className="text-emerald-700" />
            ) : (
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full inline-block" />
            )}
          </span>
          <div className="flex flex-col gap-1 w-full max-w-[260px]">
            <Input
              size="small"
              autoFocus
              value={newTarget.name}
              placeholder="Tên chỉ tiêu mới..."
              className="w-full rounded-lg border-emerald-300 hover:border-emerald-400 focus:border-emerald-600 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.2)] bg-white text-xs py-1 px-2.5 font-medium transition-all"
              onChange={(e) =>
                setNewTarget((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
            />
          </div>
        </td>

        <td className="p-2.5 text-center">
          <Input
            size="small"
            value={newTarget.code}
            placeholder="Mã IF"
            className="w-full text-center font-mono rounded-lg border-emerald-300 hover:border-emerald-400 focus:border-emerald-600 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.2)] bg-white text-xs py-1 px-2 transition-all"
            onChange={(e) =>
              setNewTarget((prev) => (prev ? { ...prev, code: e.target.value } : null))
            }
          />
        </td>

        <td className="p-2.5 text-center">
          <Input
            size="small"
            value={newTarget.unit}
            placeholder="ĐVT"
            className="w-full text-center rounded-lg border-emerald-300 hover:border-emerald-400 focus:border-emerald-600 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.2)] bg-white text-xs py-1 px-2 transition-all"
            onChange={(e) =>
              setNewTarget((prev) => (prev ? { ...prev, unit: e.target.value } : null))
            }
          />
        </td>

        <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
          <InputNumber
            size="small"
            value={newTarget.value}
            min={0}
            className="w-full text-right font-mono rounded-lg border-emerald-300 hover:border-emerald-400 focus:border-emerald-600 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.2)] bg-white text-xs transition-all"
            onChange={(val) =>
              setNewTarget((prev) => (prev ? { ...prev, value: val || 0 } : null))
            }
          />
        </td>

        <td className="p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={saveNewTarget}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white border-0 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-all"
            >
              <Check size={13} strokeWidth={2.5} /> Lưu
            </button>
            <button
              type="button"
              onClick={() => setNewTarget(null)}
              className="bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 border-0 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
            >
              <X size={13} strokeWidth={2.5} /> Hủy
            </button>
          </div>
        </td>
      </tr>
    );
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
            onClick={handleAddRoot}
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
                    <td
                      colSpan={5}
                      className="p-3 font-bold text-[#1a8649] text-xs uppercase"
                    >
                      {workshopOptions.find((w) => w.value === selectedWorkshop)
                        ?.label || "Phòng ban"}
                    </td>
                  </tr>
                  {displayTargets.length === 0 ? (
                    newTarget && newTarget.parentId === null ? (
                      renderNewRow(0)
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-slate-400 font-medium"
                        >
                          Chưa có chỉ tiêu nào. Nhấn "Thêm chỉ tiêu gốc" để bắt
                          đầu.
                        </td>
                      </tr>
                    )
                  ) : (
                    <>
                      {displayTargets.map((node) => {
                        const depth = getNodeDepth(node, targetsMap);
                        const hasChildren = displayTargets.some(
                          (n) => n.parentId === node.id,
                        );
                        const khTh = node.value ?? 0;
                        const isEditing = editingId === node.id;
                        const isRoot = node.parentId == null;

                        const rowBg = isEditing
                          ? "bg-blue-50/70 border-y border-blue-200/80 shadow-[inset_0_2px_4px_rgba(59,130,246,0.04)] transition-all"
                          : !isRoot
                            ? "bg-slate-50/50 hover:bg-slate-100 transition-all border-b border-slate-100"
                            : "hover:bg-slate-50/60 transition-all border-b border-slate-100";
                        const fontStyle = !isRoot
                          ? "font-semibold text-slate-700"
                          : "font-semibold text-slate-800";

                        const isAddingChildToThisNode =
                          newTarget && newTarget.parentId === node.id;

                        return (
                          <React.Fragment key={node.id}>
                            <tr className={rowBg}>
                              <td
                                className="p-2.5 flex items-center gap-1.5"
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
                                  <div className="flex flex-col gap-1 w-full max-w-[260px]">
                                    <Input
                                      size="small"
                                      value={node.name}
                                      placeholder="Tên chỉ tiêu"
                                      className="w-full rounded-lg border-blue-300 hover:border-blue-400 focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] bg-white text-xs py-1 px-2.5 font-medium transition-all"
                                      onChange={(e) =>
                                        updateTargetState(node.id, {
                                          name: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                ) : (
                                  <span className={fontStyle}>{node.name}</span>
                                )}
                              </td>

                              <td className="p-2.5 text-center">
                                {isEditing ? (
                                  <Input
                                    size="small"
                                    value={node.code}
                                    placeholder="Mã IF"
                                    className="w-full text-center font-mono rounded-lg border-blue-300 hover:border-blue-400 focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] bg-white text-xs py-1 px-2 transition-all"
                                    onChange={(e) =>
                                      updateTargetState(node.id, {
                                        code: e.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  <span className="font-mono text-slate-600 font-semibold">
                                    {node.code || "-"}
                                  </span>
                                )}
                              </td>

                              <td className="p-2.5 text-center text-slate-500 font-medium">
                                {isEditing ? (
                                  <Input
                                    size="small"
                                    value={node.unit}
                                    placeholder="ĐVT"
                                    className="w-full text-center rounded-lg border-blue-300 hover:border-blue-400 focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] bg-white text-xs py-1 px-2 transition-all"
                                    onChange={(e) =>
                                      updateTargetState(node.id, {
                                        unit: e.target.value,
                                      })
                                    }
                                  />
                                ) : (
                                  node.unit || "-"
                                )}
                              </td>

                              <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                                {isEditing && !hasChildren ? (
                                  <InputNumber
                                    size="small"
                                    value={node.value}
                                    min={0}
                                    className="w-full text-right font-mono rounded-lg border-blue-300 hover:border-blue-400 focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] bg-white text-xs transition-all"
                                    onChange={(val) =>
                                      updateTargetState(node.id, { value: val || 0 })
                                    }
                                  />
                                ) : hasChildren ? (
                                  khTh
                                ) : (
                                  (node.value ?? 0)
                                )}
                              </td>

                              <td className="p-2.5 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => saveEdit(node)}
                                      className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white border-0 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-all"
                                    >
                                      <Check size={13} strokeWidth={2.5} /> Lưu
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => cancelEdit(node)}
                                      className="bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 border-0 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                                    >
                                      <X size={13} strokeWidth={2.5} /> Hủy
                                    </button>
                                  </div>
                                ) : (
                                  <Space size="middle">
                                    <Tooltip title="Thêm chỉ tiêu con">
                                      <button
                                        type="button"
                                        onClick={() => handleAddChild(node.id)}
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
                            {isAddingChildToThisNode && renderNewRow(depth + 1)}
                          </React.Fragment>
                        );
                      })}
                      {newTarget && newTarget.parentId === null && renderNewRow(0)}
                    </>
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
