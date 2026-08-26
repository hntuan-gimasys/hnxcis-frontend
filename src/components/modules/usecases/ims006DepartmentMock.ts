/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogRecord, Flag } from './catalogTypes';

/**
 * Dữ liệu mẫu cho [IMS-006] Quản lý danh mục Phòng ban.
 *
 * Cấu trúc bám bảng `DEPARTMENTS` trong SRS §4.1. Bảng này lệch khá nhiều so với
 * COUNTRIES/PROVINCES/WARDS, ba điểm cần đọc kỹ:
 *
 *   1. KHÔNG có cột `STATUS_FLG`. Bảng 04 và Bảng 05 lại trỏ trường "Trạng thái"
 *      vào `DEPARTMENTS.STATUS_FLG` — cột không tồn tại trong §4.1. Ở đây coi
 *      "Trạng thái" trên màn hình là `ACTIVE_FLG`, cột duy nhất có thật mang
 *      nghĩa bật/tắt (xem `statusFlg` bên dưới).
 *   2. `ACTIVE_FLG` mặc định **0**, không phải 1. Ba bảng kia đều mặc định 1.
 *      Nghĩa là phòng ban tạo mới ở trạng thái NGỪNG hoạt động và phải được bật
 *      lên bằng một lần sửa nữa.
 *   3. Có thêm `DISPLAY_ORDER_NUMBER`, `SYNC_FLAG` và `IS_SYNC`.
 *
 *   4. KHÔNG có cột phòng ban cấp cha — §4.1 không khai báo khóa ngoại tự trỏ,
 *      nên màn hình này không có ô chọn phòng ban cha.
 */
export interface DepartmentRow extends CatalogRecord {
  /**
   * DEPARTMENTS.DEPT_CD — mã phòng/ban, VARCHAR2(20), NOT NULL.
   *
   * Lưu ý: §4.1 gọi cột này là `DEPT_CD` còn Bảng 04/05 gọi là `DEPARTMENT_CD`.
   * Lấy tên theo §4.1 vì đó là phần mô tả cấu trúc CSDL.
   */
  deptCd: string;
  /** DEPARTMENTS.DEPT_NAME_VN — tên tiếng Việt, VARCHAR2(200), NOT NULL. */
  deptNameVn: string;
  /**
   * DEPARTMENTS.DEPT_NAME_EN — tên tiếng Anh, VARCHAR2(200), **NULLABLE**.
   * Chuỗi rỗng nghĩa là chưa nhập, hiển thị dấu "—" trên danh sách.
   */
  deptNameEn: string;
  /** DEPARTMENTS.DESCRIPTION — mô tả, VARCHAR2(2000), cho phép rỗng. */
  description: string;
  /**
   * DEPARTMENTS.DISPLAY_ORDER_NUMBER — thứ tự hiển thị, NUMBER(10,0), nullable.
   *
   * Cột này KHÔNG có trong Bảng 04/05 nhưng có trong §4.1, và phần mô tả nút
   * "Sắp xếp" của Bảng 04 lại nhắc tới cột "Thứ tự hiển thị" — nên đưa vào cả
   * danh sách và form. `null` nghĩa là chưa đặt thứ tự.
   */
  displayOrderNumber: number | null;
  /**
   * DEPARTMENTS.SYNC_FLAG — NUMBER(1,0), nullable, mặc định 1.
   *
   * Cờ tích hợp với hệ thống ngoài, không phải dữ liệu người dùng nhập nên không
   * đưa vào form. §4.1 để trống phần mô tả nên chưa rõ ngữ nghĩa chính xác.
   */
  syncFlag: Flag;
  /**
   * DEPARTMENTS.IS_SYNC — NUMBER(1,0), nullable, mặc định 0.
   *
   * Tham gia vào luật lọc trường tham chiếu của SRS: "chỉ lấy các bản ghi có
   * DELETE_FLG = 0 và ACTIVE_FLG = 1 và IS_SYNC = 0". Không cho sửa từ giao diện.
   */
  isSync: Flag;
}

/**
 * `ACTIVE_FLG` mặc định của bản ghi mới, theo §4.1: **0** — ngừng hoạt động.
 *
 * Tách thành hằng số có tên để chỗ dùng đọc ra được ý định, thay vì một số 0
 * trần trông như lỗi đánh máy so với ba màn hình danh mục trước.
 */
export const DEPARTMENT_DEFAULT_ACTIVE_FLG: Flag = 0;

/**
 * Năm bản ghi mẫu — các phòng của Sở khớp với vai trò đang có trong hệ thống
 * (`ROLE_QLNY_*`, `ROLE_TTTP_*`, `ROLE_TTTT_*`, `ROLE_CNTT_*`, `ROLE_HTGD_*`).
 *
 * `createdDate` cố tình không theo thứ tự mã, có vậy mới kiểm được rằng danh sách
 * mặc định sắp theo ngày tạo giảm dần đúng như SRS.
 */
export const INITIAL_DEPARTMENTS: readonly DepartmentRow[] = [
  {
    id: 1,
    deptCd: 'QLNY',
    deptNameVn: 'Phòng Quản lý Niêm yết',
    deptNameEn: 'Listing Management Department',
    description: 'Quản lý hồ sơ niêm yết, trạng thái chứng khoán, phí niêm yết',
    displayOrderNumber: 1,
    statusFlg: 1,
    activeFlg: 1,
    syncFlag: 1,
    isSync: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-06T08:30:00+07:00',
  },
  {
    id: 2,
    deptCd: 'TTTP',
    deptNameVn: 'Phòng Thị trường Trái phiếu',
    deptNameEn: 'Bond Market Department',
    description: 'Quản lý trái phiếu riêng lẻ và trái phiếu xanh',
    displayOrderNumber: 2,
    statusFlg: 1,
    activeFlg: 1,
    syncFlag: 1,
    isSync: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-03-11T13:45:00+07:00',
  },
  {
    id: 3,
    deptCd: 'TTTT',
    deptNameVn: 'Phòng Công bố Thông tin',
    // Tên tiếng Anh để rỗng: cột NULLABLE, danh sách phải hiện "—" chứ không lỗi.
    deptNameEn: '',
    description: 'Tiếp nhận và phê duyệt tin công bố của tổ chức niêm yết',
    displayOrderNumber: 3,
    statusFlg: 1,
    activeFlg: 1,
    syncFlag: 1,
    isSync: 0,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-05-28T10:20:00+07:00',
  },
  {
    id: 4,
    deptCd: 'CNTT',
    deptNameVn: 'Phòng Công nghệ Thông tin',
    deptNameEn: 'Information Technology Department',
    description: '',
    // Chưa đặt thứ tự hiển thị: cột nullable, danh sách phải hiện "—".
    displayOrderNumber: null,
    statusFlg: 1,
    activeFlg: 1,
    syncFlag: 1,
    isSync: 0,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-02-19T15:05:00+07:00',
  },
  {
    id: 5,
    deptCd: 'HTGD',
    deptNameVn: 'Phòng Hỗ trợ Giao dịch',
    deptNameEn: 'Trading Support Department',
    description: 'Đã sáp nhập, giữ lại để tra cứu dữ liệu lịch sử',
    displayOrderNumber: 9,
    statusFlg: 0,
    activeFlg: 0,
    syncFlag: 1,
    isSync: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-06T08:15:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-07-02T09:40:00+07:00',
  },
];
