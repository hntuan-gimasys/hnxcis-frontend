/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, Gavel, ShieldOff, Scale, Info } from 'lucide-react';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';
import {
  INITIAL_TRADING_VIOLATIONS,
  INITIAL_STATUS_CASES,
  INITIAL_MARGIN_LIST,
} from '../../data/businessMock';
import type {
  Organization,
  TradingViolation,
  ListingStatusCase,
  MarginIneligibleEntry,
  UserRoleCode,
} from '../../types/hnx';

/**
 * Giám sát và xử lý trạng thái niêm yết — FR-005, FR-007, FR-009, FR-012 →
 * FR-015.
 *
 * Sáu chức năng này nằm chung một module vì cùng một hình dạng nghiệp vụ: phát
 * hiện (thủ công hoặc do Rule Engine sinh cảnh báo) → thông báo cho doanh
 * nghiệp → nhận giải trình → ra quyết định. Khác nhau chỉ ở căn cứ pháp lý và
 * hệ quả. Tách sáu module riêng sẽ nhân sáu lần cùng một khung bảng-và-quyết-định.
 */

interface SurveillanceModuleProps {
  activeModule: string;
  organizations: Organization[];
  userRole: UserRoleCode;
}

const orgName = (orgs: Organization[], id: number) => orgs.find((o) => o.id === id)?.shortName ?? `#${id}`;

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-sm text-[11px] text-slate-700 leading-relaxed">
    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
    <div>{children}</div>
  </div>
);

