import React, { useState, useRef } from 'react';
import { Student, Grade10Record, Grade10ColumnKey, Language } from '../types';
import { getTranslation } from '../utils/translations';
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
  ListOrdered,
  Sparkles
} from 'lucide-react';

interface Grade10RegisterTableProps {
  students: Student[];
  records: Record<string, Grade10Record>;
  onUpdateField: (studentId: string, field: Grade10ColumnKey, value: number | null, notes?: string) => void;
  onClearSectionRecords: () => void;
  onClearColumnRecords?: (field: Grade10ColumnKey) => void;
  onExportExcel: (options?: any) => void;
  onImportExcel?: (file: File) => void;
  onPrint: () => void;
  onCopyClipboard: () => void;
  onOpenVoiceModal: (colKey?: Grade10ColumnKey) => void;
  onSelectColumnForExam?: (colKey: Grade10ColumnKey) => void;
  onOpenAddStudent: () => void;
  onOpenTrashModal?: () => void;
  trashCount?: number;
  lang: Language;
}

export const Grade10RegisterTable: React.FC<Grade10RegisterTableProps> = ({
  students,
  records,
  onUpdateField,
  onClearSectionRecords,
  onClearColumnRecords,
  onExportExcel,
  onImportExcel,
  onPrint,
  onCopyClipboard,
  onOpenVoiceModal,
  onSelectColumnForExam,
  onOpenAddStudent,
  onOpenTrashModal,
  trashCount = 0,
  lang,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Confirm Clear Modal state
  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'column' | 'section';
    key?: Grade10ColumnKey;
    title: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'ungraded' | 'passed' | 'failed'>('all');
  const [sortField, setSortField] = useState<'seq' | 'name' | 'total' | 'voice'>('seq');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Field Max limits
  const fieldMaxes: Record<Grade10ColumnKey, number> = {
    eval1: 2,
    quiz1_1: 2,
    quiz1_2: 2,
    attend1: 2,
    clean1: 2,
    midterm: 20,
    eval2: 3,
    quiz2_1: 2,
    quiz2_2: 2,
    attend2: 1,
    clean2: 2,
    finalExam: 60,
  };

  const handleHeaderClick = (colKey: Grade10ColumnKey) => {
    if (onSelectColumnForExam) {
      onSelectColumnForExam(colKey);
    } else {
      onOpenVoiceModal(colKey);
    }
  };

  const handleConfirmClear = () => {
    if (!confirmTarget) return;
    if (confirmTarget.type === 'column' && confirmTarget.key && onClearColumnRecords) {
      onClearColumnRecords(confirmTarget.key);
    } else if (confirmTarget.type === 'section') {
      onClearSectionRecords();
    }
    setConfirmTarget(null);
  };

  // Helper for rendering interactive clickable header cells with clear column button
  const renderClickableHeaderCell = (
    colKey: Grade10ColumnKey,
    title: string,
    maxScore: number,
    bgClass: string = 'bg-emerald-800/80',
    widthClass: string = 'w-14'
  ) => {
    return (
      <th className={`p-1 border-r border-slate-600 ${widthClass} ${bgClass} align-middle`}>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => handleHeaderClick(colKey)}
            className="w-full py-1.5 px-1 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-white text-emerald-100 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs group active:scale-95"
            title={`کلیک بکە بۆ ڤەکرنا لاپەرێ (${title}) و داخلکرنا نمرەیان ب دەنگی/ئێکسل`}
          >
            <span className="font-black text-[11px] leading-tight flex items-center justify-center gap-1 group-hover:underline">
              <Mic className="w-3 h-3 text-emerald-300 group-hover:text-white flex-shrink-0" />
              <span>{title}</span>
            </span>
            <span className="text-[9px] bg-slate-900/60 text-emerald-200 group-hover:bg-white group-hover:text-emerald-900 px-1.5 py-0.2 rounded-full font-bold transition-colors">
              ({maxScore}) 👆
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmTarget({ type: 'column', key: colKey, title });
            }}
            className="text-[9px] text-red-200 hover:text-white bg-red-950/40 hover:bg-red-600 px-1.5 py-0.2 rounded flex items-center gap-0.5 transition-all cursor-pointer"
            title={`مسحکرنا هەمی نمرەیێن ستوونا (${title})`}
          >
            <Trash2 className="w-2.5 h-2.5" />
            <span>مسح</span>
          </button>
        </div>
      </th>
    );
  };

  // Calculate exceeding marks count
  let exceedingCount = 0;
  students.forEach((s) => {
    const rec = records[s.id];
    if (!rec) return;
    (Object.keys(fieldMaxes) as Grade10ColumnKey[]).forEach((f) => {
      const val = rec[f];
      const maxVal = fieldMaxes[f];
      if (val !== null && val !== undefined && val > maxVal) {
        exceedingCount++;
      }
    });
  });

  // Helper to compute totals for a single student
  const computeStudentTotals = (rec?: Grade10Record) => {
    if (!rec) return { sum1: null, sumMidterm: null, sum2: null, termTotal40: null, grandTotal100: null };

    const {
      eval1, quiz1_1, quiz1_2, attend1, clean1,
      midterm,
      eval2, quiz2_1, quiz2_2, attend2, clean2,
      finalExam
    } = rec;

    // Sum 1st Eval (out of 10)
    const has1 = [eval1, quiz1_1, quiz1_2, attend1, clean1].some((v) => v !== null && v !== undefined);
    const sum1 = has1
      ? (eval1 || 0) + (quiz1_1 || 0) + (quiz1_2 || 0) + (attend1 || 0) + (clean1 || 0)
      : null;

    // Midterm Sum (out of 30 = 1st Eval 10 + Midterm 20)
    const sumMidterm = (sum1 !== null || midterm !== null && midterm !== undefined)
      ? (sum1 || 0) + (midterm || 0)
      : null;

    // Sum 2nd Eval (out of 10)
    const has2 = [eval2, quiz2_1, quiz2_2, attend2, clean2].some((v) => v !== null && v !== undefined);
    const sum2 = has2
      ? (eval2 || 0) + (quiz2_1 || 0) + (quiz2_2 || 0) + (attend2 || 0) + (clean2 || 0)
      : null;

    // Annual Term Total (out of 40 = 1st Eval 10 + Midterm 20 + 2nd Eval 10)
    const has40 = sumMidterm !== null || sum2 !== null;
    const termTotal40 = has40 ? (sumMidterm || 0) + (sum2 || 0) : null;

    // Grand Total (out of 100 = Term Total 40 + Final Exam 60)
    const has100 = termTotal40 !== null || (finalExam !== null && finalExam !== undefined);
    const grandTotal100 = has100 ? (termTotal40 || 0) + (finalExam || 0) : null;

    return {
      sum1: sum1 !== null ? Number(sum1.toFixed(1)) : null,
      sumMidterm: sumMidterm !== null ? Number(sumMidterm.toFixed(1)) : null,
      sum2: sum2 !== null ? Number(sum2.toFixed(1)) : null,
      termTotal40: termTotal40 !== null ? Number(termTotal40.toFixed(1)) : null,
      grandTotal100: grandTotal100 !== null ? Number(grandTotal100.toFixed(1)) : null,
    };
  };

  // Filter & Sort Students
  const filteredStudents = students.filter((student, index) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = student.name.toLowerCase().includes(term);
      const matchesSeq = String(index + 1).includes(term);
      if (!matchesName && !matchesSeq) return false;
    }

    const rec = records[student.id];
    const { grandTotal100 } = computeStudentTotals(rec);

    if (filterStatus === 'graded') return grandTotal100 !== null;
    if (filterStatus === 'ungraded') return grandTotal100 === null;
    if (filterStatus === 'passed') return grandTotal100 !== null && grandTotal100 >= 50;
    if (filterStatus === 'failed') return grandTotal100 !== null && grandTotal100 < 50;

    return true;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const idxA = students.indexOf(a);
    const idxB = students.indexOf(b);

    if (sortField === 'voice') {
      const orderA = records[a.id]?.spokenOrder ?? 999999;
      const orderB = records[b.id]?.spokenOrder ?? 999999;
      if (orderA !== orderB) return sortAsc ? orderA - orderB : orderB - orderA;
      return idxA - idxB;
    }
    if (sortField === 'seq') {
      return sortAsc ? idxA - idxB : idxB - idxA;
    }
    if (sortField === 'name') {
      return sortAsc ? a.name.localeCompare(b.name, 'ar') : b.name.localeCompare(a.name, 'ar');
    }
    if (sortField === 'total') {
      const totA = computeStudentTotals(records[a.id]).grandTotal100 ?? -1;
      const totB = computeStudentTotals(records[b.id]).grandTotal100 ?? -1;
      return sortAsc ? totA - totB : totB - totA;
    }
    return 0;
  });

  const handleSort = (field: 'seq' | 'name' | 'total' | 'voice') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
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
      {/* Hidden File Input for Excel Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header Info & Title Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-black px-2.5 py-0.5 rounded-full">
              سجلا نمرەیان - پۆلا 10
            </span>
            <span className="text-xs text-slate-300 font-bold">100 نمرەیی (گشتی)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            سجلا هه‌ڵسه‌نگاندن و ئه‌زموونێن پۆلا 10
          </h2>
          <p className="text-xs text-emerald-100/80 font-medium mt-1">
            دەها ئێکێ (10) + نیڤا وەرزی (20) + دەها دووێ (10) + دوماهیا سالێ (60) = 100
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenVoiceModal()}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>تەسجیلکرنا دەنگی (AI)</span>
          </button>
        </div>
      </div>

      {/* Warning Banner if any mark exceeds column max score */}
      {exceedingCount > 0 && (
        <div className="bg-red-500 text-white p-4 flex items-center justify-between gap-3 animate-fadeIn border-b border-red-600 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                ئاگاداری: {exceedingCount} نمرە زیاتر ژ حدێ بەرامبەر (مەکسیۆم) هاتینە تۆمارکرن!
              </h4>
              <p className="text-xs text-red-100 font-bold mt-0.5">
                چوارگۆشەیێن کو نمرەیێن وان زێدەترن ب رەنگێ سوورێ گەش دەستنیشانکرن و چاڤدێری دکەت.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Status Filter */}
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

        {/* Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="بارکرنا فایلا ئێکسل (Upload Excel)"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>بارکرنا ئێکسل</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t('exportExcel')}</span>
          </button>

          {/* Copy Table */}
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
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
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{t('printPdf')}</span>
          </button>

          {/* Add Student */}
          <button
            onClick={onOpenAddStudent}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title={t('addStudent')}
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
          </button>

          {/* Clear Section */}
          <button
            onClick={() => setConfirmTarget({ type: 'section', title: 'سجلا پۆلا 10' })}
            className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-all cursor-pointer"
            title="مسحکرنا هەمی نمرەیێن سجلا ڤێ پۆلێ"
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

      {/* Sorting bar */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
        <span className="text-slate-500 flex items-center gap-1">
          <ListOrdered className="w-3.5 h-3.5" />
          رێزبەندیا ڕێزان:
        </span>
        <button
          onClick={() => handleSort('seq')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
            sortField === 'seq' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          رێزبەندیا تەختێ هۆبەیێ (1..2..)
        </button>
        <button
          onClick={() => handleSort('voice')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
            sortField === 'voice' ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Mic className="w-3 h-3" />
          رێزبەندیا دەنگی
        </button>
        <button
          onClick={() => handleSort('name')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
            sortField === 'name' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          ئەلف و بێ (أ-ي)
        </button>
        <button
          onClick={() => handleSort('total')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
            sortField === 'total' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          دویڤ نمرەیا گشتی (100)
        </button>
      </div>

      {/* Main Multi-Column Table */}
      <div className="overflow-x-auto select-text">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            {/* Top Multi-Header Row */}
            <tr className="bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider text-center border-b border-slate-700">
              <th rowSpan={2} className="py-3 px-2 w-10 border-r border-slate-700">#</th>
              <th rowSpan={2} className="py-3 px-3 text-right min-w-[180px] border-r border-slate-700">ناڤێ چواری یێ قوتابی</th>
              
              {/* 1st Term Evaluation Group (10 marks) */}
              <th colSpan={6} className="py-2 px-1 bg-emerald-900/90 border-r border-slate-700 text-emerald-200">
                دەها ئێکێ (کۆم: 10 نمرە)
              </th>

              {/* Midterm Exam Group (20 marks) */}
              <th colSpan={2} className="py-2 px-1 bg-teal-900/90 border-r border-slate-700 text-teal-200">
                نیڤا وەرزی (20)
              </th>

              {/* 2nd Term Evaluation Group (10 marks) */}
              <th colSpan={6} className="py-2 px-1 bg-blue-900/90 border-r border-slate-700 text-blue-200">
                دەها دووێ (کۆم: 10 نمرە)
              </th>

              {/* Annual Term & Final Exam Group */}
              <th rowSpan={2} className="py-3 px-2 bg-indigo-900 text-indigo-200 border-r border-slate-700 font-extrabold w-16">
                سەنەوی (40)
              </th>
              
              {/* Final Exam Interactive Column Header Button */}
              <th rowSpan={2} className="p-1 bg-purple-900 border-r border-slate-700 font-extrabold w-16 align-middle">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleHeaderClick('finalExam')}
                    className="w-full py-2 px-1 rounded-xl bg-white/10 hover:bg-purple-600 text-purple-100 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs group active:scale-95"
                    title="کلیک بکە بۆ داخلکرنا نمرەیێن دوماهیا سالێ (60)"
                  >
                    <span className="font-black text-[11px] leading-tight flex items-center gap-1">
                      <Mic className="w-3 h-3 text-purple-300 group-hover:text-white" />
                      <span>دوماهیا سالێ</span>
                    </span>
                    <span className="text-[9px] bg-slate-950/60 text-purple-200 group-hover:bg-white group-hover:text-purple-950 px-1.5 py-0.5 rounded-full font-bold">
                      (60) 👆
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmTarget({ type: 'column', key: 'finalExam', title: 'دوماهیا سالێ (60)' });
                    }}
                    className="text-[9px] text-red-200 hover:text-white bg-red-950/40 hover:bg-red-600 px-1.5 py-0.2 rounded flex items-center gap-0.5 transition-all cursor-pointer"
                    title="مسحکرنا نمرەیێن دوماهیا سالێ"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>مسح</span>
                  </button>
                </div>
              </th>

              <th rowSpan={2} className="py-3 px-3 bg-emerald-950 text-emerald-300 border-r border-slate-700 font-black text-sm w-20">
                گشتی (100)
              </th>
              <th rowSpan={2} className="py-3 px-2 border-r border-slate-700 w-24">التقدير</th>
              <th rowSpan={2} className="py-3 px-3 min-w-[120px]">تێبینی</th>
            </tr>

            {/* Sub-Header Row with Interactive Clickable Column Headers */}
            <tr className="bg-slate-700 text-slate-200 font-bold text-[10px] text-center border-b border-slate-600">
              {/* 1st Term Columns */}
              {renderClickableHeaderCell('eval1', 'هەڵسەنگاندن', 2, 'bg-emerald-800/80')}
              {renderClickableHeaderCell('quiz1_1', 'کویز 1', 2, 'bg-emerald-800/80')}
              {renderClickableHeaderCell('quiz1_2', 'کویز 2', 2, 'bg-emerald-800/80')}
              {renderClickableHeaderCell('attend1', 'ئامادەبوون', 2, 'bg-emerald-800/80')}
              {renderClickableHeaderCell('clean1', 'پاکژی', 2, 'bg-emerald-800/80')}
              <th className="py-2 px-1 bg-emerald-700/80 text-white font-extrabold border-r border-slate-600 w-14">کۆم (10)</th>

              {/* Midterm Columns */}
              {renderClickableHeaderCell('midterm', 'ئەزموون', 20, 'bg-teal-800/80', 'w-16')}
              <th className="py-2 px-1 bg-teal-700/80 text-white font-extrabold border-r border-slate-600 w-14">کۆم (30)</th>

              {/* 2nd Term Columns */}
              {renderClickableHeaderCell('eval2', 'هەڵسەنگاندن', 3, 'bg-blue-800/80')}
              {renderClickableHeaderCell('quiz2_1', 'کویز 1', 2, 'bg-blue-800/80')}
              {renderClickableHeaderCell('quiz2_2', 'کویز 2', 2, 'bg-blue-800/80')}
              {renderClickableHeaderCell('attend2', 'ئامادەبوون', 1, 'bg-blue-800/80')}
              {renderClickableHeaderCell('clean2', 'پاکژی', 2, 'bg-blue-800/80')}
              <th className="py-2 px-1 bg-blue-700/80 text-white font-extrabold border-r border-slate-600 w-14">کۆم (10)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={21} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                    <span>چ قوتابی نەهاتنە دیتن ل دویڤ ڤی لێگەڕیانێ.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedStudents.map((student, idx) => {
                const globalIdx = students.indexOf(student) + 1;
                const rec = records[student.id] || {
                  eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
                  midterm: null,
                  eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null,
                  finalExam: null,
                };

                const totals = computeStudentTotals(rec);

                // Status Badge
                let statusText = '—';
                let statusBg = 'bg-slate-100 text-slate-400';
                if (totals.grandTotal100 !== null) {
                  const g = totals.grandTotal100;
                  if (g >= 90) { statusText = 'ممتاز (نایاب)'; statusBg = 'bg-emerald-100 text-emerald-800 font-black'; }
                  else if (g >= 80) { statusText = 'جيد جداً (زۆر باش)'; statusBg = 'bg-teal-100 text-teal-800 font-bold'; }
                  else if (g >= 70) { statusText = 'جيد (باش)'; statusBg = 'bg-blue-100 text-blue-800 font-bold'; }
                  else if (g >= 60) { statusText = 'متوسط (ناڤین)'; statusBg = 'bg-amber-100 text-amber-800 font-bold'; }
                  else if (g >= 50) { statusText = 'مقبول (قەبوول)'; statusBg = 'bg-orange-100 text-orange-800 font-bold'; }
                  else { statusText = 'راسب (کەفتی)'; statusBg = 'bg-red-100 text-red-800 font-black'; }
                }

                // Helper for editable cell with red border warning if over max
                const renderCell = (
                  field: Grade10ColumnKey,
                  maxVal: number,
                  val: number | null,
                  bgClass: string = ''
                ) => {
                  const isOverMax = val !== null && val !== undefined && val > maxVal;
                  return (
                    <td className={`p-1 text-center border-r border-slate-200 relative ${bgClass} ${isOverMax ? 'bg-red-100/90' : ''}`}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={val !== null && val !== undefined ? val : ''}
                        onChange={(e) => {
                          const num = e.target.value === '' ? null : parseFloat(e.target.value);
                          onUpdateField(student.id, field, num, rec.notes);
                        }}
                        placeholder="—"
                        className={`w-11 py-1 text-center font-black text-xs rounded transition-all focus:outline-none ${
                          isOverMax
                            ? 'border-2 border-red-600 bg-red-100 text-red-950 ring-2 ring-red-500/80 shadow-md font-black animate-pulse'
                            : 'border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-transparent'
                        }`}
                        title={isOverMax ? `⚠️ ئاگاداری: نمرە (${val}) زێدەترە ژ ئاستێ بەرامبەر (${maxVal})!` : undefined}
                      />
                      {isOverMax && (
                        <span className="block text-[9px] font-black text-red-700 leading-none mt-0.5 bg-white/90 rounded px-0.5 border border-red-300 shadow-2xs">
                          ⚠️&gt;{maxVal}
                        </span>
                      )}
                    </td>
                  );
                };

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Seq */}
                    <td className="py-2 px-1 text-center font-bold text-slate-400 border-r border-slate-200">
                      <span>{globalIdx}</span>
                      {rec.spokenOrder && (
                        <div className="text-[9px] text-purple-600 font-black bg-purple-50 rounded">
                          #{rec.spokenOrder}
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                      {student.name}
                    </td>

                    {/* 1st Term Components (10) */}
                    {renderCell('eval1', 2, rec.eval1)}
                    {renderCell('quiz1_1', 2, rec.quiz1_1, 'bg-emerald-50/30 font-extrabold text-emerald-900')}
                    {renderCell('quiz1_2', 2, rec.quiz1_2)}
                    {renderCell('attend1', 2, rec.attend1)}
                    {renderCell('clean1', 2, rec.clean1)}
                    
                    {/* Sum 1st Term (10) */}
                    <td className="py-2 px-1 text-center font-black text-xs bg-emerald-100/70 text-emerald-900 border-r border-slate-200">
                      {totals.sum1 !== null ? totals.sum1 : '—'}
                    </td>

                    {/* Midterm Exam (20) */}
                    {renderCell('midterm', 20, rec.midterm, 'bg-teal-50/40')}

                    {/* Sum Midterm (30) */}
                    <td className="py-2 px-1 text-center font-black text-xs bg-teal-100/70 text-teal-900 border-r border-slate-200">
                      {totals.sumMidterm !== null ? totals.sumMidterm : '—'}
                    </td>

                    {/* 2nd Term Components (10) */}
                    {renderCell('eval2', 3, rec.eval2)}
                    {renderCell('quiz2_1', 2, rec.quiz2_1)}
                    {renderCell('quiz2_2', 2, rec.quiz2_2)}
                    {renderCell('attend2', 1, rec.attend2)}
                    {renderCell('clean2', 2, rec.clean2)}

                    {/* Sum 2nd Term (10) */}
                    <td className="py-2 px-1 text-center font-black text-xs bg-blue-100/70 text-blue-900 border-r border-slate-200">
                      {totals.sum2 !== null ? totals.sum2 : '—'}
                    </td>

                    {/* Term Total Annual (40) */}
                    <td className="py-2 px-1 text-center font-black text-xs bg-indigo-100/70 text-indigo-950 border-r border-slate-200">
                      {totals.termTotal40 !== null ? totals.termTotal40 : '—'}
                    </td>

                    {/* Final Exam (60) */}
                    {renderCell('finalExam', 60, rec.finalExam, 'bg-purple-50/40')}

                    {/* Grand Total (100) */}
                    <td className="py-2 px-2 text-center font-black text-sm bg-emerald-200/80 text-emerald-950 border-r border-slate-200">
                      {totals.grandTotal100 !== null ? totals.grandTotal100 : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-2 px-1 text-center border-r border-slate-200">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${statusBg}`}>
                        {statusText}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        placeholder="تێبینی..."
                        value={rec.notes || ''}
                        onChange={(e) => onUpdateField(student.id, 'quiz1_1', rec.quiz1_1, e.target.value)}
                        className="w-full py-0.5 px-1.5 rounded border border-transparent hover:border-slate-200 focus:border-slate-300 bg-transparent text-[11px] text-slate-700 transition-all focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
        <div>
          نیشاندانا <b>{sortedStudents.length}</b> قوتابی ژ کۆما <b>{students.length}</b> قوتابیێن پۆلا 10
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            نمرەیێن تومارکری پێشتر هاتیە هەژمارکرن ل ژێر (کویز 1)
          </span>
        </div>
      </div>

      {/* Export Custom Modal */}
      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirmExport={(opts) => onExportExcel(opts)}
        totalStudentsCount={students.length}
        gradedStudentsCount={students.filter((s) => computeStudentTotals(records[s.id]).grandTotal100 !== null).length}
        lang={lang}
      />

      {/* Confirmation Clear Modal */}
      <ConfirmClearModal
        isOpen={confirmTarget !== null}
        title="دوپاتکرنا مسحکرنا نمرەیان"
        message="ئایا تە دڤێت مسح کەین؟"
        subMessage={
          confirmTarget?.type === 'column'
            ? `ئایا تە دڤێت هەمی نمرەیێن ستوونا (${confirmTarget.title}) ژێببەی؟`
            : 'ئایا تە دڤێت هەمی نمرەیێن سجلا ڤێ پۆلێ مسح بکەی؟'
        }
        confirmLabel="بەڵێ"
        cancelLabel="نەخێر"
        onConfirm={handleConfirmClear}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
};
