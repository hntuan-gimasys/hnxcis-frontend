/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
}

export function DynamicTable<T extends { id: number }>({
  title,
  columns,
  data,
  searchPlaceholder = 'Tìm kiếm theo từ khóa...',
  onExportExcel,
  actions,
}: DynamicTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = (data || []).filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">
                STT
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                >
                  {col.headerVi}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                  Không tìm thấy dữ liệu phù hợp
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-slate-800">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
        <div>
          Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
          {Math.min(currentPage * pageSize, filteredData.length)} trên tổng số {filteredData.length} kết quả
        </div>
        <div className="flex items-center space-x-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-2.5 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-2 font-medium">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
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
