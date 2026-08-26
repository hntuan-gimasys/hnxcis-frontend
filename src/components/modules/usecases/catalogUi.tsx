/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
} from 'lucide-react';

/**
 * Các thành phần giao diện dùng chung cho màn hình quản lý danh mục.
 *
 * Đây là bản dịch sang Tailwind của các class trong `docs/quan-ly-danh-muc_2.html`
 * (`.badge`, `th.sortable`, `.table-footer`, `.pagination`, `.modal`, `.field`,
 * `.toast`, `.empty-state`). Gom vào một file vì bảy màn hình danh mục trong
 * `docs/srs/` dùng chung đúng bộ này: dựng lại từng màn hình một sẽ tạo bảy chỗ
 * để lệch màu badge và lệch logic phân trang.
 *
 * Ở đây CHỈ có phần trình bày — không có dữ liệu, không có luật nghiệp vụ. Luật
 * của từng danh mục nằm ở màn hình tương ứng.
 */

/* ------------------------------------------------------------------ input */

/**
 * Class dùng chung cho input/select/textarea trong form (`.field input` ở file
 * mẫu). Xuất ra dưới dạng chuỗi class thay vì bọc thành component: bọc lại chỉ
 * để đặt className sẽ chắn mất các thuộc tính gốc (maxLength, autoFocus,
 * inputMode...) mà form nào cũng cần.
 */
export const INPUT_CLASS =
  'w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 outline-none ' +
  'focus:border-hnx-400 focus:ring-3 focus:ring-hnx-500/15';

export const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer pr-8`;

export const TEXTAREA_CLASS =
  'w-full min-h-19 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 ' +
  'outline-none resize-y focus:border-hnx-400 focus:ring-3 focus:ring-hnx-500/15';

/** Viền đỏ khi trường có lỗi (`.field.has-error` ở file mẫu). */
export const ERROR_RING = 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15';

/* ------------------------------------------------------------------ button */

export const BTN_BASE =
  'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium ' +
  'whitespace-nowrap border transition-colors disabled:opacity-40 disabled:cursor-default';

export const BTN_PRIMARY = `${BTN_BASE} border-transparent bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs`;
export const BTN_OUTLINE = `${BTN_BASE} border-slate-300 bg-white text-slate-900 hover:bg-slate-50`;
export const BTN_DANGER = `${BTN_BASE} border-transparent bg-rose-600 text-white hover:bg-rose-700`;

/* ------------------------------------------------------------------ badge */

/**
 * Pill trạng thái hoạt động của một mục danh mục.
 *
 * KHÔNG dùng `common/StatusBadge` ở đây: component đó phục vụ các picklist
 * nghiệp vụ (trạng thái chứng khoán, hồ sơ CBTT, diện giám sát) với hàng chục mã
 * riêng. Trạng thái danh mục chỉ là cờ bật/tắt một bản ghi cấu hình — nhồi nó
 * vào cùng một switch sẽ trộn hai khái niệm không liên quan.
 */
export const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    {active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
  </span>
);

/* ------------------------------------------------------------------ table */

export const TH_CLASS =
  'px-3 py-2.5 text-left text-[13px] font-semibold text-slate-900 border-b border-slate-200 whitespace-nowrap';

export const TD_CLASS = 'px-3 py-3.5 text-sm text-slate-900 border-b border-slate-100 align-top';

export interface SortState {
  readonly key: string;
  readonly dir: 'asc' | 'desc';
}

/**
 * Bấm một lần sắp xếp tăng, bấm lại cột đó thì đảo chiều — không có trạng thái
 * thứ ba "bỏ sắp xếp", vì danh sách luôn phải có một thứ tự xác định (SRS: mặc
 * định mới nhất theo CREATED_DATE).
 */
export function nextSort(current: SortState | null, key: string): SortState {
  if (current && current.key === key) {
    return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  }
  return { key, dir: 'asc' };
}

interface SortableThProps {
  label: string;
  sortKey: string;
  sort: SortState | null;
  onSort: (key: string) => void;
  className?: string;
}

export const SortableTh: React.FC<SortableThProps> = ({
  label,
  sortKey,
  sort,
  onSort,
  className = '',
}) => {
  const sorted = sort !== null && sort.key === sortKey;
  const dir = sorted ? sort.dir : null;

  return (
    <th
      scope="col"
      aria-sort={dir === null ? 'none' : dir === 'asc' ? 'ascending' : 'descending'}
      className={`${TH_CLASS} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex cursor-pointer select-none items-center gap-1.5 hover:text-hnx-700"
      >
        {label}
        {dir === null && <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60" />}
        {dir === 'asc' && <ArrowUp className="h-3.5 w-3.5 text-slate-600" />}
        {dir === 'desc' && <ArrowDown className="h-3.5 w-3.5 text-slate-600" />}
      </button>
    </th>
  );
};

