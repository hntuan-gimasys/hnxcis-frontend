/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DiffType = 'same' | 'added' | 'removed';

export interface DiffToken {
  type: DiffType;
  text: string;
}

/**
 * So sánh hai đoạn văn bản ở mức TỪ, dùng cho màn hình xem nhanh khác biệt giữa
 * bản gốc và bản đính chính. Thuật toán LCS quy hoạch động — đủ nhanh cho tiêu
 * đề và nội dung tóm tắt của một tin công bố, không dùng cho tài liệu dài.
 */
export const diffWords = (original: string, revised: string): DiffToken[] => {
  const a = (original || '').split(/(\s+)/).filter((t) => t !== '');
  const b = (revised || '').split(/(\s+)/).filter((t) => t !== '');

  const n = a.length;
  const m = b.length;

  // lcs[i][j] = độ dài chuỗi con chung dài nhất của a[i..] và b[j..]
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  const push = (type: DiffType, text: string) => {
    const last = tokens[tokens.length - 1];
    // Gộp token liền kề cùng loại để đoạn tô màu không bị vỡ vụn từng từ.
    if (last && last.type === type) {
      last.text += text;
      return;
    }
    tokens.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('removed', a[i]);
      i++;
    } else {
      push('added', b[j]);
      j++;
    }
  }
  while (i < n) push('removed', a[i++]);
  while (j < m) push('added', b[j++]);

  return tokens;
};

/** Có khác biệt thực sự hay không (bỏ qua trường hợp hai bản giống hệt). */
export const hasChanges = (tokens: DiffToken[]): boolean =>
  tokens.some((t) => t.type !== 'same');
