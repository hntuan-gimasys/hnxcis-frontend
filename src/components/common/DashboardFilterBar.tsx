/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { BoardType } from '../../types/hnx';

export type BoardFilter = 'ALL' | Extract<BoardType, 'HOSE' | 'HNX' | 'UPCOM'>;
export type PeriodFilter = 'ALL' | 'Q1_2026' | 'Q2_2026' | 'SEMI_2026' | 'FY_2026';

export interface DashboardFilters {
  board: BoardFilter;
  period: PeriodFilter;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  board: 'ALL',
  period: 'ALL',
};

const BOARD_OPTIONS: Array<{ value: BoardFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả sàn' },
  { value: 'HOSE', label: 'HOSE' },
  { value: 'HNX', label: 'HNX' },
  { value: 'UPCOM', label: 'UPCoM' },
];

const PERIOD_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả kỳ' },
  { value: 'Q1_2026', label: 'Quý 1/2026' },
  { value: 'Q2_2026', label: 'Quý 2/2026' },
  { value: 'SEMI_2026', label: 'Bán niên 2026' },
  { value: 'FY_2026', label: 'Năm 2026' },
];

interface DashboardFilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  /** Số bản ghi còn lại sau khi lọc, hiển thị để người dùng biết bộ lọc có tác dụng. */
  resultCount?: number;
}

/**
 * Bộ lọc dùng chung của Dashboard (FR-027). Chỉ giữ MỘT nguồn state ở component
 * cha rồi truyền xuống mọi widget — đổi bộ lọc là toàn bộ widget tính lại cùng
 * lúc, không widget nào giữ bản sao riêng để lệch nhau.
 */
export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  onChange,
  resultCount,
}) => {
  const isFiltered = filters.board !== 'ALL' || filters.period !== 'ALL';

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
        <Filter className="h-3.5 w-3.5 text-indigo-600" />
        <span>Bộ lọc chung</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="dashboard-board-filter">
          Sàn giao dịch
        </label>
        <select
          id="dashboard-board-filter"
          value={filters.board}
          onChange={(e) => onChange({ ...filters, board: e.target.value as BoardFilter })}
          className="px-2.5 py-1.5 border border-slate-300 rounded-sm text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {BOARD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="dashboard-period-filter">
          Kỳ báo cáo
        </label>
        <select
          id="dashboard-period-filter"
          value={filters.period}
          onChange={(e) => onChange({ ...filters, period: e.target.value as PeriodFilter })}
          className="px-2.5 py-1.5 border border-slate-300 rounded-sm text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={() => onChange(DEFAULT_DASHBOARD_FILTERS)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {typeof resultCount === 'number' && (
        <span className="text-[11px] text-slate-500 font-mono sm:ml-auto">
          {resultCount} bản ghi khớp bộ lọc
        </span>
      )}
    </div>
  );
};
