/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { FileText, AlertTriangle, Clock, Download, Inbox } from 'lucide-react';
import {
  Submission,
  Alert,
  DisclosureObligation,
  WorkflowTask,
  UserAccount,
  SecurityItem,
  Organization,
} from '../../types/hnx';
import { StatusBadge } from '../common/StatusBadge';
import {
  DashboardFilterBar,
  DashboardFilters,
  DEFAULT_DASHBOARD_FILTERS,
} from '../common/DashboardFilterBar';
import { DrillDownGrid, DrillDownColumn } from '../common/DrillDownGrid';
import { exportToCsv } from '../../lib/exportCsv';

interface DashboardModuleProps {
  submissions: Submission[];
  alerts: Alert[];
  obligations: DisclosureObligation[];
  tasks: WorkflowTask[];
  currentUser: UserAccount;
  securities: SecurityItem[];
  organizations: Organization[];
  onNavigateToModule: (moduleCode: string) => void;
}

/**
 * Sáu nhóm báo cáo của Dashboard Chuyên viên (FR-027). Widget thứ 7 là thống kê
 * công việc cá nhân, dựng riêng bên dưới vì cách tính khác hẳn.
 */
const REPORT_CATEGORIES: Array<{
  key: string;
  label: string;
  match: (sub: Submission) => boolean;
}> = [
  {
    key: 'FS',
    label: 'Thống kê BCTC',
    match: (s) => s.templateKind === 'FINANCIAL_STMT',
  },
  {
    key: 'PERIODIC_OTHER',
    label: 'Báo cáo Định kỳ khác',
    match: (s) => s.newsGroupCode === 'PERIODIC' && s.templateKind !== 'FINANCIAL_STMT',
  },
  {
    key: 'EXTRAORDINARY',
    label: 'Báo cáo Bất thường',
    match: (s) => s.newsGroupCode === 'EXTRAORDINARY',
  },
  {
    key: 'TRADING',
    label: 'Báo cáo Giao dịch',
    match: (s) => s.newsGroupCode === 'TRADING',
  },
  {
    key: 'OFFERING',
    label: 'Báo cáo Chào bán / Phát hành',
    match: (s) => s.newsGroupCode === 'OFFERING',
  },
  {
    key: 'ON_DEMAND',
    label: 'Báo cáo theo yêu cầu',
    match: (s) => s.newsGroupCode === 'ON_DEMAND',
  },
];

const PENDING_STATUSES = ['SUBMITTED', 'REVIEWED', 'PENDING_APPROVAL', 'APPROVED'];

