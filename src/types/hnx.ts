/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActorType = 'HNX' | 'ORGANIZATION' | 'EXTERNAL' | 'PUBLIC';

export type UserRoleCode =
  | 'ROLE_SYS_ADMIN'
  | 'ROLE_BIZ_ADMIN'
  | 'ROLE_QLNY_STAFF'
  | 'ROLE_QLNY_MANAGER'
  | 'ROLE_TTTP_STAFF'
  | 'ROLE_TTTP_MANAGER'
  | 'ROLE_TTTT_STAFF'
  | 'ROLE_TTTT_MANAGER'
  // P.CNTT — phòng Công nghệ thông tin của Sở. URD có 2 vai trò này mà PRD v1.0
  // bỏ sót (PRD v1.2 §2.1, §13.2 S13). Lưu ý: KHÔNG đồng nhất với Admin (quản trị
  // hệ thống) hay Adp (quản trị nghiệp vụ phòng) — đó là các vai trò riêng.
  | 'ROLE_CNTT_STAFF'
  | 'ROLE_CNTT_MANAGER'
  | 'ROLE_HTGD_STAFF'
  | 'ROLE_HNX_EXEC'
  | 'ROLE_ORG_STAFF'
  | 'ROLE_ORG_MANAGER'
  | 'ROLE_TREASURY'
  | 'ROLE_INVESTOR'
  | 'ROLE_PUBLIC';

export type SecurityType = 'EQUITY' | 'BOND_LISTED' | 'BOND_PRIVATE' | 'BOND_GREEN';
/**
 * `HOSE` phục vụ bộ lọc sàn của Dashboard (FR-027). Nghiệp vụ chính của hệ thống
 * là HNX và UPCoM; dữ liệu HOSE đến từ CSDL tập trung, chỉ dùng để đọc/thống kê.
 */
export type BoardType = 'HOSE' | 'HNX' | 'UPCOM' | 'PRIVATE_BOND';

/**
 * Picklist 1/2 — `Trạng thái chứng khoán` (PRD v1.2 §5.2.8.b).
 * ĐÚNG 5 giá trị, hiển thị trên hồ sơ cổ phiếu/trái phiếu (FR-001 trường 11).
 * KHÔNG thêm "Hạn chế giao dịch" vào đây — đó là giá trị của `SurveillanceStatus`.
 *
 * TẠM THỜI: PRD §5.6.1 (sơ đồ state machine) vs §5.2.8.b (bảng picklist) mâu thuẫn
 * — §5.6.1 vẽ TRADING_RESTRICTED nằm trong chuỗi Điều 42 của `security.status`,
 * §5.2.8.b nói picklist này chỉ có 5 giá trị. Chưa chốt với nghiệp vụ — xem §12.6
 * câu 16. Nếu nghiệp vụ chốt theo §5.6.1 thì phải thêm lại TRADING_RESTRICTED ở đây.
 */
export type SecurityStatus =
  | 'NORMAL'
  | 'WARNING'
  | 'CONTROL'
  | 'TRADING_HALT'
  | 'DELISTED';

/**
 * Picklist 2/2 — `Trạng thái kiểm soát` (PRD v1.2 §5.2.8.b).
 * ĐÚNG 9 giá trị, thuộc bản ghi diện giám sát (FR-008 trường 3), KHÁC HẲN
 * `SecurityStatus`. Đây là danh mục duy nhất chứa "Hạn chế giao dịch".
 * Không trộn hai danh mục này với nhau (lỗi PRD v1.0 §13.2 S4).
 */
export type SurveillanceStatus =
  | 'WARNING'
  | 'TRADING_SUSPENSION'
  | 'TRADING_RESTRICTED'
  | 'MANDATORY_DELIST'
  | 'DEREGISTER_TRADING'
  | 'VOLUNTARY_DELIST'
  | 'CONTROL'
  | 'TRADING_PAUSE'
  | 'TRADING_HALT';

export type BondStatus = 'LISTED' | 'SUSPENDED' | 'MATURED' | 'DELISTED';

export type SubmissionStatus =
  | 'DRAFT'
  | 'PENDING_ORG_APPROVAL'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'REVIEWED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'CORRECTED'
  | 'HIDDEN'
  | 'CANCELLED'
  | 'ARCHIVED';

