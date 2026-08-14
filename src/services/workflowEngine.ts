/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WorkflowDefinition,
  WorkflowTask,
  WorkflowHistory,
  SubmissionStatus,
  UserAccount,
} from '../types/hnx';
import { calendarService } from './businessCalendar';

export interface TransitionResult {
  success: boolean;
  newStatus?: SubmissionStatus;
  nextStepCode?: string;
  errorMessage?: string;
}

export class WorkflowEngine {
  public evaluateGuard(guardExpr: string | undefined, context: { feePaymentStatus?: string; reviewedAt?: string; approvedAt?: string }): { ok: boolean; reason?: string } {
    if (!guardExpr) return { ok: true };

    if (guardExpr.includes("#fee.paymentStatus == 'CONFIRMED'")) {
      if (context.feePaymentStatus !== 'CONFIRMED') {
        return {
          ok: false,
          reason: 'Điều kiện chặn: Chưa xác nhận thanh toán phí niêm yết/đăng ký giao dịch.',
        };
      }
    }

    if (guardExpr.includes('#submission.reviewedAt != null and #submission.approvedAt != null')) {
      if (!context.reviewedAt || !context.approvedAt) {
        return {
          ok: false,
          reason: 'Điều kiện chặn: Báo cáo chưa hoàn tất bước Soát xét và Phê duyệt của Sở.',
        };
      }
    }

    return { ok: true };
  }

  public validateDualControl(submitterId: number, approverId: number): boolean {
    return submitterId !== approverId;
  }

  public calculateTaskDueDate(startDate: Date, slaWorkingDays: number = 2): string {
    const due = calendarService.addWorkingDays(startDate, slaWorkingDays);
    return due.toISOString();
  }
}

export const workflowEngine = new WorkflowEngine();
