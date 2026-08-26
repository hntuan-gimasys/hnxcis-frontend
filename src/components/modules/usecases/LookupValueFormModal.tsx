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
import { LookupValueRow } from './lookupValuesMock';

/**
 * Popup Thêm mới / Cập nhật cho các danh mục dựa trên bảng `LOOKUP_VALUES`.
 *
 * Dùng chung cho [HNX-SRS] Chức vụ và [IMS-008] Loại hình doanh nghiệp: hai tài
 * liệu mô tả cùng một bộ trường trên cùng một bảng, chỉ khác `LOV_GROUP`.
 *
 * LƯU Ý VỀ ĐẶC TẢ: cả hai tài liệu KHÔNG có bảng mô tả popup (Bảng 03 chỉ khai
 * báo duy nhất một màn hình List View), trong khi Bảng 04 lại có nút "Thêm" và
 * "Sửa" kèm ghi chú "Click hiển thị màn hình/popup thêm mới". Các trường ở đây
 * lấy từ §4.1 — những cột người dùng có thể nhập.
 */

export interface LookupValueDraft {
  code: string;
  value: string;
  lookupParentId: number | null;
  description: string;
  statusFlg: Flag;
}

interface LookupValueFormModalProps {
  /** `null` là thêm mới; có giá trị là cập nhật bản ghi đó. */
  editing: LookupValueRow | null;
  /** Nhãn danh mục, dùng cho tiêu đề popup. VD: "Chức vụ". */
  entityLabel: string;
  /**
   * Các bản ghi có thể làm cha, cùng `LOV_GROUP`.
   *
   * Màn hình gọi đã lọc theo luật trường tham chiếu (`DELETE_FLG = 0`,
   * `ACTIVE_FLG = 1`) và đã loại bản ghi đang sửa ra khỏi danh sách.
   */
  parentOptions: readonly LookupValueRow[];
  /** Các mã đang tồn tại (đã trừ bản ghi đang sửa), để chặn trùng mã. */
  existingCodes: readonly string[];
  onCancel: () => void;
  onSave: (draft: LookupValueDraft) => void;
}

function toDraft(editing: LookupValueRow | null): LookupValueDraft {
  if (!editing) {
    return {
      code: '',
      value: '',
      lookupParentId: null,
      description: '',
      // §4.1 của LOOKUP_VALUES không có cột trạng thái nào; mặc định 1 để bản ghi
      // mới dùng được ngay, đồng bộ với các danh mục khác.
      statusFlg: 1,
    };
  }

  return {
    code: editing.code,
    value: editing.value,
    lookupParentId: editing.lookupParentId,
    description: editing.description,
    statusFlg: editing.statusFlg,
  };
}

type FieldKey = 'code' | 'value';

function validate(
  draft: LookupValueDraft,
  existingCodes: readonly string[],
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};

  /*
   * §4.1 ghi CODE và VALUE là nullable, nhưng Bảng 04 (nút "Thêm") yêu cầu "nhập
   * đầy đủ các trường bắt buộc" mà không nói rõ trường nào. Bắt buộc cả hai: một
   * bản ghi từ điển không có mã thì không tham chiếu được, không có giá trị thì
   * không hiển thị được ở dropdown nào — tức là một dòng rác.
   */
  const code = draft.code.trim();
  if (!code) {
    errors.code = 'Mã là bắt buộc';
  } else if (code.length > MAX_LEN.lookupCode) {
    errors.code = `Mã tối đa ${MAX_LEN.lookupCode} ký tự`;
  } else if (existingCodes.some((c) => c.toLowerCase() === code.toLowerCase())) {
    errors.code = 'Mã đã tồn tại trong danh mục này';
  }

  const value = draft.value.trim();
  if (!value) {
    errors.value = 'Giá trị là bắt buộc';
  } else if (value.length > MAX_LEN.lookupValue) {
    errors.value = `Giá trị tối đa ${MAX_LEN.lookupValue} ký tự`;
  }

  return errors;
}

export const LookupValueFormModal: React.FC<LookupValueFormModalProps> = ({
  editing,
  entityLabel,
  parentOptions,
  existingCodes,
  onCancel,
  onSave,
}) => {
  const [draft, setDraft] = useState<LookupValueDraft>(() => toDraft(editing));

  /**
   * Chỉ hiện lỗi sau lần bấm Lưu đầu tiên. Bật lỗi ngay khi vừa mở form sẽ tô đỏ
   * mọi trường bắt buộc trước khi người dùng kịp gõ chữ nào.
   */
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(draft, existingCodes);
  const shownErrors = submitted ? errors : {};

  const set = <K extends keyof LookupValueDraft>(key: K, value: LookupValueDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onSave({
      ...draft,
      code: draft.code.trim(),
      value: draft.value.trim(),
      description: draft.description.trim(),
    });
  };

  const inputClass = (key: FieldKey) => `${INPUT_CLASS} ${shownErrors[key] ? ERROR_RING : ''}`;

  /**
   * Bản ghi đang sửa có thể trỏ tới một bản ghi cha đã ngừng hoạt động — cha đó
   * không nằm trong `parentOptions`. Không bù thêm một option cho nó thì ô chọn
   * sẽ nhảy về rỗng và lặng lẽ xóa quan hệ cha-con khi người dùng bấm Lưu.
   */
  const missingParent =
    draft.lookupParentId !== null &&
    !parentOptions.some((p) => p.id === draft.lookupParentId);

  return (
    <ModalShell
      title={editing ? `Chỉnh sửa ${entityLabel}` : `Thêm mới ${entityLabel}`}
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
        <FormField label="Mã" required error={shownErrors.code}>
          <input
            type="text"
            autoFocus
            value={draft.code}
            maxLength={MAX_LEN.lookupCode}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="VD: TGD"
            className={inputClass('code')}
          />
        </FormField>

        <FormField label="Giá trị" required error={shownErrors.value}>
          <input
            type="text"
            value={draft.value}
            maxLength={MAX_LEN.lookupValue}
            onChange={(e) => set('value', e.target.value)}
            placeholder={`Tên ${entityLabel.toLowerCase()} hiển thị trên các dropdown`}
            className={inputClass('value')}
          />
        </FormField>

        <FormField
          label={`${entityLabel} cấp trên`}
          hint="Không bắt buộc — LOOKUP_PARENT_ID cho phép để trống"
        >
          <select
            value={draft.lookupParentId === null ? '' : String(draft.lookupParentId)}
            onChange={(e) =>
              set('lookupParentId', e.target.value === '' ? null : Number(e.target.value))
            }
            className={SELECT_CLASS}
          >
            <option value="">— Không có cấp trên —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.value}
              </option>
            ))}
            {missingParent && (
              <option value={String(draft.lookupParentId)}>
                #{draft.lookupParentId} — (đã ngừng hoạt động)
              </option>
            )}
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

        <FormField
          label="Mô tả"
          hint={`${draft.description.length}/${MAX_LEN.lookupDescription} ký tự`}
        >
          <textarea
            value={draft.description}
            maxLength={MAX_LEN.lookupDescription}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Diễn giải (tùy chọn)"
            className={TEXTAREA_CLASS}
          />
        </FormField>

        {/* Nút submit ẩn: cho phép Enter lưu form mà không nhân đôi nút Lưu. */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </ModalShell>
  );
};
