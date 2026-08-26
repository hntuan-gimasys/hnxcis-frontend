/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  UserPlus,
  ShieldCheck,
  Filter,
  Lock,
  Building2,
  Scale,
  Gavel,
  ShieldOff,
  Users2,
  PieChart,
  Landmark,
  Scissors,
  SlidersHorizontal,
  Newspaper,
  FileCheck2,
  EyeOff,
  BarChart3,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Globe,
  Map,
  MapPin,
  Network,
  IdCard,
  Briefcase,
} from 'lucide-react';

/** Nhóm menu khai báo bằng dữ liệu; `Icon` là component nên viết hoa đầu. */
interface NavItem {
  readonly code: string;
  readonly label: string;
  readonly Icon: React.ComponentType<{ className?: string }>;
}
import { UserRoleCode } from '../../types/hnx';
import { IMS_USE_CASES } from '../../lib/imsRoutes';

/**
 * Icon cho bảy chức năng có SRS ở khối "Quản lý Danh mục" của cổng IMS.
 *
 * Nhãn, mã UC và đường dẫn nằm ở `lib/imsRoutes.ts` — đó là dữ liệu định tuyến,
 * dùng chung với App.tsx và portalRoute.ts. Chỉ riêng icon ở lại đây vì nó là
 * chuyện của giao diện, và `lib/` không nên phụ thuộc vào lucide-react.
 */
const IMS_USE_CASE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  uc_ims_002: Globe,
  uc_ims_003: Map,
  uc_ims_004: MapPin,
  uc_ims_006: Network,
  uc_hnx_srs: IdCard,
  uc_ims_008: Briefcase,
  uc_ims_015: BookMarked,
};

/**
 * Menu cũ của cổng IMS — tạm ẩn, không xoá.
 *
 * Giai đoạn này sidebar /ims chỉ hiển thị các chức năng đã có SRS trong
 * `docs/srs/`. Toàn bộ khối menu dựng theo PRD trước đây (Dashboard, P.QLNY,
 * P.TTTP, P.TTTT, Metadata, Access...) cùng các màn hình phía sau vẫn còn nguyên
 * trong repo; bật lại cờ này là menu cũ hiện lại đầy đủ. Xoá hẳn sẽ làm mất
 * đường vào hàng chục màn hình đã dựng xong mà chưa có gì thay thế.
 *
 * KHÔNG ảnh hưởng /icds và /news: hai cổng đó có nhánh render riêng phía trên.
 */
const SHOW_LEGACY_IMS_NAV = false;

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

/** Giám sát & xử lý trạng thái niêm yết — P.QLNY. */
const SURVEILLANCE_NAV = [
  { code: 'surv_status_cases', label: 'Thẩm định & Xử lý trạng thái (FR-004,005,009,012,013)', Icon: Scale },
  { code: 'surv_violations', label: 'Vi phạm giao dịch (FR-007)', Icon: Gavel },
  { code: 'surv_margin', label: 'Danh sách KKQ (FR-014,015)', Icon: ShieldOff },
] as const;

/** Nhà đầu tư & sở hữu chứng khoán — dùng chung Niêm yết và Trái phiếu. */
const OWNERSHIP_NAV = [
  { code: 'own_investors', label: 'Nhà đầu tư & NCLQ (FR-026)', Icon: Users2 },
  { code: 'own_holdings', label: 'Sở hữu chứng khoán (FR-003)', Icon: PieChart },
] as const;

/** Trái phiếu — phần bổ sung ngoài FR-020/021 đã có ở BondModule. */
const BOND_EXTRA_NAV = [
  { code: 'bond_listed', label: 'Trái phiếu niêm yết (FR-002)', Icon: Landmark },
  { code: 'bond_cancel', label: 'Hủy ĐKGD trái phiếu (FR-022)', Icon: Scissors },
  { code: 'bond_adjust', label: 'Điều chỉnh số lượng ĐKGD (FR-024)', Icon: SlidersHorizontal },
] as const;

/** Công bố thông tin — phần bổ sung ngoài FR-039/041/042 đã có ở DisclosureModule. */
const CBTT_NAV = [
  { code: 'cbtt_types', label: 'Các loại CBTT (FR-033→038)', Icon: Newspaper },
  { code: 'cbtt_report_approval', label: 'Phê duyệt báo cáo (FR-040)', Icon: FileCheck2 },
  { code: 'cbtt_control', label: 'Kiểm soát Corp News (FR-016)', Icon: EyeOff },
] as const;

/** Báo cáo khai thác và khảo sát. */
const REPORT_NAV = [
  { code: 'report_qlny', label: 'Báo cáo P.Niêm yết (FR-019)', Icon: BarChart3 },
  { code: 'report_tttp', label: 'Báo cáo P.Trái phiếu (FR-025)', Icon: BarChart3 },
  { code: 'survey_defs', label: 'Khai báo khảo sát (FR-028)', Icon: ClipboardList },
  { code: 'survey_results', label: 'Kết quả khảo sát (FR-029)', Icon: PieChart },
] as const;

