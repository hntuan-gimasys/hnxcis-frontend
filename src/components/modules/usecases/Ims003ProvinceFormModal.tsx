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
import { ProvinceRow, REGION_OPTIONS } from './ims003ProvinceMock';

/**
 * Popup "Thêm mới / Cập nhật thông tin Tỉnh thành" — SRS [IMS-003] §2.4.
 *
 * Bảng 05 liệt kê bốn trường: Mã, Tên, Mô tả, Trạng thái. Form này có thêm ba
 * trường, đều có lý do từ chính tài liệu:
 *
 *   - Tên tiếng Việt / tiếng Anh tách đôi: §4.1 có hai cột `PROVINCE_NAME_VN`
 *     (NOT NULL) và `PROVINCE_NAME_EN` (nullable). Chỉ thu một tên thì không đủ
 *     dữ liệu để lưu.
 *   - Vùng/Miền: cột `REGION` có trong §4.1 nhưng không có trong Bảng 05. Không
 *     đưa vào form thì đây là cột không bao giờ nhập được từ giao diện.
 *   - Quốc gia: mở rộng ngoài SRS, xem ghi chú ở `ims003ProvinceMock.ts`.
 */

export interface ProvinceDraft {
  provinceCd: string;
  provinceNameVn: string;
  provinceNameEn: string;
  region: string;
  countryCd: string;
  description: string;
  statusFlg: Flag;
}

interface Ims003ProvinceFormModalProps {
  /** `null` là thêm mới; có giá trị là cập nhật bản ghi đó. */
  editing: ProvinceRow | null;
  /**
   * Danh sách quốc gia cho ô chọn cha.
   *
   * Màn hình gọi đã lọc theo luật của SRS cho trường tham chiếu
   * (`DELETE_FLG = 0` và `ACTIVE_FLG = 1`) nên ở đây dùng thẳng.
   */
  countryOptions: readonly CountryRow[];
  /**
   * Các mã tỉnh/thành đang tồn tại (đã trừ bản ghi đang sửa), để chặn trùng mã.
   * API thật trả 409 Conflict cho trường hợp này (SRS §5.4).
   */
  existingCodes: readonly string[];
  onCancel: () => void;
  onSave: (draft: ProvinceDraft) => void;
}

function toDraft(editing: ProvinceRow | null, countryOptions: readonly CountryRow[]): ProvinceDraft {
  if (!editing) {
    return {
      provinceCd: '',
      provinceNameVn: '',
      provinceNameEn: '',
      region: '',
      // Quốc gia đầu danh sách làm mặc định: phần lớn tỉnh/thành nhập vào là của
      // Việt Nam, và VN là bản ghi đầu tiên trong danh mục Quốc gia.
      countryCd: countryOptions[0]?.countryCd ?? '',
      description: '',
      // SRS §4.1: STATUS_FLG mặc định 1 — bản ghi mới hoạt động ngay.
      statusFlg: 1,
    };
  }

  return {
    provinceCd: editing.provinceCd,
    provinceNameVn: editing.provinceNameVn,
    provinceNameEn: editing.provinceNameEn,
    region: editing.region,
    countryCd: editing.countryCd,
    description: editing.description,
    statusFlg: editing.statusFlg,
  };
}

type FieldKey = 'provinceCd' | 'provinceNameVn' | 'countryCd';

function validate(
  draft: ProvinceDraft,
  existingCodes: readonly string[],
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};

  const code = draft.provinceCd.trim();
  if (!code) {
    errors.provinceCd = 'Mã Tỉnh thành là bắt buộc';
  } else if (code.length > MAX_LEN.code) {
    errors.provinceCd = `Mã Tỉnh thành tối đa ${MAX_LEN.code} ký tự`;
  } else if (existingCodes.some((c) => c.toLowerCase() === code.toLowerCase())) {
    errors.provinceCd = 'Mã Tỉnh thành đã tồn tại';
  }

  if (!draft.provinceNameVn.trim()) {
    errors.provinceNameVn = 'Tên Tỉnh thành (Tiếng Việt) là bắt buộc';
  }

  // Tên tiếng Anh KHÔNG kiểm tra bắt buộc: §4.1 cho phép NULL.

  if (!draft.countryCd) {
    errors.countryCd = 'Quốc gia là bắt buộc';
  }

  return errors;
}