export type BusinessCaseStatus =
  | 'PENDING'
  | 'IN_APPRAISAL'
  | 'AWAITING_SUPPLEMENT'
  | 'PENDING_APPROVAL'
  | 'RETURNED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * ⚠️ URD phân loại tin theo picklist `Loại tin` 4 giá trị (Báo cáo tài chính /
 * Bất thường 24h / Định kỳ khác / Chào bán phát hành), còn danh sách dưới đây
 * theo bản phân rã Confluence. Hai cách phân loại KHÔNG khớp nhau — có thể là
 * hai chiều phân loại độc lập, chờ nghiệp vụ xác nhận (PRD v1.2 §12.6 câu 28).
 * `OFFERING` được bổ sung để dashboard có nhóm "Chào bán / Phát hành".
 */
export type NewsGroupCode =
  | 'PERIODIC'
  | 'EXTRAORDINARY'
  | 'BOND'
  | 'TRADING'
  | 'OFFERING'
  | 'ON_DEMAND'
  | 'HNX_NEWS';

export interface BaseEntity {
  id: number;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
  deletedAt?: string;
  deletedBy?: number;
  deleteReason?: string;
  versionNo: number;
  isCurrent: boolean;
  parentId?: number;
}

export interface Organization extends BaseEntity {
  taxCode: string;
  nameVi: string;
  nameEn?: string;
  shortName: string;
  orgType: 'LISTED' | 'UPCOM_REGISTERED' | 'PRIVATE_BOND_ISSUER' | 'STARTUP';
  businessRegNo: string;
  businessRegDate: string;
  charterCapital: number;
  industryCode: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  legalRepName: string;
  disclosureRepName: string;
  disclosureRepEmail: string;
  isPublicCompany: boolean;
  publicCompanyDate?: string;
  status: 'APPROVED' | 'PENDING' | 'SUSPENDED';
}

export interface SecurityItem extends BaseEntity {
  organizationId: number;
  symbol: string;
  securityType: SecurityType;
  board: BoardType;
  isin?: string;
  status: SecurityStatus;
  listingStatusNote?: string;
}

/**
 * Trạng thái hồ sơ đăng ký giao dịch (FR-004 → FR-006). Quyết định biểu mẫu nào
 * được phép kết xuất — xem mapping tại `src/data/dossierForms.ts`.
 */
export type DossierStatus =
  /** Đã tiếp nhận, chuyên viên đang kiểm tra tính đầy đủ / hợp lệ. */
  | 'RECEIVED'
  /** Luồng yêu cầu bổ sung: hồ sơ chưa đầy đủ và/hoặc chưa hợp lệ. */
  | 'NEED_SUPPLEMENT'
  /** Hết 60 ngày mà hồ sơ chưa hoàn thiện. */
  | 'STOPPED'
  /** Luồng chấp thuận đăng ký giao dịch. */
  | 'APPROVAL'
  /** Luồng xác định ngày giao dịch đầu tiên & giá tham chiếu. */
  | 'FIRST_TRADING'
  | 'COMPLETED';

/** Hồ sơ đăng ký giao dịch cổ phiếu (FR-004 → FR-006). */
export interface RegistrationDossier extends BaseEntity {
  dossierNo: string;
  organizationId: number;
  symbol: string;
  /** Số lượng cổ phiếu đăng ký giao dịch. */
  registeredQuantity: number;
  board: BoardType;
  status: DossierStatus;
  receivedDate: string;
  /**
   * Guard trình duyệt của Mẫu 06 (FR-006 AC-006-1): chưa xác nhận thanh toán phí
   * thì nút "Trình duyệt" bị vô hiệu.
   */
  feePaymentStatus: 'PENDING' | 'CONFIRMED';
  feeAmount: number;
  feeConfirmedAt?: string;
  feeConfirmedBy?: string;
  firstTradingDate?: string;
  referencePrice?: number;
  /** Ghi chú của chuyên viên thẩm định, hiện trên panel chi tiết. */
  appraisalNote?: string;
}

/**
 * Bản ghi diện giám sát (FR-008, PRD v1.2 §5.2.8.b — bảng `surveillance_status`).
 * Mỗi lần đưa một mã CK vào/ra một diện là MỘT bản ghi có ngày bắt đầu, ngày kết
 * thúc, lý do và số quyết định — không phải một trường trạng thái trên hồ sơ CK.
 */
