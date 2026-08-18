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
  ChevronDown,
  Menu,
} from 'lucide-react';
import { UserAccount, NotificationItem } from '../../types/hnx';
import { getRoleLabel } from '../../data/roleCatalog';
import hnxLogo from '../../assets/hnx-logo.png';

interface HeaderProps {
  activePortal: 'internal' | 'corporate' | 'public';
  setActivePortal: (portal: 'internal' | 'corporate' | 'public') => void;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  notifications: NotificationItem[];
  lang: 'vi' | 'en';
  setLang: (lang: 'vi' | 'en') => void;
  /** Mở drawer menu trên mobile; ẩn ở cổng công khai vì không có sidebar. */
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePortal,
  setActivePortal,
  currentUser,
  allUsers,
  onSelectUser,
  notifications,
  lang,
  setLang,
  onOpenMenu,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = (notifications || []).filter((n) => !n.readAt).length;

  return (
    <header className="bg-hnx-header text-white border-b border-emerald-900/60 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Geometric Balance Logo & Title */}
          <div className="flex items-center space-x-3">
            {onOpenMenu && activePortal !== 'public' && (
              <button
                onClick={onOpenMenu}
                aria-label="Mở menu chức năng"
                className="md:hidden p-2 -ml-2 rounded-sm text-emerald-300 hover:text-white hover:bg-emerald-900/60"
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
              src={hnxLogo}
              alt="Sở Giao dịch Chứng khoán Hà Nội — Hanoi Stock Exchange"
              /* Logo tỉ lệ 5:1, nên chiều cao quyết định chiều rộng: 24px→121px,
                 32px→162px, 36px→182px. Trên mobile còn nút menu bên trái và 3 nút
                 bên phải, nên phải hạ xuống 24px mới đủ chỗ trên máy 375px. */
              className="h-6 sm:h-8 md:h-9 w-auto shrink-0"
            />
          </div>

          {/* Geometric Portal Switcher Tabs */}
          <div className="hidden md:flex items-center space-x-1 bg-emerald-950/90 p-1 rounded-md border border-emerald-800/80">
            <button
              onClick={() => setActivePortal('internal')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                activePortal === 'internal'
                  ? 'bg-hnx-gradient text-white shadow-sm border-l-2 border-emerald-200'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>IMS · Cổng Nội bộ</span>
            </button>

            <button
              onClick={() => setActivePortal('corporate')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                activePortal === 'corporate'
                  ? 'bg-hnx-gradient text-white shadow-sm border-l-2 border-emerald-200'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>ICDS · Cổng Doanh nghiệp</span>
            </button>

            <button
              onClick={() => setActivePortal('public')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                activePortal === 'public'
                  ? 'bg-hnx-gradient text-white shadow-sm border-l-2 border-emerald-200'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>Corporate News</span>
            </button>
          </div>

          {/* Actions & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm bg-emerald-950 hover:bg-emerald-900 text-xs font-bold text-emerald-100 border border-emerald-800 uppercase tracking-widest"
              title="Chuyển đổi ngôn ngữ VI / EN"
            >
              <Globe className="h-3.5 w-3.5 text-[#6FAE55]" />
              <span>{lang}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white relative border border-slate-700"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-2xl border border-slate-200 text-slate-900 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-900 text-white font-bold text-xs flex justify-between items-center uppercase tracking-wider">
                    <span>Thông báo & Cảnh báo System</span>
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

            {/* User Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs"
              >
                <div className="w-6 h-6 rounded-sm bg-indigo-600/30 border border-indigo-500 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-white truncate max-w-[130px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {getRoleLabel(currentUser.roleCode)}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-2xl border border-slate-200 text-slate-900 z-50 p-2 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">
                    Chuyển tài khoản thử nghiệm (Personas)
                  </div>
                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-sm text-xs flex flex-col transition-colors ${
                        currentUser.id === user.id
                          ? 'bg-indigo-50 text-indigo-900 font-semibold border-l-2 border-indigo-600'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-medium text-slate-900">{user.fullName}</span>
                      <span className="text-[10px] text-slate-600">{getRoleLabel(user.roleCode)}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{user.roleCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Portal Switcher Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActivePortal('internal')}
            className={`px-3 py-1 rounded-sm font-bold uppercase tracking-wider text-[11px] ${
              activePortal === 'internal' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            IMS · Nội bộ
          </button>
          <button
            onClick={() => setActivePortal('corporate')}
            className={`px-3 py-1 rounded-sm font-bold uppercase tracking-wider text-[11px] ${
              activePortal === 'corporate' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            ICDS · Cổng DN
          </button>
          <button
            onClick={() => setActivePortal('public')}
            className={`px-3 py-1 rounded-sm font-bold uppercase tracking-wider text-[11px] ${
              activePortal === 'public' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            News
          </button>
        </div>
      </div>
    </header>
  );
};

