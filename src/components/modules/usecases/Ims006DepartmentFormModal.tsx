/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  BTN_OUTLINE,
  BTN_PRIMARY,
  ERROR_RING,
  FormField,
  INPUT_CLASS,
  ModalShell,
  SELECT_CLASS,
  TEXTAREA_CLASS,
} from './catalogUi';
import { Flag, MAX_LEN, STATUS_OPTIONS } from './catalogTypes';
import { DEPARTMENT_DEFAULT_ACTIVE_FLG, DepartmentRow } from './ims006DepartmentMock';

/**
 * Popup "Thêm mới / Cập nhật thông tin Phòng ban" — SRS [IMS-006] §2.4.
 *
 * Bảng 05 liệt kê bốn trường: Mã, Tên, Mô tả, Trạng thái. Form này có thêm hai
 * trường, cả hai lấy từ §4.1 của cùng tài liệu:
 *
 *   - Tên tiếng Việt / tiếng Anh tách đôi: `DEPT_NAME_VN` NOT NULL và
 *     `DEPT_NAME_EN` nullable.
 *   - Thứ tự hiển thị: `DISPLAY_ORDER_NUMBER` nullable. Phần mô tả nút "Sắp xếp"
 *     ở Bảng 04 cũng nhắc tới cột "Thứ tự hiển thị".
 *
 * KHÔNG có ô chọn phòng ban cấp cha: §4.1 không khai báo khóa ngoại tự trỏ.
 */

export interface DepartmentDraft {
  deptCd: string;
  deptNameVn: string;
  deptNameEn: string;
  displayOrderNumber: number | null;
  description: string;
  statusFlg: Flag;
}

interface Ims006DepartmentFormModalProps {
  /** `null` là thêm mới; có giá trị là cập nhật bản ghi đó. */
  editing: DepartmentRow | null;
  /**
   * Các mã phòng/ban đang tồn tại (đã trừ bản ghi đang sửa), để chặn trùng mã.
   * API thật trả 409 Conflict cho trường hợp này.
   */
  existingCodes: readonly string[];
  onCancel: () => void;
  onSave: (draft: DepartmentDraft) => void;
}

function toDraft(editing: DepartmentRow | null): DepartmentDraft {
  if (!editing) {
    return {
      deptCd: '',
      deptNameVn: '',
      deptNameEn: '',
      displayOrderNumber: null,
      description: '',
      // §4.1: ACTIVE_FLG mặc định 0 — phòng ban mới ở trạng thái NGỪNG hoạt động.
      // Khác hẳn COUNTRIES/PROVINCES/WARDS (mặc định 1); xem ghi chú ở mock.
      statusFlg: DEPARTMENT_DEFAULT_ACTIVE_FLG,
    };
  }

  return {
    deptCd: editing.deptCd,
    deptNameVn: editing.deptNameVn,
    deptNameEn: editing.deptNameEn,
    displayOrderNumber: editing.displayOrderNumber,
    description: editing.description,
    statusFlg: editing.statusFlg,
  };
}

type FieldKey = 'deptCd' | 'deptNameVn' | 'displayOrderNumber';

function validate(
  draft: DepartmentDraft,
  existingCodes: readonly string[],
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};

  const code = draft.deptCd.trim();
  if (!code) {
    errors.deptCd = 'Mã Phòng ban là bắt buộc';
  } else if (code.length > MAX_LEN.code) {
    errors.deptCd = `Mã Phòng ban tối đa ${MAX_LEN.code} ký tự`;
  } else if (existingCodes.some((c) => c.toLowerCase() === code.toLowerCase())) {
    errors.deptCd = 'Mã Phòng ban đã tồn tại';
  }

  if (!draft.deptNameVn.trim()) {
    errors.deptNameVn = 'Tên Phòng ban (Tiếng Việt) là bắt buộc';
  }

  // Tên tiếng Anh KHÔNG kiểm tra bắt buộc: §4.1 cho phép NULL.

  if (draft.displayOrderNumber !== null && draft.displayOrderNumber < 0) {
    errors.displayOrderNumber = 'Thứ tự hiển thị không được là số âm';
  }

  return errors;
}

