/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Building,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  CalendarDays,
  Plus,
} from 'lucide-react';
import {
  Organization,
  SecurityItem,
  EquityProfile,
  BondProfile,
  Alert,
  FeeRecord,
  UserRoleCode,
} from '../../types/hnx';
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
  qlny_status_control: 'status_control',
  qlny_delisting: 'delisting',
  qlny_fees: 'fees',
  qlny_corp_actions: 'corp_actions',
};

const TAB_TO_MODULE: Record<string, string> = {
  equities: 'qlny_equities',
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
  fees: FeeRecord[];
  userRole: UserRoleCode;
  onAuditHistory: (type: string, id: number, label: string) => void;
}

export const ListingModule: React.FC<ListingModuleProps> = ({
  activeModule,
  onChangeModule,
  organizations,
  securities,
  equityProfiles,
  bondProfiles,
  alerts,
  fees,
  userRole,
  onAuditHistory,
}) => {
  const subTab = MODULE_TO_TAB[activeModule] || 'equities';
  const setSubTab = (tab: string) => onChangeModule(TAB_TO_MODULE[tab] || 'qlny_equities');

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

      {subTab === 'status_control' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Cảnh báo & Đề xuất Kiểm soát Trạng thái Chứng khoán (Điều 40, 41, 42, 44)
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
