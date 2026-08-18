/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClipboardList, BarChart3, Send, Info, MessageSquareQuote } from 'lucide-react';
import { DynamicTable, ColumnDef } from '../common/DynamicTable';
import { INITIAL_SURVEYS, INITIAL_SURVEY_RESULTS } from '../../data/businessMock';
import type { SurveyDefinition, UserRoleCode } from '../../types/hnx';

/**
 * Khảo sát doanh nghiệp — FR-028 (khai báo) và FR-029 (kết quả).
 *
 * Hai FR tách làm hai màn hình vì phục vụ hai thời điểm khác nhau: khai báo là
 * việc trước khi gửi, xem kết quả là việc sau khi đóng. Gộp chung sẽ khiến màn
 * hình lúc nào cũng nửa trống.
 */

interface SurveyModuleProps {
  activeModule: string;
  userRole: UserRoleCode;
}

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-sm text-[11px] text-slate-700 leading-relaxed">
    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
    <div>{children}</div>
  </div>
);

const AUDIENCE_LABEL: Record<SurveyDefinition['targetAudience'], string> = {
  LISTED: 'Tổ chức niêm yết',
  UPCOM_REGISTERED: 'Tổ chức ĐKGD UPCoM',
  BOND_ISSUER: 'Tổ chức phát hành trái phiếu',
  ALL: 'Toàn bộ doanh nghiệp',
};

const QTYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE: 'Chọn một',
  MULTI_CHOICE: 'Chọn nhiều',
  RATING: 'Thang điểm',
  FREE_TEXT: 'Tự luận',
};

