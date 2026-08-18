/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CatalogItem,
  DictionaryEntry,
  HolidayEntry,
  FsTemplate,
  FsTemplateRow,
  FsTemplateCol,
  DataStructureTemplate,
  DataStructureField,
  Permission,
  RolePermission,
} from '../types/hnx';

/**
 * Dữ liệu mẫu cho khối quản trị metadata (FR-045 → FR-054, FR-057).
 *
 * `usageCount` không phải số trang trí: quy tắc X6 dùng nó để quyết định bản ghi
 * có xóa được hay không. Các số dưới đây được đặt sao cho mỗi màn hình đều có cả
 * bản ghi xóa được (0) lẫn bản ghi bị chặn (> 0) — nếu tất cả đều bằng 0 thì
 * nhánh chặn xóa không bao giờ chạy và lỗi ở đó sẽ không ai phát hiện.
 */

const base = (id: number, createdAt = '2026-01-05T02:00:00Z') => ({
  id,
  createdAt,
  createdBy: 1,
  versionNo: 1,
  isCurrent: true,
});

/* ────────────────────────────────────────────────────────────────────────────
 * FR-045 · Danh mục dùng chung
 *
 * PRD liệt kê 20 danh mục cần seed. `INITIAL_CATALOGS` trong mockData.ts đã có
 * INDUSTRY và NEWS_GROUP; phần dưới bổ sung các danh mục còn lại, nối tiếp id
 * từ 10 để không đụng id cũ.
 * ──────────────────────────────────────────────────────────────────────────── */

