/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRoleCode } from '../types/hnx';

/**
 * Danh mục vai trò người dùng — nguồn hiển thị duy nhất cho màn hình phân quyền,
 * bảng quản lý tài khoản và dropdown chọn vai trò. Đối chiếu bảng "Người sử dụng
 * hệ thống" của URD (PRD v1.2 §2.1, §16 — 14 dòng).
 *
 * Thêm mã vai trò mới thì khai báo ở `UserRoleCode` rồi bổ sung một dòng tại đây,
 * đừng viết nhãn tiếng Việt rải rác trong từng màn hình.
 */
export interface RoleCatalogEntry {
  code: UserRoleCode;
  /** Nhãn hiển thị cho người dùng cuối. */
  labelVi: string;
  /** Đơn vị / nhóm để gom nhóm trong UI. */
  unitVi: string;
  descriptionVi: string;
}

export const ROLE_CATALOG: RoleCatalogEntry[] = [
  {
    code: 'ROLE_SYS_ADMIN',
    labelVi: 'Quản trị hệ thống (Admin)',
    unitVi: 'Quản trị',
    descriptionVi: 'Quản trị toàn hệ thống: tài khoản, phân quyền, cấu hình kỹ thuật.',
  },
  {
    code: 'ROLE_BIZ_ADMIN',
    labelVi: 'Quản trị nghiệp vụ phòng (Adp)',
    unitVi: 'Quản trị',
    descriptionVi: 'Quản trị nghiệp vụ trong phạm vi phòng: biểu mẫu, quy trình, quy tắc.',
  },
  {
    code: 'ROLE_QLNY_STAFF',
    labelVi: 'Chuyên viên P.QLNY',
    unitVi: 'P.QLNY — Quản lý Niêm yết',
    descriptionVi: 'Thẩm định hồ sơ niêm yết/ĐKGD, giám sát trạng thái, tính phí.',
  },
  {
    code: 'ROLE_QLNY_MANAGER',
    labelVi: 'Lãnh đạo P.QLNY',
    unitVi: 'P.QLNY — Quản lý Niêm yết',
    descriptionVi: 'Phê duyệt hồ sơ và quyết định thay đổi trạng thái chứng khoán.',
  },
  {
    code: 'ROLE_TTTP_STAFF',
    labelVi: 'Chuyên viên P.TTTP',
    unitVi: 'P.TTTP — Thị trường Trái phiếu',
    descriptionVi: 'Quản lý trái phiếu riêng lẻ, trái phiếu xanh và nghĩa vụ CBTT trái phiếu.',
  },
  {
    code: 'ROLE_TTTP_MANAGER',
    labelVi: 'Lãnh đạo P.TTTP',
    unitVi: 'P.TTTP — Thị trường Trái phiếu',
    descriptionVi: 'Phê duyệt hồ sơ và tin công bố thuộc thị trường trái phiếu.',
  },
  {
    code: 'ROLE_TTTT_STAFF',
    labelVi: 'Chuyên viên P.TTTT',
    unitVi: 'P.TTTT — Công bố Thông tin',
    descriptionVi: 'Tiếp nhận, soát xét tin công bố; xử lý vi phạm CBTT.',
  },
  {
    code: 'ROLE_TTTT_MANAGER',
    labelVi: 'Lãnh đạo P.TTTT',
    unitVi: 'P.TTTT — Công bố Thông tin',
    descriptionVi: 'Phê duyệt và quyết định công bố tin ra Corporate News.',
  },
  {
    code: 'ROLE_CNTT_STAFF',
    labelVi: 'Chuyên viên P.CNTT',
    unitVi: 'P.CNTT — Công nghệ Thông tin',
    descriptionVi:
      'Vận hành kỹ thuật hệ thống, theo dõi tình trạng dịch vụ và hỗ trợ người dùng.',
  },
  {
    code: 'ROLE_CNTT_MANAGER',
    labelVi: 'Lãnh đạo P.CNTT',
    unitVi: 'P.CNTT — Công nghệ Thông tin',
    descriptionVi:
      'Phụ trách vận hành CNTT của Sở; xem cấu hình hệ thống và tài khoản ở chế độ chỉ đọc.',
  },
  {
    code: 'ROLE_HTGD_STAFF',
    labelVi: 'Chuyên viên P.HTGD',
    unitVi: 'P.HTGD — Hỗ trợ Giao dịch',
    descriptionVi: 'Trao đổi dữ liệu giao dịch phục vụ nghiệp vụ niêm yết.',
  },
  {
    code: 'ROLE_HNX_EXEC',
    labelVi: 'Lãnh đạo Sở (BD)',
    unitVi: 'Ban Lãnh đạo HNX',
    descriptionVi: 'Lãnh đạo cấp cao HNX: xem toàn bộ số liệu và báo cáo tổng hợp.',
  },
  {
    code: 'ROLE_ORG_STAFF',
    labelVi: 'Chuyên viên doanh nghiệp',
    unitVi: 'Tổ chức niêm yết / ĐKGD',
    descriptionVi: 'Lập và nộp báo cáo, hồ sơ công bố thông tin của doanh nghiệp.',
  },
  {
    code: 'ROLE_ORG_MANAGER',
    labelVi: 'Lãnh đạo doanh nghiệp',
    unitVi: 'Tổ chức niêm yết / ĐKGD',
    descriptionVi: 'Duyệt nội bộ trước khi hồ sơ được gửi chính thức lên Sở.',
  },
  {
    code: 'ROLE_TREASURY',
    labelVi: 'Cán bộ Kho bạc Nhà nước',
    unitVi: 'Đơn vị ngoài',
    descriptionVi: 'Đối tượng sử dụng ngoài Sở, phục vụ nghiệp vụ trái phiếu Chính phủ.',
  },
  {
    code: 'ROLE_INVESTOR',
    labelVi: 'Nhà đầu tư / Cổ đông',
    unitVi: 'Đơn vị ngoài',
    descriptionVi: 'Tra cứu thông tin doanh nghiệp đã công bố.',
  },
  {
    code: 'ROLE_PUBLIC',
    labelVi: 'Người dùng công khai',
    unitVi: 'Đơn vị ngoài',
    descriptionVi: 'Truy cập Corporate News không cần đăng nhập.',
  },
];

const ROLE_LABEL_BY_CODE: Record<string, string> = ROLE_CATALOG.reduce(
  (acc, entry) => ({ ...acc, [entry.code]: entry.labelVi }),
  {} as Record<string, string>
);

/** Nhãn tiếng Việt của một mã vai trò; trả về chính mã nếu chưa khai báo. */
export const getRoleLabel = (code: string): string => ROLE_LABEL_BY_CODE[code] || code;
