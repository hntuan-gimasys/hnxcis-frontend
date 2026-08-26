/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Khung trang rỗng cho một chức năng đã có SRS nhưng chưa dựng nghiệp vụ.
 *
 * Giai đoạn này chỉ cần xác nhận menu và điều hướng chạy đúng, nên trang chỉ
 * hiển thị `<h1>` là Tên UC. Bảy view trong cùng thư mục đều dùng lại khung này
 * để khi dựng nghiệp vụ thật thì thay từng file một, không phải sửa bảy chỗ
 * giống nhau.
 */
interface UseCasePlaceholderProps {
  /** Mã UC trong tài liệu SRS, ví dụ `IMS-002`. */
  ucCode: string;
  /** Tên UC — nội dung thẻ `<h1>`. */
  title: string;
  /** Đường dẫn màn hình theo đặc tả SRS mục 2.1. */
  breadcrumb: string;
}

export const UseCasePlaceholder: React.FC<UseCasePlaceholderProps> = ({
  ucCode,
  title,
  breadcrumb,
}) => (
  <div className="p-6">
    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
      {breadcrumb}
    </div>

    <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>

    <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-xs">
      <span className="mr-2 rounded-sm bg-hnx-100 px-2 py-0.5 font-mono text-[11px] font-bold text-hnx-800">
        {ucCode}
      </span>
      Màn hình đang chờ dựng nghiệp vụ theo SRS.
    </div>
  </div>
);
