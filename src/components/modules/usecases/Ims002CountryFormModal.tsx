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
import { CountryRow } from './ims002CountryMock';

/**
 * Popup "Thêm mới / Cập nhật thông tin Quốc gia" — SRS [IMS-002] §2.4.
 *
 * Bảng 05 của SRS liệt kê bốn trường nhập: Mã Quốc gia, Tên Quốc gia, Mô tả,
 * Trạng thái. Ở đây tách "Tên Quốc gia" thành hai trường VI và EN, vì bảng
 * COUNTRIES (§4.1) khai báo CẢ HAI `COUNTRY_NAME_VI` và `COUNTRY_NAME_EN` là NOT
 * NULL — form chỉ thu một tên thì bản ghi không thể lưu được xuống CSDL.
 */

/** Giá trị người dùng đang nhập; tất cả là chuỗi vì input trả về chuỗi. */
export interface CountryDraft {
  countryCd: string;
  countryNameVi: string;
  countryNameEn: string;
  description: string;
  statusFlg: Flag;
}

interface Ims002CountryFormModalProps {
  /** `null` là thêm mới; có giá trị là cập nhật bản ghi đó. */
  editing: CountryRow | null;
  /**
   * Các mã quốc gia đang tồn tại (đã trừ bản ghi đang sửa), để chặn trùng mã
   * ngay trên giao diện. API thật trả 409 Conflict cho trường hợp này (SRS §5.4)
   * — báo trước ở client thì người dùng không mất một vòng gọi mạng.
   */
  existingCodes: readonly string[];
  onCancel: () => void;
  onSave: (draft: CountryDraft) => void;
}

function toDraft(editing: CountryRow | null): CountryDraft {
  if (!editing) {
    // SRS §4.1: STATUS_FLG mặc định 1 — bản ghi mới hoạt động ngay.
    return {
      countryCd: '',
      countryNameVi: '',
      countryNameEn: '',
      description: '',
      statusFlg: 1,
    };
  }

  return {
    countryCd: editing.countryCd,
    countryNameVi: editing.countryNameVi,
    countryNameEn: editing.countryNameEn,
    description: editing.description,
    statusFlg: editing.statusFlg,
  };
}

type FieldKey = keyof Omit<CountryDraft, 'statusFlg'>;

function validate(
  draft: CountryDraft,
  existingCodes: readonly string[],
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};

  const code = draft.countryCd.trim();
  if (!code) {
    errors.countryCd = 'Mã Quốc gia là bắt buộc';
  } else if (code.length > MAX_LEN.code) {
    errors.countryCd = `Mã Quốc gia tối đa ${MAX_LEN.code} ký tự`;
  } else if (existingCodes.some((c) => c.toLowerCase() === code.toLowerCase())) {
    errors.countryCd = 'Mã Quốc gia đã tồn tại';
  }

  if (!draft.countryNameVi.trim()) {
    errors.countryNameVi = 'Tên Quốc gia (Tiếng Việt) là bắt buộc';
  }
  if (!draft.countryNameEn.trim()) {
    errors.countryNameEn = 'Tên Quốc gia (Tiếng Anh) là bắt buộc';
  }

  return errors;
}

export const Ims002CountryFormModal: React.FC<Ims002CountryFormModalProps> = ({
  editing,
  existingCodes,
  onCancel,
  onSave,
}) => {
  const [draft, setDraft] = useState<CountryDraft>(() => toDraft(editing));

  /**
   * Chỉ hiện lỗi sau lần bấm Lưu đầu tiên. Bật lỗi ngay khi vừa mở form sẽ tô đỏ
   * mọi trường bắt buộc trước khi người dùng kịp gõ chữ nào.
   */
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(draft, existingCodes);
  const shownErrors = submitted ? errors : {};

  const set = <K extends keyof CountryDraft>(key: K, value: CountryDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onSave({
      ...draft,
      countryCd: draft.countryCd.trim(),
      countryNameVi: draft.countryNameVi.trim(),
      countryNameEn: draft.countryNameEn.trim(),
      description: draft.description.trim(),
    });
  };

  const inputClass = (key: FieldKey) => `${INPUT_CLASS} ${shownErrors[key] ? ERROR_RING : ''}`;

  return (
    <ModalShell
      title={editing ? 'Chỉnh sửa Quốc gia' : 'Thêm mới Quốc gia'}
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
      {/*
        Bọc bằng <form> để Enter trong ô input là lưu, giống mọi form nhập liệu
        khác; onSubmit chặn reload trang.
      */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4 px-5 py-5"
      >
        <FormField label="Mã Quốc gia" required error={shownErrors.countryCd}>
          <input
            type="text"
            autoFocus
            value={draft.countryCd}
            maxLength={MAX_LEN.code}
            onChange={(e) => set('countryCd', e.target.value.toUpperCase())}
            placeholder="VD: VN"
            className={inputClass('countryCd')}
          />
        </FormField>

        <FormField label="Tên Quốc gia (Tiếng Việt)" required error={shownErrors.countryNameVi}>
          <input
            type="text"
            value={draft.countryNameVi}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('countryNameVi', e.target.value)}
            placeholder="VD: Việt Nam"
            className={inputClass('countryNameVi')}
          />
        </FormField>

        <FormField label="Tên Quốc gia (Tiếng Anh)" required error={shownErrors.countryNameEn}>
          <input
            type="text"
            value={draft.countryNameEn}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('countryNameEn', e.target.value)}
            placeholder="VD: Viet Nam"
            className={inputClass('countryNameEn')}
          />
        </FormField>

        <FormField label="Trạng thái" required>
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

        <FormField
          label="Mô tả"
          hint={`${draft.description.length}/${MAX_LEN.description} ký tự`}
        >
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