/** Ngưỡng cảnh báo sắp quá hạn xử lý nội bộ, tính từ lúc doanh nghiệp nộp. */
const INTERNAL_SLA_DAYS = 3;

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  submissions,
  alerts,
  obligations,
  currentUser,
  securities,
  organizations,
  onNavigateToModule,
}) => {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const [drillDown, setDrillDown] = useState<{
    title: string;
    subtitle: string;
    rows: Submission[];
  } | null>(null);

  /**
   * Gate tạm theo vai trò (chưa có AuthZ Engine): P.CNTT vận hành kỹ thuật, không
   * xử lý nghiệp vụ nên không mở được chi tiết nội dung tin. Không có quyền thì
   * ẩn hẳn link, không hiện lỗi phân quyền thô.
   */
  const canViewDetail = !currentUser.roleCode.includes('CNTT');

  const boardBySecurityId = useMemo(() => {
    const map = new Map<number, string>();
    (securities || []).forEach((s) => map.set(s.id, s.board));
    return map;
  }, [securities]);

  const orgNameById = useMemo(() => {
    const map = new Map<number, string>();
    (organizations || []).forEach((o) => map.set(o.id, o.shortName || o.nameVi));
    return map;
  }, [organizations]);

  /** Một nguồn dữ liệu đã lọc duy nhất — mọi widget đọc từ đây nên refresh cùng lúc. */
  const filteredSubmissions = useMemo(() => {
    return (submissions || []).filter((sub) => {
      if (filters.board !== 'ALL') {
        const board = sub.securityId ? boardBySecurityId.get(sub.securityId) : undefined;
        if (board !== filters.board) return false;
      }
      if (filters.period !== 'ALL' && sub.periodCode !== filters.period) return false;
      return true;
    });
  }, [submissions, filters, boardBySecurityId]);

  const filteredObligations = useMemo(() => {
    return (obligations || []).filter((obl) => {
      if (filters.board !== 'ALL') {
        const board = obl.securityId ? boardBySecurityId.get(obl.securityId) : undefined;
        if (board !== filters.board) return false;
      }
      if (filters.period !== 'ALL' && obl.periodCode !== filters.period) return false;
      return true;
    });
  }, [obligations, filters, boardBySecurityId]);

  const bucketOf = (sub: Submission): 'PENDING' | 'APPROVED' | 'REJECTED' | 'OTHER' => {
    if (PENDING_STATUSES.includes(sub.status)) return 'PENDING';
    if (sub.status === 'PUBLISHED') return 'APPROVED';
    if (sub.status === 'CANCELLED') return 'REJECTED';
    return 'OTHER';
  };

  const drillColumns: DrillDownColumn<Submission>[] = [
    {
      header: 'Mã hồ sơ',
      render: (row) => <span className="font-mono font-bold">{row.submissionNo}</span>,
      exportValue: (row) => row.submissionNo,
    },
    {
      header: 'Tiêu đề công bố',
      render: (row) => <span className="font-medium text-slate-900">{row.titleVi}</span>,
      exportValue: (row) => row.titleVi,
    },
    {
      header: 'Doanh nghiệp',
      render: (row) => orgNameById.get(row.organizationId || 0) || '-',
      exportValue: (row) => orgNameById.get(row.organizationId || 0) || '',
    },
    {
      header: 'Sàn',
      render: (row) => (
        <span className="font-mono">
          {(row.securityId && boardBySecurityId.get(row.securityId)) || '-'}
        </span>
      ),
      exportValue: (row) => (row.securityId && boardBySecurityId.get(row.securityId)) || '',
    },
    {
      header: 'Kỳ',
      render: (row) => <span className="font-mono">{row.periodCode || '-'}</span>,
      exportValue: (row) => row.periodCode || '',
    },
    {
      header: 'Ngày nộp',
      render: (row) =>
        row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('vi-VN') : '-',
      exportValue: (row) =>
        row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('vi-VN') : '',
    },
    {
      header: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} type="submission" />,
      exportValue: (row) => row.status,
    },
  ];

  const openDrillDown = (title: string, subtitle: string, rows: Submission[]) => {
    if (!canViewDetail) return;
    setDrillDown({ title, subtitle, rows });
  };

  const exportRows = (fileName: string, rows: Submission[]) => {
    exportToCsv(
      fileName,
      drillColumns.map((c) => ({ header: c.header, value: c.exportValue })),
      rows
    );
  };

  const filterLabel = `Sàn: ${filters.board === 'ALL' ? 'Tất cả' : filters.board} · Kỳ: ${
    filters.period === 'ALL' ? 'Tất cả' : filters.period
  }`;

  // Widget 7 — công việc cá nhân
  const pendingAll = filteredSubmissions.filter((s) => PENDING_STATUSES.includes(s.status));
  // Kiểm soát kép: người lập không tự duyệt hồ sơ của mình.
  const waitingForMe = pendingAll.filter((s) => s.createdBy !== currentUser.id);
  const nearSlaBreach = pendingAll.filter((s) => {
    if (!s.submittedAt) return false;
    const days = Math.floor(
      (Date.now() - new Date(s.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days >= INTERNAL_SLA_DAYS;
  });

  const openAlerts = (alerts || []).filter(
    (a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED'
  );
  const overdueObligations = filteredObligations.filter(
    (o) => o.status === 'LATE' || o.status === 'MISSING'
  );

  /** Con số bấm được; không có quyền xem chi tiết thì hiện số trần, không có link. */
  const CountCell: React.FC<{
    value: number;
    label: string;
    tone: 'pending' | 'approved' | 'rejected';
    onOpen: () => void;
  }> = ({ value, label, tone, onOpen }) => {
    const toneClass =
      tone === 'rejected'
        ? 'text-rose-600'
        : tone === 'approved'
          ? 'text-emerald-600'
          : 'text-indigo-600';

    const content = (
      <>
        <div className={`text-2xl font-black font-mono ${value === 0 ? 'text-slate-300' : toneClass}`}>
          {value}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
      </>
    );

    if (!canViewDetail || value === 0) {
      return <div className="text-center py-1">{content}</div>;
    }

    return (
      <button
        onClick={onOpen}
        title={`Xem chi tiết ${label.toLowerCase()}`}
        className="text-center py-1 rounded-sm hover:bg-slate-50 cursor-pointer transition-colors w-full"
      >
        {content}
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Chuyên viên (FR-027)
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
            Thống kê hồ sơ công bố theo nhóm báo cáo &amp; hàng đợi công việc cá nhân
          </p>
        </div>

        <span className="px-3 py-1 bg-slate-900 text-white rounded-sm text-xs font-bold font-mono border-l-2 border-indigo-500 self-start">
          {currentUser.fullName}
        </span>
      </div>

      <DashboardFilterBar
        filters={filters}
        onChange={setFilters}
        resultCount={filteredSubmissions.length}
      />

      {!canViewDetail && (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-sm text-[11px] text-slate-600">
          Vai trò hiện tại chỉ xem số liệu tổng hợp, không mở được danh sách chi tiết hồ sơ.
        </div>
      )}

      {/* Widget 1-6: sáu nhóm báo cáo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_CATEGORIES.map((cat) => {
          const rows = filteredSubmissions.filter(cat.match);
          const pending = rows.filter((r) => bucketOf(r) === 'PENDING');
          const approved = rows.filter((r) => bucketOf(r) === 'APPROVED');
          const rejected = rows.filter((r) => bucketOf(r) === 'REJECTED');

          return (
            <div
              key={cat.key}
              className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {cat.label}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Tổng {rows.length} hồ sơ
                  </p>
                </div>
                <button
                  onClick={() => exportRows(`dashboard-${cat.key.toLowerCase()}`, rows)}
                  disabled={rows.length === 0}
                  title="Xuất Excel danh sách của widget này"
                  className={`p-1.5 rounded-sm border shrink-0 ${
                    rows.length === 0
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>

              {rows.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-slate-400">Không có dữ liệu</div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  <CountCell
                    value={pending.length}
                    label="Chờ duyệt"
                    tone="pending"
                    onOpen={() =>
                      openDrillDown(`${cat.label} — Chờ duyệt`, filterLabel, pending)
                    }
                  />
                  <CountCell
                    value={approved.length}
                    label="Đã duyệt"
                    tone="approved"
                    onOpen={() =>
                      openDrillDown(`${cat.label} — Đã duyệt`, filterLabel, approved)
                    }
                  />
                  <CountCell
                    value={rejected.length}
                    label="Bị từ chối"
                    tone="rejected"
                    onOpen={() =>
                      openDrillDown(`${cat.label} — Bị từ chối`, filterLabel, rejected)
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Widget 7: thống kê công việc cá nhân */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs space-y-4 border-l-4 border-l-indigo-600">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Inbox className="h-4 w-4 text-indigo-600" />
            <span>Thống kê Công việc cá nhân</span>
          </h3>
          <button
            onClick={() => onNavigateToModule('tttt_inbox')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider cursor-pointer"
          >
            Mở hàng đợi
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-200 rounded-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              <span>Chờ tôi duyệt</span>
            </div>
            {canViewDetail && waitingForMe.length > 0 ? (
              <button
                onClick={() => openDrillDown('Hồ sơ chờ tôi duyệt', filterLabel, waitingForMe)}
                className="text-3xl font-black font-mono text-indigo-600 mt-1 hover:underline cursor-pointer"
              >
                {waitingForMe.length}
              </button>
            ) : (
              <div className="text-3xl font-black font-mono text-slate-300 mt-1">
                {waitingForMe.length}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Đã trừ hồ sơ do chính mình lập (kiểm soát kép)
            </p>
          </div>

          <div
            className={`p-4 border rounded-sm ${
              nearSlaBreach.length > 0 ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className={`h-3.5 w-3.5 ${nearSlaBreach.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Sắp quá hạn SLA nội bộ</span>
            </div>
            {canViewDetail && nearSlaBreach.length > 0 ? (
              <button
                onClick={() =>
                  openDrillDown('Hồ sơ sắp quá hạn SLA xử lý nội bộ', filterLabel, nearSlaBreach)
                }
                className="text-3xl font-black font-mono text-rose-600 mt-1 hover:underline cursor-pointer"
              >
                {nearSlaBreach.length}
              </button>
            ) : (
              <div
                className={`text-3xl font-black font-mono mt-1 ${
                  nearSlaBreach.length > 0 ? 'text-rose-600' : 'text-slate-300'
                }`}
              >
                {nearSlaBreach.length}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Quá {INTERNAL_SLA_DAYS} ngày kể từ ngày doanh nghiệp nộp
            </p>
          </div>

          <div className="p-4 border border-slate-200 rounded-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Cảnh báo &amp; nghĩa vụ quá hạn</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <button
                onClick={() => onNavigateToModule('qlny_status_control')}
                className="text-3xl font-black font-mono text-amber-600 hover:underline cursor-pointer"
              >
                {openAlerts.length}
              </button>
              <span className="text-xs text-slate-400">cảnh báo</span>
              <span className="text-2xl font-black font-mono text-rose-600">
                {overdueObligations.length}
              </span>
              <span className="text-xs text-slate-400">nghĩa vụ quá hạn</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rule Engine Điều 40/41 &amp; nhắc nộp</p>
          </div>
        </div>
      </div>

      <DrillDownGrid
        open={Boolean(drillDown)}
        title={drillDown?.title || ''}
        subtitle={drillDown?.subtitle}
        columns={drillColumns}
        rows={drillDown?.rows || []}
        rowKey={(row) => row.id}
        exportFileName="chi-tiet-dashboard"
        onClose={() => setDrillDown(null)}
      />
    </div>
  );
};
