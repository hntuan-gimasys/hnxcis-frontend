/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  FileCheck,
  Clock,
  Send,
  Plus,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Organization,
  Submission,
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
  getTemplateFields,
} from '../../data/mockData';
import { StatusBadge } from '../common/StatusBadge';
import { DynamicForm } from '../common/DynamicForm';
import { notificationService } from '../../services/notificationService';

interface CorporatePortalProps {
  organization?: Organization;
  organizations?: Organization[];
  currentUser?: UserAccount;
  submissions?: Submission[];
  obligations?: DisclosureObligation[];
  templates?: TemplateDefinition[];
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
  fields,
  userRole = 'ROLE_ORG_STAFF',
  onNewSubmission,
  onSubmitNewFiling,
  activeModule,
}) => {
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);

  const organization =
    propOrganization ||
    organizations.find((o) => o.id === currentUser?.organizationId) ||
    organizations[0] ||
    INITIAL_ORGANIZATIONS[0];

  const orgId = organization?.id || 1;

  const orgSubmissions = (submissions || []).filter((s) => s.organizationId === orgId);
  const orgObligations = (obligations || []).filter((o) => o.organizationId === orgId);

  const overdueCount = orgObligations.filter((o) => o.status === 'LATE' || o.status === 'MISSING').length;
  const pendingCount = orgObligations.filter((o) => o.status === 'PENDING').length;
  const fulfilledCount = orgObligations.filter((o) => o.status === 'FULFILLED').length;

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
          onClick={() => handleStartFiling(templates[0])}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Lập Báo cáo / Khai báo Mới</span>
        </button>
      </div>

      {/* Dashboard Obligations View (FR-062) */}
      {activeModule === 'corp_dashboard' && (
        <div className="space-y-6">
          {/* Color-Coded Status Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
                  Cờ Đỏ: Đã Quá Hạn
                </span>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-900">{overdueCount} Nghĩa vụ</div>
              <p className="text-[11px] text-red-700">Yêu cầu hoàn thành ngay để tránh bị xử lý vi phạm</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Cờ Vàng: Sắp Đến Hạn (≤7 Ngày)
                </span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-900">
                {orgObligations.filter((o) => notificationService.evaluateObligationDeadline(o).isWithin7Days).length} Nghĩa vụ
              </div>
              <p className="text-[11px] text-amber-700">Cần nộp gấp trong vòng 7 ngày tới</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Cờ Xanh: Đã Hoàn Thành
                </span>
                <FileCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900">{fulfilledCount} Báo cáo</div>
              <p className="text-[11px] text-emerald-700">Đã nộp & được HNX ghi nhận thành công</p>
            </div>
          </div>

          {/* High Priority Deadline Alert Banner (Deadlines within 7 days highlighted in red) */}
          {orgObligations.some((o) => notificationService.evaluateObligationDeadline(o).isUrgent) && (
            <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">
                    Cảnh báo Hạn nộp Báo cáo Gấp (≤ 7 Ngày / Quá Hạn)
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-red-600 text-white font-mono text-[10px] font-bold rounded-sm animate-pulse uppercase">
                  Notification Service Alert
                </span>
              </div>

              <div className="space-y-2">
                {orgObligations
                  .filter((o) => notificationService.evaluateObligationDeadline(o).isUrgent)
                  .map((obl) => {
                    const dlStatus = notificationService.evaluateObligationDeadline(obl);
                    return (
                      <div
                        key={obl.id}
                        className="p-3 bg-white border border-red-300 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{obl.templateName}</span>
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] ${dlStatus.badgeStyle}`}>
                              {dlStatus.badgeText}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Kỳ: <span className="font-mono font-medium">{obl.periodCode}</span> | Hạn chót:{' '}
                            <span className="font-mono font-bold text-red-600">{obl.dueDate}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            const tpl = templates.find((t) => t.id === obl.templateId) || templates[0];
                            handleStartFiling(tpl);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          Lập E-Form & Nộp ngay
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Table of Obligations with Direct Action Buttons */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Lịch Nghĩa vụ Báo cáo & Công bố Thông tin (Định kỳ & Bất thường)</span>
              <span className="text-xs font-normal text-slate-500">Tự động sinh theo Quy định</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tên Nghĩa vụ Báo cáo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Kỳ báo cáo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Hạn nộp & Cảnh báo (Notification Service)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Thao tác Nộp ngay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {orgObligations.map((obl, idx) => {
                    const dlStatus = notificationService.evaluateObligationDeadline(obl);
                    return (
                      <tr
                        key={obl.id}
                        className={
                          dlStatus.isUrgent
                            ? 'bg-red-50/50 hover:bg-red-50 border-l-4 border-l-red-600 transition-colors'
                            : 'hover:bg-slate-50/80 transition-colors'
                        }
                      >
                        <td className="px-4 py-3 text-xs text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{obl.templateName}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{obl.periodCode}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900">{obl.dueDate}</span>
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] ${dlStatus.badgeStyle}`}>
                              {dlStatus.badgeText}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={obl.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {obl.status !== 'FULFILLED' ? (
                            <button
                              onClick={() => {
                                const tpl = templates.find((t) => t.id === obl.templateId) || templates[0];
                                handleStartFiling(tpl);
                              }}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer ${
                                dlStatus.isUrgent
                                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Nộp ngay</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">✓ Đã nộp</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
              {templates.map((tpl) => (
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
