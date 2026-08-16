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
import { UserAccount } from '../../types/hnx';
import { ROLE_CATALOG, getRoleLabel } from '../../data/roleCatalog';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';

interface AdminModuleProps {
  activeModule: string;
  users: UserAccount[];
  currentUser: UserAccount;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  activeModule,
  users,
  currentUser,
}) => {
  const [showBuilder, setShowBuilder] = useState(false);

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

      {activeModule === 'admin_users' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Danh sách Tài khoản & Phân quyền dựa trên Thuộc tính (ABAC Authorization)
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
