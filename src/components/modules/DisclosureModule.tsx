/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Calendar,
  Filter,
  RotateCcw,
  Building2,
  X,
} from 'lucide-react';
import { Submission, Alert, Organization, TemplateDefinition } from '../../types/hnx';
import { INITIAL_ORGANIZATIONS, INITIAL_TEMPLATES } from '../../data/mockData';
import { StatusBadge } from '../common/StatusBadge';
import { WorkflowActionBar } from '../common/WorkflowActionBar';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';

interface DisclosureModuleProps {
  activeModule: string;
  submissions: Submission[];
  organizations?: Organization[];
  alerts: Alert[];
  templates?: TemplateDefinition[];
  onReviewSubmission: (subId: number) => void;
  onApproveSubmission: (subId: number, comment: string) => void;
  /** Lưu bản EN sau hiệu đính (FR-065). */
  onSaveTranslation: (subId: number, titleEn: string, contentEn: string) => void;
  /** Công bố VI + EN trong một hành động duy nhất. */
  onPublishBilingual: (subId: number, comment: string) => void;
  onRejectSubmission: (subId: number, reason: string) => void;
  onHideSubmission: (subId: number, reason: string) => void;
  onAuditHistory: (type: string, id: number, label: string) => void;
  /** Used by the dual-control guard in WorkflowActionBar (PZ6). */
  currentUserId?: number;
}

/**
 * Hàng đợi "cần xử lý". Có cả APPROVED vì sau khi tách vòng đời song ngữ, hồ sơ
 * đã duyệt bản VI vẫn còn việc: hiệu đính bản EN rồi công bố VI + EN.
 */
const isPendingStatus = (status: string) =>
  status === 'SUBMITTED' ||
  status === 'REVIEWED' ||
  status === 'PENDING_APPROVAL' ||
  status === 'APPROVED';

