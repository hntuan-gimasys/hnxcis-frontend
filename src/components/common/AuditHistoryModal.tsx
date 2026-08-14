/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Clock, User, ShieldCheck } from 'lucide-react';
import { AuditLog } from '../../types/hnx';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: number;
  entityLabel: string;
  auditLogs: AuditLog[];
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityLabel,
  auditLogs,
}) => {
  if (!isOpen) return null;

  const logs = (auditLogs || []).filter(
    (l) => l.entityType === entityType && l.entityId === entityId
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Nhật ký Thay đổi & Lịch sử Phê duyệt (Audit Trail X3)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {entityType} #{entityId}: {entityLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              Chưa có nhật ký thay đổi nào được ghi nhận cho bản ghi này.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-semibold text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Hành động: {log.action}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(log.occurredAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Thực hiện bởi: <strong>{log.actorName}</strong> ({log.actorRole}) - IP: {log.actorIp}
                  </span>
                </div>

                {log.reason && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-medium">
                    Lý do: {log.reason}
                  </div>
                )}

                {log.diffJson && (
                  <div className="mt-2 bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                    <div>Thay đổi (Diff):</div>
                    <pre>{JSON.stringify(log.diffJson, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 pt-3 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
