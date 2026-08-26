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
import { CountryDraft, Ims002CountryFormModal } from './Ims002CountryFormModal';
import { CountryRow, INITIAL_COUNTRIES } from './ims002CountryMock';

/**
 * SRS: `docs/srs/[IMS-002] Quản lý danh mục Quốc gia.md`
 *
 * Màn hình "Danh sách Quốc gia" (List View) + popup "Thêm mới/Cập nhật" theo SRS
 * §2.2 và §2.4. Bố cục lấy từ file mẫu `docs/quan-ly-danh-muc_2.html`: breadcrumb
 * → tiêu đề + nút Thêm mới → hàng bộ lọc → bảng → chân bảng phân trang.
 *
 * GIAI ĐOẠN NÀY LÀ UI TĨNH. Toàn bộ dữ liệu nằm trong `useState`, chưa gọi API.
 * Các endpoint đã có trong SRS §5.2 (`POST /lookup-values/search`,
 * `POST /lookup-values`, `PUT /lookup-values/{id}`) sẽ thay bốn hàm xử lý bên
 * dưới mà không phải sửa phần hiển thị.
 */
const UC = findImsUseCaseByCode('uc_ims_002')!;

/**
 * Sắp xếp mặc định: mới nhất theo CREATED_DATE (SRS Bảng 04, mục "Sắp xếp").
 * Đây là thứ tự khi người dùng chưa bấm vào cột nào.
 */
const DEFAULT_SORT: SortState = { key: 'createdDate', dir: 'desc' };

/** Giá trị dùng để so sánh khi sắp xếp, theo từng cột của bảng. */
function sortValue(row: CountryRow, key: string): string | number {
  switch (key) {
    case 'countryCd':
      return row.countryCd.toLowerCase();
    case 'countryName':
      return row.countryNameVi.toLowerCase();
    case 'description':
      return row.description.toLowerCase();
    case 'statusFlg':
      return row.statusFlg;
    default:
      return row.createdDate;
  }
}

/**
 * Các trường được gộp vào tìm kiếm từ khóa.
 *
 * SRS nói tìm theo mã và tên. Gộp thêm mô tả vì đó là cột đang hiển thị và người
 * dùng sẽ tìm bằng những gì họ nhìn thấy.
 */
const searchFields = (row: CountryRow) => [
  row.countryCd,
  row.countryNameVi,
  row.countryNameEn,
  row.description,
];

export const Ims002QuocGiaView: React.FC = () => {
  const [countries, setCountries] = useState<CountryRow[]>(() => [...INITIAL_COUNTRIES]);

  /**
   * Lọc, sắp xếp, phân trang và luật "chỉ tìm khi bấm Tìm kiếm/Enter" nằm ở
   * `useCatalogList` — dùng chung với IMS-003 và IMS-004.
   */
  const list = useCatalogList({
    rows: countries,
    searchFields,
    sortValue,
    defaultSort: DEFAULT_SORT,
  });

  /** `null` = popup đóng; `{ row: null }` = thêm mới; `{ row }` = sửa. */
  const [formTarget, setFormTarget] = useState<{ row: CountryRow | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CountryRow | null>(null);

  const { toasts, pushToast } = useToasts();

  /* ------------------------------------------------------------ thao tác */

  const saveCountry = (draft: CountryDraft) => {
    const editing = formTarget?.row ?? null;
    // Prototype chưa có backend nên mốc thời gian lấy từ đồng hồ máy; bản ghi
    // thật sẽ do CSDL đóng dấu CREATED_DATE/UPDATED_DATE.
    const now = new Date().toISOString();

    if (editing) {
      setCountries((prev) =>
        prev.map((row) =>
          row.id === editing.id
            ? { ...row, ...draft, updatedBy: 'nqt.hnx', updatedDate: now }
            : row,
        ),
      );
      pushToast('success', `Đã cập nhật quốc gia “${draft.countryNameVi}”`);
    } else {
      const nextId = countries.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      setCountries((prev) => [
        {
          id: nextId,
          ...draft,
          // Bản ghi mới mặc định hoạt động và chưa bị xóa (SRS §4.1).
          activeFlg: 1,
          deleteFlg: 0,
          createdBy: 'nqt.hnx',
          createdDate: now,
        },
        ...prev,
      ]);
      pushToast('success', `Đã thêm mới quốc gia “${draft.countryNameVi}”`);
    }

    setFormTarget(null);
  };

  /** Xóa mềm: chỉ bật `DELETE_FLG = 1`, không bỏ phần tử khỏi mảng. */
  const deleteCountry = (row: CountryRow) => {
    setCountries((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, deleteFlg: 1, updatedBy: 'nqt.hnx', updatedDate: new Date().toISOString() }
          : r,
      ),
    );
    setDeleteTarget(null);
    pushToast('danger', `Đã xóa quốc gia “${row.countryNameVi}”`);
  };

  /* -------------------------------------------------------------- render */

  const COL_COUNT = 6;

  return (
    <div className="p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Breadcrumb — đúng đường dẫn màn hình ở SRS §2.1. */}
        <nav className="mb-4 text-xs text-slate-500">{UC.breadcrumb}</nav>

        {/* Toolbar trên: tiêu đề trang + nút Thêm mới. */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quốc gia</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Quản lý danh sách và tạo mới quốc gia
              <span className="ml-2 rounded-sm bg-hnx-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-hnx-800">
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
          <div className="flex h-9 min-w-65 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 sm:max-w-85">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={list.draftKeyword}
              onChange={(e) => list.setDraftKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') list.applySearch();
              }}
              placeholder="Tìm kiếm Mã, Tên quốc gia..."
              aria-label="Từ khóa tìm kiếm"
              className="w-full border-none bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
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

        {/* Bảng danh sách — các cột theo SRS Bảng 04. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={`${TH_CLASS} w-15`}>
                  STT
                </th>
                <SortableTh
                  label="Mã Quốc gia"
                  sortKey="countryCd"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <SortableTh
                  label="Tên Quốc gia"
                  sortKey="countryName"
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
                  <tr key={row.id} className="hover:bg-hnx-50/60">
                    <td className={`${TD_CLASS} text-slate-500`}>{list.startIdx + idx + 1}</td>

                    <td className={`${TD_CLASS} font-semibold whitespace-nowrap`}>
                      {row.countryCd}
                    </td>

                    <td className={TD_CLASS}>
                      <div>{row.countryNameVi}</div>
                      {/*
                        SRS Bảng 04 chỉ có một cột "Tên Quốc gia" nhưng CSDL lưu
                        cả tên VI và EN. Hiện tên EN thành dòng phụ để không phải
                        thêm cột ngoài đặc tả mà vẫn thấy đủ dữ liệu.
                      */}
                      <div className="text-xs text-slate-500">{row.countryNameEn}</div>
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
                        title={`Sửa ${row.countryNameVi}`}
                        aria-label={`Sửa ${row.countryNameVi}`}
                        className="mr-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        title={`Xóa ${row.countryNameVi}`}
                        aria-label={`Xóa ${row.countryNameVi}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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
        <Ims002CountryFormModal
          editing={formTarget.row}
          existingCodes={countries
            .filter((r) => r.deleteFlg === 0 && r.id !== formTarget.row?.id)
            .map((r) => r.countryCd)}
          onCancel={() => setFormTarget(null)}
          onSave={saveCountry}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          recordLabel={`${deleteTarget.countryCd} — ${deleteTarget.countryNameVi}`}
          note="Bản ghi được xóa mềm (DELETE_FLG = 1) và không còn hiển thị trong danh sách."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteCountry(deleteTarget)}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
};
