/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Globe,
  User,
  Building2,
  Building,
  Newspaper,
  Menu,
  LogOut,
} from 'lucide-react';
import { UserAccount, NotificationItem } from '../../types/hnx';
import { getRoleLabel } from '../../data/roleCatalog';
import hnxLogo from '../../assets/hnx-logo.png';
import hnxLogoDark from '../../assets/hnx-logo-dark.png';
import { PORTAL_LABEL, type Portal } from '../../lib/portalRoute';

interface HeaderProps {
  activePortal: Portal;
  currentUser: UserAccount;
  notifications: NotificationItem[];
  lang: 'vi' | 'en';
  setLang: (lang: 'vi' | 'en') => void;
  /** Mở drawer menu trên mobile; ẩn ở cổng công khai vì không có sidebar. */
  onOpenMenu?: () => void;
  /** Chỉ truyền ở cổng IMS — hai cổng còn lại không có phiên đăng nhập để thoát. */
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePortal,
  currentUser,
  notifications,
  lang,
  setLang,
  onOpenMenu,
  onLogout,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = (notifications || []).filter((n) => !n.readAt).length;

  /**
   * Chuông thông báo và danh tính người dùng chỉ có nghĩa khi đã đăng nhập. ICDS
   * và Corporate News vào tự do nên không có "người dùng hiện tại" để hiển thị —
   * hiện ra sẽ là thông tin bịa.
   */
  const isAuthenticatedPortal = activePortal === 'internal';

  /**
   * Header SANG cho /ims theo bang mau Figma; ICDS va Corporate News giu nguyen
   * header toi.
   *
   * Gom toan bo khac biet vao mot bang thay vi rac dieu kien khap JSX: nhanh
   * `else` ben duoi la chuoi class cu nguyen van, nen doc la thay ngay hai cong
   * kia khong doi mot ky tu nao.
   *
   * Logo phai DOI ANH, khong chi doi mau nen: `hnx-logo.png` la chu TRANG tren
   * nen trong suot, dat len header trang la mat han chu. `hnx-logo-dark.png` la
   * cung anh do da to mau, dung duoc tren nen sang.
   */
  const isInternal = activePortal === 'internal';

  const hd = isInternal
    ? {
        logoSrc: hnxLogoDark,
        shell: 'bg-white text-[#292929] border-b border-slate-200 sticky top-0 z-40 shadow-sm',
        menuBtn:
          'md:hidden p-2 -ml-2 rounded-sm text-[#525252] hover:text-[#292929] hover:bg-slate-100',
        chip:
          'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#E6F4EA] border border-[#008A4B]/30',
        chipIcon: 'h-3.5 w-3.5 text-[#008A4B]',
        chipText: 'text-xs font-bold uppercase tracking-wider text-[#00733E]',
        langBtn:
          'inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm bg-white hover:bg-slate-100 text-xs font-bold text-[#292929] border border-slate-300 uppercase tracking-widest',
        langIcon: 'h-3.5 w-3.5 text-[#008A4B]',
        bellBtn:
          'p-2 rounded-sm bg-white hover:bg-slate-100 text-[#525252] hover:text-[#292929] relative border border-slate-300',
        unread:
          'absolute -top-1 -right-1 bg-[#008A4B] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse',
        userChip:
          'flex items-center space-x-2 px-3 py-1.5 rounded-sm bg-slate-50 border border-slate-300 text-xs',
        userAvatar:
          'w-6 h-6 rounded-sm bg-[#E6F4EA] border border-[#008A4B]/40 flex items-center justify-center shrink-0',
        userAvatarIcon: 'h-3.5 w-3.5 text-[#008A4B]',
        userName: 'font-semibold text-[#292929] truncate max-w-[130px]',
        userRole: 'text-[10px] text-[#525252] truncate max-w-[130px]',
        logoutBtn:
          'p-2 rounded-sm bg-white hover:bg-[#802423]/10 text-[#525252] hover:text-[#802423] border border-slate-300',
        mobileBar:
          'flex md:hidden items-center justify-center gap-2 py-2 border-t border-slate-200',
        mobileIcon: 'h-3 w-3 text-[#008A4B]',
        mobileText: 'text-[11px] font-bold uppercase tracking-wider text-[#00733E]',
      }
    : {
        logoSrc: hnxLogo,
        shell: 'bg-hnx-header text-white border-b border-emerald-900/60 sticky top-0 z-40 shadow-md',
        menuBtn:
          'md:hidden p-2 -ml-2 rounded-sm text-emerald-300 hover:text-white hover:bg-emerald-900/60',
        chip:
          'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-950/70 border border-emerald-800/70',
        chipIcon: 'h-3.5 w-3.5 text-emerald-300',
        chipText: 'text-xs font-bold uppercase tracking-wider text-emerald-100',
        langBtn:
          'inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm bg-emerald-950 hover:bg-emerald-900 text-xs font-bold text-emerald-100 border border-emerald-800 uppercase tracking-widest',
        langIcon: 'h-3.5 w-3.5 text-[#6FAE55]',
        bellBtn:
          'p-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white relative border border-slate-700',
        unread:
          'absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse',
        userChip:
          'flex items-center space-x-2 px-3 py-1.5 rounded-sm bg-slate-800 border border-slate-700 text-xs',
        userAvatar:
          'w-6 h-6 rounded-sm bg-indigo-600/30 border border-indigo-500 flex items-center justify-center shrink-0',
        userAvatarIcon: 'h-3.5 w-3.5 text-indigo-400',
        userName: 'font-semibold text-white truncate max-w-[130px]',
        userRole: 'text-[10px] text-slate-400 truncate max-w-[130px]',
        logoutBtn:
          'p-2 rounded-sm bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white border border-slate-700',
        mobileBar:
          'flex md:hidden items-center justify-center gap-2 py-2 border-t border-slate-800',
        mobileIcon: 'h-3 w-3 text-emerald-300',
        mobileText: 'text-[11px] font-bold uppercase tracking-wider text-emerald-100',
      };

