/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TemplateDefinition,
  TemplateField,
  FieldDefinition,
  UserRoleCode,
} from '../../types/hnx';
import { formEngine, ValidationError } from '../../services/formEngine';

interface DynamicFormProps {
  template: TemplateDefinition;
  fields: (TemplateField & { fieldDef: FieldDefinition })[];
  initialPayload?: Record<string, any>;
  userRole: UserRoleCode;
  readonly?: boolean;
  onSubmit: (payload: Record<string, any>) => void;
  onCancel?: () => void;
  orgName?: string;
  symbol?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  template,
  fields,
  initialPayload,
  userRole,
  readonly = false,
  onSubmit,
  onCancel,
  orgName = '',
  symbol = '',
}) => {
  const [payload, setPayload] = useState<Record<string, any>>(() => initialPayload || {});
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleChange = (fieldCode: string, value: any) => {
    setPayload((prev) => {
      const next = { ...prev, [fieldCode]: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = formEngine.validate(template, fields, payload, userRole);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    onSubmit(payload);
  };

  // Group fields by section
  const sections = Array.from(new Set((fields || []).map((f) => f.sectionCode || 'GENERAL')));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title preview */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Tiêu đề hồ sơ / tin công bố (Tự động sinh theo Công thức):
        </label>
        <div className="text-sm font-medium text-slate-900">
          {formEngine.computeTitle(template, payload, orgName, symbol)}
        </div>
      </div>

      {(errors || []).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <div className="font-semibold mb-2">Vui lòng kiểm tra lại các trường thông tin:</div>
          <ul className="list-disc pl-5 space-y-1">
            {(errors || []).map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {sections.map((sectionCode) => {
        const sectionFields = (fields || []).filter((f) => (f.sectionCode || 'GENERAL') === sectionCode);

        return (
          <div key={sectionCode} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              {sectionCode === 'GENERAL' ? 'Thông tin chung' : sectionCode}
            </h3>

            <div className="grid grid-cols-12 gap-4">
              {sectionFields.map((tf) => {
                const field = tf.fieldDef;
                const fieldError = errors.find((e) => e.fieldCode === field.fieldCode);
                const colSpanClass = `col-span-12 sm:col-span-${tf.colSpan || 12}`;
                const label = tf.labelOverrideVi || field.labelVi;
                const isFieldReadonly =
                  readonly ||
                  tf.isReadonly ||
                  (tf.editableForRoles &&
                    tf.editableForRoles.length > 0 &&
                    !tf.editableForRoles.includes(userRole) &&
                    !tf.editableForRoles.includes('*'));

                return (
                  <div key={field.fieldCode} className={`col-span-12 sm:col-span-${tf.colSpan || 12}`}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {label} {tf.isRequired && <span className="text-red-500">*</span>}
                    </label>

                    {field.dataType === 'TEXT' && (
                      <input
                        type="text"
                        disabled={isFieldReadonly}
                        value={payload[field.fieldCode] || ''}
                        onChange={(e) => handleChange(field.fieldCode, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          fieldError
                            ? 'border-red-300 focus:ring-red-400'
                            : 'border-slate-300 focus:ring-blue-500'
                        } ${isFieldReadonly ? 'bg-slate-100 text-slate-600' : 'bg-white'}`}
                        placeholder={`Nhập ${label.toLowerCase()}...`}
                      />
                    )}

                    {field.dataType === 'LONGTEXT' && (
                      <textarea
                        rows={3}
                        disabled={isFieldReadonly}
                        value={payload[field.fieldCode] || ''}
                        onChange={(e) => handleChange(field.fieldCode, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          fieldError
                            ? 'border-red-300 focus:ring-red-400'
                            : 'border-slate-300 focus:ring-blue-500'
                        } ${isFieldReadonly ? 'bg-slate-100 text-slate-600' : 'bg-white'}`}
                        placeholder={`Nhập ${label.toLowerCase()}...`}
                      />
                    )}

                    {(field.dataType === 'NUMBER' || field.dataType === 'DECIMAL') && (
                      <input
                        type="number"
                        disabled={isFieldReadonly}
                        value={payload[field.fieldCode] ?? ''}
                        onChange={(e) => handleChange(field.fieldCode, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          fieldError
                            ? 'border-red-300 focus:ring-red-400'
                            : 'border-slate-300 focus:ring-blue-500'
                        } ${isFieldReadonly ? 'bg-slate-100 text-slate-600' : 'bg-white'}`}
                      />
                    )}

                    {field.dataType === 'PICKLIST' && (
                      <select
                        disabled={isFieldReadonly}
                        value={payload[field.fieldCode] || ''}
                        onChange={(e) => handleChange(field.fieldCode, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          fieldError
                            ? 'border-red-300 focus:ring-red-400'
                            : 'border-slate-300 focus:ring-blue-500'
                        } ${isFieldReadonly ? 'bg-slate-100 text-slate-600' : 'bg-white'}`}
                      >
                        <option value="">-- Chọn {label} --</option>
                        {field.fieldCode === 'report_period' && (
                          <>
                            <option value="Q1">Quý 1</option>
                            <option value="Q2">Quý 2</option>
                            <option value="Q3">Quý 3</option>
                            <option value="Q4">Quý 4</option>
                            <option value="SEMI">Bán niên</option>
                            <option value="ANNUAL">Cả năm</option>
                          </>
                        )}
                        {field.fieldCode === 'audit_opinion' && (
                          <>
                            <option value="UNQUALIFIED">Chấp nhận toàn phần</option>
                            <option value="QUALIFIED">Chấp nhận có ngoại trừ</option>
                            <option value="DISCLAIMER">Từ chối cho ý kiến</option>
                            <option value="ADVERSE">Ý kiến trái ngược</option>
                          </>
                        )}
                      </select>
                    )}

                    {field.dataType === 'BOOLEAN' && (
                      <div className="pt-2">
                        <label className="inline-flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isFieldReadonly}
                            checked={!!payload[field.fieldCode]}
                            onChange={(e) => handleChange(field.fieldCode, e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm text-slate-700">Có / Đồng ý</span>
                        </label>
                      </div>
                    )}

                    {fieldError && (
                      <p className="mt-1 text-xs text-red-600">{fieldError.message}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!readonly && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
          >
            Lưu & Tiếp tục
          </button>
        </div>
      )}
    </form>
  );
};
