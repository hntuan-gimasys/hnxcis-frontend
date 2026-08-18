/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ShieldCheck, UserPlus, Check, X, Building2, Activity, Info } from 'lucide-react';
import { CrudPanel, CrudField } from '../common/CrudPanel';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';
import { INITIAL_PERMISSIONS, INITIAL_ROLE_PERMISSIONS } from '../../data/metadataMock';
import {
  INITIAL_ACCOUNT_REQUESTS,
  INITIAL_SECURITY_POLICY,
  INITIAL_LOGIN_AUDIT,
  INITIAL_DATA_SCOPES,
} from '../../data/accessMock';
import type {
  AccountRequest,
  DataScopeGrant,
  Organization,
  RolePermission,
  SecurityPolicy,
  UserRoleCode,
} from '../../types/hnx';

/**
 * Khối tài khoản – phân quyền – bảo mật (FR-044, FR-055, FR-057 → FR-061).
 *
 * Ba trục của AuthZ Engine được tách thành ba màn hình riêng vì chúng trả lời ba
 * câu hỏi khác nhau và thường do người khác nhau cấu hình:
 *
 *   Trục 1 — được làm gì?      → FR-057, ma trận vai trò × quyền
 *   Trục 2 — trên dữ liệu nào? → FR-058 + FR-044, phạm vi dữ liệu
 *   Trục 3 — ở trạng thái nào? → cột "Trạng thái cho phép" trong ma trận trục 1
 *
 * Cả ba phải cùng thỏa thì hành động mới được phép. Gộp chúng vào một màn hình
 * sẽ che mất việc một người có quyền APPROVE nhưng không có dữ liệu nào trong
 * phạm vi thì vẫn không duyệt được gì.
 */

interface AccessModuleProps {
  activeModule: string;
  userRole: UserRoleCode;
  organizations: Organization[];
}

const ROLES: UserRoleCode[] = [
  'ROLE_SYS_ADMIN',
  'ROLE_BIZ_ADMIN',
  'ROLE_QLNY_STAFF',
  'ROLE_QLNY_MANAGER',
  'ROLE_TTTP_STAFF',
  'ROLE_TTTP_MANAGER',
  'ROLE_TTTT_STAFF',
  'ROLE_TTTT_MANAGER',
  'ROLE_CNTT_MANAGER',
  'ROLE_HNX_EXEC',
  'ROLE_ORG_STAFF',
  'ROLE_ORG_MANAGER',
];

const nowIso = () => new Date().toISOString();

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-sm text-[11px] text-slate-700 leading-relaxed">
    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
    <div>{children}</div>
  </div>
);

