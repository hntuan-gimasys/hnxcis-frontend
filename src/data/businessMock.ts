/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Investor,
  SecurityOwnership,
  TradingViolation,
  ListingStatusCase,
  MarginIneligibleEntry,
  SurveyDefinition,
  SurveyResultSummary,
  TemplateDefinition,
} from '../types/hnx';

/**
 * Dữ liệu mẫu cho các nghiệp vụ chưa có màn hình trước đây:
 * FR-003, FR-005, FR-007, FR-009, FR-012 → FR-015, FR-026, FR-028, FR-029.
 *
 * Mã tổ chức dùng lại id trong INITIAL_ORGANIZATIONS: 1 Vinamilk · 2 Hòa Phát ·
 * 3 Vingroup · 4 AlphaTech · 5 BOG.
 */

const base = (id: number, createdAt: string) => ({
  id,
  createdAt,
  createdBy: 1,
  versionNo: 1,
  isCurrent: true,
});

/* FR-026 · Nhà đầu tư / người có liên quan ──────────────────────────────── */

export const INITIAL_INVESTORS: Investor[] = [
  { ...base(1, '2025-03-02T00:00:00Z'), investorType: 'INDIVIDUAL', identityNo: '001085001234', identityType: 'CITIZEN_ID', fullName: 'Nguyễn Thị Lan Anh', nationality: 'VN', address: 'Quận 1, TP. Hồ Chí Minh', phone: '0903111222', email: 'lananh@example.vn', linkedOrgId: 1 },
  { ...base(2, '2025-03-02T00:00:00Z'), investorType: 'INDIVIDUAL', identityNo: '001079005678', identityType: 'CITIZEN_ID', fullName: 'Trần Quốc Hùng', nationality: 'VN', address: 'Quận Hoàn Kiếm, Hà Nội', phone: '0904222333', linkedOrgId: 2 },
  { ...base(3, '2025-04-11T00:00:00Z'), investorType: 'ORGANIZATION', identityNo: '0301234567', identityType: 'TAX_CODE', fullName: 'Công ty TNHH Đầu tư Bảo Tín', fullNameEn: 'Bao Tin Investment Co., Ltd', nationality: 'VN', address: 'Quận 3, TP. Hồ Chí Minh', email: 'ir@baotin.vn', linkedOrgId: 1 },
  { ...base(4, '2025-05-20T00:00:00Z'), investorType: 'ORGANIZATION', identityNo: 'F0-88213', identityType: 'PASSPORT', fullName: 'Dragon Capital Vietnam Fund', nationality: 'GB', address: 'London, United Kingdom', email: 'ops@dragoncapital.com' },
  { ...base(5, '2025-06-01T00:00:00Z'), investorType: 'INDIVIDUAL', identityNo: '001090009999', identityType: 'CITIZEN_ID', fullName: 'Phạm Minh Đức', nationality: 'VN', address: 'Quận Cầu Giấy, Hà Nội', phone: '0905333444', linkedOrgId: 3 },
  { ...base(6, '2025-07-15T00:00:00Z'), investorType: 'ORGANIZATION', identityNo: '0100109106', identityType: 'TAX_CODE', fullName: 'Tổng công ty Đầu tư và Kinh doanh vốn Nhà nước (SCIC)', nationality: 'VN', address: 'Ba Đình, Hà Nội', email: 'contact@scic.vn' },
];

/* FR-003 · Sở hữu chứng khoán ───────────────────────────────────────────── */

export const INITIAL_OWNERSHIPS: SecurityOwnership[] = [
  { ...base(1, '2026-06-30T00:00:00Z'), securityId: 1, investorId: 6, holderRole: 'STATE', quantity: 76_000_000, ownershipPct: 36.0, asOfDate: '2026-06-30' },
  { ...base(2, '2026-06-30T00:00:00Z'), securityId: 1, investorId: 4, holderRole: 'FOREIGN', quantity: 22_500_000, ownershipPct: 10.65, asOfDate: '2026-06-30' },
  { ...base(3, '2026-06-30T00:00:00Z'), securityId: 1, investorId: 1, holderRole: 'INTERNAL', quantity: 1_250_000, ownershipPct: 0.59, asOfDate: '2026-06-30' },
  { ...base(4, '2026-06-30T00:00:00Z'), securityId: 1, investorId: 3, holderRole: 'RELATED', quantity: 11_000_000, ownershipPct: 5.21, asOfDate: '2026-06-30' },
  { ...base(5, '2026-06-30T00:00:00Z'), securityId: 2, investorId: 2, holderRole: 'MAJOR_SHAREHOLDER', quantity: 180_000_000, ownershipPct: 26.8, asOfDate: '2026-06-30' },
  { ...base(6, '2026-06-30T00:00:00Z'), securityId: 3, investorId: 5, holderRole: 'INTERNAL', quantity: 3_400_000, ownershipPct: 0.88, asOfDate: '2026-06-30' },
  { ...base(7, '2026-03-31T00:00:00Z'), securityId: 1, investorId: 4, holderRole: 'FOREIGN', quantity: 19_800_000, ownershipPct: 9.38, asOfDate: '2026-03-31', unlinkedAt: '2026-06-30T00:00:00Z', unlinkReason: 'Đã thay bằng bản chốt ngày 30/06/2026' },
];

