/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Building2,
  FileText,
  Calendar,
  Globe,
  ExternalLink,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
} from 'lucide-react';
import {
  Organization,
  SecurityItem,
  Submission,
  BondProfile,
} from '../../types/hnx';
import { StatusBadge } from '../common/StatusBadge';

interface PublicCorporateNewsProps {
  organizations: Organization[];
  securities: SecurityItem[];
  submissions: Submission[];
  bonds: BondProfile[];
  lang: 'vi' | 'en';
}

export const PublicCorporateNews: React.FC<PublicCorporateNewsProps> = ({
  organizations,
  securities,
  submissions,
  bonds,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Filter public disclosures (FR-066 / 8.3 rules)
  // MUST only show status = 'PUBLISHED', isPublic = true, and not hidden
  const publicSubmissions = (submissions || []).filter(
    (s) => s.status === 'PUBLISHED' && s.isPublic && !s.hiddenAt
  );

  const filteredSubmissions = publicSubmissions.filter((sub) => {
    const org = organizations.find((o) => o.id === sub.organizationId);
    const sec = securities.find((s) => s.id === sub.securityId);

    if (selectedBoard !== 'ALL' && sec && sec.board !== selectedBoard) {
      return false;
    }
    if (selectedGroup !== 'ALL' && sub.newsGroupCode !== selectedGroup) {
      return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = sub.titleVi.toLowerCase().includes(term);
      const matchOrg = org && (org.nameVi.toLowerCase().includes(term) || org.shortName.toLowerCase().includes(term));
      const matchSymbol = sec && sec.symbol.toLowerCase().includes(term);
      return matchTitle || matchOrg || matchSymbol;
    }

    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold">
                SỞ GIAO DỊCH CHỨNG KHOÁN HÀ NỘI (HNX)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                {lang === 'vi'
                  ? 'Chuyên trang Công bố Thông tin Doanh nghiệp (Corporate News)'
                  : 'HNX Corporate Information Disclosure Portal'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {lang === 'vi'
                  ? 'Kênh chính thức tra cứu Báo cáo tài chính, Tin công bố bất thường và Hồ sơ niêm yết của Doanh nghiệp trên sàn HNX, UPCoM & Trái phiếu.'
                  : 'Official portal for searching Financial Statements, Extraordinary Disclosures, and Listing Profiles on HNX & UPCoM.'}
              </p>
            </div>

            <a
              href="https://www.hnx.vn"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 font-medium self-start sm:self-auto"
            >
              <span>{lang === 'vi' ? 'Website Chính thức HNX' : 'HNX Main Website'}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Central Search Input with Autocomplete Simulation */}
          <div className="pt-2">
            <div className="relative max-w-3xl">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === 'vi'
                    ? 'Nhập Mã chứng khoán (VNM, HPG, VIC...), Tên Doanh nghiệp hoặc Từ khóa...'
                    : 'Search by Symbol, Company Name or Keywords...'
                }
                className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {selectedOrg ? (
          /* Detailed Company View */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedOrg(null)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>← Quay lại Danh sách Doanh nghiệp</span>
            </button>

            {/* Org Profile Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold text-sm rounded-lg border border-blue-200">
                      {selectedOrg.shortName}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">
                      {lang === 'vi' ? selectedOrg.nameVi : selectedOrg.nameEn || selectedOrg.nameVi}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 space-x-3">
                    <span>Mã số thuế: <strong>{selectedOrg.taxCode}</strong></span>
                    <span>•</span>
                    <span>Đại diện CBTT: <strong>{selectedOrg.disclosureRepName}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <StatusBadge status="NORMAL" type="security" />
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    ✓ Ký quỹ: Đủ điều kiện
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
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
                  <div className="font-medium text-blue-600 truncate">{selectedOrg.website}</div>
                </div>
              </div>
            </div>

            {/* Submissions of selected company */}
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
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md mr-2">
                            {sub.newsGroupCode || 'DINH_KY'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {sub.publishedAt
                              ? new Date(sub.publishedAt).toLocaleDateString('vi-VN')
                              : ''}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 mt-1">
                            {lang === 'vi' ? sub.titleVi : sub.titleEn || sub.titleVi}
                          </h4>
                        </div>

                        <button
                          onClick={() => alert(`Tải xuống file BCTC/Thông báo công khai: ${sub.submissionNo}.pdf`)}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Tải PDF</span>
                        </button>
                      </div>

                      {sub.payload && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {sub.payload.summary_note || JSON.stringify(sub.payload)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* Corporate News List View */
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1 mr-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Bộ lọc:</span>
                </span>

                {/* Sàn Filter */}
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả Sàn (HNX, UPCoM, TPDN)</option>
                  <option value="HNX">Sàn HNX</option>
                  <option value="UPCOM">Sàn UPCoM</option>
                  <option value="PRIVATE_BOND">Trái phiếu Riêng lẻ</option>
                </select>

                {/* Group Filter */}
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả Nhóm Tin</option>
                  <option value="PERIODIC">Báo cáo Định kỳ (BCTC)</option>
                  <option value="EXTRAORDINARY">Tin Bất thường (24h/48h)</option>
                  <option value="BOND">Tin Trái phiếu</option>
                  <option value="TRADING">Tin Giao dịch NNB/CĐL</option>
                  <option value="HNX_NEWS">Tin từ Sở HNX</option>
                </select>
              </div>

              <div className="text-xs text-slate-500">
                Tìm thấy <strong>{filteredSubmissions.length}</strong> tin công bố công khai
              </div>
            </div>

            {/* Grid of Companies and Disclosures */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Featured Companies Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3 flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Danh sách Doanh nghiệp Tra cứu</span>
                  </h3>

                  <div className="space-y-2">
                    {organizations.map((org) => {
                      const sec = securities.find((s) => s.organizationId === org.id);
                      return (
                        <button
                          key={org.id}
                          onClick={() => setSelectedOrg(org)}
                          className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                              {org.shortName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {org.nameVi}
                            </div>
                          </div>
                          {sec && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md">
                              {sec.board}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Green Bonds Spotlight Card (FR-021 / Treasury & Investor view) */}
                <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Award className="h-5 w-5" />
                    <span className="font-bold text-sm">Chuyên trang Trái phiếu Xanh (FR-021)</span>
                  </div>
                  <p className="text-xs text-emerald-100">
                    Tra cứu công khai thông tin phát hành, báo cáo phân bổ nguồn vốn và đánh giá tác động môi trường cho Kho bạc & Nhà đầu tư.
                  </p>
                  {(bonds || [])
                    .filter((b) => b.isGreenBond)
                    .map((gb) => (
                      <div key={gb.id} className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-emerald-300">{gb.bondCode}</div>
                        <div className="text-slate-300">Tổng giá trị: {(gb.totalParValue / 1e9).toLocaleString('vi-VN')} Tỷ VND</div>
                        <div className="text-[10px] text-emerald-400">Xếp hạng: {gb.creditRating} ({gb.creditRatingAgency})</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Disclosure Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>Bản tin Công bố Thông tin Mới nhất</span>
                    <span className="text-xs font-normal text-slate-500">Cập nhật tự động</span>
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {filteredSubmissions.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-500">
                        Không tìm thấy tin công bố nào phù hợp với bộ lọc hiện tại.
                      </div>
                    ) : (
                      filteredSubmissions.map((sub) => {
                        const org = organizations.find((o) => o.id === sub.organizationId);
                        const sec = securities.find((s) => s.id === sub.securityId);

                        return (
                          <div key={sub.id} className="py-4 space-y-2 hover:bg-slate-50/50 rounded-xl p-2 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  {sec && (
                                    <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[11px] rounded-md">
                                      {sec.symbol}
                                    </span>
                                  )}
                                  <span className="font-semibold text-xs text-slate-700">
                                    {org?.shortName}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {sub.publishedAt
                                        ? new Date(sub.publishedAt).toLocaleDateString('vi-VN')
                                        : ''}
                                    </span>
                                  </span>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer">
                                  {lang === 'vi' ? sub.titleVi : sub.titleEn || sub.titleVi}
                                </h4>
                              </div>

                              <button
                                onClick={() =>
                                  alert(`Tải file văn bản công bố chính thức: ${sub.submissionNo}.pdf`)
                                }
                                className="shrink-0 p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 flex items-center space-x-1"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                            </div>

                            {sub.payload && sub.payload.summary_note && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                {sub.payload.summary_note}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
