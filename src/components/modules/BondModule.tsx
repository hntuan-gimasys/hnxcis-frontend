/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Award,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { BondProfile } from '../../types/hnx';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';

interface BondModuleProps {
  bonds: BondProfile[];
  onAuditHistory: (type: string, id: number, label: string) => void;
}

export const BondModule: React.FC<BondModuleProps> = ({ bonds, onAuditHistory }) => {
  const [activeTab, setActiveTab] = useState<'bonds' | 'green'>('bonds');

  const bondColumns: ColumnDef<BondProfile>[] = [
    {
      key: 'bondCode',
      headerVi: 'Mã Trái phiếu / Kỳ hạn',
      render: (row) => (
        <div>
          <div className="font-extrabold text-indigo-700 text-sm font-mono flex items-center space-x-1">
            <span>{row.bondCode}</span>
            {row.isGreenBond && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-xs text-[10px] uppercase font-bold">
                Xanh (ESG)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Phát hành: {row.issueDate} | Đáo hạn: {row.maturityDate}
          </div>
        </div>
      ),
    },
    {
      key: 'parValue',
      headerVi: 'Mệnh giá / Lãi suất',
      render: (row) => (
        <div>
          <div className="font-mono text-xs font-bold text-slate-800">
            {row.parValue.toLocaleString('vi-VN')} VND
          </div>
          <div className="text-xs text-indigo-600 font-bold font-mono">{row.interestRateDesc}</div>
        </div>
      ),
    },
    {
      key: 'totalParValue',
      headerVi: 'Tổng Giá trị Phát hành',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {(row.totalParValue / 1000000000).toLocaleString('vi-VN')} Tỷ VND
        </span>
      ),
    },
    {
      key: 'bondStatus',
      headerVi: 'Trạng thái TP',
      render: (row) => (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xs text-xs font-bold uppercase tracking-wider">
          {row.bondStatus === 'LISTED' ? 'Đang Niêm yết' : row.bondStatus}
        </span>
      ),
    },
    {
      key: 'id',
      headerVi: 'Audit Log',
      render: (row) => (
        <button
          onClick={() => onAuditHistory('BOND_PROFILE', row.id, `Trái phiếu ${row.bondCode}`)}
          className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-wider"
        >
          Xem Audit Log
        </button>
      ),
    },
  ];

  const greenBonds = (bonds || []).filter((b) => b.isGreenBond);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Phòng Thị trường Trái phiếu (P.TTTP)
        </h1>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
          FR-020 → FR-026: Quản lý Trái phiếu Riêng lẻ, Trái phiếu Doanh nghiệp Xanh & Lịch Thanh toán Gốc Lãi
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('bonds')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'bonds'
              ? 'bg-indigo-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Trái phiếu Riêng lẻ (FR-020)</span>
        </button>

        <button
          onClick={() => setActiveTab('green')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'green'
              ? 'bg-emerald-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="h-4 w-4 text-emerald-400" />
          <span>Trái phiếu Xanh & ESG (FR-021)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'bonds' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Danh mục Trái phiếu Đăng ký Giao dịch Riêng lẻ (Nghị định 65/2022/NĐ-CP)
            </h3>
            <button
              onClick={() => alert('Tiếp nhận hồ sơ đăng ký giao dịch trái phiếu riêng lẻ mới!')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              + Đăng ký Mã TP Mới
            </button>
          </div>

          <DynamicTable data={bonds} columns={bondColumns} />
        </div>
      )}

      {activeTab === 'green' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Giám sát Cam kết Môi trường & Báo cáo Tác động Trái phiếu Xanh (FR-021)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kho bạc Nhà nước & HNX đồng giám sát việc sử dụng vốn cho các dự án xanh, năng lượng tái tạo và giảm phát thải.
            </p>
          </div>

          <DynamicTable data={greenBonds} columns={bondColumns} />
        </div>
      )}
    </div>
  );
};
