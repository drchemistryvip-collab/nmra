import React from 'react';
import { SchoolInfo, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  GraduationCap, 
  School, 
  User, 
  BookOpen, 
  Globe, 
  Layers, 
  FileSpreadsheet,
  Mic,
  Plus,
  Trash2,
  Cloud
} from 'lucide-react';

interface NavbarProps {
  schoolInfo: SchoolInfo;
  lang: Language;
  onToggleLang: () => void;
  onOpenClassManager: () => void;
  onOpenExamManager: () => void;
  onOpenVoiceModal: () => void;
  onOpenTrashModal?: () => void;
  onOpenGoogleSync?: () => void;
  trashCount?: number;
  currentExamTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  schoolInfo,
  lang,
  onToggleLang,
  onOpenClassManager,
  onOpenExamManager,
  onOpenVoiceModal,
  onOpenTrashModal,
  onOpenGoogleSync,
  trashCount = 0,
  currentExamTitle,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Titles */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{t('appTitle')}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AI Voice
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 sm:gap-3 flex-wrap mt-0.5">
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <School className="w-3.5 h-3.5 text-emerald-400" />
                  {schoolInfo.school}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                  {schoolInfo.teacher}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  {schoolInfo.subject}
                </span>
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Drive / Sheets Sync Button */}
            {onOpenGoogleSync && (
              <button
                onClick={onOpenGoogleSync}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-medium text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
                title="هەڤدەمسازیا Google Drive & Sheets"
              >
                <Cloud className="w-4 h-4 text-sky-400" />
                <span className="hidden xl:inline">Google Sync</span>
              </button>
            )}

            {/* Trash Bin / Cleared Marks Button */}
            {onOpenTrashModal && (
              <button
                onClick={onOpenTrashModal}
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-medium text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
                title="نمرەیێن ژێبری (سەلا زبڵێ)"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">سەلا زبڵێ</span>
                {trashCount > 0 && (
                  <span className="bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full ring-2 ring-slate-900">
                    {trashCount}
                  </span>
                )}
              </button>
            )}

            {/* Main Record Voice Trigger button */}
            <button
              onClick={onOpenVoiceModal}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-sm cursor-pointer"
              title={t('recordVoice')}
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="hidden md:inline">{t('recordVoice')}</span>
              <span className="md:hidden">تەسجیل</span>
            </button>

            {/* Current Exam Sheet Switcher */}
            <button
              onClick={onOpenExamManager}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="max-w-[120px] truncate">{currentExamTitle}</span>
            </button>

            {/* Manage Classes button */}
            <button
              onClick={onOpenClassManager}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
              title={t('manageClasses')}
            >
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <span className="hidden lg:inline">{t('manageClasses')}</span>
            </button>

            {/* Language toggle */}
            <button
              onClick={onToggleLang}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs active:scale-95 transition-all cursor-pointer"
              title="گۆڕینا زمانی / تغيير اللغة"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('changeLang')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

