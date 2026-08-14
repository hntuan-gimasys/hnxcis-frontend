/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TemplateDefinition,
  TemplateField,
  FieldDefinition,
  UserRoleCode,
} from '../types/hnx';

export interface ValidationError {
  fieldCode: string;
  labelVi: string;
  message: string;
}

export class FormEngine {
  public validate(
    template: TemplateDefinition,
    templateFields: (TemplateField & { fieldDef: FieldDefinition })[],
    payload: Record<string, any>,
    userRole: UserRoleCode
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const tf of templateFields) {
      const field = tf.fieldDef;
      const val = payload[field.fieldCode];

      // Check field editable permission
      if (tf.editableForRoles && tf.editableForRoles.length > 0) {
        if (!tf.editableForRoles.includes(userRole) && !tf.editableForRoles.includes('*')) {
          // If field changed but not editable for this role
          // (In client validation we enforce readonly)
        }
      }

      // Check Required
      if (tf.isRequired) {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors.push({
            fieldCode: field.fieldCode,
            labelVi: tf.labelOverrideVi || field.labelVi,
            message: `Trường "${tf.labelOverrideVi || field.labelVi}" là bắt buộc, không được để trống.`,
          });
          continue;
        }
      }

      if (val !== undefined && val !== null && val !== '') {
        // Kiểu dữ liệu check
        if (field.dataType === 'NUMBER' || field.dataType === 'DECIMAL') {
          if (isNaN(Number(val))) {
            errors.push({
              fieldCode: field.fieldCode,
              labelVi: tf.labelOverrideVi || field.labelVi,
              message: `Trường "${tf.labelOverrideVi || field.labelVi}" phải là số hợp lệ.`,
            });
          }
        }

        // Validation JSON
        if (field.validationJson) {
          const v = field.validationJson;
          if (v.min !== undefined && Number(val) < v.min) {
            errors.push({
              fieldCode: field.fieldCode,
              labelVi: tf.labelOverrideVi || field.labelVi,
              message: `Trường "${tf.labelOverrideVi || field.labelVi}" phải lớn hơn hoặc bằng ${v.min}.`,
            });
          }
          if (v.max !== undefined && Number(val) > v.max) {
            errors.push({
              fieldCode: field.fieldCode,
              labelVi: tf.labelOverrideVi || field.labelVi,
              message: `Trường "${tf.labelOverrideVi || field.labelVi}" không được vượt quá ${v.max}.`,
            });
          }
        }
      }
    }

    return errors;
  }

  public computeTitle(template: TemplateDefinition, payload: Record<string, any>, orgName: string, symbol?: string): string {
    if (!template.titleFormula) {
      return `${template.nameVi} - ${orgName}`;
    }

    let result = template.titleFormula;
    result = result.replace('{org.shortName}', orgName);
    result = result.replace('{symbol}', symbol || '');
    result = result.replace('{periodCode}', payload.report_period ? `${payload.report_period}/${payload.report_year || ''}` : '');

    // Replace {payload.fieldCode}
    Object.keys(payload).forEach((key) => {
      result = result.replace(`{payload.${key}}`, payload[key] || '');
    });

    return result;
  }
}

export const formEngine = new FormEngine();
