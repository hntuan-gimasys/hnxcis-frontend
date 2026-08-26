/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogRecord } from './catalogTypes';

/**
 * Dữ liệu mẫu cho [IMS-004] Quản lý danh mục Xã phường.
 *
 * Cấu trúc bám bảng `WARDS` trong SRS §4.1. Khác với PROVINCES ở một điểm quan
 * trọng: `PROVINCE_CD` được đánh dấu **FK** rõ ràng trong tài liệu, nên liên kết
 * cấp cha ở màn hình này là yêu cầu của SRS chứ không phải phần mở rộng.
 */
export interface WardRow extends CatalogRecord {
  /** WARDS.WARD_CD — mã phường/xã, VARCHAR2(20), NOT NULL. */
  wardCd: string;
  /** WARDS.WARD_NAME_VN — tên tiếng Việt, VARCHAR2(200), NOT NULL. */
  wardNameVn: string;
  /**
   * WARDS.WARD_NAME_EN — tên tiếng Anh, VARCHAR2(200), **NULLABLE**.
   * Chuỗi rỗng nghĩa là chưa nhập, hiển thị dấu "—" trên danh sách.
   */
  wardNameEn: string;
  /**
   * WARDS.PROVINCE_CD — khóa ngoại tới PROVINCES, VARCHAR2(20), **NULLABLE**.
   *
   * SRS cho phép NULL nên form không bắt buộc chọn tỉnh/thành. Về nghiệp vụ thì
   * một phường/xã luôn thuộc một tỉnh/thành, nhưng ràng buộc NOT NULL không có
   * trong tài liệu — nếu chốt là bắt buộc thì siết ở `Ims004WardFormModal`.
   */
  provinceCd: string;
  /** WARDS.DESCRIPTION — mô tả, VARCHAR2(2000), cho phép rỗng. */
  description: string;
}

/**
 * Năm bản ghi mẫu, trải trên ba tỉnh/thành ('01' Hà Nội, '48' Đà Nẵng,
 * '79' TP.HCM) để bộ lọc cấp cha trên toolbar có gì để lọc.
 *
 * `createdDate` cố tình không theo thứ tự mã, có vậy mới kiểm được rằng danh sách
 * mặc định sắp theo ngày tạo giảm dần đúng như SRS.
 */
export const INITIAL_WARDS: readonly WardRow[] = [
  {
    id: 1,
    wardCd: '00001',
    wardNameVn: 'Phường Phúc Xá',
    wardNameEn: 'Phuc Xa Ward',
    provinceCd: '01',
    description: 'Quận Ba Đình',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-12T10:00:00+07:00',
  },
  {
    id: 2,
    wardCd: '00256',
    wardNameVn: 'Phường Hàng Trống',
    wardNameEn: 'Hang Trong Ward',
    provinceCd: '01',
    description: '',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-03-05T14:30:00+07:00',
  },
  {
    id: 3,
    wardCd: '26734',
    wardNameVn: 'Phường Bến Nghé',
    wardNameEn: 'Ben Nghe Ward',
    provinceCd: '79',
    description: 'Quận 1, nơi đặt trụ sở nhiều tổ chức niêm yết',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-05-19T09:45:00+07:00',
  },
  {
    id: 4,
    wardCd: '20194',
    wardNameVn: 'Phường Thạch Thang',
    wardNameEn: 'Thach Thang Ward',
    provinceCd: '48',
    description: 'Quận Hải Châu',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-02-08T16:15:00+07:00',
  },
  {
    id: 5,
    wardCd: '11446',
    wardNameVn: 'Phường An Hải Bắc',
    // Tên tiếng Anh để rỗng: cột NULLABLE, danh sách phải hiện "—" chứ không lỗi.
    wardNameEn: '',
    provinceCd: '48',
    description: 'Đã sáp nhập, giữ lại để tra cứu dữ liệu lịch sử',
    statusFlg: 0,
    activeFlg: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-12T09:15:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-06-30T10:05:00+07:00',
  },
];
