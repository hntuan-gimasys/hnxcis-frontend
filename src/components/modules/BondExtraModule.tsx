/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Landmark, Scissors, SlidersHorizontal, Info, CalendarClock } from 'lucide-react';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';
import { INITIAL_STATUS_CASES } from '../../data/businessMock';
import type {
  BondProfile,
  SecurityItem,
  Organization,
  ListingStatusCase,
  UserRoleCode,
} from '../../types/hnx';

/**
 * Trái phiếu — FR-002 (trái phiếu doanh nghiệp NIÊM YẾT), FR-022 (hủy trái phiếu
 * riêng lẻ), FR-024 (điều chỉnh số lượng đăng ký giao dịch).
 *
 * FR-002 khác FR-020 ở chỗ dễ nhầm: FR-020 là trái phiếu doanh nghiệp RIÊNG LẺ
 * giao dịch trên hệ thống chuyên biệt, còn FR-002 là trái phiếu doanh nghiệp
 * NIÊM YẾT trên sàn HNX như một chứng khoán thường. Hai loại khác nhau về điều
 * kiện phát hành, đối tượng nhà đầu tư và nghĩa vụ công bố — nên `BondModule`
 * hiện có (phục vụ FR-020/021) không dùng chung màn hình được.
 */

interface BondExtraModuleProps {
  activeModule: string;
  bondProfiles: BondProfile[];
  securities: SecurityItem[];
  organizations: Organization[];
  userRole: UserRoleCode;
}

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-sm text-[11px] text-slate-700 leading-relaxed">
    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
    <div>{children}</div>
  </div>
);

/** FR-024 · Đề nghị điều chỉnh số lượng đăng ký giao dịch. */
interface QuantityAdjustment {
  id: number;
  requestNo: string;
  bondCode: string;
  organizationId: number;
  currentQuantity: number;
  requestedQuantity: number;
  reason: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionRef?: string;
}

const INITIAL_ADJUSTMENTS: QuantityAdjustment[] = [
  {
    id: 1, requestNo: 'ADJ-2026-004', bondCode: 'VIC12026', organizationId: 3,
    currentQuantity: 5_000_000, requestedQuantity: 4_200_000,
    reason: 'Tổ chức phát hành đã mua lại trước hạn 800.000 trái phiếu theo Nghị quyết HĐQT số 22/2026.',
    requestDate: '2026-08-06', status: 'PENDING',
  },
  {
    id: 2, requestNo: 'ADJ-2026-003', bondCode: 'ALPH12025', organizationId: 4,
    currentQuantity: 2_000_000, requestedQuantity: 2_500_000,
    reason: 'Phát hành bổ sung 500.000 trái phiếu cùng đợt theo phương án đã được UBCKNN chấp thuận.',
    requestDate: '2026-06-14', status: 'APPROVED', decisionRef: 'QĐ-176/QĐ-SGDHN',
  },
  {
    id: 3, requestNo: 'ADJ-2026-002', bondCode: 'BOG12025', organizationId: 5,
    currentQuantity: 1_500_000, requestedQuantity: 900_000,
    reason: 'Đề nghị giảm số lượng do nhà đầu tư trả lại — hồ sơ thiếu biên bản xác nhận của VSDC.',
    requestDate: '2026-05-02', status: 'REJECTED', decisionRef: 'CV-089/SGDHN-TTTP',
  },
];

