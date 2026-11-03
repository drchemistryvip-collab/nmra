import React, { useState } from 'react';
import { Grade, Section, Student, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  X, 
  UserPlus, 
  Users, 
  Trash2, 
  Edit2, 
  Check, 
  Plus, 
  GraduationCap, 
  ClipboardPaste,
  ArrowRight
} from 'lucide-react';

interface ClassManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  grades: Grade[];
  sections: Section[];
  activeGradeId: string;
  activeSectionId: string;
  onAddStudent: (sectionId: string, studentName: string) => void;
  onDeleteStudent: (sectionId: string, studentId: string) => void;
  onBulkAddStudents: (sectionId: string, names: string[]) => void;
  onAddSection: (gradeId: string, label: string) => void;
    onAddGrade: (name: string) => void;
  onResetAllMarks: () => void;
  lang: Language;
}

export const ClassManagerModal: React.FC<ClassManagerModalProps> = ({
  isOpen,
  onClose,
  grades,
  sections,
  activeGradeId,
  activeSectionId,
  onAddStudent,
  onDeleteStudent,
  onBulkAddStudents,
  onAddSection,
  onAddGrade,
  onResetAllMarks,
  lang,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  const [selectedGradeId, setSelectedGradeId] = useState(activeGradeId);
  const [selectedSectionId, setSelectedSectionId] = useState(activeSectionId);
  const [newStudentName, setNewStudentName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newGradeName, setNewGradeName] = useState('');

  if (!isOpen) return null;

  const currentGrade = grades.find((g) => g.id === selectedGradeId) || grades[0];
  const gradeSections = sections.filter((s) => s.gradeId === selectedGradeId);
  const currentSection = sections.find((s) => s.id === selectedSectionId) || gradeSections[0];

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim() && currentSection) {
      onAddStudent(currentSection.id, newStudentName.trim());
      setNewStudentName('');
    }
  };

  const handleApplyBulk = () => {
    if (!currentSection || !bulkText.trim()) return;
    const lines = bulkText
      .split('\n')
      .map((l) => l.replace(/^\d+[\s.-]*/, '').trim())
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      onBulkAddStudents(currentSection.id, lines);
      setBulkText('');
      setShowBulk(false);
    }
  };

  const handleAddNewSection = () => {
    if (newSectionLabel.trim() && currentGrade) {
      onAddSection(currentGrade.id, newSectionLabel.trim());
      setNewSectionLabel('');
    }
  };

  const handleAddNewGrade = () => {
    if (newGradeName.trim()) {
      onAddGrade(newGradeName.trim());
      setNewGradeName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {t('manageClasses')}
              </h2>
              <p className="text-xs text-slate-500">
                زێدەکرن و گوهۆڕینا ناڤێن قوتابیان د هۆبەیان دا
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Stage selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              قۆناغێ هەلبژێرە:
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {grades.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGradeId(g.id);
                    const secs = sections.filter((s) => s.gradeId === g.id);
                    if (secs[0]) setSelectedSectionId(secs[0].id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    g.id === selectedGradeId
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500">
                هۆبەیێ هەلبژێرە:
              </label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {gradeSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSectionId(s.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                    s.id === selectedSectionId
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>هۆبا {s.label}</span>
                  <span className={`text-xs px-1.5 rounded-md ${s.id === selectedSectionId ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {s.students.length}
                  </span>
                </button>
              ))}

              {/* Add section inline */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="پیت (مثال: ح)"
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-center"
                />
                <button
                  onClick={handleAddNewSection}
                  disabled={!newSectionLabel.trim()}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  + هۆبە
                </button>
              </div>
            </div>
          </div>

          {/* Current Section's Student List */}
          {currentSection && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    قوتابیێن هۆبا {currentSection.label} ({currentSection.students.length} قوتابی)
                  </h3>
                </div>
                <button
                  onClick={() => setShowBulk(!showBulk)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>لکاندنا کومەڵ (Bulk)</span>
                </button>
              </div>

              {/* Bulk paste box */}
              {showBulk && (
                <div className="mb-4 p-3 bg-white rounded-xl border border-emerald-200 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    ناڤێن قوتابیان بلکێنە (هەر رێزەکێ ناڤەکی):
                  </label>
                  <textarea
                    rows={5}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="ئانیا حکیم محمد&#10;په‌ری بلند سعدي&#10;جوان ريبر محمد"
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setShowBulk(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500"
                    >
                      پاشگەزبوون
                    </button>
                    <button
                      onClick={handleApplyBulk}
                      className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                    >
                      زێدەکرن بۆ هۆبەیێ
                    </button>
                  </div>
                </div>
              )}

              {/* Single Add Student Form */}
              <form onSubmit={handleAddSingle} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder={t('studentNamePh')}
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newStudentName.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('addStudent')}</span>
                </button>
              </form>

              {/* Students List Scrollable */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {currentSection.students.map((st, i) => (
                  <div
                    key={st.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-slate-400 font-bold">
                        {i + 1}
                      </span>
                      <span className="font-bold text-slate-800">{st.name}</span>
                    </div>
                    <button
                      onClick={() => onDeleteStudent(currentSection.id, st.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="ژێبرنا ڤی قوتابی"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('ئایا تو پشت ڕاستی ژ سفرکرنا هەمی نمرەیێن هەمی قۆناغ و هۆبەیان؟ ئەڤ کارە ناهێتە زڤڕاندن (تەنێ د سەلا زبڵێ دا دێ مینیت).')) {
                onResetAllMarks();
              }
            }}
            className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>سفرکرنا هەمی نمرەیان</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            باشە / تمام
          </button>
        </div>
      </div>
    </div>
  );
};
