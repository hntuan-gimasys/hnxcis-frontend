/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Newspaper, EyeOff, Eye, FileCheck2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';
import type {
  Submission,
  TemplateDefinition,
  Organization,
  NewsGroupCode,
  UserRoleCode,
} from '../../types/hnx';

/**
 * Các loại công bố thông tin và kiểm soát công bố — FR-016, FR-035 → FR-037,
 * FR-040.
 *
 * PRD tách sáu loại CBTT thành sáu chức năng riêng (định kỳ, bất thường, tin
 * trái phiếu, tin giao dịch, theo yêu cầu, tin từ Sở), nhưng hệ thống này là
 * metadata-driven: mỗi loại là một mẫu báo cáo với nhóm tin và quy tắc hạn
 * riêng, không phải sáu màn hình code cứng. Vì vậy màn "Các loại CBTT" dưới đây
 * hiển thị đúng thứ quyết định một loại tin có nộp được hay không — mẫu báo cáo
 * đã khai báo chưa — thay vì dựng sáu bản sao của cùng một danh sách.
 */

interface DisclosureExtraModuleProps {
  activeModule: string;
  submissions: Submission[];
  templates: TemplateDefinition[];
  organizations: Organization[];
  userRole: UserRoleCode;
  onHideSubmission?: (id: number, reason: string) => void;
}

const NEWS_GROUP_META: Array<{ code: NewsGroupCode; fr: string; label: string; legal: string }> = [
  { code: 'PERIODIC', fr: 'FR-033', label: 'CBTT Định kỳ', legal: 'Điều 10-14 Thông tư 96/2020/TT-BTC' },
  { code: 'EXTRAORDINARY', fr: 'FR-034', label: 'CBTT Bất thường (24h/48h)', legal: 'Điều 11 Thông tư 96/2020/TT-BTC' },
  { code: 'BOND', fr: 'FR-035', label: 'CBTT Tin Trái phiếu', legal: 'Nghị định 65/2022/NĐ-CP' },
  { code: 'TRADING', fr: 'FR-036', label: 'CBTT Tin Giao dịch', legal: 'Điều 33 Thông tư 96/2020/TT-BTC' },
  { code: 'ON_DEMAND', fr: 'FR-037', label: 'CBTT Theo yêu cầu', legal: 'Điều 12 Thông tư 96/2020/TT-BTC' },
  { code: 'HNX_NEWS', fr: 'FR-038', label: 'CBTT Tin từ Sở', legal: 'Quy chế CBTT của HNX' },
  { code: 'OFFERING', fr: 'FR-034', label: 'CBTT Chào bán chứng khoán', legal: 'Điều 25 Luật Chứng khoán' },
];

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-sm text-[11px] text-slate-700 leading-relaxed">
    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
    <div>{children}</div>
  </div>
);