export const EXTRA_CATALOGS: CatalogItem[] = [
  // Ngành nghề — cấp 2, minh họa danh mục phân cấp (AC-045-3)
  { id: 10, catalogCode: 'INDUSTRY', code: 'IND_MFG_FOOD', nameVi: 'Chế biến thực phẩm', nameEn: 'Food Processing', parentCode: 'IND_MANUFACTURING', sortOrder: 1, isActive: true, usageCount: 4 },
  { id: 11, catalogCode: 'INDUSTRY', code: 'IND_MFG_STEEL', nameVi: 'Sản xuất thép', nameEn: 'Steel Production', parentCode: 'IND_MANUFACTURING', sortOrder: 2, isActive: true, usageCount: 3 },
  { id: 12, catalogCode: 'INDUSTRY', code: 'IND_FIN_SECURITIES', nameVi: 'Dịch vụ chứng khoán', nameEn: 'Securities Services', parentCode: 'IND_FINANCE', sortOrder: 1, isActive: true, usageCount: 6 },

  { id: 13, catalogCode: 'BOARD', code: 'HNX', nameVi: 'Sàn HNX', nameEn: 'HNX Board', sortOrder: 1, isActive: true, usageCount: 38 },
  { id: 14, catalogCode: 'BOARD', code: 'UPCOM', nameVi: 'Sàn UPCoM', nameEn: 'UPCoM Board', sortOrder: 2, isActive: true, usageCount: 52 },
  { id: 15, catalogCode: 'BOARD', code: 'PRIVATE_BOND', nameVi: 'Hệ thống GD TPDN riêng lẻ', nameEn: 'Private Bond System', sortOrder: 3, isActive: true, usageCount: 17 },

  { id: 16, catalogCode: 'SECURITY_TYPE', code: 'EQUITY', nameVi: 'Cổ phiếu', nameEn: 'Equity', sortOrder: 1, isActive: true, usageCount: 90 },
  { id: 17, catalogCode: 'SECURITY_TYPE', code: 'BOND_LISTED', nameVi: 'Trái phiếu niêm yết', nameEn: 'Listed Bond', sortOrder: 2, isActive: true, usageCount: 12 },
  { id: 18, catalogCode: 'SECURITY_TYPE', code: 'BOND_PRIVATE', nameVi: 'Trái phiếu riêng lẻ', nameEn: 'Private Bond', sortOrder: 3, isActive: true, usageCount: 17 },
  { id: 19, catalogCode: 'SECURITY_TYPE', code: 'BOND_GREEN', nameVi: 'Trái phiếu xanh', nameEn: 'Green Bond', sortOrder: 4, isActive: true, usageCount: 2 },

  { id: 20, catalogCode: 'ORG_TYPE', code: 'LISTED', nameVi: 'Tổ chức niêm yết', nameEn: 'Listed Organization', sortOrder: 1, isActive: true, usageCount: 38 },
  { id: 21, catalogCode: 'ORG_TYPE', code: 'UPCOM_REGISTERED', nameVi: 'Tổ chức ĐKGD UPCoM', nameEn: 'UPCoM Registered', sortOrder: 2, isActive: true, usageCount: 52 },
  { id: 22, catalogCode: 'ORG_TYPE', code: 'PRIVATE_BOND_ISSUER', nameVi: 'Tổ chức phát hành TPDN riêng lẻ', nameEn: 'Private Bond Issuer', sortOrder: 3, isActive: true, usageCount: 17 },

  { id: 23, catalogCode: 'RELATED_PARTY', code: 'RP_SPOUSE', nameVi: 'Vợ / chồng', nameEn: 'Spouse', sortOrder: 1, isActive: true, usageCount: 11 },
  { id: 24, catalogCode: 'RELATED_PARTY', code: 'RP_PARENT_CHILD', nameVi: 'Bố mẹ / con', nameEn: 'Parent / Child', sortOrder: 2, isActive: true, usageCount: 9 },
  { id: 25, catalogCode: 'RELATED_PARTY', code: 'RP_SUBSIDIARY', nameVi: 'Công ty con', nameEn: 'Subsidiary', sortOrder: 3, isActive: true, usageCount: 14 },

  { id: 26, catalogCode: 'VIOLATION_TYPE', code: 'VIO_LATE', nameVi: 'Chậm công bố thông tin', nameEn: 'Late Disclosure', sortOrder: 1, isActive: true, usageCount: 23 },
  { id: 27, catalogCode: 'VIOLATION_TYPE', code: 'VIO_MISSING', nameVi: 'Không công bố thông tin', nameEn: 'Missing Disclosure', sortOrder: 2, isActive: true, usageCount: 7 },
  { id: 28, catalogCode: 'VIOLATION_TYPE', code: 'VIO_INACCURATE', nameVi: 'Công bố sai lệch', nameEn: 'Inaccurate Disclosure', sortOrder: 3, isActive: true, usageCount: 3 },

  { id: 29, catalogCode: 'DELIST_REASON', code: 'DR_LOSS_3Y', nameVi: 'Lỗ 3 năm liên tiếp', nameEn: '3 Consecutive Loss Years', sortOrder: 1, isActive: true, usageCount: 2 },
  { id: 30, catalogCode: 'DELIST_REASON', code: 'DR_ACC_LOSS', nameVi: 'Lỗ lũy kế vượt vốn điều lệ', nameEn: 'Accumulated Loss Exceeds Charter Capital', sortOrder: 2, isActive: true, usageCount: 1 },
  { id: 31, catalogCode: 'DELIST_REASON', code: 'DR_VOLUNTARY', nameVi: 'Hủy niêm yết tự nguyện', nameEn: 'Voluntary Delisting', sortOrder: 3, isActive: true, usageCount: 1 },

  { id: 32, catalogCode: 'FEE_TYPE', code: 'FEE_INITIAL', nameVi: 'Phí niêm yết lần đầu', nameEn: 'Initial Listing Fee', sortOrder: 1, isActive: true, usageCount: 8 },
  { id: 33, catalogCode: 'FEE_TYPE', code: 'FEE_ANNUAL', nameVi: 'Phí duy trì niêm yết hằng năm', nameEn: 'Annual Maintenance Fee', sortOrder: 2, isActive: true, usageCount: 90 },
  { id: 34, catalogCode: 'FEE_TYPE', code: 'FEE_ADDITIONAL', nameVi: 'Phí niêm yết bổ sung', nameEn: 'Additional Listing Fee', sortOrder: 3, isActive: true, usageCount: 5 },

  { id: 35, catalogCode: 'CORP_ACTION', code: 'CA_DIVIDEND_CASH', nameVi: 'Trả cổ tức bằng tiền', nameEn: 'Cash Dividend', sortOrder: 1, isActive: true, usageCount: 31 },
  { id: 36, catalogCode: 'CORP_ACTION', code: 'CA_DIVIDEND_STOCK', nameVi: 'Trả cổ tức bằng cổ phiếu', nameEn: 'Stock Dividend', sortOrder: 2, isActive: true, usageCount: 12 },
  { id: 37, catalogCode: 'CORP_ACTION', code: 'CA_AGM', nameVi: 'Họp Đại hội đồng cổ đông', nameEn: 'General Meeting', sortOrder: 3, isActive: true, usageCount: 40 },

  { id: 38, catalogCode: 'PERIOD', code: 'Q1', nameVi: 'Quý 1', nameEn: 'Quarter 1', sortOrder: 1, isActive: true, usageCount: 88 },
  { id: 39, catalogCode: 'PERIOD', code: 'Q2', nameVi: 'Quý 2', nameEn: 'Quarter 2', sortOrder: 2, isActive: true, usageCount: 88 },
  { id: 40, catalogCode: 'PERIOD', code: 'SEMI', nameVi: 'Bán niên', nameEn: 'Semi-annual', sortOrder: 3, isActive: true, usageCount: 88 },
  { id: 41, catalogCode: 'PERIOD', code: 'YEAR', nameVi: 'Năm', nameEn: 'Annual', sortOrder: 4, isActive: true, usageCount: 88 },

  { id: 42, catalogCode: 'AUDIT_OPINION', code: 'AO_UNQUALIFIED', nameVi: 'Chấp nhận toàn phần', nameEn: 'Unqualified', sortOrder: 1, isActive: true, usageCount: 70 },
  { id: 43, catalogCode: 'AUDIT_OPINION', code: 'AO_QUALIFIED', nameVi: 'Ngoại trừ', nameEn: 'Qualified', sortOrder: 2, isActive: true, usageCount: 14 },
  { id: 44, catalogCode: 'AUDIT_OPINION', code: 'AO_ADVERSE', nameVi: 'Trái ngược', nameEn: 'Adverse', sortOrder: 3, isActive: true, usageCount: 1 },
  { id: 45, catalogCode: 'AUDIT_OPINION', code: 'AO_DISCLAIMER', nameVi: 'Từ chối đưa ý kiến', nameEn: 'Disclaimer', sortOrder: 4, isActive: true, usageCount: 2 },

  { id: 46, catalogCode: 'UNIT', code: 'P_QLNY', nameVi: 'Phòng Quản lý Niêm yết', nameEn: 'Listing Management Dept.', sortOrder: 1, isActive: true, usageCount: 12 },
  { id: 47, catalogCode: 'UNIT', code: 'P_TTTP', nameVi: 'Phòng Thị trường Trái phiếu', nameEn: 'Bond Market Dept.', sortOrder: 2, isActive: true, usageCount: 6 },
  { id: 48, catalogCode: 'UNIT', code: 'P_TTTT', nameVi: 'Phòng Công bố Thông tin', nameEn: 'Disclosure Dept.', sortOrder: 3, isActive: true, usageCount: 9 },
  { id: 49, catalogCode: 'UNIT', code: 'P_CNTT', nameVi: 'Phòng Công nghệ Thông tin', nameEn: 'IT Dept.', sortOrder: 4, isActive: true, usageCount: 4 },

  { id: 50, catalogCode: 'ATTACHMENT_TYPE', code: 'AT_PDF_SIGNED', nameVi: 'Văn bản ký số (PDF)', nameEn: 'Digitally Signed PDF', sortOrder: 1, isActive: true, usageCount: 120 },
  { id: 51, catalogCode: 'ATTACHMENT_TYPE', code: 'AT_XLSX', nameVi: 'Bảng tính (XLSX)', nameEn: 'Spreadsheet', sortOrder: 2, isActive: true, usageCount: 45 },
  // Chưa dùng — dòng duy nhất xóa được, để thử nhánh xóa thành công.
  { id: 52, catalogCode: 'ATTACHMENT_TYPE', code: 'AT_XBRL', nameVi: 'Tệp XBRL', nameEn: 'XBRL File', sortOrder: 3, isActive: true, usageCount: 0 },
  // Đã inactive — bản ghi cũ vẫn hiện đúng tên nhưng không vào dropdown (AC-045-2).
  { id: 53, catalogCode: 'ATTACHMENT_TYPE', code: 'AT_DOC_LEGACY', nameVi: 'Văn bản Word (ngừng dùng)', nameEn: 'Legacy Word Document', sortOrder: 4, isActive: false, usageCount: 8 },
];

