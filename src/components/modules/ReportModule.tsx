/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Info, FileSpreadsheet } from 'lucide-react';
import type {
  Organization,
  SecurityItem,
  Submission,
  BondProfile,
  DisclosureObligation,
  UserRoleCode,
} from '../../types/hnx';

/**
 * Báo cáo khai thác của hai phòng nghiệp vụ — FR-019 (P.QLNY) và FR-025 (P.TTTP).
 *
 * Số liệu ở đây được TÍNH từ dữ liệu nghiệp vụ đang có trong ứng dụng, không
 * phải con số viết cứng. Đó là điều phân biệt một màn hình báo cáo thật với một
 * ảnh chụp dashboard: đổi dữ liệu nguồn thì báo cáo đổi theo, và nếu con số vô
 * lý thì lỗi nằm ở dữ liệu chứ không phải ở chỗ ai đó gõ nhầm.
 */

interface ReportModuleProps {
  activeModule: string;
  organizations: Organization[];
  securities: SecurityItem[];
  submissions: Submission[];
  bondProfiles: BondProfile[];
  obligations: DisclosureObligation[];
  userRole: UserRoleCode;
}

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-sm text-[11px] text-slate-700 leading-relaxed">
    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
    <div>{children}</div>
  </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string; tone?: 'ok' | 'warn' | 'bad' }> = ({
  label,
  value,
  hint,
  tone,
}) => {
  const color = tone === 'bad' ? 'text-rose-700' : tone === 'warn' ? 'text-amber-700' : tone === 'ok' ? 'text-emerald-700' : 'text-slate-900';
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-3">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-mono font-bold mt-1 ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
};

