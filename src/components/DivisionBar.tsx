import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Divide, 
  RotateCcw, 
  Sparkles, 
  Percent, 
  Sliders, 
  CheckCircle2,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';

interface DivisionBarProps {
  currentDivisor: number;
  currentRounding: 'round' | 'half' | 'ceil' | 'floor' | 'exact';
  onApplyDivision: (divisor: number, rounding: 'round' | 'half' | 'ceil' | 'floor' | 'exact', targetMax?: number) => void;
  onResetToOriginal: () => void;
  lang: Language;
  hasGrades: boolean;
}

export const DivisionBar: React.FC<DivisionBarProps> = ({
  currentDivisor,
  currentRounding,
  onApplyDivision,
  onResetToOriginal,
  lang,
  hasGrades,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  const [selectedDivisor, setSelectedDivisor] = useState<number>(currentDivisor || 1);
  const [customDivisorInput, setCustomDivisorInput] = useState<string>(
    currentDivisor && ![1, 2, 4, 5, 10].includes(currentDivisor) ? String(currentDivisor) : ''
  );
  const [rounding, setRounding] = useState<'round' | 'half' | 'ceil' | 'floor' | 'exact'>(currentRounding || 'half');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Common scaling presets
  const presets = [
    { label: '÷ 2', divisor: 2, desc: '100 ➔ 50 | 20 ➔ 10' },
    { label: '÷ 4', divisor: 4, desc: '100 ➔ 25 | 40 ➔ 10' },
    { label: '÷ 5', divisor: 5, desc: '100 ➔ 20 | 50 ➔ 10' },
    { label: '÷ 10', divisor: 10, desc: '100 ➔ 10' },
  ];

  const handleSelectPreset = (div: number) => {
    setSelectedDivisor(div);
    setCustomDivisorInput('');
    onApplyDivision(div, rounding);
  };

  const handleCustomApply = () => {
    const val = parseFloat(customDivisorInput);
    if (!isNaN(val) && val > 0) {
      setSelectedDivisor(val);
      onApplyDivision(val, rounding);
    }
  };

  const handleRoundingChange = (newRounding: 'round' | 'half' | 'ceil' | 'floor' | 'exact') => {
    setRounding(newRounding);
    if (selectedDivisor > 1) {
      onApplyDivision(selectedDivisor, newRounding);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-2xl border border-emerald-200/80 shadow-sm p-4 sm:p-5 mb-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Current Status */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
            <Divide className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {t('divideMarks')}
              </h3>
              {currentDivisor > 1 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {t('dividedNotice', { divisor: currentDivisor })}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ب ئێک کلیک نمرەیێن هەمی قوتابیان دابەشی هەر ژمارەکێ بکە، وەک دابەشکرن ل سەر 2، 4، 5، 10 یان ژمارەکا دی.
            </p>
          </div>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
            {t('quickDivide')}
          </span>

          {presets.map((preset) => {
            const isActive = currentDivisor === preset.divisor;
            return (
              <button
                key={preset.divisor}
                onClick={() => handleSelectPreset(preset.divisor)}
                disabled={!hasGrades}
                className={`group px-3.5 sm:px-4 py-2 rounded-xl font-black text-sm transition-all cursor-pointer flex flex-col items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/50 scale-102'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-200/90 hover:border-emerald-400'
                }`}
                title={preset.desc}
              >
                <span>{preset.label}</span>
                <span className={`text-[10px] font-medium leading-none mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {preset.desc.split('|')[0]}
                </span>
              </button>
            );
          })}

          {/* Reset button */}
          {currentDivisor > 1 && (
            <button
              onClick={onResetToOriginal}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
              title={t('resetMarks')}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('resetMarks')}</span>
            </button>
          )}

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer"
            title="ڕێکخستنێن زێدەتر یێن دابەشکرنێ"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Drawer: Custom Divisor & Rounding Rules */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-emerald-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Custom Divisor input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {t('customDivisor')} (مخصص)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ÷
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="مثال: 2.5 یان 8"
                  value={customDivisorInput}
                  onChange={(e) => setCustomDivisorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
                  className="w-full pr-8 pl-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!customDivisorInput}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                جێبەجێکرن
              </button>
            </div>
          </div>

          {/* Rounding Rule */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {t('roundingRule')}
            </label>
            <select
              value={rounding}
              onChange={(e) => handleRoundingChange(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="half">{t('roundHalf')} (موصى به: 14.5)</option>
              <option value="round">{t('roundInteger')} (سەدەقا تمام: 15)</option>
              <option value="ceil">کەرتێ بەرەف ژوور (Ceil: 14.2 ➔ 15)</option>
              <option value="two">دوو ژمارە (.00: 14.25)</option>
              <option value="exact">{t('roundExact')}</option>
            </select>
          </div>

          {/* Scaling quick info */}
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs text-slate-600 flex flex-col justify-center">
            <span className="font-bold text-slate-800 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              مەرەم ژ دابەشکرنێ:
            </span>
            <span>
              ئەگەر تاقیکرن ژ 100 بیت و تە بڤێت ژ 20 بگری، دابەشی <b>5</b> بکە.
            </span>
            <span>
              ئەگەر تاقیکرن ژ 40 بیت و تە بڤێت ژ 10 بگری، دابەشی <b>4</b> بکە.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
