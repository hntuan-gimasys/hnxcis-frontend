/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { UserAccount } from '../../types/hnx';
import { getRoleLabel } from '../../data/roleCatalog';
import hnxLogoDark from '../../assets/hnx-logo-dark.png';

interface NavItem {
  label: string;
  children?: string[];
}

/**
 * Mục lục điều hướng của trang chủ HNX thật (NIÊM YẾT, UPCOM...). Trang tin
 * công khai của hệ thống này chỉ có một trang duy nhất — các mục con ở đây là
 * trang trí cho đúng bố cục tham chiếu, KHÔNG điều hướng đi đâu (không có
 * href/onClick thật) vì các khu vực đó chưa tồn tại trong ứng dụng.
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'TRANG CHỦ' },
  { label: 'NIÊM YẾT', children: ['Cổ phiếu niêm yết', 'Trái phiếu niêm yết', 'Chỉ số HNX', 'Thống kê giao dịch'] },
  { label: 'UPCOM', children: ['Cổ phiếu UPCoM', 'Thống kê UPCoM'] },
  { label: 'KHỐI NGHIỆP', children: ['Đăng ký giao dịch', 'Hồ sơ doanh nghiệp khởi nghiệp'] },
  { label: 'TPDNNY', children: ['Trái phiếu DN niêm yết', 'Thống kê trái phiếu niêm yết'] },
  { label: 'TPDNRL', children: ['Trái phiếu DN riêng lẻ', 'Công bố thông tin trái phiếu riêng lẻ'] },
  { label: 'HNX', children: ['Giới thiệu Sở GDCK Hà Nội', 'Tin tức thị trường', 'Liên hệ'] },
];

interface TickerQuote {
  code: string;
  value: string;
  change: string;
  changePct: string;
  volume: string;
  isUp: boolean;
}

/** Số liệu chỉ số minh hoạ, cố định — chưa có nguồn dữ liệu thị trường thật.
 * Danh sách đủ dài để lấp đầy chiều rộng thanh chỉ số trên màn hình lớn trước
 * khi bị lặp lại phục vụ hiệu ứng cuộn liên tục (xem `animate-hnx-ticker`). */
const TICKER_QUOTES: TickerQuote[] = [
  { code: 'HNX', value: '96,09', change: '+0.41', changePct: '+0.43%', volume: '88.2M', isUp: true },
  { code: 'HNX39', value: '512,57', change: '-2.19', changePct: '-0.43%', volume: '67.1M', isUp: false },
  { code: 'VNINDEX', value: '1.285,59', change: '+5.56', changePct: '+0.43%', volume: '892.3M', isUp: true },
  { code: 'VN30', value: '1.342,47', change: '-1.20', changePct: '-0.09%', volume: '534.7M', isUp: false },
  { code: 'VNXALL', value: '1.156,90', change: '+3.78', changePct: '+0.33%', volume: '1.02B', isUp: true },
  { code: 'USD', value: '25.480,46', change: '+38', changePct: '+0.15%', volume: '', isUp: true },
  { code: 'VNM', value: '86,50', change: '+0.90', changePct: '+1.05%', volume: '4.2M', isUp: true },
  { code: 'HPG', value: '28,35', change: '-0.15', changePct: '-0.53%', volume: '18.6M', isUp: false },
  { code: 'VIC', value: '45,80', change: '+1.20', changePct: '+2.69%', volume: '9.1M', isUp: true },
  { code: 'ALPH', value: '12,40', change: '+0.05', changePct: '+0.40%', volume: '1.8M', isUp: true },
  { code: 'BOG', value: '19,70', change: '-0.30', changePct: '-1.50%', volume: '2.5M', isUp: false },
  { code: 'GOLD (SJC)', value: '89.500,00', change: '+120', changePct: '+0.13%', volume: '', isUp: true },
];

interface PublicNewsHeaderProps {
  currentUser: UserAccount;
  onLogout: () => void;
}

export const PublicNewsHeader: React.FC<PublicNewsHeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="bg-white text-slate-900 sticky top-0 z-40 shadow-md">
      {/* Row 1 — logo, menu chính, tài khoản */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6 min-w-0">
            <img
              src={hnxLogoDark}
              alt="Sở Giao dịch Chứng khoán Hà Nội — Hanoi Stock Exchange"
              className="h-7 sm:h-8 w-auto shrink-0"
            />

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="relative group">
                  <button
                    type="button"
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold tracking-wide text-slate-700 hover:text-hnx-800 hover:bg-slate-100 rounded-sm"
                  >
                    <span>{item.label}</span>
                    {item.children && <ChevronDown className="h-3 w-3" />}
                  </button>

                  {item.children && (
                    <div className="absolute left-0 top-full hidden group-hover:block pt-1 z-50">
                      <div className="w-56 bg-white text-slate-700 rounded-lg shadow-xl border border-slate-200 py-1.5 overflow-hidden">
                        {item.children.map((child) => (
                          <span
                            key={child}
                            className="block px-3.5 py-2 text-xs font-medium hover:bg-hnx-50 hover:text-hnx-800 cursor-default"
                          >
                            {child}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <button
            onClick={onLogout}
            title={`${currentUser.fullName} — ${getRoleLabel(currentUser.roleCode)} — Đăng xuất`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12573A] hover:brightness-110 text-xs font-bold text-white shadow-xs shrink-0"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline max-w-[140px] truncate">{currentUser.fullName}</span>
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2 — thanh chỉ số, cuộn liên tục từ phải sang trái. Nội dung được
          lặp lại hai lần để hiệu ứng cuộn (`animate-hnx-ticker`) khớp khít,
          không có điểm giật khi lặp lại vòng. */}
      <div className="bg-[#093B26] overflow-hidden py-1.5">
        <div className="flex items-center gap-6 w-max animate-hnx-ticker text-[11px] font-semibold whitespace-nowrap">
          {[...TICKER_QUOTES, ...TICKER_QUOTES].map((q, i) => (
            <div key={`${q.code}-${i}`} className="flex items-center gap-1.5 shrink-0">
              <span className="text-emerald-200 font-extrabold">{q.code}</span>
              <span className="text-white">{q.value}</span>
              <span className={q.isUp ? 'text-emerald-400' : 'text-rose-400'}>
                {q.isUp ? '▲' : '▼'}{q.change} ({q.changePct})
              </span>
              {q.volume && <span className="text-emerald-300/70">Vol: {q.volume}</span>}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};
