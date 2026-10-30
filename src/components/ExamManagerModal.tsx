import React, { useState } from 'react';
import { ExamSheet, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { Layers, Plus, Calendar, Check, Trash2, X } from 'lucide-react';

interface ExamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: ExamSheet[];
  currentExamId: string;
  onSelectExam: (examId: string) => void;
  onCreateExam: (title: string, maxScore: number, date: string) => void;
  onDeleteExam: (examId: string) => void;
  lang: Language;
}

export const ExamManagerModal: React.FC<ExamManagerModalProps> = ({
  isOpen,
  onClose,
  exams,
  currentExamId,
  onSelectExam,
  onCreateExam,
  onDeleteExam,
  lang,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  const [newTitle, setNewTitle] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateExam(newTitle.trim(), maxScore || 100, examDate);
    setNewTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {t('currentExam')}
              </h2>
              <p className="text-xs text-slate-500">
                هەلبژارتن یان دروستکرنا سەکۆیەکێ نوو یێ نمرەیان
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
          {/* Create New Exam Form */}
          <form onSubmit={handleCreate} className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
            <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>{t('newExam')}</span>
            </h3>

            <div>
              <input
                type="text"
                placeholder={t('examTitlePlaceholder')}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  نمرەیا مەزنترین (Max Score):
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  رێکەفت:
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>دروستکرن و دەستپێکرن</span>
            </button>
          </form>

          {/* Existing Saved Exam Sheets */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              تاقیکرنێن هەین یێن ڤێ هۆبەیێ:
            </label>
            <div className="space-y-2">
              {exams.map((ex) => {
                const isSelected = ex.id === currentExamId;
                const count = Object.values(ex.grades).filter((g) => g.originalMark !== null).length;

                return (
                  <div
                    key={ex.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectExam(ex.id);
                        onClose();
                      }}
                      className="flex-1 text-right flex items-center gap-3 cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {isSelected ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {ex.title}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{ex.date}</span>
                          <span>•</span>
                          <span>{count} قوتابی نمرە وەرگرتیە</span>
                          <span>•</span>
                          <span>نمرە: {ex.maxScore}</span>
                        </div>
                      </div>
                    </button>

                    {exams.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`ئەرێ تە دڤێت تاقیکرنا "${ex.title}" ژێببەی؟`)) {
                            onDeleteExam(ex.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-2 cursor-pointer"
                        title="ژێبرن"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl cursor-pointer"
          >
            گرتن
          </button>
        </div>
      </div>
    </div>
  );
};