/* ────────────────────────────────────────────────────────────────────────────
 * FR-052 · Từ điển dữ liệu
 *
 * PRD nêu rõ đây là nguồn để AI mở rộng viết tắt (FR-032), nên danh sách dưới
 * đây bám đúng các viết tắt PRD liệt kê thay vì thuật ngữ chung chung.
 * ──────────────────────────────────────────────────────────────────────────── */

const dict = (
  id: number,
  termCode: string,
  termValue: string,
  termType: DictionaryEntry['termType'],
  description: string,
  usageCount: number,
): DictionaryEntry => ({ ...base(id), termCode, termValue, termType, description, isActive: true, usageCount });

export const INITIAL_DICTIONARY: DictionaryEntry[] = [
  dict(1, 'BCTC', 'Báo cáo tài chính', 'ABBREVIATION', 'Báo cáo tài chính quý / bán niên / năm.', 96),
  dict(2, 'ĐHĐCĐ', 'Đại hội đồng cổ đông', 'ABBREVIATION', 'Cơ quan quyết định cao nhất của công ty cổ phần.', 40),
  dict(3, 'ĐKGD', 'Đăng ký giao dịch', 'ABBREVIATION', 'Đăng ký giao dịch trên UPCoM hoặc hệ thống TPDN riêng lẻ.', 63),
  dict(4, 'ĐKNY', 'Đăng ký niêm yết', 'ABBREVIATION', 'Đăng ký niêm yết chứng khoán trên sàn HNX.', 38),
  dict(5, 'ĐKCC', 'Đăng ký cuối cùng', 'ABBREVIATION', 'Ngày đăng ký cuối cùng để chốt danh sách cổ đông.', 31),
  dict(6, 'CBTT', 'Công bố thông tin', 'ABBREVIATION', 'Nghĩa vụ công bố theo Thông tư 96/2020/TT-BTC.', 210),
  dict(7, 'NCLQ', 'Người có liên quan', 'ABBREVIATION', 'Cá nhân/tổ chức có quan hệ theo Luật Chứng khoán.', 28),
  dict(8, 'NNB', 'Người nội bộ', 'ABBREVIATION', 'Thành viên HĐQT, BKS, BĐH và các chức danh quản lý.', 24),
  dict(9, 'CĐL', 'Cổ đông lớn', 'ABBREVIATION', 'Cổ đông sở hữu từ 5% trở lên cổ phiếu có quyền biểu quyết.', 19),
  dict(10, 'KKQ', 'Không được ký quỹ', 'ABBREVIATION', 'Chứng khoán không đủ điều kiện giao dịch ký quỹ.', 11),
  dict(11, 'TCPH', 'Tổ chức phát hành', 'ABBREVIATION', 'Tổ chức phát hành chứng khoán.', 55),
  dict(12, 'TPDN', 'Trái phiếu doanh nghiệp', 'ABBREVIATION', 'Trái phiếu do doanh nghiệp phát hành.', 34),
  dict(13, 'LNST', 'Lợi nhuận sau thuế', 'ABBREVIATION', 'Chỉ tiêu dùng trong rule hủy niêm yết bắt buộc.', 47),
  dict(14, 'VĐL', 'Vốn điều lệ', 'ABBREVIATION', 'Cơ sở so sánh lỗ lũy kế trong rule giám sát.', 43),
  dict(15, 'UBCKNN', 'Ủy ban Chứng khoán Nhà nước', 'ABBREVIATION', 'Cơ quan quản lý nhà nước về chứng khoán.', 22),
  dict(16, 'VSDC', 'Tổng công ty Lưu ký và Bù trừ chứng khoán Việt Nam', 'ABBREVIATION', 'Đơn vị lưu ký, bù trừ và thanh toán.', 18),
  dict(17, 'CTĐC', 'Công ty đại chúng', 'ABBREVIATION', 'Công ty đáp ứng điều kiện đại chúng theo Luật Chứng khoán.', 26),
  dict(18, 'ESOP', 'Cổ phiếu phát hành cho người lao động', 'ABBREVIATION', 'Employee Stock Ownership Plan.', 7),
  dict(19, 'NYBS', 'Niêm yết bổ sung', 'ABBREVIATION', 'Niêm yết thêm chứng khoán trên nền mã đã niêm yết.', 9),
  dict(20, 'GDKHQ', 'Giao dịch không hưởng quyền', 'ABBREVIATION', 'Ngày giao dịch không hưởng quyền, tính theo chu kỳ T+2.', 31),
  dict(21, 'SLA', 'Thời hạn xử lý cam kết', 'ABBREVIATION', 'Service Level Agreement — hạn xử lý từng bước quy trình.', 16),
  dict(22, 'TT96', 'Thông tư 96/2020/TT-BTC', 'LEGAL_REF', 'Hướng dẫn công bố thông tin trên thị trường chứng khoán.', 88),
  dict(23, 'NĐ155', 'Nghị định 155/2020/NĐ-BTC', 'LEGAL_REF', 'Quy định chi tiết thi hành Luật Chứng khoán.', 52),
  // Chưa dùng — để thử nhánh xóa thành công.
  { ...dict(24, 'XBRL', 'eXtensible Business Reporting Language', 'TERM', 'Chuẩn dữ liệu báo cáo tài chính, dự kiến áp dụng sau.', 0) },
];