export const DisclosureExtraModule: React.FC<DisclosureExtraModuleProps> = ({
  activeModule,
  submissions,
  templates,
  organizations,
  userRole,
  onHideSubmission,
}) => {
  const readOnly = userRole.includes('CNTT') || userRole === 'ROLE_HNX_EXEC';
  const [hideFor, setHideFor] = useState<Submission | null>(null);
  const [hideReason, setHideReason] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<NewsGroupCode | 'ALL'>('ALL');

  const orgName = (id?: number) => organizations.find((o) => o.id === id)?.shortName ?? '—';

  /* ── FR-035 / FR-036 / FR-037 · Các loại CBTT ───────────────────────────── */

  const coverage = useMemo(
    () =>
      NEWS_GROUP_META.map((g) => ({
        ...g,
        templates: templates.filter((t) => t.newsGroupCode === g.code),
        submissions: submissions.filter((s) => s.newsGroupCode === g.code),
      })),
    [templates, submissions],
  );

  const visibleSubs =
    selectedGroup === 'ALL' ? submissions : submissions.filter((s) => s.newsGroupCode === selectedGroup);

  const subCols: ColumnDef<Submission>[] = [
    { key: 'submissionNo', headerVi: 'Số hồ sơ', render: (r) => <span className="font-mono text-[11px] font-bold">{r.submissionNo}</span> },
    { key: 'newsGroupCode', headerVi: 'Nhóm tin', render: (r) => {
      const g = NEWS_GROUP_META.find((x) => x.code === r.newsGroupCode);
      return (
        <div>
          <span className="font-mono text-[10px] bg-slate-100 border border-slate-300 rounded-sm px-1.5 py-0.5">{r.newsGroupCode ?? '—'}</span>
          {g && <div className="text-[10px] text-slate-500 mt-0.5">{g.fr}</div>}
        </div>
      );
    } },
    { key: 'titleVi', headerVi: 'Tiêu đề', render: (r) => <span className="text-[11px]">{r.titleVi}</span> },
    { key: 'organizationId', headerVi: 'Tổ chức', render: (r) => <span className="font-semibold">{orgName(r.organizationId)}</span> },
    { key: 'status', headerVi: 'Trạng thái', render: (r) => <span className="font-mono text-[10px]">{r.status}</span> },
    { key: 'isPublic', headerVi: 'Trên Corp News', render: (r) => (
      r.hiddenAt
        ? <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold border bg-slate-800 text-white border-slate-800">ĐÃ ẨN</span>
        : r.isPublic && r.status === 'PUBLISHED'
          ? <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-300">ĐANG HIỆN</span>
          : <span className="text-slate-400 text-[10px]">chưa công bố</span>
    ) },
  ];

  /* ── FR-016 · Kiểm soát công bố trên Corporate News ─────────────────────── */

  const publicSubs = submissions.filter((s) => s.status === 'PUBLISHED' && s.isPublic);

  /* ── FR-040 · Phê duyệt báo cáo ─────────────────────────────────────────── */

  const reportSubs = submissions.filter((s) => s.templateKind === 'FINANCIAL_STMT');
  const pendingReports = reportSubs.filter((s) => ['SUBMITTED', 'REVIEWED', 'PENDING_APPROVAL'].includes(s.status));

  return (
    <div className="space-y-5">
      {activeModule === 'cbtt_types' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Các loại công bố thông tin
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
                FR-033 → FR-038
              </span>
            </h2>
          </div>
          <Note>
            Hệ thống metadata-driven: mỗi loại CBTT là một <strong>mẫu báo cáo</strong> có nhóm tin và quy tắc
            hạn riêng, không phải một màn hình viết cứng. Loại nào chưa khai báo mẫu thì doanh nghiệp mở màn
            nộp hồ sơ ra sẽ không chọn được gì — đó là điều bảng dưới đây kiểm tra.
          </Note>

          <div className="bg-white border border-slate-200 rounded-sm overflow-x-auto">
            <table className="w-full text-xs min-w-[680px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left px-3 py-2">Chức năng</th>
                  <th className="text-left px-3 py-2">Loại CBTT</th>
                  <th className="text-left px-3 py-2">Nhóm tin</th>
                  <th className="text-left px-3 py-2">Căn cứ pháp lý</th>
                  <th className="text-left px-3 py-2">Mẫu đã khai báo</th>
                  <th className="text-left px-3 py-2">Hồ sơ đã nộp</th>
                  <th className="text-left px-3 py-2">Sẵn sàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coverage.map((g) => (
                  <tr key={g.code} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-[10px] font-bold text-indigo-700">{g.fr}</td>
                    <td className="px-3 py-2 font-semibold">{g.label}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{g.code}</td>
                    <td className="px-3 py-2 text-[10px] text-slate-600">{g.legal}</td>
                    <td className="px-3 py-2">
                      {g.templates.length === 0 ? (
                        <span className="text-rose-700 font-bold text-[11px]">chưa có mẫu</span>
                      ) : (
                        <div className="space-y-0.5">
                          {g.templates.map((t) => (
                            <div key={t.id} className="font-mono text-[10px]">{t.templateCode}</div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono">{g.submissions.length}</td>
                    <td className="px-3 py-2">
                      {g.templates.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />Nộp được
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                          <AlertTriangle className="h-3.5 w-3.5" />Chưa nộp được
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lọc hồ sơ theo nhóm:</span>
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-bold ${selectedGroup === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Tất cả ({submissions.length})
            </button>
            {NEWS_GROUP_META.map((g) => (
              <button
                key={g.code}
                onClick={() => setSelectedGroup(g.code)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold ${selectedGroup === g.code ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {g.code} ({submissions.filter((s) => s.newsGroupCode === g.code).length})
              </button>
            ))}
          </div>

          <DynamicTable<Submission>
            columns={subCols}
            data={visibleSubs}
            density="compact"
            searchPlaceholder="Tìm theo số hồ sơ, tiêu đề..."
          />
        </div>
      )}

      {activeModule === 'cbtt_control' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Kiểm soát công bố thông tin trên Corporate News
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-016</span>
            </h2>
          </div>
          <Note>
            Sau khi tin đã ra trang công khai, P.QLNY vẫn phải gỡ được khi phát hiện nội dung sai lệch. Việc
            gỡ <strong>bắt buộc nêu lý do</strong> và không xóa bản ghi — tin bị ẩn vẫn nằm trong nhật ký để
            truy vết, vì gỡ một công bố đã ra thị trường là hành vi phải giải trình được.
          </Note>

          <DynamicTable<Submission>
            columns={subCols}
            data={publicSubs}
            density="compact"
            searchPlaceholder="Tìm tin đang hiển thị công khai..."
            actions={(r) =>
              readOnly ? (
                <span className="text-[10px] text-slate-400">—</span>
              ) : r.hiddenAt ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <EyeOff className="h-3 w-3" />đã ẩn
                </span>
              ) : (
                <button
                  onClick={() => { setHideFor(r); setHideReason(''); }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-rose-300 text-rose-700 hover:bg-rose-50 text-[10px] font-bold uppercase"
                >
                  <Eye className="h-3 w-3" />Gỡ khỏi Corp News
                </button>
              )
            }
          />

          {hideFor && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-md shadow-2xl w-full max-w-lg">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Gỡ tin {hideFor.submissionNo} khỏi trang công khai
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Lý do gỡ <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    autoFocus
                    value={hideReason}
                    onChange={(e) => setHideReason(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-sm"
                    placeholder="Nội dung công bố có sai lệch về..., đề nghị doanh nghiệp đính chính."
                  />
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                  <button onClick={() => setHideFor(null)} className="px-3 py-2 rounded-sm border border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider">Hủy</button>
                  <button
                    disabled={!hideReason.trim()}
                    onClick={() => { onHideSubmission?.(hideFor.id, hideReason); setHideFor(null); }}
                    className="px-3 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Xác nhận gỡ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeModule === 'cbtt_report_approval' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Phê duyệt báo cáo
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-040</span>
            </h2>
          </div>
          <Note>
            Tách riêng khỏi <strong>phê duyệt hồ sơ</strong> (FR-039) vì báo cáo tài chính đi kèm bộ chỉ tiêu
            có công thức và ý kiến kiểm toán — người duyệt cần đối chiếu số liệu chứ không chỉ đọc nội dung.
            Hàng đợi dưới đây chỉ lấy hồ sơ có <span className="font-mono">templateKind = FINANCIAL_STMT</span>.
          </Note>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng báo cáo</div>
              <div className="text-2xl font-mono font-bold mt-1">{reportSubs.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chờ duyệt</div>
              <div className="text-2xl font-mono font-bold mt-1 text-amber-700">{pendingReports.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã công bố</div>
              <div className="text-2xl font-mono font-bold mt-1 text-emerald-700">
                {reportSubs.filter((s) => s.status === 'PUBLISHED').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nộp trễ hạn</div>
              <div className="text-2xl font-mono font-bold mt-1 text-rose-700">
                {reportSubs.filter((s) => s.isLate).length}
              </div>
            </div>
          </div>

          <DynamicTable<Submission>
            columns={[
              ...subCols.slice(0, 4),
              { key: 'periodCode', headerVi: 'Kỳ báo cáo', render: (r) => <span className="font-mono text-[11px]">{r.periodCode ?? '—'}</span> },
              { key: 'isLate', headerVi: 'Đúng hạn', render: (r) => (
                r.isLate
                  ? <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold border bg-rose-100 text-rose-800 border-rose-300">TRỄ {r.lateDays ?? '?'} NGÀY</span>
                  : <span className="text-emerald-700 font-semibold text-[11px]">Đúng hạn</span>
              ) },
              subCols[4],
            ]}
            data={reportSubs}
            density="compact"
            searchPlaceholder="Tìm báo cáo theo số hồ sơ, tổ chức..."
          />
        </div>
      )}
    </div>
  );
};
