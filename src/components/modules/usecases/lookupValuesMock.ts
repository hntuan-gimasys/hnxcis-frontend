/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogRecord } from './catalogTypes';

/**
 * Dữ liệu mẫu cho ba danh mục dựa trên bảng từ điển dùng chung `LOOKUP_VALUES`:
 *
 *   - [HNX-SRS] Quản lý Chức vụ              → `LOV_GROUP = 'POSITION'`
 *   - [IMS-008] Loại hình doanh nghiệp        → `LOV_GROUP = 'ENTERPRISE_TYPE'`
 *   - [IMS-015] Quản lý, khai báo dữ liệu từ điển → **mọi** `LOV_GROUP`
 *
 * Hai UC đầu ghim cứng một nhóm và chỉ quản lý nhóm đó. IMS-015 ngược lại: nó là
 * màn hình quản trị chính của cả bảng, hiển thị `LOV_GROUP` thành một cột và cho
 * lọc theo nhóm — nên nó đọc `ALL_DICTIONARY_ROWS`, hợp của mọi nhóm bên dưới.
 *
 * ID LÀ DUY NHẤT TRÊN TOÀN BẢNG, không phải duy nhất trong từng nhóm:
 * `LOOKUP_VALUES.ID` là khóa chính của một bảng dùng chung, và
 * `LOOKUP_PARENT_ID` tự tham chiếu tới nó. Nếu mỗi nhóm đánh số lại từ 1 thì
 * id 1 vừa là "Chủ tịch HĐQT" vừa là "Công ty cổ phần", và quan hệ cha–con sẽ
 * trỏ sai ngay khi IMS-015 gộp các nhóm lại. Vì vậy mỗi nhóm giữ một dải riêng.
 */
export interface LookupValueRow extends CatalogRecord {
  /** LOOKUP_VALUES.CODE — mã, VARCHAR2(255), §4.1 ghi **nullable**. */
  code: string;
  /** LOOKUP_VALUES.VALUE — giá trị hiển thị, VARCHAR2(255), §4.1 ghi **nullable**. */
  value: string;
  /**
   * LOOKUP_VALUES.LOV_GROUP — mã nhóm, quyết định bản ghi thuộc danh mục nào.
   *
   * Với [HNX-SRS] và [IMS-008] đây là hằng số của màn hình nên không cho sửa.
   * Với [IMS-015] đây là một trường nhập được, vì màn hình đó quản lý mọi nhóm.
   */
  lovGroup: string;
  /**
   * LOOKUP_VALUES.LOOKUP_PARENT_ID — mã cha, NUMBER, nullable, FK tự tham chiếu
   * tới `LOOKUP_VALUES.ID`. `null` là không có cha.
   */
  lookupParentId: number | null;
  /**
   * Thứ tự hiển thị.
   *
   * ⚠️ KHÔNG có trong §4.1 của cả ba tài liệu — Bảng 04 của IMS-015 cũng để trống
   * ô "Bảng (Table)" và "Trường" cho dòng "Thứ tự". Nhưng nó vừa là tiêu chí tìm
   * kiếm, vừa là cột danh sách, vừa là trường trong popup của IMS-015; và payload
   * API của chính service này có `"displayOrder": 1` (IMS-015 §5.3.4). Nên đây là
   * cột có thật mà phần mô tả CSDL bỏ sót, không phải phần tự thêm.
   */
  displayOrder: number | null;
  /** LOOKUP_VALUES.DESCRIPTION — diễn giải, VARCHAR2(255) theo IMS-015 §4.1. */
  description: string;
  /**
   * LOOKUP_VALUES.MENUS_ID — khóa ngoại tới bảng MENU, nullable.
   *
   * Giữ trong kiểu dữ liệu cho đủ cấu trúc §4.1 nhưng KHÔNG đưa lên giao diện:
   * hệ thống chưa có danh mục MENU nào để tham chiếu, và không tài liệu nào
   * trong ba UC nhắc tới trường này ở phần đặc tả màn hình.
   */
  menusId: number | null;
}

/**
 * Mã nhóm của từng danh mục.
 *
 * ⚠️ CÁC TÀI LIỆU KHÔNG NHẤT QUÁN VỀ QUY ƯỚC ĐẶT MÃ NHÓM:
 *
 *   - IMS-008 §4.1 ghi mặc định `ENTERPRISE_TYPE`, nhưng §5.3.1 của cùng tài
 *     liệu gửi `"lookupGroup": "IDS_TYPE_OF_BUSINESS"`.
 *   - HNX-SRS §4.1 ghi mặc định `POSITION`.
 *   - IMS-015 §5.3.1/5.3.4 dùng ví dụ `"lookupGroup": "IDS_COMPANY_TYPE"`.
 *
 * Tức là phần mô tả CSDL dùng mã trần (`POSITION`), còn phần API dùng mã có tiền
 * tố `IDS_`. Ở đây lấy theo §4.1 vì đó là phần mô tả cấu trúc dữ liệu, nhưng
 * **cần chốt lại quy ước với bên phân tích trước khi nối API thật**.
 */
