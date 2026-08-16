/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Filter, RefreshCw } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  headerVi: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DynamicTableProps<T> {
  title?: string;
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  onExportExcel?: () => void;
  actions?: (row: T) => React.ReactNode;
  /**
   * `compact` cho màn hình nghiệp vụ của P.QLNY: bảng dày đặc, nhiều dòng trong
   * một màn hình, ưu tiên tốc độ đọc/thao tác hơn khoảng thở.
   */
  density?: 'comfortable' | 'compact';
  /**
   * Bật điều hướng bàn phím: ↑ ↓ chuyển dòng, Home/End về đầu/cuối trang,
   * Enter mở dòng đang chọn. Không truyền thì bảng giữ nguyên hành vi cũ.
   */
  onRowActivate?: (row: T) => void;
}

export function DynamicTable<T extends { id: number }>({
  title,
  columns,
  data,
  searchPlaceholder = 'Tìm kiếm theo từ khóa...',
  onExportExcel,
  actions,
  density = 'comfortable',
  onRowActivate,
}: DynamicTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const pageSize = density === 'compact' ? 20 : 10;

  const isCompact = density === 'compact';
  const cellPad = isCompact ? 'px-3 py-1.5' : 'px-4 py-3';
  const headPad = isCompact ? 'px-3 py-2' : 'px-4 py-3';

  const filteredData = (data || []).filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // Không reset thì sau khi lọc/đổi dữ liệu, trang hiện tại có thể vượt quá số
  // trang mới và bảng hiện "không có dữ liệu" dù kết quả vẫn còn.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  /** Điều hướng bằng bàn phím trong phạm vi trang hiện tại. */
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, idx: number) => {
    if (!onRowActivate) return;

    const focusRow = (target: number) => {
      const clamped = Math.max(0, Math.min(paginatedData.length - 1, target));
      rowRefs.current[clamped]?.focus();
    };

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusRow(idx + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusRow(idx - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusRow(0);
        break;
      case 'End':
        e.preventDefault();
        focusRow(paginatedData.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        onRowActivate(paginatedData[idx]);
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {(title || onExportExcel) && (
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 text-xs font-medium text-slate-700 bg-white rounded-lg hover:bg-slate-100 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>Xuất .xlsx</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100/70">
            <tr>
              <th className={`${headPad} text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12`}>
                STT
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${headPad} text-left text-xs font-semibold text-slate-600 uppercase tracking-wider`}
                >
                  {col.headerVi}
                </th>
              ))}
              {actions && (
                <th className={`${headPad} text-right text-xs font-semibold text-slate-600 uppercase tracking-wider`}>
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 2 : 1)}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id}
                  ref={(el) => {
                    rowRefs.current[idx] = el;
                  }}
                  tabIndex={onRowActivate ? 0 : undefined}
                  onKeyDown={(e) => handleRowKeyDown(e, idx)}
                  onDoubleClick={onRowActivate ? () => onRowActivate(row) : undefined}
                  className={`transition-colors hover:bg-slate-50/80 ${
                    onRowActivate
                      ? 'focus:outline-none focus:bg-indigo-50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-default'
                      : ''
                  }`}
                >
                  <td className={`${cellPad} text-xs text-slate-500`}>
                    {(safePage - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${cellPad} ${isCompact ? 'text-xs' : 'text-sm'} text-slate-800`}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className={`${cellPad} text-right text-sm font-medium`}>{actions(row)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Hiển thị {filteredData.length === 0 ? 0 : (safePage - 1) * pageSize + 1} -{' '}
            {Math.min(safePage * pageSize, filteredData.length)} trên tổng số {filteredData.length} kết quả
          </span>
          {onRowActivate && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Bấm vào bảng rồi dùng ↑ ↓ để chuyển dòng, Enter để mở
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-2.5 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-2 font-medium">
            Trang {safePage} / {totalPages}
          </span>
          <button
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-2.5 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
