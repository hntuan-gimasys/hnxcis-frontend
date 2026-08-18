/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, EyeOff, Eye, X, AlertTriangle } from 'lucide-react';
import { DynamicTable, ColumnDef } from './DynamicTable';

/**
 * Khung CRUD dùng chung cho toàn bộ màn hình quản trị metadata (FR-045 → FR-054).
 *
 * VÌ SAO GOM THÀNH MỘT COMPONENT
 *
 * Chín màn hình metadata khác nhau về dữ liệu nhưng giống hệt nhau về luật:
 *
 *   X6 — "Xóa chỉ khi chưa dùng; nếu đã dùng thì chỉ được inactive."
 *
 * Luật này xuất hiện nguyên văn ở FR-045, FR-049, FR-052, FR-053 và ngầm định ở
 * các FR còn lại. Viết rời ở chín nơi nghĩa là chín cơ hội làm sai khác nhau —
 * và cái sai ở đây không ồn ào: xóa nhầm một mục danh mục đang được tham chiếu
 * sẽ làm hỏng các bản ghi cũ mà không có lỗi nào nổi lên ngay.
 *
 * Nên `usageCount` là bắt buộc trong `CrudRow`: mọi bản ghi metadata phải trả
 * lời được câu "có ai đang dùng tôi không". Màn hình nào chưa đếm được thì phải
 * khai báo tường minh `usageCount: 0`, chứ không được bỏ trống để lách luật.
 */

export interface CrudRow {
  id: number;
  usageCount: number;
  isActive?: boolean;
}

export interface CrudField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  help?: string;
  /** Khóa nghiệp vụ: cho nhập khi tạo mới, khóa lại khi sửa (AC-049-5). */
  immutableOnEdit?: boolean;
}

interface CrudPanelProps<T extends CrudRow> {
  frCode: string;
  title: string;
  description: string;
  columns: ColumnDef<T>[];
  rows: T[];
  fields: CrudField[];
  onSave: (draft: Record<string, unknown>, editingId: number | null) => void;
  onDelete: (row: T) => void;
  onToggleActive?: (row: T) => void;
  /** Thông báo hiển thị khi chặn xóa; mặc định nêu số bản ghi đang tham chiếu. */
  usageLabel?: (row: T) => string;
  readOnly?: boolean;
  emptyHint?: string;
  children?: React.ReactNode;
}

export function CrudPanel<T extends CrudRow>({
  frCode,
  title,
  description,
  columns,
  rows,
  fields,
  onSave,
  onDelete,
  onToggleActive,
  usageLabel,
  readOnly = false,
  emptyHint,
  children,
}: CrudPanelProps<T>) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<{ row: T; reason: string } | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, f.type === 'checkbox' ? true : ''])));
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, (row as never)[f.key] ?? ''])));
    setErrors({});
    setFormOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (!f.required) continue;
      const v = draft[f.key];
      if (v === '' || v === undefined || v === null) next[f.key] = 'Bắt buộc nhập';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave(draft, editing ? editing.id : null);
    setFormOpen(false);
  };

  /**
   * X6 — chặn ngay ở tầng UI, kèm con số. Thông báo "không xóa được" mà không
   * nói vì sao sẽ khiến người dùng thử lại nhiều lần rồi đi hỏi support.
   */
  const attemptDelete = (row: T) => {
    if (row.usageCount > 0) {
      setBlocked({
        row,
        reason:
          usageLabel?.(row) ??
          `Đang được ${row.usageCount} bản ghi khác tham chiếu. Theo quy tắc X6 chỉ được ngưng sử dụng (inactive), không xóa.`,
      });
      return;
    }
    onDelete(row);
  };

  const actionCol = (row: T) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => openEdit(row)}
        title={readOnly ? 'Xem chi tiết' : 'Chỉnh sửa'}
        className="p-1.5 rounded-sm text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {onToggleActive && (
        <button
          onClick={() => onToggleActive(row)}
          disabled={readOnly}
          title={row.isActive === false ? 'Kích hoạt lại' : 'Ngưng sử dụng'}
          className="p-1.5 rounded-sm text-slate-600 hover:bg-slate-100 hover:text-amber-700 disabled:opacity-40"
        >
          {row.isActive === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
      <button
        onClick={() => attemptDelete(row)}
        disabled={readOnly}
        title={row.usageCount > 0 ? `Đang được ${row.usageCount} bản ghi dùng — không xóa được` : 'Xóa'}
        className={`p-1.5 rounded-sm disabled:opacity-40 ${
          row.usageCount > 0
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
        }`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
              {frCode}
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">{description}</p>
        </div>
        {!readOnly && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm mới
          </button>
        )}
      </div>

      {children}

      {rows.length === 0 && emptyHint ? (
        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-sm">
          {emptyHint}
        </div>
      ) : (
        <DynamicTable<T>
          columns={columns}
          data={rows}
          density="compact"
          actions={actionCol}
          searchPlaceholder="Tìm theo mã, tên, giá trị..."
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {editing ? `Sửa — ${title}` : `Thêm mới — ${title}`}
              </h3>
              <button onClick={() => setFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => {
                const locked = readOnly || (editing !== null && f.immutableOnEdit === true);
                const err = errors[f.key];
                const common =
                  'w-full px-2.5 py-1.5 text-xs border rounded-sm bg-white disabled:bg-slate-100 disabled:text-slate-500 ' +
                  (err ? 'border-rose-400' : 'border-slate-300');
                return (
                  <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {f.label}
                      {f.required && <span className="text-rose-600 ml-0.5">*</span>}
                      {locked && editing && f.immutableOnEdit && (
                        <span className="ml-1.5 font-normal normal-case text-slate-400">(khóa khi sửa)</span>
                      )}
                    </label>

                    {f.type === 'select' ? (
                      <select
                        disabled={locked}
                        className={common}
                        value={String(draft[f.key] ?? '')}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      >
                        <option value="">— chọn —</option>
                        {(f.options || []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-xs text-slate-700 h-[30px]">
                        <input
                          type="checkbox"
                          disabled={locked}
                          checked={Boolean(draft[f.key])}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })}
                        />
                        Có
                      </label>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        disabled={locked}
                        rows={3}
                        className={common}
                        value={String(draft[f.key] ?? '')}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        disabled={locked}
                        className={common}
                        value={String(draft[f.key] ?? '')}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                          })
                        }
                      />
                    )}

                    {err ? (
                      <p className="text-[10px] text-rose-600 mt-1 font-semibold">{err}</p>
                    ) : f.help ? (
                      <p className="text-[10px] text-slate-500 mt-1">{f.help}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setFormOpen(false)}
                className="px-3 py-2 rounded-sm border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-wider"
              >
                Đóng
              </button>
              {!readOnly && (
                <button
                  onClick={submit}
                  className="px-3 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Lưu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {blocked && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Không thể xóa</h3>
            </div>
            <div className="p-4 text-xs text-slate-700 leading-relaxed">{blocked.reason}</div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              {onToggleActive && blocked.row.isActive !== false && (
                <button
                  onClick={() => {
                    onToggleActive(blocked.row);
                    setBlocked(null);
                  }}
                  className="px-3 py-2 rounded-sm bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Ngưng sử dụng thay thế
                </button>
              )}
              <button
                onClick={() => setBlocked(null)}
                className="px-3 py-2 rounded-sm border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 uppercase tracking-wider"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
