/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { LookupCatalogConfig, LookupValuesCatalogScreen } from './LookupValuesCatalogScreen';
import { INITIAL_ENTERPRISE_TYPES, LOV_GROUP } from './lookupValuesMock';

/**
 * SRS: `docs/srs/[IMS-008] Quản lý danh mục Loại hình doanh nghiệp.md` (UC_1A_10)
 *
 * Danh mục Loại hình doanh nghiệp lấy từ bảng từ điển dùng chung `LOOKUP_VALUES`
 * với điều kiện `LOV_GROUP = 'ENTERPRISE_TYPE'`. Toàn bộ màn hình nằm ở
 * `LookupValuesCatalogScreen` — dùng chung với [HNX-SRS] Chức vụ. File này chỉ
 * khai báo phần khác nhau.
 *
 * ⚠️ Mã nhóm còn mâu thuẫn trong chính tài liệu: §4.1 ghi `ENTERPRISE_TYPE`, còn
 * payload ví dụ ở §5.3.1 gửi `IDS_TYPE_OF_BUSINESS`. Xem ghi chú ở
 * `lookupValuesMock.ts`.
 *
 * GIAI ĐOẠN NÀY LÀ UI TĨNH. Dữ liệu nằm trong `useState`, chưa gọi API.
 */
const CONFIG: LookupCatalogConfig = {
  moduleCode: 'uc_ims_008',
  heading: 'Loại hình doanh nghiệp',
  subtitle: 'Quản lý danh sách và tạo mới loại hình doanh nghiệp',
  entityLabel: 'loại hình doanh nghiệp',
  lovGroup: LOV_GROUP.enterpriseType,
  parentColumnLabel: 'Loại hình cấp trên',
  searchPlaceholder: 'Tìm kiếm Mã, Giá trị, Mô tả...',
  initialRows: INITIAL_ENTERPRISE_TYPES,
};

export const Ims008LoaiHinhDnView: React.FC = () => <LookupValuesCatalogScreen config={CONFIG} />;
