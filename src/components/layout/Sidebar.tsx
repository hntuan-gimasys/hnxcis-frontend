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
  X,
  Library,
  BookMarked,
  ListChecks,
  Table2,
  Calculator,
  Boxes,
  GitBranch,
} from 'lucide-react';
import { UserRoleCode } from '../../types/hnx';

/**
 * Menu khối quản trị metadata. Khai báo dạng dữ liệu thay vì tám khối JSX lặp
 * nhau: tám mục này chỉ khác nhau ở mã, nhãn và icon, nên viết tay tám lần chỉ
 * tạo thêm tám chỗ để lệch class khi sửa giao diện.
 *
 * Mã phải giữ tiền tố `meta_` — App.tsx định tuyến theo tiền tố này.
 */
const METADATA_NAV = [
  { code: 'meta_catalogs', label: 'Danh mục dùng chung (FR-045)', Icon: Library },
  { code: 'meta_dictionary', label: 'Từ điển dữ liệu (FR-052)', Icon: BookMarked },
  { code: 'meta_holidays', label: 'Ngày nghỉ & làm bù (FR-053)', Icon: CalendarDays },
  { code: 'meta_fields', label: 'Khai báo trường CBTT (FR-046)', Icon: ListChecks },
  { code: 'meta_template_fields', label: 'Trường trong mẫu (FR-048)', Icon: Table2 },
  { code: 'meta_fs_templates', label: 'Mẫu báo cáo tài chính (FR-049)', Icon: Calculator },
  { code: 'meta_datastruct', label: 'Cấu trúc dữ liệu (FR-050,051)', Icon: Boxes },
  { code: 'meta_workflows', label: 'Khai báo Workflow (FR-054)', Icon: GitBranch },
] as const;

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  userRole: UserRoleCode;
  activePortal: 'internal' | 'corporate' | 'public';
  /** Drawer trên mobile: dưới md sidebar không nằm trong luồng trang. */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  userRole,
  activePortal,
  mobileOpen = false,
  onCloseMobile,
}) => {
  if (activePortal === 'public') {
    return null;
  }

  /**
   * Chọn menu xong thì đóng drawer, nếu không người dùng mobile phải tự đóng mới
   * thấy được nội dung vừa chọn.
   */
  const pickModule = (moduleCode: string) => {
    setActiveModule(moduleCode);
    onCloseMobile?.();
  };

  /**
   * Dưới md: drawer trượt từ trái, có lớp phủ. Từ md trở lên: cột tĩnh như cũ.
   * Trước đây sidebar để `hidden md:block` nên trên điện thoại không có menu
   * module nào — lãnh đạo P.TTTT không thể vào hàng đợi duyệt tin bằng điện thoại.
   */
  const asideClass = [
    'w-64 bg-hnx-sidebar text-emerald-100 border-r border-emerald-900/60 shrink-0',
    'fixed inset-y-0 left-0 z-50 overflow-y-auto transition-transform duration-200',
    mobileOpen ? 'translate-x-0' : '-translate-x-full',
    'md:static md:translate-x-0 md:z-auto md:overflow-visible',
  ].join(' ');

  const backdrop = mobileOpen ? (
    <div
      onClick={onCloseMobile}
      className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
      aria-hidden="true"
    />
  ) : null;

  if (activePortal === 'corporate') {
    return (
      <>
      {backdrop}
      <aside className={asideClass}>
        <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ICDS — Tiếp nhận Tin Công bố
            </div>
            <div className="text-sm font-bold text-white mt-1">Vinamilk (VNM)</div>
          </div>
          <button
            onClick={onCloseMobile}
            aria-label="Đóng menu"
            className="md:hidden p-1 text-slate-400 hover:text-white shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="p-3 space-y-1.5 text-xs">
          <button
            onClick={() => pickModule('corp_dashboard')}
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
            onClick={() => pickModule('corp_filing')}
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
            onClick={() => pickModule('corp_history')}
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
      </>
    );
  }

  // Internal HNX Portal
  const isSysAdmin = userRole === 'ROLE_SYS_ADMIN' || userRole === 'ROLE_BIZ_ADMIN';
  const isQLNY = userRole.includes('QLNY') || isSysAdmin || userRole === 'ROLE_HNX_EXEC';
  const isTTTP = userRole.includes('TTTP') || isSysAdmin || userRole === 'ROLE_HNX_EXEC';
  const isTTTT = userRole.includes('TTTT') || isSysAdmin || userRole === 'ROLE_HNX_EXEC';

  // P.CNTT vận hành hệ thống, không xử lý nghiệp vụ niêm yết / CBTT. Lãnh đạo
  // P.CNTT xem được màn hình quản trị nhưng ở chế độ chỉ đọc (xem AdminModule).
  const isCNTTManager = userRole === 'ROLE_CNTT_MANAGER';
  const canSeeAdmin = isSysAdmin || isCNTTManager;

  return (
    <>
    {backdrop}
    <aside className={asideClass}>
      <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            IMS — Quản lý &amp; Khai thác thông tin
          </div>
          <div className="text-sm font-bold text-white mt-1">Cổng Nội bộ HNX</div>
        </div>
        <button
          onClick={onCloseMobile}
          aria-label="Đóng menu"
          className="md:hidden p-1 text-slate-400 hover:text-white shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="p-3 space-y-6 text-xs overflow-y-auto max-h-[calc(100vh-5rem)]">
        {/* General Overview */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Tổng quan & Khai thác
          </div>

          <button
            onClick={() => pickModule('dashboard')}
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
            onClick={() => pickModule('ai_center')}
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
              onClick={() => pickModule('qlny_equities')}
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
              onClick={() => pickModule('qlny_dossiers')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'qlny_dossiers'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Hồ sơ ĐKGD &amp; Mẫu 01–06 (FR-006)</span>
            </button>

            <button
              onClick={() => pickModule('qlny_status_control')}
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
              onClick={() => pickModule('qlny_delisting')}
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
              onClick={() => pickModule('qlny_fees')}
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
              onClick={() => pickModule('qlny_corp_actions')}
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
              onClick={() => pickModule('tttp_bonds')}
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
              onClick={() => pickModule('tttp_green_bonds')}
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
              onClick={() => pickModule('tttt_inbox')}
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
              onClick={() => pickModule('tttt_violations')}
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
              onClick={() => pickModule('tttt_display_config')}
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
        {canSeeAdmin && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              {isCNTTManager ? 'Quản trị Hệ thống (Chỉ đọc)' : 'Quản trị Hệ thống (Admin)'}
            </div>

            <button
              onClick={() => pickModule('admin_system')}
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
              onClick={() => pickModule('admin_templates')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                activeModule === 'admin_templates'
                  ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Cấu hình Mẫu báo cáo (FR-047)</span>
            </button>

            <button
              onClick={() => pickModule('admin_users')}
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

        {/*
          Quản trị Metadata — tầng 0-1 của bản đồ phụ thuộc PRD §3.4.
          Tách khỏi nhóm "Quản trị Hệ thống" ở trên vì đây là cấu hình nghiệp vụ
          (danh mục, trường, mẫu, quy trình), không phải vận hành hệ thống. Toàn bộ
          nghiệp vụ phía sau chỉ chạy đúng khi khối này được khai báo trước.
        */}
        {canSeeAdmin && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Quản trị Metadata
            </div>

            {METADATA_NAV.map(({ code, label, Icon }) => (
              <button
                key={code}
                onClick={() => pickModule(code)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-sm font-semibold transition-all ${
                  activeModule === code
                    ? 'bg-indigo-600 text-white font-bold border-l-4 border-white shadow-xs'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-left leading-tight">{label}</span>
              </button>
            ))}
          </div>
        )}
      </nav>
    </aside>
    </>
  );
};

