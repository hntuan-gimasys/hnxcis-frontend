/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

import { findImsUseCaseByCode } from '../../../lib/imsRoutes';
import {
  BTN_OUTLINE,
  BTN_PRIMARY,
  ConfirmDeleteDialog,
  EmptyRow,
  SELECT_CLASS,
  SortState,
  SortableTh,
  StatusPill,
  TD_CLASS,
  TH_CLASS,
  TablePager,
  ToastStack,
  useToasts,
} from './catalogUi';
import { STATUS_OPTIONS } from './catalogTypes';
import { useCatalogList } from './useCatalogList';
import { DepartmentDraft, Ims006DepartmentFormModal } from './Ims006DepartmentFormModal';
import { DepartmentRow, INITIAL_DEPARTMENTS } from './ims006DepartmentMock';

/**
 * SRS: `docs/srs/[IMS-006] Quản lý danh mục Phòng ban.md`
 *
 * Màn hình "Danh sách Phòng ban" (List View) + popup "Thêm mới/Cập nhật" theo SRS
 * §2.2 và §2.4. Primitive lấy từ `catalogUi.tsx`, logic lọc/sắp xếp/phân trang
 * lấy từ `useCatalogList` — dùng chung với IMS-002/003/004.
 *
 * GIAI ĐOẠN NÀY LÀ UI TĨNH. Dữ liệu nằm trong `useState`, chưa gọi API.
 */
const UC = findImsUseCaseByCode('uc_ims_006')!;

/** Sắp xếp mặc định: mới nhất theo CREATED_DATE (SRS Bảng 04, mục "Sắp xếp"). */
const DEFAULT_SORT: SortState = { key: 'createdDate', dir: 'desc' };

function sortValue(row: DepartmentRow, key: string): string | number {
  switch (key) {
    case 'deptCd':
      return row.deptCd.toLowerCase();
    case 'deptName':
      return row.deptNameVn.toLowerCase();
    case 'displayOrderNumber':
      // Bản ghi chưa đặt thứ tự phải xuống cuối khi sắp tăng dần, nên coi null là
      // vô cùng lớn thay vì 0 — 0 sẽ đẩy chúng lên đầu như thể được ưu tiên nhất.
      return row.displayOrderNumber ?? Number.MAX_SAFE_INTEGER;
    case 'description':
      return row.description.toLowerCase();
    case 'statusFlg':
      return row.statusFlg;
    default:
      return row.createdDate;
  }
}

/** Các trường được gộp vào tìm kiếm từ khóa. */
const searchFields = (row: DepartmentRow) => [
  row.deptCd,
  row.deptNameVn,
  row.deptNameEn,
  row.description,
];