/** Bảng phân bố đơn giản kèm thanh tỷ lệ — dùng chung cho cả hai báo cáo. */
const Breakdown: React.FC<{ title: string; rows: Array<{ label: string; count: number }> }> = ({ title, rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div className="bg-white border border-slate-200 rounded-sm">
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</span>
        <span className="font-mono text-[11px] text-slate-500">tổng {total}</span>
      </div>
      <div className="p-4 space-y-2">
        {rows.length === 0 ? (
          <div className="text-[11px] text-slate-500">Không có dữ liệu.</div>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 text-xs">
              <span className="w-52 shrink-0 text-slate-700 truncate" title={r.label}>{r.label}</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-sm overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
              <span className="w-10 text-right font-mono font-bold tabular-nums">{r.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const ReportModule: React.FC<ReportModuleProps> = ({
  activeModule,
  organizations,
  securities,
  submissions,
  bondProfiles,
  obligations,
}) => {
  const [period, setPeriod] = useState<'ALL' | '2026'>('2026');

  const inPeriod = <T extends { createdAt?: string; submittedAt?: string }>(rows: T[]) =>
    period === 'ALL' ? rows : rows.filter((r) => (r.submittedAt ?? r.createdAt ?? '').startsWith('2026'));

  /* ── FR-019 · Báo cáo phòng Niêm yết ────────────────────────────────────── */

  const qlny = useMemo(() => {
    const equities = securities.filter((s) => s.securityType === 'EQUITY');
    const byBoard = ['HNX', 'UPCOM', 'HOSE', 'PRIVATE_BOND'].map((b) => ({
      label: `Sàn ${b}`,
      count: securities.filter((s) => s.board === b).length,
    })).filter((r) => r.count > 0);

    const byStatus = Array.from(new Set(securities.map((s) => s.status))).map((st) => ({
      label: String(st),
      count: securities.filter((s) => s.status === st).length,
    }));

    const byOrgType = Array.from(new Set(organizations.map((o) => o.orgType))).map((t) => ({
      label: String(t),
      count: organizations.filter((o) => o.orgType === t).length,
    }));

    const charterTotal = organizations.reduce((s, o) => s + (o.charterCapital || 0), 0);

    return { equities, byBoard, byStatus, byOrgType, charterTotal };
  }, [securities, organizations]);

  /* ── FR-025 · Báo cáo phòng Trái phiếu ──────────────────────────────────── */

  const tttp = useMemo(() => {
    const listed = bondProfiles.filter((b) => b.bondStatus === 'LISTED');
    const totalPar = bondProfiles.reduce((s, b) => s + (b.totalParValue || 0), 0);

    const byStatus = Array.from(new Set(bondProfiles.map((b) => b.bondStatus))).map((st) => ({
      label: String(st),
      count: bondProfiles.filter((b) => b.bondStatus === st).length,
    }));

    const byRateType = Array.from(new Set(bondProfiles.map((b) => b.interestRateType))).map((t) => ({
      label: t === 'FIXED' ? 'Lãi suất cố định' : t === 'FLOATING' ? 'Lãi suất thả nổi' : 'Theo công thức',
      count: bondProfiles.filter((b) => b.interestRateType === t).length,
    }));

    const features = [
      { label: 'Trái phiếu xanh', count: bondProfiles.filter((b) => b.isGreenBond).length },
      { label: 'Phát hành riêng lẻ', count: bondProfiles.filter((b) => b.isPrivatePlacement).length },
      { label: 'Có quyền chuyển đổi', count: bondProfiles.filter((b) => b.isConvertible).length },
      { label: 'Có xếp hạng tín nhiệm', count: bondProfiles.filter((b) => Boolean(b.creditRating)).length },
    ].filter((r) => r.count > 0);

    const maturing = bondProfiles.filter((b) => b.maturityDate >= '2026-01-01' && b.maturityDate <= '2026-12-31');

    return { listed, totalPar, byStatus, byRateType, features, maturing };
  }, [bondProfiles]);

  /* ── Chung cho cả hai · tuân thủ CBTT ───────────────────────────────────── */

  const compliance = useMemo(() => {
    const subs = inPeriod(submissions);
    const published = subs.filter((s) => s.status === 'PUBLISHED').length;
    const late = obligations.filter((o) => o.status === 'LATE').length;
    const pending = obligations.filter((o) => o.status === 'PENDING').length;
    const fulfilled = obligations.filter((o) => o.status === 'FULFILLED').length;
    const onTimeRate = fulfilled + late > 0 ? (fulfilled / (fulfilled + late)) * 100 : 100;
    return { total: subs.length, published, late, pending, fulfilled, onTimeRate };
  }, [submissions, obligations, period]);

  const exportHint = 'Xuất Excel giữ nguyên định dạng — chưa nối backend nên nút này chưa sinh file thật.';

  const Header: React.FC<{ title: string; fr: string; desc: string }> = ({ title, fr, desc }) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          {title}
          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
            {fr}
          </span>
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl">{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-sm border border-slate-300 overflow-hidden">
          {(['2026', 'ALL'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1.5 text-[11px] font-bold ${period === p ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {p === '2026' ? 'Năm 2026' : 'Tất cả'}
            </button>
          ))}
        </div>
        <button
          title={exportHint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-bold uppercase tracking-wider"
        >
          <Download className="h-3.5 w-3.5" />
          Xuất Excel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {activeModule === 'report_qlny' && (
        <div className="space-y-4">
          <Header
            title="Báo cáo phòng Quản lý Niêm yết"
            fr="FR-019"
            desc="Tổng hợp quy mô niêm yết, cơ cấu theo sàn và trạng thái kiểm soát, kèm mức độ tuân thủ nghĩa vụ công bố thông tin."
          />
          <Note>
            Mọi con số dưới đây được tính trực tiếp từ dữ liệu nghiệp vụ trong ứng dụng chứ không viết cứng —
            thêm một mã chứng khoán hay đổi trạng thái kiểm soát thì báo cáo đổi theo ngay.
          </Note>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Tổ chức đang quản lý" value={organizations.length} />
            <Stat label="Mã chứng khoán" value={securities.length} hint={`${qlny.equities.length} cổ phiếu`} />
            <Stat
              label="Vốn điều lệ tổng"
              value={`${(qlny.charterTotal / 1_000_000_000_000).toFixed(1)}k tỷ`}
              hint="Tổng vốn điều lệ các tổ chức"
            />
            <Stat
              label="Tỷ lệ nộp đúng hạn"
              value={`${compliance.onTimeRate.toFixed(0)}%`}
              tone={compliance.onTimeRate >= 90 ? 'ok' : compliance.onTimeRate >= 70 ? 'warn' : 'bad'}
              hint={`${compliance.late} nghĩa vụ trễ hạn`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Breakdown title="Cơ cấu theo sàn giao dịch" rows={qlny.byBoard} />
            <Breakdown title="Cơ cấu theo trạng thái chứng khoán" rows={qlny.byStatus} />
            <Breakdown title="Cơ cấu theo loại tổ chức" rows={qlny.byOrgType} />
            <Breakdown
              title="Tình hình nghĩa vụ công bố"
              rows={[
                { label: 'Đã hoàn thành', count: compliance.fulfilled },
                { label: 'Chưa đến hạn', count: compliance.pending },
                { label: 'Trễ hạn', count: compliance.late },
              ]}
            />
          </div>
        </div>
      )}

      {activeModule === 'report_tttp' && (
        <div className="space-y-4">
          <Header
            title="Báo cáo phòng Thị trường Trái phiếu"
            fr="FR-025"
            desc="Tổng hợp quy mô trái phiếu đang niêm yết và đăng ký giao dịch, cơ cấu theo trạng thái, loại lãi suất và đặc tính."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Mã trái phiếu" value={bondProfiles.length} hint={`${tttp.listed.length} đang niêm yết`} />
            <Stat
              label="Tổng mệnh giá"
              value={`${(tttp.totalPar / 1_000_000_000_000).toFixed(2)}k tỷ`}
              hint="Tổng giá trị theo mệnh giá"
            />
            <Stat
              label="Đáo hạn trong năm 2026"
              value={tttp.maturing.length}
              tone={tttp.maturing.length > 0 ? 'warn' : 'ok'}
              hint="Cần theo dõi thanh toán gốc/lãi"
            />
            <Stat label="Trái phiếu xanh" value={bondProfiles.filter((b) => b.isGreenBond).length} tone="ok" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Breakdown title="Cơ cấu theo trạng thái" rows={tttp.byStatus} />
            <Breakdown title="Cơ cấu theo loại lãi suất" rows={tttp.byRateType} />
            <Breakdown title="Đặc tính trái phiếu" rows={tttp.features} />
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Trái phiếu đáo hạn năm 2026
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[420px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="text-left px-3 py-2">Mã trái phiếu</th>
                      <th className="text-left px-3 py-2">Ngày đáo hạn</th>
                      <th className="text-left px-3 py-2">Mệnh giá tổng</th>
                      <th className="text-left px-3 py-2">Lãi suất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tttp.maturing.length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">Không có trái phiếu đáo hạn trong năm.</td></tr>
                    ) : (
                      tttp.maturing.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-mono font-bold">{b.bondCode}</td>
                          <td className="px-3 py-1.5 font-mono">{b.maturityDate}</td>
                          <td className="px-3 py-1.5 font-mono">{(b.totalParValue / 1_000_000_000).toLocaleString('vi-VN')} tỷ</td>
                          <td className="px-3 py-1.5">{b.interestRateDesc}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
