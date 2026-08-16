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
        <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-xs">
          {row.roleCode}
        </span>
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
      </div>

      {activeModule === 'admin_system' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Trình Kéo thả Cấu hình Biểu mẫu & Quy trình (Form & Workflow Builder)
            </h3>
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider shadow-xs"
            >
              {showBuilder ? 'Đóng Builder' : '+ Mở Visual Drag & Drop Builder'}
            </button>
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
            <button
              onClick={() => alert('Thêm người dùng thử nghiệm mới!')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              + Tạo Tài khoản
            </button>
          </div>

          <DynamicTable data={users} columns={userColumns} />
        </div>
      )}
    </div>
  );
};
