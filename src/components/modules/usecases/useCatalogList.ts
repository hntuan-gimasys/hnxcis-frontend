/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';

import { CatalogRecord, Flag } from './catalogTypes';
import { SortState, nextSort } from './catalogUi';

/**
 * Logic danh sách dùng chung cho các màn hình quản lý danh mục.
 *
 * VÌ SAO TÁCH RA
 *
 * IMS-002 (Quốc gia), IMS-003 (Tỉnh thành), IMS-004 (Xã phường) và bốn màn hình
 * còn lại có đặc tả danh sách GIỐNG NHAU TỪNG CHỮ trong `docs/srs/`: lọc theo từ
 * khóa và trạng thái, chỉ áp dụng khi bấm Tìm kiếm hoặc Enter, sắp xếp mặc định
 * mới nhất theo `CREATED_DATE`, xóa mềm theo `DELETE_FLG`, phân trang 10/20/50.
 *
 * `catalogUi.tsx` đã lo phần hiển thị không lệch nhau. Hook này lo phần hành vi
 * không lệch nhau — nếu để mỗi màn hình tự viết, bảy màn hình sẽ có bảy cách kẹp
 * số trang và bảy cách quyết định khi nào bộ lọc được áp dụng.
 *
 * Hook KHÔNG giữ dữ liệu: `rows` do màn hình sở hữu (useState) và truyền vào.
 * Thêm/sửa/xóa vẫn là việc của màn hình, vì mỗi danh mục có luật riêng.
 */

/** Giá trị bộ lọc trạng thái; `'all'` là không lọc. */
export type StatusFilter = 'all' | Flag;

interface UseCatalogListOptions<T> {
  /** Toàn bộ bản ghi, KỂ CẢ bản ghi đã xóa mềm — hook tự lọc `deleteFlg`. */
  rows: readonly T[];
  /** Các chuỗi được gộp vào tìm kiếm từ khóa của một bản ghi. */
  searchFields: (row: T) => readonly string[];
  /** Giá trị so sánh khi sắp xếp theo `key` (khóa của cột trên bảng). */
  sortValue: (row: T, key: string) => string | number;
  /** Thứ tự khi người dùng chưa bấm vào cột nào. */
  defaultSort: SortState;
}

export interface CatalogListState<T> {
  /* --- bộ lọc đang gõ (chưa áp dụng) --- */
  draftKeyword: string;
  setDraftKeyword: (value: string) => void;
  draftStatus: StatusFilter;
  setDraftStatus: (value: StatusFilter) => void;

  /* --- áp dụng / đặt lại --- */
  /** Gọi khi bấm Tìm kiếm hoặc nhấn Enter trong ô từ khóa. */
  applySearch: () => void;
  /** Gọi khi bấm Làm mới: bỏ hết điều kiện lọc và về thứ tự mặc định. */
  resetFilters: () => void;

  /* --- sắp xếp --- */
  sort: SortState;
  changeSort: (key: string) => void;

  /* --- phân trang --- */
  /** Trang đang hiển thị, đã kẹp trong khoảng hợp lệ. */
  page: number;
  totalPages: number;
  pageSize: number;
  setPage: (page: number) => void;
  changePageSize: (size: number) => void;

  /* --- kết quả --- */
  /** Số bản ghi thỏa điều kiện lọc, trước khi cắt trang. */
  total: number;
  /** Chỉ số bản ghi đầu trang, dùng để đánh số STT liên tục giữa các trang. */
  startIdx: number;
  /** Bản ghi của trang hiện tại. */
  pageRows: readonly T[];
}

export function useCatalogList<T extends CatalogRecord>({
  rows,
  searchFields,
  sortValue,
  defaultSort,
}: UseCatalogListOptions<T>): CatalogListState<T> {
  /**
   * Ô tìm kiếm có HAI state: `draft*` là những gì đang gõ, `applied*` là điều
   * kiện đang lọc. SRS nói rõ danh sách chỉ lọc lại khi "Click button Tìm kiếm/
   * bấm enter", chứ không lọc theo từng ký tự — nên gõ dở dang không được làm
   * danh sách nhảy.
   */
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<StatusFilter>('all');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>('all');

  const [sort, setSort] = useState<SortState>(defaultSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const visibleRows = useMemo(() => {
    const keyword = appliedKeyword.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      // Điều kiện đầu tiên: bản ghi đã xóa mềm không được hiện ra.
      if (row.deleteFlg !== 0) return false;
      if (appliedStatus !== 'all' && row.statusFlg !== appliedStatus) return false;
      if (!keyword) return true;

      // SRS: nhiều điều kiện tìm kiếm kết hợp theo AND, riêng từ khóa thì khớp
      // bất kỳ trường nào trong danh sách do màn hình khai báo.
      return searchFields(row).some((v) => v.toLowerCase().includes(keyword));
    });

    return filtered.sort((a, b) => {
      const va = sortValue(a, sort.key);
      const vb = sortValue(b, sort.key);
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    // `searchFields`/`sortValue` là hàm thuần khai báo ở tầng module, không đổi
    // giữa các lần render, nên không đưa vào danh sách phụ thuộc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, appliedKeyword, appliedStatus, sort]);

  const total = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /**
   * Kẹp trang vào khoảng hợp lệ ngay khi tính, thay vì dùng useEffect để sửa
   * state sau khi đã render một lần: xóa bản ghi cuối của trang cuối sẽ khiến
   * `page` vượt `totalPages` và bảng hiện "không có dữ liệu" dù vẫn còn kết quả.
   */
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;

  return {
    draftKeyword,
    setDraftKeyword,
    draftStatus,
    setDraftStatus,

    applySearch: () => {
      setAppliedKeyword(draftKeyword);
      setAppliedStatus(draftStatus);
      setPage(1);
    },

    resetFilters: () => {
      setDraftKeyword('');
      setDraftStatus('all');
      setAppliedKeyword('');
      setAppliedStatus('all');
      setSort(defaultSort);
      setPage(1);
    },

    sort,
    changeSort: (key: string) => {
      setSort((prev) => nextSort(prev, key));
      setPage(1);
    },

    page: safePage,
    totalPages,
    pageSize,
    setPage,
    changePageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },

    total,
    startIdx,
    pageRows: visibleRows.slice(startIdx, startIdx + pageSize),
  };
}
