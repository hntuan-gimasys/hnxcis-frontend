/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Building,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  CalendarDays,
  FileText,
  FileDown,
  Lock,
  Plus,
} from 'lucide-react';
import {
  Organization,
  SecurityItem,
  EquityProfile,
  BondProfile,
  Alert,
  SurveillanceRecord,
  RegistrationDossier,
  FeeRecord,
  UserRoleCode,
} from '../../types/hnx';
import {
  DOSSIER_FORMS,
  DOSSIER_STATUS_LABEL,
  DOSSIER_STATUS_STYLE,
  DOSSIER_DEADLINE_DAYS,
  getAvailableForms,
  getDaysSinceReceived,
  getSubmitBlockReason,
} from '../../data/dossierForms';
import { StatusBadge } from '../common/StatusBadge';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';

/**
 * Sidebar module code <-> sub tab. The sub tabs and the sidebar entries are two
 * views of the same selection, so the tab is derived from `activeModule` rather
 * than kept in local state (otherwise picking "Kiểm soát Trạng thái" in the
 * sidebar would still land on the "Hồ sơ Cổ phiếu" tab).
 */
const MODULE_TO_TAB: Record<string, string> = {
  qlny_equities: 'equities',
  qlny_dossiers: 'dossiers',
  qlny_status_control: 'status_control',
  qlny_delisting: 'delisting',
  qlny_fees: 'fees',
  qlny_corp_actions: 'corp_actions',
};

const TAB_TO_MODULE: Record<string, string> = {
  equities: 'qlny_equities',
  dossiers: 'qlny_dossiers',
  status_control: 'qlny_status_control',
  delisting: 'qlny_delisting',
  fees: 'qlny_fees',
  corp_actions: 'qlny_corp_actions',
};

interface ListingModuleProps {
  activeModule: string;
  onChangeModule: (moduleCode: string) => void;
  organizations: Organization[];
  securities: SecurityItem[];
  equityProfiles: EquityProfile[];
  bondProfiles: BondProfile[];
  alerts: Alert[];
  surveillanceRecords: SurveillanceRecord[];
  dossiers: RegistrationDossier[];
  fees: FeeRecord[];
  userRole: UserRoleCode;
  onAuditHistory: (type: string, id: number, label: string) => void;
  /** Xác nhận đã thanh toán phí — mở guard trình duyệt (FR-006 AC-006-2). */
  onConfirmDossierFee: (dossierId: number) => void;
}