/* ────────────────────────────────────────────────────────────────────────────
 * FR-053 · Ngày nghỉ
 *
 * Đồng bộ với HOLIDAYS_2026 trong services/businessCalendar.ts. Khi màn hình
 * này sửa dữ liệu, App gọi calendarService.setHolidays() để lịch nghiệp vụ dùng
 * đúng bản mới — nếu không, sửa ở đây sẽ không có tác dụng gì (AC-053-4).
 * ──────────────────────────────────────────────────────────────────────────── */

const hol = (
  id: number,
  fromDate: string,
  toDate: string,
  holidayType: HolidayEntry['holidayType'],
  nameVi: string,
  legalBasis: string,
  usageCount: number,
): HolidayEntry => ({
  ...base(id),
  fromDate,
  toDate,
  year: Number(fromDate.slice(0, 4)),
  holidayType,
  nameVi,
  legalBasis,
  usageCount,
});

export const INITIAL_HOLIDAYS: HolidayEntry[] = [
  hol(1, '2026-01-01', '2026-01-01', 'HOLIDAY', 'Tết Dương lịch', 'Bộ luật Lao động 2019, Điều 112', 12),
  hol(2, '2026-02-16', '2026-02-20', 'HOLIDAY', 'Tết Nguyên đán 2026', 'Bộ luật Lao động 2019, Điều 112', 45),
  hol(3, '2026-02-28', '2026-02-28', 'MAKEUP_WORKDAY', 'Thứ Bảy làm bù Tết', 'Thông báo nghỉ Tết của Bộ LĐTBXH', 6),
  hol(4, '2026-04-26', '2026-04-26', 'HOLIDAY', 'Giỗ Tổ Hùng Vương', 'Bộ luật Lao động 2019, Điều 112', 8),
  hol(5, '2026-04-30', '2026-05-01', 'HOLIDAY', 'Ngày Giải phóng & Quốc tế Lao động', 'Bộ luật Lao động 2019, Điều 112', 15),
  hol(6, '2026-09-02', '2026-09-02', 'HOLIDAY', 'Quốc khánh', 'Bộ luật Lao động 2019, Điều 112', 10),
  // Năm sau — chưa nghĩa vụ nào chốt hạn theo, nên xóa được.
  hol(7, '2027-01-01', '2027-01-01', 'HOLIDAY', 'Tết Dương lịch 2027', 'Bộ luật Lao động 2019, Điều 112', 0),
];

