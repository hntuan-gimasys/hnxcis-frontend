/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  Submission,
  Alert,
  DisclosureObligation,
  WorkflowTask,
  UserAccount,
} from '../../types/hnx';
import { StatusBadge } from '../common/StatusBadge';

interface DashboardModuleProps {
  submissions: Submission[];
  alerts: Alert[];
  obligations: DisclosureObligation[];
  tasks: WorkflowTask[];
  currentUser: UserAccount;
  onNavigateToModule: (moduleCode: string) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  submissions,
  alerts,
  obligations,
  currentUser,
  onNavigateToModule,
}) => {
  const openAlerts = (alerts || []).filter((a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED');
  const safeObligations = obligations || [];
  const totalObligations = safeObligations.length || 1;
  const fulfilledCount = safeObligations.filter((o) => o.status === 'FULFILLED').length;
  const lateCount = safeObligations.filter((o) => o.status === 'LATE').length;
  const compliancePct = Math.round((fulfilledCount / totalObligations) * 100);

  const pendingSubmissions = (submissions || []).filter(
    (s) => s.status === 'SUBMITTED' || s.status === 'REVIEWED' || s.status === 'PENDING_APPROVAL'
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Giám sát Tuân thủ & Khối lượng Công việc (FR-027, FR-031)
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
            Tổng quan thị trường HNX, cảnh báo vi phạm tự động và Hàng đợi công việc cá nhân
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người dùng:</span>
          <span className="px-3 py-1 bg-slate-900 text-white rounded-sm text-xs font-bold font-mono border-l-2 border-indigo-500">
            {currentUser.fullName} ({currentUser.roleCode})
          </span>
        </div>
      </div>

      {/* Count Cards (FR-027) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate Card */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            <span>Tỷ lệ Nộp Đủ & Đúng hạn</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{compliancePct}%</span>
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">↑ SLA &gt; 90%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-xs h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 transition-all duration-500"
              style={{ width: `${compliancePct}%` }}
            />
          </div>
        </div>

        {/* Pending Submissions Inbox Card */}
        <div
          onClick={() => onNavigateToModule('tttt_inbox')}
          className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-2 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all border-l-4 border-l-indigo-600"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            <span>Hồ sơ Chờ Duyệt</span>
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{pendingSubmissions.length}</span>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Hàng đợi HNX</span>
          </div>
          <p className="text-[11px] text-slate-500">Cần xử lý & công bố thông tin</p>
        </div>

        {/* Open Alerts Feed Card */}
        <div
          onClick={() => onNavigateToModule('qlny_status_control')}
          className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-2 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all border-l-4 border-l-amber-500"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            <span>Cảnh báo Giám sát Mới</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{openAlerts.length}</span>
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Rule Engine</span>
          </div>
          <p className="text-[11px] text-slate-500">Điều 40/41 & vi phạm CBTT</p>
        </div>

        {/* Overdue Obligations Card */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-2 border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            <span>Nghĩa vụ Quá hạn</span>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-600 font-mono">{lateCount}</span>
            <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">Doanh nghiệp</span>
          </div>
          <p className="text-[11px] text-slate-500">Cần phát hành công văn nhắc nhở</p>
        </div>
      </div>

      {/* Main Grid: My Tasks & Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Task Inbox with SLA Highlight */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span>Hàng đợi Công việc Cá nhân (SLA Inbox)</span>
            </h3>
            <button
              onClick={() => onNavigateToModule('tttt_inbox')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 uppercase tracking-wider"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Hiện không có công việc nào chờ xử lý.
              </div>
            ) : (
              pendingSubmissions.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {sub.submissionNo}
                      </span>
                      <StatusBadge status={sub.status} type="submission" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{sub.titleVi}</h4>
                  </div>

                  <button
                    onClick={() => onNavigateToModule('tttt_inbox')}
                    className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs"
                  >
                    Xử lý
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rule Engine Alert Feed (FR-008, FR-041) */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Cảnh báo Giám sát Rule Engine</span>
            </h3>
            <button
              onClick={() => onNavigateToModule('qlny_status_control')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 uppercase tracking-wider"
            >
              <span>Quản lý Rule</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {openAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Không có cảnh báo mới nào từ hệ thống.
              </div>
            ) : (
              openAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 bg-amber-50/70 border-l-4 border-l-amber-500 border border-amber-200 rounded-sm space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">{alert.titleVi}</span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded-xs text-[10px]">
                      {alert.ruleCode}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px]">{alert.suggestedAction}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Căn cứ pháp lý: {alert.legalBasis}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Geometric Balance SLA Highlight Block */}
      <div className="bg-slate-900 text-white border-l-4 border-indigo-600 p-6 shadow-md rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Đánh giá Xếp loại Hiệu suất SLA Cán bộ (FR-031)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
            Tốt (&gt;=90%) | Trung bình (70-89%) | Yếu (&lt;70%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-800/90 rounded-sm border border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian xử lý HNX</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">1.2 Ngày làm việc</div>
            <div className="text-[10px] text-slate-400 mt-1">Đạt mục tiêu SLA (&lt; 2.0 ngày)</div>
          </div>

          <div className="p-4 bg-slate-800/90 rounded-sm border border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian Chờ DN (Tách riêng)</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1">4.5 Ngày làm việc</div>
            <div className="text-[10px] text-slate-400 mt-1">Đã loại trừ khỏi chấm điểm cán bộ</div>
          </div>

          <div className="p-4 bg-indigo-950/80 rounded-sm border border-indigo-800/80 border-l-2 border-l-indigo-400">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Xếp loại SLA Tự động</div>
            <div className="text-xl font-bold text-white font-mono mt-1">LOẠI TỐT (EXCELLENT)</div>
            <div className="text-[10px] text-indigo-300 mt-1">Tỷ lệ đúng hạn: 94.5%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

