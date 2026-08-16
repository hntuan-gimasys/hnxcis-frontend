/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Plus, FileSpreadsheet } from 'lucide-react';
import {
  Organization,
  Submission,
  SecurityItem,
  DisclosureObligation,
  TemplateDefinition,
  TemplateField,
  FieldDefinition,
  UserRoleCode,
  UserAccount,
  Alert as AlertType,
} from '../../types/hnx';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_TEMPLATES,
  INITIAL_SECURITIES,
  getTemplateFields,
} from '../../data/mockData';
import { StatusBadge } from '../common/StatusBadge';
import { DynamicForm } from '../common/DynamicForm';
import {
  DashboardFilterBar,
  DashboardFilters,
  DEFAULT_DASHBOARD_FILTERS,
} from '../common/DashboardFilterBar';
import { DrillDownGrid, DrillDownColumn } from '../common/DrillDownGrid';
import { exportToCsv } from '../../lib/exportCsv';
import { notificationService } from '../../services/notificationService';

/** Bốn loại báo cáo định kỳ của widget "Tình trạng Báo cáo định kỳ" (FR-027). */
const PERIODIC_REPORT_TYPES: Array<{
  code: NonNullable<DisclosureObligation['reportTypeCode']>;
  label: string;
}> = [
  { code: 'FS_QUARTER', label: 'BCTC Quý' },
  { code: 'FS_SEMI', label: 'BCTC Bán niên' },
  { code: 'ANNUAL_REPORT', label: 'Báo cáo Thường niên' },
  { code: 'GOVERNANCE', label: 'Báo cáo Quản trị' },
];

interface CorporatePortalProps {
  organization?: Organization;
  organizations?: Organization[];
  currentUser?: UserAccount;
  submissions?: Submission[];
  obligations?: DisclosureObligation[];
  templates?: TemplateDefinition[];
  securities?: SecurityItem[];
  fields?: (TemplateField & { fieldDef: FieldDefinition })[];
  userRole?: UserRoleCode;
  onNewSubmission?: (sub: Partial<Submission>) => void;
  onSubmitNewFiling?: (sub: Submission) => void;
  activeModule: string;
  alerts?: AlertType[];
}

