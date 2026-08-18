/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  FileSearch,
  AlertTriangle,
  FileEdit,
  Bot,
  CheckCircle2,
  UploadCloud,
  Send,
  Wand2,
  ShieldCheck,
  FileCheck2,
  RefreshCcw,
  Copy,
  Check,
  AlertCircle,
  XCircle,
  FileText,
  Languages,
} from 'lucide-react';

export const AiCenterModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ocr' | 'risk' | 'draft' | 'autocorrect' | 'chat' | 'translate'>('ocr');

  /**
   * FR-065 — hỗ trợ dịch Việt → Anh.
   *
   * Đây là tính năng AI DUY NHẤT đã có sẵn cả endpoint backend
   * (POST /api/gemini/translate) lẫn hàm bọc (`aiService.translate`) nhưng không
   * có nơi nào trên giao diện gọi tới. Tab này nối phần đã có đó lại.
   *
   * Khác bốn tab còn lại: chúng mô phỏng kết quả bằng setTimeout với dữ liệu
   * viết tay, còn tab này gọi backend thật qua `aiService`. Khi backend chưa
   * chạy, lỗi được hiển thị nguyên văn thay vì im lặng trả về kết quả giả — để
   * không ai nhầm dữ liệu mô phỏng với dữ liệu thật.
   */
  const [trSource, setTrSource] = useState('');
  const [trResult, setTrResult] = useState<string | null>(null);
  const [trLoading, setTrLoading] = useState(false);
  const [trError, setTrError] = useState<string | null>(null);

  const runTranslate = async () => {
    if (!trSource.trim()) return;
    setTrLoading(true);
    setTrError(null);
    setTrResult(null);
    try {
      const { aiService } = await import('../../services/aiService');
      const out = await aiService.translate(trSource);
      setTrResult(out.translatedTextEn);
    } catch (err) {
      setTrError(
        `Không gọi được dịch vụ dịch: ${err instanceof Error ? err.message : String(err)}. ` +
          'Kiểm tra backend đã chạy và biến API_BASE_URL đã trỏ đúng chưa.',
      );
    } finally {
      setTrLoading(false);
    }
  };

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Risk state
  const [riskSymbol, setRiskSymbol] = useState('VNM');
  const [riskResult, setRiskResult] = useState<any>(null);

  // Draft state
  const [draftType, setDraftType] = useState('WARNING');
  const [draftOrg, setDraftOrg] = useState('Công ty Cổ phần X');
  const [generatedDraft, setGeneratedDraft] = useState('');

  // Auto-Correction state
  const sampleDrafts = [
    {
      id: 'sample1',
      name: 'Mẫu 1: BCTC Bán niên VNM (Lỗi Thể thức, Ngày tháng & Số tiền)',
      title: 'BÁO CÁO TÀI CHÍNH BÁN NIÊN 2026',
      filename: 'BCTC Ban Nien 2026 (Ban Goc) - Vinamilk.pdf',
      text: `CÔNG TY CỔ PHẦN SỮA VIỆT NAM
Số: 105/2026/CBTT-VNM

BÁO CÁO TÀI CHÍNH BÁN NIÊN 2026
Kính gửi: Sở Giao dịch Chứng khoán Hà Nội

Công ty trân trọng công bố BCTC bán niên 2026. Doanh thu thuần đạt 16520000000000 đ. Lợi nhuận sau thuế đạt 2450000000000 đ. Ngày chốt số liệu 12-8-2026. Căn cứ theo Nghị định 155/2020.`,
    },
    {
      id: 'sample2',
      name: 'Mẫu 2: Công văn Giải trình HPG (Thiếu Căn cứ Pháp lý & Quốc hiệu)',
      title: 'CÔNG VĂN GIẢI TRÌNH V/v CHẬM NỘP BCTC',
      filename: 'Cong Van Giai Trinh HPG (Copy).pdf',
      text: `CÔNG TY CỔ PHẦN TẬP ĐOÀN HOÀ PHÁT
CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập-Tự do-Hạnh phúc

Hà Nội, ngày 2026/08/10

CÔNG VĂN GIẢI TRÌNH
V/v Chậm nộp Báo cáo tài chính năm 2025

Kính gửi: UBCKNN

Do sự cố hệ thống CNTT ngày 2026-08-05, Công ty xin giải trình việc chậm nộp BCTC. Ước tính tổn thất 500000000 VNĐ. Kính trình Sở xem xét.`,
    },
  ];

  const [scanTitle, setScanTitle] = useState(sampleDrafts[0].title);
  const [scanFilename, setScanFilename] = useState(sampleDrafts[0].filename);
  const [scanText, setScanText] = useState(sampleDrafts[0].text);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Kính chào Anh/Chị! Tôi là Trợ lý AI IMS/ICDS. Tôi có thể hỗ trợ tra cứu Thông tư 96/2020/TT-BTC, Nghị định 155/2020/NĐ-CP và Quy chế Niêm yết HNX. Anh/Chị cần tư vấn điều khoản nào?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleRunOcr = () => {
    setOcrLoading(true);
    setTimeout(() => {
      setOcrLoading(false);
      setOcrResult({
        symbol: 'VNM',
        period: 'Q2/2026',
        revenue: '16,520,000,000,000 VND',
        netProfit: '2,450,000,000,000 VND',
        auditorOpinion: 'Chấp nhận toàn phần (Unmodified)',
        confidenceScore: 98.4,
        status: 'AUTO_VERIFIED',
      });
    }, 1000);
  };

  const handleRunRiskScoring = () => {
    setRiskResult({
      symbol: riskSymbol,
      riskScore: 22,
      riskLevel: 'LOW',
      anomalies: [
        'Doanh thu tăng 12% so với cùng kỳ, phù hợp tăng trưởng ngành',
        'Tỷ lệ Nợ/Vốn chủ sở hữu an toàn (0.42)',
        'Không phát hiện mâu thuẫn giữa BCTC Bán niên và BCTC Tự lập',
      ],
      legalCompliance: 'Tuân thủ đầy đủ Thông tư 96/2020/TT-BTC',
    });
  };

  const handleGenerateDraft = () => {
    setGeneratedDraft(
      `SỞ GIAO DỊCH CHỨNG KHOÁN HÀ NỘI\nPHÒNG QUẢN LÝ NIÊM YẾT\n\nSố: .../TB-SGDHN\nCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nHà Nội, ngày 12 tháng 08 năm 2026\n\nTHÔNG BÁO\nV/v Đưa chứng khoán vào diện cảnh báo theo Điều 40 Quy chế Niêm yết\n\nKính gửi: ${draftOrg}\n\nCăn cứ Quy chế Niêm yết và Báo cáo tài chính soát xét bán niên 2026, Sở Giao dịch Chứng khoán Hà Nội thông báo đưa cổ phiếu của đơn vị vào diện Cảnh báo kể từ ngày 18/08/2026 do Lợi nhuận sau thuế chưa phân phối là số âm.\n\nSở Giao dịch Chứng khoán Hà Nội trân trọng thông báo./.`
    );
  };

  const handleSelectSample = (sampleId: string) => {
    const s = sampleDrafts.find((item) => item.id === sampleId);
    if (!s) return;
    setScanTitle(s.title);
    setScanFilename(s.filename);
    setScanText(s.text);
    setScanResult(null);
  };

  const handleScanDraft = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const issues: any[] = [];

      // Rule 1: National Motto check
      const hasFullMotto =
        scanText.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM') &&
        scanText.includes('Độc lập - Tự do - Hạnh phúc');
      if (!hasFullMotto) {
        issues.push({
          id: 'ISSUE_MOTTO',
          category: 'NATIONAL_MOTTO',
          categoryVi: 'Thể thức Văn bản Quốc gia',
          severity: 'HIGH',
          title: 'Thiếu hoặc Sai Quốc hiệu / Tiêu ngữ chuẩn',
          description: 'Văn bản hành chính gửi Sở HNX/UBCKNN bắt buộc phải có Quốc hiệu và Tiêu ngữ viết hoa, gạch nối chuẩn.',
          originalSnippet: scanText.includes('CỘNG HOÀ') ? 'CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM' : '[Chưa có Quốc hiệu]',
          suggestedCorrection: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
          fixed: false,
        });
      }

      // Rule 2: Legal base reference
      const hasLegalBase =
        scanText.includes('Thông tư 96/2020/TT-BTC') ||
        scanText.includes('Thông tư số 96/2020/TT-BTC');
      if (!hasLegalBase) {
        issues.push({
          id: 'ISSUE_LEGAL',
          category: 'LEGAL_BASE',
          categoryVi: 'Căn cứ Pháp lý Bắt buộc',
          severity: 'HIGH',
          title: 'Thiếu trích dẫn Thông tư 96/2020/TT-BTC',
          description: 'Hồ sơ công bố thông tin trên thị trường chứng khoán cần căn cứ theo Thông tư 96/2020/TT-BTC của Bộ Tài chính.',
          originalSnippet: scanText.includes('Nghị định 155') ? 'Căn cứ theo Nghị định 155/2020' : '[Thiếu Căn cứ pháp lý]',
          suggestedCorrection: 'Căn cứ Thông tư 96/2020/TT-BTC ngày 16/11/2020 của Bộ Tài chính hướng dẫn về công bố thông tin trên thị trường chứng khoán',
          fixed: false,
        });
      }

      // Rule 3: Unformatted large currency numbers
      const unformattedNumRegex = /\b\d{9,16}\b/;
      if (unformattedNumRegex.test(scanText) || scanText.includes(' đ') || scanText.includes(' VNĐ')) {
        issues.push({
          id: 'ISSUE_CURRENCY',
          category: 'CURRENCY',
          categoryVi: 'Định dạng Số tiền & Tiền tệ',
          severity: 'MEDIUM',
          title: 'Con số tài chính chưa phân cách hàng nghìn & Đơn vị tiền tệ chưa chuẩn',
          description: 'Các chỉ số tài chính phải dùng dấu phẩy phân cách hàng nghìn và viết rõ đơn vị Đồng Việt Nam (VND).',
          originalSnippet: '16520000000000 đ, 2450000000000 đ, 500000000 VNĐ',
          suggestedCorrection: '16,520,000,000,000 VND và 2,450,000,000,000 VND (Có dấu phẩy phân cách)',
          fixed: false,
        });
      }

      // Rule 4: Non-standard Date format
      const nonStandardDateRegex = /(\d{1,2}-\d{1,2}-\d{4}|\d{4}\/\d{2}\/\d{2}|\d{4}-\d{2}-\d{2})/;
      if (nonStandardDateRegex.test(scanText)) {
        issues.push({
          id: 'ISSUE_DATE',
          category: 'DATE_FORMAT',
          categoryVi: 'Định dạng Ngày tháng',
          severity: 'MEDIUM',
          title: 'Ngày tháng chưa tuân thủ thể thức chuẩn DD/MM/YYYY',
          description: 'Định dạng ngày tháng trong công văn phải là ngày DD tháng MM năm YYYY hoặc DD/MM/YYYY.',
          originalSnippet: '12-8-2026, 2026/08/10 hoặc 2026-08-05',
          suggestedCorrection: 'ngày 12 tháng 08 năm 2026 (hoặc 12/08/2026)',
          fixed: false,
        });
      }

      // Rule 5: Attachment Filename Format
      const badFilenameRegex = /[\s\(\)]|[^\x00-\x7F]/;
      if (badFilenameRegex.test(scanFilename)) {
        issues.push({
          id: 'ISSUE_FILE',
          category: 'FILENAME',
          categoryVi: 'Tên Tệp Đính kèm',
          severity: 'LOW',
          title: 'Tên tệp đính kèm chứa khoảng trắng, ký tự có dấu hoặc ngoặc',
          description: 'Tên tệp tải lên hệ thống HNX cần viết không dấu, gạch dưới, không ký tự đặc biệt để tránh lỗi hệ thống.',
          originalSnippet: scanFilename,
          suggestedCorrection: scanFilename
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\._-]/g, '_')
            .replace(/__+/g, '_')
            .toUpperCase(),
          fixed: false,
        });
      }

      // Rule 6: Recipient completeness
      if (!scanText.includes('Ủy ban Chứng khoán Nhà nước')) {
        issues.push({
          id: 'ISSUE_RECIPIENT',
          category: 'RECIPIENT',
          categoryVi: 'Nơi nhận Công văn',
          severity: 'HIGH',
          title: 'Thiếu đồng gửi Ủy ban Chứng khoán Nhà nước (UBCKNN)',
          description: 'Theo quy định, báo cáo CBTT bất thường & định kỳ phải đồng thời gửi UBCKNN và Sở Giao dịch Chứng khoán.',
          originalSnippet: 'Kính gửi: Sở Giao dịch Chứng khoán Hà Nội',
          suggestedCorrection: 'Kính gửi:\n- Ủy ban Chứng khoán Nhà nước;\n- Sở Giao dịch Chứng khoán Hà Nội.',
          fixed: false,
        });
      }

      const score = Math.max(20, 100 - issues.length * 15);
      setScanResult({
        overallScore: score,
        initialScore: score,
        issues,
      });
    }, 600);
  };

  const handleFixSingleIssue = (issueId: string) => {
    if (!scanResult) return;

    let updatedText = scanText;
    let updatedFilename = scanFilename;

    const issue = scanResult.issues.find((i: any) => i.id === issueId);
    if (!issue || issue.fixed) return;

    if (issue.id === 'ISSUE_MOTTO') {
      if (!updatedText.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')) {
        updatedText = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n-------------\n\n` + updatedText.replace(/CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập-Tự do-Hạnh phúc\n?/g, '');
      }
    } else if (issue.id === 'ISSUE_LEGAL') {
      if (updatedText.includes('Nghị định 155/2020')) {
        updatedText = updatedText.replace('Nghị định 155/2020', 'Nghị định 155/2020/NĐ-CP và Thông tư 96/2020/TT-BTC ngày 16/11/2020 của Bộ Tài chính');
      } else {
        updatedText = updatedText + '\n\nCăn cứ quy định tại Thông tư 96/2020/TT-BTC hướng dẫn về công bố thông tin trên thị trường chứng khoán.';
      }
    } else if (issue.id === 'ISSUE_CURRENCY') {
      updatedText = updatedText
        .replace('16520000000000 đ', '16,520,000,000,000 VND')
        .replace('2450000000000 đ', '2,450,000,000,000 VND')
        .replace('500000000 VNĐ', '500,000,000 VND');
    } else if (issue.id === 'ISSUE_DATE') {
      updatedText = updatedText
        .replace('12-8-2026', '12/08/2026')
        .replace('2026/08/10', '10/08/2026')
        .replace('2026-08-05', '05/08/2026');
    } else if (issue.id === 'ISSUE_FILE') {
      updatedFilename = issue.suggestedCorrection;
    } else if (issue.id === 'ISSUE_RECIPIENT') {
      updatedText = updatedText
        .replace('Kính gửi: Sở Giao dịch Chứng khoán Hà Nội', 'Kính gửi:\n- Ủy ban Chứng khoán Nhà nước;\n- Sở Giao dịch Chứng khoán Hà Nội.')
        .replace('Kính gửi: UBCKNN', 'Kính gửi:\n- Ủy ban Chứng khoán Nhà nước;\n- Sở Giao dịch Chứng khoán Hà Nội.');
    }

    setScanText(updatedText);
    setScanFilename(updatedFilename);

    const currentIssues = scanResult?.issues || [];
    const updatedIssues = currentIssues.map((i: any) =>
      i.id === issueId ? { ...i, fixed: true } : i
    );
    const fixedCount = updatedIssues.filter((i: any) => i.fixed).length;
    const newScore = Math.min(100, scanResult.initialScore + Math.round(((100 - scanResult.initialScore) * fixedCount) / (updatedIssues.length || 1)));

    setScanResult({
      ...scanResult,
      overallScore: newScore,
      issues: updatedIssues,
    });
  };

  const handleApplyAllFixes = () => {
    if (!scanResult) return;

    let text = scanText;
    let filename = scanFilename;

    if (!text.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')) {
      text = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n-------------\n\n` + text.replace(/CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập-Tự do-Hạnh phúc\n?/g, '');
    }

    text = text
      .replace('Kính gửi: Sở Giao dịch Chứng khoán Hà Nội', 'Kính gửi:\n- Ủy ban Chứng khoán Nhà nước;\n- Sở Giao dịch Chứng khoán Hà Nội.')
      .replace('Kính gửi: UBCKNN', 'Kính gửi:\n- Ủy ban Chứng khoán Nhà nước;\n- Sở Giao dịch Chứng khoán Hà Nội.');

    if (text.includes('Nghị định 155/2020')) {
      text = text.replace('Nghị định 155/2020', 'Nghị định 155/2020/NĐ-CP và Thông tư 96/2020/TT-BTC ngày 16/11/2020 của Bộ Tài chính');
    } else if (!text.includes('Thông tư 96/2020/TT-BTC')) {
      text = text + '\n\nCăn cứ quy định tại Thông tư 96/2020/TT-BTC hướng dẫn về công bố thông tin trên thị trường chứng khoán.';
    }

    text = text
      .replace(/16520000000000 đ/g, '16,520,000,000,000 VND')
      .replace(/2450000000000 đ/g, '2,450,000,000,000 VND')
      .replace(/500000000 VNĐ/g, '500,000,000 VND');

    text = text
      .replace(/12-8-2026/g, '12/08/2026')
      .replace(/2026\/08\/10/g, '10/08/2026')
      .replace(/2026-08-05/g, '05/08/2026');

    const fileIssue = (scanResult?.issues || []).find((i: any) => i.id === 'ISSUE_FILE');
    if (fileIssue) {
      filename = fileIssue.suggestedCorrection;
    }

    setScanText(text);
    setScanFilename(filename);

    const allFixedIssues = (scanResult?.issues || []).map((i: any) => ({ ...i, fixed: true }));
    setScanResult({
      ...scanResult,
      overallScore: 100,
      issues: allFixedIssues,
    });
  };

  const handleCopyCorrected = () => {
    navigator.clipboard.writeText(`TIÊU ĐỀ: ${scanTitle}\nTỆP ĐÍNH KÈM: ${scanFilename}\n\nNỘI DUNG:\n${scanText}`);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let aiAns =
        'Căn cứ Điều 11 Thông tư 96/2020/TT-BTC, Tổ chức niêm yết phải công bố thông tin bất thường trong thời hạn 24 giờ kể từ khi xảy ra sự kiện.';
      if (userMsg.toLowerCase().includes('bctc') || userMsg.toLowerCase().includes('báo cáo')) {
        aiAns =
          'Theo Điều 14 Thông tư 96/2020/TT-BTC, Báo cáo tài chính năm đã được kiểm toán phải được công bố trong thời hạn 90 ngày kể từ ngày kết thúc năm tài chính.';
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: aiAns }]);
    }, 800);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Trung tâm Trợ lý Trí tuệ Nhân tạo IMS/ICDS (AI Center)
          </h1>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
          Tích hợp 5 tính năng AI core: OCR bóc tách BCTC, Chấm điểm Rủi ro, Soạn thảo Công văn, Sửa lỗi Thể thức AI & Bot Pháp lý RAG
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'ocr'
              ? 'bg-indigo-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSearch className="h-4 w-4" />
          <span>1. Bóc tách BCTC — OCR (FR-064)</span>
        </button>

        <button
          onClick={() => setActiveTab('risk')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'risk'
              ? 'bg-indigo-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>2. Scored Rủi ro Vi phạm</span>
        </button>

        <button
          onClick={() => setActiveTab('draft')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'draft'
              ? 'bg-indigo-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileEdit className="h-4 w-4" />
          <span>3. Soạn thảo Công văn AI</span>
        </button>

        <button
          onClick={() => setActiveTab('autocorrect')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'autocorrect'
              ? 'bg-indigo-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wand2 className="h-4 w-4 text-emerald-500" />
          <span>4. Sửa lỗi Thể thức AI (Auto-Correction)</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="h-4 w-4 text-purple-600" />
          <span>5. Bot Hỏi đáp Pháp lý (FR-063)</span>
        </button>

        <button
          onClick={() => setActiveTab('translate')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'translate'
              ? 'bg-indigo-600 text-white shadow-xs border-l-2 border-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Languages className="h-4 w-4 text-emerald-600" />
          <span>6. Hỗ trợ dịch Việt → Anh</span>
        </button>
      </div>

      {/* FR-065 — Translate Tab */}
      {activeTab === 'translate' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Languages className="h-4 w-4 text-emerald-600" />
              Hỗ trợ dịch Việt → Anh
              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
                FR-065
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 mt-1">
              Dịch nội dung công bố thông tin sang tiếng Anh phục vụ nhà đầu tư nước ngoài. Bản dịch là
              <strong> bản nháp</strong> — phải qua người soát trước khi công bố, và được lưu thành một bản
              ghi riêng chứ không ghi đè bản tiếng Việt.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Nội dung tiếng Việt
              </label>
              <textarea
                rows={10}
                value={trSource}
                onChange={(e) => setTrSource(e.target.value)}
                placeholder="Dán nội dung công bố thông tin cần dịch..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-sans leading-relaxed"
              />
              <button
                onClick={runTranslate}
                disabled={trLoading || !trSource.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider"
              >
                <Languages className="h-4 w-4" />
                {trLoading ? 'Đang dịch...' : 'Dịch sang tiếng Anh'}
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Bản dịch tiếng Anh (nháp)
              </label>
              <div className="w-full min-h-[228px] px-3 py-2 text-xs border border-slate-300 rounded-sm bg-slate-50 leading-relaxed whitespace-pre-wrap">
                {trError ? (
                  <span className="text-rose-700">{trError}</span>
                ) : trResult ? (
                  trResult
                ) : (
                  <span className="text-slate-400">Kết quả dịch sẽ hiện ở đây.</span>
                )}
              </div>
              {trResult && (
                <div className="flex items-center gap-2 text-[10px] text-amber-800 bg-amber-50 border border-amber-300 rounded-sm p-2">
                  Bản dịch máy — trạng thái <span className="font-mono font-bold">AI_DRAFT</span>. Cần người soát
                  và chuyển sang <span className="font-mono font-bold">HUMAN_REVIEWED</span> trước khi công bố.
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
            Tab này gọi backend thật qua <span className="font-mono">aiService.translate</span> →{' '}
            <span className="font-mono">POST /api/gemini/translate</span>. Năm tab còn lại hiện vẫn mô phỏng
            kết quả trong trình duyệt, chưa nối backend.
          </div>
        </div>
      )}

      {/* OCR Tab */}
      {activeTab === 'ocr' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Tự động Bóc tách Dữ liệu Báo cáo Tài chính dạng PDF (AI OCR Engine)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Trích xuất chỉ tiêu Doanh thu, Lợi nhuận, Ý kiến Kiểm toán từ tệp PDF scan hoặc BCTC gốc của Doanh nghiệp.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-sm p-8 text-center bg-slate-50 space-y-3">
            <UploadCloud className="h-10 w-10 text-indigo-600 mx-auto" />
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tải lên tệp BCTC PDF (hoặc Chọn BCTC Mẫu Vinamilk Q2/2026)
            </div>
            <button
              onClick={handleRunOcr}
              disabled={ocrLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {ocrLoading ? 'Đang trích xuất dữ liệu BCTC...' : 'Trích xuất Dữ liệu Mẫu (Run OCR)'}
            </button>
          </div>

          {ocrResult && (
            <div className="p-5 bg-slate-900 text-white border-l-4 border-l-indigo-500 rounded-sm space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-indigo-300 uppercase tracking-wider">
                  Kết quả Trích xuất Tự động (Độ tin cậy: {ocrResult.confidenceScore}%)
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xs font-bold font-mono text-[10px]">
                  ✓ {ocrResult.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">Mã Doanh nghiệp</div>
                  <div className="font-bold text-white text-sm">{ocrResult.symbol}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Kỳ Báo cáo</div>
                  <div className="font-bold text-white text-sm">{ocrResult.period}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Doanh thu Thuần</div>
                  <div className="font-bold text-emerald-400 text-sm">{ocrResult.revenue}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">LNST Sau Thuế</div>
                  <div className="font-bold text-emerald-400 text-sm">{ocrResult.netProfit}</div>
                </div>
              </div>

              <div className="pt-2 text-slate-300 font-sans">
                Ý kiến Kiểm toán: <strong className="text-white">{ocrResult.auditorOpinion}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Scoring Tab */}
      {activeTab === 'risk' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Đánh giá Rủi ro Vi phạm & Phát hiện Bất thường Giám sát (AI Fraud & Risk Scoring)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Phân tích chỉ số tài chính, tần suất chậm nộp và biến động bất thường để xếp hạng rủi ro vi phạm công bố thông tin.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chọn Mã Chứng khoán:</label>
            <select
              value={riskSymbol}
              onChange={(e) => setRiskSymbol(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs font-bold font-mono"
            >
              <option value="VNM">VNM (Vinamilk)</option>
              <option value="HPG">HPG (Hòa Phát)</option>
              <option value="VIC">VIC (Vingroup)</option>
            </select>
            <button
              onClick={handleRunRiskScoring}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider shadow-xs cursor-pointer"
            >
              Chạy Phân tích Rủi ro
            </button>
          </div>

          {riskResult && (
            <div className="p-5 bg-slate-50 border-l-4 border-l-indigo-600 border border-slate-200 rounded-sm space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-sm">
                  Đánh giá Rủi ro Vi phạm - Mã {riskResult.symbol}
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold font-mono rounded-xs text-xs">
                  Điểm Rủi ro: {riskResult.riskScore}/100 ({riskResult.riskLevel})
                </span>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Nhận định từ AI Engine:</div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {riskResult.anomalies.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="text-slate-500 font-mono text-[11px] pt-1 border-t border-slate-200">
                Trạng thái Pháp lý: {riskResult.legalCompliance}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Draft Official Disclosures Tab */}
      {activeTab === 'draft' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Tự động Soạn thảo Công văn / Thông báo HNX (AI Draft Official Documents)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sinh văn bản hành chính đúng thể thức công văn Sở HNX theo mẫu pháp lý tiêu chuẩn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Loại Công văn:</label>
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm font-semibold"
              >
                <option value="WARNING">Thông báo Đưa vào Diện Cảnh báo (Đ40)</option>
                <option value="EXPLANATION">Công văn Yêu cầu Giải trình Chậm nộp BCTC</option>
                <option value="DELISTING">Quyết định Hủy Niêm yết Bắt buộc</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tên Doanh nghiệp Nhận:</label>
              <input
                type="text"
                value={draftOrg}
                onChange={(e) => setDraftOrg(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm font-semibold"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateDraft}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider shadow-xs cursor-pointer"
          >
            Sinh Công văn Mẫu (AI Draft)
          </button>

          {generatedDraft && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Văn bản Sinh Tự động:</span>
                <button
                  onClick={() => alert('Đã sao chép nội dung công văn vào clipboard!')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider cursor-pointer"
                >
                  Sao chép Văn bản
                </button>
              </div>
              <textarea
                value={generatedDraft}
                onChange={(e) => setGeneratedDraft(e.target.value)}
                rows={12}
                className="w-full p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-sm border border-slate-800 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* AI Auto-Correction Tab */}
      {activeTab === 'autocorrect' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-emerald-600" />
                4. Kiểm tra & Sửa lỗi Thể thức Tự động (AI Auto-Correction Engine)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Quét dự thảo văn bản CBTT để phát hiện lỗi Quốc hiệu, Tiêu ngữ, Căn cứ pháp lý, Định dạng con số & Tên tệp đính kèm trước khi nộp.
              </p>
            </div>

            {/* Quick Sample Draft Selector */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-md text-xs">
              <span className="text-slate-500 font-bold px-1 text-[11px]">Chọn Mẫu thử:</span>
              {sampleDrafts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSample(s.id)}
                  className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold border border-slate-200 rounded-sm shadow-2xs text-[11px] cursor-pointer"
                >
                  {s.id === 'sample1' ? 'Mẫu 1 (BCTC)' : 'Mẫu 2 (Giải trình)'}
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Tiêu đề Hồ sơ / Văn bản:</span>
                  <span className="text-slate-400 text-[10px] lowercase font-normal">tiêu đề ngắn gọn</span>
                </label>
                <input
                  type="text"
                  value={scanTitle}
                  onChange={(e) => setScanTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Tên tệp đính kèm (Attachment Filename):</span>
                  <span className="text-slate-400 text-[10px] lowercase font-normal">quy chuẩn đặt tên tệp</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={scanFilename}
                    onChange={(e) => setScanFilename(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Nội dung Văn bản / Báo cáo Khai báo:</span>
                  <span className="text-slate-400 text-[10px] lowercase font-normal">dự thảo soạn thảo</span>
                </label>
                <textarea
                  value={scanText}
                  onChange={(e) => setScanText(e.target.value)}
                  rows={10}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-sm text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <button
                onClick={handleScanDraft}
                disabled={isScanning}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
                <span>{isScanning ? 'Đang phân tích & Rà soát Thể thức...' : 'Quét & Phát hiện Lỗi Format AI'}</span>
              </button>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-6 space-y-4">
              {!scanResult && !isScanning && (
                <div className="h-full border-2 border-dashed border-slate-200 rounded-sm p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
                  <ShieldCheck className="h-12 w-12 text-slate-300" />
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Sẵn sàng Quét Thể thức
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Nhấn <strong>"Quét & Phát hiện Lỗi Format AI"</strong> để AI phân tích chi tiết các lỗi thể thức văn bản, trích dẫn Thông tư 96 và chuẩn hóa con số.
                  </p>
                </div>
              )}

              {isScanning && (
                <div className="h-full border border-slate-200 rounded-sm p-8 text-center bg-white flex flex-col items-center justify-center space-y-3">
                  <RefreshCcw className="h-8 w-8 text-indigo-600 animate-spin" />
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    AI Engine đang kiểm tra Quy chuẩn HNX & Thông tư 96...
                  </div>
                </div>
              )}

              {scanResult && !isScanning && (
                <div className="space-y-4">
                  {/* Score Card Header */}
                  <div className="p-4 bg-slate-900 text-white rounded-sm space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileCheck2 className="h-4 w-4 text-emerald-400" />
                        <span>Chỉ số Chuẩn hóa Thể thức</span>
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                          scanResult.overallScore === 100
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {scanResult.overallScore === 100 ? '✓ 100% ĐẠT CHUẨN' : `⚠️ CHỨA ${(scanResult?.issues || []).filter((i: any) => !i.fixed).length} LỖI FORMAT`}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Điểm Đạt Thể thức:</span>
                        <span className="font-bold text-emerald-400">{scanResult.overallScore} / 100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 transition-all duration-500"
                          style={{ width: `${scanResult.overallScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Batch Fix Button */}
                    {scanResult.overallScore < 100 && (
                      <button
                        onClick={handleApplyAllFixes}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Tự động Sửa Tất cả {(scanResult?.issues || []).filter((i: any) => !i.fixed).length} Lỗi Format (Apply All Fixes)</span>
                      </button>
                    )}
                  </div>

                  {/* Issues List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Danh sách Cảnh báo & Gợi ý từ AI:</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {(scanResult?.issues || []).filter((i: any) => i.fixed).length} / {(scanResult?.issues || []).length} đã sửa
                      </span>
                    </div>

                    {(scanResult?.issues || []).map((issue: any) => (
                      <div
                        key={issue.id}
                        className={`p-3.5 rounded-sm border transition-all text-xs space-y-2 ${
                          issue.fixed
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : issue.severity === 'HIGH'
                            ? 'bg-rose-50/70 border-rose-200 text-slate-900'
                            : issue.severity === 'MEDIUM'
                            ? 'bg-amber-50/70 border-amber-200 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-1.5 font-bold">
                            {issue.fixed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : issue.severity === 'HIGH' ? (
                              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            )}
                            <span className={issue.fixed ? 'line-through text-slate-500' : 'text-slate-900'}>
                              {issue.title}
                            </span>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase font-mono rounded-2xs ${
                              issue.fixed
                                ? 'bg-emerald-200 text-emerald-800'
                                : issue.severity === 'HIGH'
                                ? 'bg-rose-200 text-rose-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {issue.fixed ? 'Đã sửa' : issue.severity}
                          </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-normal">{issue.description}</p>

                        {!issue.fixed && (
                          <div className="bg-white p-2.5 rounded-sm border border-slate-200 space-y-1 font-mono text-[11px]">
                            <div className="text-rose-600 flex items-center space-x-1">
                              <span className="font-bold">Ban đầu:</span>
                              <span className="bg-rose-50 px-1 rounded-xs">{issue.originalSnippet}</span>
                            </div>
                            <div className="text-emerald-700 flex items-center space-x-1">
                              <span className="font-bold">Đề xuất:</span>
                              <span className="bg-emerald-50 px-1 rounded-xs whitespace-pre-line">{issue.suggestedCorrection}</span>
                            </div>
                          </div>
                        )}

                        {!issue.fixed && (
                          <button
                            onClick={() => handleFixSingleIssue(issue.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-sm font-bold text-[11px] uppercase tracking-wider cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            <span>Áp dụng Sửa Lỗi này</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Corrected Text Output Preview Box */}
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-sm space-y-2 border border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Văn bản & Tệp đã Chuẩn hóa (Cleaned Output):
                      </span>
                      <button
                        onClick={handleCopyCorrected}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider cursor-pointer"
                      >
                        {copiedStatus ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedStatus ? 'Đã sao chép!' : 'Sao chép Nội dung'}</span>
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 space-y-1">
                      <div><strong className="text-slate-500">Tệp đính kèm:</strong> {scanFilename}</div>
                      <div className="whitespace-pre-line text-slate-200 border-t border-slate-800 pt-2 max-h-40 overflow-y-auto leading-relaxed">
                        {scanText}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Bot Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              5. Trợ lý Trả lời Pháp lý & Trợ giúp Nghiệp vụ Niêm yết (RAG Legal Bot)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hỏi đáp quy định về Thông tư 96/2020/TT-BTC, Nghị định 155/2020/NĐ-CP và Quy chế Niêm yết HNX.
            </p>
          </div>

          <div className="h-80 bg-slate-50 border border-slate-200 rounded-sm p-4 overflow-y-auto space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl p-3 rounded-sm text-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Nhập câu hỏi pháp lý (Ví dụ: Thời hạn công bố BCTC bán niên là bao nhiêu ngày?)..."
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider shadow-xs cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
