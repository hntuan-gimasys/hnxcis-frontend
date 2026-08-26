/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { LookupCatalogConfig, LookupValuesCatalogScreen } from './LookupValuesCatalogScreen';
import { INITIAL_POSITIONS, LOV_GROUP } from './lookupValuesMock';

/**
 * SRS: `docs/srs/[HNX-SRS] Quản lý Chức vụ.md` (UC_1A_9)
 *
 * Danh mục Chức vụ lấy từ bảng từ điển dùng chung `LOOKUP_VALUES` với điều kiện
 * `LOV_GROUP = 'POSITION'`. Toàn bộ màn hình nằm ở `LookupValuesCatalogScreen`
 * — dùng chung với [IMS-008] Loại hình doanh nghiệp, vì Bảng 04 của hai tài liệu
 * giống nhau đến từng dòng. File này chỉ khai báo phần khác nhau.
 *
 * GIAI ĐOẠN NÀY LÀ UI TĨNH. Dữ liệu nằm trong `useState`, chưa gọi API.
 */
const CONFIG: LookupCatalogConfig = {
  moduleCode: 'uc_hnx_srs',
  heading: 'Chức vụ',
  subtitle: 'Quản lý danh sách và tạo mới chức vụ',
  entityLabel: 'chức vụ',
  lovGroup: LOV_GROUP.position,
  parentColumnLabel: 'Chức vụ cấp trên',
  searchPlaceholder: 'Tìm kiếm Mã, Giá trị, Mô tả...',
  initialRows: INITIAL_POSITIONS,
};

export const HnxSrsChucVuView: React.FC = () => <LookupValuesCatalogScreen config={CONFIG} />;