export const BondExtraModule: React.FC<BondExtraModuleProps> = ({
  activeModule,
  bondProfiles,
  securities,
  organizations,
  userRole,
}) => {
  const readOnly = userRole.includes('CNTT') || userRole === 'ROLE_HNX_EXEC';
  const [adjustments, setAdjustments] = useState<QuantityAdjustment[]>(INITIAL_ADJUSTMENTS);

  const orgOf = (securityId: number) => {
    const sec = securities.find((s) => s.id === securityId);
    return organizations.find((o) => o.id === sec?.organizationId)?.shortName ?? '—';
  };
  const orgName = (id: number) => organizations.find((o) => o.id === id)?.shortName ?? `#${id}`;

  /* ── FR-002 · Trái phiếu doanh nghiệp niêm yết ──────────────────────────── */

  const listedBonds = useMemo(
    () => bondProfiles.filter((b) => !b.isPrivatePlacement),
    [bondProfiles],
  );

  const bondCols: ColumnDef<BondProfile>[] = [
    { key: 'bondCode', headerVi: 'Mã trái phiếu', render: (r) => (
      <div><div className="font-mono font-bold">{r.bondCode}</div><div className="text-[10px] text-slate-500">{orgOf(r.securityId)}</div></div>
    ) },
    { key: 'issueDate', headerVi: 'Phát hành / đáo hạn', render: (r) => (
      <div className="font-mono text-[10px]"><div>{r.issueDate}</div><div className="text-slate-500">{r.maturityDate}</div></div>
    ) },
    { key: 'listedQuantity', headerVi: 'Số lượng niêm yết', render: (r) => <span className="font-mono">{r.listedQuantity.toLocaleString('vi-VN')}</span> },
    { key: 'totalParValue', headerVi: 'Tổng mệnh giá', render: (r) => (
      <span className="font-mono">{(r.totalParValue / 1_000_000_000).toLocaleString('vi-VN')} tỷ</span>
    ) },
    { key: 'interestRateDesc', headerVi: 'Lãi suất', render: (r) => (
      <div><div className="text-[11px]">{r.interestRateDesc}</div><div className="font-mono text-[10px] text-slate-500">{r.interestRateType}</div></div>
    ) },
    { key: 'creditRating', headerVi: 'Xếp hạng tín nhiệm', render: (r) => (
      r.creditRating
        ? <div><span className="font-mono font-bold">{r.creditRating}</span><div className="text-[10px] text-slate-500">{r.creditRatingAgency}</div></div>
        : <span className="text-slate-400">—</span>
    ) },
    { key: 'bondStatus', headerVi: 'Trạng thái', render: (r) => {
      const map: Record<string, string> = {
        LISTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        SUSPENDED: 'bg-amber-100 text-amber-800 border-amber-300',
        MATURED: 'bg-slate-100 text-slate-700 border-slate-300',
        DELISTED: 'bg-rose-100 text-rose-800 border-rose-300',
      };
      return <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${map[r.bondStatus]}`}>{r.bondStatus}</span>;
    } },
  ];

  /* ── FR-022 · Hủy trái phiếu riêng lẻ ───────────────────────────────────── */

  const cancelCases = INITIAL_STATUS_CASES.filter((c) => c.caseType === 'BOND_DELIST');
  const privateBonds = bondProfiles.filter((b) => b.isPrivatePlacement);

  const cancelCols: ColumnDef<ListingStatusCase>[] = [
    { key: 'caseNo', headerVi: 'Số hồ sơ', render: (r) => <span className="font-mono text-[11px] font-bold">{r.caseNo}</span> },
    { key: 'symbol', headerVi: 'Mã trái phiếu', render: (r) => (
      <div><div className="font-mono font-bold">{r.symbol}</div><div className="text-[10px] text-slate-500">{orgName(r.organizationId)}</div></div>
    ) },
    { key: 'reasonText', headerVi: 'Lý do hủy', render: (r) => (
      <div className="max-w-sm"><div className="text-[11px]">{r.reasonText}</div><div className="text-[10px] text-slate-500 mt-0.5">{r.legalBasis}</div></div>
    ) },
    { key: 'receivedDate', headerVi: 'Tiếp nhận', render: (r) => <span className="font-mono text-[10px]">{r.receivedDate}</span> },
    { key: 'decisionRef', headerVi: 'Quyết định', render: (r) => (
      r.decisionRef
        ? <div className="font-mono text-[10px]"><div className="font-bold">{r.decisionRef}</div><div className="text-slate-500">HL {r.effectiveDate}</div></div>
        : <span className="text-slate-400">—</span>
    ) },
    { key: 'status', headerVi: 'Trạng thái', render: (r) => <span className="font-mono text-[10px]">{r.status}</span> },
  ];

  /* ── FR-024 · Điều chỉnh số lượng ĐKGD ──────────────────────────────────── */

  const adjCols: ColumnDef<QuantityAdjustment>[] = [
    { key: 'requestNo', headerVi: 'Số đề nghị', render: (r) => <span className="font-mono text-[11px] font-bold">{r.requestNo}</span> },
    { key: 'bondCode', headerVi: 'Mã trái phiếu', render: (r) => (
      <div><div className="font-mono font-bold">{r.bondCode}</div><div className="text-[10px] text-slate-500">{orgName(r.organizationId)}</div></div>
    ) },
    { key: 'currentQuantity', headerVi: 'Số lượng hiện tại', render: (r) => <span className="font-mono">{r.currentQuantity.toLocaleString('vi-VN')}</span> },
    { key: 'requestedQuantity', headerVi: 'Đề nghị điều chỉnh', render: (r) => {
      const delta = r.requestedQuantity - r.currentQuantity;
      return (
        <div>
          <span className="font-mono font-bold">{r.requestedQuantity.toLocaleString('vi-VN')}</span>
          <div className={`font-mono text-[10px] ${delta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {delta > 0 ? '+' : ''}{delta.toLocaleString('vi-VN')}
          </div>
        </div>
      );
    } },
    { key: 'reason', headerVi: 'Lý do', render: (r) => <span className="text-[11px] text-slate-600 max-w-sm inline-block">{r.reason}</span> },
    { key: 'requestDate', headerVi: 'Ngày đề nghị', render: (r) => <span className="font-mono text-[10px]">{r.requestDate}</span> },
    { key: 'status', headerVi: 'Trạng thái', render: (r) => {
      const map = { PENDING: 'bg-amber-100 text-amber-800 border-amber-300', APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300', REJECTED: 'bg-rose-100 text-rose-800 border-rose-300' };
      return (
        <div>
          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${map[r.status]}`}>{r.status}</span>
          {r.decisionRef && <div className="font-mono text-[10px] text-slate-500 mt-0.5">{r.decisionRef}</div>}
        </div>
      );
    } },
  ];

  return (
    <div className="space-y-5">
      {activeModule === 'bond_listed' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Hồ sơ trái phiếu doanh nghiệp niêm yết
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-002</span>
            </h2>
          </div>
          <Note>
            Khác với trái phiếu riêng lẻ ở màn FR-020: đây là trái phiếu <strong>niêm yết</strong> trên sàn
            HNX, chào bán ra công chúng, nhà đầu tư nào cũng mua được và nghĩa vụ công bố thông tin nặng hơn.
            Trái phiếu riêng lẻ chỉ dành cho nhà đầu tư chứng khoán chuyên nghiệp và giao dịch trên hệ thống
            riêng.
          </Note>

          {listedBonds.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-sm">
              Chưa có trái phiếu niêm yết nào trong dữ liệu. Toàn bộ {bondProfiles.length} mã hiện có đều là
              trái phiếu phát hành riêng lẻ (xem màn FR-020).
            </div>
          ) : (
            <DynamicTable<BondProfile>
              columns={bondCols}
              data={listedBonds}
              density="compact"
              searchPlaceholder="Tìm theo mã trái phiếu, tổ chức phát hành..."
            />
          )}
        </div>
      )}

      {activeModule === 'bond_cancel' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Hủy đăng ký giao dịch trái phiếu doanh nghiệp riêng lẻ
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-022</span>
            </h2>
          </div>
          <Note>
            Trái phiếu bị hủy đăng ký giao dịch khi đáo hạn, mua lại toàn bộ trước hạn, hoặc tổ chức phát hành
            vi phạm nghiêm trọng. Ngày hiệu lực quan trọng hơn ngày quyết định: đó là mốc trái phiếu thực sự
            ngừng giao dịch, và nhà đầu tư cần biết trước để tất toán.
          </Note>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trái phiếu riêng lẻ</div>
              <div className="text-2xl font-mono font-bold mt-1">{privateBonds.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hồ sơ hủy</div>
              <div className="text-2xl font-mono font-bold mt-1">{cancelCases.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã đáo hạn</div>
              <div className="text-2xl font-mono font-bold mt-1 text-slate-600">
                {bondProfiles.filter((b) => b.bondStatus === 'MATURED').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã hủy ĐKGD</div>
              <div className="text-2xl font-mono font-bold mt-1 text-rose-700">
                {bondProfiles.filter((b) => b.bondStatus === 'DELISTED').length}
              </div>
            </div>
          </div>

          <DynamicTable<ListingStatusCase>
            columns={cancelCols}
            data={cancelCases}
            density="compact"
            searchPlaceholder="Tìm theo số hồ sơ, mã trái phiếu..."
          />
        </div>
      )}

      {activeModule === 'bond_adjust' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Điều chỉnh số lượng đăng ký giao dịch trái phiếu riêng lẻ
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-024</span>
            </h2>
          </div>
          <Note>
            Số lượng đăng ký giao dịch thay đổi khi tổ chức phát hành mua lại trước hạn hoặc phát hành bổ sung
            cùng đợt. Chênh lệch được hiển thị tường minh vì đó là con số người duyệt cần đối chiếu với biên
            bản xác nhận của VSDC — hồ sơ thiếu biên bản này là lý do từ chối thường gặp.
          </Note>

          <DynamicTable<QuantityAdjustment>
            columns={adjCols}
            data={adjustments}
            density="compact"
            searchPlaceholder="Tìm theo số đề nghị, mã trái phiếu..."
            actions={(r) =>
              r.status !== 'PENDING' || readOnly ? (
                <span className="text-[10px] text-slate-400">—</span>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setAdjustments((prev) =>
                        prev.map((a) => (a.id === r.id ? { ...a, status: 'APPROVED', decisionRef: `QĐ-${210 + a.id}/QĐ-SGDHN` } : a)),
                      )
                    }
                    className="px-2 py-1 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase"
                  >
                    Chấp thuận
                  </button>
                  <button
                    onClick={() =>
                      setAdjustments((prev) =>
                        prev.map((a) => (a.id === r.id ? { ...a, status: 'REJECTED', decisionRef: `CV-${95 + a.id}/SGDHN-TTTP` } : a)),
                      )
                    }
                    className="px-2 py-1 rounded-sm border border-rose-300 text-rose-700 hover:bg-rose-50 text-[10px] font-bold uppercase"
                  >
                    Từ chối
                  </button>
                </div>
              )
            }
          />

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CalendarClock className="h-3.5 w-3.5" />
            Hạn xử lý đề nghị điều chỉnh là 5 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ.
          </div>
        </div>
      )}
    </div>
  );
};
