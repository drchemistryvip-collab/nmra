import React, { useState } from 'react';
import { ExcelExportOptions } from '../utils/excelExport';
import { Language } from '../types';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  Download, 
  CheckSquare, 
  Square, 
  Sparkles,
  Filter,
  Mic,
  ArrowUpDown,
  ListOrdered
} from 'lucide-react';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (options: ExcelExportOptions) => void;
  totalStudentsCount: number;
  gradedStudentsCount: number;
  lang: Language;
}

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  totalStudentsCount,
  gradedStudentsCount,
  lang,
}) => {
  // Default options
  const [options, setOptions] = useState<ExcelExportOptions>({
    includeSeq: true,
    includeName: true,
    includeOriginalMark: true,
    includeDivisor: false,
    includeFinalMark: true,
    includePercentage: false,
    includeStatus: false,
    includeNotes: false,
    filterRows: 'all',
    sortBy: 'voice',
  });

  if (!isOpen) return null;

  const toggleOption = (key: keyof ExcelExportOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Quick Preset Handlers
  const applyPresetMinimal = () => {
    // Only Name + Original Mark + Divided Mark + Seq
    setOptions({
      includeSeq: true,
      includeName: true,
      includeOriginalMark: true,
      includeDivisor: false,
      includeFinalMark: true,
      includePercentage: false,
      includeStatus: false,
      includeNotes: false,
      filterRows: options.filterRows,
    });
  };

  const applyPresetFinalOnly = () => {
    // Only Name + Divided Mark
    setOptions({
      includeSeq: true,
      includeName: true,
      includeOriginalMark: false,
      includeDivisor: false,
      includeFinalMark: true,
      includePercentage: false,
      includeStatus: false,
      includeNotes: false,
      filterRows: options.filterRows,
    });
  };

  const applyPresetAll = () => {
    // All columns
    setOptions({
      includeSeq: true,
      includeName: true,
      includeOriginalMark: true,
      includeDivisor: true,
      includeFinalMark: true,
      includePercentage: true,
      includeStatus: true,
      includeNotes: true,
      filterRows: options.filterRows,
    });
  };

  const handleExport = () => {
    onConfirmExport(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                دیارکرنا ستوونێن فایلا ئێکسل
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                ستوون و ڕێزێن تەت دڤێن ل فایلا ئێکسل دا داونلود بکە
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Quick Presets Bar */}
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              کۆمەلا شێوازێن ڕێکوپێک ب 1 کلیک:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={applyPresetMinimal}
                className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-black transition-all cursor-pointer text-center shadow-2xs"
              >
                تەنێ (ناڤ + نمرەیا سەرەکی + دابەشکری)
              </button>
              <button
                type="button"
                onClick={applyPresetFinalOnly}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer text-center"
              >
                تەنێ (ناڤ + نمرەیا دوماهیێ)
              </button>
              <button
                type="button"
                onClick={applyPresetAll}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer text-center"
              >
                سجلا تەمام (هەمی ستوون)
              </button>
            </div>
          </div>

          {/* Column Checkboxes Grid */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2.5">
              ستوونێن تە دڤێن د فایلا ئێکسل دا هەبن:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {/* Seq */}
              <label
                onClick={() => toggleOption('includeSeq')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includeSeq
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includeSeq ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>ژمارە (ت / #)</span>
              </label>

              {/* Name */}
              <label
                onClick={() => toggleOption('includeName')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includeName
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includeName ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>ناڤێ قوتابی</span>
              </label>

              {/* Original mark */}
              <label
                onClick={() => toggleOption('includeOriginalMark')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includeOriginalMark
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includeOriginalMark ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>نمرەیا سەرەکی</span>
              </label>

              {/* Divided mark */}
              <label
                onClick={() => toggleOption('includeFinalMark')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includeFinalMark
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includeFinalMark ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>نمرەیا دوماهیێ (دابەشکری)</span>
              </label>

              {/* Divisor */}
              <label
                onClick={() => toggleOption('includeDivisor')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includeDivisor
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includeDivisor ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>دابەشکرن (÷)</span>
              </label>

              {/* Percentage */}
              <label
                onClick={() => toggleOption('includePercentage')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includePercentage
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includePercentage ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>ڕێژە %</span>
              </label>

              {/* Status */}
              <label
                onClick={() => toggleOption('includeStatus')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includeStatus
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includeStatus ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>بارودۆخ (نایاب، کەفتی...)</span>
              </label>

              {/* Notes */}
              <label
                onClick={() => toggleOption('includeNotes')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                  options.includeNotes
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {options.includeNotes ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span>تێبینی</span>
              </label>
            </div>
          </div>

          {/* Sort Order Selector (Requested by user) */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
              ڕێزبەندیا ناڤان د فایلا ئێکسل دا (Sort Order):
            </span>
            <div className="grid grid-cols-2 gap-2 font-semibold text-xs text-slate-800">
              <label
                onClick={() => setOptions((prev) => ({ ...prev, sortBy: 'voice' }))}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all select-none ${
                  options.sortBy === 'voice' || !options.sortBy
                    ? 'bg-purple-50/80 border-purple-300 text-purple-950 font-black shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="sortBy"
                  checked={options.sortBy === 'voice' || !options.sortBy}
                  onChange={() => setOptions((prev) => ({ ...prev, sortBy: 'voice' }))}
                  className="accent-purple-600"
                />
                <Mic className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span>رێزبەندیا دەنگی (ئەوا د دەنگی دا خواندی)</span>
              </label>

              <label
                onClick={() => setOptions((prev) => ({ ...prev, sortBy: 'seq' }))}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all select-none ${
                  options.sortBy === 'seq'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-black shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="sortBy"
                  checked={options.sortBy === 'seq'}
                  onChange={() => setOptions((prev) => ({ ...prev, sortBy: 'seq' }))}
                  className="accent-emerald-600"
                />
                <ListOrdered className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>رێزبەندیا هۆبەیێ (1..2..)</span>
              </label>

              <label
                onClick={() => setOptions((prev) => ({ ...prev, sortBy: 'name' }))}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all select-none ${
                  options.sortBy === 'name'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-black shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="sortBy"
                  checked={options.sortBy === 'name'}
                  onChange={() => setOptions((prev) => ({ ...prev, sortBy: 'name' }))}
                  className="accent-emerald-600"
                />
                <span>ئەلفوبێ (أ - ي)</span>
              </label>

              <label
                onClick={() => setOptions((prev) => ({ ...prev, sortBy: 'original' }))}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all select-none ${
                  options.sortBy === 'original' || options.sortBy === 'final'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-black shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="sortBy"
                  checked={options.sortBy === 'original' || options.sortBy === 'final'}
                  onChange={() => setOptions((prev) => ({ ...prev, sortBy: 'original' }))}
                  className="accent-emerald-600"
                />
                <span>دویڤ نمرێ (ژ بەرزترین بۆ نزمترین)</span>
              </label>
            </div>
          </div>

          {/* Row Filter Select */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              دیارکرنا ڕێزێن قوتابیان بۆ دەرئینانێ:
            </span>
            <div className="flex items-center gap-3 font-semibold text-xs text-slate-800">
              <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="filterRows"
                  checked={options.filterRows === 'all'}
                  onChange={() => setOptions((prev) => ({ ...prev, filterRows: 'all' }))}
                  className="accent-emerald-600"
                />
                <span>هەمی قوتابیێن هۆبەیێ ({totalStudentsCount})</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="filterRows"
                  checked={options.filterRows === 'graded'}
                  onChange={() => setOptions((prev) => ({ ...prev, filterRows: 'graded' }))}
                  className="accent-emerald-600"
                />
                <span>تەنێ ئەوان ئۆ نمرە وەرگرتین ({gradedStudentsCount})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            پەشیمانبوونەوە
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>داونلودکرنا فایلا ئێکسل (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