export const EmptyRow: React.FC<{ colSpan: number; title: string; hint: string }> = ({
  colSpan,
  title,
  hint,
}) => (
  <tr>
    <td colSpan={colSpan}>
      <div className="px-5 py-15 text-center text-slate-500">
        <Inbox className="mx-auto mb-2.5 h-10 w-10 opacity-50" />
        <div className="mb-1 text-sm font-medium text-slate-600">{title}</div>
        <div className="text-[13px]">{hint}</div>
      </div>
    </td>
  </tr>
);

/* -------------------------------------------------------------- phân trang */

/**
 * Dãy số trang có dấu `…` khi nhiều trang, theo đúng cách file mẫu dựng: luôn
 * giữ trang đầu và trang cuối, cộng thêm một trang mỗi bên trang hiện tại.
 */
export function pageItems(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: Array<number | 'gap'> = [1];
  if (page > 3) items.push('gap');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p += 1) {
    items.push(p);
  }
  if (page < totalPages - 2) items.push('gap');
  items.push(totalPages);
  return items;
}

interface TablePagerProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

export const TablePager: React.FC<TablePagerProps> = ({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  onPageSize,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3.5">
    <div className="text-[13px] text-slate-600">Tổng danh sách : {total}</div>

    <div className="flex items-center gap-3.5 text-[13px] text-slate-600">
      <label className="flex items-center gap-2">
        Hiển thị
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="h-8 cursor-pointer rounded-md border border-slate-300 bg-slate-100 px-2 text-[13px] text-slate-600"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} bản ghi
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Trang trước"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageItems(page, totalPages).map((item, idx) =>
          item === 'gap' ? (
            <span key={`gap-${idx}`} className="px-0.5 text-slate-500">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? 'page' : undefined}
              className={`h-7 min-w-7 rounded-md px-1.5 text-[13px] ${
                item === page
                  ? 'bg-indigo-600 font-semibold text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Trang sau"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------- modal */

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Popup xác nhận hẹp hơn popup form (`.confirm-modal .modal` ở file mẫu). */
  width?: 'form' | 'confirm';
}

export const ModalShell: React.FC<ModalShellProps> = ({
  title,
  onClose,
  children,
  footer,
  width = 'form',
}) => {
  // Esc đóng popup — bàn phím là cách nhanh nhất để thoát, và người nhập liệu
  // danh mục cả ngày sẽ dùng nó thay vì đưa tay ra chuột.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-xl bg-white shadow-2xl ${
          width === 'confirm' ? 'max-w-95' : 'max-w-110'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}

        <div className="flex justify-end gap-2.5 border-t border-slate-200 px-5 py-4">{footer}</div>
      </div>
    </div>
  );
};

interface ConfirmDeleteDialogProps {
  /** Tên bản ghi, để người dùng thấy rõ mình đang xóa cái gì. */
  recordLabel: string;
  note: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  recordLabel,
  note,
  onCancel,
  onConfirm,
}) => (
  <ModalShell
    title="Xóa bản ghi"
    onClose={onCancel}
    width="confirm"
    footer={
      <>
        <button type="button" className={BTN_OUTLINE} onClick={onCancel}>
          Hủy
        </button>
        <button type="button" className={BTN_DANGER} onClick={onConfirm}>
          Xóa
        </button>
      </>
    }
  >
    <div className="flex gap-3.5 px-5 pt-5 pb-1.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <div className="mb-1 text-sm font-semibold text-slate-900">
          Bạn có chắc chắn muốn xóa “{recordLabel}”?
        </div>
        <div className="text-[13px] text-slate-500">{note}</div>
      </div>
    </div>
  </ModalShell>
);

/* ------------------------------------------------------------------- field */

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  children,
}) => (
  <div>
    <label className="mb-1.5 block text-[13px] font-medium text-slate-900">
      {label}
      {required && <span className="ml-0.5 text-rose-600">*</span>}
    </label>
    {children}
    {error ? (
      <p className="mt-1 text-xs text-rose-600">{error}</p>
    ) : (
      hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
    )}
  </div>
);

/* ------------------------------------------------------------------- toast */

export type ToastKind = 'success' | 'danger';

export interface ToastItem {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
}

/**
 * Toast tự tắt sau ~2,6 giây, đúng như file mẫu. SRS yêu cầu "hiển thị thông báo
 * Lưu thành công theo tài liệu quy chuẩn hệ thống" — đây là phần hiển thị đó.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  // Rời màn hình khi toast chưa tắt thì timer còn treo và sẽ setState trên một
  // component đã unmount.
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current;
    nextId.current += 1;

    setToasts((prev) => [...prev, { id, kind, message }]);
    timers.current.push(
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600),
    );
  }, []);

  return { toasts, pushToast };
}

export const ToastStack: React.FC<{ toasts: readonly ToastItem[] }> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-100 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex min-w-60 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 shadow-md"
        >
          {t.kind === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
