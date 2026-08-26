/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Kiểu dữ liệu chung của các bảng danh mục trong `docs/srs/`.
 *
 * Bảy bảng COUNTRIES, PROVINCES, WARDS, DEPARTMENTS... khai báo giống nhau ba
 * cột cờ và cặp người tạo/ngày tạo. Đặt ở một chỗ để `useCatalogList` có thể lọc
 * bản ghi đã xóa mềm mà không cần biết mình đang xử lý danh mục nào.
 */

/**
 * Cờ 0/1 của CSDL, giữ nguyên kiểu số thay vì đổi sang boolean: SRS §4.1 khai
 * báo `NUMBER(1,0) DEFAULT 1`, và payload API cũng nhận `activeFlg`.
 */
export type Flag = 0 | 1;

/** Phần khung mà mọi bản ghi danh mục đều có. */
export interface CatalogRecord {
  readonly id: number;
  /** Trạng thái hiển thị trên danh sách (`STATUS_FLG`). */
  statusFlg: Flag;
  /**
   * Cờ hoạt động (`ACTIVE_FLG`), tách khỏi `STATUS_FLG`.
   *
   * SRS chỉ dùng cờ này khi lọc dữ liệu cho các trường tham chiếu ở màn hình
   * khác ("chỉ lấy bản ghi có DELETE_FLG = 0 và ACTIVE_FLG = 1 và IS_SYNC = 0"),
   * nên các màn hình quản lý danh mục giữ nguyên giá trị chứ không cho sửa.
   */
  activeFlg: Flag;
  /**
   * Xóa mềm (`DELETE_FLG`).
   *
   * SRS nói rõ: xóa là cập nhật `DELETE_FLG = 1`, bản ghi biến khỏi danh sách
   * nhưng vẫn còn trong CSDL. Vì vậy màn hình lọc cờ này chứ không bỏ phần tử
   * khỏi mảng.
   */
  deleteFlg: Flag;
  readonly createdBy: string;
  /** `CREATED_DATE` — thứ tự sắp xếp mặc định của mọi danh sách danh mục. */
  readonly createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
}

/** Nhãn tiếng Việt của `STATUS_FLG`, dùng cho cả bộ lọc và form. */
export const STATUS_OPTIONS: ReadonlyArray<{ value: Flag; label: string }> = [
  { value: 1, label: 'Đang hoạt động' },
  { value: 0, label: 'Ngừng hoạt động' },
];

/** Độ dài tối đa dùng chung, lấy từ khai báo cột trong SRS §4.1. */
export const MAX_LEN = {
  /** `*_CD VARCHAR2(20)` */
  code: 20,
  /** `*_NAME_VN` / `*_NAME_EN VARCHAR2(200)` */
  name: 200,
  /** `DESCRIPTION VARCHAR2(2000)` */
  description: 2000,
  /** `REGION VARCHAR2(50)` — chỉ có ở PROVINCES. */
  region: 50,
  /**
   * `LOOKUP_VALUES.CODE` và `LOOKUP_VALUES.VALUE` đều là `VARCHAR2(255)` — rộng
   * hơn hẳn các bảng danh mục chuyên biệt, vì đây là bảng từ điển dùng chung cho
   * mọi nhóm giá trị (POSITION, ENTERPRISE_TYPE...).
   */
  lookupCode: 255,
  lookupValue: 255,
  /**
   * `LOOKUP_VALUES.DESCRIPTION VARCHAR2(255)` — HẸP HƠN `description` ở trên.
   *
   * HNX-SRS và IMS-008 để trống ô độ dài cho cột này, IMS-015 §4.1 ghi rõ 255.
   * Ba màn hình dùng chung một bảng nên dùng chung con số này, thay vì để hai
   * màn hình cho nhập tới 2000 ký tự rồi bị CSDL chặn.
   */
  lookupDescription: 255,
} as const;