export const DisclosureModule: React.FC<DisclosureModuleProps> = ({
  activeModule,
  submissions,
  organizations = INITIAL_ORGANIZATIONS,
  alerts,
  templates = INITIAL_TEMPLATES,
  onReviewSubmission,
  onApproveSubmission,
  onSaveTranslation,
  onPublishBilingual,
  onRejectSubmission,
  onHideSubmission,
  onAuditHistory,
  currentUserId = 0,
}) => {
  // Chỉ giữ id: giữ nguyên cả object thì sau khi duyệt/từ chối, panel bên phải
  // vẫn hiển thị bản ghi cũ vì `submissions` đã được thay bằng object mới.
  const [selectedSubId, setSelectedSubId] = useState<number | null>(
    () => submissions.find((s) => isPendingStatus(s.status))?.id ?? null
  );

  const selectedSub = useMemo(
    () => (submissions || []).find((s) => s.id === selectedSubId) || null,
    [submissions, selectedSubId]
  );

  /**
   * Chỉ mẫu tin bật `autoTranslate` mới có vòng dịch — URD chỉ dịch tự động "một
   * số nhóm tin" (PRD §13.9 Đ38, AC-065-6).
   */
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedSub?.templateId) || null,
    [templates, selectedSub]
  );
  const needsTranslation = Boolean(selectedTemplate?.autoTranslate);
  const isProofreadStage = selectedSub?.status === 'APPROVED' && needsTranslation;

  // Bản nháp EN đang sửa. Đồng bộ lại khi đổi hồ sơ hoặc khi bản lưu thay đổi,
  // nếu không thì panel sẽ giữ nội dung của hồ sơ được chọn trước đó.
  const [draftTitleEn, setDraftTitleEn] = useState('');
  const [draftContentEn, setDraftContentEn] = useState('');

  useEffect(() => {
    setDraftTitleEn(selectedSub?.titleEn || '');
    setDraftContentEn(selectedSub?.contentEn || '');
  }, [selectedSub?.id, selectedSub?.titleEn, selectedSub?.contentEn]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'ALL'>('PENDING');

  // Filter submissions by status, organization name, and submission date
  const filteredSubmissions = useMemo(() => {
    return (submissions || []).filter((sub) => {
      // Status filter
      if (statusFilter === 'PENDING' && !isPendingStatus(sub.status)) return false;

      // Search term filter (Organization Name, Symbol, Submission No, Title)
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const org = organizations.find((o) => o.id === sub.organizationId);
        const orgShort = (org?.shortName || '').toLowerCase();
        const orgNameVi = (org?.nameVi || '').toLowerCase();
        const title = (sub.titleVi || '').toLowerCase();
        const subNo = (sub.submissionNo || '').toLowerCase();

        const matches =
          orgShort.includes(term) ||
          orgNameVi.includes(term) ||
          title.includes(term) ||
          subNo.includes(term);

        if (!matches) return false;
      }

      // Submission Date filter
      if (dateFilter) {
        const subDateStr = sub.submittedAt || sub.createdAt || '';
        const datePart = subDateStr.split('T')[0];
        if (datePart !== dateFilter) return false;
      }

      return true;
    });
  }, [submissions, organizations, statusFilter, searchTerm, dateFilter]);

  const inboxColumns: ColumnDef<Submission>[] = [
    {
      key: 'submissionNo',
      headerVi: 'Mã Hồ sơ / Tiêu đề Công bố',
      render: (row) => (
        <div>
          <div className="font-mono text-xs font-bold text-slate-800">{row.submissionNo}</div>
          <div className="font-bold text-slate-900 text-xs line-clamp-1">{row.titleVi}</div>
        </div>
      ),
    },
    {
      key: 'organizationId',
      headerVi: 'Doanh nghiệp CBTT',
      render: (row) => {
        const org = organizations.find((o) => o.id === row.organizationId);
        const displayName = org ? org.shortName || org.nameVi : `Doanh nghiệp ID ${row.organizationId || '-'}`;
        return (
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-900">
            <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>{displayName}</span>
          </div>
        );
      },
    },
    {
      key: 'submittedAt',
      headerVi: 'Ngày nộp',
      render: (row) => {
        const dateStr = row.submittedAt || row.createdAt;
        const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : '-';
        const formattedTime = dateStr ? new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
        return (
          <div className="font-mono text-xs text-slate-700">
            <span className="font-bold">{formattedDate}</span>
            {formattedTime && <span className="text-slate-400 text-[10px] ml-1">{formattedTime}</span>}
          </div>
        );
      },
    },
    {
      key: 'status',
      headerVi: 'Trạng thái Quy trình',
      render: (row) => <StatusBadge status={row.status} type="submission" />,
    },
    {
      key: 'id',
      headerVi: 'Thao tác',
      render: (row) => (
        <button
          onClick={() => setSelectedSubId(row.id)}
          className={`px-3 py-1 text-xs font-bold rounded-sm uppercase tracking-wider shadow-xs cursor-pointer ${
            selectedSubId === row.id
              ? 'bg-indigo-800 text-white ring-2 ring-indigo-400'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          Soát xét
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Phòng Công bố Thông tin & Giám sát (P.TTTT)
        </h1>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
          FR-039 → FR-045: Hàng đợi Soát xét Phê duyệt, Xử lý Vi phạm CBTT & Cấu hình Kênh Công bố
        </p>
      </div>

      {activeModule === 'tttt_inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inbox List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Hàng đợi Hồ sơ / Báo cáo (FR-039)
              </h3>

              {/* Status Queue Selector */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md text-xs">
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    statusFilter === 'PENDING'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cần xử lý ({(submissions || []).filter((s) => isPendingStatus(s.status)).length})
                </button>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả hồ sơ ({submissions.length})
                </button>
              </div>
            </div>

            {/* Search Filter Controls Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search by Organization Name / Symbol / Title / Code */}
                <div className="sm:col-span-7 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Lọc theo tên doanh nghiệp, mã CK, tiêu đề..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter by Submission Date */}
                <div className="sm:col-span-5 relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full pl-9 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    />
                  </div>

                  {/* Clear button */}
                  {(searchTerm || dateFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setDateFilter('');
                      }}
                      title="Xóa bộ lọc"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">Xóa lọc</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {(searchTerm || dateFilter) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 border-t border-slate-200/80 pt-2">
                  <span className="flex items-center font-bold text-indigo-700">
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    Bộ lọc đang dùng:
                  </span>

                  {searchTerm && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-full font-semibold text-[11px]">
                      <span>Doanh nghiệp: "{searchTerm}"</span>
                      <button onClick={() => setSearchTerm('')} className="hover:text-red-600 cursor-pointer ml-1 font-bold">
                        ×
                      </button>
                    </span>
                  )}

                  {dateFilter && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-full font-semibold text-[11px]">
                      <span>Ngày nộp: {new Date(dateFilter).toLocaleDateString('vi-VN')}</span>
                      <button onClick={() => setDateFilter('')} className="hover:text-red-600 cursor-pointer ml-1 font-bold">
                        ×
                      </button>
                    </span>
                  )}

                  <span className="text-slate-400 font-mono text-[11px] ml-auto">
                    Hiển thị {filteredSubmissions.length} kết quả
                  </span>
                </div>
              )}
            </div>

            <DynamicTable data={filteredSubmissions} columns={inboxColumns} />
          </div>

          {/* Workflow Review Side Panel */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Chi tiết Phê duyệt Hồ sơ (Workflow Action Bar)
            </h3>

            {selectedSub ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1 text-xs">
                  <div className="font-mono text-slate-500">{selectedSub.submissionNo}</div>
                  <div className="font-bold text-slate-900">{selectedSub.titleVi}</div>
                  <div className="text-slate-600 mt-1">Pháp lý: Thông tư 96/2020/TT-BTC</div>
                  {selectedSub.translationStatus && (
                    <div className="pt-1">
                      <StatusBadge status={selectedSub.translationStatus} type="translation" />
                    </div>
                  )}
                </div>

                {/* Hiệu đính bản dịch EN — một vòng đời, công bố VI + EN cùng lúc */}
                {isProofreadStage && (
                  <div className="border border-sky-200 bg-sky-50/60 rounded-sm p-3 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Hiệu đính bản dịch tiếng Anh (FR-065)
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Bản EN gắn 1-1 với bản VI, không có vòng phê duyệt riêng. Hiệu đính xong
                        mới mở được nút công bố, và hai bản sẽ đăng cùng lúc.
                      </p>
                      <p className="text-[11px] text-slate-500 italic">
                        Phạm vi dịch: tiêu đề và nội dung tin — không dịch file đính kèm.
                      </p>
                    </div>

                    {/* Hai cột song song VI | EN (AC-065-3) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Bản gốc (VI)
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-sm text-[11px] text-slate-800 font-medium">
                          {selectedSub.titleVi}
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-sm text-[11px] text-slate-700 min-h-[80px]">
                          {String(selectedSub.payload?.summary_note || 'Không có nội dung tóm tắt.')}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">
                          Bản dịch (EN) — sửa được
                        </div>
                        <input
                          type="text"
                          value={draftTitleEn}
                          onChange={(e) => setDraftTitleEn(e.target.value)}
                          placeholder="Tiêu đề tiếng Anh"
                          className="w-full px-2 py-2 border border-sky-300 rounded-sm text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <textarea
                          rows={4}
                          value={draftContentEn}
                          onChange={(e) => setDraftContentEn(e.target.value)}
                          placeholder="Nội dung tiếng Anh"
                          className="w-full px-2 py-2 border border-sky-300 rounded-sm text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        onSaveTranslation(selectedSub.id, draftTitleEn.trim(), draftContentEn.trim())
                      }
                      disabled={!draftTitleEn.trim() || !draftContentEn.trim()}
                      className={`w-full px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs ${
                        draftTitleEn.trim() && draftContentEn.trim()
                          ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Lưu bản hiệu đính
                    </button>
                  </div>
                )}

                <WorkflowActionBar
                  currentStatus={selectedSub.status}
                  submitterId={selectedSub.createdBy}
                  currentUserId={currentUserId}
                  reviewedAt={selectedSub.reviewedAt}
                  approvedAt={selectedSub.approvedAt}
                  needsTranslation={needsTranslation}
                  translationStatus={selectedSub.translationStatus}
                  onAction={(actionCode, comment, reason) => {
                    if (actionCode === 'REVIEW') {
                      onReviewSubmission(selectedSub.id);
                    } else if (actionCode === 'APPROVE') {
                      onApproveSubmission(selectedSub.id, comment || '');
                    } else if (actionCode === 'PUBLISH') {
                      onPublishBilingual(selectedSub.id, comment || '');
                    } else if (actionCode === 'REJECT' || actionCode === 'RETURN') {
                      onRejectSubmission(selectedSub.id, reason || '');
                    } else if (actionCode === 'HIDE') {
                      onHideSubmission(selectedSub.id, reason || '');
                    } else {
                      onAuditHistory('SUBMISSION', selectedSub.id, selectedSub.submissionNo);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Vui lòng chọn 1 hồ sơ từ danh sách bên trái để phê duyệt.
              </div>
            )}
          </div>
        </div>
      )}

      {activeModule === 'tttt_violations' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Quản lý Vi phạm Công bố Thông tin & Nhắc nộp (FR-041)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((a) => (
              <div key={a.id} className="p-4 bg-amber-50/70 border-l-4 border-l-amber-500 border border-amber-200 rounded-sm space-y-2 text-xs">
                <div className="font-bold text-amber-950">{a.titleVi}</div>
                <div className="text-slate-700">{a.suggestedAction}</div>
                <div className="text-slate-500 font-mono text-[10px]">Căn cứ: {a.legalBasis}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeModule === 'tttt_display_config' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Cấu hình Hiển thị & Đặt Lịch Công bố Thông tin (FR-042, FR-043)
          </h3>
          <div className="p-4 bg-slate-900 text-white border-l-4 border-l-indigo-500 rounded-sm text-xs space-y-2">
            <div className="font-bold uppercase tracking-wider text-indigo-300">Quy tắc Đăng tin Tự động:</div>
            <div className="text-slate-300">
              Tin công bố sau khi lãnh đạo duyệt sẽ tự động đồng bộ sang Website Công khai (Corporate News) trong vòng 30 giây.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
