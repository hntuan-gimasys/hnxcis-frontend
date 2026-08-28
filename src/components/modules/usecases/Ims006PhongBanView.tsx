/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { findImsUseCaseByCode } from '../../../lib/imsRoutes';
import { exportToCsv } from '../../../lib/exportCsv';
import {
  BTN_PRIMARY,
  CatalogPage,
  CatalogToolbar,
  ColumnSpec,
  ConfirmDeleteDialog,
  EmptyRow,
  SortState,
  SortableTh,
  StatusPill,
  TD_CLASS,
  TH_CLASS,
  TablePager,
  ToastStack,
  useColumnVisibility,
  useToasts,
} from './catalogUi';
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

/** Cột bật/tắt được trên menu `Columns`; nhãn theo file mẫu. */
const COLUMNS: readonly ColumnSpec[] = [
  { key: 'stt', label: 'STT' },
  { key: 'code', label: 'Mã' },
  { key: 'name', label: 'Giá trị' },
  { key: 'order', label: 'Thứ tự' },
  { key: 'description', label: 'Mô tả' },
  { key: 'status', label: 'Trạng thái' },
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

  const columns = useColumnVisibility(COLUMNS);

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

  /**
   * Xuất File — CSV có BOM UTF-8, xuất toàn bộ kết quả lọc (`list.visibleRows`)
   * chứ không phải trang đang xem.
   */
  const exportRows = () => {
    exportToCsv(
      'danh-muc-phong-ban',
      [
        { header: 'Mã', value: (r: DepartmentRow) => r.deptCd },
        { header: 'Tên (VN)', value: (r: DepartmentRow) => r.deptNameVn },
        { header: 'Tên (EN)', value: (r: DepartmentRow) => r.deptNameEn },
        { header: 'Thứ tự', value: (r: DepartmentRow) => r.displayOrderNumber ?? '' },
        { header: 'Mô tả', value: (r: DepartmentRow) => r.description },
        {
          header: 'Trạng thái',
          value: (r: DepartmentRow) => (r.statusFlg === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'),
        },
      ],
      [...list.visibleRows],
    );
    pushToast('success', `Xuất dữ liệu thành công (${list.visibleRows.length} dòng)`);
  };

  /* -------------------------------------------------------------- render */

  return (
    <>
      <CatalogPage
        breadcrumb={UC.breadcrumb}
        heading="Phòng ban"
        subtitle="Quản lý danh sách và tạo mới phòng ban"
        actions={
          <button type="button" onClick={() => setFormTarget({ row: null })} className={BTN_PRIMARY}>
            <Plus className="h-4 w-4" />
            Thêm mới
          </button>
        }
      >
        <CatalogToolbar
          keyword={list.draftKeyword}
          onKeyword={list.setDraftKeyword}
          onSearch={list.applySearch}
          searchPlaceholder="Tìm kiếm Mã, Giá trị..."
          status={list.draftStatus}
          onStatus={list.applyStatus}
          columns={columns}
          onExport={exportRows}
        />

        {/* Bảng danh sách — cột theo SRS Bảng 04, thêm cột Thứ tự (§4.1). */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.isVisible('stt') && (
                  <th scope="col" className={`${TH_CLASS} w-15 text-center`}>
                    STT
                  </th>
                )}
                {columns.isVisible('code') && (
                  <SortableTh
                    label="Mã"
                    sortKey="deptCd"
                    sort={list.sort}
                    onSort={list.changeSort}
                  />
                )}
                {columns.isVisible('name') && (
                  <SortableTh
                    label="Giá trị"
                    sortKey="deptName"
                    sort={list.sort}
                    onSort={list.changeSort}
                  />
                )}
                {columns.isVisible('order') && (
                  <SortableTh
                    label="Thứ tự"
                    sortKey="displayOrderNumber"
                    sort={list.sort}
                    onSort={list.changeSort}
                  />
                )}
                {columns.isVisible('description') && (
                  <SortableTh
                    label="Mô tả"
                    sortKey="description"
                    sort={list.sort}
                    onSort={list.changeSort}
                  />
                )}
                {columns.isVisible('status') && (
                  <SortableTh
                    label="Trạng thái"
                    sortKey="statusFlg"
                    sort={list.sort}
                    onSort={list.changeSort}
                  />
                )}
                <th scope="col" className={TH_CLASS}>
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {list.pageRows.length === 0 ? (
                <EmptyRow
                  colSpan={columns.visibleCount + 1}
                  title="Không tìm thấy dữ liệu"
                  hint="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                />
              ) : (
                list.pageRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC]">
                    {columns.isVisible('stt') && (
                      <td className={`${TD_CLASS} text-center text-slate-500`}>
                        {list.startIdx + idx + 1}
                      </td>
                    )}

                    {columns.isVisible('code') && (
                      <td className={`${TD_CLASS} font-semibold whitespace-nowrap`}>{row.deptCd}</td>
                    )}

                    {columns.isVisible('name') && (
                      <td className={TD_CLASS}>
                        <div>{row.deptNameVn}</div>
                        {/*
                          SRS Bảng 04 chỉ có một cột "Tên Phòng ban" nhưng CSDL lưu
                          cả tên VN và EN. Hiện tên EN thành dòng phụ; tên EN được
                          phép để trống nên hiện "—" khi rỗng.
                        */}
                        <div className="text-xs text-slate-500">{row.deptNameEn || '—'}</div>
                      </td>
                    )}

                    {columns.isVisible('order') && (
                      <td className={`${TD_CLASS} whitespace-nowrap`}>
                        {row.displayOrderNumber ?? <span className="text-slate-400">—</span>}
                      </td>
                    )}

                    {columns.isVisible('description') && (
                      <td className={TD_CLASS}>
                        {row.description ? (
                          row.description
                        ) : (
                          <span className="text-slate-400">Chưa có mô tả</span>
                        )}
                      </td>
                    )}

                    {columns.isVisible('status') && (
                      <td className={TD_CLASS}>
                        <StatusPill active={row.statusFlg === 1} />
                      </td>
                    )}

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
      </CatalogPage>

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
    </>
  );
};
