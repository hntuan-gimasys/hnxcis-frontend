/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Building2,
  SlidersHorizontal,
  Calendar,
  Download,
  Eye,
  Award,
} from 'lucide-react';
import {
  Organization,
  SecurityItem,
  Submission,
} from '../../types/hnx';
import { StatusBadge } from '../common/StatusBadge';
import { INITIAL_CATALOGS } from '../../data/mockData';
import hnxLogo from '../../assets/hnx-logo.png';

interface PublicCorporateNewsProps {
  organizations: Organization[];
  securities: SecurityItem[];
  submissions: Submission[];
  lang: 'vi' | 'en';
}

interface NewsTab {
  key: string;
  label: string;
  /** Không có trường "loại tin" nào khớp thẳng cả 6 tab tham chiếu — kết hợp
   * `newsGroupCode` sẵn có với vài từ khoá trong tiêu đề thay vì thêm field mới. */
  match: (sub: Submission) => boolean;
}

const NEWS_TABS: NewsTab[] = [
  { key: 'today', label: 'Tin trong ngày', match: () => true },
  { key: 'fs', label: 'Báo cáo tài chính', match: (s) => s.newsGroupCode === 'PERIODIC' },
  { key: 'dividend', label: 'Trả cổ tức', match: (s) => s.titleVi.toLowerCase().includes('cổ tức') },
  {
    key: 'agm',
    label: 'Đại hội cổ đông',
    match: (s) => s.titleVi.toLowerCase().includes('đại hội'),
  },
  {
    key: 'bond_issue',
    label: 'Phát hành trái phiếu',
    match: (s) => s.newsGroupCode === 'BOND' && s.titleVi.toLowerCase().includes('phát hành'),
  },
  {
    key: 'bond_payment',
    label: 'Thanh toán trái phiếu',
    match: (s) => s.newsGroupCode === 'BOND' && s.titleVi.toLowerCase().includes('thanh toán'),
  },
];

/** Nhãn ngành nghề hiển thị dưới tên doanh nghiệp — đọc lại danh mục ngành đã
 * có (`INITIAL_CATALOGS`) qua `organization.industryCode`, không phải field mới. */