export const CorporatePortal: React.FC<CorporatePortalProps> = ({
  organization: propOrganization,
  organizations = INITIAL_ORGANIZATIONS,
  currentUser,
  submissions = [],
  obligations = [],
  templates = INITIAL_TEMPLATES,
  securities = INITIAL_SECURITIES,
  fields,
  userRole = 'ROLE_ORG_STAFF',
  onNewSubmission,
  onSubmitNewFiling,
  activeModule,
  alerts = [],
}) => {
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const [subDrillDown, setSubDrillDown] = useState<{
    title: string;
    subtitle: string;
    rows: Submission[];
  } | null>(null);
  const [oblDrillDown, setOblDrillDown] = useState<{
    title: string;
    subtitle: string;
    rows: DisclosureObligation[];
  } | null>(null);

  const organization =
    propOrganization ||
    organizations.find((o) => o.id === currentUser?.organizationId) ||
    organizations[0] ||
    INITIAL_ORGANIZATIONS[0];

  const orgId = organization?.id || 1;

  /**
   * Cờ "Kích hoạt" (FR-047) quyết định mẫu có được dùng hay không — mẫu chưa kích
   * hoạt không được chào ra cho doanh nghiệp lập hồ sơ.
   */
  const activeTemplates = (templates || []).filter((t) => t.isActive);

  const orgSubmissions = (submissions || []).filter((s) => s.organizationId === orgId);
  const orgObligations = (obligations || []).filter((o) => o.organizationId === orgId);
  const orgAlerts = (alerts || []).filter((a) => a.organizationId === orgId);

  const boardBySecurityId = useMemo(() => {
    const map = new Map<number, string>();
    (securities || []).forEach((s) => map.set(s.id, s.board));
    return map;
  }, [securities]);

  /**
   * Một nguồn dữ liệu đã lọc duy nhất cho toàn bộ widget — đổi bộ lọc là mọi
   * widget tính lại cùng lúc, không widget nào giữ bản sao riêng.
   */
  const filteredSubmissions = useMemo(
    () =>
      orgSubmissions.filter((sub) => {
        if (filters.board !== 'ALL') {
          const board = sub.securityId ? boardBySecurityId.get(sub.securityId) : undefined;
          if (board !== filters.board) return false;
        }
        if (filters.period !== 'ALL' && sub.periodCode !== filters.period) return false;
        return true;
      }),
    [orgSubmissions, filters, boardBySecurityId]
  );

  const filteredObligations = useMemo(
    () =>
      orgObligations.filter((obl) => {
        if (filters.board !== 'ALL') {
          const board = obl.securityId ? boardBySecurityId.get(obl.securityId) : undefined;
          if (board !== filters.board) return false;
        }
        if (filters.period !== 'ALL' && obl.periodCode !== filters.period) return false;
        return true;
      }),
    [orgObligations, filters, boardBySecurityId]
  );

  const pendingSubs = filteredSubmissions.filter((s) =>
    ['DRAFT', 'PENDING_ORG_APPROVAL', 'SUBMITTED', 'REVIEWED', 'PENDING_APPROVAL', 'APPROVED'].includes(
      s.status
    )
  );
  const approvedSubs = filteredSubmissions.filter((s) => s.status === 'PUBLISHED');
  const rejectedSubs = filteredSubmissions.filter((s) => s.status === 'CANCELLED');

  const publishedTimeline = [...approvedSubs].sort((a, b) =>
    (b.publishedAt || '').localeCompare(a.publishedAt || '')
  );

  const urgentObligations = filteredObligations.filter(
    (o) => notificationService.evaluateObligationDeadline(o).isUrgent
  );

  const filterLabel = `Sàn: ${filters.board === 'ALL' ? 'Tất cả' : filters.board} · Kỳ: ${
    filters.period === 'ALL' ? 'Tất cả' : filters.period
  }`;

  const submissionDrillColumns: DrillDownColumn<Submission>[] = [
    {
      header: 'Mã hồ sơ',
      render: (row) => <span className="font-mono font-bold">{row.submissionNo}</span>,
      exportValue: (row) => row.submissionNo,
    },
    {
      header: 'Tiêu đề',
      render: (row) => <span className="font-medium text-slate-900">{row.titleVi}</span>,
      exportValue: (row) => row.titleVi,
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
    {
      header: 'Lý do từ chối',
      render: (row) => <span className="text-rose-700">{row.rejectReason || '-'}</span>,
      exportValue: (row) => row.rejectReason || '',
    },
  ];

  const obligationDrillColumns: DrillDownColumn<DisclosureObligation>[] = [
    {
      header: 'Tên nghĩa vụ',
      render: (row) => <span className="font-medium text-slate-900">{row.templateName}</span>,
      exportValue: (row) => row.templateName,
    },
    {
      header: 'Kỳ',
      render: (row) => <span className="font-mono">{row.periodCode}</span>,
      exportValue: (row) => row.periodCode,
    },
    {
      header: 'Hạn nộp',
      render: (row) => <span className="font-mono font-bold">{row.dueDate}</span>,
      exportValue: (row) => row.dueDate,
    },
    {
      header: 'Số ngày trễ',
      render: (row) => (
        <span className={row.lateDays ? 'text-rose-600 font-bold font-mono' : 'font-mono'}>
          {row.lateDays || 0}
        </span>
      ),
      exportValue: (row) => row.lateDays || 0,
    },
    {
      header: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
      exportValue: (row) => row.status,
    },
  ];

  const openDrillDown = (title: string, subtitle: string, rows: Submission[]) => {
    if (rows.length === 0) return;
    setSubDrillDown({ title, subtitle, rows });
  };

  const openObligationDrillDown = (
    title: string,
    subtitle: string,
    rows: DisclosureObligation[]
  ) => {
    if (rows.length === 0) return;
    setOblDrillDown({ title, subtitle, rows });
  };

  const exportSubmissions = (fileName: string, rows: Submission[]) =>
    exportToCsv(
      fileName,
      submissionDrillColumns.map((c) => ({ header: c.header, value: c.exportValue })),
      rows
    );

  const exportObligations = (fileName: string, rows: DisclosureObligation[]) =>
    exportToCsv(
      fileName,
      obligationDrillColumns.map((c) => ({ header: c.header, value: c.exportValue })),
      rows
    );

  const handleStartFiling = (template: TemplateDefinition) => {
    setSelectedTemplate(template);
    setShowFilingModal(true);
  };

  const handleFormSubmit = (payload: Record<string, any>) => {
    if (!selectedTemplate) return;

    if (onNewSubmission) {
      onNewSubmission({
        organizationId: orgId,
        templateId: selectedTemplate.id,
        templateKind: selectedTemplate.templateKind,
        newsGroupCode: selectedTemplate.newsGroupCode,
        titleVi: `${selectedTemplate.nameVi} - ${organization?.shortName || 'VNM'}`,
        payload,
        status: 'DRAFT',
        isPublic: false,
        lang: 'vi',
      });
    } else if (onSubmitNewFiling) {
      const fullSub: Submission = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: 1,
        versionNo: 1,
        isCurrent: true,
        submissionNo: `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        organizationId: orgId,
        securityId: 1,
        templateId: selectedTemplate.id,
        templateKind: selectedTemplate.templateKind,
        newsGroupCode: selectedTemplate.newsGroupCode,
        titleVi: `${selectedTemplate.nameVi} - ${organization?.shortName || 'VNM'}`,
        payload,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        isPublic: false,
        lang: 'vi',
        updatedAt: new Date().toISOString(),
      };
      onSubmitNewFiling(fullSub);
    }

    setShowFilingModal(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Corporate Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
              Mã chứng khoán: VNM
            </span>
            <span className="text-xs text-slate-500">MST: {organization?.taxCode || '0300588569'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {organization?.nameVi || 'Công ty Cổ phần Sữa Việt Nam'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cổng Khai báo & Công bố Thông tin Tự phục vụ Doanh nghiệp (Corporate Portal FR-062)
          </p>
        </div>

        <button
          onClick={() => handleStartFiling(activeTemplates[0])}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Lập Báo cáo / Khai báo Mới</span>
        </button>
      </div>

      {/* Dashboard Doanh nghiệp — 5 widget (FR-027) */}
      {activeModule === 'corp_dashboard' && (
        <div className="space-y-5">
          <DashboardFilterBar
            filters={filters}
            onChange={setFilters}
            resultCount={filteredSubmissions.length + filteredObligations.length}
          />

          {/* Widget 1 — Thống kê Báo cáo công bố theo trạng thái */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                1. Thống kê Báo cáo công bố
              </h3>
              <button
                onClick={() => exportSubmissions('bao-cao-cong-bo', filteredSubmissions)}
                disabled={filteredSubmissions.length === 0}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[11px] font-semibold ${
                  filteredSubmissions.length === 0
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Xuất Excel</span>
              </button>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">Không có dữ liệu</div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Đang chờ duyệt', rows: pendingSubs, tone: 'text-indigo-600' },
                  { label: 'Đã duyệt', rows: approvedSubs, tone: 'text-emerald-600' },
                  { label: 'Bị từ chối', rows: rejectedSubs, tone: 'text-rose-600' },
                ].map((cell) => (
                  <button
                    key={cell.label}
                    onClick={() =>
                      openDrillDown(`Báo cáo công bố — ${cell.label}`, filterLabel, cell.rows)
                    }
                    disabled={cell.rows.length === 0}
                    className={`p-3 border border-slate-200 rounded-xl text-center ${
                      cell.rows.length === 0 ? 'cursor-default' : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div
                      className={`text-2xl font-black font-mono ${
                        cell.rows.length === 0 ? 'text-slate-300' : cell.tone
                      }`}
                    >
                      {cell.rows.length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {cell.label}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Widget 2 — Tình trạng Báo cáo định kỳ: 4 loại × 3 trạng thái */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">2. Tình trạng Báo cáo định kỳ</h3>
              <button
                onClick={() => exportObligations('bao-cao-dinh-ky', filteredObligations)}
                disabled={filteredObligations.length === 0}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[11px] font-semibold ${
                  filteredObligations.length === 0
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Xuất Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Loại báo cáo</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-600">
                      Đã nộp đúng hạn
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-600">Chưa nộp</th>
                    <th className="px-3 py-2 text-center font-semibold text-rose-700">Quá hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERIODIC_REPORT_TYPES.map((type) => {
                    const rows = filteredObligations.filter(
                      (o) => o.reportTypeCode === type.code
                    );
                    const onTime = rows.filter((o) => o.status === 'FULFILLED');
                    const notYet = rows.filter(
                      (o) => o.status === 'PENDING' || o.status === 'SUBMITTED'
                    );
                    const overdue = rows.filter(
                      (o) => o.status === 'LATE' || o.status === 'MISSING'
                    );

                    const cell = (
                      list: typeof rows,
                      label: string,
                      danger = false
                    ) => (
                      <td className="px-3 py-2 text-center">
                        {list.length === 0 ? (
                          <span className="text-slate-300 font-mono font-bold">0</span>
                        ) : (
                          <button
                            onClick={() =>
                              openObligationDrillDown(`${type.label} — ${label}`, filterLabel, list)
                            }
                            className={`font-mono font-bold hover:underline cursor-pointer ${
                              danger ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {list.length}
                          </button>
                        )}
                      </td>
                    );

                    return (
                      <tr
                        key={type.code}
                        className={overdue.length > 0 ? 'bg-rose-50/60' : 'hover:bg-slate-50/60'}
                      >
                        <td className="px-3 py-2 font-semibold text-slate-900">{type.label}</td>
                        {cell(onTime, 'Đã nộp đúng hạn')}
                        {cell(notYet, 'Chưa nộp')}
                        {cell(overdue, 'Quá hạn', true)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Widget 3 — Danh sách Tin bị từ chối kèm lý do */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Danh sách Tin bị từ chối
            </h3>

            {rejectedSubs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không có tin nào bị từ chối
              </div>
            ) : (
              <div className="space-y-2">
                {rejectedSubs.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-rose-50/70 border-l-4 border-l-rose-500 border border-rose-200 rounded-xl space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{sub.titleVi}</span>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {sub.submissionNo}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      <span className="font-semibold">Lý do từ chối: </span>
                      {sub.rejectReason || 'Chưa ghi nhận lý do.'}
                    </p>
                    {sub.rejectedAt && (
                      <p className="text-[10px] text-slate-500 font-mono">
                        Từ chối ngày {new Date(sub.rejectedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 4 — Cảnh báo & Thông báo từ HNX và UBCKNN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. Cảnh báo &amp; Thông báo
            </h3>

            {orgAlerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không có cảnh báo nào
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {orgAlerts.map((al) => (
                  <div
                    key={al.id}
                    className={`p-3 border rounded-xl space-y-1.5 ${
                      al.severity === 'CRITICAL'
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          al.source === 'UBCKNN'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {al.source || 'HNX'}
                      </span>
                      {al.responseDeadline && (
                        <span className="text-[10px] font-mono font-bold text-rose-700">
                          Hạn phản hồi: {al.responseDeadline}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{al.titleVi}</div>
                    {al.suggestedAction && (
                      <p className="text-[11px] text-slate-700">{al.suggestedAction}</p>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono">Căn cứ: {al.legalBasis}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 5 — Lịch sử công bố thông tin dạng timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. Lịch sử công bố thông tin
            </h3>

            {publishedTimeline.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Chưa có tin nào được công bố
              </div>
            ) : (
              <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4">
                {publishedTimeline.map((sub) => (
                  <li key={sub.id} className="ml-4">
                    <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                    <div className="text-[10px] font-mono text-slate-500">
                      {sub.publishedAt
                        ? new Date(sub.publishedAt).toLocaleString('vi-VN')
                        : 'Chưa rõ thời điểm'}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{sub.titleVi}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-500">
                        {sub.submissionNo}
                      </span>
                      {sub.translationStatus === 'APPROVED' && (
                        <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xs text-[10px] font-bold">
                          Song ngữ VI + EN
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Nghĩa vụ sắp đến hạn — giữ lại phần "tôi đang nợ gì, hạn nào" */}
          {urgentObligations.length > 0 && (
            <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">
                  Cảnh báo Hạn nộp Gấp (≤ 7 ngày / Quá hạn)
                </h3>
              </div>

              <div className="space-y-2">
                {urgentObligations.map((obl) => {
                  const dlStatus = notificationService.evaluateObligationDeadline(obl);
                  return (
                    <div
                      key={obl.id}
                      className="p-3 bg-white border border-red-300 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-slate-900 text-xs">
                            {obl.templateName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] ${dlStatus.badgeStyle}`}>
                            {dlStatus.badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Kỳ: <span className="font-mono font-medium">{obl.periodCode}</span> | Hạn
                          chót:{' '}
                          <span className="font-mono font-bold text-red-600">{obl.dueDate}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const tpl =
                            activeTemplates.find((t) => t.id === obl.templateId) ||
                            activeTemplates[0];
                          if (tpl) handleStartFiling(tpl);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        Lập E-Form &amp; Nộp ngay
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DrillDownGrid
            open={Boolean(subDrillDown)}
            title={subDrillDown?.title || ''}
            subtitle={subDrillDown?.subtitle}
            columns={submissionDrillColumns}
            rows={subDrillDown?.rows || []}
            rowKey={(row) => row.id}
            exportFileName="chi-tiet-bao-cao-cong-bo"
            onClose={() => setSubDrillDown(null)}
          />

          <DrillDownGrid
            open={Boolean(oblDrillDown)}
            title={oblDrillDown?.title || ''}
            subtitle={oblDrillDown?.subtitle}
            columns={obligationDrillColumns}
            rows={oblDrillDown?.rows || []}
            rowKey={(row) => row.id}
            exportFileName="chi-tiet-nghia-vu-bao-cao"
            onClose={() => setOblDrillDown(null)}
          />
        </div>
      )}

      {/* Submissions & Filing List */}
      {(activeModule === 'corp_filing' || activeModule === 'corp_history') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {activeModule === 'corp_filing'
                ? 'Danh sách Hồ sơ / Báo cáo Đang Soạn thảo & Gửi Sở'
                : 'Lịch sử Công bố Thông tin (Chỉ xem)'}
            </h3>

            <div className="flex items-center space-x-2">
              {activeTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleStartFiling(tpl)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 cursor-pointer"
                >
                  + {tpl.nameVi}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {orgSubmissions.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">Chưa có hồ sơ nào</div>
            ) : (
              orgSubmissions.map((sub) => (
                <div key={sub.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-slate-500">{sub.submissionNo}</span>
                        <StatusBadge status={sub.status} type="submission" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.titleVi}</h4>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xs text-slate-400">
                        {sub.submittedAt
                          ? `Gửi ngày: ${new Date(sub.submittedAt).toLocaleDateString('vi-VN')}`
                          : 'Đang tạo nháp'}
                      </div>
                    </div>
                  </div>

                  {sub.payload && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 font-mono">
                      {JSON.stringify(sub.payload)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Filing Modal with DynamicForm */}
      {showFilingModal && selectedTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 text-slate-900 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lập E-Form Báo cáo: {selectedTemplate.nameVi}
                </h3>
                <p className="text-xs text-slate-500">
                  Form Engine (FE) tự động validate các trường bắt buộc & tính công thức tiêu đề
                </p>
              </div>
              <button
                onClick={() => setShowFilingModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <DynamicForm
              key={selectedTemplate.id}
              template={selectedTemplate}
              fields={
                // Chỉ lấy trường của đúng biểu mẫu đang lập, không đổ toàn bộ.
                (fields || getTemplateFields(selectedTemplate.id)).filter(
                  (f) => f.templateId === selectedTemplate.id
                )
              }
              userRole={userRole}
              orgName={organization?.shortName || 'VNM'}
              symbol="VNM"
              onSubmit={handleFormSubmit}
              onCancel={() => setShowFilingModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
