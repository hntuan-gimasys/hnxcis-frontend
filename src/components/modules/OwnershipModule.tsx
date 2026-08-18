/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Users2, PieChart, Info, AlertTriangle } from 'lucide-react';
import { CrudPanel, CrudField } from '../common/CrudPanel';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';
import { INITIAL_INVESTORS, INITIAL_OWNERSHIPS } from '../../data/businessMock';
import type {
  Investor,
  SecurityOwnership,
  SecurityItem,
  Organization,
  UserRoleCode,
} from '../../types/hnx';

/**
 * Nhà đầu tư và sở hữu chứng khoán — FR-026 và FR-003.
 *
 * Hai chức năng đi cùng nhau vì sở hữu là quan hệ giữa một nhà đầu tư và một mã
 * chứng khoán: không khai báo nhà đầu tư trước thì không ghi nhận được sở hữu.
 * Đây cũng là lý do PRD xếp FR-026 ở tầng 2 cùng FR-061, trước FR-003.
 */

interface OwnershipModuleProps {
  activeModule: string;
  securities: SecurityItem[];
  organizations: Organization[];
  userRole: UserRoleCode;
}

const HOLDER_ROLE_LABEL: Record<SecurityOwnership['holderRole'], string> = {
  MAJOR_SHAREHOLDER: 'Cổ đông lớn',
  FOUNDING: 'Cổ đông sáng lập',
  INTERNAL: 'Người nội bộ',
  RELATED: 'Người có liên quan',
  STATE: 'Sở hữu nhà nước',
  FOREIGN: 'Nhà đầu tư nước ngoài',
};

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-sm text-[11px] text-slate-700 leading-relaxed">
    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
    <div>{children}</div>
  </div>
);

