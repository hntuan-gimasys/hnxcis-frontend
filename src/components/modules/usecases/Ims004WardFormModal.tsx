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
import { ProvinceRow } from './ims003ProvinceMock';
import { WardRow } from './ims004WardMock';

/**
 * Popup "Thêm mới / Cập nhật thông tin Phường xã" — SRS [IMS-004] §2.4.
 *
 * Bảng 05 liệt kê bốn trường: Mã, Tên, Mô tả, Trạng thái. Form này có thêm hai
 * trường, cả hai đều lấy từ §4.1 của cùng tài liệu:
 *
 *   - Tên tiếng Việt / tiếng Anh tách đôi: `WARD_NAME_VN` NOT NULL và
 *     `WARD_NAME_EN` nullable.
 *   - Tỉnh/Thành: `PROVINCE_CD` là khóa ngoại tới PROVINCES. Bảng 05 thậm chí có
 *     dòng "Hiển thị popup tìm kiếm loại cha cho bản ghi hiện tại" — ở đây dùng
 *     dropdown thay cho popup tìm kiếm, vì danh mục tỉnh/thành chỉ vài chục bản
 *     ghi, mở thêm một popup để chọn là thừa.
 */

export interface WardDraft {
  wardCd: string;
  wardNameVn: string;
  wardNameEn: string;
  provinceCd: string;
  description: string;
  statusFlg: Flag;
}

interface Ims004WardFormModalProps {
  /** `null` là thêm mới; có giá trị là cập nhật bản ghi đó. */
  editing: WardRow | null;
  /**
   * Danh sách tỉnh/thành cho ô chọn cha.
   *
   * Màn hình gọi đã lọc theo luật của SRS cho trường tham chiếu
   * (`DELETE_FLG = 0` và `ACTIVE_FLG = 1`) nên ở đây dùng thẳng.
   */
  provinceOptions: readonly ProvinceRow[];
  /**
   * Các mã phường/xã đang tồn tại (đã trừ bản ghi đang sửa), để chặn trùng mã.
   * API thật trả 409 Conflict cho trường hợp này (SRS §5.4).
   */
  existingCodes: readonly string[];
  onCancel: () => void;
  onSave: (draft: WardDraft) => void;
}

function toDraft(editing: WardRow | null): WardDraft {
  if (!editing) {
    return {
      wardCd: '',
      wardNameVn: '',
      wardNameEn: '',
      // Không đặt sẵn tỉnh/thành: chọn hộ một giá trị cho khóa ngoại dễ dẫn tới
      // bản ghi gán sai tỉnh mà người nhập không để ý.
      provinceCd: '',
      description: '',
      // SRS §4.1: STATUS_FLG mặc định 1 — bản ghi mới hoạt động ngay.
      statusFlg: 1,
    };
  }

  return {
    wardCd: editing.wardCd,
    wardNameVn: editing.wardNameVn,
    wardNameEn: editing.wardNameEn,
    provinceCd: editing.provinceCd,
    description: editing.description,
    statusFlg: editing.statusFlg,
  };
}

type FieldKey = 'wardCd' | 'wardNameVn';

function validate(
  draft: WardDraft,
  existingCodes: readonly string[],
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};

  const code = draft.wardCd.trim();
  if (!code) {
    errors.wardCd = 'Mã Phường xã là bắt buộc';
  } else if (code.length > MAX_LEN.code) {
    errors.wardCd = `Mã Phường xã tối đa ${MAX_LEN.code} ký tự`;
  } else if (existingCodes.some((c) => c.toLowerCase() === code.toLowerCase())) {
    errors.wardCd = 'Mã Phường xã đã tồn tại';
  }

  if (!draft.wardNameVn.trim()) {
    errors.wardNameVn = 'Tên Phường xã (Tiếng Việt) là bắt buộc';
  }

  // Tên tiếng Anh và Tỉnh/Thành KHÔNG kiểm tra bắt buộc: §4.1 cho phép NULL cả
  // `WARD_NAME_EN` lẫn `PROVINCE_CD`.

  return errors;
}

export const Ims004WardFormModal: React.FC<Ims004WardFormModalProps> = ({
  editing,
  provinceOptions,
  existingCodes,
  onCancel,
  onSave,
}) => {
  const [draft, setDraft] = useState<WardDraft>(() => toDraft(editing));

  /**
   * Chỉ hiện lỗi sau lần bấm Lưu đầu tiên. Bật lỗi ngay khi vừa mở form sẽ tô đỏ
   * mọi trường bắt buộc trước khi người dùng kịp gõ chữ nào.
   */
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(draft, existingCodes);
  const shownErrors = submitted ? errors : {};

  const set = <K extends keyof WardDraft>(key: K, value: WardDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onSave({
      ...draft,
      wardCd: draft.wardCd.trim(),
      wardNameVn: draft.wardNameVn.trim(),
      wardNameEn: draft.wardNameEn.trim(),
      description: draft.description.trim(),
    });
  };

  const inputClass = (key: FieldKey) => `${INPUT_CLASS} ${shownErrors[key] ? ERROR_RING : ''}`;

  /**
   * Bản ghi đang sửa có thể trỏ tới một tỉnh/thành đã ngừng hoạt động — tỉnh đó
   * không nằm trong `provinceOptions`. Không bù thêm một option cho nó thì
   * dropdown sẽ nhảy về rỗng và lặng lẽ xóa khóa ngoại khi người dùng bấm Lưu.
   */
  const missingCurrentProvince =
    draft.provinceCd !== '' && !provinceOptions.some((p) => p.provinceCd === draft.provinceCd);

  return (
    <ModalShell
      title={editing ? 'Chỉnh sửa Phường xã' : 'Thêm mới Phường xã'}
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
        <FormField label="Mã Phường xã" required error={shownErrors.wardCd}>
          <input
            type="text"
            autoFocus
            value={draft.wardCd}
            maxLength={MAX_LEN.code}
            onChange={(e) => set('wardCd', e.target.value.toUpperCase())}
            placeholder="VD: 00001"
            className={inputClass('wardCd')}
          />
        </FormField>

        <FormField label="Tên Phường xã (Tiếng Việt)" required error={shownErrors.wardNameVn}>
          <input
            type="text"
            value={draft.wardNameVn}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('wardNameVn', e.target.value)}
            placeholder="VD: Phường Phúc Xá"
            className={inputClass('wardNameVn')}
          />
        </FormField>

        <FormField
          label="Tên Phường xã (Tiếng Anh)"
          hint="Không bắt buộc — WARD_NAME_EN cho phép để trống"
        >
          <input
            type="text"
            value={draft.wardNameEn}
            maxLength={MAX_LEN.name}
            onChange={(e) => set('wardNameEn', e.target.value)}
            placeholder="VD: Phuc Xa Ward"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          label="Tỉnh/Thành"
          hint="Không bắt buộc — PROVINCE_CD cho phép để trống theo SRS §4.1"
        >
          <select
            value={draft.provinceCd}
            onChange={(e) => set('provinceCd', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">— Chưa gán tỉnh/thành —</option>
            {provinceOptions.map((p) => (
              <option key={p.provinceCd} value={p.provinceCd}>
                {p.provinceCd} — {p.provinceNameVn}
              </option>
            ))}
            {missingCurrentProvince && (
              <option value={draft.provinceCd}>
                {draft.provinceCd} — (đã ngừng hoạt động)
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