/* FR-007 · Vi phạm giao dịch ────────────────────────────────────────────── */

export const INITIAL_TRADING_VIOLATIONS: TradingViolation[] = [
  {
    ...base(1, '2026-07-14T00:00:00Z'), violationNo: 'TVIO-2026-018', organizationId: 1, symbol: 'VNM',
    violatorName: 'Nguyễn Thị Lan Anh', violatorRole: 'INTERNAL', violationType: 'NO_PRIOR_NOTICE',
    occurredDate: '2026-07-10', detectedDate: '2026-07-14', quantity: 150_000,
    description: 'Bán 150.000 cổ phiếu VNM mà không công bố thông tin trước 3 ngày làm việc theo Điều 33 Thông tư 96/2020/TT-BTC.',
    status: 'NOTIFIED',
  },
  {
    ...base(2, '2026-06-22T00:00:00Z'), violationNo: 'TVIO-2026-014', organizationId: 2, symbol: 'HPG',
    violatorName: 'Trần Quốc Hùng', violatorRole: 'MAJOR_SHAREHOLDER', violationType: 'EXCEED_REGISTERED',
    occurredDate: '2026-06-18', detectedDate: '2026-06-22', quantity: 2_400_000,
    description: 'Mua vượt 2.400.000 cổ phiếu so với khối lượng đã đăng ký giao dịch.',
    status: 'SANCTIONED', sanctionRef: 'QĐ-118/QĐ-SGDHN',
  },
  {
    ...base(3, '2026-05-30T00:00:00Z'), violationNo: 'TVIO-2026-011', organizationId: 3, symbol: 'VIC',
    violatorName: 'Phạm Minh Đức', violatorRole: 'INTERNAL', violationType: 'NO_RESULT_REPORT',
    occurredDate: '2026-05-20', detectedDate: '2026-05-30', quantity: 500_000,
    description: 'Không báo cáo kết quả giao dịch trong 5 ngày làm việc kể từ ngày kết thúc giao dịch.',
    status: 'EXPLAINED',
  },
  {
    ...base(4, '2026-08-05T00:00:00Z'), violationNo: 'TVIO-2026-021', organizationId: 5, symbol: 'BOG',
    violatorName: 'Công ty TNHH Đầu tư Bảo Tín', violatorRole: 'RELATED', violationType: 'TRADE_IN_BLACKOUT',
    occurredDate: '2026-08-03', detectedDate: '2026-08-05', quantity: 800_000,
    description: 'Giao dịch trong thời gian hạn chế trước khi công bố báo cáo tài chính bán niên.',
    status: 'DETECTED',
  },
];

/* FR-005, FR-009, FR-012, FR-013 · Hồ sơ xử lý trạng thái ───────────────── */

