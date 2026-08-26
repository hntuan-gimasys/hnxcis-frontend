/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogRecord } from './catalogTypes';

/**
 * Dữ liệu mẫu cho [IMS-002] Quản lý danh mục Quốc gia.
 *
 * Cấu trúc bám đúng bảng `COUNTRIES` trong SRS §4.1. Phần cờ và mốc thời gian
 * dùng chung nằm ở `CatalogRecord` (`catalogTypes.ts`) vì cả bảy bảng danh mục
 * khai báo giống nhau; ở đây chỉ khai báo các cột riêng của COUNTRIES.
 *
 * Khi nối API thật (`api/masterdata/lookup-values`) thì chỉ phải đổi nguồn dữ
 * liệu, không phải viết lại màn hình.
 */
export interface CountryRow extends CatalogRecord {
  /** COUNTRIES.COUNTRY_CD — mã quốc gia, VARCHAR2(20), NOT NULL. */
  countryCd: string;
  /** COUNTRIES.COUNTRY_NAME_VI — tên tiếng Việt, VARCHAR2(200), NOT NULL. */
  countryNameVi: string;
  /** COUNTRIES.COUNTRY_NAME_EN — tên tiếng Anh, VARCHAR2(200), NOT NULL. */
  countryNameEn: string;
  /** COUNTRIES.DESCRIPTION — mô tả, VARCHAR2(2000), cho phép rỗng. */
  description: string;
}

/**
 * Năm bản ghi mẫu, đủ để thấy cả hai trạng thái và một bản ghi chưa có mô tả
 * (cột Mô tả phải hiển thị chữ mờ thay vì để trống).
 *
 * `createdDate` cố tình không theo thứ tự mã: có vậy mới kiểm được rằng danh
 * sách mặc định sắp theo ngày tạo giảm dần đúng như SRS, chứ không phải tình cờ
 * trùng thứ tự khai báo.
 */
export const INITIAL_COUNTRIES: readonly CountryRow[] = [
  {
    id: 1,
    countryCd: 'VN',
    countryNameVi: 'Việt Nam',
    countryNameEn: 'Viet Nam',
    description: 'Quốc gia mặc định cho tổ chức niêm yết trong nước',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-05T09:12:00+07:00',
  },
  {
    id: 2,
    countryCd: 'SG',
    countryNameVi: 'Singapore',
    countryNameEn: 'Singapore',
    description: 'Tổ chức phát hành có trụ sở tại Singapore',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-03-18T14:05:00+07:00',
    updatedBy: 'nqt.hnx',
    updatedDate: '2026-05-02T08:40:00+07:00',
  },
  {
    id: 3,
    countryCd: 'JP',
    countryNameVi: 'Nhật Bản',
    countryNameEn: 'Japan',
    description: '',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-02-27T10:30:00+07:00',
  },
  {
    id: 4,
    countryCd: 'KR',
    countryNameVi: 'Hàn Quốc',
    countryNameEn: 'Korea, Republic of',
    description: 'Dùng cho nhà đầu tư nước ngoài tổ chức',
    statusFlg: 1,
    activeFlg: 1,
    deleteFlg: 0,
    createdBy: 'nqt.hnx',
    createdDate: '2026-06-11T16:20:00+07:00',
  },
  {
    id: 5,
    countryCd: 'AN',
    countryNameVi: 'Hà Lan thuộc Antilles',
    countryNameEn: 'Netherlands Antilles',
    description: 'Đã giải thể năm 2010, giữ lại để tra cứu dữ liệu lịch sử',
    statusFlg: 0,
    activeFlg: 0,
    deleteFlg: 0,
    createdBy: 'admin',
    createdDate: '2026-01-05T09:15:00+07:00',
    updatedBy: 'admin',
    updatedDate: '2026-04-21T11:02:00+07:00',
  },
];
