/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AccountRequest,
  SecurityPolicy,
  LoginAuditEntry,
  DataScopeGrant,
} from '../types/hnx';

/** Dữ liệu mẫu cho khối tài khoản – phân quyền – bảo mật (FR-044, FR-055 → FR-060). */

const base = (id: number, createdAt: string) => ({
  id,
  createdAt,
  createdBy: 0,
  versionNo: 1,
  isCurrent: true,
});

/* FR-055 · Yêu cầu mở tài khoản ─────────────────────────────────────────── */

export const INITIAL_ACCOUNT_REQUESTS: AccountRequest[] = [
  {
    ...base(1, '2026-08-10T02:14:00Z'),
    requestNo: 'REQ-2026-0041',
    organizationTaxCode: '0100233583',
    organizationName: 'CTCP Sữa Việt Nam',
    fullName: 'Trần Thị Mai',
    email: 'mai.tt@vinamilk.com.vn',
    phone: '0912345678',
    position: 'Chuyên viên Ban Pháp chế',
    requestedRole: 'ROLE_ORG_STAFF',
    status: 'PENDING',
    submittedAt: '2026-08-10T02:14:00Z',
  },
  {
    ...base(2, '2026-08-12T07:30:00Z'),
    requestNo: 'REQ-2026-0042',
    organizationTaxCode: '0900189284',
    organizationName: 'CTCP Tập đoàn Hòa Phát',
    fullName: 'Nguyễn Văn Bình',
    email: 'binh.nv@hoaphat.com.vn',
    phone: '0987654321',
    position: 'Trưởng ban Quan hệ Nhà đầu tư',
    requestedRole: 'ROLE_ORG_MANAGER',
    status: 'PENDING',
    submittedAt: '2026-08-12T07:30:00Z',
  },
  {
    ...base(3, '2026-07-28T03:00:00Z'),
    requestNo: 'REQ-2026-0039',
    organizationTaxCode: '0101245789',
    organizationName: 'CTCP Công nghệ AlphaTech',
    fullName: 'Lê Minh Hoàng',
    email: 'hoang.lm@alphatech.vn',
    phone: '0901122334',
    position: 'Giám đốc Tài chính',
    requestedRole: 'ROLE_ORG_MANAGER',
    status: 'APPROVED',
    submittedAt: '2026-07-28T03:00:00Z',
    processedAt: '2026-07-29T04:20:00Z',
    processedBy: 1,
  },
  {
    ...base(4, '2026-07-20T06:45:00Z'),
    requestNo: 'REQ-2026-0037',
    organizationTaxCode: '0312345678',
    organizationName: 'CTCP Đầu tư BOG',
    fullName: 'Phạm Thu Hà',
    email: 'ha.pt@bog.vn',
    phone: '0933445566',
    position: 'Kế toán trưởng',
    requestedRole: 'ROLE_ORG_STAFF',
    status: 'REJECTED',
    submittedAt: '2026-07-20T06:45:00Z',
    processedAt: '2026-07-22T08:10:00Z',
    processedBy: 1,
    rejectReason:
      'Mã số thuế khai báo không khớp với hồ sơ tổ chức đang lưu tại HNX. Đề nghị đối chiếu lại giấy chứng nhận ĐKKD rồi nộp lại.',
  },
];

/* FR-059 + FR-060 · Chính sách bảo mật ──────────────────────────────────── */

export const INITIAL_SECURITY_POLICY: SecurityPolicy = {
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireDigit: true,
  passwordRequireSymbol: true,
  passwordExpiryDays: 90,
  passwordHistoryCount: 5,
  maxFailedAttempts: 5,
  lockoutMinutes: 30,
  sessionTimeoutMinutes: 30,
  mfaRequiredForRoles: ['ROLE_SYS_ADMIN', 'ROLE_BIZ_ADMIN', 'ROLE_TTTT_MANAGER', 'ROLE_QLNY_MANAGER'],
  ipAllowlistEnabled: false,
  ipAllowlist: ['10.0.0.0/8', '192.168.1.0/24'],
};

/* FR-060 · Nhật ký đăng nhập ────────────────────────────────────────────── */