export interface SurveillanceRecord extends BaseEntity {
  organizationId: number;
  securityId: number;
  controlStatus: SurveillanceStatus;
  startDate?: string;
  endDate?: string;
  entryReason: string;
  decisionRef: string;
  decisionDate: string;
  firstTradingDate?: string;
  enteredBy?: string;
  enteredDate?: string;
  exitedBy?: string;
  exitDate?: string;
  /** URD: "TCNY đã giải trình tình trạng chưa?" */
  orgExplained?: boolean;
  ruleCode?: string;
  alertId?: number;
  businessCaseId?: number;
}

export interface EquityProfile extends BaseEntity {
  securityId: number;
  equityName: string;
  firstTradingDate?: string;
  issuedQuantity: number;
  listedQuantity: number;
  outstandingQuantity: number;
  treasuryQuantity: number;
  listingDecisionDate: string;
  listingDecisionNo: string;
  delistingDate?: string;
  securityStatus: SecurityStatus;
  marginEligible: boolean;
  firstDayRefPrice: number;
  listingBoard: BoardType;
}

export interface BondProfile extends BaseEntity {
  securityId: number;
  bondCode: string;
  issueDate: string;
  parValue: number;
  listedQuantity: number;
  totalParValue: number;
  maturityDate: string;
  interestRateDesc: string;
  interestRateType: 'FIXED' | 'FLOATING' | 'FORMULA';
  interestRateValue: number;
  bondStatus: BondStatus;
  isGreenBond: boolean;
  isPrivatePlacement: boolean;
  isConvertible: boolean;
  creditRating?: string;
  creditRatingAgency?: string;
}

export interface BondPaymentSchedule {
  id: number;
  bondProfileId: number;
  periodNo: number;
  paymentType: 'PRINCIPAL' | 'INTEREST' | 'BOTH';
  plannedDate: string;
  principalAmount: number;
  interestAmount: number;
  actualDate?: string;
  actualAmount?: number;
  paymentStatus: 'PLANNED' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'DEFAULTED';
}

export interface Investor extends BaseEntity {
  investorType: 'INDIVIDUAL' | 'ORGANIZATION';
  identityNo: string;
  identityType: 'CITIZEN_ID' | 'PASSPORT' | 'TAX_CODE';
  fullName: string;
  fullNameEn?: string;
  nationality: string;
  address: string;
  phone?: string;
  email?: string;
  linkedOrgId?: number;
}

export interface SecurityOwnership extends BaseEntity {
  securityId: number;
  investorId: number;
  holderRole: 'MAJOR_SHAREHOLDER' | 'FOUNDING' | 'INTERNAL' | 'RELATED' | 'STATE' | 'FOREIGN';
  quantity: number;
  ownershipPct: number;
  asOfDate: string;
  unlinkedAt?: string;
  unlinkReason?: string;
}

export interface FieldDefinition extends BaseEntity {
  fieldCode: string;
  parentId?: number;
  labelVi: string;
  labelEn?: string;
  dataType:
    | 'TEXT'
    | 'LONGTEXT'
    | 'NUMBER'
    | 'DECIMAL'
    | 'DATE'
    | 'DATETIME'
    | 'BOOLEAN'
    | 'PICKLIST'
    | 'MULTI_PICKLIST'
    | 'FILE'
    | 'TABLE'
    | 'RICHTEXT'
    | 'FORMULA';
  lookupCatalogCode?: string;
  isRepeatable: boolean;
  nodeType: 'ROOT' | 'GROUP' | 'FIELD';
  sortOrder: number;
  defaultValue?: string;
  validationJson?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLen?: number;
    maxLen?: number;
    regex?: string;
  };
  formulaExpr?: string;
  hasData: boolean;
}

