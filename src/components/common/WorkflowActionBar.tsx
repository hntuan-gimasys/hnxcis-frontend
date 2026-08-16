/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Send, Eye, FileText } from 'lucide-react';
import { workflowEngine } from '../../services/workflowEngine';

interface WorkflowActionBarProps {
  currentStatus: string;
  submitterId?: number;
  currentUserId: number;
  onAction: (actionCode: string, comment?: string, reason?: string) => void;
  /**
   * Guard expression evaluated before APPROVE (see workflowEngine.evaluateGuard).
   * Only luồng hồ sơ niêm yết ràng buộc phí; luồng CBTT bỏ trống nên không chặn.
   */
  approveGuardExpr?: string;
  feePaymentStatus?: string;
  reviewedAt?: string;
  approvedAt?: string;
  /**
   * Vòng đời song ngữ (FR-065): mẫu tin thuộc nhóm dịch tự động thì bản EN phải
   * qua hiệu đính (`HUMAN_REVIEWED`) mới công bố được, và công bố VI + EN là MỘT
   * hành động duy nhất — không có vòng duyệt riêng cho bản EN.
   */
  needsTranslation?: boolean;
  translationStatus?: string;
}

export const WorkflowActionBar: React.FC<WorkflowActionBarProps> = ({
  currentStatus,
  submitterId,
  currentUserId,
  onAction,
  approveGuardExpr,
  feePaymentStatus,
  reviewedAt,
  approvedAt,
  needsTranslation = false,
  translationStatus,
}) => {
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSameUser = submitterId === currentUserId;

  const handleTriggerAction = (actionCode: string) => {
    setErrorMsg(null);

    // Guard checks
    if (actionCode === 'APPROVE' && isSameUser) {
      setErrorMsg('Vi phạm nguyên tắc Kiểm soát Kép (PZ6): Người phê duyệt phải khác người lập.');
      return;
    }

    if (actionCode === 'APPROVE' && approveGuardExpr) {
      const guardCheck = workflowEngine.evaluateGuard(approveGuardExpr, {
        feePaymentStatus,
        reviewedAt,
        approvedAt,
      });
      if (!guardCheck.ok) {
        setErrorMsg(guardCheck.reason || 'Chưa đủ điều kiện chuyển tiếp');
        return;
      }
    }

    if (['REJECT', 'RETURN', 'SUPPLEMENT', 'HIDE'].includes(actionCode)) {
      setModalAction(actionCode);
      return;
    }

    onAction(actionCode);
  };

  const handleConfirmModal = () => {
    if (!reason.trim()) {
      setErrorMsg('Bắt buộc phải nhập lý do cho hành động này (X7).');
      return;
    }
    if (modalAction) {
      onAction(modalAction, comment, reason);
      setModalAction(null);
      setReason('');
      setComment('');
      setErrorMsg(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center space-x-2 text-sm font-medium">
        <span className="text-slate-400">Trạng thái hiện tại:</span>
        <span className="px-2.5 py-1 bg-slate-800 rounded-md text-blue-300 font-semibold border border-slate-700">
          {currentStatus}
        </span>
      </div>

      {errorMsg && (
        <div className="text-xs bg-red-900/80 text-red-200 px-3 py-1.5 rounded-lg border border-red-700">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {currentStatus === 'DRAFT' && (
          <button
            onClick={() => handleTriggerAction('SUBMIT')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Gửi duyệt</span>
          </button>
        )}

        {currentStatus === 'SUBMITTED' && (
          <button
            onClick={() => handleTriggerAction('REVIEW')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Soát xét hoàn tất</span>
          </button>
        )}

        {['REVIEWED', 'PENDING_APPROVAL'].includes(currentStatus) && (
          <>
            <button
              onClick={() => handleTriggerAction('APPROVE')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Phê duyệt</span>
            </button>
            <button
              onClick={() => handleTriggerAction('RETURN')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-semibold shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Trả lại sửa</span>
            </button>
            <button
              onClick={() => handleTriggerAction('REJECT')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold shadow-xs"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Từ chối</span>
            </button>
          </>
        )}

        {currentStatus === 'APPROVED' &&
          (() => {
            const waitingProofread =
              needsTranslation && translationStatus !== 'HUMAN_REVIEWED';
            return (
              <button
                disabled={waitingProofread}
                title={
                  waitingProofread
                    ? 'Bản dịch tiếng Anh phải được hiệu đính trước khi công bố (FR-065).'
                    : undefined
                }
                onClick={() => handleTriggerAction('PUBLISH')}
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs ${
                  waitingProofread
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-500'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>
                  {needsTranslation ? 'Công bố thông tin VI + EN' : 'Công bố lên Website'}
                </span>
              </button>
            );
          })()}

        {currentStatus === 'PUBLISHED' && (
          <button
            onClick={() => handleTriggerAction('HIDE')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-xs font-semibold shadow-xs"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Gỡ tin (Ẩn tin)</span>
          </button>
        )}
      </div>

      {/* Reason Modal */}
      {modalAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Xác nhận hành động: {modalAction}
            </h3>
            <p className="text-xs text-slate-600">
              Yêu cầu nhập lý do chi tiết cho hành động này để ghi vết Audit Trail (X7).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do bắt buộc..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú bổ sung (Tùy chọn)
              </label>

              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ghi chú thêm..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setModalAction(null)}
                className="px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmModal}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