export const LOV_GROUP = {
  position: 'POSITION',
  enterpriseType: 'ENTERPRISE_TYPE',
  marketMember: 'MARKET_MEMBER',
} as const;

/**
 * Nhãn tiếng Việt của từng nhóm từ điển, cho ô lọc "Loại" ở màn hình IMS-015.
 *
 * Bảng `LOOKUP_VALUES` thật sẽ có hàng chục nhóm; đây là ba nhóm đã dựng dữ liệu
 * mẫu. Khi nối API thật thì danh sách này lấy từ `GET` danh sách nhóm.
 */
export const DICTIONARY_GROUPS: ReadonlyArray<{ code: string; label: string }> = [
  { code: LOV_GROUP.position, label: 'Chức vụ' },
  { code: LOV_GROUP.enterpriseType, label: 'Loại hình doanh nghiệp' },
  { code: LOV_GROUP.marketMember, label: 'Thành viên thị trường' },
];

export function dictionaryGroupLabel(code: string): string {
  return DICTIONARY_GROUPS.find((g) => g.code === code)?.label ?? code;
}

/**
 * Chức vụ — `LOV_GROUP = 'POSITION'`, dải id 1–9.
 *
 * Các chức vụ dùng khi khai báo người công bố thông tin và người nội bộ của tổ
 * chức niêm yết. `updatedDate` cố tình lệch thứ tự khai báo: HNX-SRS yêu cầu danh
 * sách mặc định sắp theo NGÀY CẬP NHẬT (không phải ngày tạo như các UC khác), có
 * vậy mới kiểm được là đã sắp đúng cột.
 */
export const INITIAL_POSITIONS: readonly LookupValueRow[] = [
  {
    id: 1,
    code: 'CHU_TICH_HDQT',
    value: 'Chủ tịch Hội đồng quản trị',
    lovGroup: LOV_GROUP.position,
    lookupParentId: null,
    displayOrder: 1,
    description: 'Người đại diện cao nhất của Hội đồng quản trị',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-09T08:00:00+07:00',
  },
  {
    id: 2,
    code: 'TGD',
    value: 'Tổng Giám đốc',
    lovGroup: LOV_GROUP.position,
    lookupParentId: null,
    displayOrder: 2,
    description: 'Người điều hành cao nhất, thường là người CBTT',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-09T08:05:00+07:00',
    updatedBy: 'nqt.hnx',
    updatedDate: '2026-06-15T10:00:00+07:00',
  },
  {
    id: 3,
    code: 'PTGD',
    value: 'Phó Tổng Giám đốc',
    lovGroup: LOV_GROUP.position,
    // Có cha: nằm dưới Tổng Giám đốc (id 2) — minh họa LOOKUP_PARENT_ID.
    lookupParentId: 2,
    displayOrder: 3,
    description: '',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-02-20T09:30:00+07:00',
    updatedBy: 'nqt.hnx',
    updatedDate: '2026-03-02T14:00:00+07:00',
  },
  {
    id: 4,
    code: 'KE_TOAN_TRUONG',
    value: 'Kế toán trưởng',
    lovGroup: LOV_GROUP.position,
    lookupParentId: null,
    displayOrder: 4,
    description: 'Người ký báo cáo tài chính',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-04-18T11:20:00+07:00',
  },
  {
    id: 5,
    code: 'TRUONG_BKS',
    value: 'Trưởng Ban kiểm soát',
    lovGroup: LOV_GROUP.position,
    lookupParentId: null,
    // Chưa đặt thứ tự: cột nullable, danh sách phải hiện "—".
    displayOrder: null,
    description: 'Không còn áp dụng với công ty theo mô hình Ban kiểm toán nội bộ',
    menusId: null,
    statusFlg: 0,
    activeFlg: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-09T08:10:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-05-06T16:45:00+07:00',
  },
];

/**
 * Loại hình doanh nghiệp — `LOV_GROUP = 'ENTERPRISE_TYPE'`, dải id 11–19.
 *
 * Các loại hình theo Luật Doanh nghiệp, dùng khi khai báo hồ sơ tổ chức niêm yết.
 */
