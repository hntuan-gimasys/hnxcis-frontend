/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DossierStatus, RegistrationDossier } from '../types/hnx';

/**
 * Mẫu số 01 → 06 — tên nguyên văn theo URD (PRD v1.2 §13.4). Dùng đúng tên này,
 * không rút gọn hay đặt lại tên trong từng màn hình.
 */
export interface DossierFormSpec {
  code: string;
  /** Tên đầy đủ, nguyên văn URD. */
  nameVi: string;
  /** Dùng khi nào — cột "Dùng khi" của §13.4. */
  usedWhenVi: string;
}

export const DOSSIER_FORMS: DossierFormSpec[] = [
  {
    code: 'Mẫu số 01',
    nameVi: 'Công văn yêu cầu bổ sung, chỉnh sửa hồ sơ đăng ký giao dịch',
    usedWhenVi: 'Hồ sơ chưa đầy đủ và/hoặc chưa hợp lệ',
  },
  {
    code: 'Mẫu số 02',
    nameVi: 'Thông báo dừng xem xét hồ sơ đăng ký giao dịch',
    usedWhenVi: 'Hết 60 ngày mà hồ sơ chưa hoàn thiện',
  },
  {
    code: 'Mẫu số 03',
    nameVi: 'Báo cáo tổng hợp hồ sơ đăng ký giao dịch cổ phiếu',
    usedWhenVi: 'Luồng chấp thuận',
  },
  {
    code: 'Mẫu số 04',
    nameVi: 'Quyết định về việc chấp thuận đăng ký giao dịch cổ phiếu',
    usedWhenVi: 'Luồng chấp thuận (và FR-005)',
  },
  {
    code: 'Mẫu số 05',
    nameVi: 'Thông báo về việc chấp thuận đăng ký giao dịch cổ phiếu',
    usedWhenVi: 'Luồng chấp thuận',
  },
  {
    code: 'Mẫu số 06',
    nameVi:
      'Thông báo ngày giao dịch đầu tiên và giá tham chiếu trong ngày giao dịch đầu tiên',
    usedWhenVi: 'Luồng xác định ngày GDĐT (và FR-005)',
  },
];

export const DOSSIER_STATUS_LABEL: Record<DossierStatus, string> = {
  RECEIVED: 'Đã tiếp nhận — đang kiểm tra',
  NEED_SUPPLEMENT: 'Yêu cầu bổ sung, chỉnh sửa',
  STOPPED: 'Dừng xem xét hồ sơ',
  APPROVAL: 'Luồng chấp thuận ĐKGD',
  FIRST_TRADING: 'Xác định ngày giao dịch đầu tiên',
  COMPLETED: 'Đã hoàn tất',
};

export const DOSSIER_STATUS_STYLE: Record<DossierStatus, string> = {
  RECEIVED: 'bg-sky-50 text-sky-700 border-sky-200',
  NEED_SUPPLEMENT: 'bg-amber-50 text-amber-700 border-amber-300',
  STOPPED: 'bg-rose-50 text-rose-700 border-rose-300',
  APPROVAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  FIRST_TRADING: 'bg-violet-50 text-violet-700 border-violet-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/**
 * Mapping trạng thái hồ sơ → mẫu được phép kết xuất, nguyên văn FR-006:
 * "Mẫu 01, 02 (Luồng yêu cầu BS/Dừng); Mẫu 03, 04, 05 và Nhắc nhở tuân thủ
 * (Luồng chấp thuận); Mẫu 06 (Luồng xác định Ngày GDĐT)."
 *
 * AC-006-4: ở mỗi trạng thái chỉ hiện các mẫu hợp lệ với trạng thái đó.
 */
const FORMS_BY_STATUS: Record<DossierStatus, string[]> = {
  RECEIVED: [],
  NEED_SUPPLEMENT: ['Mẫu số 01', 'Mẫu số 02'],
  STOPPED: ['Mẫu số 02'],
  APPROVAL: ['Mẫu số 03', 'Mẫu số 04', 'Mẫu số 05'],
  FIRST_TRADING: ['Mẫu số 06'],
  COMPLETED: ['Mẫu số 04', 'Mẫu số 05', 'Mẫu số 06'],
};

export const getAvailableForms = (status: DossierStatus): DossierFormSpec[] =>
  DOSSIER_FORMS.filter((form) => FORMS_BY_STATUS[status].includes(form.code));

/**
 * Số ngày kể từ khi tiếp nhận. Mốc 60 ngày là căn cứ phát hành Mẫu số 02.
 *
 * Lưu ý: URD tự bất nhất ở mốc này — Bước 5 ghi "60 ngày làm việc", Bước 7 và 7a
 * của cùng chức năng ghi "60 ngày" (PRD §13.4, §12.6 câu 26). Prototype tạm đếm
 * theo ngày lịch, chờ nghiệp vụ chốt.
 */
export const getDaysSinceReceived = (dossier: RegistrationDossier, today = new Date()): number => {
  const received = new Date(dossier.receivedDate);
  if (Number.isNaN(received.getTime())) return 0;
  const diffMs = today.getTime() - received.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export const DOSSIER_DEADLINE_DAYS = 60;

/**
 * Guard trình duyệt (FR-006 AC-006-1). Trả về lý do chặn bằng tiếng Việt để hiển
 * thị trên tooltip, hoặc null nếu được phép trình duyệt.
 */
export const getSubmitBlockReason = (dossier: RegistrationDossier): string | null => {
  if (dossier.feePaymentStatus !== 'CONFIRMED') {
    return 'Chưa thể trình duyệt: hồ sơ phải được cập nhật trạng thái "Đã thanh toán phí" trước khi trình Lãnh đạo (FR-006).';
  }
  if (dossier.status === 'STOPPED') {
    return 'Hồ sơ đã dừng xem xét, không trình duyệt được.';
  }
  return null;
};