export const INITIAL_LOGIN_AUDIT: LoginAuditEntry[] = [
  { id: 1, username: 'admin.tuan', occurredAt: '2026-08-18T01:12:04Z', result: 'SUCCESS', ipAddress: '10.12.4.55', userAgent: 'Chrome 141 / Windows' },
  { id: 2, username: 'huong.qlny', occurredAt: '2026-08-18T01:03:41Z', result: 'SUCCESS', ipAddress: '10.12.4.78', userAgent: 'Edge 141 / Windows' },
  { id: 3, username: 'mai.vnm', occurredAt: '2026-08-18T00:58:12Z', result: 'FAILED_PASSWORD', ipAddress: '113.161.42.9', userAgent: 'Chrome 140 / Windows', failReason: 'Sai mật khẩu (lần 1/5)' },
  { id: 4, username: 'mai.vnm', occurredAt: '2026-08-18T00:58:47Z', result: 'FAILED_PASSWORD', ipAddress: '113.161.42.9', userAgent: 'Chrome 140 / Windows', failReason: 'Sai mật khẩu (lần 2/5)' },
  { id: 5, username: 'unknown.user', occurredAt: '2026-08-17T19:22:31Z', result: 'FAILED_PASSWORD', ipAddress: '45.61.132.7', userAgent: 'curl/8.4.0', failReason: 'Tài khoản không tồn tại' },
  { id: 6, username: 'unknown.user', occurredAt: '2026-08-17T19:22:33Z', result: 'FAILED_PASSWORD', ipAddress: '45.61.132.7', userAgent: 'curl/8.4.0', failReason: 'Tài khoản không tồn tại' },
  { id: 7, username: 'unknown.user', occurredAt: '2026-08-17T19:22:35Z', result: 'LOCKED_OUT', ipAddress: '45.61.132.7', userAgent: 'curl/8.4.0', failReason: 'Vượt 5 lần sai — khóa 30 phút' },
  { id: 8, username: 'nam.tttt', occurredAt: '2026-08-17T08:41:19Z', result: 'FAILED_MFA', ipAddress: '10.12.4.91', userAgent: 'Firefox 132 / Windows', failReason: 'Mã OTP hết hạn' },
  { id: 9, username: 'nam.tttt', occurredAt: '2026-08-17T08:42:02Z', result: 'SUCCESS', ipAddress: '10.12.4.91', userAgent: 'Firefox 132 / Windows' },
  { id: 10, username: 'binh.hpg', occurredAt: '2026-08-17T02:15:55Z', result: 'SUCCESS', ipAddress: '203.113.88.12', userAgent: 'Safari 18 / macOS' },
];

/* FR-058 + FR-044 · Phạm vi dữ liệu ─────────────────────────────────────── */

export const INITIAL_DATA_SCOPES: DataScopeGrant[] = [
  { id: 1, subjectType: 'ROLE', subjectRef: 'ROLE_QLNY_STAFF', dimension: 'BOARD', operator: 'IN', valuesList: ['HNX', 'UPCOM'], effect: 'ALLOW' },
  { id: 2, subjectType: 'ROLE', subjectRef: 'ROLE_TTTP_STAFF', dimension: 'SECURITY_TYPE', operator: 'IN', valuesList: ['BOND_PRIVATE', 'BOND_GREEN'], effect: 'ALLOW' },
  { id: 3, subjectType: 'ROLE', subjectRef: 'ROLE_TTTT_STAFF', dimension: 'NEWS_GROUP', operator: 'IN', valuesList: ['PERIODIC', 'EXTRAORDINARY', 'TRADING', 'ON_DEMAND'], effect: 'ALLOW' },
  { id: 4, subjectType: 'ROLE', subjectRef: 'ROLE_ORG_STAFF', dimension: 'ORGANIZATION', operator: 'IN', valuesList: ['SELF'], effect: 'ALLOW' },
  { id: 5, subjectType: 'ROLE', subjectRef: 'ROLE_HNX_EXEC', dimension: 'ORGANIZATION', operator: 'ALL', valuesList: [], effect: 'ALLOW' },
  { id: 6, subjectType: 'UNIT', subjectRef: 'P_QLNY', dimension: 'INDUSTRY', operator: 'NOT_IN', valuesList: ['IND_FINANCE'], effect: 'DENY' },
  { id: 7, subjectType: 'USER', subjectRef: 'huong.qlny', dimension: 'ORGANIZATION', operator: 'IN', valuesList: ['VNM', 'HPG', 'VIC'], effect: 'ALLOW' },
];
