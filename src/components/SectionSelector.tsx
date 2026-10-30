import React from 'react';
import { Grade, Section, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { Users, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';

interface SectionSelectorProps {
  grades: Grade[];
  sections: Section[];
  activeGradeId: string;
  activeSectionId: string;
  onSelectGrade: (gradeId: string) => void;
  onSelectSection: (sectionId: string) => void;
  lang: Language;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  grades,
  sections,
  activeGradeId,
  activeSectionId,
  onSelectGrade,
  onSelectSection,
  lang,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  const activeGrade = grades.find((g) => g.id === activeGradeId) || grades[0];
  const activeSections = sections.filter((s) => s.gradeId === activeGradeId);
  const activeSection = sections.find((s) => s.id === activeSectionId) || activeSections[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        {/* Stage / Grade Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-2">
            <Bookmark className="w-4 h-4 text-emerald-600" />
            {t('selectStage')}
          </span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
            {grades.map((grade) => {
              const isSelected = grade.id === activeGradeId;
              const gradeSecs = sections.filter((s) => s.gradeId === grade.id);
              const totalStudents = gradeSecs.reduce((acc, s) => acc + s.students.length, 0);

              let displayName = grade.name;
              if (displayName === '10') displayName = t('grade10');
              else if (displayName === 'الحادي عشر') displayName = t('grade11');
              else if (displayName === 'الثاني عشر') displayName = t('grade12');

              return (
                <button
                  key={grade.id}
                  onClick={() => onSelectGrade(grade.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-emerald-700 shadow-sm shadow-slate-200 ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{displayName}</span>
                  <span
                    className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {totalStudents}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section info indicator */}
        {activeSection && (
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70 self-start md:self-auto">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {t('stage')}: <b className="text-slate-900">{activeGrade?.name}</b>
            </span>
            <span className="text-slate-300">/</span>
            <span>
              {t('section')}: <b className="text-slate-900">{activeSection.label}</b>
            </span>
            <span className="text-slate-300">/</span>
            <span>
              <b className="text-emerald-700 font-bold">{activeSection.students.length}</b> {t('totalStudents')}
            </span>
          </div>
        )}
      </div>

      {/* Sections Chips */}
      <div className="mt-3.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">
          {t('selectSection')}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {activeSections.map((sec) => {
            const isSelected = sec.id === activeSectionId;
            return (
              <button
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`group relative px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-102 ring-2 ring-emerald-500/40'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-base font-extrabold">{t('section')} {sec.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isSelected
                      ? 'bg-emerald-700/80 text-white'
                      : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                  }`}
                >
                  {sec.students.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
