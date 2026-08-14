/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RuleDefinition,
  Alert,
  DisclosureObligation,
  Organization,
  EquityProfile,
} from '../types/hnx';

export class RuleEngine {
  public scanDisclosureObligations(
    rules: RuleDefinition[],
    obligations: DisclosureObligation[],
    organizations: Organization[]
  ): Alert[] {
    const alerts: Alert[] = [];
    const lateRule = rules.find((r) => r.ruleCode === 'WARN_40_LATE_DISCLOSURE');

    if (!lateRule) return alerts;

    const maxLateDaysParam = Number(
      lateRule.parameters.find((p) => p.paramCode === 'MAX_LATE_DAYS')?.paramValue || 15
    );

    for (const obl of obligations) {
      if (obl.status === 'LATE' && (obl.lateDays || 0) > maxLateDaysParam) {
        const org = organizations.find((o) => o.id === obl.organizationId);
        alerts.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          createdAt: new Date().toISOString(),
          createdBy: 1,
          versionNo: 1,
          isCurrent: true,
          ruleDefId: lateRule.id,
          ruleCode: lateRule.ruleCode,
          ruleName: lateRule.nameVi,
          legalBasis: lateRule.legalBasis,
          organizationId: obl.organizationId,
          organizationName: org?.shortName || obl.organizationName,
          securityId: obl.securityId,
          symbol: obl.symbol,
          severity: 'WARNING',
          titleVi: `Cảnh báo Điều 40: ${obl.organizationName} chậm nộp ${obl.templateName} (${obl.lateDays} ngày làm việc)`,
          evidenceJson: {
            dueDate: obl.dueDate,
            lateDays: obl.lateDays,
            periodCode: obl.periodCode,
            templateName: obl.templateName,
          },
          suggestedAction: 'Xem xét đưa cổ phiếu vào diện Cảnh báo theo Điều 40 Quy chế HNX',
          status: 'NEW',
        });
      }
    }

    return alerts;
  }
}

export const ruleEngine = new RuleEngine();