/* ────────────────────────────────────────────────────────────────────────────
 * FR-049 · Mẫu báo cáo tài chính
 * ──────────────────────────────────────────────────────────────────────────── */

export const INITIAL_FS_TEMPLATES: FsTemplate[] = [
  { ...base(1), templateCode: 'FS_BS_QUY', nameVi: 'Bảng cân đối kế toán — Quý', fsType: 'BALANCE_SHEET', periodType: 'QUARTER', isActive: true, usageCount: 88 },
  { ...base(2), templateCode: 'FS_IS_QUY', nameVi: 'Báo cáo kết quả hoạt động kinh doanh — Quý', fsType: 'INCOME_STATEMENT', periodType: 'QUARTER', isActive: true, usageCount: 88 },
  { ...base(3), templateCode: 'FS_CF_NAM', nameVi: 'Báo cáo lưu chuyển tiền tệ — Năm', fsType: 'CASH_FLOW', periodType: 'ANNUAL', isActive: true, usageCount: 34 },
  { ...base(4), templateCode: 'FS_BS_NAM_2027', nameVi: 'Bảng cân đối kế toán — Năm 2027 (dự thảo)', fsType: 'BALANCE_SHEET', periodType: 'ANNUAL', isActive: false, usageCount: 0 },
];

/**
 * Chỉ tiêu hàng của FS_BS_QUY. `formulaExpr` dùng cú pháp tham chiếu mã chỉ tiêu
 * theo PRD: `[100] + [200]`. Các ô có công thức là ô tính tự động, ô rỗng là ô
 * nhập tay.
 */
