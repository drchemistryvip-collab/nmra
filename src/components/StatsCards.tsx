import React from 'react';
import { Student, ExamSheet, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { TrendingUp, Award, AlertTriangle, CheckCircle, Users } from 'lucide-react';

interface StatsCardsProps {
  students: Student[];
  exam: ExamSheet;
  lang: Language;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ students, exam, lang }) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  let sum = 0;
  let gradedCount = 0;
  let passedCount = 0;
  let max = -Infinity;
  let min = Infinity;

  const effectiveMax = exam.targetMax || (exam.maxScore / (exam.divisor || 1));

  students.forEach((student) => {
    const item = exam.grades[student.id];
    if (item && item.originalMark !== null) {
      const finalVal = item.dividedMark ?? (exam.divisor ? item.originalMark / exam.divisor : item.originalMark);
      if (finalVal !== null) {
        gradedCount++;
        sum += finalVal;
        if (finalVal > max) max = finalVal;
        if (finalVal < min) min = finalVal;
        const pct = (finalVal / effectiveMax) * 100;
        if (pct >= 50) passedCount++;
      }
    }
  });

  const avg = gradedCount > 0 ? (sum / gradedCount).toFixed(1) : '-';
  const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;
  const gradedPercentage = students.length > 0 ? Math.round((gradedCount / students.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-5">
      {/* Average Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('statAverage')}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-900">{avg}</span>
            <span className="text-xs text-slate-400 font-semibold">/ {effectiveMax}</span>
          </div>
        </div>
      </div>

      {/* Highest Score */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('statHighest')}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-emerald-700">
              {max !== -Infinity ? max : '-'}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ {effectiveMax}</span>
          </div>
        </div>
      </div>

      {/* Lowest Score */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('statLowest')}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-amber-700">
              {min !== Infinity ? min : '-'}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ {effectiveMax}</span>
          </div>
        </div>
      </div>

      {/* Pass Rate */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('statPassRate')}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-teal-700">{passRate}%</span>
            <span className="text-xs text-slate-400 font-semibold">({passedCount} قوتابی)</span>
          </div>
        </div>
      </div>

      {/* Graded Count */}
      <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">
            {t('statGradedCount')}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-900">{gradedCount}</span>
            <span className="text-xs text-slate-400 font-semibold">/ {students.length} ({gradedPercentage}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