export const Ims006PhongBanView: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentRow[]>(() => [...INITIAL_DEPARTMENTS]);

  const list = useCatalogList({
    rows: departments,
    searchFields,
    sortValue,
    defaultSort: DEFAULT_SORT,
  });

  /** `null` = popup đóng; `{ row: null }` = thêm mới; `{ row }` = sửa. */
  const [formTarget, setFormTarget] = useState<{ row: DepartmentRow | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRow | null>(null);

  const { toasts, pushToast } = useToasts();

  /* ------------------------------------------------------------- thao tác */

  const saveDepartment = (draft: DepartmentDraft) => {
    const editing = formTarget?.row ?? null;
    // Prototype chưa có backend nên mốc thời gian lấy từ đồng hồ máy; bản ghi
    // thật sẽ do CSDL đóng dấu CREATED_DATE/UPDATED_DATE.
    const now = new Date().toISOString();

    if (editing) {
      setDepartments((prev) =>
        prev.map((row) =>
          row.id === editing.id
            ? {
                ...row,
                ...draft,
                // §4.1 không có STATUS_FLG: "Trạng thái" trên màn hình LÀ
                // ACTIVE_FLG. Ghi cả hai ở đúng một chỗ này để hai giá trị không
                // thể lệch nhau.
                activeFlg: draft.statusFlg,
                updatedBy: 'nqt.hnx',
                updatedDate: now,
              }
            : row,
        ),
      );
      pushToast('success', `Đã cập nhật phòng ban “${draft.deptNameVn}”`);
    } else {
      const nextId = departments.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      setDepartments((prev) => [
        {
          id: nextId,
          ...draft,
          activeFlg: draft.statusFlg,
          // Cờ tích hợp lấy mặc định của §4.1; không nhập từ giao diện.
          syncFlag: 1,
          isSync: 0,
          deleteFlg: 0,
          createdBy: 'nqt.hnx',
          createdDate: now,
        },
        ...prev,
      ]);
      pushToast('success', `Đã thêm mới phòng ban “${draft.deptNameVn}”`);
    }

    setFormTarget(null);
  };

  /** Xóa mềm: chỉ bật `DELETE_FLG = 1`, không bỏ phần tử khỏi mảng. */
  const deleteDepartment = (row: DepartmentRow) => {
    setDepartments((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, deleteFlg: 1, updatedBy: 'nqt.hnx', updatedDate: new Date().toISOString() }
          : r,
      ),
    );
    setDeleteTarget(null);
    pushToast('danger', `Đã xóa phòng ban “${row.deptNameVn}”`);
  };

  /* --------------------------------------------------------------- render */

  const COL_COUNT = 7;

  return (
    <div className="p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Breadcrumb — đúng đường dẫn màn hình ở SRS §2.1. */}
        <nav className="mb-4 text-xs text-slate-500">{UC.breadcrumb}</nav>

        {/* Toolbar trên: tiêu đề trang + nút Thêm mới. */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#292929]">Phòng ban</h1>
            <p className="mt-1 text-[13px] text-[#525252]">
              Quản lý danh sách và tạo mới phòng ban
              <span className="ml-2 rounded-sm bg-[#E6F4EA] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#00733E]">
                {UC.ucCode}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFormTarget({ row: null })}
            className={`${BTN_PRIMARY} shrink-0`}
          >
            <Plus className="h-4 w-4" />
            Thêm mới
          </button>
        </div>

        {/* Hàng bộ lọc: ô tìm kiếm + trạng thái + Tìm kiếm + Làm mới. */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div className="flex h-9 min-w-65 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 sm:max-w-85">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={list.draftKeyword}
              onChange={(e) => list.setDraftKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') list.applySearch();
              }}
              placeholder="Tìm kiếm Mã, Tên phòng ban..."
              aria-label="Từ khóa tìm kiếm"
              className="w-full border-none bg-transparent text-[13px] text-[#292929] outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={String(list.draftStatus)}
            onChange={(e) =>
              list.setDraftStatus(
                e.target.value === 'all' ? 'all' : (Number(e.target.value) as 0 | 1),
              )
            }
            aria-label="Lọc theo trạng thái"
            className={`${SELECT_CLASS} w-auto`}
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button type="button" onClick={list.applySearch} className={BTN_PRIMARY}>
            <Search className="h-4 w-4" />
            Tìm kiếm
          </button>

          <button type="button" onClick={list.resetFilters} className={BTN_OUTLINE}>
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        {/* Bảng danh sách — cột theo SRS Bảng 04, thêm cột Thứ tự hiển thị (§4.1). */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={`${TH_CLASS} w-15`}>
                  STT
                </th>
                <SortableTh
                  label="Mã Phòng ban"
                  sortKey="deptCd"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <SortableTh
                  label="Tên Phòng ban"
                  sortKey="deptName"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <SortableTh
                  label="Thứ tự hiển thị"
                  sortKey="displayOrderNumber"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <SortableTh
                  label="Mô tả"
                  sortKey="description"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <SortableTh
                  label="Trạng thái"
                  sortKey="statusFlg"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <th scope="col" className={TH_CLASS}>
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {list.pageRows.length === 0 ? (
                <EmptyRow
                  colSpan={COL_COUNT}
                  title="Không tìm thấy dữ liệu"
                  hint="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                />
              ) : (
                list.pageRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC]">
                    <td className={`${TD_CLASS} text-slate-500`}>{list.startIdx + idx + 1}</td>

                    <td className={`${TD_CLASS} font-semibold whitespace-nowrap`}>{row.deptCd}</td>

                    <td className={TD_CLASS}>
                      <div>{row.deptNameVn}</div>
                      {/*
                        SRS Bảng 04 chỉ có một cột "Tên Phòng ban" nhưng CSDL lưu
                        cả tên VN và EN. Hiện tên EN thành dòng phụ; tên EN được
                        phép để trống nên hiện "—" khi rỗng.
                      */}
                      <div className="text-xs text-slate-500">{row.deptNameEn || '—'}</div>
                    </td>

                    <td className={`${TD_CLASS} whitespace-nowrap`}>
                      {row.displayOrderNumber ?? <span className="text-slate-400">—</span>}
                    </td>

                    <td className={TD_CLASS}>
                      {row.description ? (
                        row.description
                      ) : (
                        <span className="text-slate-400">Chưa có mô tả</span>
                      )}
                    </td>

                    <td className={TD_CLASS}>
                      <StatusPill active={row.statusFlg === 1} />
                    </td>

                    <td className={`${TD_CLASS} whitespace-nowrap`}>
                      <button
                        type="button"
                        onClick={() => setFormTarget({ row })}
                        title={`Sửa ${row.deptNameVn}`}
                        aria-label={`Sửa ${row.deptNameVn}`}
                        className="mr-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        title={`Xóa ${row.deptNameVn}`}
                        aria-label={`Xóa ${row.deptNameVn}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-[#802423]/10 hover:text-[#802423]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePager
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          pageSize={list.pageSize}
          onPage={list.setPage}
          onPageSize={list.changePageSize}
        />
      </div>

      {formTarget && (
        <Ims006DepartmentFormModal
          editing={formTarget.row}
          existingCodes={departments
            .filter((r) => r.deleteFlg === 0 && r.id !== formTarget.row?.id)
            .map((r) => r.deptCd)}
          onCancel={() => setFormTarget(null)}
          onSave={saveDepartment}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          recordLabel={`${deleteTarget.deptCd} — ${deleteTarget.deptNameVn}`}
          note="Bản ghi được xóa mềm (DELETE_FLG = 1) và không còn hiển thị trong danh sách."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteDepartment(deleteTarget)}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
};
