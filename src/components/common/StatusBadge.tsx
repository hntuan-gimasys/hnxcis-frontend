/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SecurityStatus, SubmissionStatus, BusinessCaseStatus } from '../../types/hnx';

interface StatusBadgeProps {
  status: SecurityStatus | SubmissionStatus | BusinessCaseStatus | string;
  type?: 'security' | 'submission' | 'case' | 'generic';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'generic' }) => {
  let label = status;
  let bgClass = 'bg-gray-100 text-gray-800 border-gray-300';

  if (type === 'security' || ['NORMAL', 'WARNING', 'CONTROL', 'TRADING_RESTRICTED', 'TRADING_HALT', 'DELISTED'].includes(status)) {
    switch (status) {
      case 'NORMAL':
        label = 'Bình thường';
        bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'WARNING':
        label = 'Cảnh báo (Đ40)';
        bgClass = 'bg-amber-50 text-amber-700 border-amber-300';
        break;
      case 'CONTROL':
        label = 'Kiểm soát (Đ41)';
        bgClass = 'bg-orange-50 text-orange-700 border-orange-300';
        break;
      case 'TRADING_RESTRICTED':
        label = 'Hạn chế GD (Đ42)';
        bgClass = 'bg-rose-50 text-rose-700 border-rose-300';
        break;
      case 'TRADING_HALT':
        label = 'Tạm ngừng GD (Đ44)';
        bgClass = 'bg-red-100 text-red-800 border-red-300';
        break;
      case 'DELISTED':
        label = 'Hủy niêm yết';
        bgClass = 'bg-gray-200 text-gray-700 border-gray-400';
        break;
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
