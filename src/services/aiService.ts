/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiGet, apiPost } from '../lib/apiClient';

/** FR-032: AI Tra cứu báo cáo bằng ngôn ngữ tự nhiên (NL2Query). */
export interface Nl2QueryResult {
  summary: string;
  data: Array<{ label: string; value: number; category?: string }>;
  chartType: 'bar' | 'line' | 'pie' | 'table';
  anomalyWarning: string | null;
  recommendedActions: string[];
}

/** FR-064: AI Quét & trích xuất dữ liệu BCTC (Data Scan). */
export interface DataScanItem {
  fieldCode: string;
  fieldName: string;
  extractedValue: number;
  declaredValue: number | null;
  variancePct: number;
  sourceSnippet: string;
  isFlagged: boolean;
  flagReason: string | null;
}

export interface DataScanResult {
  extractionType: string;
  confidenceScore: number;
  items: DataScanItem[];
  summary: string;
}

/** FR-065: AI Hỗ trợ dịch Việt - Anh. */
export interface TranslateResult {
  translatedTextEn: string;
  usedGlossaryTerms: string[];
  notes: string | null;
}

/** FR-063: Chatbot FAQ HNX. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  result: T;
}

export const aiService = {
  health(): Promise<{ status: string; service: string; timestamp: string }> {
    return apiGet('/api/health');
  },

  async nl2Query(prompt: string, contextData?: unknown): Promise<Nl2QueryResult> {
    const res = await apiPost<ApiEnvelope<Nl2QueryResult>>('/api/gemini/nl2query', {
      prompt,
      contextData,
    });
    return res.result;
  },

  async dataScan(documentText: string, declaredValues?: unknown): Promise<DataScanResult> {
    const res = await apiPost<ApiEnvelope<DataScanResult>>('/api/gemini/datascan', {
      documentText,
      declaredValues,
    });
    return res.result;
  },

  async translate(textVi: string, glossary?: Record<string, string>): Promise<TranslateResult> {
    const res = await apiPost<ApiEnvelope<TranslateResult>>('/api/gemini/translate', {
      textVi,
      glossary,
    });
    return res.result;
  },

  async chat(message: string, chatHistory: ChatMessage[] = []): Promise<string> {
    const res = await apiPost<{ success: boolean; reply: string }>('/api/gemini/chatbot', {
      message,
      chatHistory,
    });
    return res.reply;
  },
};
