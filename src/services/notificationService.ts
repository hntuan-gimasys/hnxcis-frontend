/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DisclosureObligation, NotificationItem } from '../types/hnx';

export interface DeadlineStatus {
  daysRemaining: number;
  isWithin7Days: boolean;
  isOverdue: boolean;
  isUrgent: boolean; // within 7 days or overdue
  badgeText: string;
  badgeStyle: string; // Tailwind color & effect classes
  cardStyle: string;
}

export class NotificationService {
  /**
   * Calculates calendar days remaining until the due date string (YYYY-MM-DD).
   * Reference date defaults to current date (2026-08-12 in system mock timeframe).
   */
  public getDaysRemaining(dueDateStr: string, referenceDate: Date = new Date()): number {
    if (!dueDateStr) return 999;
    
    // Parse YYYY-MM-DD
    const parts = dueDateStr.split('-');
    if (parts.length < 3) return 999;

    const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59);
    
    const now = new Date(referenceDate);
    now.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Evaluates the deadline status for an obligation and returns metadata with highlight styling.
   */
  public evaluateObligationDeadline(
    obligation: DisclosureObligation,
    referenceDate: Date = new Date()
  ): DeadlineStatus {
    if (obligation.status === 'FULFILLED' || obligation.status === 'WAIVED') {
      return {
        daysRemaining: 0,
        isWithin7Days: false,
        isOverdue: false,
        isUrgent: false,
        badgeText: '✓ Đã hoàn thành',
        badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
        cardStyle: 'bg-emerald-50/50 border-emerald-200',
      };
    }

    const daysRemaining = this.getDaysRemaining(obligation.dueDate, referenceDate);
    const isOverdue = daysRemaining < 0 || obligation.status === 'LATE' || obligation.status === 'MISSING';
    const isWithin7Days = daysRemaining >= 0 && daysRemaining <= 7;
    const isUrgent = isOverdue || isWithin7Days;

    if (isOverdue) {
      const lateDays = Math.abs(daysRemaining) || obligation.lateDays || 1;
      return {
        daysRemaining,
        isWithin7Days: false,
        isOverdue: true,
        isUrgent: true,
        badgeText: `🚨 CỜ ĐỎ: Quá hạn ${lateDays} ngày`,
        badgeStyle: 'bg-red-600 text-white font-extrabold border-2 border-red-700 animate-pulse shadow-xs',
        cardStyle: 'bg-red-50/90 border-2 border-red-600 text-red-950',
      };
    }

    if (isWithin7Days) {
      return {
        daysRemaining,
        isWithin7Days: true,
        isOverdue: false,
        isUrgent: true,
        badgeText: daysRemaining === 0 ? '🔥 HẠN CHÓT HÔM NAY!' : `⚡ HẠN NỘP: Còn ${daysRemaining} ngày (≤7 ngày)`,
        badgeStyle: 'bg-red-500 text-white font-bold border-2 border-red-600 animate-pulse shadow-xs',
        cardStyle: 'bg-red-50 border-2 border-red-500 text-red-900',
      };
    }

    // Normal pending (> 7 days)
    return {
      daysRemaining,
      isWithin7Days: false,
      isOverdue: false,
      isUrgent: false,
      badgeText: `Sắp hạn: Còn ${daysRemaining} ngày`,
      badgeStyle: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
      cardStyle: 'bg-amber-50/60 border border-amber-200',
    };
  }

  /**
   * Generates NotificationItem objects for obligations that have deadlines within 7 days or are overdue.
   */
  public generateDeadlineNotifications(
    obligations: DisclosureObligation[],
    referenceDate: Date = new Date()
  ): NotificationItem[] {
    const notifications: NotificationItem[] = [];

    for (const obl of obligations) {
      const status = this.evaluateObligationDeadline(obl, referenceDate);

      if (status.isUrgent) {
        const isWithin7 = status.isWithin7Days;
        const isOver = status.isOverdue;

        const tag = isOver
          ? 'QUÁ HẠN NỘP BÁO CÁO'
          : status.daysRemaining === 0
          ? 'HẠN NỘP HÔM NAY'
          : `HẠN NỘP CÒN ${status.daysRemaining} NGÀY`;

        const subject = `[CẢNH BÁO ${tag}] ${obl.templateName} (${obl.symbol || 'DN'})`;

        notifications.push({
          id: 80000 + obl.id,
          createdAt: new Date().toISOString(),
          createdBy: 1,
          versionNo: 1,
          isCurrent: true,
          direction: 'OUTBOUND',
          recipientOrgId: obl.organizationId,
          senderName: 'Dịch vụ Cảnh báo Hạn nộp HNX (Notification Service)',
          channel: 'IN_APP',
          subject,
          body: `Báo cáo "${obl.templateName}" của ${obl.organizationName} (${obl.symbol || 'Mã CK'}) có hạn nộp vào ngày ${obl.dueDate}. ${
            isOver
              ? `Hồ sơ đã QUÁ HẠN. Đề nghị gửi văn bản giải trình & nộp E-Form gấp!`
              : `Thời hạn còn ${status.daysRemaining} ngày (≤7 ngày). Vui lòng lập & nộp báo cáo khẩn cấp.`
          }`,
          relatedEntityType: 'DISCLOSURE_OBLIGATION',
          relatedEntityId: obl.id,
          notificationType: 'REMINDER',
          priority: 'HIGH',
          sendStatus: 'SENT',
          sentAt: new Date().toISOString(),
        });
      }
    }

    return notifications;
  }
}

export const notificationService = new NotificationService();
