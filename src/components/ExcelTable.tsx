import React, { useState, useRef } from 'react';
import { Student, ExamSheet, GradeItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { ExcelExportOptions } from '../utils/excelExport';
import { ExportExcelModal } from './ExportExcelModal';
import { ConfirmClearModal } from './ConfirmClearModal';
import { 
  FileSpreadsheet, 
  Download, 
  Upload,
  Printer, 
  Copy, 
  Search, 
  ArrowUpDown, 
  Mic, 
  Check, 
  UserPlus, 
  Trash2,
  Sparkles,
  ListOrdered
} from 'lucide-react';

import { Grade10ColumnKey } from '../types';

interface ExcelTableProps {
  students: Student[];
  exam: ExamSheet;
  targetColumnKey?: Grade10ColumnKey;
  targetColumnTitle?: string;
  onUpdateMark: (studentId: string, originalMark: number | null, notes?: string) => void;
  onUpdateMaxScore: (maxScore: number) => void;
  onClearMarks: () => void;
  onExportExcel: (options?: ExcelExportOptions) => void;
  onImportExcel?: (file: File) => void;
  onPrint: () => void;
  onCopyClipboard: () => void;
  onOpenVoiceModal: () => void;
  onOpenAddStudent: () => void;
  onOpenTrashModal?: () => void;
  trashCount?: number;
  onSendToMainRegister?: (targetColKey: Grade10ColumnKey) => void;
  onBackToMainRegister?: () => void;
  lang: Language;
}

export const ExcelTable: React.FC<ExcelTableProps> = ({
  students,
  exam,
  targetColumnKey,
  targetColumnTitle,
  onUpdateMark,
  onUpdateMaxScore,
  onClearMarks,
  onExportExcel,
  onImportExcel,
  onPrint,
  onCopyClipboard,
  onOpenVoiceModal,
  onOpenAddStudent,
  onOpenTrashModal,
  trashCount = 0,
  onSendToMainRegister,
  onBackToMainRegister,
  lang,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);
  const [maxInput, setMaxInput] = useState<string>(String(exam.maxScore || 100));
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'ungraded' | 'passed' | 'failed'>('all');
  const [sortField, setSortField] = useState<'seq' | 'name' | 'original' | 'final' | 'voice'>('voice');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveMax = exam.targetMax || (exam.maxScore / (exam.divisor || 1));

  // Count exceeding marks
  const exceedingCount = students.filter((s) => {
    const item = exam.grades[s.id];
    return item && item.originalMark !== null && item.originalMark > exam.maxScore;
  }).length;

  // Filter and sort students
  const filteredStudents = students.filter((student, index) => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = student.name.toLowerCase().includes(term);
      const matchesSeq = String(index + 1).includes(term);
      if (!matchesName && !matchesSeq) return false;
    }

    const item = exam.grades[student.id];
    const orig = item?.originalMark ?? null;
    const finalVal = item?.dividedMark ?? (orig !== null && exam.divisor ? orig / exam.divisor : orig);

    if (filterStatus === 'graded') return orig !== null;
    if (filterStatus === 'ungraded') return orig === null;
    if (filterStatus === 'passed') return finalVal !== null && (finalVal / effectiveMax) * 100 >= 50;
    if (filterStatus === 'failed') return finalVal !== null && (finalVal / effectiveMax) * 100 < 50;

    return true;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const idxA = students.indexOf(a);
    const idxB = students.indexOf(b);

    if (sortField === 'voice') {
      const orderA = exam.grades[a.id]?.spokenOrder ?? 999999;
      const orderB = exam.grades[b.id]?.spokenOrder ?? 999999;
      if (orderA !== orderB) {
        return sortAsc ? orderA - orderB : orderB - orderA;
      }
      return idxA - idxB;
    }
    if (sortField === 'seq') {
      return sortAsc ? idxA - idxB : idxB - idxA;
    }
    if (sortField === 'name') {
      return sortAsc
        ? a.name.localeCompare(b.name, 'ar')
        : b.name.localeCompare(a.name, 'ar');
    }
    if (sortField === 'original') {
      const valA = exam.grades[a.id]?.originalMark ?? -1;
      const valB = exam.grades[b.id]?.originalMark ?? -1;
      return sortAsc ? valA - valB : valB - valA;
    }
    if (sortField === 'final') {
      const valA = exam.grades[a.id]?.dividedMark ?? (exam.grades[a.id]?.originalMark ? (exam.grades[a.id]?.originalMark as number) / exam.divisor : -1);
      const valB = exam.grades[b.id]?.dividedMark ?? (exam.grades[b.id]?.originalMark ? (exam.grades[b.id]?.originalMark as number) / exam.divisor : -1);
      return sortAsc ? (valA ?? -1) - (valB ?? -1) : (valB ?? -1) - (valA ?? -1);
    }
    return 0;
  });

  const handleSort = (field: 'seq' | 'name' | 'original' | 'final' | 'voice') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextStudent = sortedStudents[currentIndex + 1];
      if (nextStudent && inputRefs.current[nextStudent.id]) {
        inputRefs.current[nextStudent.id]?.focus();
        inputRefs.current[nextStudent.id]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = sortedStudents[currentIndex - 1];
      if (prevStudent && inputRefs.current[prevStudent.id]) {
        inputRefs.current[prevStudent.id]?.focus();
        inputRefs.current[prevStudent.id]?.select();
      }
    }
  };

  const handleCopy = () => {
    onCopyClipboard();
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-12">
      {/* Target Register Column Sync Banner */}
      {targetColumnKey && onSendToMainRegister && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-emerald-700/60 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-black text-lg shadow-inner">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-300 bg-emerald-500/30 px-2 py-0.5 rounded-md border border-emerald-400/20">
                  خانەیا هەڵبژارتی بۆ سجلا سەرەکی
                </span>
                <span className="text-xs text-slate-300 font-bold font-mono">
                  ({exam.maxScore} نمرەیی)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                تۆمارکرن و دەستکاریکرنا نمرەیان بۆ خانەیا: <span className="text-amber-300 underline">{targetColumnTitle || targetColumnKey}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onBackToMainRegister && (
              <button
                type="button"
                onClick={onBackToMainRegister}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                گەڕیان ڤە
              </button>
            )}
            <button
              type="button"
              onClick={() => onSendToMainRegister(targetColumnKey)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-emerald-300"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>هنارتن بو تۆمارا سەرەکی (Send to Main Register)</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Warning Banner if any student mark exceeds maxScore */}
      {exceedingCount > 0 && (
        <div className="bg-red-500 text-white p-4 flex items-center justify-between gap-3 animate-fadeIn border-b border-red-600 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                ئاگاداری: {exceedingCount} نمرە زیاتر ژ حدێ بەرامبەر (مەکسیۆم: {exam.maxScore}) هاتینە تۆمارکرن!
              </h4>
              <p className="text-xs text-red-100 font-bold mt-0.5">
                نمرەیێن زێدەتر ب چوارگۆشەیا سووریا گەش هاتیە دەستنیشانکرن و ئاگاداری ل سەر هاتیە دانان.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2.5 flex-wrap flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="لێگەڕیان ل ناڤێ قوتابی یان ژمارە..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              هەمی ({students.length})
            </button>
            <button
              onClick={() => setFilterStatus('graded')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'graded' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              نمرە وەرگرتین
            </button>
            <button
              onClick={() => setFilterStatus('ungraded')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'ungraded' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              نەهاتیە دانان
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'failed' ? 'bg-white text-red-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              کەفتی
            </button>
          </div>
        </div>

        {/* Right: Export, Import & Actions Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Record Voice Trigger */}
          <button
            onClick={onOpenVoiceModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>{t('recordVoice')}</span>
          </button>

          {/* Upload / Import Excel (.xlsx) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="بارکرنا فایلا ئێکسل (Upload Excel)"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>بارکرنا ئێکسل</span>
          </button>

          {/* Export Excel (.xlsx) */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title={t('exportExcel')}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t('exportExcel')}</span>
          </button>

          {/* Copy Table for Excel */}
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title={t('copyTable')}
          >
            {copiedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">{t('copiedSuccess')}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>{t('copyTable')}</span>
              </>
            )}
          </button>

          {/* Print / PDF */}
          <button
            onClick={onPrint}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title={t('printPdf')}
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{t('printPdf')}</span>
          </button>

          {/* Add student */}
          <button
            onClick={onOpenAddStudent}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title={t('addStudent')}
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
          </button>

          {/* Clear marks */}
          <button
            onClick={() => setIsClearConfirmOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-all cursor-pointer"
            title="مسحکرنا هەمی نمرەیێن ڤێ هۆبەیێ"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Open Trash Bin Modal */}
          {onOpenTrashModal && (
            <button
              onClick={onOpenTrashModal}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="نمرەیێن ژێبری (سەلا زبڵێ)"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>سەلا زبڵێ</span>
              {trashCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {trashCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sorting Quick Bar (Spoken voice order toggle) */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 flex-wrap text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 flex items-center gap-1">
            <ListOrdered className="w-3.5 h-3.5" />
            رێزبەندیا نیشاندانا ژمارەیان:
          </span>
          <button
            onClick={() => handleSort('voice')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              sortField === 'voice'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>رێزبەندیا دەنگی (ئەو ناڤێ ئێکەم هاتیە خواندن)</span>
          </button>
          <button
            onClick={() => handleSort('seq')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sortField === 'seq'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            رێزبەندیا تەختێ هۆبەیێ (1..2..)
          </button>
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sortField === 'name'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            ئەلفوبێ (أ-ي)
          </button>
          <button
            onClick={() => handleSort('original')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sortField === 'original'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            دویڤ نمرێ
          </button>
        </div>

        {/* Max Score adjustment */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-normal">نمرە ل سەر چەندێ یە:</span>
          <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-xs">
            {exam.maxScore}
          </span>
          {[100, 50, 40, 30, 20, 10].map((score) => (
            <button
              key={score}
              onClick={() => onUpdateMaxScore(score)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                exam.maxScore === score
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {score}
            </button>
          ))}
          <input
            type="number"
            min="1"
            max="1000"
            placeholder="..."
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = parseFloat(maxInput);
                if (!isNaN(v) && v > 0) onUpdateMaxScore(v);
              }
            }}
            className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-center"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse select-text">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-black text-xs uppercase tracking-wider border-b border-slate-200">
              <th
                onClick={() => handleSort('seq')}
                className="py-3.5 px-4 w-14 text-center cursor-pointer hover:bg-slate-200/60 transition-all"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t('thSeq')}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-all min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t('thName')}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('original')}
                className="py-3.5 px-4 text-center w-36 cursor-pointer hover:bg-slate-200/60 transition-all"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{t('thOriginalMark')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (/{exam.maxScore})
                  </span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 text-center w-24">
                <span>{t('thDivisor')}</span>
              </th>
              <th
                onClick={() => handleSort('final')}
                className="py-3.5 px-4 text-center w-36 cursor-pointer hover:bg-slate-200/60 transition-all bg-emerald-50/50"
              >
                <div className="flex items-center justify-center gap-1 text-emerald-900 font-extrabold">
                  <span>{t('thFinalMark')}</span>
                  <span className="text-[10px] text-emerald-700 font-normal">
                    (/{effectiveMax})
                  </span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                </div>
              </th>
              <th className="py-3.5 px-3 text-center w-24">
                <span>{t('thPercentage')}</span>
              </th>
              <th className="py-3.5 px-4 text-center w-36">
                <span>{t('thStatus')}</span>
              </th>
              <th className="py-3.5 px-4 min-w-[150px]">
                <span>{t('thNotes')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                    <span>چ قوتابی نەهاتنە دیتن ل دویڤ ڤی لێگەڕیانێ.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedStudents.map((student, idx) => {
                const globalIndex = students.indexOf(student) + 1;
                const item: GradeItem | undefined = exam.grades[student.id];
                const originalMark = item?.originalMark ?? null;
                const finalMark = item?.dividedMark ?? (originalMark !== null && exam.divisor ? originalMark / exam.divisor : originalMark);

                const pct = finalMark !== null ? Math.round((finalMark / effectiveMax) * 100) : null;

                // Status Badge styling
                let statusBadge = (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-400">
                    {t('notGraded')}
                  </span>
                );

                if (pct !== null) {
                  if (pct >= 90) {
                    statusBadge = (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {t('excellent')}
                      </span>
                    );
                  } else if (pct >= 80) {
                    statusBadge = (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        {t('veryGood')}
                      </span>
                    );
                  } else if (pct >= 70) {
                    statusBadge = (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {t('good')}
                      </span>
                    );
                  } else if (pct >= 60) {
                    statusBadge = (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {t('medium')}
                      </span>
                    );
                  } else if (pct >= 50) {
                    statusBadge = (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                        {t('acceptable')}
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        {t('failed')}
                      </span>
                    );
                  }
                }

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Sequence */}
                    <td className="py-3 px-4 text-center font-bold text-slate-400 group-hover:text-slate-700">
                      <div className="flex flex-col items-center justify-center">
                        <span>{globalIndex}</span>
                        {item?.spokenOrder && (
                          <span className="text-[10px] text-purple-600 font-extrabold bg-purple-50 px-1 rounded" title="تەرتیبا دەنگی">
                            #{item.spokenOrder}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{student.name}</span>
                        {item?.source === 'voice' && (
                          <span
                            className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal"
                            title="ب رێکا دەنگی هاتیە تۆمارکرن"
                          >
                            <Mic className="w-2.5 h-2.5 mr-0.5" />
                            AI
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Original Mark (In-cell editable input with red highlight if exceeding max) */}
                    <td className="py-2 px-3 text-center">
                      <div className="relative inline-block w-28">
                        {(() => {
                          const isOverMax = originalMark !== null && originalMark > exam.maxScore;
                          return (
                            <>
                              <input
                                ref={(el) => {
                                  inputRefs.current[student.id] = el;
                                }}
                                type="number"
                                step="0.5"
                                min="0"
                                value={originalMark !== null ? originalMark : ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                  onUpdateMark(student.id, val, item?.notes);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                placeholder="—"
                                className={`w-full py-1.5 px-3 rounded-xl border text-center font-black text-base transition-all focus:outline-none ${
                                  isOverMax
                                    ? 'border-2 border-red-600 bg-red-100 text-red-950 ring-2 ring-red-500/80 shadow-md animate-pulse'
                                    : originalMark !== null
                                    ? 'bg-white border-slate-300 text-slate-900 shadow-xs focus:ring-2 focus:ring-emerald-500'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500'
                                }`}
                                title={isOverMax ? `⚠️ نمرە (${originalMark}) زیاترە ژ مەکسیۆم (${exam.maxScore})!` : undefined}
                              />
                              {isOverMax && (
                                <span className="block text-[10px] font-black text-red-700 leading-none mt-1 bg-red-50 px-1 py-0.5 rounded border border-red-300">
                                  ⚠️ &gt; {exam.maxScore}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Divisor badge */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        ÷ {exam.divisor || 1}
                      </span>
                    </td>

                    {/* Final Divided Mark */}
                    <td className="py-3 px-4 text-center bg-emerald-50/30">
                      <span
                        className={`text-base font-black px-2.5 py-1 rounded-lg ${
                          finalMark !== null
                            ? pct !== null && pct < 50
                              ? 'text-red-700 bg-red-50'
                              : 'text-emerald-700 bg-emerald-100/70'
                            : 'text-slate-300'
                        }`}
                      >
                        {finalMark !== null ? Number(finalMark.toFixed(2)) : '—'}
                      </span>
                    </td>

                    {/* Percentage */}
                    <td className="py-3 px-3 text-center font-bold text-xs text-slate-600">
                      {pct !== null ? `${pct}%` : '—'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {statusBadge}
                    </td>

                    {/* Teacher Notes */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="تێبینی..."
                        value={item?.notes || ''}
                        onChange={(e) => {
                          onUpdateMark(student.id, originalMark, e.target.value);
                        }}
                        className="w-full py-1 px-2.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-slate-300 focus:bg-white bg-transparent text-xs text-slate-700 transition-all focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
        <div>
          نیشاندانا <b>{sortedStudents.length}</b> قوتابی ژ کۆما <b>{students.length}</b> قوتابیێن هۆبەیێ
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            نمرەیا دابەشکری = نمرەیا سەرەکی ÷ {exam.divisor || 1}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            کلیک ل سەر نمرێ بکە و "Enter" بدە بۆ چوونا قوتابیێ دویڤدا
          </span>
        </div>
      </div>

      {/* Export Options Customization Modal */}
      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirmExport={(opts) => onExportExcel(opts)}
        totalStudentsCount={students.length}
        gradedStudentsCount={students.filter((s) => exam.grades[s.id]?.originalMark !== null && exam.grades[s.id]?.originalMark !== undefined).length}
        lang={lang}
      />

      {/* Clear Confirmation Modal */}
      <ConfirmClearModal
        isOpen={isClearConfirmOpen}
        title="دوپاتکرنا مسحکرنا نمرەیان"
        message="ئایا تە دڤێت مسح کەین؟"
        subMessage="ئایا تە دڤێت هەمی نمرەیێن سەرەکی و دابەشکری یێن ڤێ هۆبەیێ ژێببەی؟"
        confirmLabel="بەڵێ"
        cancelLabel="نەخێر"
        onConfirm={() => {
          onClearMarks();
          setIsClearConfirmOpen(false);
        }}
        onClose={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};