function industryLabel(org: Organization | undefined, lang: 'vi' | 'en'): string {
  if (!org) return '';
  const entry = INITIAL_CATALOGS.find(
    (c) => c.catalogCode === 'INDUSTRY' && c.code === org.industryCode
  );
  if (!entry) return '';
  return lang === 'en' && entry.nameEn ? entry.nameEn : entry.nameVi;
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getFullYear()
  ).slice(-2)}`;
}

export const PublicCorporateNews: React.FC<PublicCorporateNewsProps> = ({
  organizations,
  securities,
  submissions,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<string>(NEWS_TABS[0].key);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Chỉ hiện tin đã công bố công khai (FR-066 / §8.3): PUBLISHED + isPublic + chưa bị ẩn.
  const publicSubmissions = (submissions || []).filter(
    (s) => s.status === 'PUBLISHED' && s.isPublic && !s.hiddenAt
  );

  const activeTabDef = NEWS_TABS.find((t) => t.key === activeTab) ?? NEWS_TABS[0];

  const filteredSubmissions = publicSubmissions
    .filter(activeTabDef.match)
    .filter((sub) => {
      const org = organizations.find((o) => o.id === sub.organizationId);
      const sec = securities.find((s) => s.id === sub.securityId);

      if (selectedBoard !== 'ALL' && sec && sec.board !== selectedBoard) return false;
      if (selectedGroup !== 'ALL' && sub.newsGroupCode !== selectedGroup) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchTitle = sub.titleVi.toLowerCase().includes(term);
        const matchOrg =
          org && (org.nameVi.toLowerCase().includes(term) || org.shortName.toLowerCase().includes(term));
        const matchSymbol = sec && sec.symbol.toLowerCase().includes(term);
        return matchTitle || matchOrg || matchSymbol;
      }

      return true;
    })
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 flex flex-col">
      {/* Hero + thanh tìm kiếm */}
      <div className="bg-hnx-gradient text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 border-b border-emerald-900 shadow-md">
        <div className="max-w-6xl mx-auto space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              {lang === 'vi' ? 'Tra cứu Công bố Thông tin' : 'Corporate Disclosure Lookup'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl font-medium">
              {lang === 'vi'
                ? 'Tìm kiếm theo mã chứng khoán, tên doanh nghiệp, hoặc nội dung công bố · HNX · UPCoM · Bond Market'
                : 'Search by symbol, company name, or disclosure content · HNX · UPCoM · Bond Market'}
            </p>
          </div>

          <div className="max-w-3xl space-y-2">
            <div className="flex items-stretch bg-white text-slate-900 rounded-xl shadow-lg overflow-hidden">
              <div className="hidden sm:flex items-center gap-1.5 px-4 border-r border-slate-200 text-slate-500 text-xs font-semibold shrink-0">
                <Building2 className="h-3.5 w-3.5" />
                <span>Mã CK / Công ty</span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === 'vi'
                    ? 'Nhập mã CK (vd: ACB, FPT) hoặc tên công ty...'
                    : 'Enter symbol (e.g. ACB, FPT) or company name...'
                }
                className="flex-1 min-w-0 px-3 py-3 text-sm font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className={`flex items-center gap-1.5 px-4 border-l border-slate-200 text-xs font-semibold shrink-0 ${
                  showAdvanced ? 'bg-hnx-50 text-hnx-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lọc nâng cao</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-5 bg-hnx-gradient-horizontal text-white text-xs font-bold shrink-0"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tìm kiếm</span>
              </button>
            </div>

            {showAdvanced && (
              <div className="flex flex-wrap gap-2 bg-[#123A0A]/60 border border-[#6FAE55]/40 rounded-xl p-3">
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="ALL">Tất cả Sàn (HNX, UPCoM, TPDN)</option>
                  <option value="HNX">Sàn HNX</option>
                  <option value="UPCOM">Sàn UPCoM</option>
                  <option value="PRIVATE_BOND">Trái phiếu Riêng lẻ</option>
                </select>

                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="ALL">Tất cả Nhóm Tin</option>
                  <option value="PERIODIC">Báo cáo Định kỳ (BCTC)</option>
                  <option value="EXTRAORDINARY">Tin Bất thường (24h/48h)</option>
                  <option value="BOND">Tin Trái phiếu</option>
                  <option value="TRADING">Tin Giao dịch NNB/CĐL</option>
                  <option value="OFFERING">Tin Chào bán / Phát hành</option>
                  <option value="ON_DEMAND">Tin theo yêu cầu</option>
                  <option value="HNX_NEWS">Tin từ Sở HNX</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedOrg ? (
          /* Hồ sơ doanh nghiệp + tin công bố của riêng doanh nghiệp đó */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedOrg(null)}
              className="text-xs font-semibold text-hnx-700 hover:text-hnx-900 flex items-center space-x-1"
            >
              <span>← Quay lại Danh sách Công bố Thông tin</span>
            </button>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 bg-hnx-50 text-hnx-800 font-extrabold text-sm rounded-lg border border-hnx-200">
                      {selectedOrg.shortName}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      {lang === 'vi' ? selectedOrg.nameVi : selectedOrg.nameEn || selectedOrg.nameVi}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Mã số thuế: <strong>{selectedOrg.taxCode}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Ngành: <strong>{industryLabel(selectedOrg, lang)}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Đại diện CBTT: <strong>{selectedOrg.disclosureRepName}</strong></span>
                  </div>
                </div>

                <StatusBadge status="NORMAL" type="security" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500">Vốn điều lệ</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedOrg.charterCapital.toLocaleString('vi-VN')} VND
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500">Địa chỉ Trụ sở</div>
                  <div className="font-medium text-slate-800 truncate">{selectedOrg.address}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500">Website & Email</div>
                  <div className="font-medium text-hnx-700 truncate">{selectedOrg.website}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Tin Công bố Thông tin Công khai ({selectedOrg.shortName})
              </h3>

              <div className="divide-y divide-slate-100">
                {publicSubmissions
                  .filter((s) => s.organizationId === selectedOrg.id)
                  .map((sub) => (
                    <div key={sub.id} className="py-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 bg-hnx-50 text-hnx-800 text-[10px] font-bold rounded-md mr-2">
                            {sub.newsGroupCode || 'DINH_KY'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {sub.publishedAt ? new Date(sub.publishedAt).toLocaleDateString('vi-VN') : ''}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 mt-1">
                            {lang === 'vi' ? sub.titleVi : sub.titleEn || sub.titleVi}
                          </h4>
                        </div>

                        <button
                          onClick={() => alert(`Tải xuống file BCTC/Thông báo công khai: ${sub.submissionNo}.pdf`)}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-hnx-700 bg-hnx-50 hover:bg-hnx-100 px-3 py-1.5 rounded-lg border border-hnx-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Tải PDF</span>
                        </button>
                      </div>

                      {(sub.payload || sub.contentEn) && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {lang === 'en' && sub.contentEn
                            ? sub.contentEn
                            : sub.payload?.summary_note || JSON.stringify(sub.payload)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* Danh sách Công bố Thông tin */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 pt-5">
              <h2 className="text-base font-bold text-slate-900">Danh sách Công bố Thông tin</h2>
            </div>

            <div className="flex items-center gap-2 px-5 pt-4 overflow-x-auto">
              {NEWS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-hnx-gradient-horizontal text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100" />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-bold">Thời gian</th>
                    <th className="px-3 py-3 text-left font-bold">Mã CK</th>
                    <th className="px-3 py-3 text-left font-bold">Tên rút gọn</th>
                    <th className="px-3 py-3 text-left font-bold">Tiêu đề / Nội dung</th>
                    <th className="px-5 py-3 text-right font-bold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                        Không tìm thấy tin công bố nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const org = organizations.find((o) => o.id === sub.organizationId);
                      const sec = securities.find((s) => s.id === sub.securityId);
                      const isHot = sub.newsGroupCode === 'EXTRAORDINARY';

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 align-top">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 text-xs">{formatTime(sub.publishedAt)}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {formatDate(sub.publishedAt)}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {sec && (
                              <span className="inline-block px-2 py-1 border border-slate-300 rounded-md text-xs font-bold text-slate-700">
                                {sec.symbol}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 min-w-[140px]">
                            <div className="text-xs font-bold text-slate-900">{org?.shortName}</div>
                            <div className="text-[11px] text-slate-400">{industryLabel(org, lang)}</div>
                          </td>
                          <td className="px-3 py-3 min-w-[260px]">
                            <button
                              onClick={() => org && setSelectedOrg(org)}
                              className="text-left text-xs font-semibold text-slate-800 hover:text-hnx-700"
                            >
                              {lang === 'vi' ? sub.titleVi : sub.titleEn || sub.titleVi}
                            </button>
                            {isHot && (
                              <span className="ml-2 align-middle px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-extrabold uppercase rounded-sm">
                                Hot
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => org && setSelectedOrg(org)}
                                title="Xem chi tiết doanh nghiệp"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-hnx-700 hover:bg-hnx-50 border border-slate-200"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(`Tải file văn bản công bố chính thức: ${sub.submissionNo}.pdf`)
                                }
                                title="Tải PDF"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-hnx-700 hover:bg-hnx-50 border border-slate-200"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 text-xs text-slate-500 border-t border-slate-100">
              Tìm thấy <strong>{filteredSubmissions.length}</strong> tin công bố công khai
            </div>
          </div>
        )}
      </div>

      {/* Chân trang */}
      <footer className="bg-hnx-header text-emerald-100 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="space-y-2">
            <img src={hnxLogo} alt="Hanoi Stock Exchange" className="h-7 w-auto" />
            <p className="text-xs text-emerald-200/80 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Corporate Disclosure Portal v2.0 · Powered by VNX Exchange Group
            </p>
            <p className="text-xs text-emerald-200/60">
              2 Phan Chu Trinh, Hoàn Kiếm, Hà Nội · Tel: (024) 3941 8398 · info@hnx.vn
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-emerald-200/80 shrink-0">
            <span className="cursor-default hover:text-white">Điều khoản sử dụng</span>
            <span className="cursor-default hover:text-white">Chính sách bảo mật</span>
            <span className="cursor-default hover:text-white">Liên hệ hỗ trợ</span>
            <span className="cursor-default hover:text-white">API Documentation</span>
          </div>
        </div>
        <div className="border-t border-emerald-900/60 py-3 text-center text-[11px] text-emerald-300/60">
          © 2026 Hanoi Stock Exchange (HNX) · VNX Group. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