export const SurveyModule: React.FC<SurveyModuleProps> = ({ activeModule, userRole }) => {
  const readOnly = userRole.includes('CNTT');
  const [surveys, setSurveys] = useState<SurveyDefinition[]>(INITIAL_SURVEYS);
  const [selectedId, setSelectedId] = useState<number>(1);

  const selected = surveys.find((s) => s.id === selectedId);
  const results = INITIAL_SURVEY_RESULTS[selectedId] ?? [];

  const cols: ColumnDef<SurveyDefinition>[] = [
    { key: 'surveyCode', headerVi: 'Mã khảo sát', render: (r) => <span className="font-mono text-[11px] font-bold">{r.surveyCode}</span> },
    { key: 'title', headerVi: 'Tiêu đề', render: (r) => (
      <div className="max-w-sm"><div className="font-semibold">{r.title}</div><div className="text-[10px] text-slate-600 mt-0.5">{r.description}</div></div>
    ) },
    { key: 'targetAudience', headerVi: 'Đối tượng', render: (r) => <span className="text-[11px]">{AUDIENCE_LABEL[r.targetAudience]}</span> },
    { key: 'openDate', headerVi: 'Thời gian mở', render: (r) => (
      <div className="font-mono text-[10px]"><div>{r.openDate}</div><div className="text-slate-500">{r.closeDate}</div></div>
    ) },
    { key: 'questions', headerVi: 'Số câu hỏi', render: (r) => <span className="font-mono">{r.questions.length}</span> },
    { key: 'responseCount', headerVi: 'Phản hồi', render: (r) => {
      const rate = r.sentCount > 0 ? (r.responseCount / r.sentCount) * 100 : 0;
      return (
        <div>
          <span className="font-mono font-bold">{r.responseCount}</span>
          <span className="font-mono text-slate-500">/{r.sentCount}</span>
          {r.sentCount > 0 && (
            <div className="h-1.5 w-20 bg-slate-100 rounded-sm overflow-hidden mt-1">
              <div className="h-full bg-indigo-500" style={{ width: `${rate}%` }} />
            </div>
          )}
        </div>
      );
    } },
    { key: 'status', headerVi: 'Trạng thái', render: (r) => {
      const map = { DRAFT: 'bg-slate-100 text-slate-700 border-slate-300', OPEN: 'bg-emerald-100 text-emerald-800 border-emerald-300', CLOSED: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      return <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${map[r.status]}`}>{r.status}</span>;
    } },
  ];

  return (
    <div className="space-y-5">
      {activeModule === 'survey_defs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Quản lý khai báo khảo sát
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-028</span>
            </h2>
          </div>
          <Note>
            Khảo sát gửi tới doanh nghiệp theo nhóm đối tượng. Khảo sát ở trạng thái <strong>DRAFT</strong> chưa
            gửi cho ai; <strong>OPEN</strong> đang nhận phản hồi; <strong>CLOSED</strong> đã đóng và có thể xem
            kết quả tổng hợp ở màn FR-029.
          </Note>

          <DynamicTable<SurveyDefinition>
            columns={cols}
            data={surveys}
            density="compact"
            searchPlaceholder="Tìm theo mã, tiêu đề khảo sát..."
            actions={(r) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedId(r.id)}
                  className="px-2 py-1 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-50 text-[10px] font-bold uppercase"
                >
                  Xem câu hỏi
                </button>
                {r.status === 'DRAFT' && !readOnly && (
                  <button
                    onClick={() =>
                      setSurveys((prev) => prev.map((s) => (s.id === r.id ? { ...s, status: 'OPEN', sentCount: 40 } : s)))
                    }
                    className="px-2 py-1 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase"
                  >
                    <Send className="h-3 w-3 inline mr-0.5" />Gửi
                  </button>
                )}
                {r.status === 'OPEN' && !readOnly && (
                  <button
                    onClick={() => setSurveys((prev) => prev.map((s) => (s.id === r.id ? { ...s, status: 'CLOSED' } : s)))}
                    className="px-2 py-1 rounded-sm border border-amber-300 text-amber-700 hover:bg-amber-50 text-[10px] font-bold uppercase"
                  >
                    Đóng
                  </button>
                )}
              </div>
            )}
          />

          {selected && (
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="px-4 py-2.5 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Câu hỏi — {selected.surveyCode}
                </span>
              </div>
              {selected.questions.length === 0 ? (
                <div className="p-4 text-[11px] text-slate-500">Khảo sát này chưa khai báo câu hỏi nào.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selected.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 flex gap-3">
                      <span className="font-mono text-sm font-bold text-slate-400 shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900">
                          {q.questionText}
                          {q.isRequired && <span className="text-rose-600 ml-1">*</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] bg-slate-100 border border-slate-300 rounded-sm px-1.5 py-0.5">
                            {QTYPE_LABEL[q.questionType]}
                          </span>
                          {q.options && (
                            <span className="text-[10px] text-slate-600">{q.options.join(' · ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeModule === 'survey_results' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Quản lý kết quả khảo sát
              <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">FR-029</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khảo sát:</span>
            {surveys.filter((s) => s.status !== 'DRAFT').map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold ${selectedId === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {s.surveyCode}
              </button>
            ))}
          </div>

          {selected && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-sm p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã gửi</div>
                <div className="text-2xl font-mono font-bold mt-1">{selected.sentCount}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã phản hồi</div>
                <div className="text-2xl font-mono font-bold mt-1 text-emerald-700">{selected.responseCount}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ phản hồi</div>
                <div className="text-2xl font-mono font-bold mt-1">
                  {selected.sentCount > 0 ? ((selected.responseCount / selected.sentCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-sm p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái</div>
                <div className="text-lg font-bold mt-1">{selected.status}</div>
              </div>
            </div>
          )}

          {results.length === 0 ? (
            <Note>Khảo sát này chưa có kết quả tổng hợp.</Note>
          ) : (
            results.map((r) => {
              const max = Math.max(1, ...r.distribution.map((d) => d.count));
              const total = r.distribution.reduce((s, d) => s + d.count, 0);
              return (
                <div key={r.questionId} className="bg-white border border-slate-200 rounded-sm">
                  <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{r.questionText}</span>
                    <div className="flex items-center gap-2">
                      {r.averageRating !== undefined && (
                        <span className="font-mono text-[11px] font-bold text-indigo-700">
                          Điểm trung bình {r.averageRating.toFixed(1)}/5
                        </span>
                      )}
                      <span className="font-mono text-[10px] bg-slate-100 border border-slate-300 rounded-sm px-1.5 py-0.5">
                        {QTYPE_LABEL[r.questionType]}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {r.questionType === 'FREE_TEXT' ? (
                      <div className="space-y-2">
                        {(r.sampleAnswers ?? []).map((a, i) => (
                          <div key={i} className="flex gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-sm p-2.5">
                            <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      r.distribution.map((d) => (
                        <div key={d.label} className="flex items-center gap-3 text-xs">
                          <span className="w-56 shrink-0 text-slate-700 truncate" title={d.label}>{d.label}</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-sm overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${(d.count / max) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right font-mono font-bold tabular-nums">{d.count}</span>
                          <span className="w-12 text-right font-mono text-slate-500 tabular-nums">
                            {total > 0 ? `${((d.count / total) * 100).toFixed(0)}%` : '—'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
