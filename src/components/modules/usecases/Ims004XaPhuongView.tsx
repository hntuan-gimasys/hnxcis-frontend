/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
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
import { Ims004WardFormModal, WardDraft } from './Ims004WardFormModal';
import { INITIAL_PROVINCES } from './ims003ProvinceMock';
import { INITIAL_WARDS, WardRow } from './ims004WardMock';

/**
 * SRS: `docs/srs/[IMS-004] Quản lý danh mục Xã phường.md`
 *
 * Màn hình "Danh sách Phường xã" (List View) + popup "Thêm mới/Cập nhật" theo SRS
 * §2.2 và §2.4. Bố cục và các primitive lấy từ `catalogUi.tsx`, logic lọc/sắp
 * xếp/phân trang lấy từ `useCatalogList` — dùng chung với IMS-002 và IMS-003.
 *
 * GIAI ĐOẠN NÀY LÀ UI TĨNH. Dữ liệu nằm trong `useState`, chưa gọi API.
 */
const UC = findImsUseCaseByCode('uc_ims_004')!;

/** Sắp xếp mặc định: mới nhất theo CREATED_DATE (SRS Bảng 04, mục "Sắp xếp"). */
const DEFAULT_SORT: SortState = { key: 'createdDate', dir: 'desc' };

function sortValue(row: WardRow, key: string): string | number {
  switch (key) {
    case 'wardCd':
      return row.wardCd.toLowerCase();
    case 'wardName':
      return row.wardNameVn.toLowerCase();
    case 'provinceCd':
      return row.provinceCd.toLowerCase();
    case 'description':
      return row.description.toLowerCase();
    case 'statusFlg':
      return row.statusFlg;
    default:
      return row.createdDate;
  }
}

/** Các trường được gộp vào tìm kiếm từ khóa. */
const searchFields = (row: WardRow) => [
  row.wardCd,
  row.wardNameVn,
  row.wardNameEn,
  row.description,
];