export const Ims003ProvinceFormModal: React.FC<Ims003ProvinceFormModalProps> = ({
  editing,
  countryOptions,
  existingCodes,
  onCancel,
  onSave,
}) => {
  const [draft, setDraft] = useState<ProvinceDraft>(() => toDraft(editing, countryOptions));

  /**
   * Chỉ hiện lỗi sau lần bấm Lưu đầu tiên. Bật lỗi ngay khi vừa mở form sẽ tô đỏ
   * mọi trường bắt buộc trước khi người dùng kịp gõ chữ nào.
   */
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(draft, existingCodes);
  const shownErrors = submitted ? errors : {};

  const set = <K extends keyof ProvinceDraft>(key: K, value: ProvinceDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onSave({
      ...draft,
      provinceCd: draft.provinceCd.trim(),
      provinceNameVn: draft.provinceNameVn.trim(),
      provinceNameEn: draft.provinceNameEn.trim(),
      description: draft.description.trim(),
    });
  };

  const inputClass = (key: FieldKey) => `${INPUT_CLASS} ${shownErrors[key] ? ERROR_RING : ''}`;

  /**
   * Bản ghi đang sửa có thể trỏ tới một quốc gia đã ngừng hoạt động — quốc gia đó
   * không nằm trong `countryOptions`. Không bù thêm một option cho nó thì ô chọn
   * sẽ nhảy về rỗng, và vì Quốc gia là trường bắt buộc, người dùng bị chặn không
   * lưu nổi bản ghi cho tới khi đổi sang một quốc gia khác.
   */
  const missingCurrentCountry =
    draft.countryCd !== '' && !countryOptions.some((c) => c.countryCd === draft.countryCd);

  return (
    <ModalShell
      title={editing ? 'Chỉnh sửa Tỉnh thành' : 'Thêm mới Tỉnh thành'}
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
        <FormField label="Mã Tỉnh thành" required error={shownErrors.provinceCd}>
          <input
            type="text"
            autoFocus
            value={draft.provinceCd}
            maxLength={MAX_LEN.code}
            onChange={(e) => set('provinceCd', e.target.value.toUpperCase())}
            placeholder="VD: 01"
            className={inputClass('provinceCd')}
          />
        </FormField>

        <FormField label="Tên Tỉnh thành (Tiếng Việt)" required error={shownErrors.provinceNameVn}>
          <input
            type="text"
            value={draft.provinceNameVn}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('provinceNameVn', e.target.value)}
            placeholder="VD: Thành phố Hà Nội"
            className={inputClass('provinceNameVn')}
          />
        </FormField>

        <FormField
          label="Tên Tỉnh thành (Tiếng Anh)"
          hint="Không bắt buộc — PROVINCE_NAME_EN cho phép để trống"
        >
          <input
            type="text"
            value={draft.provinceNameEn}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('provinceNameEn', e.target.value)}
            placeholder="VD: Hanoi"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Quốc gia" required error={shownErrors.countryCd}>
          <select
            value={draft.countryCd}
            onChange={(e) => set('countryCd', e.target.value)}
            className={`${SELECT_CLASS} ${shownErrors.countryCd ? ERROR_RING : ''}`}
          >
            <option value="">— Chọn quốc gia —</option>
            {countryOptions.map((c) => (
              <option key={c.countryCd} value={c.countryCd}>
                {c.countryCd} — {c.countryNameVi}
              </option>
            ))}
            {missingCurrentCountry && (
              <option value={draft.countryCd}>{draft.countryCd} — (đã ngừng hoạt động)</option>
            )}
          </select>
        </FormField>

        <FormField label="Vùng/Miền" hint="Không bắt buộc — cột REGION cho phép để trống">
          <select
            value={draft.region}
            onChange={(e) => set('region', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— Không xác định —</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