export const AccessModule: React.FC<AccessModuleProps> = ({ activeModule, userRole, organizations }) => {
  const readOnly = userRole === 'ROLE_CNTT_MANAGER' || userRole === 'ROLE_CNTT_STAFF';

  const [requests, setRequests] = useState<AccountRequest[]>(INITIAL_ACCOUNT_REQUESTS);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>(INITIAL_ROLE_PERMISSIONS);
  const [scopes, setScopes] = useState<DataScopeGrant[]>(INITIAL_DATA_SCOPES);
  const [policy, setPolicy] = useState<SecurityPolicy>(INITIAL_SECURITY_POLICY);
  const [orgs, setOrgs] = useState<Organization[]>(organizations);
  const [rejectFor, setRejectFor] = useState<AccountRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRoleCode>('ROLE_TTTT_STAFF');

  const nextId = (rows: Array<{ id: number }>) => Math.max(0, ...rows.map((r) => r.id)) + 1;

  /* ── FR-055 · Đăng ký tài khoản ─────────────────────────────────────────── */

  const reqCols: ColumnDef<AccountRequest>[] = [
    { key: 'requestNo', headerVi: 'Số yêu cầu', render: (r) => <span className="font-mono text-[11px] font-bold">{r.requestNo}</span> },
    { key: 'organizationName', headerVi: 'Tổ chức', render: (r) => (
      <div><div className="font-semibold">{r.organizationName}</div><div className="font-mono text-[10px] text-slate-500">MST {r.organizationTaxCode}</div></div>
    ) },
    { key: 'fullName', headerVi: 'Người đề nghị', render: (r) => (
      <div><div>{r.fullName}</div><div className="text-[10px] text-slate-500">{r.position}</div></div>
    ) },
    { key: 'email', headerVi: 'Liên hệ', render: (r) => (
      <div className="text-[11px]"><div>{r.email}</div><div className="text-slate-500">{r.phone}</div></div>
    ) },
    { key: 'requestedRole', headerVi: 'Vai trò đề nghị', render: (r) => <span className="font-mono text-[10px]">{r.requestedRole}</span> },
    {
      key: 'status',
      headerVi: 'Trạng thái',
      render: (r) => {
        const map: Record<AccountRequest['status'], string> = {
          PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
          APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
          RETURNED: 'bg-slate-100 text-slate-700 border-slate-300',
        };
        return (
          <div>
            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${map[r.status]}`}>{r.status}</span>
            {r.rejectReason && <div className="text-[10px] text-rose-700 mt-1 max-w-xs">{r.rejectReason}</div>}
          </div>
        );
      },
    },
  ];

  /* ── FR-057 · Phân quyền chức năng ──────────────────────────────────────── */

  const permsOfRole = useMemo(
    () => new Map(rolePerms.filter((rp) => rp.roleCode === selectedRole).map((rp) => [rp.permissionId, rp])),
    [rolePerms, selectedRole],
  );

  const togglePerm = (permissionId: number) => {
    if (readOnly) return;
    const existing = permsOfRole.get(permissionId);
    if (existing) {
      setRolePerms((prev) => prev.filter((rp) => rp.id !== existing.id));
    } else {
      setRolePerms((prev) => [
        ...prev,
        { id: nextId(prev), roleCode: selectedRole, permissionId, allowedStatuses: null, effect: 'ALLOW' },
      ]);
    }
  };

  /* ── FR-058 + FR-044 · Phân quyền dữ liệu ───────────────────────────────── */

  const scopeCols: ColumnDef<DataScopeGrant & { usageCount: number }>[] = [
    { key: 'subjectType', headerVi: 'Cấp cho', render: (r) => (
      <div><span className="font-mono text-[10px] text-slate-500">{r.subjectType}</span><div className="font-semibold">{r.subjectRef}</div></div>
    ) },
    { key: 'dimension', headerVi: 'Chiều dữ liệu', render: (r) => <span className="font-mono text-[11px]">{r.dimension}</span> },
    { key: 'operator', headerVi: 'Toán tử', render: (r) => <span className="font-mono text-[11px] font-bold">{r.operator}</span> },
    { key: 'valuesList', headerVi: 'Giá trị', render: (r) => (
      r.operator === 'ALL'
        ? <span className="text-slate-500 italic">toàn bộ</span>
        : <span className="font-mono text-[10px]">{r.valuesList.join(', ') || '—'}</span>
    ) },
    {
      key: 'effect',
      headerVi: 'Hiệu lực',
      render: (r) =>
        r.effect === 'DENY'
          ? <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">DENY</span>
          : <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">ALLOW</span>,
    },
  ];

  const scopeFields: CrudField[] = [
    { key: 'subjectType', label: 'Cấp cho loại', type: 'select', required: true, options: [
      { value: 'ROLE', label: 'Vai trò' }, { value: 'UNIT', label: 'Đơn vị' }, { value: 'USER', label: 'Người dùng cụ thể' },
    ] },
    { key: 'subjectRef', label: 'Định danh', type: 'text', required: true, help: 'Mã vai trò, mã đơn vị hoặc tên đăng nhập.' },
    { key: 'dimension', label: 'Chiều dữ liệu', type: 'select', required: true, options:
      ['ORGANIZATION', 'BOARD', 'SECURITY_TYPE', 'NEWS_GROUP', 'UNIT', 'INDUSTRY'].map((v) => ({ value: v, label: v })) },
    { key: 'operator', label: 'Toán tử', type: 'select', required: true, options: [
      { value: 'IN', label: 'IN — chỉ các giá trị liệt kê' },
      { value: 'NOT_IN', label: 'NOT_IN — trừ các giá trị liệt kê' },
      { value: 'ALL', label: 'ALL — toàn bộ' },
    ] },
    { key: 'valuesListText', label: 'Danh sách giá trị', type: 'text', help: 'Ngăn cách bằng dấu phẩy. Bỏ trống khi toán tử là ALL.' },
    { key: 'effect', label: 'Hiệu lực', type: 'select', required: true, options: [
      { value: 'ALLOW', label: 'ALLOW — cho phép' }, { value: 'DENY', label: 'DENY — từ chối (thắng ALLOW)' },
    ] },
  ];

  /* ── FR-061 · Hồ sơ tổ chức ─────────────────────────────────────────────── */

  const orgCols: ColumnDef<Organization & { usageCount: number }>[] = [
    { key: 'taxCode', headerVi: 'Mã số thuế', render: (r) => <span className="font-mono text-[11px] font-bold">{r.taxCode}</span> },
    { key: 'shortName', headerVi: 'Tên viết tắt', render: (r) => <span className="font-bold">{r.shortName}</span> },
    { key: 'nameVi', headerVi: 'Tên đầy đủ' },
    { key: 'orgType', headerVi: 'Loại tổ chức', render: (r) => <span className="font-mono text-[10px]">{r.orgType}</span> },
    { key: 'charterCapital', headerVi: 'Vốn điều lệ', render: (r) => (
      <span className="font-mono">{(r.charterCapital / 1_000_000_000).toLocaleString('vi-VN')} tỷ</span>
    ) },
    { key: 'legalRepName', headerVi: 'Người đại diện' },
    { key: 'disclosureRepName', headerVi: 'Người CBTT', render: (r) => (
      <div className="text-[11px]"><div>{r.disclosureRepName}</div><div className="text-slate-500">{r.disclosureRepEmail}</div></div>
    ) },
    {
      key: 'status',
      headerVi: 'Trạng thái',
      render: (r) => {
        const map = { APPROVED: 'text-emerald-700', PENDING: 'text-amber-700', SUSPENDED: 'text-rose-700' };
        return <span className={`font-semibold ${map[r.status]}`}>{r.status}</span>;
      },
    },
  ];

  const orgFields: CrudField[] = [
    { key: 'taxCode', label: 'Mã số thuế', type: 'text', required: true, immutableOnEdit: true, help: 'Khóa định danh gốc của tổ chức — không đổi được sau khi tạo.' },
    { key: 'shortName', label: 'Tên viết tắt', type: 'text', required: true },
    { key: 'nameVi', label: 'Tên tiếng Việt', type: 'text', required: true },
    { key: 'nameEn', label: 'Tên tiếng Anh', type: 'text' },
    { key: 'orgType', label: 'Loại tổ chức', type: 'select', required: true, options: [
      { value: 'LISTED', label: 'Tổ chức niêm yết' },
      { value: 'UPCOM_REGISTERED', label: 'Tổ chức ĐKGD UPCoM' },
      { value: 'PRIVATE_BOND_ISSUER', label: 'Tổ chức phát hành TPDN riêng lẻ' },
      { value: 'STARTUP', label: 'Doanh nghiệp khởi nghiệp' },
    ] },
    { key: 'businessRegNo', label: 'Số ĐKKD', type: 'text' },
    { key: 'businessRegDate', label: 'Ngày ĐKKD', type: 'date' },
    { key: 'charterCapital', label: 'Vốn điều lệ (VND)', type: 'number' },
    { key: 'industryCode', label: 'Mã ngành', type: 'text' },
    { key: 'address', label: 'Địa chỉ', type: 'textarea' },
    { key: 'phone', label: 'Điện thoại', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'legalRepName', label: 'Người đại diện pháp luật', type: 'text', required: true },
    { key: 'disclosureRepName', label: 'Người phụ trách CBTT', type: 'text', required: true },
    { key: 'disclosureRepEmail', label: 'Email người CBTT', type: 'text', required: true },
    { key: 'status', label: 'Trạng thái', type: 'select', options: [
      { value: 'APPROVED', label: 'Đã duyệt' }, { value: 'PENDING', label: 'Chờ duyệt' }, { value: 'SUSPENDED', label: 'Tạm ngưng' },
    ] },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-sm p-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Tài khoản · Phân quyền · Bảo mật
        </div>
        <p className="text-[11px] text-slate-600 mt-1 max-w-4xl">
          Ba trục của AuthZ Engine phải cùng thỏa thì một hành động mới được phép: được làm gì (quyền chức
          năng), trên dữ liệu nào (phạm vi dữ liệu), và ở trạng thái nào của bản ghi.
          {readOnly && <strong className="text-amber-700"> Vai trò của bạn chỉ được xem.</strong>}
        </p>
      </div>

      {activeModule === 'access_requests' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Quản lý đăng ký tài khoản
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-055</span>
            </h2>
          </div>
          <Note>
            Doanh nghiệp gửi yêu cầu mở tài khoản kèm mã số thuế. HNX đối chiếu với hồ sơ tổ chức (FR-061)
            trước khi duyệt — mã số thuế không khớp là lý do từ chối phổ biến nhất, nên thông báo từ chối
            phải nêu rõ để doanh nghiệp biết đường sửa.
          </Note>

          <DynamicTable<AccountRequest>
            columns={reqCols}
            data={requests}
            density="compact"
            searchPlaceholder="Tìm theo số yêu cầu, tổ chức, người đề nghị..."
            actions={(r) =>
              r.status === 'PENDING' && !readOnly ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setRequests((prev) =>
                        prev.map((x) => (x.id === r.id ? { ...x, status: 'APPROVED', processedAt: nowIso(), processedBy: 1 } : x)),
                      )
                    }
                    className="px-2 py-1 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase"
                  >
                    <Check className="h-3 w-3 inline mr-0.5" />Duyệt
                  </button>
                  <button
                    onClick={() => { setRejectFor(r); setRejectReason(''); }}
                    className="px-2 py-1 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase"
                  >
                    <X className="h-3 w-3 inline mr-0.5" />Từ chối
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400">
                  {r.processedAt ? `Đã xử lý ${new Date(r.processedAt).toLocaleDateString('vi-VN')}` : '—'}
                </span>
              )
            }
          />

          {rejectFor && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-md shadow-2xl w-full max-w-lg">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Từ chối yêu cầu {rejectFor.requestNo}
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Lý do từ chối <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-sm"
                    placeholder="Nêu rõ để doanh nghiệp biết cần sửa gì trước khi nộp lại..."
                  />
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                  <button onClick={() => setRejectFor(null)} className="px-3 py-2 rounded-sm border border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider">Hủy</button>
                  <button
                    disabled={!rejectReason.trim()}
                    onClick={() => {
                      setRequests((prev) =>
                        prev.map((x) => (x.id === rejectFor.id ? { ...x, status: 'REJECTED', rejectReason, processedAt: nowIso(), processedBy: 1 } : x)),
                      );
                      setRejectFor(null);
                    }}
                    className="px-3 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeModule === 'access_permissions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Phân quyền chức năng
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-057</span>
            </h2>
          </div>
          <Note>
            Trục 1 và trục 3 của AuthZ Engine. Cột <strong>Trạng thái cho phép</strong> là trục 3: cùng một
            quyền có thể chỉ được dùng khi bản ghi đang ở trạng thái nhất định — ví dụ chuyên viên chỉ sửa
            được hồ sơ khi còn DRAFT. <strong>DENY luôn thắng ALLOW</strong> khi gộp quyền.
          </Note>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vai trò:</span>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold ${selectedRole === r ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {r.replace('ROLE_', '')}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-sm overflow-x-auto">
            <table className="w-full text-xs min-w-[620px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left px-3 py-2 w-16">Cấp</th>
                  <th className="text-left px-3 py-2">Mã quyền</th>
                  <th className="text-left px-3 py-2">Tên quyền</th>
                  <th className="text-left px-3 py-2">Module</th>
                  <th className="text-left px-3 py-2">Trạng thái cho phép</th>
                  <th className="text-left px-3 py-2">Hiệu lực</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_PERMISSIONS.map((p) => {
                  const rp = permsOfRole.get(p.id);
                  return (
                    <tr key={p.id} className={rp ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-1.5">
                        <input type="checkbox" checked={Boolean(rp)} disabled={readOnly} onChange={() => togglePerm(p.id)} />
                      </td>
                      <td className="px-3 py-1.5 font-mono font-bold text-[11px]">{p.permissionCode}</td>
                      <td className="px-3 py-1.5">{p.nameVi}</td>
                      <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">{p.moduleCode}</td>
                      <td className="px-3 py-1.5 font-mono text-[10px]">
                        {rp ? (rp.allowedStatuses?.length ? rp.allowedStatuses.join(', ') : <span className="text-slate-400">mọi trạng thái</span>) : '—'}
                      </td>
                      <td className="px-3 py-1.5">
                        {rp ? (
                          rp.effect === 'DENY'
                            ? <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">DENY</span>
                            : <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">ALLOW</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">
            Vai trò <span className="font-mono">{selectedRole}</span> hiện có{' '}
            <strong>{permsOfRole.size}</strong>/{INITIAL_PERMISSIONS.length} quyền.
          </p>
        </div>
      )}

      {activeModule === 'access_datascope' && (
        <CrudPanel<DataScopeGrant & { usageCount: number }>
          frCode="FR-058 · FR-044"
          title="Phân quyền dữ liệu"
          description="Trục 2 của AuthZ Engine — quyết định một người nhìn thấy dữ liệu nào. Có quyền phê duyệt nhưng không có tổ chức nào trong phạm vi thì vẫn không duyệt được gì. DENY luôn thắng ALLOW."
          columns={scopeCols}
          rows={scopes.map((s) => ({ ...s, usageCount: 0 }))}
          fields={scopeFields}
          readOnly={readOnly}
          onSave={(draft, editingId) => {
            const valuesList = String(draft.valuesListText ?? '')
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean);
            const payload = {
              subjectType: draft.subjectType as DataScopeGrant['subjectType'],
              subjectRef: String(draft.subjectRef ?? ''),
              dimension: draft.dimension as DataScopeGrant['dimension'],
              operator: draft.operator as DataScopeGrant['operator'],
              effect: draft.effect as DataScopeGrant['effect'],
              valuesList,
            };
            if (editingId) {
              setScopes((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s)));
            } else {
              setScopes((prev) => [...prev, { ...payload, id: nextId(prev) }]);
            }
          }}
          onDelete={(row) => setScopes((prev) => prev.filter((s) => s.id !== row.id))}
        />
      )}

      {activeModule === 'access_security' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Cấu hình bảo mật tài khoản và đăng nhập
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-059 · FR-060</span>
            </h2>
          </div>
          <Note>
            Các giá trị ở đây có hiệu lực thật với màn hình đăng nhập: số lần sai tối đa, thời gian khóa và
            danh sách vai trò bắt buộc xác thực hai yếu tố đều được màn đăng nhập đọc và thi hành.
          </Note>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                FR-059 — Chính sách mật khẩu
              </div>
              <div className="p-4 space-y-3 text-xs">
                {([
                  ['passwordMinLength', 'Độ dài tối thiểu', 'number'],
                  ['passwordExpiryDays', 'Số ngày bắt buộc đổi mật khẩu', 'number'],
                  ['passwordHistoryCount', 'Không cho dùng lại N mật khẩu gần nhất', 'number'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-slate-700">{label}</span>
                    <input
                      type="number"
                      disabled={readOnly}
                      value={policy[key]}
                      onChange={(e) => setPolicy({ ...policy, [key]: Number(e.target.value) })}
                      className="w-24 px-2 py-1 border border-slate-300 rounded-sm font-mono text-right disabled:bg-slate-100"
                    />
                  </div>
                ))}
                {([
                  ['passwordRequireUppercase', 'Bắt buộc có chữ hoa'],
                  ['passwordRequireDigit', 'Bắt buộc có chữ số'],
                  ['passwordRequireSymbol', 'Bắt buộc có ký tự đặc biệt'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-slate-700">{label}</span>
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={policy[key]}
                      onChange={(e) => setPolicy({ ...policy, [key]: e.target.checked })}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                FR-060 — Chính sách đăng nhập
              </div>
              <div className="p-4 space-y-3 text-xs">
                {([
                  ['maxFailedAttempts', 'Số lần sai tối đa trước khi khóa'],
                  ['lockoutMinutes', 'Thời gian khóa (phút)'],
                  ['sessionTimeoutMinutes', 'Hết hạn phiên khi không thao tác (phút)'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-slate-700">{label}</span>
                    <input
                      type="number"
                      disabled={readOnly}
                      value={policy[key]}
                      onChange={(e) => setPolicy({ ...policy, [key]: Number(e.target.value) })}
                      className="w-24 px-2 py-1 border border-slate-300 rounded-sm font-mono text-right disabled:bg-slate-100"
                    />
                  </div>
                ))}
                <div>
                  <div className="text-slate-700 mb-1.5">Vai trò bắt buộc xác thực hai yếu tố</div>
                  <div className="flex flex-wrap gap-1">
                    {ROLES.map((r) => {
                      const on = policy.mfaRequiredForRoles.includes(r);
                      return (
                        <button
                          key={r}
                          disabled={readOnly}
                          onClick={() =>
                            setPolicy({
                              ...policy,
                              mfaRequiredForRoles: on
                                ? policy.mfaRequiredForRoles.filter((x) => x !== r)
                                : [...policy.mfaRequiredForRoles, r],
                            })
                          }
                          className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold border ${
                            on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'
                          } disabled:opacity-50`}
                        >
                          {r.replace('ROLE_', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex items-center justify-between gap-3 cursor-pointer pt-1">
                  <span className="text-slate-700">Chỉ cho đăng nhập từ dải IP cho phép</span>
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={policy.ipAllowlistEnabled}
                    onChange={(e) => setPolicy({ ...policy, ipAllowlistEnabled: e.target.checked })}
                  />
                </label>
                {policy.ipAllowlistEnabled && (
                  <div className="font-mono text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-sm p-2">
                    {policy.ipAllowlist.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nhật ký đăng nhập</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[620px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left px-3 py-2">Thời điểm</th>
                    <th className="text-left px-3 py-2">Tài khoản</th>
                    <th className="text-left px-3 py-2">Kết quả</th>
                    <th className="text-left px-3 py-2">Địa chỉ IP</th>
                    <th className="text-left px-3 py-2">Thiết bị</th>
                    <th className="text-left px-3 py-2">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INITIAL_LOGIN_AUDIT.map((l) => (
                    <tr key={l.id} className={l.result === 'SUCCESS' ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50'}>
                      <td className="px-3 py-1.5 font-mono text-[10px]">{new Date(l.occurredAt).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-1.5 font-mono font-bold text-[11px]">{l.username}</td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                          l.result === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : l.result === 'LOCKED_OUT'
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>{l.result}</span>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[10px]">{l.ipAddress}</td>
                      <td className="px-3 py-1.5 text-[11px] text-slate-600">{l.userAgent}</td>
                      <td className="px-3 py-1.5 text-[11px] text-slate-600">{l.failReason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'access_orgs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span className="text-[11px] text-slate-600">
              Hồ sơ tổ chức là gốc định danh của toàn hệ thống — mã số thuế nối tài khoản, chứng khoán, hồ sơ
              và nghĩa vụ công bố lại với nhau. Vì vậy mã số thuế không sửa được sau khi tạo.
            </span>
          </div>
          <CrudPanel<Organization & { usageCount: number }>
            frCode="FR-061"
            title="Quản lý hồ sơ tổ chức"
            description="Thông tin pháp lý, vốn điều lệ, người đại diện và người phụ trách công bố thông tin của từng tổ chức."
            columns={orgCols}
            rows={orgs.map((o) => ({ ...o, usageCount: 1 }))}
            fields={orgFields}
            readOnly={readOnly}
            usageLabel={(r) => `Tổ chức "${r.shortName}" đang có chứng khoán, tài khoản và hồ sơ gắn với mã số thuế ${r.taxCode}. Không xóa được — chuyển sang trạng thái SUSPENDED nếu ngừng hoạt động.`}
            onSave={(draft, editingId) => {
              if (editingId) {
                setOrgs((prev) => prev.map((o) => (o.id === editingId ? { ...o, ...(draft as Partial<Organization>), updatedAt: nowIso() } : o)));
              } else {
                setOrgs((prev) => [
                  ...prev,
                  { ...(draft as unknown as Organization), id: nextId(prev), createdAt: nowIso(), createdBy: 1, versionNo: 1, isCurrent: true },
                ]);
              }
            }}
            onDelete={(row) => setOrgs((prev) => prev.filter((o) => o.id !== row.id))}
          />
        </div>
      )}
    </div>
  );
};