export interface TemplateDefinition extends BaseEntity {
  templateCode: string;
  nameVi: string;
  nameEn?: string;
  templateKind: 'DISCLOSURE_NEWS' | 'DOSSIER' | 'FINANCIAL_STMT' | 'DATA_STRUCTURE';
  newsTypeCode?: string;
  newsGroupCode?: NewsGroupCode;
  ownerUnitCode?: string;
  /**
   * SÁU cờ theo bảng "Thông tin quản lý" của URD (PRD v1.2 §5.2.4, §7.5 FR-047,
   * §13.2 S8) — không phải ba. PRD v1.0 gộp hai cấp tự động duyệt thành một cờ
   * `autoApprove` là sai: URD tách riêng cấp lãnh đạo và cấp chuyên viên.
   *
   * URD chưa định nghĩa hành vi/hệ quả của `requireCaSign` và `postAudit` ngoài
   * một dòng mô tả — còn chờ nghiệp vụ chốt (§12.6 câu 17). Ở prototype này các
   * cờ mới chỉ là dữ liệu cấu hình, chưa nối vào workflow.
   */
  /** "Lãnh đạo tự động duyệt" — tự động duyệt tin ở bước lãnh đạo. */
  autoApproveManager: boolean;
  /** "Chuyên viên tự động duyệt" — tự động duyệt tin ở bước chuyên viên. */
  autoApproveStaff: boolean;
  /** "Ký CA" — mẫu tin có yêu cầu kiểm tra chữ ký số. */
  requireCaSign: boolean;
  /** "Hậu kiểm tin" — mẫu tin thuộc diện hậu kiểm. */
  postAudit: boolean;
  /** "Công bố" — mẫu có được phép công bố ra ngoài hệ thống. */
  allowPublish: boolean;
  /** "Đơn vị kiểm soát" — bắt buộc theo URD. */
  controlUnitCode?: string;
  workflowDefCode: string;
  titleFormula?: string;
  deadlineRuleJson?: {
    basis: 'PERIOD_END' | 'EVENT_DATE';
    offsetWorkingDays?: number;
    offsetHours?: number;
  };
  /** "Kích hoạt" — trạng thái sử dụng của mẫu báo cáo. */
  isActive: boolean;
  inUse: boolean;
  autoTranslate: boolean;
}

export interface TemplateField extends BaseEntity {
  templateId: number;
  fieldDefinitionId: number;
  labelOverrideVi?: string;
  labelOverrideEn?: string;
  sectionCode: string;
  sortOrder: number;
  colSpan: number;
  isRequired: boolean;
  isReadonly: boolean;
  isIndexed: boolean;
  visibleForRoles?: string[];
  editableForRoles?: string[];
}

export interface Submission extends BaseEntity {
  submissionNo: string;
  templateId: number;
  templateKind: string;
  newsGroupCode?: NewsGroupCode;
  organizationId?: number;
  securityId?: number;
  titleVi: string;
  titleEn?: string;
  payload: Record<string, any>;
  periodCode?: string;
  periodEndDate?: string;
  dueDate?: string;
  submittedAt?: string;
  receivedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  isLate?: boolean;
  lateDays?: number;
  status: SubmissionStatus;
  workflowInstanceId?: number;
  lang: 'vi' | 'en';
  /**
   * Chỉ dùng cho dữ liệu cũ theo mô hình 2 bản ghi. Vòng đời song ngữ hiện tại là
   * MỘT bản ghi: bản EN nằm ở `titleEn` / `contentEn` của chính bản VI, công bố
   * cùng lúc trong một hành động (PRD v1.2 §7.4 FR-065, §13.9 Đ38 — sửa lỗi S6/S7).
   */
  sourceSubmissionId?: number;
  /**
   * `NONE` = mẫu tin không thuộc nhóm được cấu hình dịch (`template.autoTranslate`
   * tắt) → không sinh bản dịch, công bố thẳng. Bản EN bắt buộc qua hiệu đính của
   * người (`AI_DRAFT` → `HUMAN_REVIEWED`) mới công bố được (AC-065-4, AC-065-6).
   */
  translationStatus?: 'NONE' | 'AI_DRAFT' | 'HUMAN_REVIEWED' | 'APPROVED';
  /** Nội dung bản EN sau hiệu đính. Bản VI đối chiếu lấy từ `payload.summary_note`. */
  contentEn?: string;
  translationReviewedAt?: string;
  translationReviewedBy?: number;
  correctionOfId?: number;
  correctionType?: 'MINOR_EDIT' | 'MATERIAL_CORRECTION';
  isPublic: boolean;
  /** Lý do từ chối — widget "Danh sách Tin bị từ chối" của DN phải hiện được. */
  rejectReason?: string;
  rejectedAt?: string;
  hiddenAt?: string;
  hiddenBy?: number;
  hideReason?: string;
  caSignedAt?: string;
  attachments?: Attachment[];
}

