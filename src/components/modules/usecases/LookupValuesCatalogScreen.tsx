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
import { LookupValueDraft, LookupValueFormModal } from './LookupValueFormModal';
import { LookupValueRow } from './lookupValuesMock';

/**
 * Màn hình danh mục dùng chung cho các UC dựa trên bảng `LOOKUP_VALUES`.
 *
 * VÌ SAO MỘT MÀN HÌNH CHO HAI UC
 *
 * [HNX-SRS] Quản lý Chức vụ và [IMS-008] Loại hình doanh nghiệp có Bảng 04 giống
 * nhau ĐẾN TỪNG DÒNG: cùng năm nút (Làm mới, Tìm kiếm, Sắp xếp, Thêm, Sửa, Xóa),
 * cùng bốn cột (STT căn giữa, Mã, Giá trị, Mô tả), cùng luật "sort tại các cột
 * Mã, Giá trị", cùng câu "Mặc định danh sách sắp xếp theo Ngày cập nhật", cùng
 * thông báo rỗng "Không có dữ liệu". Khác nhau duy nhất là `LOV_GROUP` và nhãn.
 *
 * Dựng hai màn hình riêng nghĩa là hai chỗ để lệch nhau về sau, trong khi tài
 * liệu nói rõ chúng là một khuôn.
 *
 * KHÁC BIỆT SO VỚI IMS-002/003/004/006 (bốn UC có bảng riêng):
 *
 *   - Sắp xếp mặc định theo NGÀY CẬP NHẬT, không phải ngày tạo.
 *   - Chỉ hai cột được sắp xếp (Mã, Giá trị); Mô tả và Trạng thái thì không.
 *   - Thông báo rỗng là "Không có dữ liệu" (Vn) / "No data" (En), không phải
 *     "Không tìm thấy dữ liệu".
 *   - Cột STT căn giữa (Bảng 04, ràng buộc "Hiển thị căn giữa").
 */

export interface LookupCatalogConfig {
  /** Mã module trong `imsRoutes.ts`, dùng để lấy breadcrumb và mã UC. */
  readonly moduleCode: string;
  /** Tiêu đề trang. VD: "Chức vụ". */
  readonly heading: string;
  /** Dòng mô tả dưới tiêu đề. */
  readonly subtitle: string;
  /** Nhãn dùng trong tiêu đề popup và thông báo toast. VD: "chức vụ". */
  readonly entityLabel: string;
  /** `LOV_GROUP` của danh mục — hằng số, không sửa từ giao diện. */
  readonly lovGroup: string;
  /** Nhãn cột quan hệ cha trên bảng. VD: "Chức vụ cấp trên". */
  readonly parentColumnLabel: string;
  readonly searchPlaceholder: string;
  readonly initialRows: readonly LookupValueRow[];
}

/**
 * Sắp xếp mặc định: NGÀY CẬP NHẬT giảm dần.
 *
 * Bảng 04 của cả hai UC ghi: "Mặc định danh sách sắp xếp theo Ngày cập nhật.
 * Trong trường hợp bấm nút Reload của trình duyệt thì danh sách vẫn hiển thị sắp
 * xếp theo Ngày cập nhật."
 */
const DEFAULT_SORT: SortState = { key: 'updatedDate', dir: 'desc' };

function sortValue(row: LookupValueRow, key: string): string | number {
  switch (key) {
    case 'code':
      return row.code.toLowerCase();
    case 'value':
      return row.value.toLowerCase();
    default:
      // Bản ghi chưa từng sửa thì không có UPDATED_DATE; lấy ngày tạo thay thế,
      // nếu không chúng sẽ dồn hết về một đầu danh sách bất kể thực tế.
      return row.updatedDate ?? row.createdDate;
  }
}

/**
 * Từ khóa tìm gần đúng theo CODE, VALUE và DESCRIPTION — đúng ba dòng
 * "Mô tả các chỉ tiêu tìm kiếm" ở Bảng 04.
 */
const searchFields = (row: LookupValueRow) => [row.code, row.value, row.description];