export const Ims006DepartmentFormModal: React.FC<Ims006DepartmentFormModalProps> = ({
  editing,
  existingCodes,
  onCancel,
  onSave,
}) => {
  const [draft, setDraft] = useState<DepartmentDraft>(() => toDraft(editing));

  /**
   * Chỉ hiện lỗi sau lần bấm Lưu đầu tiên. Bật lỗi ngay khi vừa mở form sẽ tô đỏ
   * mọi trường bắt buộc trước khi người dùng kịp gõ chữ nào.
   */
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(draft, existingCodes);
  const shownErrors = submitted ? errors : {};

  const set = <K extends keyof DepartmentDraft>(key: K, value: DepartmentDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onSave({
      ...draft,
      deptCd: draft.deptCd.trim(),
      deptNameVn: draft.deptNameVn.trim(),
      deptNameEn: draft.deptNameEn.trim(),
      description: draft.description.trim(),
    });
  };

  const inputClass = (key: FieldKey) => `${INPUT_CLASS} ${shownErrors[key] ? ERROR_RING : ''}`;

  return (
    <ModalShell
      title={editing ? 'Chỉnh sửa Phòng ban' : 'Thêm mới Phòng ban'}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={BTN_OUTLINE} onClick={onCancel}>
            Hủy bỏ
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={submit}>
            Lưu
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4 px-5 py-5"
      >
        <FormField label="Mã Phòng ban" required error={shownErrors.deptCd}>
          <input
            type="text"
            autoFocus
            value={draft.deptCd}
            maxLength={MAX_LEN.code}
            onChange={(e) => set('deptCd', e.target.value.toUpperCase())}
            placeholder="VD: QLNY"
            className={inputClass('deptCd')}
          />
        </FormField>

        <FormField label="Tên Phòng ban (Tiếng Việt)" required error={shownErrors.deptNameVn}>
          <input
            type="text"
            value={draft.deptNameVn}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('deptNameVn', e.target.value)}
            placeholder="VD: Phòng Quản lý Niêm yết"
            className={inputClass('deptNameVn')}
          />
        </FormField>

        <FormField
          label="Tên Phòng ban (Tiếng Anh)"
          hint="Không bắt buộc — DEPT_NAME_EN cho phép để trống"
        >
          <input
            type="text"
            value={draft.deptNameEn}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('deptNameEn', e.target.value)}
            placeholder="VD: Listing Management Department"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          label="Thứ tự hiển thị"
          error={shownErrors.displayOrderNumber}
          hint="Không bắt buộc — để trống nếu chưa cần sắp thứ tự"
        >
          <input
            type="number"
            min={0}
            value={draft.displayOrderNumber ?? ''}
            onChange={(e) =>
              // Ô số để trống phải thành null (chưa đặt thứ tự), không phải 0 —
              // 0 là một thứ tự hợp lệ và sẽ đẩy bản ghi lên đầu danh sách.
              set('displayOrderNumber', e.target.value === '' ? null : Number(e.target.value))
            }
            placeholder="VD: 1"
            className={inputClass('displayOrderNumber')}
          />
        </FormField>

        <FormField
          label="Trạng thái"
          required
          hint={
            editing
              ? undefined
              : 'SRS §4.1 đặt ACTIVE_FLG mặc định = 0, nên phòng ban mới ở trạng thái Ngừng hoạt động'
          }
        >
          <select
            value={draft.statusFlg}
            onChange={(e) => set('statusFlg', Number(e.target.value) as Flag)}
            className={SELECT_CLASS}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Mô tả" hint={`${draft.description.length}/${MAX_LEN.description} ký tự`}>
          <textarea
            value={draft.description}
            maxLength={MAX_LEN.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Mô tả (tùy chọn)"
            className={TEXTAREA_CLASS}
          />
        </FormField>

        {/* Nút submit ẩn: cho phép Enter lưu form mà không nhân đôi nút Lưu. */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </ModalShell>
  );
};