export const INITIAL_FS_ROWS: FsTemplateRow[] = [
  { id: 1, fsTemplateId: 1, rowCode: '100', nameVi: 'A. TÀI SẢN NGẮN HẠN', level: 1, sortOrder: 1, dataType: 'NUMBER', formulaExpr: '[110] + [120] + [130] + [140]' },
  { id: 2, fsTemplateId: 1, rowCode: '110', nameVi: 'I. Tiền và tương đương tiền', level: 2, sortOrder: 2, dataType: 'NUMBER' },
  { id: 3, fsTemplateId: 1, rowCode: '120', nameVi: 'II. Đầu tư tài chính ngắn hạn', level: 2, sortOrder: 3, dataType: 'NUMBER' },
  { id: 4, fsTemplateId: 1, rowCode: '130', nameVi: 'III. Các khoản phải thu ngắn hạn', level: 2, sortOrder: 4, dataType: 'NUMBER' },
  { id: 5, fsTemplateId: 1, rowCode: '140', nameVi: 'IV. Hàng tồn kho', level: 2, sortOrder: 5, dataType: 'NUMBER' },
  { id: 6, fsTemplateId: 1, rowCode: '200', nameVi: 'B. TÀI SẢN DÀI HẠN', level: 1, sortOrder: 6, dataType: 'NUMBER', formulaExpr: '[210] + [220]' },
  { id: 7, fsTemplateId: 1, rowCode: '210', nameVi: 'I. Tài sản cố định', level: 2, sortOrder: 7, dataType: 'NUMBER' },
  { id: 8, fsTemplateId: 1, rowCode: '220', nameVi: 'II. Đầu tư tài chính dài hạn', level: 2, sortOrder: 8, dataType: 'NUMBER' },
  { id: 9, fsTemplateId: 1, rowCode: '270', nameVi: 'TỔNG CỘNG TÀI SẢN', level: 1, sortOrder: 9, dataType: 'NUMBER', formulaExpr: '[100] + [200]' },
  { id: 10, fsTemplateId: 1, rowCode: '300', nameVi: 'C. NỢ PHẢI TRẢ', level: 1, sortOrder: 10, dataType: 'NUMBER' },
  { id: 11, fsTemplateId: 1, rowCode: '400', nameVi: 'D. VỐN CHỦ SỞ HỮU', level: 1, sortOrder: 11, dataType: 'NUMBER' },
  { id: 12, fsTemplateId: 1, rowCode: '440', nameVi: 'TỔNG CỘNG NGUỒN VỐN', level: 1, sortOrder: 12, dataType: 'NUMBER', formulaExpr: '[300] + [400]' },

  { id: 13, fsTemplateId: 2, rowCode: '01', nameVi: 'Doanh thu bán hàng và cung cấp dịch vụ', level: 1, sortOrder: 1, dataType: 'NUMBER' },
  { id: 14, fsTemplateId: 2, rowCode: '02', nameVi: 'Các khoản giảm trừ doanh thu', level: 1, sortOrder: 2, dataType: 'NUMBER' },
  { id: 15, fsTemplateId: 2, rowCode: '10', nameVi: 'Doanh thu thuần', level: 1, sortOrder: 3, dataType: 'NUMBER', formulaExpr: '[01] - [02]' },
  { id: 16, fsTemplateId: 2, rowCode: '11', nameVi: 'Giá vốn hàng bán', level: 1, sortOrder: 4, dataType: 'NUMBER' },
  { id: 17, fsTemplateId: 2, rowCode: '20', nameVi: 'Lợi nhuận gộp', level: 1, sortOrder: 5, dataType: 'NUMBER', formulaExpr: '[10] - [11]' },
  { id: 18, fsTemplateId: 2, rowCode: '60', nameVi: 'Lợi nhuận sau thuế TNDN', level: 1, sortOrder: 6, dataType: 'NUMBER' },
];

export const INITIAL_FS_COLS: FsTemplateCol[] = [
  { id: 1, fsTemplateId: 1, colCode: 'CURRENT', nameVi: 'Số cuối kỳ', sortOrder: 1 },
  { id: 2, fsTemplateId: 1, colCode: 'PRIOR_PERIOD', nameVi: 'Số đầu năm', sortOrder: 2 },
  { id: 3, fsTemplateId: 1, colCode: 'NOTE', nameVi: 'Thuyết minh', sortOrder: 3 },
  { id: 4, fsTemplateId: 2, colCode: 'CURRENT', nameVi: 'Kỳ này', sortOrder: 1 },
  { id: 5, fsTemplateId: 2, colCode: 'PRIOR_PERIOD', nameVi: 'Kỳ trước', sortOrder: 2 },
];

