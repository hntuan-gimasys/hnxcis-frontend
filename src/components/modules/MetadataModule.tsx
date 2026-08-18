/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Database, AlertTriangle, CheckCircle2, GitBranch, Table2 } from 'lucide-react';
import { CrudPanel, CrudField } from '../common/CrudPanel';
import { ColumnDef } from '../common/DynamicTable';
import { calendarService } from '../../services/businessCalendar';
import {
  INITIAL_CATALOGS,
  INITIAL_FIELD_DEFINITIONS,
  INITIAL_WORKFLOWS,
  getTemplateFields,
} from '../../data/mockData';
import {
  EXTRA_CATALOGS,
  INITIAL_DICTIONARY,
  INITIAL_HOLIDAYS,
  INITIAL_FS_TEMPLATES,
  INITIAL_FS_ROWS,
  INITIAL_FS_COLS,
  INITIAL_DATA_STRUCTURES,
  INITIAL_DATA_STRUCT_FIELDS,
} from '../../data/metadataMock';
import type {
  CatalogItem,
  DictionaryEntry,
  HolidayEntry,
  FieldDefinition,
  FsTemplate,
  FsTemplateRow,
  DataStructureTemplate,
  DataStructureField,
  TemplateDefinition,
  UserRoleCode,
} from '../../types/hnx';

/**
 * Khối quản trị metadata — FR-045, FR-046, FR-048 → FR-054.
 *
 * Đây là tầng 0–1 của bản đồ phụ thuộc PRD §3.4: Form Engine không có gì để
 * render nếu chưa khai báo trường, Workflow Engine không có quy trình nào để
 * chạy nếu chưa khai báo workflow, và mọi phép tính hạn đều sai nếu chưa khai
 * báo ngày nghỉ. Vì vậy khối này phải có trước các module nghiệp vụ.
 *
 * Trạng thái nằm ngay trong module chứ không nâng lên App.tsx: đây là cấu hình
 * do admin sở hữu, không phải dữ liệu nghiệp vụ mà nhiều module cùng đọc. Ngoại
 * lệ duy nhất là ngày nghỉ — sửa xong phải đẩy sang `calendarService` ngay, nếu
 * không thì màn hình có sửa được nhưng lịch nghiệp vụ vẫn dùng bảng cũ (AC-053-4).
 */

interface MetadataModuleProps {
  activeModule: string;
  userRole: UserRoleCode;
  templates: TemplateDefinition[];
}

const nowIso = () => new Date().toISOString();

/**
 * AC-049-2 — phát hiện tham chiếu vòng trong công thức chỉ tiêu BCTC.
 *
 * Công thức tham chiếu mã chỉ tiêu theo cú pháp `[110] + [120]`. Nếu [270] phụ
 * thuộc [100] mà [100] lại phụ thuộc [270] thì việc tính giá trị sẽ lặp vô hạn.
 * Bắt lỗi lúc lưu rẻ hơn nhiều so với lúc doanh nghiệp đang nhập số.
 *
 * Trả về chuỗi phụ thuộc đầu tiên tìm được để thông báo nêu rõ đường đi, thay vì
 * chỉ nói "có vòng lặp" rồi để người dùng tự dò trong 200 dòng chỉ tiêu.
 */
export function findFormulaCycle(rows: FsTemplateRow[]): string[] | null {
  const deps = new Map<string, string[]>();
  for (const r of rows) {
    const refs = [...(r.formulaExpr ?? '').matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].split('@')[0].trim());
    deps.set(r.rowCode, refs);
  }

  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const stack: string[] = [];

  const visit = (code: string): string[] | null => {
    const state = color.get(code) ?? WHITE;
    if (state === GREY) return [...stack.slice(stack.indexOf(code)), code];
    if (state === BLACK) return null;

    color.set(code, GREY);
    stack.push(code);
    for (const next of deps.get(code) ?? []) {
      if (!deps.has(next)) continue; // mã không tồn tại — AC-049-3 xử lý riêng
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    stack.pop();
    color.set(code, BLACK);
    return null;
  };

  for (const code of deps.keys()) {
    const cycle = visit(code);
    if (cycle) return cycle;
  }
  return null;
}

/** AC-049-3 — công thức tham chiếu mã chỉ tiêu không tồn tại. */
export function findUnknownRefs(rows: FsTemplateRow[]): Array<{ rowCode: string; missing: string[] }> {
  const known = new Set(rows.map((r) => r.rowCode));
  const out: Array<{ rowCode: string; missing: string[] }> = [];
  for (const r of rows) {
    const refs = [...(r.formulaExpr ?? '').matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].split('@')[0].trim());
    const missing = refs.filter((x) => !known.has(x));
    if (missing.length) out.push({ rowCode: r.rowCode, missing });
  }
  return out;
}

