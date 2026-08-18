/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Users,
  Shield,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, TemplateDefinition } from '../../types/hnx';
import { ROLE_CATALOG, getRoleLabel } from '../../data/roleCatalog';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';

/**
 * SÁU cờ của mẫu báo cáo theo bảng "Thông tin quản lý" của URD
 * (PRD v1.2 §7.5 FR-047, §13.2 S8). Hai cấp tự động duyệt là HAI cờ riêng.
 */
type TemplateFlagKey =
  | 'autoApproveManager'
  | 'autoApproveStaff'
  | 'requireCaSign'
  | 'postAudit'
  | 'allowPublish'
  | 'isActive';

interface TemplateFlagSpec {
  key: TemplateFlagKey;
  labelVi: string;
  /** Nhãn rút gọn dùng trong bảng danh sách. */
  shortVi: string;
  descriptionVi: string;
}

const TEMPLATE_FLAGS: TemplateFlagSpec[] = [
  {
    key: 'autoApproveManager',
    labelVi: 'Lãnh đạo tự động duyệt',
    shortVi: 'LĐ duyệt',
    descriptionVi: 'Tự động duyệt tin ở bước lãnh đạo.',
  },
  {
    key: 'autoApproveStaff',
    labelVi: 'Chuyên viên tự động duyệt',
    shortVi: 'CV duyệt',
    descriptionVi: 'Tự động duyệt tin ở bước chuyên viên.',
  },
  {
    key: 'requireCaSign',
    labelVi: 'Ký CA',
    shortVi: 'Ký CA',
    descriptionVi: 'Xác định mẫu tin có yêu cầu kiểm tra chữ ký số.',
  },
  {
    key: 'postAudit',
    labelVi: 'Hậu kiểm tin',
    shortVi: 'Hậu kiểm',
    descriptionVi: 'Đánh dấu mẫu tin thuộc diện hậu kiểm.',
  },
  {
    key: 'allowPublish',
    labelVi: 'Công bố',
    shortVi: 'Công bố',
    descriptionVi: 'Xác định mẫu có được phép công bố ra ngoài hệ thống.',
  },
  {
    key: 'isActive',
    labelVi: 'Kích hoạt',
    shortVi: 'Kích hoạt',
    descriptionVi: 'Trạng thái sử dụng của mẫu báo cáo.',
  },
];