export const INITIAL_STATUS_CASES: ListingStatusCase[] = [
  {
    ...base(1, '2026-07-01T00:00:00Z'), caseNo: 'RELIST-2026-003', caseType: 'RELIST', organizationId: 5, symbol: 'BOG',
    reasonCode: 'RELIST_PROFIT_RECOVERED', reasonText: 'Đã có lãi trở lại trong 2 quý liên tiếp và khắc phục ý kiến kiểm toán ngoại trừ.',
    legalBasis: 'Điều 46 Quy chế Niêm yết HNX', ruleCode: 'RELIST_ASSET_35',
    receivedDate: '2026-07-01', appraisalDueDate: '2026-07-29', status: 'APPRAISING', assigneeName: 'Chị Hương - P.QLNY',
  },
  {
    ...base(2, '2026-06-10T00:00:00Z'), caseNo: 'BDELIST-2026-007', caseType: 'BOND_DELIST', organizationId: 2, symbol: 'HPGB2026',
    reasonCode: 'BDELIST_MATURED', reasonText: 'Trái phiếu đáo hạn ngày 30/06/2026, tổ chức phát hành đã thanh toán đủ gốc và lãi.',
    legalBasis: 'Điều 52 Quy chế Niêm yết HNX', ruleCode: 'BDELIST_MATURED',
    receivedDate: '2026-06-10', appraisalDueDate: '2026-06-24', decisionRef: 'QĐ-201/QĐ-SGDHN', decisionDate: '2026-06-20',
    effectiveDate: '2026-07-01', status: 'APPROVED', assigneeName: 'Anh Sơn - P.TTTP',
  },
  {
    ...base(3, '2026-08-02T00:00:00Z'), caseNo: 'UDELIST-2026-012', caseType: 'UPCOM_DELIST', organizationId: 4, symbol: 'ALPH',
    reasonCode: 'MDELIST_LATE_FS_3Y', reasonText: 'Chậm nộp báo cáo tài chính năm 3 năm liên tiếp (2023, 2024, 2025).',
    legalBasis: 'Điều 34 Quy chế ĐKGD UPCoM', ruleCode: 'MDELIST_LATE_FS_3Y',
    receivedDate: '2026-08-02', appraisalDueDate: '2026-08-30', status: 'PENDING_APPROVAL', assigneeName: 'Chị Hương - P.QLNY',
  },
  {
    ...base(4, '2026-05-15T00:00:00Z'), caseNo: 'APPR-2026-021', caseType: 'PUBLIC_COMPANY_APPRAISAL', organizationId: 4, symbol: 'ALPH',
    reasonCode: 'NEW_PUBLIC_COMPANY', reasonText: 'Công ty đại chúng đăng ký giao dịch lần đầu trên UPCoM sau khi UBCKNN chấp thuận hồ sơ.',
    legalBasis: 'Điều 133 Nghị định 155/2020/NĐ-CP',
    receivedDate: '2026-05-15', appraisalDueDate: '2026-06-12', decisionRef: 'QĐ-155/QĐ-SGDHN', decisionDate: '2026-06-05',
    effectiveDate: '2026-06-20', status: 'APPROVED', assigneeName: 'Anh Khoa - P.QLNY',
  },
  {
    ...base(5, '2026-08-11T00:00:00Z'), caseNo: 'APPR-2026-026', caseType: 'PUBLIC_COMPANY_APPRAISAL', organizationId: 5, symbol: 'BOG',
    reasonCode: 'DELISTED_TO_UPCOM', reasonText: 'Công ty bị hủy niêm yết trên HOSE, chuyển sang đăng ký giao dịch trên UPCoM theo quy định bắt buộc.',
    legalBasis: 'Điều 133 khoản 2 Nghị định 155/2020/NĐ-CP',
    receivedDate: '2026-08-11', appraisalDueDate: '2026-09-08', status: 'RECEIVED', assigneeName: 'Chưa phân công',
  },
];

/* FR-014 / FR-015 · Danh sách không được ký quỹ ─────────────────────────── */

export const INITIAL_MARGIN_LIST: MarginIneligibleEntry[] = [
  {
    ...base(1, '2026-04-05T00:00:00Z'), symbol: 'ALPH', organizationId: 4,
    reasonCode: 'KKQ_LATE_FS', reasonText: 'Chậm công bố báo cáo tài chính năm đã kiểm toán quá 5 ngày làm việc.',
    legalBasis: 'Điều 9 Quy chế hướng dẫn giao dịch ký quỹ', entryDate: '2026-04-05', entryDecisionRef: 'QĐ-088/QĐ-SGDHN', status: 'IN_LIST',
  },
  {
    ...base(2, '2026-02-18T00:00:00Z'), symbol: 'BOG', organizationId: 5,
    reasonCode: 'KKQ_AUDIT_QUALIFIED', reasonText: 'Báo cáo tài chính có ý kiến kiểm toán ngoại trừ.',
    legalBasis: 'Điều 9 Quy chế hướng dẫn giao dịch ký quỹ', entryDate: '2026-02-18', entryDecisionRef: 'QĐ-041/QĐ-SGDHN', status: 'IN_LIST',
  },
  {
    ...base(3, '2026-01-10T00:00:00Z'), symbol: 'VIC', organizationId: 3,
    reasonCode: 'KKQ_WARNING', reasonText: 'Chứng khoán bị đưa vào diện cảnh báo.',
    legalBasis: 'Điều 9 Quy chế hướng dẫn giao dịch ký quỹ', entryDate: '2026-01-10', entryDecisionRef: 'QĐ-012/QĐ-SGDHN',
    exitDate: '2026-06-30', exitDecisionRef: 'QĐ-190/QĐ-SGDHN',
    exitReason: 'Đã ra khỏi diện cảnh báo sau khi khắc phục nguyên nhân; đủ điều kiện giao dịch ký quỹ trở lại.',
    status: 'REMOVED',
  },
  {
    ...base(4, '2025-11-22T00:00:00Z'), symbol: 'HPG', organizationId: 2,
    reasonCode: 'KKQ_TRADING_TIME', reasonText: 'Thời gian niêm yết chưa đủ 6 tháng.',
    legalBasis: 'Điều 9 Quy chế hướng dẫn giao dịch ký quỹ', entryDate: '2025-11-22', entryDecisionRef: 'QĐ-301/QĐ-SGDHN',
    exitDate: '2026-05-22', exitDecisionRef: 'QĐ-146/QĐ-SGDHN', exitReason: 'Đã đủ 6 tháng niêm yết theo quy định.',
    status: 'REMOVED',
  },
];

