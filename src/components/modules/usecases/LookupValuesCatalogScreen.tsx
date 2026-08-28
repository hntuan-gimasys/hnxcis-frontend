/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
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
  /** Mã module trong `imsRoutes.ts`, dùng để lấy tên danh mục và mã UC. */
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

  /**
   * Cột bật/tắt được trên menu `Columns`.
   *
   * Dựng trong component vì nhãn cột quan hệ cha do `config` quyết định ("Chức vụ
   * cấp trên" / "Loại hình cấp trên") — hai UC dùng chung màn hình này nhưng gọi
   * quan hệ đó bằng hai cái tên.
   */
  const columnSpecs: readonly ColumnSpec[] = useMemo(
    () => [
      { key: 'stt', label: 'STT' },
      { key: 'code', label: 'Mã' },
      { key: 'value', label: 'Giá trị' },
      { key: 'parent', label: config.parentColumnLabel },
      { key: 'description', label: 'Mô tả' },
      { key: 'status', label: 'Trạng thái' },
    ],
    [config.parentColumnLabel],
  );

  const columns = useColumnVisibility(columnSpecs);

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

  /**
   * Xuất File — CSV có BOM UTF-8 qua `lib/exportCsv.ts`.
   *
   * Bảng 04 của cả hai UC không nêu nút xuất file; nút này đến từ khuôn giao diện
   * dùng chung (file mẫu `docs/quan-ly-danh-muc_2.html`). Xuất theo
   * `list.visibleRows` — toàn bộ kết quả lọc, không phải trang đang xem.
   */
  const exportRows = () => {
    exportToCsv(
      `danh-muc-${config.lovGroup.toLowerCase()}`,
      [
        { header: 'Mã', value: (r: LookupValueRow) => r.code },
        { header: 'Giá trị', value: (r: LookupValueRow) => r.value },
        {
          header: config.parentColumnLabel,
          value: (r: LookupValueRow) => parentLabelOf(r.lookupParentId) ?? '',
        },
        { header: 'Mô tả', value: (r: LookupValueRow) => r.description },
        {
          header: 'Trạng thái',
          value: (r: LookupValueRow) => (r.statusFlg === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'),
        },
      ],
      [...list.visibleRows],
    );
    pushToast('success', `Xuất dữ liệu thành công (${list.visibleRows.length} dòng)`);
  };

  /* --------------------------------------------------------------- render */

  return (
    <>
      <CatalogPage
        catalogName={UC.menuLabel}
        heading={config.heading}
        subtitle={
          <>
            {config.subtitle}
            {/*
              Hiện LOV_GROUP ngay trên màn hình: đây là danh mục dùng chung bảng
              LOOKUP_VALUES với nhiều nhóm khác, nên biết mình đang xem nhóm nào
              là thông tin cần thiết chứ không phải chi tiết kỹ thuật.
            */}
            <span className="ml-2 rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#525252]">
              LOV_GROUP = {config.lovGroup}
            </span>
          </>
        }
        actions={
          <button type="button" onClick={() => setFormTarget({ row: null })} className={BTN_PRIMARY}>
            <Plus className="h-4 w-4" />
            Thêm
          </button>
        }
      >
        <CatalogToolbar
          keyword={list.draftKeyword}
          onKeyword={list.setDraftKeyword}
          onSearch={list.applySearch}
          searchPlaceholder={config.searchPlaceholder}
          status={list.draftStatus}
          onStatus={list.applyStatus}
          columns={columns}
          onExport={exportRows}
        />

        {/* Bảng danh sách — bốn cột theo Bảng 04, thêm Trạng thái và Cấp trên. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* Bảng 04: STT "Hiển thị căn giữa". */}
                {columns.isVisible('stt') && (
                  <th scope="col" className={`${TH_CLASS} w-15 text-center`}>
                    STT
                  </th>
                )}
                {columns.isVisible('code') && (
                  <SortableTh label="Mã" sortKey="code" sort={list.sort} onSort={list.changeSort} />
                )}
                {columns.isVisible('value') && (
                  <SortableTh
                    label="Giá trị"
                    sortKey="value"
                    sort={list.sort}
                    onSort={list.changeSort}
                  />
                )}
                {/*
                  Mô tả và Trạng thái KHÔNG sắp xếp được: Bảng 04 chỉ cho phép
                  "sort tại các cột: Mã; Giá trị". Khác với IMS-002/003/004/006.
                */}
                {columns.isVisible('parent') && (
                  <th scope="col" className={TH_CLASS}>
                    {config.parentColumnLabel}
                  </th>
                )}
                {columns.isVisible('description') && (
                  <th scope="col" className={TH_CLASS}>
                    Mô tả
                  </th>
                )}
                {columns.isVisible('status') && (
                  <th scope="col" className={TH_CLASS}>
                    Trạng thái
                  </th>
                )}
                <th scope="col" className={TH_CLASS}>
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {list.pageRows.length === 0 ? (
                /* Bảng 04: thông báo rỗng là "Không có dữ liệu" / "No data". */
                <EmptyRow
                  colSpan={columns.visibleCount + 1}
                  title="Không có dữ liệu"
                  hint="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                />
              ) : (
                list.pageRows.map((row, idx) => {
                  const parentLabel = parentLabelOf(row.lookupParentId);

                  return (
                    <tr key={row.id} className="hover:bg-[#F8FAFC]">
                      {columns.isVisible('stt') && (
                        <td className={`${TD_CLASS} text-center text-slate-500`}>
                          {list.startIdx + idx + 1}
                        </td>
                      )}

                      {columns.isVisible('code') && (
                        <td className={`${TD_CLASS} font-semibold whitespace-nowrap`}>{row.code}</td>
                      )}

                      {columns.isVisible('value') && <td className={TD_CLASS}>{row.value}</td>}

                      {columns.isVisible('parent') && (
                        <td className={TD_CLASS}>
                          {parentLabel ?? <span className="text-slate-400">—</span>}
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
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-[#802423]/10 hover:text-[#802423]"
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
      </CatalogPage>

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
    </>
  );
};