/** Khối tài khoản – phân quyền – bảo mật. Tiền tố `access_` do App.tsx định tuyến. */
const ACCESS_NAV = [
  { code: 'access_requests', label: 'Đăng ký tài khoản (FR-055)', Icon: UserPlus },
  { code: 'access_permissions', label: 'Phân quyền chức năng (FR-057)', Icon: ShieldCheck },
  { code: 'access_datascope', label: 'Phân quyền dữ liệu (FR-058,044)', Icon: Filter },
  { code: 'access_security', label: 'Bảo mật & Đăng nhập (FR-059,060)', Icon: Lock },
  { code: 'access_orgs', label: 'Hồ sơ tổ chức (FR-061)', Icon: Building2 },
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
  /**
   * Nhóm "Quản lý Danh mục" mở sẵn — đó là toàn bộ nội dung menu /ims hiện tại,
   * mở sẵn để người dùng không phải bấm thêm một lần mới thấy chức năng nào.
   *
   * Hook phải đứng trước nhánh `return null` bên dưới: sidebar bị bỏ render ở
   * cổng public, nếu khai báo state sau đó thì số hook sẽ lệch khi đổi cổng.
   */
  const [catalogOpen, setCatalogOpen] = useState(true);

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

  /**
   * Nhóm menu khai báo bằng dữ liệu. Mười ba mục mới đều chỉ khác nhau ở mã,
   * nhãn và icon — dựng bằng JSX lặp tay sẽ tạo mười ba chỗ để lệch class khi
   * sửa giao diện, và đã có sẵn một lần lệch như vậy trong file này trước đây.
   */
  const NavGroup: React.FC<{ title: string; items: readonly NavItem[] }> = ({ title, items }) => (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">{title}</div>
      {items.map(({ code, label, Icon }) => (
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
  );

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
        {/*
          Khối chức năng đã có SRS (docs/srs/) — cấu trúc menu lấy theo file mẫu
          docs/quan-ly-danh-muc_2.html: một nhãn nhóm không bấm được ("Quản lý hệ
          thống"), một nhóm con gập/mở ("Quản lý Danh mục"), rồi các mục con thụt
          vào có dấu tròn dẫn.

          Mỗi mục là một URL thật (`/ims/<ma-uc>`); App.tsx đẩy đường dẫn khi
          `activeModule` đổi, nên bấm menu là địa chỉ trên thanh URL đổi theo và
          copy link gửi cho người khác vẫn mở đúng màn hình.
        */}
        <div className="space-y-0.5">
          <div className="flex select-none items-center gap-2 rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-white/90">
            <Settings className="h-4 w-4 shrink-0 opacity-90" />
            <span>Quản lý hệ thống</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-90" />
          </div>

          <button
            type="button"
            onClick={() => setCatalogOpen((open) => !open)}
            aria-expanded={catalogOpen}
            className="flex w-full items-center gap-2 rounded-lg py-2 pr-2.5 pl-5 text-[13px] font-medium text-white/95 hover:bg-white/[0.06]"
          >
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current opacity-85" />
            <span>Quản lý Danh mục</span>
            {catalogOpen ? (
              <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 opacity-85" />
            ) : (
              <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-85" />
            )}
          </button>

          {catalogOpen && (
            <div className="mt-0.5 mb-2 pl-3.5">
              {IMS_USE_CASES.map((uc) => {
                const Icon = IMS_USE_CASE_ICONS[uc.code] ?? Library;
                return (
                  <button
                    key={uc.code}
                    onClick={() => pickModule(uc.code)}
                    title={`${uc.ucCode} — ${uc.label}`}
                    className={`my-px flex w-full items-center gap-2.5 rounded-lg py-2 pr-2.5 pl-5 text-left text-[13px] transition-colors ${
                      activeModule === uc.code
                        ? 'bg-white/[0.16] font-medium text-white'
                        : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current opacity-70" />
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="leading-tight">{uc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {SHOW_LEGACY_IMS_NAV && (
          <>
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

        {isQLNY && <NavGroup title="Giám sát & Xử lý trạng thái" items={SURVEILLANCE_NAV} />}

        {(isQLNY || isTTTP) && <NavGroup title="Nhà đầu tư & Sở hữu" items={OWNERSHIP_NAV} />}

        {isTTTP && <NavGroup title="Trái phiếu (bổ sung)" items={BOND_EXTRA_NAV} />}

        {isTTTT && <NavGroup title="Công bố thông tin (bổ sung)" items={CBTT_NAV} />}

        {(isQLNY || isTTTP || isTTTT) && <NavGroup title="Báo cáo & Khảo sát" items={REPORT_NAV} />}

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

        {canSeeAdmin && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Tài khoản &amp; Bảo mật
            </div>

            {ACCESS_NAV.map(({ code, label, Icon }) => (
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
          </>
        )}
      </nav>
    </aside>
    </>
  );
};