export interface Attachment extends BaseEntity {
  submissionId?: number;
  fieldCode?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksumSha256: string;
  isPublic: boolean;
}

export interface WorkflowDefinition {
  id: number;
  code: string;
  nameVi: string;
  targetType: 'SUBMISSION' | 'BUSINESS_CASE' | 'ACCOUNT_REQUEST' | 'CONFIG_CHANGE';
  versionNo: number;
  status: 'ACTIVE' | 'DRAFT' | 'SUSPENDED';
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
}

export interface WorkflowStep {
  id: number;
  workflowDefId: number;
  stepCode: string;
  nameVi: string;
  stepType: 'START' | 'TASK' | 'DECISION' | 'END';
  assigneeMode: 'ROLE' | 'UNIT' | 'SPECIFIC_USER' | 'SUBMITTER_ORG';
  assigneeRef: string[];
  slaWorkingDays?: number;
  allowBulkAction: boolean;
  requireReasonOnReject: boolean;
  dualControl: boolean;
  sortOrder: number;
}

export interface WorkflowTransition {
  id: number;
  workflowDefId: number;
  fromStepCode: string;
  toStepCode: string;
  actionCode: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RETURN' | 'REVIEW' | 'PUBLISH' | 'CANCEL' | 'SUPPLEMENT';
  labelVi: string;
  guardExpr?: string;
  targetStatus: string;
}

export interface WorkflowTask {
  id: number;
  instanceId: number;
  targetType: string;
  targetId: number;
  targetNo: string;
  targetTitle: string;
  stepCode: string;
  stepName: string;
  assignedRole: string;
  status: 'OPEN' | 'CLAIMED' | 'DONE' | 'SKIPPED';
  dueAt: string;
  completedAt?: string;
  actionTaken?: string;
  rejectReason?: string;
  isOverdue: boolean;
  organizationName?: string;
}

export interface WorkflowHistory {
  id: number;
  instanceId: number;
  seqNo: number;
  fromStep?: string;
  toStep?: string;
  actionCode: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  comment?: string;
  reason?: string;
  occurredAt: string;
}

export interface RuleDefinition extends BaseEntity {
  ruleCode: string;
  nameVi: string;
  ruleGroup:
    | 'STATUS_WARNING'
    | 'STATUS_CONTROL'
    | 'TRADING_RESTRICTION'
    | 'TRADING_SUSPENSION'
    | 'RELLESTING'
    | 'MANDATORY_DELIST'
    | 'BOND_DELIST'
    | 'UPCOM_DELIST'
    | 'MARGIN_INELIGIBLE'
    | 'MARGIN_RESTORE'
    | 'TRADE_VIOLATION'
    | 'DISCLOSURE_VIOLATION';
  legalBasis: string;
  direction: 'ENTER' | 'EXIT';
  conditionExpr: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  autoCreateCase: boolean;
  targetCaseType?: string;
  isActive: boolean;
  parameters: RuleParameter[];
}

export interface RuleParameter {
  id: number;
  ruleDefId: number;
  paramCode: string;
  paramLabelVi: string;
  dataType: string;
  paramValue: string;
  unit?: string;
  effectiveFrom: string;
}

export interface Alert extends BaseEntity {
  ruleDefId: number;
  ruleCode: string;
  ruleName: string;
  legalBasis: string;
  organizationId?: number;
  organizationName?: string;
  securityId?: number;
  symbol?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  /** Cơ quan phát hành cảnh báo — widget của DN phải phân biệt HNX và UBCKNN. */
  source?: 'HNX' | 'UBCKNN';
  /** Hạn chót doanh nghiệp phải phản hồi cảnh báo. */
  responseDeadline?: string;
  titleVi: string;
  evidenceJson: Record<string, any>;
  suggestedAction?: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'CONFIRMED' | 'DISMISSED' | 'CASE_CREATED';
  handledBy?: number;
  handledAt?: string;
  dismissReason?: string;
  businessCaseId?: number;
}

