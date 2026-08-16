/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, X } from 'lucide-react';
import { exportToCsv, CsvColumn } from '../../lib/exportCsv';

export interface DrillDownColumn<T> {
  header: string;
  /** Nội dung hiển thị trong ô. */
  render: (row: T) => React.ReactNode;
  /** Giá trị thô khi xuất file; mặc định lấy theo `render` là không xuất được JSX. */
  exportValue: (row: T) => unknown;
}

interface DrillDownGridProps<T> {
  open: boolean;
  title: string;
  subtitle?: string;
  columns: DrillDownColumn<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  exportFileName: string;
  onClose: () => void;
}

/**
 * Grid View chi tiết mở ra khi bấm vào một con số / lát cắt trên Dashboard
 * (FR-027). Nhận đúng tập bản ghi tạo nên con số đó — component này không tự lọc
 * lại, để số trên widget và số dòng ở đây không thể lệch nhau.
 */
export function DrillDownGrid<T>({
  open,
  title,
  subtitle,
  columns,
  rows,
  rowKey,
  exportFileName,
  onClose,
}: DrillDownGridProps<T>) {
  if (!open) return null;

  const handleExport = () => {
    const csvColumns: CsvColumn<T>[] = columns.map((col) => ({
      header: col.header,
      value: col.exportValue,
    }));
    exportToCsv(exportFileName, csvColumns, rows);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-5xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{rows.length} bản ghi</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              disabled={rows.length === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-sm text-xs font-semibold ${
                rows.length === 0
                  ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500 cursor-pointer"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">Không có dữ liệu</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100/70 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider w-12">
                    STT
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.header}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.map((row, idx) => (
                  <tr key={rowKey(row)} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-500">{idx + 1}</td>
                    {columns.map((col) => (
                      <td key={col.header} className="px-4 py-2.5 text-xs text-slate-800">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