/* ────────────────────────────────────────────────────────────────────────────
 * FR-050 / FR-051 · Mẫu cấu trúc dữ liệu và trường chi tiết
 * ──────────────────────────────────────────────────────────────────────────── */

export const INITIAL_DATA_STRUCTURES: DataStructureTemplate[] = [
  { ...base(1), structCode: 'DS_SHAREHOLDER', nameVi: 'Danh sách cổ đông lớn', targetEntity: 'SecurityOwnership', isActive: true, usageCount: 19 },
  { ...base(2), structCode: 'DS_BOND_SCHEDULE', nameVi: 'Lịch thanh toán gốc/lãi trái phiếu', targetEntity: 'BondPaymentSchedule', isActive: true, usageCount: 17 },
  { ...base(3), structCode: 'DS_RELATED_PARTY', nameVi: 'Danh sách người có liên quan', targetEntity: 'Investor', isActive: true, usageCount: 28 },
  { ...base(4), structCode: 'DS_ESOP', nameVi: 'Danh sách phân bổ ESOP', targetEntity: 'SecurityOwnership', isActive: true, usageCount: 0 },
];

export const INITIAL_DATA_STRUCT_FIELDS: DataStructureField[] = [
  { id: 1, structTemplateId: 1, fieldCode: 'holderName', nameVi: 'Tên cổ đông', dataType: 'TEXT', isRequired: true, sortOrder: 1 },
  { id: 2, structTemplateId: 1, fieldCode: 'idNumber', nameVi: 'Số CCCD / MST', dataType: 'TEXT', isRequired: true, sortOrder: 2 },
  { id: 3, structTemplateId: 1, fieldCode: 'shareCount', nameVi: 'Số lượng cổ phiếu', dataType: 'NUMBER', isRequired: true, sortOrder: 3 },
  { id: 4, structTemplateId: 1, fieldCode: 'ownershipPct', nameVi: 'Tỷ lệ sở hữu (%)', dataType: 'NUMBER', isRequired: true, sortOrder: 4 },
  { id: 5, structTemplateId: 1, fieldCode: 'holderRole', nameVi: 'Vai trò cổ đông', dataType: 'PICKLIST', lookupCatalogCode: 'RELATED_PARTY', isRequired: false, sortOrder: 5 },

  { id: 6, structTemplateId: 2, fieldCode: 'payDate', nameVi: 'Ngày thanh toán', dataType: 'DATE', isRequired: true, sortOrder: 1 },
  { id: 7, structTemplateId: 2, fieldCode: 'principalAmount', nameVi: 'Tiền gốc', dataType: 'NUMBER', isRequired: true, sortOrder: 2 },
  { id: 8, structTemplateId: 2, fieldCode: 'interestAmount', nameVi: 'Tiền lãi', dataType: 'NUMBER', isRequired: true, sortOrder: 3 },
  { id: 9, structTemplateId: 2, fieldCode: 'isPaid', nameVi: 'Đã thanh toán', dataType: 'BOOLEAN', isRequired: false, sortOrder: 4 },

  { id: 10, structTemplateId: 3, fieldCode: 'partyName', nameVi: 'Tên người có liên quan', dataType: 'TEXT', isRequired: true, sortOrder: 1 },
  { id: 11, structTemplateId: 3, fieldCode: 'relationType', nameVi: 'Quan hệ', dataType: 'PICKLIST', lookupCatalogCode: 'RELATED_PARTY', isRequired: true, sortOrder: 2 },
];

/* ────────────────────────────────────────────────────────────────────────────
 * FR-057 · Quyền chức năng (trục 1 của AuthZ Engine)
 * ──────────────────────────────────────────────────────────────────────────── */

const perm = (id: number, resourceType: string, action: string, nameVi: string, moduleCode: string): Permission => ({
  id,
  permissionCode: `${resourceType}.${action}`,
  resourceType,
  action,
  nameVi,
  moduleCode,
  isActive: true,
});