interface AdminModuleProps {
  activeModule: string;
  users: UserAccount[];
  currentUser: UserAccount;
  templates: TemplateDefinition[];
  onUpdateTemplate: (template: TemplateDefinition) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  activeModule,
  users,
  currentUser,
  templates,
  onUpdateTemplate,
}) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [configTemplateId, setConfigTemplateId] = useState<number | null>(null);

  /**
   * Lãnh đạo P.CNTT được xem cấu hình và tài khoản để vận hành, nhưng không sửa —
   * quyền sửa thuộc Admin / Adp (PRD v1.2 §2.1: P.CNTT ≠ Admin ≠ Adp).
   */
  const isReadOnly = currentUser.roleCode === 'ROLE_CNTT_MANAGER';

  /** Gom vai trò theo đơn vị để danh sách phân quyền đọc được theo phòng ban. */
  const rolesByUnit = ROLE_CATALOG.reduce<Record<string, typeof ROLE_CATALOG>>((acc, role) => {
    acc[role.unitVi] = [...(acc[role.unitVi] || []), role];
    return acc;
  }, {});

  const configTemplate = templates.find((t) => t.id === configTemplateId) || null;

  const toggleFlag = (template: TemplateDefinition, key: TemplateFlagKey) => {
    if (isReadOnly) return;
    onUpdateTemplate({ ...template, [key]: !template[key] });
  };

  const templateColumns: ColumnDef<TemplateDefinition>[] = [
    {
      key: 'templateCode',
      headerVi: 'Mã / Tên mẫu báo cáo',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-mono text-[11px] font-bold text-indigo-700">{row.templateCode}</div>
          <div className="font-bold text-slate-900 text-xs">{row.nameVi}</div>
          {row.nameEn && <div className="text-[11px] text-slate-500 italic">{row.nameEn}</div>}
        </div>
      ),
    },
    {
      key: 'ownerUnitCode',
      headerVi: 'Đơn vị sử dụng / kiểm soát',
      render: (row) => (
        <div className="text-xs text-slate-700 font-mono">
          <div>{row.ownerUnitCode || '-'}</div>
          <div className="text-[10px] text-slate-500">KS: {row.controlUnitCode || 'Chưa khai báo'}</div>
        </div>
      ),
    },
    {
      key: 'flags',
      headerVi: '6 cờ cấu hình (FR-047)',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {TEMPLATE_FLAGS.map((flag) => (
            <span
              key={flag.key}
              title={`${flag.labelVi} — ${flag.descriptionVi}`}
              className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold border ${
                row[flag.key]
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
              }`}
            >
              {flag.shortVi}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'workflowDefCode',
      headerVi: 'Quy trình duyệt',
      render: (row) => (
        <span className="font-mono text-[10px] text-slate-600">{row.workflowDefCode}</span>
      ),
    },
  ];

  const userColumns: ColumnDef<UserAccount>[] = [
    {
      key: 'username',
      headerVi: 'Tên Tài khoản / Họ tên',
      render: (row) => (
        <div>
          <div className="font-mono text-xs font-bold text-indigo-700">{row.username}</div>
          <div className="font-bold text-slate-900 text-xs">{row.fullName}</div>
        </div>
      ),
    },
    {
      key: 'email',
      headerVi: 'Email / Đơn vị',
      render: (row) => (
        <div className="text-xs text-slate-600 font-mono">
          {row.email} | {row.unitCode || row.actorType}
        </div>
      ),
    },
    {
      key: 'roleCode',
      headerVi: 'Vai trò (ABAC Role)',
      render: (row) => (
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-900">{getRoleLabel(row.roleCode)}</div>
          <span className="inline-block px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-xs">
            {row.roleCode}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      headerVi: 'Trạng thái',
      render: (row) => (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xs text-xs font-bold uppercase tracking-wider">
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Quản trị Hệ thống IMS/ICDS (System Admin)
        </h1>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
          FR-046 → FR-065: Form / Workflow / Rule Builder, Phân quyền ABAC & Nhật ký Audit Log
        </p>

        {isReadOnly && (
          <div className="mt-3 flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Chế độ chỉ đọc — {getRoleLabel(currentUser.roleCode)}.</span>{' '}
              Anh/Chị xem được cấu hình và danh sách tài khoản để phục vụ vận hành, nhưng thao tác
              tạo/sửa thuộc quyền Quản trị hệ thống (Admin) và Quản trị nghiệp vụ phòng (Adp).
            </div>
          </div>
        )}
      </div>

      {activeModule === 'admin_system' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Trình Kéo thả Cấu hình Biểu mẫu & Quy trình (Form & Workflow Builder)
            </h3>
            {!isReadOnly && (
              <button
                onClick={() => setShowBuilder(!showBuilder)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider shadow-xs"
              >
                {showBuilder ? 'Đóng Builder' : '+ Mở Visual Drag & Drop Builder'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Dynamic Form Engine</div>
              <p className="text-slate-600 text-[11px]">
                Định nghĩa các trường E-Form, ràng buộc Validate dữ liệu trực tuyến không cần sửa code.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Rule Engine (Drools-like)</div>
              <p className="text-slate-600 text-[11px]">
                Thiết lập quy tắc cảnh báo vi phạm tự động theo Luật Chứng khoán 2019.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Workflow Engine</div>
              <p className="text-slate-600 text-[11px]">
                Cấu hình ma trận duyệt 2 bước/3 bước (Chuyên viên → Lãnh đạo Phòng → Lãnh đạo Sở).
              </p>
            </div>
          </div>

          {showBuilder && (
            <div className="p-5 bg-slate-900 text-white border-l-4 border-l-indigo-500 rounded-sm space-y-3 text-xs">
              <div className="font-bold uppercase tracking-wider text-indigo-300">
                Giao diện Visual Builder - Đã khởi chạy
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xs font-mono text-slate-300">
                [Canvas Visual Form] Kéo các khối: ShortText, Currency, DatePicker, FileUpload...
              </div>
            </div>
          )}
        </div>
      )}

      {activeModule === 'admin_templates' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Quản lý Khai báo & Cấu hình Mẫu báo cáo (FR-047)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mỗi mẫu có <span className="font-semibold text-slate-700">6 cờ</span> theo bảng
                "Thông tin quản lý" của URD. Tự động duyệt tách riêng hai cấp: lãnh đạo và
                chuyên viên.
              </p>
            </div>

            {!isReadOnly && (
              <button
                onClick={() => alert('Thêm mẫu báo cáo mới (prototype - chưa nối backend).')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs shrink-0"
              >
                + Thêm Mẫu báo cáo
              </button>
            )}
          </div>

          {/* Chú giải 6 cờ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TEMPLATE_FLAGS.map((flag) => (
              <div
                key={flag.key}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm space-y-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-700 rounded-xs text-[10px] font-bold">
                    {flag.shortVi}
                  </span>
                  <span className="text-[11px] font-bold text-slate-900">{flag.labelVi}</span>
                </div>
                <p className="text-[11px] text-slate-600">{flag.descriptionVi}</p>
              </div>
            ))}
          </div>

          <DynamicTable
            data={templates}
            columns={templateColumns}
            searchPlaceholder="Tìm theo mã mẫu, tên mẫu, đơn vị..."
            onExportExcel={() => alert('Đã xuất danh sách Mẫu báo cáo (.xlsx)!')}
            actions={(row) => (
              <button
                onClick={() => setConfigTemplateId(row.id)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                {isReadOnly ? 'Xem cấu hình' : 'Cấu hình'}
              </button>
            )}
          />
        </div>
      )}

      {/* Form cấu hình 6 cờ của một mẫu báo cáo */}
      {configTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cấu hình mẫu: {configTemplate.nameVi}
                </h3>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                  {configTemplate.templateCode} · Quy trình {configTemplate.workflowDefCode}
                </p>
              </div>
              <button
                onClick={() => setConfigTemplateId(null)}
                className="p-1 hover:bg-slate-100 rounded-sm text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isReadOnly && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900">
                Chế độ chỉ đọc — Anh/Chị xem được cấu hình nhưng không thay đổi được các cờ.
              </div>
            )}

            <div className="space-y-2">
              {TEMPLATE_FLAGS.map((flag) => (
                <label
                  key={flag.key}
                  className={`flex items-start gap-3 p-3 border rounded-sm transition-colors ${
                    isReadOnly
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(configTemplate[flag.key])}
                    disabled={isReadOnly}
                    onChange={() => toggleFlag(configTemplate, flag.key)}
                    className="mt-0.5 h-4 w-4 accent-indigo-600 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">{flag.labelVi}</div>
                    <p className="text-[11px] text-slate-600">{flag.descriptionVi}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-sm text-[11px] text-slate-600 space-y-1">
              <div>
                <span className="font-semibold text-slate-800">Công thức tiêu đề:</span>{' '}
                <span className="font-mono">{configTemplate.titleFormula || 'Chưa cấu hình'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">Đơn vị kiểm soát:</span>{' '}
                <span className="font-mono">{configTemplate.controlUnitCode || 'Chưa khai báo'}</span>
              </div>
              <p className="pt-1 text-slate-500">
                Ở bản prototype các cờ mới là dữ liệu cấu hình, chưa nối vào Workflow Engine.
                Hành vi của "Ký CA" và "Hậu kiểm tin" còn chờ nghiệp vụ chốt.
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setConfigTemplateId(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold uppercase tracking-wider"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'admin_users' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Danh sách Tài khoản & Phân quyền dựa trên Thuộc tính (FR-056, ABAC Authorization)
            </h3>
            {!isReadOnly && (
              <button
                onClick={() => alert('Thêm người dùng thử nghiệm mới!')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs"
              >
                + Tạo Tài khoản
              </button>
            )}
          </div>

          <DynamicTable data={users} columns={userColumns} />

          {/* Danh mục vai trò đầy đủ — nguồn cho dropdown chọn vai trò khi tạo/sửa tài khoản */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Danh mục Vai trò Hệ thống ({ROLE_CATALOG.length} vai trò)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                Bảng "Người sử dụng hệ thống" — URD
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Object.entries(rolesByUnit).map(([unit, roles]) => (
                <div key={unit} className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                  <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    {unit}
                  </div>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div key={role.code} className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800">{role.labelVi}</span>
                          <span className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-600 font-mono text-[10px] font-bold rounded-xs">
                            {role.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{role.descriptionVi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