export const INITIAL_ENTERPRISE_TYPES: readonly LookupValueRow[] = [
  {
    id: 11,
    code: 'CTCP',
    value: 'Công ty cổ phần',
    lovGroup: LOV_GROUP.enterpriseType,
    lookupParentId: null,
    displayOrder: 1,
    description: 'Loại hình bắt buộc để được niêm yết cổ phiếu',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-10T08:00:00+07:00',
    updatedBy: 'nqt.hnx',
    updatedDate: '2026-07-01T09:00:00+07:00',
  },
  {
    id: 12,
    code: 'TNHH_1TV',
    value: 'Công ty TNHH một thành viên',
    lovGroup: LOV_GROUP.enterpriseType,
    lookupParentId: null,
    displayOrder: 2,
    description: '',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-10T08:05:00+07:00',
  },
  {
    id: 13,
    code: 'TNHH_2TV',
    value: 'Công ty TNHH hai thành viên trở lên',
    lovGroup: LOV_GROUP.enterpriseType,
    lookupParentId: null,
    displayOrder: 3,
    description: 'Tổ chức phát hành trái phiếu riêng lẻ thường thuộc loại này',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-03-22T13:15:00+07:00',
  },
  {
    id: 14,
    code: 'DNNN',
    value: 'Doanh nghiệp nhà nước',
    lovGroup: LOV_GROUP.enterpriseType,
    lookupParentId: null,
    displayOrder: 4,
    description: 'Nhà nước giữ trên 50% vốn điều lệ',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-05-30T10:40:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-06-11T08:20:00+07:00',
  },
  {
    id: 15,
    code: 'CTHD',
    value: 'Công ty hợp danh',
    lovGroup: LOV_GROUP.enterpriseType,
    lookupParentId: null,
    displayOrder: 5,
    description: 'Không thuộc diện niêm yết, giữ lại để tra cứu',
    menusId: null,
    statusFlg: 0,
    activeFlg: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-10T08:10:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-02-05T15:30:00+07:00',
  },
];

/**
 * Thành viên thị trường — `LOV_GROUP = 'MARKET_MEMBER'`, dải id 21–29.
 *
 * ⚠️ NHÓM NÀY LÀ SUY LUẬN, KHÔNG CÓ TRONG TÀI LIỆU.
 *
 * Yêu cầu nêu "[IMS-015] bao gồm IMS-013 Quản lý danh mục Thành viên thị trường",
 * nhưng `docs/srs/` không có file IMS-013, và cụm "IMS-013" cũng như "Thành viên
 * thị trường" KHÔNG xuất hiện một lần nào trong tài liệu IMS-015. Cách hiểu khớp
 * với những gì tài liệu nói: IMS-015 quản lý mọi `LOV_GROUP`, nên danh mục Thành
 * viên thị trường là một nhóm bên trong nó chứ không phải một màn hình riêng.
 *
 * Mã nhóm `MARKET_MEMBER` do đó là do đặt ra, cần chốt lại khi có SRS IMS-013.
 *
 * Dữ liệu mẫu là các công ty chứng khoán thành viên giao dịch của HNX.
 */
export const INITIAL_MARKET_MEMBERS: readonly LookupValueRow[] = [
  {
    id: 21,
    code: 'SSI',
    value: 'Công ty CP Chứng khoán SSI',
    lovGroup: LOV_GROUP.marketMember,
    lookupParentId: null,
    displayOrder: 1,
    description: 'Thành viên giao dịch cổ phiếu và trái phiếu',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-15T09:00:00+07:00',
    updatedBy: 'nqt.hnx',
    updatedDate: '2026-04-09T11:30:00+07:00',
  },
  {
    id: 22,
    code: 'VND',
    value: 'Công ty CP Chứng khoán VNDIRECT',
    lovGroup: LOV_GROUP.marketMember,
    lookupParentId: null,
    displayOrder: 2,
    description: 'Thành viên giao dịch cổ phiếu',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-15T09:05:00+07:00',
  },
  {
    id: 23,
    code: 'HCM',
    value: 'Công ty CP Chứng khoán TP. Hồ Chí Minh',
    lovGroup: LOV_GROUP.marketMember,
    lookupParentId: null,
    displayOrder: 3,
    description: '',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-06-03T14:20:00+07:00',
  },
  {
    id: 24,
    code: 'VCI',
    value: 'Công ty CP Chứng khoán Vietcap',
    lovGroup: LOV_GROUP.marketMember,
    lookupParentId: null,
    displayOrder: 4,
    description: 'Thành viên giao dịch trái phiếu doanh nghiệp riêng lẻ',
    menusId: null,
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-02-26T10:10:00+07:00',
  },
  {
    id: 25,
    code: 'ABS',
    value: 'Công ty CP Chứng khoán An Bình',
    lovGroup: LOV_GROUP.marketMember,
    lookupParentId: null,
    displayOrder: null,
    description: 'Đã tạm ngừng tư cách thành viên',
    menusId: null,
    statusFlg: 0,
    activeFlg: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-15T09:10:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-05-21T16:00:00+07:00',
  },
];

/**
 * Toàn bộ bảng `LOOKUP_VALUES` — nguồn dữ liệu của màn hình [IMS-015].
 *
 * IMS-015 là màn hình quản trị của cả bảng nên đọc hợp của mọi nhóm, còn HNX-SRS
 * và IMS-008 mỗi màn hình chỉ đọc nhóm của mình. Nhờ vậy ba màn hình mô tả cùng
 * một tập dữ liệu chứ không phải ba bản sao rời nhau.
 */
export const ALL_DICTIONARY_ROWS: readonly LookupValueRow[] = [
  ...INITIAL_POSITIONS,
  ...INITIAL_ENTERPRISE_TYPES,
  ...INITIAL_MARKET_MEMBERS,
];
