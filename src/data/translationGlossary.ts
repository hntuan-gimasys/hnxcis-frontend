/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bảng đối chiếu thuật ngữ VI–EN (FR-065). URD yêu cầu thuật ngữ chuyên ngành
 * phải dịch nhất quán giữa các tin, không để AI dịch tự do.
 *
 * ⚠️ Đây là bản dựng NHÁP TẠI CLIENT cho prototype, KHÔNG gọi backend. Bản thật
 * dùng `aiService.translate` (endpoint /api/gemini/*) — đợt này chưa nối.
 */
const GLOSSARY: Array<[RegExp, string]> = [
  [/Sở Giao dịch Chứng khoán Hà Nội/gi, 'Hanoi Stock Exchange'],
  [/Sở GDCK Hà Nội/gi, 'Hanoi Stock Exchange'],
  [/công bố thông tin/gi, 'information disclosure'],
  [/hủy niêm yết/gi, 'delisting'],
  [/niêm yết/gi, 'listing'],
  [/đăng ký giao dịch/gi, 'trading registration'],
  [/báo cáo tài chính/gi, 'financial statement'],
  [/báo cáo thường niên/gi, 'annual report'],
  [/tình hình quản trị công ty/gi, 'corporate governance'],
  [/bất thường/gi, 'extraordinary'],
  [/giải trình/gi, 'explanation'],
  [/cổ phiếu/gi, 'shares'],
  [/trái phiếu/gi, 'bonds'],
  [/quý/gi, 'quarter'],
  [/bán niên/gi, 'semi-annual'],
  [/năm/gi, 'year'],
  [/doanh thu thuần/gi, 'net revenue'],
  [/lợi nhuận sau thuế/gi, 'profit after tax'],
  [/LNST/g, 'profit after tax'],
  [/tăng trưởng/gi, 'growth'],
  [/so với cùng kỳ/gi, 'year-on-year'],
];

const applyGlossary = (text: string): string =>
  GLOSSARY.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);

/**
 * Sinh bản dịch nháp EN từ nội dung VI. Chỉ áp dụng glossary rồi giữ nguyên phần
 * còn lại — cố ý để bản nháp trông "chưa hoàn chỉnh", vì bước hiệu đính của người
 * là bắt buộc trước khi công bố (AC-065-4).
 *
 * URD ghi rõ phạm vi dịch **ngoại trừ file đính kèm** (§13.9 Đ38): chỉ tiêu đề và
 * nội dung tin được dịch, tệp đính kèm giữ nguyên bản gốc.
 */
export const buildAiDraftTranslation = (
  titleVi: string,
  contentVi: string
): { titleEn: string; contentEn: string } => ({
  titleEn: applyGlossary(titleVi),
  contentEn: applyGlossary(contentVi),
});

export const TRANSLATION_STATUS_LABEL: Record<string, string> = {
  NONE: 'Không thuộc nhóm tin dịch tự động',
  AI_DRAFT: 'Đã dịch tự động — chờ hiệu đính',
  HUMAN_REVIEWED: 'Đã hiệu đính — sẵn sàng công bố',
  APPROVED: 'Đã công bố song ngữ',
};