const Chip: React.FC<{ tone: 'ok' | 'warn' | 'bad' | 'mute'; children: React.ReactNode }> = ({ tone, children }) => {
  const cls = {
    ok: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    warn: 'bg-amber-100 text-amber-800 border-amber-300',
    bad: 'bg-rose-100 text-rose-800 border-rose-300',
    mute: 'bg-slate-100 text-slate-700 border-slate-300',
  }[tone];
  return <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border whitespace-nowrap ${cls}`}>{children}</span>;
};

const VIOLATION_LABEL: Record<TradingViolation['violationType'], string> = {
  NO_PRIOR_NOTICE: 'Không công bố trước khi giao dịch',
  TRADE_IN_BLACKOUT: 'Giao dịch trong thời gian hạn chế',
  EXCEED_REGISTERED: 'Giao dịch vượt khối lượng đăng ký',
  NO_RESULT_REPORT: 'Không báo cáo kết quả giao dịch',
};

const CASE_TYPE_META: Record<ListingStatusCase['caseType'], { fr: string; label: string }> = {
  RELIST: { fr: 'FR-009', label: 'Tiếp tục niêm yết' },
  BOND_DELIST: { fr: 'FR-012', label: 'Hủy niêm yết trái phiếu' },
  UPCOM_DELIST: { fr: 'FR-013', label: 'Hủy ĐKGD UPCoM' },
  PUBLIC_COMPANY_APPRAISAL: { fr: 'FR-004 · FR-005', label: 'Thẩm định ĐKGD công ty đại chúng' },
};

export const SurveillanceModule: React.FC<SurveillanceModuleProps> = ({
  activeModule,
  organizations,
  userRole,
}) => {
  const readOnly = userRole.includes('CNTT') || userRole === 'ROLE_HNX_EXEC';

  const [violations, setViolations] = useState<TradingViolation[]>(INITIAL_TRADING_VIOLATIONS);
  const [cases, setCases] = useState<ListingStatusCase[]>(INITIAL_STATUS_CASES);
  const [marginList] = useState<MarginIneligibleEntry[]>(INITIAL_MARGIN_LIST);
  const [caseTypeFilter, setCaseTypeFilter] = useState<'ALL' | ListingStatusCase['caseType']>('ALL');
  const [marginFilter, setMarginFilter] = useState<'IN_LIST' | 'REMOVED'>('IN_LIST');

  /* ── FR-007 · Vi phạm giao dịch ─────────────────────────────────────────── */

  const violationCols: ColumnDef<TradingViolation>[] = [
    { key: 'violationNo', headerVi: 'Số vụ việc', render: (r) => <span className="font-mono text-[11px] font-bold">{r.violationNo}</span> },
    { key: 'symbol', headerVi: 'Mã CK', render: (r) => (
      <div><div className="font-mono font-bold">{r.symbol}</div><div className="text-[10px] text-slate-500">{orgName(organizations, r.organizationId)}</div></div>
    ) },
    { key: 'violatorName', headerVi: 'Người vi phạm', render: (r) => (
      <div><div>{r.violatorName}</div><Chip tone="mute">{r.violatorRole}</Chip></div>
    ) },
    { key: 'violationType', headerVi: 'Hành vi', render: (r) => (
      <div className="max-w-xs"><div className="font-semibold text-[11px]">{VIOLATION_LABEL[r.violationType]}</div><div className="text-[10px] text-slate-600 mt-0.5">{r.description}</div></div>
    ) },
    { key: 'quantity', headerVi: 'Khối lượng', render: (r) => <span className="font-mono">{r.quantity.toLocaleString('vi-VN')}</span> },
    { key: 'occurredDate', headerVi: 'Ngày GD / phát hiện', render: (r) => (
      <div className="font-mono text-[10px]"><div>{r.occurredDate}</div><div className="text-slate-500">{r.detectedDate}</div></div>
    ) },
    { key: 'status', headerVi: 'Trạng thái', render: (r) => (
      <div className="space-y-1">
        <Chip tone={r.status === 'CLOSED' ? 'ok' : r.status === 'SANCTIONED' ? 'bad' : r.status === 'DETECTED' ? 'warn' : 'mute'}>{r.status}</Chip>
        {r.sanctionRef && <div className="font-mono text-[10px] text-rose-700">{r.sanctionRef}</div>}
      </div>
    ) },
  ];

  const advanceViolation = (row: TradingViolation) => {
    const flow: TradingViolation['status'][] = ['DETECTED', 'NOTIFIED', 'EXPLAINED', 'SANCTIONED', 'CLOSED'];
    const next = flow[Math.min(flow.indexOf(row.status) + 1, flow.length - 1)];
    setViolations((prev) => prev.map((v) => (v.id === row.id ? { ...v, status: next } : v)));
  };

  /* ── FR-005/009/012/013 · Hồ sơ xử lý trạng thái ────────────────────────── */

  const visibleCases = caseTypeFilter === 'ALL' ? cases : cases.filter((c) => c.caseType === caseTypeFilter);

  const caseCols: ColumnDef<ListingStatusCase>[] = [
    { key: 'caseNo', headerVi: 'Số hồ sơ', render: (r) => (
      <div><div className="font-mono text-[11px] font-bold">{r.caseNo}</div><Chip tone="mute">{CASE_TYPE_META[r.caseType].fr}</Chip></div>
    ) },
    { key: 'caseType', headerVi: 'Loại nghiệp vụ', render: (r) => <span className="text-[11px] font-semibold">{CASE_TYPE_META[r.caseType].label}</span> },
    { key: 'symbol', headerVi: 'Mã CK', render: (r) => (
      <div><div className="font-mono font-bold">{r.symbol}</div><div className="text-[10px] text-slate-500">{orgName(organizations, r.organizationId)}</div></div>
    ) },
    { key: 'reasonText', headerVi: 'Căn cứ', render: (r) => (
      <div className="max-w-sm">
        <div className="text-[11px]">{r.reasonText}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{r.legalBasis}</div>
        {r.ruleCode && <div className="font-mono text-[10px] text-indigo-700 mt-0.5">{r.ruleCode}</div>}
      </div>
    ) },
    { key: 'receivedDate', headerVi: 'Tiếp nhận / hạn', render: (r) => {
      const overdue = !r.decisionDate && new Date(r.appraisalDueDate) < new Date('2026-08-18');
      return (
        <div className="font-mono text-[10px]">
          <div>{r.receivedDate}</div>
          <div className={overdue ? 'text-rose-700 font-bold' : 'text-slate-500'}>{r.appraisalDueDate}</div>
        </div>
      );
    } },
    { key: 'decisionRef', headerVi: 'Quyết định', render: (r) => (
      r.decisionRef
        ? <div className="font-mono text-[10px]"><div className="font-bold">{r.decisionRef}</div><div className="text-slate-500">HL {r.effectiveDate}</div></div>
        : <span className="text-slate-400">—</span>
    ) },
    { key: 'status', headerVi: 'Trạng thái', render: (r) => (
      <Chip tone={r.status === 'APPROVED' ? 'ok' : r.status === 'REJECTED' ? 'bad' : r.status === 'RECEIVED' ? 'mute' : 'warn'}>{r.status}</Chip>
    ) },
    { key: 'assigneeName', headerVi: 'Phụ trách', render: (r) => <span className="text-[11px]">{r.assigneeName ?? '—'}</span> },
  ];

  const advanceCase = (row: ListingStatusCase) => {
    const flow: ListingStatusCase['status'][] = ['RECEIVED', 'APPRAISING', 'PENDING_APPROVAL', 'APPROVED'];
    const next = flow[Math.min(flow.indexOf(row.status) + 1, flow.length - 1)];
    setCases((prev) =>
      prev.map((c) =>
        c.id === row.id
          ? {
              ...c,
              status: next,
              ...(next === 'APPROVED' && !c.decisionRef
                ? { decisionRef: `QĐ-${200 + c.id}/QĐ-SGDHN`, decisionDate: '2026-08-18', effectiveDate: '2026-09-01' }
                : {}),
            }
          : c,
      ),
    );
  };

  /* ── FR-014 / FR-015 · Danh sách không được ký quỹ ──────────────────────── */

  const visibleMargin = marginList.filter((m) => m.status === marginFilter);

  const marginCols: ColumnDef<MarginIneligibleEntry>[] = [
    { key: 'symbol', headerVi: 'Mã CK', render: (r) => (
      <div><div className="font-mono font-bold">{r.symbol}</div><div className="text-[10px] text-slate-500">{orgName(organizations, r.organizationId)}</div></div>
    ) },
    { key: 'reasonText', headerVi: 'Lý do', render: (r) => (
      <div className="max-w-sm">
        <div className="font-mono text-[10px] text-indigo-700">{r.reasonCode}</div>
        <div className="text-[11px]">{r.reasonText}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{r.legalBasis}</div>
      </div>
    ) },
    { key: 'entryDate', headerVi: 'Vào danh sách', render: (r) => (
      <div className="font-mono text-[10px]"><div>{r.entryDate}</div><div className="text-slate-500">{r.entryDecisionRef}</div></div>
    ) },
    { key: 'exitDate', headerVi: 'Ra khỏi danh sách', render: (r) => (
      r.exitDate
        ? <div className="font-mono text-[10px]"><div className="text-emerald-700 font-bold">{r.exitDate}</div><div className="text-slate-500">{r.exitDecisionRef}</div></div>
        : <span className="text-slate-400">—</span>
    ) },
    { key: 'exitReason', headerVi: 'Căn cứ ra khỏi DS', render: (r) => (
      <span className="text-[11px] text-slate-600 max-w-xs inline-block">{r.exitReason ?? '—'}</span>
    ) },
    { key: 'status', headerVi: 'Trạng thái', render: (r) => (
      <Chip tone={r.status === 'IN_LIST' ? 'bad' : 'ok'}>{r.status === 'IN_LIST' ? 'Đang trong DS' : 'Đã ra khỏi DS'}</Chip>
    ) },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {activeModule === 'surv_violations' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Quản lý vi phạm giao dịch
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-007</span>
            </h2>
          </div>
          <Note>
            Vi phạm của người nội bộ, người có liên quan và cổ đông lớn khi giao dịch cổ phiếu của chính tổ
            chức mình. Luồng xử lý: phát hiện → thông báo → nhận giải trình → xử phạt → đóng hồ sơ. Nút
            <strong> Chuyển bước</strong> đẩy vụ việc sang trạng thái kế tiếp.
          </Note>
          <DynamicTable<TradingViolation>
            columns={violationCols}
            data={violations}
            density="compact"
            searchPlaceholder="Tìm theo số vụ việc, mã CK, người vi phạm..."
            actions={(r) =>
              r.status === 'CLOSED' || readOnly ? (
                <span className="text-[10px] text-slate-400">—</span>
              ) : (
                <button
                  onClick={() => advanceViolation(r)}
                  className="px-2 py-1 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase"
                >
                  Chuyển bước
                </button>
              )
            }
          />
        </div>
      )}

      {activeModule === 'surv_status_cases' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Hồ sơ thẩm định &amp; xử lý trạng thái niêm yết
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
                FR-004,005,009,012,013
              </span>
            </h2>
          </div>
          <Note>
            Bốn loại hồ sơ dùng chung một luồng: tiếp nhận → thẩm định → trình duyệt → ra quyết định. Cột
            hạn thẩm định tô đỏ khi quá hạn mà chưa có quyết định. Mã rule ở cột căn cứ cho biết hồ sơ này
            do Rule Engine phát hiện tự động hay do người tiếp nhận thủ công.
          </Note>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loại nghiệp vụ:</span>
            <button
              onClick={() => setCaseTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-bold ${caseTypeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Tất cả ({cases.length})
            </button>
            {(Object.keys(CASE_TYPE_META) as ListingStatusCase['caseType'][]).map((t) => (
              <button
                key={t}
                onClick={() => setCaseTypeFilter(t)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-bold ${caseTypeFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {CASE_TYPE_META[t].label} ({cases.filter((c) => c.caseType === t).length})
              </button>
            ))}
          </div>

          <DynamicTable<ListingStatusCase>
            columns={caseCols}
            data={visibleCases}
            density="compact"
            searchPlaceholder="Tìm theo số hồ sơ, mã CK, căn cứ..."
            actions={(r) =>
              r.status === 'APPROVED' || r.status === 'REJECTED' || readOnly ? (
                <span className="text-[10px] text-slate-400">—</span>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => advanceCase(r)}
                    className="px-2 py-1 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase"
                  >
                    Chuyển bước
                  </button>
                  <button
                    onClick={() => setCases((prev) => prev.map((c) => (c.id === r.id ? { ...c, status: 'REJECTED' } : c)))}
                    className="px-2 py-1 rounded-sm border border-rose-300 text-rose-700 hover:bg-rose-50 text-[10px] font-bold uppercase"
                  >
                    Từ chối
                  </button>
                </div>
              )
            }
          />
        </div>
      )}

      {activeModule === 'surv_margin' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Danh sách chứng khoán không được ký quỹ
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-014 · FR-015</span>
            </h2>
          </div>
          <Note>
            FR-014 quản lý việc đưa chứng khoán <em>vào</em> danh sách, FR-015 quản lý việc đưa <em>ra</em>.
            Hai chức năng dùng chung một bảng vì đó là hai đầu của cùng một vòng đời — tách đôi sẽ khiến
            không nhìn được lịch sử một mã đã vào ra bao nhiêu lần và vì lý do gì.
          </Note>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMarginFilter('IN_LIST')}
              className={`px-3 py-1.5 rounded-sm text-[11px] font-bold ${marginFilter === 'IN_LIST' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Đang trong danh sách ({marginList.filter((m) => m.status === 'IN_LIST').length})
            </button>
            <button
              onClick={() => setMarginFilter('REMOVED')}
              className={`px-3 py-1.5 rounded-sm text-[11px] font-bold ${marginFilter === 'REMOVED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Đã ra khỏi danh sách ({marginList.filter((m) => m.status === 'REMOVED').length})
            </button>
          </div>

          <DynamicTable<MarginIneligibleEntry>
            columns={marginCols}
            data={visibleMargin}
            density="compact"
            searchPlaceholder="Tìm theo mã CK, lý do..."
          />
        </div>
      )}
    </div>
  );
};