export const INITIAL_PERMISSIONS: Permission[] = [
  perm(1, 'SUBMISSION', 'VIEW', 'Xem hồ sơ công bố thông tin', 'TTTT'),
  perm(2, 'SUBMISSION', 'CREATE', 'Tạo hồ sơ công bố thông tin', 'TTTT'),
  perm(3, 'SUBMISSION', 'REVIEW', 'Soát xét hồ sơ', 'TTTT'),
  perm(4, 'SUBMISSION', 'APPROVE', 'Phê duyệt hồ sơ', 'TTTT'),
  perm(5, 'SUBMISSION', 'PUBLISH', 'Công bố hồ sơ ra Corporate News', 'TTTT'),
  perm(6, 'ORGANIZATION', 'VIEW', 'Xem hồ sơ tổ chức', 'QLNY'),
  perm(7, 'ORGANIZATION', 'EDIT', 'Sửa hồ sơ tổ chức', 'QLNY'),
  perm(8, 'SECURITY', 'VIEW', 'Xem hồ sơ chứng khoán', 'QLNY'),
  perm(9, 'SECURITY', 'EDIT', 'Sửa hồ sơ chứng khoán', 'QLNY'),
  perm(10, 'SURVEILLANCE', 'VIEW', 'Xem kết quả giám sát', 'QLNY'),
  perm(11, 'SURVEILLANCE', 'DECIDE', 'Ra quyết định trạng thái chứng khoán', 'QLNY'),
  perm(12, 'BOND', 'VIEW', 'Xem hồ sơ trái phiếu', 'TTTP'),
  perm(13, 'BOND', 'EDIT', 'Sửa hồ sơ trái phiếu', 'TTTP'),
  perm(14, 'METADATA', 'VIEW', 'Xem cấu hình metadata', 'ADMIN'),
  perm(15, 'METADATA', 'EDIT', 'Sửa cấu hình metadata', 'ADMIN'),
  perm(16, 'USER', 'VIEW', 'Xem tài khoản người dùng', 'ADMIN'),
  perm(17, 'USER', 'EDIT', 'Sửa tài khoản người dùng', 'ADMIN'),
  perm(18, 'AUDIT', 'VIEW', 'Xem nhật ký audit', 'ADMIN'),
];

/**
 * `allowedStatuses` minh họa trục 3: cùng quyền EDIT nhưng chuyên viên chỉ sửa
 * được khi hồ sơ còn ở trạng thái nháp/bị trả lại, còn lãnh đạo thì không bị
 * ràng buộc trạng thái.
 */
export const INITIAL_ROLE_PERMISSIONS: RolePermission[] = [
  { id: 1, roleCode: 'ROLE_TTTT_STAFF', permissionId: 1, allowedStatuses: null, effect: 'ALLOW' },
  { id: 2, roleCode: 'ROLE_TTTT_STAFF', permissionId: 3, allowedStatuses: ['SUBMITTED'], effect: 'ALLOW' },
  { id: 3, roleCode: 'ROLE_TTTT_MANAGER', permissionId: 4, allowedStatuses: ['REVIEWED', 'PENDING_APPROVAL'], effect: 'ALLOW' },
  { id: 4, roleCode: 'ROLE_TTTT_MANAGER', permissionId: 5, allowedStatuses: ['APPROVED'], effect: 'ALLOW' },
  { id: 5, roleCode: 'ROLE_QLNY_STAFF', permissionId: 8, allowedStatuses: null, effect: 'ALLOW' },
  { id: 6, roleCode: 'ROLE_QLNY_STAFF', permissionId: 9, allowedStatuses: ['DRAFT', 'RETURNED'], effect: 'ALLOW' },
  { id: 7, roleCode: 'ROLE_QLNY_MANAGER', permissionId: 11, allowedStatuses: null, effect: 'ALLOW' },
  { id: 8, roleCode: 'ROLE_TTTP_STAFF', permissionId: 12, allowedStatuses: null, effect: 'ALLOW' },
  { id: 9, roleCode: 'ROLE_TTTP_STAFF', permissionId: 13, allowedStatuses: ['DRAFT'], effect: 'ALLOW' },
  { id: 10, roleCode: 'ROLE_SYS_ADMIN', permissionId: 15, allowedStatuses: null, effect: 'ALLOW' },
  { id: 11, roleCode: 'ROLE_SYS_ADMIN', permissionId: 17, allowedStatuses: null, effect: 'ALLOW' },
  { id: 12, roleCode: 'ROLE_CNTT_MANAGER', permissionId: 14, allowedStatuses: null, effect: 'ALLOW' },
  { id: 13, roleCode: 'ROLE_CNTT_MANAGER', permissionId: 18, allowedStatuses: null, effect: 'ALLOW' },
  // DENY thắng ALLOW — minh họa quy tắc gộp quyền của AuthZ Engine.
  { id: 14, roleCode: 'ROLE_CNTT_MANAGER', permissionId: 15, allowedStatuses: null, effect: 'DENY' },
];
