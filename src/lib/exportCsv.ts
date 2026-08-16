/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Xuất dữ liệu lưới ra CSV cho Dashboard và Grid View (FR-027).
 *
 * ⚠️ KHÁC với kết xuất báo cáo chính thức: 111 mẫu báo cáo thống kê phải xuất
 * .xlsx "giữ nguyên cấu trúc cột/định dạng dữ liệu gốc" (X8, §6.4) — việc đó do
 * Report Engine phía backend làm, không dùng hàm này.
 *
 * CSV ghi kèm BOM UTF-8 để Excel trên Windows mở ra đúng tiếng Việt thay vì
 * hiện ký tự lỗi.
 */

const BOM = '﻿';

/** Bọc giá trị theo RFC 4180: nhân đôi dấu nháy kép, bọc nháy khi cần. */
const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export interface CsvColumn<T> {
  header: string;
  /** Giá trị đưa vào ô — trả về chuỗi/số thô, không phải JSX. */
  value: (row: T) => unknown;
}

export function exportToCsv<T>(fileName: string, columns: CsvColumn<T>[], rows: T[]): void {
  const lines = [
    columns.map((c) => escapeCell(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(',')),
  ];

  const blob = new Blob([BOM + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