export interface BusinessCase extends BaseEntity {
  caseNo: string;
  caseType: string;
  organizationId?: number;
  organizationName?: string;
  securityId?: number;
  symbol?: string;
  submissionId?: number;
  sourceAlertId?: number;
  status: BusinessCaseStatus;
  decisionNo?: string;
  decisionDate?: string;
  effectiveDate?: string;
  reasonCode?: string;
  reasonDetail?: string;
  tags?: string[];
  internalNote?: string;
  slaDueAt?: string;
}

export interface DisclosureObligation extends BaseEntity {
  organizationId: number;
  organizationName: string;
  symbol?: string;
  securityId?: number;
  templateId: number;
  templateName: string;
  newsGroupCode: NewsGroupCode;
  /** Bốn loại báo cáo định kỳ của widget "Tình trạng Báo cáo định kỳ" (FR-027). */
  reportTypeCode?: 'FS_QUARTER' | 'FS_SEMI' | 'ANNUAL_REPORT' | 'GOVERNANCE';
  periodCode: string;
  periodEndDate: string;
  dueDate: string;
  submissionId?: number;
  fulfilledAt?: string;
  status: 'PENDING' | 'SUBMITTED' | 'FULFILLED' | 'LATE' | 'MISSING' | 'WAIVED';
  lateDays?: number;
}

export interface FeeSchema extends BaseEntity {
  schemaCode: string;
  nameVi: string;
  feeType: 'INITIAL_LISTING' | 'ANNUAL_MAINTENANCE' | 'ADDITIONAL_LISTING' | 'UPCOM_REG';
  formulaExpr: string;
  minAmount?: number;
  maxAmount?: number;
  prorateBasis?: 'DAY' | 'MONTH' | 'NONE';
  effectiveFrom: string;
}

export interface FeeRecord extends BaseEntity {
  feeSchemaId: number;
  organizationId: number;
  securityId?: number;
  businessCaseId?: number;
  periodFrom: string;
  periodTo: string;
  calcBasisJson: Record<string, any>;
  calculatedAmount: number;
  adjustedAmount?: number;
  adjustReason?: string;
  finalAmount: number;
  calcMode: 'AUTO' | 'MANUAL';
  paymentStatus: 'UNPAID' | 'CONFIRMED' | 'WAIVED';
  paymentConfirmedAt?: string;
  paymentConfirmedBy?: number;
  paymentRef?: string;
}

export interface AuditLog {
  id: number;
  occurredAt: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  actorIp: string;
  correlationId: string;
  entityType: string;
  entityId: number;
  entityLabel: string;
  action: string;
  beforeJson?: any;
  afterJson?: any;
  diffJson?: any;
  reason?: string;
  result: 'SUCCESS' | 'FAILED';
}

export interface NotificationItem extends BaseEntity {
  direction: 'OUTBOUND' | 'INBOUND';
  recipientUserId?: number;
  recipientOrgId?: number;
  senderUserId?: number;
  senderName?: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  subject: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  deepLink?: string;
  notificationType: 'REMINDER' | 'EXPLANATION_REQUEST' | 'SUPPLEMENT_REQUEST' | 'COMPLIANCE' | 'GENERAL';
  priority: 'NORMAL' | 'HIGH';
  sendStatus: 'QUEUED' | 'SENT' | 'FAILED';
  sentAt?: string;
  readAt?: string;
}

export interface UserAccount extends BaseEntity {
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  actorType: ActorType;
  organizationId?: number;
  unitCode?: string;
  position?: string;
  status: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'DISABLED';
  roleCode: UserRoleCode;
  dataScope?: DataScopeGrant[];
}

export interface DataScopeGrant {
  id: number;
  subjectType: 'USER' | 'ROLE' | 'UNIT';
  subjectRef: string;
  dimension: 'ORGANIZATION' | 'BOARD' | 'SECURITY_TYPE' | 'NEWS_GROUP' | 'UNIT' | 'INDUSTRY';
  operator: 'IN' | 'NOT_IN' | 'ALL';
  valuesList: string[];
  effect: 'ALLOW' | 'DENY';
}