export const Ims004XaPhuongView: React.FC = () => {
  const [wards, setWards] = useState<WardRow[]>(() => [...INITIAL_WARDS]);

  /**
   * Danh mục Tỉnh thành làm nguồn cho khóa ngoại `PROVINCE_CD`.
   *
   * Ở prototype này đọc trực tiếp mock của IMS-003 — hai danh mục nằm trong cùng
   * một hệ thống, nên nối thẳng đúng hơn là nhân đôi danh sách tỉnh/thành. Khi có
   * API thật thì đây là chỗ gọi `GET` danh mục Tỉnh thành.
   *
   * Lọc theo đúng luật SRS cho TRƯỜNG THAM CHIẾU: "chỉ lấy các bản ghi có
   * DELETE_FLG = 0 và ACTIVE_FLG = 1" — tỉnh/thành đã ngừng hoạt động không được
   * chọn cho bản ghi mới.
   */
  const provinceOptions = useMemo(
    () => INITIAL_PROVINCES.filter((p) => p.deleteFlg === 0 && p.activeFlg === 1),
    [],
  );

  /**
   * Nguồn cho BỘ LỌC trên toolbar — khác `provinceOptions` ở chỗ vẫn giữ các
   * tỉnh/thành đã ngừng hoạt động.
   *
   * Luật "chỉ lấy ACTIVE_FLG = 1" của SRS áp cho trường tham chiếu khi NHẬP dữ
   * liệu. Bộ lọc là truy vấn: chặn lọc theo tỉnh đã ngừng hoạt động sẽ khiến các
   * phường/xã thuộc tỉnh đó không thể tra ra được nữa.
   */
  const provinceFilterOptions = useMemo(
    () => INITIAL_PROVINCES.filter((p) => p.deleteFlg === 0),
    [],
  );

  /** Tra tên tỉnh/thành để hiển thị — tra trong TOÀN BỘ danh mục. */
  const provinceNameOf = (provinceCd: string) =>
    INITIAL_PROVINCES.find((p) => p.provinceCd === provinceCd)?.provinceNameVn ?? '';

  /**
   * Bộ lọc cấp cha có state riêng, tách khỏi `useCatalogList`.
   *
   * Vẫn theo cùng một luật của SRS ("chỉ lọc khi bấm Tìm kiếm/Enter"): `draft` là
   * lựa chọn đang hiển thị trên dropdown, `applied` là điều kiện đang lọc thật.
   */
  const [draftProvince, setDraftProvince] = useState<string>('all');
  const [appliedProvince, setAppliedProvince] = useState<string>('all');

  /**
   * Thu hẹp tập bản ghi TRƯỚC khi đưa vào `useCatalogList`, để hook chỉ phải lo
   * từ khóa, trạng thái, sắp xếp và phân trang như hai màn hình còn lại.
   */
  const scopedWards = useMemo(
    () =>
      appliedProvince === 'all' ? wards : wards.filter((w) => w.provinceCd === appliedProvince),
    [wards, appliedProvince],
  );

  const list = useCatalogList({
    rows: scopedWards,
    searchFields,
    sortValue,
    defaultSort: DEFAULT_SORT,
  });

  /** `null` = popup đóng; `{ row: null }` = thêm mới; `{ row }` = sửa. */
  const [formTarget, setFormTarget] = useState<{ row: WardRow | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WardRow | null>(null);

  const { toasts, pushToast } = useToasts();

  /* ------------------------------------------------------------- thao tác */

  /** Áp dụng cùng lúc bộ lọc cấp cha và các điều kiện do hook quản lý. */
  const applySearch = () => {
    setAppliedProvince(draftProvince);
    list.applySearch();
  };

  const resetFilters = () => {
    setDraftProvince('all');
    setAppliedProvince('all');
    list.resetFilters();
  };

  const saveWard = (draft: WardDraft) => {
    const editing = formTarget?.row ?? null;
    // Prototype chưa có backend nên mốc thời gian lấy từ đồng hồ máy; bản ghi
    // thật sẽ do CSDL đóng dấu CREATED_DATE/UPDATED_DATE.
    const now = new Date().toISOString();

    if (editing) {
      setWards((prev) =>
        prev.map((row) =>
          row.id === editing.id
            ? { ...row, ...draft, updatedBy: 'nqt.hnx', updatedDate: now }
            : row,
        ),
      );
      pushToast('success', `Đã cập nhật phường xã “${draft.wardNameVn}”`);
    } else {
      const nextId = wards.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      setWards((prev) => [
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
      pushToast('success', `Đã thêm mới phường xã “${draft.wardNameVn}”`);
    }

    setFormTarget(null);
  };

  /** Xóa mềm: chỉ bật `DELETE_FLG = 1`, không bỏ phần tử khỏi mảng. */
  const deleteWard = (row: WardRow) => {
    setWards((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, deleteFlg: 1, updatedBy: 'nqt.hnx', updatedDate: new Date().toISOString() }
          : r,
      ),
    );
    setDeleteTarget(null);
    pushToast('danger', `Đã xóa phường xã “${row.wardNameVn}”`);
  };

  /* --------------------------------------------------------------- render */

  const COL_COUNT = 7;

  return (
    <div className="p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Breadcrumb — đúng đường dẫn màn hình ở SRS §2.1. */}
        <nav className="mb-4 text-xs text-slate-500">{UC.breadcrumb}</nav>

        {/* Toolbar trên: tiêu đề trang + nút Thêm mới. */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Phường xã</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Quản lý danh sách và tạo mới phường xã
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

        {/* Hàng bộ lọc: từ khóa + Tỉnh/Thành (cấp cha) + trạng thái + hai nút. */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div className="flex h-9 min-w-65 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 sm:max-w-85">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={list.draftKeyword}
              onChange={(e) => list.setDraftKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
              placeholder="Tìm kiếm Mã, Tên phường xã..."
              aria-label="Từ khóa tìm kiếm"
              className="w-full border-none bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={draftProvince}
            onChange={(e) => setDraftProvince(e.target.value)}
            aria-label="Lọc theo tỉnh thành"
            className={`${SELECT_CLASS} w-auto`}
          >
            <option value="all">Tất cả tỉnh thành</option>
            {provinceFilterOptions.map((p) => (
              <option key={p.provinceCd} value={p.provinceCd}>
                {p.provinceCd} — {p.provinceNameVn}
              </option>
            ))}
          </select>

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

          <button type="button" onClick={applySearch} className={BTN_PRIMARY}>
            <Search className="h-4 w-4" />
            Tìm kiếm
          </button>

          <button type="button" onClick={resetFilters} className={BTN_OUTLINE}>
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        {/* Bảng danh sách — các cột theo SRS Bảng 04, thêm cột Tỉnh/Thành (FK). */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={`${TH_CLASS} w-15`}>
                  STT
                </th>
                <SortableTh
                  label="Mã Phường xã"
                  sortKey="wardCd"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <SortableTh
                  label="Tên Phường xã"
                  sortKey="wardName"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                <SortableTh
                  label="Tỉnh/Thành"
                  sortKey="provinceCd"
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

                    <td className={`${TD_CLASS} font-semibold whitespace-nowrap`}>{row.wardCd}</td>

                    <td className={TD_CLASS}>
                      <div>{row.wardNameVn}</div>
                      {/*
                        SRS Bảng 04 chỉ có một cột "Tên Phường xã" nhưng CSDL lưu
                        cả tên VN và EN. Hiện tên EN thành dòng phụ; tên EN được
                        phép để trống nên hiện "—" khi rỗng.
                      */}
                      <div className="text-xs text-slate-500">{row.wardNameEn || '—'}</div>
                    </td>

                    <td className={`${TD_CLASS} whitespace-nowrap`}>
                      {row.provinceCd ? (
                        <>
                          <div>{row.provinceCd}</div>
                          <div className="text-xs text-slate-500">
                            {provinceNameOf(row.provinceCd)}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">Chưa gán</span>
                      )}
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
                        title={`Sửa ${row.wardNameVn}`}
                        aria-label={`Sửa ${row.wardNameVn}`}
                        className="mr-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        title={`Xóa ${row.wardNameVn}`}
                        aria-label={`Xóa ${row.wardNameVn}`}
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
        <Ims004WardFormModal
          editing={formTarget.row}
          provinceOptions={provinceOptions}
          existingCodes={wards
            .filter((r) => r.deleteFlg === 0 && r.id !== formTarget.row?.id)
            .map((r) => r.wardCd)}
          onCancel={() => setFormTarget(null)}
          onSave={saveWard}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          recordLabel={`${deleteTarget.wardCd} — ${deleteTarget.wardNameVn}`}
          note="Bản ghi được xóa mềm (DELETE_FLG = 1) và không còn hiển thị trong danh sách."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteWard(deleteTarget)}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
};