export const LookupValuesCatalogScreen: React.FC<{ config: LookupCatalogConfig }> = ({
  config,
}) => {
  const UC = findImsUseCaseByCode(config.moduleCode)!;

  const [rows, setRows] = useState<LookupValueRow[]>(() => [...config.initialRows]);

  const list = useCatalogList({
    rows,
    searchFields,
    sortValue,
    defaultSort: DEFAULT_SORT,
  });

  /** `null` = popup đóng; `{ row: null }` = thêm mới; `{ row }` = sửa. */
  const [formTarget, setFormTarget] = useState<{ row: LookupValueRow | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LookupValueRow | null>(null);

  const { toasts, pushToast } = useToasts();

  /** Tra tên bản ghi cha để hiển thị — tra trong TOÀN BỘ danh mục. */
  const parentLabelOf = (parentId: number | null) => {
    if (parentId === null) return null;
    const parent = rows.find((r) => r.id === parentId);
    return parent ? `${parent.code} — ${parent.value}` : `#${parentId}`;
  };

  /**
   * Nguồn cho ô chọn cha.
   *
   * Lọc theo luật SRS cho trường tham chiếu (`DELETE_FLG = 0`, `ACTIVE_FLG = 1`)
   * và loại chính bản ghi đang sửa — một bản ghi không thể là cha của chính nó.
   */
  const parentOptions = useMemo(() => {
    const editingId = formTarget?.row?.id;
    return rows.filter((r) => r.deleteFlg === 0 && r.activeFlg === 1 && r.id !== editingId);
  }, [rows, formTarget]);

  /* ------------------------------------------------------------- thao tác */

  const saveRow = (draft: LookupValueDraft) => {
    const editing = formTarget?.row ?? null;
    // Prototype chưa có backend nên mốc thời gian lấy từ đồng hồ máy; bản ghi
    // thật sẽ do CSDL đóng dấu CREATED_DATE/UPDATED_DATE.
    const now = new Date().toISOString();

    if (editing) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === editing.id
            ? {
                ...row,
                ...draft,
                // §4.1 không có cột trạng thái nào; giữ activeFlg khớp statusFlg
                // ở đúng một chỗ này để hai giá trị không thể lệch nhau.
                activeFlg: draft.statusFlg,
                updatedBy: 'nqt.hnx',
                updatedDate: now,
              }
            : row,
        ),
      );
      pushToast('success', `Đã cập nhật ${config.entityLabel} “${draft.value}”`);
    } else {
      const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      setRows((prev) => [
        {
          id: nextId,
          ...draft,
          // LOV_GROUP là hằng số của màn hình, gán ở đây chứ không lấy từ form.
          lovGroup: config.lovGroup,
          menusId: null,
          // Bảng 04 của HNX-SRS và IMS-008 không có cột "Thứ tự" nên form này
          // không thu; bản ghi mới để trống, sửa được ở màn hình [IMS-015].
          displayOrder: null,
          activeFlg: draft.statusFlg,
          deleteFlg: 0,
          createdBy: 'nqt.hnx',
          createdDate: now,
        },
        ...prev,
      ]);
      pushToast('success', `Đã thêm mới ${config.entityLabel} “${draft.value}”`);
    }

    setFormTarget(null);
  };

  /**
   * Xóa mềm: chỉ bật `DELETE_FLG = 1`, không bỏ phần tử khỏi mảng.
   *
   * Khớp với ràng buộc ở Bảng 04: "Không cho phép xóa cứng, chỉ vô hiệu hóa
   * (inactive)" — nên đồng thời tắt `ACTIVE_FLG` và `STATUS_FLG`.
   */
  const deleteRow = (row: LookupValueRow) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              deleteFlg: 1,
              activeFlg: 0,
              statusFlg: 0,
              updatedBy: 'nqt.hnx',
              updatedDate: new Date().toISOString(),
            }
          : r,
      ),
    );
    setDeleteTarget(null);
    pushToast('danger', `Đã xóa ${config.entityLabel} “${row.value}”`);
  };

  /* --------------------------------------------------------------- render */

  const COL_COUNT = 7;

  return (
    <div className="p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Breadcrumb — đúng đường dẫn màn hình ở SRS §2.1. */}
        <nav className="mb-4 text-xs text-slate-500">{UC.breadcrumb}</nav>

        {/* Toolbar trên: tiêu đề trang + nút Thêm. */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{config.heading}</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              {config.subtitle}
              <span className="ml-2 rounded-sm bg-hnx-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-hnx-800">
                {UC.ucCode}
              </span>
              {/*
                Hiện LOV_GROUP ngay trên màn hình: đây là danh mục dùng chung bảng
                LOOKUP_VALUES với nhiều nhóm khác, nên biết mình đang xem nhóm nào
                là thông tin cần thiết chứ không phải chi tiết kỹ thuật.
              */}
              <span className="ml-1.5 rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                LOV_GROUP = {config.lovGroup}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFormTarget({ row: null })}
            className={`${BTN_PRIMARY} shrink-0`}
          >
            <Plus className="h-4 w-4" />
            Thêm
          </button>
        </div>

        {/* Hàng bộ lọc: từ khóa (CODE/VALUE/DESCRIPTION) + trạng thái + hai nút. */}
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
              placeholder={config.searchPlaceholder}
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

        {/* Bảng danh sách — bốn cột theo Bảng 04, thêm Trạng thái và Cấp trên. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* Bảng 04: STT "Hiển thị căn giữa". */}
                <th scope="col" className={`${TH_CLASS} w-15 text-center`}>
                  STT
                </th>
                <SortableTh label="Mã" sortKey="code" sort={list.sort} onSort={list.changeSort} />
                <SortableTh
                  label="Giá trị"
                  sortKey="value"
                  sort={list.sort}
                  onSort={list.changeSort}
                />
                {/*
                  Mô tả và Trạng thái KHÔNG sắp xếp được: Bảng 04 chỉ cho phép
                  "sort tại các cột: Mã; Giá trị". Khác với IMS-002/003/004/006.
                */}
                <th scope="col" className={TH_CLASS}>
                  {config.parentColumnLabel}
                </th>
                <th scope="col" className={TH_CLASS}>
                  Mô tả
                </th>
                <th scope="col" className={TH_CLASS}>
                  Trạng thái
                </th>
                <th scope="col" className={TH_CLASS}>
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {list.pageRows.length === 0 ? (
                /* Bảng 04: thông báo rỗng là "Không có dữ liệu" / "No data". */
                <EmptyRow
                  colSpan={COL_COUNT}
                  title="Không có dữ liệu"
                  hint="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                />
              ) : (
                list.pageRows.map((row, idx) => {
                  const parentLabel = parentLabelOf(row.lookupParentId);

                  return (
                    <tr key={row.id} className="hover:bg-hnx-50/60">
                      <td className={`${TD_CLASS} text-center text-slate-500`}>
                        {list.startIdx + idx + 1}
                      </td>

                      <td className={`${TD_CLASS} font-semibold whitespace-nowrap`}>{row.code}</td>

                      <td className={TD_CLASS}>{row.value}</td>

                      <td className={TD_CLASS}>
                        {parentLabel ?? <span className="text-slate-400">—</span>}
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
                          title={`Sửa ${row.value}`}
                          aria-label={`Sửa ${row.value}`}
                          className="mr-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          title={`Xóa ${row.value}`}
                          aria-label={`Xóa ${row.value}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
        <LookupValueFormModal
          editing={formTarget.row}
          entityLabel={config.heading}
          parentOptions={parentOptions}
          existingCodes={rows
            .filter((r) => r.deleteFlg === 0 && r.id !== formTarget.row?.id)
            .map((r) => r.code)}
          onCancel={() => setFormTarget(null)}
          onSave={saveRow}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          recordLabel={`${deleteTarget.code} — ${deleteTarget.value}`}
          note="SRS không cho xóa cứng: bản ghi chỉ bị vô hiệu hóa và ẩn khỏi danh sách."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteRow(deleteTarget)}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
};
