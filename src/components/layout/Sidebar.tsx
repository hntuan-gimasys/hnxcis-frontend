/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck,
  ShieldAlert,
  Sliders,
  Sparkles,
  Users,
  Settings,
  Layers,
  Award,
  AlertTriangle,
  Building,
  CreditCard,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { UserRoleCode } from '../../types/hnx';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  userRole: UserRoleCode;
  activePortal: 'internal' | 'corporate' | 'public';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  userRole,
  activePortal,
}) => {
  if (activePortal === 'public') {
    return null;
  }

  if (activePortal === 'corporate') {
    return (
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 hidden md:block">
        <div className="p-4 border-b border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Cổng Doanh nghiệp (Self-Service)
          </div>
          <div className="text-sm font-bold text-white mt-1">Vinamilk (VNM)</div>
        </div>

        <nav className="p-3 space-y-1.5 text-xs">
          <button
            onClick={() => setActiveModule('corp_dashboard')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-sm font-bold tracking-wider text-[11px] uppercase transition-all ${
              activeModule === 'corp_dashboard'
                ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard Nghĩa vụ & Cảnh báo</span>
          </button>

          <button
            onClick={() => setActiveModule('corp_filing')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-sm font-bold tracking-wider text-[11px] uppercase transition-all ${
              activeModule === 'corp_filing'
                ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Nộp Báo cáo & Hồ sơ (E-Form)</span>
          </button>

          <button
            onClick={() => setActiveModule('corp_history')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-sm font-bold tracking-wider text-[11px] uppercase transition-all ${
              activeModule === 'corp_history'
                ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>Lịch sử CBTT (Chỉ xem)</span>
          </button>
        </nav>
      </aside>
    );
  }

  // Internal HNX Portal
  const isSysAdmin = userRole === 'ROLE_SYS_ADMIN' || userRole === 'ROLE_BIZ_ADMIN';
  const isQLNY = userRole.includes('QLNY') || isSysAdmin || userRole === 'ROLE_HNX_EXEC';
  const isTTTP = userRole.includes('TTTP') || isSysAdmin || userRole === 'ROLE_HNX_EXEC';
  const isTTTT = userRole.includes('TTTT') || isSysAdmin || userRole === 'ROLE_HNX_EXEC';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 hidden md:block">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Cổng Nội bộ HNX
        </div>
        <div className="text-sm font-bold text-white mt-1">Phòng Ban HNX-CIS</div>
      </div>

      <nav className="p-3 space-y-6 text-xs overflow-y-auto max-h-[calc(100vh-5rem)]">
        {/* General Overview */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Tổng quan & Khai thác
          </div>

          <button
            onClick={() => setActiveModule('dashboard')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold tracking-wide transition-all ${
              activeModule === 'dashboard'
                ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard Tuân thủ & SLA</span>
          </button>

          <button
            onClick={() => setActiveModule('ai_center')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold tracking-wide transition-all ${
              activeModule === 'ai_center'
                ? 'bg-purple-600 text-white font-bold border-l-4 border-white shadow-xs'
                : 'hover:bg-slate-800 text-purple-300'
            }`}
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>Trung tâm AI (4 Tính năng)</span>
          </button>
        </div>

        {/* P.QLNY */}
        {isQLNY && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Quản lý Niêm yết (P.QLNY)
            </div>

            <button
              onClick={() => setActiveModule('qlny_equities')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'qlny_equities'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Hồ sơ Cổ phiếu (FR-001)</span>
            </button>

            <button
              onClick={() => setActiveModule('qlny_status_control')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'qlny_status_control'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Kiểm soát Trạng thái (Đ40-44)</span>
            </button>

            <button
              onClick={() => setActiveModule('qlny_delisting')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'qlny_delisting'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>Hủy Niêm yết (FR-010,011)</span>
            </button>

            <button
              onClick={() => setActiveModule('qlny_fees')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'qlny_fees'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Quản lý Phí (FR-017)</span>
            </button>

            <button
              onClick={() => setActiveModule('qlny_corp_actions')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'qlny_corp_actions'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Sự kiện DN & Sổ T+2 (FR-018)</span>
            </button>
          </div>
        )}

        {/* P.TTTP */}
        {isTTTP && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Thị trường Trái phiếu (P.TTTP)
            </div>

            <button
              onClick={() => setActiveModule('tttp_bonds')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'tttp_bonds'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Trái phiếu Riêng lẻ (FR-020)</span>
            </button>

            <button
              onClick={() => setActiveModule('tttp_green_bonds')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'tttp_green_bonds'
                  ? 'bg-emerald-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-emerald-300'
              }`}
            >
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Trái phiếu Xanh (FR-021)</span>
            </button>
          </div>
        )}

        {/* P.TTTT */}
        {isTTTT && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Công bố Thông tin (P.TTTT)
            </div>

            <button
              onClick={() => setActiveModule('tttt_inbox')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'tttt_inbox'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Hàng đợi Phê duyệt (FR-039)</span>
            </button>

            <button
              onClick={() => setActiveModule('tttt_violations')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'tttt_violations'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Vi phạm CBTT (FR-041)</span>
            </button>

            <button
              onClick={() => setActiveModule('tttt_display_config')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'tttt_display_config'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Cấu hình Hiển thị (FR-042)</span>
            </button>
          </div>
        )}

        {/* Admin */}
        {isSysAdmin && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Quản trị Hệ thống (Admin)
            </div>

            <button
              onClick={() => setActiveModule('admin_system')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'admin_system'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Form / Rule Builder</span>
            </button>

            <button
              onClick={() => setActiveModule('admin_users')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'admin_users'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Tài khoản & Phân quyền ABAC</span>
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
};