export const OwnershipModule: React.FC<OwnershipModuleProps> = ({
  activeModule,
  securities,
  organizations,
  userRole,
}) => {
  const readOnly = userRole.includes('CNTT') || userRole === 'ROLE_HNX_EXEC';

  const [investors, setInvestors] = useState<Investor[]>(INITIAL_INVESTORS);
  const [ownerships, setOwnerships] = useState<SecurityOwnership[]>(INITIAL_OWNERSHIPS);
  const [selectedSecurityId, setSelectedSecurityId] = useState<number>(securities[0]?.id ?? 1);

  const nextId = (rows: Array<{ id: number }>) => Math.max(0, ...rows.map((r) => r.id)) + 1;
  const nowIso = () => new Date().toISOString();

  const investorName = (id: number) => investors.find((i) => i.id === id)?.fullName ?? `#${id}`;
  const securityLabel = (id: number) => {
    const s = securities.find((x) => x.id === id);
    return s ? s.symbol : `#${id}`;
  };

  /* ── FR-026 · Nhà đầu tư / NCLQ ─────────────────────────────────────────── */

  const investorCols: ColumnDef<Investor & { usageCount: number }>[] = [
    { key: 'identityNo', headerVi: 'Số định danh', render: (r) => (
      <div><div className="font-mono text-[11px] font-bold">{r.identityNo}</div><div className="text-[10px] text-slate-500">{r.identityType}</div></div>
    ) },
    { key: 'fullName', headerVi: 'Họ tên / Tên tổ chức', render: (r) => (
      <div><div className="font-semibold">{r.fullName}</div>{r.fullNameEn && <div className="text-[10px] text-slate-500">{r.fullNameEn}</div>}</div>
    ) },
    { key: 'investorType', headerVi: 'Loại', render: (r) => (
      <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-300">
        {r.investorType === 'INDIVIDUAL' ? 'Cá nhân' : 'Tổ chức'}
      </span>
    ) },
    { key: 'nationality', headerVi: 'Quốc tịch', render: (r) => <span className="font-mono">{r.nationality}</span> },
    { key: 'address', headerVi: 'Địa chỉ', render: (r) => <span className="text-[11px] text-slate-600">{r.address}</span> },
    { key: 'linkedOrgId', headerVi: 'Gắn với tổ chức', render: (r) => (
      r.linkedOrgId
        ? <span className="font-semibold">{organizations.find((o) => o.id === r.linkedOrgId)?.shortName ?? `#${r.linkedOrgId}`}</span>
        : <span className="text-slate-400">—</span>
    ) },
    { key: 'usageCount', headerVi: 'Bản ghi sở hữu', render: (r) => <span className="font-mono">{r.usageCount}</span> },
  ];

  const investorFields: CrudField[] = [
    { key: 'investorType', label: 'Loại nhà đầu tư', type: 'select', required: true, options: [
      { value: 'INDIVIDUAL', label: 'Cá nhân' }, { value: 'ORGANIZATION', label: 'Tổ chức' },
    ] },
    { key: 'identityType', label: 'Loại giấy tờ', type: 'select', required: true, options: [
      { value: 'CITIZEN_ID', label: 'Căn cước công dân' }, { value: 'PASSPORT', label: 'Hộ chiếu' }, { value: 'TAX_CODE', label: 'Mã số thuế' },
    ] },
    { key: 'identityNo', label: 'Số định danh', type: 'text', required: true, immutableOnEdit: true, help: 'Khóa định danh — không đổi được sau khi tạo.' },
    { key: 'fullName', label: 'Họ tên / Tên tổ chức', type: 'text', required: true },
    { key: 'fullNameEn', label: 'Tên tiếng Anh', type: 'text' },
    { key: 'nationality', label: 'Quốc tịch', type: 'text', required: true, help: 'Mã ISO 2 ký tự, ví dụ VN, GB, JP.' },
    { key: 'address', label: 'Địa chỉ', type: 'textarea', required: true },
    { key: 'phone', label: 'Điện thoại', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
  ];

  const investorRows = investors.map((i) => ({
    ...i,
    usageCount: ownerships.filter((o) => o.investorId === i.id && !o.unlinkedAt).length,
  }));

  /* ── FR-003 · Sở hữu chứng khoán ────────────────────────────────────────── */

  const currentOwnerships = ownerships.filter((o) => o.securityId === selectedSecurityId && !o.unlinkedAt);
  const historicalCount = ownerships.filter((o) => o.securityId === selectedSecurityId && o.unlinkedAt).length;

  const totalPct = useMemo(
    () => currentOwnerships.reduce((sum, o) => sum + o.ownershipPct, 0),
    [currentOwnerships],
  );

  const ownershipCols: ColumnDef<SecurityOwnership>[] = [
    { key: 'investorId', headerVi: 'Nhà đầu tư', render: (r) => (
      <div>
        <div className="font-semibold">{investorName(r.investorId)}</div>
        <div className="font-mono text-[10px] text-slate-500">
          {investors.find((i) => i.id === r.investorId)?.identityNo}
        </div>
      </div>
    ) },
    { key: 'holderRole', headerVi: 'Vai trò', render: (r) => (
      <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold border bg-indigo-50 text-indigo-800 border-indigo-200">
        {HOLDER_ROLE_LABEL[r.holderRole]}
      </span>
    ) },
    { key: 'quantity', headerVi: 'Số lượng', render: (r) => <span className="font-mono">{r.quantity.toLocaleString('vi-VN')}</span> },
    { key: 'ownershipPct', headerVi: 'Tỷ lệ', render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold w-14 text-right">{r.ownershipPct.toFixed(2)}%</span>
        <div className="h-2 w-24 bg-slate-100 rounded-sm overflow-hidden">
          <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, r.ownershipPct)}%` }} />
        </div>
      </div>
    ) },
    { key: 'asOfDate', headerVi: 'Chốt tại ngày', render: (r) => <span className="font-mono text-[11px]">{r.asOfDate}</span> },
  ];

  return (
    <div className="space-y-5">
      {activeModule === 'own_investors' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Khai báo nhà đầu tư &amp; người có liên quan
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-026</span>
            </h2>
          </div>
          <Note>
            Danh mục dùng chung cho cả niêm yết và trái phiếu. Số định danh (CCCD / hộ chiếu / mã số thuế) là
            khóa duy nhất — chính nó cho phép phát hiện một người vừa là người nội bộ ở tổ chức này vừa là cổ
            đông lớn ở tổ chức khác. Nhà đầu tư đang có bản ghi sở hữu thì không xóa được.
          </Note>
          <CrudPanel<Investor & { usageCount: number }>
            frCode="FR-026"
            title="Nhà đầu tư"
            description="Cá nhân và tổ chức nắm giữ chứng khoán, gồm cả người nội bộ và người có liên quan."
            columns={investorCols}
            rows={investorRows}
            fields={investorFields}
            readOnly={readOnly}
            usageLabel={(r) => `"${r.fullName}" đang có ${r.usageCount} bản ghi sở hữu chứng khoán. Xóa sẽ làm mất lịch sử sở hữu — hãy hủy liên kết từng bản ghi sở hữu trước.`}
            onSave={(draft, editingId) => {
              if (editingId) {
                setInvestors((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...(draft as Partial<Investor>), updatedAt: nowIso() } : i)));
              } else {
                setInvestors((prev) => [
                  ...prev,
                  { ...(draft as unknown as Investor), id: nextId(prev), createdAt: nowIso(), createdBy: 1, versionNo: 1, isCurrent: true },
                ]);
              }
            }}
            onDelete={(row) => setInvestors((prev) => prev.filter((i) => i.id !== row.id))}
          />
        </div>
      )}

      {activeModule === 'own_holdings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Sở hữu chứng khoán trong hồ sơ doanh nghiệp
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-003</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã chứng khoán:</span>
            {securities.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSecurityId(s.id)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold ${selectedSecurityId === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {s.symbol}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng tỷ lệ đã khai</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">{totalPct.toFixed(2)}%</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số bản ghi hiện hành</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-1">{currentOwnerships.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bản ghi đã hủy liên kết</div>
              <div className="text-xl font-mono font-bold text-slate-500 mt-1">{historicalCount}</div>
            </div>
          </div>

          {totalPct > 100 && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-300 rounded-sm text-[11px] text-rose-900">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Tổng tỷ lệ sở hữu đã khai vượt 100% — có bản ghi trùng hoặc chưa hủy liên kết bản chốt kỳ trước.
              </span>
            </div>
          )}

          <Note>
            Sở hữu được chốt theo ngày. Khi có bản chốt kỳ mới, bản cũ được <strong>hủy liên kết</strong> chứ
            không xóa — nhờ vậy vẫn tra được cơ cấu sở hữu tại một thời điểm trong quá khứ khi cần đối chiếu
            với một giao dịch đã xảy ra.
          </Note>

          <DynamicTable<SecurityOwnership>
            columns={ownershipCols}
            data={currentOwnerships}
            density="compact"
            searchPlaceholder="Tìm theo tên nhà đầu tư..."
            actions={(r) =>
              readOnly ? (
                <span className="text-[10px] text-slate-400">—</span>
              ) : (
                <button
                  onClick={() =>
                    setOwnerships((prev) =>
                      prev.map((o) =>
                        o.id === r.id ? { ...o, unlinkedAt: nowIso(), unlinkReason: 'Hủy liên kết thủ công từ màn hình sở hữu' } : o,
                      ),
                    )
                  }
                  className="px-2 py-1 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-50 text-[10px] font-bold uppercase"
                >
                  Hủy liên kết
                </button>
              )
            }
          />
          <p className="text-[11px] text-slate-500">
            Đang xem cơ cấu sở hữu của <span className="font-mono font-bold">{securityLabel(selectedSecurityId)}</span>.
          </p>
        </div>
      )}
    </div>
  );
};