export const ListingModule: React.FC<ListingModuleProps> = ({
  activeModule,
  onChangeModule,
  organizations,
  securities,
  equityProfiles,
  bondProfiles,
  alerts,
  surveillanceRecords,
  dossiers,
  fees,
  userRole,
  onAuditHistory,
  onConfirmDossierFee,
}) => {
  const subTab = MODULE_TO_TAB[activeModule] || 'equities';
  const setSubTab = (tab: string) => onChangeModule(TAB_TO_MODULE[tab] || 'qlny_equities');

  /** Diện đang áp dụng = chưa có ngày ra (PRD §5.2.8.b, idx_surv_open). */
  const [survFilter, setSurvFilter] = useState<'OPEN' | 'ALL'>('OPEN');

  const [selectedDossierId, setSelectedDossierId] = useState<number | null>(
    () => dossiers?.[0]?.id ?? null
  );

  // Giữ id thay vì cả object: sau khi xác nhận phí, mảng dossiers được thay bằng
  // object mới nên panel bên phải phải đọc lại từ nguồn để không hiện bản cũ.
  const selectedDossier = useMemo(
    () => (dossiers || []).find((d) => d.id === selectedDossierId) || null,
    [dossiers, selectedDossierId]
  );

  const dossierColumns: ColumnDef<RegistrationDossier>[] = [
    {
      key: 'dossierNo',
      headerVi: 'Số hồ sơ / Mã CK',
      render: (row) => {
        const org = organizations.find((o) => o.id === row.organizationId);
        return (
          <div className="space-y-0.5">
            <div className="font-mono text-[11px] font-bold text-slate-800">{row.dossierNo}</div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-indigo-700 text-sm font-mono">{row.symbol}</span>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-xs text-[10px] font-bold">
                {row.board}
              </span>
            </div>
            <div className="text-[11px] text-slate-600">{org?.nameVi || '-'}</div>
          </div>
        );
      },
    },
    {
      key: 'registeredQuantity',
      headerVi: 'SL đăng ký (CP)',
      render: (row) => (
        <span className="font-mono text-xs">{row.registeredQuantity.toLocaleString('vi-VN')}</span>
      ),
    },
    {
      key: 'status',
      headerVi: 'Trạng thái hồ sơ',
      render: (row) => (
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${DOSSIER_STATUS_STYLE[row.status]}`}
        >
          {DOSSIER_STATUS_LABEL[row.status]}
        </span>
      ),
    },
    {
      key: 'receivedDate',
      headerVi: 'Ngày tiếp nhận / Số ngày',
      render: (row) => {
        const days = getDaysSinceReceived(row);
        const overDeadline = days > DOSSIER_DEADLINE_DAYS && row.status !== 'COMPLETED';
        return (
          <div className="font-mono text-xs">
            <div className="font-bold text-slate-800">{row.receivedDate}</div>
            <div className={overDeadline ? 'text-rose-600 font-bold' : 'text-slate-500'}>
              {days} ngày{overDeadline ? ` (quá ${DOSSIER_DEADLINE_DAYS} ngày)` : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'feePaymentStatus',
      headerVi: 'Thanh toán phí',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-xs text-xs font-bold uppercase tracking-wider border ${
            row.feePaymentStatus === 'CONFIRMED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {row.feePaymentStatus === 'CONFIRMED' ? '✓ Đã thanh toán phí' : '✕ Chưa thanh toán phí'}
        </span>
      ),
    },
  ];

  const openSurvCount = useMemo(
    () => (surveillanceRecords || []).filter((r) => !r.endDate).length,
    [surveillanceRecords]
  );

  const filteredSurvRecords = useMemo(
    () =>
      survFilter === 'OPEN'
        ? (surveillanceRecords || []).filter((r) => !r.endDate)
        : surveillanceRecords || [],
    [surveillanceRecords, survFilter]
  );

  const surveillanceColumns: ColumnDef<SurveillanceRecord>[] = [
    {
      key: 'securityId',
      headerVi: 'Mã CK / TCNY',
      render: (row) => {
        const sec = securities.find((s) => s.id === row.securityId);
        const org = organizations.find((o) => o.id === row.organizationId);
        return (
          <div>
            <div className="font-extrabold text-indigo-700 text-sm font-mono">
              {sec?.symbol || '-'}
            </div>
            <div className="text-xs text-slate-600 font-medium">{org?.nameVi || '-'}</div>
          </div>
        );
      },
    },
    {
      key: 'controlStatus',
      headerVi: 'Trạng thái Kiểm soát',
      render: (row) => <StatusBadge status={row.controlStatus} type="surveillance" />,
    },
    {
      key: 'startDate',
      headerVi: 'Từ ngày → Đến ngày',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-slate-800">{row.startDate || '-'}</div>
          <div className={row.endDate ? 'text-slate-500' : 'text-emerald-700 font-bold'}>
            {row.endDate ? `→ ${row.endDate}` : '→ Đang áp dụng'}
          </div>
        </div>
      ),
    },
    {
      key: 'entryReason',
      headerVi: 'Lý do đưa vào / Quyết định',
      render: (row) => (
        <div className="max-w-md space-y-1">
          <div className="text-xs text-slate-700">{row.entryReason}</div>
          <div className="font-mono text-[10px] text-slate-500">
            {row.decisionRef} — ngày {row.decisionDate}
            {row.ruleCode && ` | Rule: ${row.ruleCode}`}
          </div>
        </div>
      ),
    },
    {
      key: 'orgExplained',
      headerVi: 'TCNY đã giải trình?',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-xs text-xs font-bold uppercase tracking-wider border ${
            row.orgExplained
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {row.orgExplained ? '✓ Đã giải trình' : '✕ Chưa giải trình'}
        </span>
      ),
    },
  ];

  const equityColumns: ColumnDef<EquityProfile>[] = [
    {
      key: 'securityId',
      headerVi: 'Mã CK / Tên Cổ phiếu',
      render: (row) => {
        const sec = securities.find((s) => s.id === row.securityId);
        const org = sec ? organizations.find((o) => o.id === sec.organizationId) : null;
        return (
          <div>
            <div className="font-extrabold text-indigo-700 text-sm flex items-center space-x-1.5 font-mono">
              <span>{sec?.symbol || 'VNM'}</span>
              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-xs text-[10px] font-bold">
                {row.listingBoard}
              </span>
            </div>
            <div className="text-xs text-slate-600 font-medium">{org?.nameVi}</div>
          </div>
        );
      },
    },
    {
      key: 'listedQuantity',
      headerVi: 'SL Niêm yết (CP)',
      render: (row) => <span className="font-mono">{row.listedQuantity.toLocaleString('vi-VN')}</span>,
    },
    {
      key: 'outstandingQuantity',
      headerVi: 'SL Lưu hành (CP)',
      render: (row) => <span className="font-mono">{row.outstandingQuantity.toLocaleString('vi-VN')}</span>,
    },
    {
      key: 'securityStatus',
      // Picklist 5 giá trị. Diện giám sát (9 giá trị) nằm ở tab "Kiểm soát Trạng thái".
      headerVi: 'Trạng thái Chứng khoán',
      render: (row) => <StatusBadge status={row.securityStatus} type="security" />,
    },
    {
      key: 'marginEligible',
      headerVi: 'Ký quỹ (Margin)',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-xs text-xs font-bold uppercase tracking-wider ${
            row.marginEligible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.marginEligible ? '✓ Đủ ĐK' : '✕ Không (KKQ)'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Nghiệp vụ Quản lý Niêm yết (P.QLNY)
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
            FR-001 → FR-019: Quản lý Hồ sơ Cổ phiếu, Cảnh báo Giám sát & Phí niêm yết
          </p>
        </div>

        <button
          onClick={() => alert('Thêm hồ sơ mã cổ phiếu mới trên nền TCPH đã có (FR-001)')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Hồ sơ Cổ phiếu Mới</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('equities')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
            subTab === 'equities' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Hồ sơ Cổ phiếu (FR-001)</span>
        </button>

        <button
          onClick={() => setSubTab('dossiers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
            subTab === 'dossiers' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Hồ sơ ĐKGD &amp; Mẫu 01–06 (FR-006)</span>
        </button>

        <button
          onClick={() => setSubTab('status_control')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
            subTab === 'status_control'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>Kiểm soát Trạng thái (Đ40-44)</span>
        </button>

        <button
          onClick={() => setSubTab('delisting')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
            subTab === 'delisting' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
          <span>Hủy Niêm yết (FR-010,011)</span>
        </button>

        <button
          onClick={() => setSubTab('fees')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
            subTab === 'fees' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Quản lý Phí Niêm yết (FR-017)</span>
        </button>

        <button
          onClick={() => setSubTab('corp_actions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
            subTab === 'corp_actions'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Sự kiện DN & Sổ T+2 (FR-018)</span>
        </button>
      </div>

      {/* Tab Content */}
      {subTab === 'equities' && (
        <DynamicTable
          title="Danh sách Hồ sơ Cổ phiếu Niêm yết & ĐKGD"
          columns={equityColumns}
          data={equityProfiles}
          density="compact"
          onRowActivate={(row) => onAuditHistory('EQUITY_PROFILE', row.id, row.equityName)}
          onExportExcel={() => alert('Đã xuất danh sách Cổ phiếu (.xlsx) giữ nguyên định dạng!')}
          actions={(row) => (
            <button
              onClick={() => onAuditHistory('EQUITY_PROFILE', row.id, row.equityName)}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Lịch sử log
            </button>
          )}
        />
      )}

      {subTab === 'dossiers' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Danh sách hồ sơ ĐKGD */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Hồ sơ Đăng ký Giao dịch Cổ phiếu (FR-004 → FR-006)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Biểu mẫu kết xuất được xác định theo trạng thái hồ sơ. Riêng Mẫu số 06 chỉ trình
                duyệt được sau khi cập nhật "Đã thanh toán phí".
              </p>
            </div>

            <DynamicTable
              columns={dossierColumns}
              data={dossiers || []}
              density="compact"
              onRowActivate={(row) => setSelectedDossierId(row.id)}
              searchPlaceholder="Tìm theo số hồ sơ, mã CK, doanh nghiệp..."
              onExportExcel={() => alert('Đã xuất danh sách Hồ sơ ĐKGD (.xlsx)!')}
              actions={(row) => (
                <button
                  onClick={() => setSelectedDossierId(row.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-sm uppercase tracking-wider shadow-xs cursor-pointer ${
                    selectedDossierId === row.id
                      ? 'bg-indigo-800 text-white ring-2 ring-indigo-400'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  Xử lý
                </button>
              )}
            />
          </div>

          {/* Panel kết xuất biểu mẫu theo trạng thái */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Kết xuất Biểu mẫu &amp; Trình duyệt
            </h3>

            {!selectedDossier ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Vui lòng chọn một hồ sơ từ danh sách bên trái.
              </div>
            ) : (
              (() => {
                const availableForms = getAvailableForms(selectedDossier.status);
                const blockReason = getSubmitBlockReason(selectedDossier);
                const daysElapsed = getDaysSinceReceived(selectedDossier);
                const overDeadline =
                  daysElapsed > DOSSIER_DEADLINE_DAYS && selectedDossier.status !== 'COMPLETED';

                return (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1 text-xs">
                      <div className="font-mono text-slate-500">{selectedDossier.dossierNo}</div>
                      <div className="font-bold text-slate-900">
                        {selectedDossier.symbol} —{' '}
                        {selectedDossier.registeredQuantity.toLocaleString('vi-VN')} CP
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${DOSSIER_STATUS_STYLE[selectedDossier.status]}`}
                      >
                        {DOSSIER_STATUS_LABEL[selectedDossier.status]}
                      </span>
                      {selectedDossier.appraisalNote && (
                        <p className="text-slate-600 pt-1">{selectedDossier.appraisalNote}</p>
                      )}
                    </div>

                    {overDeadline && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm text-[11px] text-rose-800">
                        Hồ sơ đã quá {DOSSIER_DEADLINE_DAYS} ngày kể từ ngày tiếp nhận (
                        {daysElapsed} ngày) — căn cứ phát hành{' '}
                        <span className="font-semibold">Mẫu số 02</span>.
                      </div>
                    )}

                    {/* Khối phí — điều kiện mở nút trình duyệt */}
                    <div className="p-3 border border-slate-200 rounded-sm space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Phí ĐKGD</span>
                        <span className="font-mono font-bold text-blue-700">
                          {selectedDossier.feeAmount.toLocaleString('vi-VN')} VND
                        </span>
                      </div>

                      {selectedDossier.feePaymentStatus === 'CONFIRMED' ? (
                        <div className="text-[11px] text-emerald-700">
                          ✓ Đã thanh toán phí — xác nhận bởi {selectedDossier.feeConfirmedBy} ngày{' '}
                          {selectedDossier.feeConfirmedAt
                            ? new Date(selectedDossier.feeConfirmedAt).toLocaleDateString('vi-VN')
                            : '-'}
                        </div>
                      ) : (
                        <button
                          onClick={() => onConfirmDossierFee(selectedDossier.id)}
                          className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
                        >
                          Cập nhật "Đã thanh toán phí"
                        </button>
                      )}
                    </div>

                    {/* Mẫu 01–06 hợp lệ với trạng thái hiện tại */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Biểu mẫu kết xuất được ({availableForms.length}/{DOSSIER_FORMS.length})
                      </div>

                      {availableForms.length === 0 ? (
                        <p className="text-[11px] text-slate-500 py-2">
                          Trạng thái hiện tại chưa phát sinh biểu mẫu nào cần kết xuất.
                        </p>
                      ) : (
                        availableForms.map((form) => (
                          <div
                            key={form.code}
                            className="p-2.5 border border-slate-200 rounded-sm space-y-1.5"
                          >
                            <div className="text-[11px] font-bold text-slate-900">{form.code}</div>
                            <p className="text-[11px] text-slate-600">{form.nameVi}</p>
                            <button
                              onClick={() =>
                                alert(
                                  `Kết xuất ${form.code} cho hồ sơ ${selectedDossier.dossierNo} (.docx)`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm text-[11px] font-semibold cursor-pointer"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              <span>Kết xuất &amp; in bản cứng</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Guard trình duyệt (AC-006-1) */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <button
                        disabled={Boolean(blockReason)}
                        title={blockReason || 'Trình Lãnh đạo Sở phê duyệt hồ sơ'}
                        onClick={() =>
                          alert(`Đã trình duyệt hồ sơ ${selectedDossier.dossierNo} lên Lãnh đạo Sở.`)
                        }
                        className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs ${
                          blockReason
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                        }`}
                      >
                        {blockReason && <Lock className="h-3.5 w-3.5" />}
                        <span>Trình duyệt</span>
                      </button>

                      {blockReason && (
                        <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-2">
                          {blockReason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {subTab === 'status_control' && (
        <div className="space-y-6">
          {/* Danh sách bản ghi diện giám sát — picklist `Trạng thái kiểm soát` 9 giá trị */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Danh sách Kiểm soát Niêm yết / ĐKGD (FR-008)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mỗi lần đưa một mã CK vào / ra một diện là một bản ghi riêng. Danh mục{' '}
                  <span className="font-semibold text-slate-700">Trạng thái kiểm soát</span> gồm 9
                  giá trị, khác với <span className="font-semibold text-slate-700">Trạng thái
                  chứng khoán</span> (5 giá trị) trên hồ sơ cổ phiếu.
                </p>
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md text-xs shrink-0">
                <button
                  onClick={() => setSurvFilter('OPEN')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    survFilter === 'OPEN'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đang áp dụng ({openSurvCount})
                </button>
                <button
                  onClick={() => setSurvFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    survFilter === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Toàn bộ lịch sử ({(surveillanceRecords || []).length})
                </button>
              </div>
            </div>

            <DynamicTable
              columns={surveillanceColumns}
              data={filteredSurvRecords}
              density="compact"
              onRowActivate={(row) =>
                onAuditHistory(
                  'SURVEILLANCE_RECORD',
                  row.id,
                  `${securities.find((sec) => sec.id === row.securityId)?.symbol || ''} - ${row.decisionRef}`
                )
              }
              searchPlaceholder="Tìm theo mã CK, lý do, số quyết định..."
              onExportExcel={() =>
                alert('Đã xuất Danh sách kiểm soát niêm yết (.xlsx) giữ nguyên định dạng!')
              }
              actions={(row) => (
                <button
                  onClick={() =>
                    onAuditHistory(
                      'SURVEILLANCE_RECORD',
                      row.id,
                      `${securities.find((s) => s.id === row.securityId)?.symbol || ''} - ${row.decisionRef}`
                    )
                  }
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Lịch sử log
                </button>
              )}
            />
          </div>

          {/* Cảnh báo Rule Engine đề xuất đưa vào diện */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Cảnh báo & Đề xuất Đưa vào Diện Giám sát (Điều 40, 41, 42, 44)
              </h3>
              <span className="text-xs text-slate-500 font-mono">Tự động rà soát theo BCTC & Vi phạm</span>
            </div>

            <div className="space-y-3">
            {(alerts || []).map((al) => (
              <div key={al.id} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-900 text-sm">{al.titleVi}</div>
                  <span className="px-2.5 py-1 bg-amber-200 text-amber-900 font-bold rounded-lg text-[10px]">
                    {al.ruleCode}
                  </span>
                </div>
                <div className="text-slate-700">{al.suggestedAction}</div>
                <div className="p-2 bg-white rounded-lg border border-amber-200 font-mono text-[11px]">
                  Bằng chứng: {JSON.stringify(al.evidenceJson)}
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    onClick={() => alert('Đã bỏ qua cảnh báo với lý do được ghi log.')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                  >
                    Bỏ qua (Bắt buộc lý do X7)
                  </button>
                  <button
                    onClick={() => alert('Khởi tạo Tờ trình/Quyết định đưa chứng khoán vào diện Cảnh báo!')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-2xs"
                  >
                    Khởi tạo Hồ sơ Xử lý
                  </button>
                </div>
              </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'delisting' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Quản lý Hủy Niêm yết Tự nguyện & Bắt buộc (FR-010, FR-011)
          </h3>
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
            <div className="font-bold text-sm">Rule Hủy Niêm yết Bắt buộc tự động:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Lỗ 3 năm liên tiếp (MDELIST_LOSS_3Y)</li>
              <li>Lỗ lũy kế vượt Vốn điều lệ (MDELIST_ACC_LOSS)</li>
              <li>Không giao dịch 12 tháng liên tục (MDELIST_NO_TRADE_12M)</li>
            </ul>
          </div>
        </div>
      )}

      {subTab === 'fees' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Quản lý Phí Niêm yết & Đăng ký Giao dịch (FR-017)
            </h3>
            <button
              onClick={() => alert('Tự động tính phí duy trì niêm yết năm 2026 cho toàn bộ DN!')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              + Chạy tính phí tự động
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(fees || []).map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">Vinamilk (VNM) - Phí duy trì niêm yết 2026</div>
                  <div className="text-slate-500 font-mono">Căn cứ tính: VĐL 20.899 Tỷ VND</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-black text-blue-700 text-sm">
                    {f.finalAmount.toLocaleString('vi-VN')} VND
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">
                    ✓ {f.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'corp_actions' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Quản lý Sự kiện Doanh nghiệp & Tính Ngày GDKHQ (T+2) (FR-018)
          </h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-slate-800">
              Công thức tự động tính Ngày GDKHQ bỏ qua Thứ 7, Chủ Nhật & Ngày lễ:
            </div>
            <div className="p-2 bg-slate-900 text-blue-300 font-mono rounded-lg">
              ex_date = calendarService.subtractWorkingDays(record_date, 1)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