  const PortalIcon =
    activePortal === 'internal' ? Building : activePortal === 'corporate' ? Building2 : Newspaper;

  return (
    <header className={hd.shell}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Geometric Balance Logo & Title */}
          <div className="flex items-center space-x-3">
            {onOpenMenu && activePortal !== 'public' && (
              <button
                onClick={onOpenMenu}
                aria-label="Mở menu chức năng"
                className={hd.menuBtn}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            {/*
              Logo chính thức HNX. Ảnh là chữ trắng trên nền trong suốt nên chỉ đọc
              được trên nền tối — header dùng `bg-hnx-header` (#0d2107), đừng đặt
              logo này lên nền sáng mà không đổi sang bản màu.

              Bản thân logo đã mang tên hệ thống song ngữ, nên khối chữ
              "IMS/ICDS + mô tả" trước đây bị bỏ đi để tránh lặp.
            */}
            <img
              src={hd.logoSrc}
              alt="Sở Giao dịch Chứng khoán Hà Nội — Hanoi Stock Exchange"
              /* Logo tỉ lệ 5:1, nên chiều cao quyết định chiều rộng: 24px→121px,
                 32px→162px, 36px→182px. Trên mobile còn nút menu bên trái và 3 nút
                 bên phải, nên phải hạ xuống 24px mới đủ chỗ trên máy 375px. */
              className="h-6 sm:h-8 md:h-9 w-auto shrink-0"
            />
          </div>

          {/*
            Tên cổng đang mở — thay cho bộ tab chuyển cổng trước đây.

            Ba cổng giờ là ba địa chỉ riêng (/ims, /icds, /hnxcns) chứ không phải
            ba tab của cùng một trang, nên header chỉ cho biết đang ở đâu, không
            còn là chỗ nhảy qua lại. Ai cần cổng khác thì mở đúng địa chỉ của nó.
          */}
          <div className={hd.chip}>
            <PortalIcon className={hd.chipIcon} />
            <span className={hd.chipText}>
              {PORTAL_LABEL[activePortal]}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className={hd.langBtn}
              title="Chuyển đổi ngôn ngữ VI / EN"
            >
              <Globe className={hd.langIcon} />
              <span>{lang}</span>
            </button>

            {/* Notifications Bell — chỉ ở cổng có đăng nhập (FR-030) */}
            <div className={`relative ${isAuthenticatedPortal ? '' : 'hidden'}`}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className={hd.bellBtn}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className={hd.unread}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-2xl border border-slate-200 text-slate-900 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-900 text-white font-bold text-xs flex justify-between items-center uppercase tracking-wider">
                    <span>Thông báo & Cảnh báo (FR-030)</span>
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-sm text-[10px]">
                      {unreadCount} mới
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isHighPriority =
                          n.priority === 'HIGH' ||
                          n.subject.includes('CẢNH BÁO') ||
                          n.subject.includes('HẠN NỘP') ||
                          n.subject.includes('QUÁ HẠN');

                        return (
                          <div
                            key={n.id}
                            className={`p-3 text-xs space-y-1 transition-colors ${
                              isHighPriority
                                ? 'bg-red-50/90 hover:bg-red-100/90 border-l-4 border-l-red-600'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="font-semibold text-slate-900 flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-1.5">
                                {isHighPriority && (
                                  <span className="shrink-0 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-extrabold uppercase rounded-xs">
                                    GẤP
                                  </span>
                                )}
                                <span className={isHighPriority ? 'text-red-950 font-bold' : 'text-slate-900'}>
                                  {n.subject}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <p className={isHighPriority ? 'text-red-900 text-[11px] line-clamp-2' : 'text-slate-600 text-[11px] line-clamp-2'}>
                              {n.body}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/*
              Danh tính người đang đăng nhập — chỉ hiện ở IMS.

              Dropdown đổi persona trước đây bị bỏ: nó cho phép nhảy qua lại giữa
              tài khoản nội bộ và tài khoản doanh nghiệp, điều không còn nghĩa lý
              khi ICDS đã tách thành cổng riêng vào tự do. Muốn đổi vai trò thì
              đăng xuất rồi đăng nhập lại bằng tài khoản khác — đúng như hệ thống
              thật vận hành.
            */}
            {isAuthenticatedPortal && (
              <div className={hd.userChip}>
                <div className={hd.userAvatar}>
                  <User className={hd.userAvatarIcon} />
                </div>
                <div className="text-left hidden sm:block">
                  <div className={hd.userName}>
                    {currentUser.fullName}
                  </div>
                  <div className={hd.userRole}>
                    {getRoleLabel(currentUser.roleCode)}
                  </div>
                </div>
              </div>
            )}

            {isAuthenticatedPortal && onLogout && (
              <button
                onClick={onLogout}
                title="Đăng xuất khỏi cổng nội bộ"
                className={hd.logoutBtn}
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tên cổng trên mobile — thay cho thanh chuyển cổng trước đây. */}
        <div className={hd.mobileBar}>
          <PortalIcon className={hd.mobileIcon} />
          <span className={hd.mobileText}>
            {PORTAL_LABEL[activePortal]}
          </span>
        </div>
      </div>
    </header>
  );
};