const Banner: React.FC<{ tone: 'info' | 'warn' | 'ok'; children: React.ReactNode }> = ({ tone, children }) => {
  const cls =
    tone === 'warn'
      ? 'bg-amber-50 border-amber-300 text-amber-900'
      : tone === 'ok'
        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
        : 'bg-slate-50 border-slate-300 text-slate-700';
  const Icon = tone === 'warn' ? AlertTriangle : tone === 'ok' ? CheckCircle2 : Database;
  return (
    <div className={`flex items-start gap-2 p-3 border rounded-sm text-[11px] leading-relaxed ${cls}`}>
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
};

export const MetadataModule: React.FC<MetadataModuleProps> = ({ activeModule, userRole, templates }) => {
  // P.CNTT vận hành hệ thống nhưng không sở hữu nghiệp vụ — chỉ đọc, giống AdminModule.
  const readOnly = userRole === 'ROLE_CNTT_MANAGER' || userRole === 'ROLE_CNTT_STAFF';

  const [catalogs, setCatalogs] = useState<CatalogItem[]>([...INITIAL_CATALOGS, ...EXTRA_CATALOGS]);
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>(INITIAL_DICTIONARY);
  const [holidays, setHolidays] = useState<HolidayEntry[]>(INITIAL_HOLIDAYS);
  const [fields, setFields] = useState<FieldDefinition[]>(INITIAL_FIELD_DEFINITIONS);
  const [fsTemplates, setFsTemplates] = useState<FsTemplate[]>(INITIAL_FS_TEMPLATES);
  const [fsRows, setFsRows] = useState<FsTemplateRow[]>(INITIAL_FS_ROWS);
  const [structs, setStructs] = useState<DataStructureTemplate[]>(INITIAL_DATA_STRUCTURES);
  const [structFields, setStructFields] = useState<DataStructureField[]>(INITIAL_DATA_STRUCT_FIELDS);

  const [catalogFilter, setCatalogFilter] = useState<string>('ALL');
  const [selectedFsId, setSelectedFsId] = useState<number>(1);
  const [selectedStructId, setSelectedStructId] = useState<number>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(templates[0]?.id ?? 1);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  const nextId = (rows: Array<{ id: number }>) => Math.max(0, ...rows.map((r) => r.id)) + 1;

  /* ── FR-045 · Danh mục ─────────────────────────────────────────────────── */

  const catalogCodes = useMemo(
    () => Array.from(new Set(catalogs.map((c) => c.catalogCode))).sort(),
    [catalogs],
  );
  const visibleCatalogs = catalogFilter === 'ALL' ? catalogs : catalogs.filter((c) => c.catalogCode === catalogFilter);

  const catalogCols: ColumnDef<CatalogItem>[] = [
    { key: 'catalogCode', headerVi: 'Nhóm danh mục', render: (r) => <span className="font-mono text-[11px]">{r.catalogCode}</span> },
    { key: 'code', headerVi: 'Mã', render: (r) => <span className="font-mono text-[11px] font-bold">{r.code}</span> },
    { key: 'nameVi', headerVi: 'Tên tiếng Việt' },
    { key: 'parentCode', headerVi: 'Thuộc cấp trên', render: (r) => r.parentCode ?? '—' },
    { key: 'usageCount', headerVi: 'Đang dùng', render: (r) => <span className="font-mono">{r.usageCount}</span> },
    {
      key: 'isActive',
      headerVi: 'Trạng thái',
      render: (r) =>
        r.isActive ? (
          <span className="text-emerald-700 font-semibold">Đang dùng</span>
        ) : (
          <span className="text-slate-400">Ngưng</span>
        ),
    },
  ];

  const catalogFields: CrudField[] = [
    { key: 'catalogCode', label: 'Nhóm danh mục', type: 'text', required: true, immutableOnEdit: true, help: 'Ví dụ: INDUSTRY, BOARD, FEE_TYPE' },
    { key: 'code', label: 'Mã', type: 'text', required: true, immutableOnEdit: true },
    { key: 'nameVi', label: 'Tên tiếng Việt', type: 'text', required: true },
    { key: 'nameEn', label: 'Tên tiếng Anh', type: 'text' },
    { key: 'parentCode', label: 'Mã cấp trên', type: 'text', help: 'Để trống nếu là cấp gốc. Dùng cho danh mục phân cấp như Ngành nghề.' },
    { key: 'sortOrder', label: 'Thứ tự', type: 'number' },
    { key: 'isActive', label: 'Đang sử dụng', type: 'checkbox' },
  ];

  /* ── FR-052 · Từ điển dữ liệu ──────────────────────────────────────────── */

  const dictCols: ColumnDef<DictionaryEntry>[] = [
    { key: 'termCode', headerVi: 'Mã / viết tắt', render: (r) => <span className="font-mono text-[11px] font-bold">{r.termCode}</span> },
    { key: 'termValue', headerVi: 'Giá trị đầy đủ' },
    { key: 'termType', headerVi: 'Loại' },
    { key: 'description', headerVi: 'Mô tả', render: (r) => <span className="text-slate-600">{r.description ?? '—'}</span> },
    { key: 'usageCount', headerVi: 'Đang dùng', render: (r) => <span className="font-mono">{r.usageCount}</span> },
  ];

  const dictFields: CrudField[] = [
    { key: 'termCode', label: 'Mã / viết tắt', type: 'text', required: true, immutableOnEdit: true },
    { key: 'termValue', label: 'Giá trị đầy đủ', type: 'text', required: true },
    {
      key: 'termType',
      label: 'Loại',
      type: 'select',
      required: true,
      options: [
        { value: 'ABBREVIATION', label: 'Viết tắt' },
        { value: 'TERM', label: 'Thuật ngữ' },
        { value: 'LEGAL_REF', label: 'Văn bản pháp lý' },
        { value: 'UNIT', label: 'Đơn vị tính' },
      ],
    },
    { key: 'description', label: 'Mô tả', type: 'textarea' },
    { key: 'isActive', label: 'Đang sử dụng', type: 'checkbox' },
  ];

  /* ── FR-053 · Ngày nghỉ ────────────────────────────────────────────────── */

  const pushToCalendar = (next: HolidayEntry[]) => {
    setHolidays(next);
    calendarService.setHolidays(
      next.map((h) => ({
        fromDate: h.fromDate,
        toDate: h.toDate,
        year: h.year,
        holidayType: h.holidayType,
        nameVi: h.nameVi,
      })),
    );
  };

  const holidayCols: ColumnDef<HolidayEntry>[] = [
    { key: 'fromDate', headerVi: 'Từ ngày', render: (r) => <span className="font-mono text-[11px]">{r.fromDate}</span> },
    { key: 'toDate', headerVi: 'Đến ngày', render: (r) => <span className="font-mono text-[11px]">{r.toDate}</span> },
    { key: 'year', headerVi: 'Năm', render: (r) => <span className="font-mono">{r.year}</span> },
    {
      key: 'holidayType',
      headerVi: 'Loại',
      render: (r) =>
        r.holidayType === 'MAKEUP_WORKDAY' ? (
          <span className="text-amber-700 font-semibold">Ngày làm bù</span>
        ) : (
          <span className="text-rose-700 font-semibold">Ngày nghỉ</span>
        ),
    },
    { key: 'nameVi', headerVi: 'Tên' },
    { key: 'legalBasis', headerVi: 'Căn cứ', render: (r) => <span className="text-slate-600 text-[11px]">{r.legalBasis ?? '—'}</span> },
    { key: 'usageCount', headerVi: 'Hạn đã chốt', render: (r) => <span className="font-mono">{r.usageCount}</span> },
  ];

  const holidayFields: CrudField[] = [
    { key: 'fromDate', label: 'Từ ngày', type: 'date', required: true },
    { key: 'toDate', label: 'Đến ngày', type: 'date', required: true, help: 'Phải lớn hơn hoặc bằng "Từ ngày".' },
    {
      key: 'holidayType',
      label: 'Loại',
      type: 'select',
      required: true,
      options: [
        { value: 'HOLIDAY', label: 'Ngày nghỉ lễ' },
        { value: 'MAKEUP_WORKDAY', label: 'Ngày làm bù' },
      ],
    },
    { key: 'nameVi', label: 'Tên', type: 'text', required: true },
    { key: 'legalBasis', label: 'Căn cứ pháp lý', type: 'text' },
  ];

  /* ── FR-046 · Khai báo trường dữ liệu ──────────────────────────────────── */

  const fieldCols: ColumnDef<FieldDefinition>[] = [
    { key: 'fieldCode', headerVi: 'Mã trường', render: (r) => <span className="font-mono text-[11px] font-bold">{r.fieldCode}</span> },
    { key: 'labelVi', headerVi: 'Nhãn tiếng Việt' },
    { key: 'dataType', headerVi: 'Kiểu dữ liệu', render: (r) => <span className="font-mono text-[11px]">{r.dataType}</span> },
    { key: 'nodeType', headerVi: 'Loại nút' },
    { key: 'lookupCatalogCode', headerVi: 'Danh mục tra cứu', render: (r) => r.lookupCatalogCode ?? '—' },
    {
      key: 'validationJson',
      headerVi: 'Ràng buộc',
      render: (r) => {
        const v = r.validationJson;
        if (!v) return '—';
        const parts: string[] = [];
        if (v.required) parts.push('bắt buộc');
        if (v.min !== undefined) parts.push(`≥ ${v.min}`);
        if (v.max !== undefined) parts.push(`≤ ${v.max}`);
        if (v.maxLen !== undefined) parts.push(`≤ ${v.maxLen} ký tự`);
        return <span className="text-[11px] text-slate-600">{parts.join(' · ') || '—'}</span>;
      },
    },
    {
      key: 'hasData',
      headerVi: 'Đã có dữ liệu',
      render: (r) => (r.hasData ? <span className="text-amber-700 font-semibold">Có</span> : <span className="text-slate-400">Chưa</span>),
    },
  ];

  const fieldFormFields: CrudField[] = [
    { key: 'fieldCode', label: 'Mã trường', type: 'text', required: true, immutableOnEdit: true },
    { key: 'labelVi', label: 'Nhãn tiếng Việt', type: 'text', required: true },
    { key: 'labelEn', label: 'Nhãn tiếng Anh', type: 'text' },
    {
      key: 'dataType',
      label: 'Kiểu dữ liệu',
      type: 'select',
      required: true,
      options: ['TEXT', 'LONGTEXT', 'NUMBER', 'DECIMAL', 'DATE', 'DATETIME', 'BOOLEAN', 'PICKLIST', 'MULTI_PICKLIST', 'FILE', 'TABLE', 'RICHTEXT', 'FORMULA'].map((v) => ({ value: v, label: v })),
    },
    {
      key: 'nodeType',
      label: 'Loại nút',
      type: 'select',
      options: [
        { value: 'FIELD', label: 'FIELD — trường nhập' },
        { value: 'GROUP', label: 'GROUP — nhóm' },
        { value: 'ROOT', label: 'ROOT — gốc' },
      ],
    },
    { key: 'lookupCatalogCode', label: 'Danh mục tra cứu', type: 'text', help: 'Chỉ dùng cho PICKLIST / MULTI_PICKLIST.' },
    { key: 'sortOrder', label: 'Thứ tự', type: 'number' },
    { key: 'defaultValue', label: 'Giá trị mặc định', type: 'text' },
    { key: 'formulaExpr', label: 'Công thức', type: 'text', help: 'Chỉ dùng cho kiểu FORMULA.' },
  ];

  /* ── FR-048 · Cấu hình trường trong mẫu ────────────────────────────────── */

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0];
  /**
   * `getTemplateFields` đã nối sẵn TemplateField với FieldDefinition và sắp xếp
   * theo sortOrder — dùng lại đúng hàm mà DynamicForm dùng, để màn cấu hình và
   * form thật không bao giờ đọc ra hai thứ tự khác nhau.
   */
  const templateFieldRows = selectedTemplate ? getTemplateFields(selectedTemplate.id) : [];

  /* ── FR-049 · Mẫu báo cáo tài chính ────────────────────────────────────── */

  const currentFsRows = fsRows.filter((r) => r.fsTemplateId === selectedFsId);
  const cycle = useMemo(() => findFormulaCycle(currentFsRows), [currentFsRows]);
  const unknownRefs = useMemo(() => findUnknownRefs(currentFsRows), [currentFsRows]);
  const currentFsCols = INITIAL_FS_COLS.filter((c) => c.fsTemplateId === selectedFsId);

  const fsCols: ColumnDef<FsTemplate>[] = [
    { key: 'templateCode', headerVi: 'Mã mẫu', render: (r) => <span className="font-mono text-[11px] font-bold">{r.templateCode}</span> },
    { key: 'nameVi', headerVi: 'Tên mẫu' },
    { key: 'fsType', headerVi: 'Loại báo cáo' },
    { key: 'periodType', headerVi: 'Kỳ' },
    { key: 'usageCount', headerVi: 'BCTC đã nộp', render: (r) => <span className="font-mono">{r.usageCount}</span> },
    {
      key: 'isActive',
      headerVi: 'Trạng thái',
      render: (r) => (r.isActive ? <span className="text-emerald-700 font-semibold">Đang dùng</span> : <span className="text-slate-400">Ngưng</span>),
    },
  ];

  const fsFields: CrudField[] = [
    { key: 'templateCode', label: 'Mã mẫu', type: 'text', required: true, immutableOnEdit: true, help: 'Khóa nghiệp vụ, không đổi khi sửa (AC-049-5).' },
    { key: 'nameVi', label: 'Tên mẫu', type: 'text', required: true },
    {
      key: 'fsType',
      label: 'Loại báo cáo',
      type: 'select',
      required: true,
      options: [
        { value: 'BALANCE_SHEET', label: 'Bảng cân đối kế toán' },
        { value: 'INCOME_STATEMENT', label: 'Kết quả kinh doanh' },
        { value: 'CASH_FLOW', label: 'Lưu chuyển tiền tệ' },
        { value: 'NOTES', label: 'Thuyết minh' },
      ],
    },
    {
      key: 'periodType',
      label: 'Kỳ báo cáo',
      type: 'select',
      required: true,
      options: [
        { value: 'QUARTER', label: 'Quý' },
        { value: 'SEMI_ANNUAL', label: 'Bán niên' },
        { value: 'ANNUAL', label: 'Năm' },
      ],
    },
    { key: 'isActive', label: 'Đang sử dụng', type: 'checkbox' },
  ];

  /* ── FR-050 / FR-051 · Mẫu cấu trúc dữ liệu ────────────────────────────── */

  const structCols: ColumnDef<DataStructureTemplate>[] = [
    { key: 'structCode', headerVi: 'Mã cấu trúc', render: (r) => <span className="font-mono text-[11px] font-bold">{r.structCode}</span> },
    { key: 'nameVi', headerVi: 'Tên cấu trúc' },
    { key: 'targetEntity', headerVi: 'Thực thể đích', render: (r) => <span className="font-mono text-[11px]">{r.targetEntity}</span> },
    { key: 'usageCount', headerVi: 'Đang dùng', render: (r) => <span className="font-mono">{r.usageCount}</span> },
    {
      key: 'isActive',
      headerVi: 'Trạng thái',
      render: (r) => (r.isActive ? <span className="text-emerald-700 font-semibold">Đang dùng</span> : <span className="text-slate-400">Ngưng</span>),
    },
  ];

  const structFormFields: CrudField[] = [
    { key: 'structCode', label: 'Mã cấu trúc', type: 'text', required: true, immutableOnEdit: true },
    { key: 'nameVi', label: 'Tên cấu trúc', type: 'text', required: true },
    { key: 'targetEntity', label: 'Thực thể đích', type: 'text', required: true, help: 'Tên interface trong types/hnx.ts mà cấu trúc này mô tả.' },
    { key: 'isActive', label: 'Đang sử dụng', type: 'checkbox' },
  ];

  const currentStructFields = structFields.filter((f) => f.structTemplateId === selectedStructId);

  /* ── FR-054 · Khai báo workflow ────────────────────────────────────────── */

  const workflows = INITIAL_WORKFLOWS;

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-sm p-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Quản trị Metadata — tầng nền của Form / Workflow / Rule Engine
        </div>
        <p className="text-[11px] text-slate-600 mt-1 max-w-4xl">
          Theo bản đồ phụ thuộc PRD §3.4, toàn bộ nghiệp vụ phía sau chỉ chạy đúng khi khối này được khai
          báo trước. {readOnly && <strong className="text-amber-700">Vai trò của bạn chỉ được xem, không sửa.</strong>}
        </p>
      </div>

      {activeModule === 'meta_catalogs' && (
        <CrudPanel<CatalogItem>
          frCode="FR-045"
          title="Quản lý danh mục"
          description="Danh mục dùng chung cho toàn hệ thống. Mục đang được hồ sơ tham chiếu thì không xóa được, chỉ ngưng sử dụng — bản ghi cũ vẫn hiển thị đúng tên nhưng không còn xuất hiện trong dropdown khi tạo mới."
          columns={catalogCols}
          rows={visibleCatalogs}
          fields={catalogFields}
          readOnly={readOnly}
          usageLabel={(r) => `Mục "${r.nameVi}" đang được ${r.usageCount} bản ghi tham chiếu. Theo AC-045-1 không được xóa; hãy chuyển sang trạng thái ngưng sử dụng để bản ghi cũ vẫn hiển thị đúng tên.`}
          onSave={(draft, editingId) => {
            if (editingId) {
              setCatalogs((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...(draft as Partial<CatalogItem>) } : c)));
            } else {
              setCatalogs((prev) => [
                ...prev,
                { ...(draft as unknown as CatalogItem), id: nextId(prev), usageCount: 0, sortOrder: Number(draft.sortOrder) || prev.length + 1 },
              ]);
            }
          }}
          onDelete={(row) => setCatalogs((prev) => prev.filter((c) => c.id !== row.id))}
          onToggleActive={(row) => setCatalogs((prev) => prev.map((c) => (c.id === row.id ? { ...c, isActive: !c.isActive } : c)))}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lọc nhóm:</span>
            <button
              onClick={() => setCatalogFilter('ALL')}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-bold ${catalogFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Tất cả ({catalogs.length})
            </button>
            {catalogCodes.map((code) => (
              <button
                key={code}
                onClick={() => setCatalogFilter(code)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold ${catalogFilter === code ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {code}
              </button>
            ))}
          </div>
        </CrudPanel>
      )}

      {activeModule === 'meta_dictionary' && (
        <CrudPanel<DictionaryEntry>
          frCode="FR-052"
          title="Từ điển dữ liệu"
          description="Thuật ngữ và viết tắt dùng chung. PRD chỉ định đây là nguồn để AI mở rộng viết tắt trong tra cứu ngôn ngữ tự nhiên (FR-032), nên mỗi mục cần giá trị đầy đủ chính xác."
          columns={dictCols}
          rows={dictionary}
          fields={dictFields}
          readOnly={readOnly}
          usageLabel={(r) => `Thuật ngữ "${r.termCode}" đang được ${r.usageCount} bản ghi tham chiếu. Theo AC-052-1 không được xóa.`}
          onSave={(draft, editingId) => {
            if (editingId) {
              setDictionary((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...(draft as Partial<DictionaryEntry>), updatedAt: nowIso() } : d)));
            } else {
              setDictionary((prev) => [
                ...prev,
                { ...(draft as unknown as DictionaryEntry), id: nextId(prev), createdAt: nowIso(), createdBy: 1, versionNo: 1, isCurrent: true, usageCount: 0 },
              ]);
            }
          }}
          onDelete={(row) => setDictionary((prev) => prev.filter((d) => d.id !== row.id))}
          onToggleActive={(row) => setDictionary((prev) => prev.map((d) => (d.id === row.id ? { ...d, isActive: !d.isActive } : d)))}
        />
      )}

      {activeModule === 'meta_holidays' && (
        <div className="space-y-4">
          <Banner tone="warn">
            <strong>Chức năng nhỏ nhất nhưng ảnh hưởng rộng nhất.</strong> Mọi hạn nộp, SLA, nhắc việc và
            ngày giao dịch không hưởng quyền đều tính từ bảng này. Hạn của nghĩa vụ <em>đã phát sinh</em> được
            chốt cứng tại thời điểm sinh và không tính lại hồi tố — nếu tính lại, thêm một ngày lễ có thể biến
            hàng trăm doanh nghiệp đang đúng hạn thành trễ hạn (AC-053-3).
          </Banner>

          {holidayError && <Banner tone="warn">{holidayError}</Banner>}

          <CrudPanel<HolidayEntry>
            frCode="FR-053"
            title="Khai báo ngày nghỉ"
            description="Ngày nghỉ lễ và ngày làm bù. Sửa xong có hiệu lực ngay với BusinessCalendarService — ngày làm bù khai ở đây sẽ được tính là ngày làm việc."
            columns={holidayCols}
            rows={holidays}
            fields={holidayFields}
            readOnly={readOnly}
            usageLabel={(r) => `Ngày nghỉ "${r.nameVi}" đã được dùng để chốt hạn cho ${r.usageCount} nghĩa vụ hiện hành. Theo AC-053-5 không được xóa vì sẽ làm sai lệch các hạn đã công bố.`}
            onSave={(draft, editingId) => {
              const from = String(draft.fromDate ?? '');
              const to = String(draft.toDate ?? '');
              if (from && to && to < from) {
                setHolidayError(`AC-053-1 — "Đến ngày" (${to}) nhỏ hơn "Từ ngày" (${from}). Bản ghi không được lưu.`);
                return;
              }
              setHolidayError(null);
              if (editingId) {
                pushToCalendar(
                  holidays.map((h) =>
                    h.id === editingId ? { ...h, ...(draft as Partial<HolidayEntry>), year: Number(from.slice(0, 4)) || h.year, updatedAt: nowIso() } : h,
                  ),
                );
              } else {
                pushToCalendar([
                  ...holidays,
                  {
                    ...(draft as unknown as HolidayEntry),
                    id: nextId(holidays),
                    year: Number(from.slice(0, 4)),
                    createdAt: nowIso(),
                    createdBy: 1,
                    versionNo: 1,
                    isCurrent: true,
                    usageCount: 0,
                  },
                ]);
              }
            }}
            onDelete={(row) => pushToCalendar(holidays.filter((h) => h.id !== row.id))}
          />
        </div>
      )}

      {activeModule === 'meta_fields' && (
        <CrudPanel<FieldDefinition & { usageCount: number }>
          frCode="FR-046"
          title="Khai báo trường dữ liệu công bố thông tin"
          description="Từ điển trường của Form Engine. Mẫu báo cáo lắp các trường này lại thành form động — chưa khai báo ở đây thì DynamicForm không có gì để render."
          columns={fieldCols as ColumnDef<FieldDefinition & { usageCount: number }>[]}
          rows={fields.map((f) => ({ ...f, usageCount: f.hasData ? 1 : 0 }))}
          fields={fieldFormFields}
          readOnly={readOnly}
          usageLabel={(r) => `Trường "${r.fieldCode}" đã có dữ liệu thực tế trong các hồ sơ đã nộp. Xóa sẽ làm hỏng dữ liệu cũ — chỉ được ngưng sử dụng.`}
          onSave={(draft, editingId) => {
            if (editingId) {
              setFields((prev) => prev.map((f) => (f.id === editingId ? { ...f, ...(draft as Partial<FieldDefinition>), updatedAt: nowIso() } : f)));
            } else {
              setFields((prev) => [
                ...prev,
                {
                  ...(draft as unknown as FieldDefinition),
                  id: nextId(prev),
                  createdAt: nowIso(),
                  createdBy: 1,
                  versionNo: 1,
                  isCurrent: true,
                  isRepeatable: false,
                  hasData: false,
                  sortOrder: Number(draft.sortOrder) || prev.length + 1,
                },
              ]);
            }
          }}
          onDelete={(row) => setFields((prev) => prev.filter((f) => f.id !== row.id))}
        />
      )}

      {activeModule === 'meta_template_fields' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Cấu hình trường trong mẫu báo cáo
                <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
                  FR-048
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl">
              Quyết định mẫu nào hiện trường nào, bắt buộc hay không, và vai trò nào được xem/sửa. Đây là nơi
              <code className="mx-1 px-1 bg-slate-100 rounded-sm text-[11px]">visibleForRoles</code> và
              <code className="mx-1 px-1 bg-slate-100 rounded-sm text-[11px]">editableForRoles</code> được đặt.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chọn mẫu:</span>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`px-2.5 py-1 rounded-sm text-[11px] font-bold ${selectedTemplateId === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {t.templateCode}
                </button>
              ))}
            </div>
          </div>

          {templateFieldRows.length === 0 ? (
            <Banner tone="warn">
              Mẫu <strong>{selectedTemplate?.templateCode}</strong> chưa khai báo trường nào. Form động của mẫu này
              sẽ render rỗng khi doanh nghiệp mở ra nộp.
            </Banner>
          ) : (
            <div className="bg-white border border-slate-200 rounded-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left px-3 py-2">Thứ tự</th>
                    <th className="text-left px-3 py-2">Mã trường</th>
                    <th className="text-left px-3 py-2">Nhãn</th>
                    <th className="text-left px-3 py-2">Kiểu</th>
                    <th className="text-left px-3 py-2">Section</th>
                    <th className="text-left px-3 py-2">Bắt buộc</th>
                    <th className="text-left px-3 py-2">Chỉ đọc</th>
                    <th className="text-left px-3 py-2">Vai trò xem được</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templateFieldRows.map((tf) => (
                    <tr key={tf.id} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-mono">{tf.sortOrder}</td>
                      <td className="px-3 py-1.5 font-mono font-bold">{tf.fieldDef?.fieldCode ?? `#${tf.fieldDefinitionId}`}</td>
                      <td className="px-3 py-1.5">{tf.labelOverrideVi || tf.fieldDef?.labelVi || '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px]">{tf.fieldDef?.dataType ?? '—'}</td>
                      <td className="px-3 py-1.5">{tf.sectionCode}</td>
                      <td className="px-3 py-1.5">{tf.isRequired ? <span className="text-rose-700 font-bold">Có</span> : '—'}</td>
                      <td className="px-3 py-1.5">{tf.isReadonly ? 'Có' : '—'}</td>
                      <td className="px-3 py-1.5 text-[11px] text-slate-600">
                        {tf.visibleForRoles?.length ? tf.visibleForRoles.join(', ') : 'Mọi vai trò'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeModule === 'meta_fs_templates' && (
        <div className="space-y-4">
          <CrudPanel<FsTemplate>
            frCode="FR-049"
            title="Khai báo mẫu báo cáo tài chính"
            description="Mẫu BCTC và bộ chỉ tiêu hàng/cột. Mã mẫu là khóa nghiệp vụ, không đổi khi sửa. Mẫu đã có BCTC nộp theo thì không xóa được."
            columns={fsCols}
            rows={fsTemplates}
            fields={fsFields}
            readOnly={readOnly}
            usageLabel={(r) => `Đã có ${r.usageCount} báo cáo tài chính nộp theo mẫu "${r.templateCode}". Theo AC-049-6 không được xóa.`}
            onSave={(draft, editingId) => {
              if (editingId) {
                setFsTemplates((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...(draft as Partial<FsTemplate>), updatedAt: nowIso() } : t)));
              } else {
                setFsTemplates((prev) => [
                  ...prev,
                  { ...(draft as unknown as FsTemplate), id: nextId(prev), createdAt: nowIso(), createdBy: 1, versionNo: 1, isCurrent: true, usageCount: 0 },
                ]);
              }
            }}
            onDelete={(row) => setFsTemplates((prev) => prev.filter((t) => t.id !== row.id))}
            onToggleActive={(row) => setFsTemplates((prev) => prev.map((t) => (t.id === row.id ? { ...t, isActive: !t.isActive } : t)))}
          />

          <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Chỉ tiêu hàng &amp; cột</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {fsTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedFsId(t.id)}
                    className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold ${selectedFsId === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {t.templateCode}
                  </button>
                ))}
              </div>
            </div>

            {cycle ? (
              <Banner tone="warn">
                <strong>AC-049-2 — phát hiện tham chiếu vòng:</strong>{' '}
                <span className="font-mono">{cycle.map((c) => `[${c}]`).join(' → ')}</span>. Chuỗi phụ thuộc này quay
                lại chính nó nên không tính được giá trị. Phải sửa trước khi mẫu được dùng.
              </Banner>
            ) : (
              <Banner tone="ok">
                Không có tham chiếu vòng. Thứ tự tính được suy ra theo phụ thuộc (topological), không theo thứ tự sắp xếp.
              </Banner>
            )}

            {unknownRefs.length > 0 && (
              <Banner tone="warn">
                <strong>AC-049-3 — công thức tham chiếu mã không tồn tại:</strong>{' '}
                {unknownRefs.map((u) => `[${u.rowCode}] → ${u.missing.map((m) => `[${m}]`).join(', ')}`).join(' · ')}
              </Banner>
            )}

            <div className="text-[11px] text-slate-600">
              Cột của mẫu:{' '}
              {currentFsCols.map((c) => (
                <span key={c.id} className="font-mono bg-slate-100 border border-slate-200 rounded-sm px-1.5 py-0.5 mr-1.5">
                  {c.colCode} — {c.nameVi}
                </span>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left px-3 py-2">Mã</th>
                    <th className="text-left px-3 py-2">Tên chỉ tiêu</th>
                    <th className="text-left px-3 py-2">Cấp</th>
                    <th className="text-left px-3 py-2">Công thức</th>
                    <th className="text-left px-3 py-2">Nguồn giá trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentFsRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-mono font-bold">{r.rowCode}</td>
                      <td className="px-3 py-1.5" style={{ paddingLeft: `${12 + (r.level - 1) * 16}px` }}>
                        {r.nameVi}
                      </td>
                      <td className="px-3 py-1.5 font-mono">{r.level}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-indigo-700">{r.formulaExpr ?? '—'}</td>
                      <td className="px-3 py-1.5">
                        {r.formulaExpr ? (
                          <span className="text-indigo-700 font-semibold">Tự tính</span>
                        ) : (
                          <span className="text-slate-600">Nhập tay</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'meta_datastruct' && (
        <div className="space-y-4">
          <CrudPanel<DataStructureTemplate>
            frCode="FR-050"
            title="Khai báo mẫu cấu trúc dữ liệu"
            description="Mẫu cấu trúc cho các bảng con lặp lại trong hồ sơ: danh sách cổ đông lớn, lịch thanh toán trái phiếu, danh sách người có liên quan."
            columns={structCols}
            rows={structs}
            fields={structFormFields}
            readOnly={readOnly}
            usageLabel={(r) => `Cấu trúc "${r.structCode}" đang được ${r.usageCount} hồ sơ sử dụng — không xóa được.`}
            onSave={(draft, editingId) => {
              if (editingId) {
                setStructs((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...(draft as Partial<DataStructureTemplate>), updatedAt: nowIso() } : s)));
              } else {
                setStructs((prev) => [
                  ...prev,
                  { ...(draft as unknown as DataStructureTemplate), id: nextId(prev), createdAt: nowIso(), createdBy: 1, versionNo: 1, isCurrent: true, usageCount: 0 },
                ]);
              }
            }}
            onDelete={(row) => setStructs((prev) => prev.filter((s) => s.id !== row.id))}
            onToggleActive={(row) => setStructs((prev) => prev.map((s) => (s.id === row.id ? { ...s, isActive: !s.isActive } : s)))}
          />

          <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Trường chi tiết
                <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
                  FR-051
                </span>
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {structs.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStructId(s.id)}
                    className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold ${selectedStructId === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {s.structCode}
                  </button>
                ))}
              </div>
            </div>

            {currentStructFields.length === 0 ? (
              <Banner tone="warn">Cấu trúc này chưa khai báo trường nào — bảng con sẽ render rỗng.</Banner>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[520px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="text-left px-3 py-2">Thứ tự</th>
                      <th className="text-left px-3 py-2">Mã trường</th>
                      <th className="text-left px-3 py-2">Tên</th>
                      <th className="text-left px-3 py-2">Kiểu</th>
                      <th className="text-left px-3 py-2">Danh mục tra cứu</th>
                      <th className="text-left px-3 py-2">Bắt buộc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentStructFields.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-mono">{f.sortOrder}</td>
                        <td className="px-3 py-1.5 font-mono font-bold">{f.fieldCode}</td>
                        <td className="px-3 py-1.5">{f.nameVi}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px]">{f.dataType}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px]">{f.lookupCatalogCode ?? '—'}</td>
                        <td className="px-3 py-1.5">{f.isRequired ? <span className="text-rose-700 font-bold">Có</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeModule === 'meta_workflows' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Khai báo workflow và phê duyệt
                <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
                  FR-054
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-2 max-w-4xl">
              Định nghĩa các bước phê duyệt, đối tượng thực hiện, SLA và điều kiện chuyển tiếp cho từng nghiệp
              vụ. Quy trình phải có bước Bắt đầu và bước Kết thúc, không được có vòng lặp vô hạn, và chỉ được
              ngưng áp dụng chứ không xóa vật lý.
            </p>
          </div>

          {workflows.map((wf) => {
            const startCount = wf.steps.filter((s) => s.stepType === 'START').length;
            const endCount = wf.steps.filter((s) => s.stepType === 'END').length;
            const valid = startCount === 1 && endCount >= 1;
            return (
              <div key={wf.id} className="bg-white border border-slate-200 rounded-sm">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {wf.nameVi}{' '}
                      <span className="font-mono text-[11px] text-slate-500">({wf.code} · v{wf.versionNo})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Áp dụng cho: <span className="font-mono">{wf.targetType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                        wf.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {wf.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                        valid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                      title="Quy trình phải có đúng 1 bước Bắt đầu và ít nhất 1 bước Kết thúc"
                    >
                      {valid ? 'Cấu trúc hợp lệ' : 'Thiếu START / END'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Các bước ({wf.steps.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[640px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="text-left px-3 py-2">#</th>
                            <th className="text-left px-3 py-2">Mã bước</th>
                            <th className="text-left px-3 py-2">Tên bước</th>
                            <th className="text-left px-3 py-2">Loại</th>
                            <th className="text-left px-3 py-2">Người thực hiện</th>
                            <th className="text-left px-3 py-2">SLA</th>
                            <th className="text-left px-3 py-2">Kiểm soát kép</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {wf.steps.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-mono">{s.sortOrder}</td>
                              <td className="px-3 py-1.5 font-mono font-bold">{s.stepCode}</td>
                              <td className="px-3 py-1.5">{s.nameVi}</td>
                              <td className="px-3 py-1.5">
                                <span
                                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm border ${
                                    s.stepType === 'START'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : s.stepType === 'END'
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {s.stepType}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-[11px]">
                                <span className="text-slate-500">{s.assigneeMode}</span>{' '}
                                <span className="font-mono">{s.assigneeRef.join(', ')}</span>
                              </td>
                              <td className="px-3 py-1.5 font-mono">
                                {s.slaWorkingDays ? `${s.slaWorkingDays} ngày LV` : '—'}
                              </td>
                              <td className="px-3 py-1.5">
                                {s.dualControl ? <span className="text-emerald-700 font-bold">Có</span> : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Chuyển tiếp ({wf.transitions.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[640px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="text-left px-3 py-2">Từ bước</th>
                            <th className="text-left px-3 py-2">Hành động</th>
                            <th className="text-left px-3 py-2">Nhãn nút</th>
                            <th className="text-left px-3 py-2">Đến bước</th>
                            <th className="text-left px-3 py-2">Trạng thái đích</th>
                            <th className="text-left px-3 py-2">Điều kiện</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {wf.transitions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-mono text-[11px]">{t.fromStepCode}</td>
                              <td className="px-3 py-1.5">
                                <span className="font-mono text-[10px] bg-slate-100 border border-slate-300 rounded-sm px-1.5 py-0.5">
                                  {t.actionCode}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">{t.labelVi}</td>
                              <td className="px-3 py-1.5 font-mono text-[11px]">{t.toStepCode}</td>
                              <td className="px-3 py-1.5 font-mono text-[11px] text-indigo-700">{t.targetStatus}</td>
                              <td className="px-3 py-1.5 font-mono text-[10px] text-slate-600">{t.guardExpr ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