/* FR-028 · Khảo sát ─────────────────────────────────────────────────────── */

export const INITIAL_SURVEYS: SurveyDefinition[] = [
  {
    ...base(1, '2026-06-01T00:00:00Z'), surveyCode: 'SUR-2026-CBTT',
    title: 'Khảo sát mức độ hài lòng về hệ thống công bố thông tin',
    description: 'Thu thập ý kiến doanh nghiệp niêm yết về trải nghiệm nộp hồ sơ công bố thông tin điện tử năm 2026.',
    targetAudience: 'LISTED', openDate: '2026-06-15', closeDate: '2026-07-15', status: 'CLOSED',
    sentCount: 90, responseCount: 67,
    questions: [
      { id: 1, surveyId: 1, questionText: 'Mức độ hài lòng chung với hệ thống nộp hồ sơ điện tử', questionType: 'RATING', sortOrder: 1, isRequired: true },
      { id: 2, surveyId: 1, questionText: 'Khó khăn lớn nhất khi nộp hồ sơ', questionType: 'SINGLE_CHOICE', options: ['Biểu mẫu phức tạp', 'Thời gian xử lý lâu', 'Thiếu hướng dẫn', 'Lỗi kỹ thuật'], sortOrder: 2, isRequired: true },
      { id: 3, surveyId: 1, questionText: 'Đề xuất cải thiện', questionType: 'FREE_TEXT', sortOrder: 3, isRequired: false },
    ],
  },
  {
    ...base(2, '2026-08-01T00:00:00Z'), surveyCode: 'SUR-2026-TPDN',
    title: 'Khảo sát nhu cầu công bố thông tin trái phiếu riêng lẻ',
    description: 'Đánh giá nhu cầu và vướng mắc của tổ chức phát hành trái phiếu doanh nghiệp riêng lẻ.',
    targetAudience: 'BOND_ISSUER', openDate: '2026-08-20', closeDate: '2026-09-20', status: 'OPEN',
    sentCount: 17, responseCount: 4,
    questions: [
      { id: 4, surveyId: 2, questionText: 'Tần suất công bố thông tin định kỳ phù hợp', questionType: 'SINGLE_CHOICE', options: ['Quý', 'Bán niên', 'Năm'], sortOrder: 1, isRequired: true },
      { id: 5, surveyId: 2, questionText: 'Các nội dung cần hướng dẫn thêm', questionType: 'MULTI_CHOICE', options: ['Lịch thanh toán gốc/lãi', 'Tình hình sử dụng vốn', 'Báo cáo tài chính', 'Xếp hạng tín nhiệm'], sortOrder: 2, isRequired: true },
    ],
  },
  {
    ...base(3, '2026-08-14T00:00:00Z'), surveyCode: 'SUR-2026-UPCOM',
    title: 'Khảo sát doanh nghiệp đăng ký giao dịch UPCoM',
    description: 'Dự thảo, chưa mở.',
    targetAudience: 'UPCOM_REGISTERED', openDate: '2026-09-01', closeDate: '2026-10-01', status: 'DRAFT',
    sentCount: 0, responseCount: 0,
    questions: [],
  },
];

/* FR-029 · Kết quả khảo sát ─────────────────────────────────────────────── */

