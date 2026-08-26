/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogRecord } from './catalogTypes';

/**
 * Dữ liệu mẫu cho [IMS-003] Quản lý danh mục Tỉnh thành.
 *
 * Cấu trúc bám bảng `PROVINCES` trong SRS §4.1. Lưu ý ba điểm khác COUNTRIES:
 *
 *   1. `PROVINCE_NAME_EN` là NULLABLE (COUNTRIES thì cả hai tên đều NOT NULL),
 *      nên form không bắt buộc nhập tên tiếng Anh.
 *   2. Có thêm cột `REGION VARCHAR2(50)` — vùng/miền, cho phép rỗng.
 *   3. `countryCd` KHÔNG có trong SRS §4.1 — xem ghi chú ở trường bên dưới.
 */
export interface ProvinceRow extends CatalogRecord {
  /** PROVINCES.PROVINCE_CD — mã tỉnh/thành, VARCHAR2(20), NOT NULL. */
  provinceCd: string;
  /** PROVINCES.PROVINCE_NAME_VN — tên tiếng Việt, VARCHAR2(200), NOT NULL. */
  provinceNameVn: string;
  /**
   * PROVINCES.PROVINCE_NAME_EN — tên tiếng Anh, VARCHAR2(200), **NULLABLE**.
   * Chuỗi rỗng nghĩa là chưa nhập, hiển thị dấu "—" trên danh sách.
   */
  provinceNameEn: string;
  /** PROVINCES.REGION — vùng/miền, VARCHAR2(50), cho phép rỗng. */
  region: string;
  /**
   * ⚠️ MỞ RỘNG NGOÀI SRS — bảng PROVINCES ở §4.1 KHÔNG có khóa ngoại tới
   * COUNTRIES (cột FK để trống ở mọi dòng).
   *
   * Thêm vào theo yêu cầu "mock data có liên kết với Quốc gia", và vì chuỗi
   * Quốc gia → Tỉnh thành → Xã phường chỉ có nghĩa khi cấp giữa có cha. So sánh:
   * WARDS ở [IMS-004] §4.1 có `PROVINCE_CD` được đánh dấu FK rõ ràng.
   *
   * Nếu chốt lại là PROVINCES không có cột này thì bỏ ba chỗ: trường ở đây, ô
   * chọn trong `Ims003ProvinceFormModal`, và cột "Quốc gia" trên danh sách.
   */
  countryCd: string;
  /** PROVINCES.DESCRIPTION — mô tả, VARCHAR2(2000), cho phép rỗng. */
  description: string;
}

/**
 * Vùng/miền cho cột `REGION`.
 *
 * SRS chỉ khai báo `VARCHAR2(50)` mà không nêu tập giá trị. Dùng dropdown ba giá
 * trị thay vì để nhập tự do: cột này sẽ được dùng để nhóm/lọc báo cáo, mà nhập
 * tự do thì "Miền Bắc", "miền bắc" và "Bắc" sẽ thành ba nhóm khác nhau.
 */
export const REGION_OPTIONS: readonly string[] = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];

/**
 * Năm bản ghi mẫu.
 *
 * Mã tỉnh dùng mã của Tổng cục Thống kê ('01' Hà Nội, '31' Hải Phòng...) để dữ
 * liệu trông giống thật. `createdDate` cố tình không theo thứ tự mã, có vậy mới
 * kiểm được rằng danh sách mặc định sắp theo ngày tạo giảm dần đúng như SRS.
 *
 * Bản ghi cuối gắn với quốc gia SG và có `activeFlg = 0`: nó vừa cho thấy liên
 * kết quốc gia hoạt động với nhiều nước, vừa là ca kiểm thử cho luật "trường
 * tham chiếu chỉ lấy bản ghi ACTIVE_FLG = 1" ở màn hình Xã phường.
 */
export const INITIAL_PROVINCES: readonly ProvinceRow[] = [
  {
    id: 1,
    provinceCd: '01',
    provinceNameVn: 'Thành phố Hà Nội',
    provinceNameEn: 'Hanoi',
    region: 'Miền Bắc',
    countryCd: 'VN',
    description: 'Thủ đô, nơi đặt trụ sở Sở Giao dịch Chứng khoán Hà Nội',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-08T09:00:00+07:00',
  },
  {
    id: 2,
    provinceCd: '31',
    provinceNameVn: 'Thành phố Hải Phòng',
    // Tên tiếng Anh để rỗng: cột NULLABLE, danh sách phải hiện "—" chứ không lỗi.
    provinceNameEn: '',
    region: 'Miền Bắc',
    countryCd: 'VN',
    description: 'Thành phố cảng trực thuộc trung ương',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-04-02T11:25:00+07:00',
  },
  {
    id: 3,
    provinceCd: '48',
    provinceNameVn: 'Thành phố Đà Nẵng',
    provinceNameEn: 'Da Nang',
    region: 'Miền Trung',
    countryCd: 'VN',
    description: '',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-02-14T15:40:00+07:00',
  },
  {
    id: 4,
    provinceCd: '79',
    provinceNameVn: 'Thành phố Hồ Chí Minh',
    provinceNameEn: 'Ho Chi Minh City',
    region: 'Miền Nam',
    countryCd: 'VN',
    description: 'Địa bàn tập trung nhiều tổ chức niêm yết nhất',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-06-20T08:10:00+07:00',
  },
  {
    id: 5,
    provinceCd: 'SG-CR',
    provinceNameVn: 'Khu vực Trung tâm',
    provinceNameEn: 'Central Region',
    region: '',
    countryCd: 'SG',
    description: 'Dùng cho địa chỉ tổ chức phát hành nước ngoài',
    statusFlg: 0,
    activeFlg: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-08T08:30:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-05-14T13:55:00+07:00',
  },
];