export interface CatalogItem {
  id: number;
  catalogCode: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  parentCode?: string;
  sortOrder: number;
  isActive: boolean;
  usageCount: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Metadata quản trị (FR-045 → FR-054)
 *
 * `usageCount` lặp lại ở nhiều interface dưới đây là có chủ đích, không phải
 * thừa: quy tắc X6 của PRD — "xóa chỉ khi chưa dùng; đã dùng thì chỉ inactive"
 * — áp cho từng loại metadata, và mỗi loại đếm tham chiếu từ một nguồn khác
 * nhau. Gộp thành một trường dùng chung sẽ che mất điều đó.
 * ──────────────────────────────────────────────────────────────────────────── */

/** FR-053 · Ngày nghỉ lễ và ngày làm bù. Nền của mọi phép tính hạn trong hệ thống. */
export interface HolidayEntry extends BaseEntity {
  fromDate: string;
  toDate: string;
  year: number;
  /** MAKEUP_WORKDAY là ngày làm bù: rơi vào T7/CN nhưng vẫn tính là ngày làm việc. */
  holidayType: 'HOLIDAY' | 'MAKEUP_WORKDAY';
  nameVi: string;
  nameEn?: string;
  legalBasis?: string;
  /** Số nghĩa vụ đã chốt hạn dựa trên ngày này (AC-053-5). */
  usageCount: number;
}

/** FR-052 · Từ điển thuật ngữ/viết tắt. Cũng là nguồn để AI mở rộng viết tắt (FR-032). */
export interface DictionaryEntry extends BaseEntity {
  termCode: string;
  termValue: string;
  termType: 'ABBREVIATION' | 'TERM' | 'LEGAL_REF' | 'UNIT';
  description?: string;
  isActive: boolean;
  usageCount: number;
}

/** FR-049 · Mẫu báo cáo tài chính. */
export interface FsTemplate extends BaseEntity {
  templateCode: string;
  nameVi: string;
  fsType: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW' | 'NOTES';
  periodType: 'QUARTER' | 'SEMI_ANNUAL' | 'ANNUAL';
  isActive: boolean;
  /** Số BCTC đã nộp theo mẫu này — chặn xóa (AC-049-6). */
  usageCount: number;
}

/** FR-049 · Chỉ tiêu hàng của mẫu BCTC; `formulaExpr` dạng `[100] + [200]`. */
export interface FsTemplateRow {
  id: number;
  fsTemplateId: number;
  rowCode: string;
  nameVi: string;
  level: number;
  sortOrder: number;
  dataType: 'NUMBER' | 'TEXT';
  /** Rỗng = ô nhập tay. Có giá trị = ô tính tự động từ các chỉ tiêu khác. */
  formulaExpr?: string;
}

/** FR-049 · Chỉ tiêu cột (kỳ này / kỳ trước / thuyết minh…). */
export interface FsTemplateCol {
  id: number;
  fsTemplateId: number;
  colCode: string;
  nameVi: string;
  sortOrder: number;
}

/** FR-050 / FR-051 · Mẫu cấu trúc dữ liệu và trường chi tiết của nó. */
export interface DataStructureTemplate extends BaseEntity {
  structCode: string;
  nameVi: string;
  targetEntity: string;
  isActive: boolean;
  usageCount: number;
}

export interface DataStructureField {
  id: number;
  structTemplateId: number;
  fieldCode: string;
  nameVi: string;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'PICKLIST';
  lookupCatalogCode?: string;
  isRequired: boolean;
  sortOrder: number;
}

/** FR-057 · Trục 1 của AuthZ Engine — quyền theo chức năng. */
export interface Permission {
  id: number;
  permissionCode: string;
  resourceType: string;
  action: string;
  nameVi: string;
  moduleCode?: string;
  isActive: boolean;
}

/**
 * FR-057 · Gán quyền cho vai trò.
 *
 * `allowedStatuses` là trục 3 của AuthZ Engine: cùng một quyền có thể chỉ được
 * phép khi bản ghi đang ở một số trạng thái nhất định (ví dụ chỉ sửa được hồ sơ
 * khi còn DRAFT). Null = không ràng buộc trạng thái.
 */
export interface RolePermission {
  id: number;
  roleCode: UserRoleCode;
  permissionId: number;
  allowedStatuses?: string[] | null;
  effect: 'ALLOW' | 'DENY';
}