export const INITIAL_SURVEY_RESULTS: Record<number, SurveyResultSummary[]> = {
  1: [
    {
      questionId: 1, questionText: 'Mức độ hài lòng chung với hệ thống nộp hồ sơ điện tử', questionType: 'RATING',
      distribution: [
        { label: '5 — Rất hài lòng', count: 18 },
        { label: '4 — Hài lòng', count: 27 },
        { label: '3 — Bình thường', count: 14 },
        { label: '2 — Không hài lòng', count: 6 },
        { label: '1 — Rất không hài lòng', count: 2 },
      ],
      averageRating: 3.8,
    },
    {
      questionId: 2, questionText: 'Khó khăn lớn nhất khi nộp hồ sơ', questionType: 'SINGLE_CHOICE',
      distribution: [
        { label: 'Biểu mẫu phức tạp', count: 24 },
        { label: 'Thời gian xử lý lâu', count: 19 },
        { label: 'Thiếu hướng dẫn', count: 16 },
        { label: 'Lỗi kỹ thuật', count: 8 },
      ],
    },
    {
      questionId: 3, questionText: 'Đề xuất cải thiện', questionType: 'FREE_TEXT',
      distribution: [],
      sampleAnswers: [
        'Nên cho phép lưu nháp và nộp lại nhiều lần trước hạn.',
        'Cần thông báo qua email khi hồ sơ bị trả lại kèm lý do cụ thể.',
        'Mong có mẫu Excel để nhập danh sách cổ đông lớn thay vì gõ tay.',
        'Thời gian phản hồi của Sở nên rút ngắn xuống 1 ngày làm việc.',
      ],
    },
  ],
  2: [
    {
      questionId: 4, questionText: 'Tần suất công bố thông tin định kỳ phù hợp', questionType: 'SINGLE_CHOICE',
      distribution: [
        { label: 'Quý', count: 1 },
        { label: 'Bán niên', count: 3 },
        { label: 'Năm', count: 0 },
      ],
    },
    {
      questionId: 5, questionText: 'Các nội dung cần hướng dẫn thêm', questionType: 'MULTI_CHOICE',
      distribution: [
        { label: 'Lịch thanh toán gốc/lãi', count: 4 },
        { label: 'Tình hình sử dụng vốn', count: 3 },
        { label: 'Báo cáo tài chính', count: 2 },
        { label: 'Xếp hạng tín nhiệm', count: 1 },
      ],
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
 * FR-035 / FR-036 / FR-037 · Mẫu báo cáo cho các nhóm tin còn thiếu
 *
 * Rà soát độ phủ cho thấy chỉ 4 mẫu được khai báo, phủ 3/7 nhóm tin: PERIODIC,
 * EXTRAORDINARY và HNX_NEWS. Bốn nhóm BOND, TRADING, ON_DEMAND, OFFERING không
 * có mẫu nào — nghĩa là doanh nghiệp mở màn nộp hồ sơ ra sẽ không chọn được gì,
 * và ba chức năng FR-035/036/037 tuy có nhóm tin trong enum nhưng thực tế không
 * nộp được. Bổ sung ở đây để chuỗi khai báo → nộp → duyệt → công bố chạy đủ.
 * ──────────────────────────────────────────────────────────────────────────── */

const tpl = (
  id: number,
  templateCode: string,
  nameVi: string,
  newsGroupCode: TemplateDefinition['newsGroupCode'],
  titleFormula: string,
  offsetWorkingDays: number,
): TemplateDefinition => ({
  ...base(id, '2026-01-02T00:00:00Z'),
  templateCode,
  nameVi,
  templateKind: 'DISCLOSURE_NEWS',
  newsGroupCode,
  ownerUnitCode: 'TTTT',
  autoApproveManager: false,
  autoApproveStaff: false,
  requireCaSign: true,
  postAudit: false,
  allowPublish: true,
  controlUnitCode: 'TTTT',
  workflowDefCode: 'WF_DISCLOSURE_STANDARD',
  titleFormula,
  deadlineRuleJson: { basis: 'EVENT_DATE', offsetWorkingDays },
  isActive: true,
  inUse: false,
  autoTranslate: false,
});

export const EXTRA_TEMPLATES: TemplateDefinition[] = [
  tpl(101, 'TIN_TRAI_PHIEU', 'Công bố thông tin Trái phiếu', 'BOND',
    'CBTT trái phiếu {bondCode} - {org.shortName}', 1),
  tpl(102, 'TIN_GIAO_DICH_NNB', 'Công bố giao dịch của người nội bộ và người có liên quan', 'TRADING',
    'Giao dịch {violatorName} - {org.shortName}', 3),
  tpl(103, 'TIN_THEO_YEU_CAU', 'Công bố thông tin theo yêu cầu của Sở', 'ON_DEMAND',
    'Giải trình theo yêu cầu - {org.shortName}', 1),
  tpl(104, 'TIN_CHAO_BAN', 'Công bố thông tin chào bán chứng khoán', 'OFFERING',
    'Chào bán {symbol} - {org.shortName}', 2),
];
