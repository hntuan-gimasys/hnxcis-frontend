/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  SecurityStatus,
  SurveillanceStatus,
  SubmissionStatus,
  BusinessCaseStatus,
} from '../../types/hnx';

interface StatusBadgeProps {
  status:
    | SecurityStatus
    | SurveillanceStatus
    | SubmissionStatus
    | BusinessCaseStatus
    | string;
  /**
   * `security` và `surveillance` là HAI danh mục khác nhau (PRD v1.2 §5.2.8.b),
   * không phải một. Luôn truyền `type` khi render hai loại này, vì chúng có
   * những mã trùng tên (WARNING, CONTROL, TRADING_HALT) nhưng nhãn khác nhau.
   */
  type?: 'security' | 'surveillance' | 'submission' | 'translation' | 'case' | 'generic';
}

/** Trạng thái bản dịch EN trong vòng đời song ngữ một bản ghi (FR-065). */
const TRANSLATION_STATUS: Record<string, { label: string; bgClass: string }> = {
  NONE: {
    label: 'Không thuộc nhóm tin dịch tự động',
    bgClass: 'bg-slate-100 text-slate-600 border-slate-300',
  },
  AI_DRAFT: {
    label: 'Đã dịch tự động — chờ hiệu đính',
    bgClass: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  HUMAN_REVIEWED: {
    label: 'Đã hiệu đính — sẵn sàng công bố',
    bgClass: 'bg-sky-50 text-sky-700 border-sky-300',
  },
  APPROVED: {
    label: 'Đã công bố song ngữ',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

/** Picklist 1 — Trạng thái chứng khoán, đúng 5 giá trị. */
const SECURITY_STATUS: Record<SecurityStatus, { label: string; bgClass: string }> = {
  NORMAL: { label: 'Bình thường', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  WARNING: { label: 'Cảnh báo', bgClass: 'bg-amber-50 text-amber-700 border-amber-300' },
  CONTROL: { label: 'Kiểm soát', bgClass: 'bg-orange-50 text-orange-700 border-orange-300' },
  TRADING_HALT: { label: 'Tạm ngừng giao dịch', bgClass: 'bg-red-100 text-red-800 border-red-300' },
  DELISTED: { label: 'Hủy niêm yết', bgClass: 'bg-gray-200 text-gray-700 border-gray-400' },
};

/** Picklist 2 — Trạng thái kiểm soát (diện giám sát), đúng 9 giá trị. */
const SURVEILLANCE_STATUS: Record<SurveillanceStatus, { label: string; bgClass: string }> = {
  WARNING: { label: 'Cảnh báo', bgClass: 'bg-amber-50 text-amber-700 border-amber-300' },
  CONTROL: { label: 'Kiểm soát', bgClass: 'bg-orange-50 text-orange-700 border-orange-300' },
  TRADING_RESTRICTED: { label: 'Hạn chế giao dịch', bgClass: 'bg-rose-50 text-rose-700 border-rose-300' },
  TRADING_PAUSE: { label: 'Tạm dừng giao dịch', bgClass: 'bg-red-50 text-red-700 border-red-200' },
  TRADING_HALT: { label: 'Tạm ngừng giao dịch', bgClass: 'bg-red-100 text-red-800 border-red-300' },
  TRADING_SUSPENSION: { label: 'Đình chỉ giao dịch', bgClass: 'bg-red-200 text-red-900 border-red-400' },
  MANDATORY_DELIST: { label: 'Hủy bắt buộc', bgClass: 'bg-zinc-800 text-white border-zinc-900' },
  VOLUNTARY_DELIST: { label: 'Hủy tự nguyện', bgClass: 'bg-slate-200 text-slate-800 border-slate-400' },
  DEREGISTER_TRADING: { label: 'Hủy đăng ký giao dịch', bgClass: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'generic' }) => {
  let label = status;
  let bgClass = 'bg-gray-100 text-gray-800 border-gray-300';

  // Hai danh mục dưới đây chỉ tra khi được chỉ định `type` — suy đoán theo mã sẽ
  // sai, vì WARNING/CONTROL/TRADING_HALT tồn tại ở CẢ HAI với ý nghĩa khác nhau.
  if (type === 'translation') {
    const entry = TRANSLATION_STATUS[status];
    if (entry) {
      label = entry.label;
      bgClass = entry.bgClass;
    }
  } else if (type === 'surveillance') {
    const entry = SURVEILLANCE_STATUS[status as SurveillanceStatus];
    if (entry) {
      label = entry.label;
      bgClass = entry.bgClass;
    }
  } else if (type === 'security' || (type === 'generic' && status in SECURITY_STATUS)) {
    const entry = SECURITY_STATUS[status as SecurityStatus];
    if (entry) {
      label = entry.label;
      bgClass = entry.bgClass;
    }
  } else if (type === 'submission' || ['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'PUBLISHED', 'CORRECTED', 'HIDDEN', 'CANCELLED'].includes(status)) {
    switch (status) {
      case 'DRAFT':
        label = 'Nháp / Lưu tạm';
        bgClass = 'bg-slate-100 text-slate-700 border-slate-300';
        break;
      case 'PENDING_ORG_APPROVAL':
        label = 'Chờ LĐ DN duyệt';
        bgClass = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'SUBMITTED':
        label = 'Đã gửi Sở HNX';
        bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'REVIEWED':
        label = 'Đã soát xét';
        bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'PENDING_APPROVAL':
        label = 'Chờ LĐ Sở duyệt';
        bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'APPROVED':
        label = 'Đã phê duyệt';
        bgClass = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
      case 'PUBLISHED':
        label = 'Đã công bố';
        bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        break;
      case 'CORRECTED':
        label = 'Đã đính chính';
        bgClass = 'bg-amber-100 text-amber-800 border-amber-300';
        break;
      case 'HIDDEN':
        label = 'Đã gỡ tin (Ẩn)';
        bgClass = 'bg-zinc-200 text-zinc-700 border-zinc-400';
        break;
      case 'CANCELLED':
        label = 'Đã hủy / Từ chối';
        bgClass = 'bg-red-50 text-red-700 border-red-200';
        break;
    }
  } else {
    switch (status) {
      case 'PENDING':
        label = 'Chờ xử lý';
        bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'FULFILLED':
        label = 'Đã hoàn thành';
        bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'LATE':
        label = 'Chậm nộp (Trễ hạn)';
        bgClass = 'bg-red-100 text-red-800 border-red-300 font-semibold';
        break;
      case 'MISSING':
        label = 'Chưa nộp';
        bgClass = 'bg-rose-100 text-rose-800 border-rose-300';
        break;
      case 'ACTIVE':
        label = 'Đang hoạt động';
        bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      default:
        label = status;
        bgClass = 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass}`}
    >
      {label}
    </span>
  );
};
