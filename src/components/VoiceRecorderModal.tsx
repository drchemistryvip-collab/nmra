import React, { useState, useEffect } from 'react';
import { Grade, Section, Student, Language, VoiceResponsePayload } from '../types';
import { getTranslation } from '../utils/translations';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Check, 
  AlertCircle, 
  X, 
  Volume2, 
  FileText, 
  ArrowRight,
  Info,
  Radio,
  Loader2,
  Download
} from 'lucide-react';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGrade: Grade;
  activeSection: Section;
  allGrades: Grade[];
  allSections: Section[];
  initialTargetField?: string;
  onApplyResults: (
    results: VoiceResponsePayload,
    detectedSectionId?: string,
    detectedGradeId?: string,
    targetField?: string,
    voiceDivisor?: number
  ) => void;
  lang: Language;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  activeGrade,
  activeSection,
  allGrades,
  allSections,
  initialTargetField,
  onApplyResults,
  lang,
}) => {
  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  const [activeTab, setActiveTab] = useState<'record' | 'text' | 'manual'>('record');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<VoiceResponsePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorder = useVoiceRecorder();

  const [targetField, setTargetField] = useState<string>(initialTargetField || 'quiz1_1');
  const [voiceDivisor, setVoiceDivisor] = useState<number>(1);

  // Manual direct table entry state: studentId -> mark
  const [manualMarks, setManualMarks] = useState<Record<string, number | null>>({});

  // Reset state when modal is opened/closed or target field changes
  useEffect(() => {
    if (!isOpen) {
      recorder.resetRecording();
      setAiResponse(null);
      setErrorMessage(null);
      setIsProcessing(false);
      setManualMarks({});
    } else {
      if (initialTargetField) {
        setTargetField(initialTargetField);
      }
    }
  }, [isOpen, initialTargetField]);

  if (!isOpen) return null;

  // Format recording timer: 00:00
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper to send audio to server
  const handleProcessVoice = async () => {
    if (!recorder.audioBase64) return;
    setIsProcessing(true);
    setErrorMessage(null);
    recorder.setProcessing();

    try {
      const candidateStudents = activeSection.students.map((s) => ({
        id: s.id,
        name: s.name,
        sectionId: activeSection.id,
        gradeId: activeGrade.id,
      }));

      const sectionsSummary = allSections.map((sec) => {
        const gr = allGrades.find((g) => g.id === sec.gradeId);
        return {
          id: sec.id,
          label: sec.label,
          gradeName: gr?.name || '',
          gradeId: sec.gradeId,
        };
      });

      let cleanBase64 = recorder.audioBase64;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,').pop() || cleanBase64;
      }
      cleanBase64 = cleanBase64.trim();

      const cleanMime = (recorder.mimeType || 'audio/webm').split(';')[0].trim();

      const res = await fetch('/api/process-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: cleanBase64,
          mimeType: cleanMime,
          activeSectionName: activeSection.label,
          activeGradeName: activeGrade.name,
          candidateStudents,
          allSections: sectionsSummary,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خەلەتیا راڤەکرنا دەنگی ب ژیرییا دەستکرد');
      }

      setAiResponse(json.data);
    } catch (err: any) {
      console.error('Failed to process voice:', err);
      setErrorMessage(err.message || 'خەلەتیەک چێبوو د دەمێ راڤەکرنا دەنگی دا. تکایە دووبارە بکەڤە.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process text prompt fallback
  const handleProcessText = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const candidateStudents = activeSection.students.map((s) => ({
        id: s.id,
        name: s.name,
      }));

      const sectionsSummary = allSections.map((sec) => {
        const gr = allGrades.find((g) => g.id === sec.gradeId);
        return {
          id: sec.id,
          label: sec.label,
          gradeName: gr?.name || '',
          gradeId: sec.gradeId,
        };
      });

      const res = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textInput,
          activeSectionName: activeSection.label,
          activeGradeName: activeGrade.name,
          candidateStudents,
          allSections: sectionsSummary,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خەلەتیا راڤەکرنا دەقی');
      }

      setAiResponse(json.data);
    } catch (err: any) {
      console.error('Failed to process text:', err);
      setErrorMessage(err.message || 'خەلەتیەک رویدا');
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit a mark directly in AI results list
  const handleUpdateAiResultMark = (index: number, newMark: number) => {
    if (!aiResponse) return;
    const updated = { ...aiResponse };
    updated.results = updated.results.map((r, i) => (i === index ? { ...r, mark: newMark } : r));
    setAiResponse(updated);
  };

  // Apply results to grade sheet (Send to Register)
  const handleConfirmApply = () => {
    if (!aiResponse) return;

    let targetSectionId = activeSection.id;
    let targetGradeId = activeGrade.id;

    // Check if voice specified another section/grade
    if (aiResponse.detectedSection) {
      const cleanLabel = aiResponse.detectedSection.replace(/شعبة|هۆبە|هۆبا/g, '').trim();
      const foundSec = allSections.find(
        (s) => s.label.trim() === cleanLabel || s.label.toLowerCase() === cleanLabel.toLowerCase()
      );
      if (foundSec) {
        targetSectionId = foundSec.id;
        targetGradeId = foundSec.gradeId;
      }
    }

    onApplyResults(aiResponse, targetSectionId, targetGradeId, targetField, voiceDivisor);
    onClose();
  };

  // Submit direct manual table entries (Send to Register)
  const handleConfirmManualTableSubmit = () => {
    const resultsPayload: VoiceResponsePayload = {
      transcript: 'داخلکرنا راستەوخۆ ب خشتەیێ',
      results: activeSection.students
        .filter((s) => manualMarks[s.id] !== undefined && manualMarks[s.id] !== null)
        .map((s, idx) => ({
          spokenName: s.name,
          matchedStudentId: s.id,
          matchedStudentName: s.name,
          mark: manualMarks[s.id]!,
          confidence: 1,
        })),
    };

    onApplyResults(resultsPayload, activeSection.id, activeGrade.id, targetField, voiceDivisor);
    onClose();
  };

  // Labels for target field dropdown
  const fieldLabels: Record<string, string> = {
    eval1: 'هەڵسەنگاندن 1 (2)',
    quiz1_1: 'کویز 1 - دەها ئێکێ (2)',
    quiz1_2: 'کویز 2 - دەها ئێکێ (2)',
    attend1: 'ئامادەبوون 1 (2)',
    clean1: 'پاکژی 1 (2)',
    midterm: 'ئەزموونا نیڤا وەرزی (20)',
    eval2: 'هەڵسەنگاندن 2 (3)',
    quiz2_1: 'کویز 1 - دەها دووێ (2)',
    quiz2_2: 'کویز 2 - دەها دووێ (2)',
    attend2: 'ئامادەبوون 2 (1)',
    clean2: 'پاکژی 2 (2)',
    finalExam: 'ئەزموونا دوماهیا سالێ (60)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                داخلکرنا نمرەیان ب دەنگی / نڤیسین
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                پۆلا {activeGrade.name} • هۆبا {activeSection.label} ({activeSection.students.length} قوتابی)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 pb-0 flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTab('record');
              setAiResponse(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'record'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>🎙️ تەسجیلکرنا دەنگی (AI)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('text');
              setAiResponse(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📝 نڤیسین یان لکاندنا دەقی</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('manual');
              setAiResponse(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>🔢 داخلکرنا راستەوخۆ ب خشتە</span>
          </button>

          <label className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>بارکرنا دەنگی</span>
            <input
              type="file"
              accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  recorder.loadAudioFile(f);
                  setActiveTab('record');
                  setAiResponse(null);
                  setErrorMessage(null);
                }
              }}
            />
          </label>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1">
          {/* UPFRONT REGISTER COLUMN & DIVISION SELECTOR BANNER */}
          <div className="bg-slate-900 text-white p-4.5 rounded-2xl mb-6 shadow-md border border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-emerald-300">1. دیارکرنا خانەیا سجلێ (Target Column):</span>
              </div>
              <select
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                className="bg-slate-800 text-emerald-300 font-extrabold text-xs rounded-xl px-3 py-2 border border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer max-w-full"
              >
                <optgroup label="دەها ئێکێ (کۆم: 10 نمرە)">
                  <option value="quiz1_1">کویز 1 - دەها ئێکێ (نمرەیا بلندا خانەیێ: 2)</option>
                  <option value="quiz1_2">کویز 2 - دەها ئێکێ (نمرەیا بلندا خانەیێ: 2)</option>
                  <option value="eval1">هەڵسەنگاندن 1 (نمرەیا بلندا خانەیێ: 2)</option>
                  <option value="attend1">ئامادەبوون 1 (نمرەیا بلندا خانەیێ: 2)</option>
                  <option value="clean1">پاکژی 1 (نمرەیا بلندا خانەیێ: 2)</option>
                </optgroup>
                <optgroup label="ئەزموونا نیڤا وەرزی (کۆم: 20 نمرە)">
                  <option value="midterm">ئەزموونا نیڤا وەرزی (20)</option>
                </optgroup>
                <optgroup label="دەها دووێ (کۆم: 10 نمرە)">
                  <option value="quiz2_1">کویز 1 - دەها دووێ (نمرەیا بلندا خانەیێ: 2)</option>
                  <option value="quiz2_2">کویز 2 - دەها دووێ (نمرەیا بلندا خانەیێ: 2)</option>
                  <option value="eval2">هەڵسەنگاندن 2 (نمرەیا بلندا خانەیێ: 3)</option>
                  <option value="attend2">ئامادەبوون 2 (نمرەیا بلندا خانەیێ: 1)</option>
                  <option value="clean2">پاکژی 2 (نمرەیا بلندا خانەیێ: 2)</option>
                </optgroup>
                <optgroup label="دوماهیا سالێ (کۆم: 60 نمرە)">
                  <option value="finalExam">ئەزموونا دوماهیا سالێ (60)</option>
                </optgroup>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-300">2. دابەشکرنا نمرەیێ (Division):</span>
                <span className="text-[11px] text-slate-300">(پشتی ئەنجامێ دوماهی دێ هنارتن بو سجلێ کەی)</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-300 font-bold">دابەشی:</span>
                {[1, 2, 3, 4, 5, 10].map((div) => (
                  <button
                    key={div}
                    type="button"
                    onClick={() => setVoiceDivisor(div)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      voiceDivisor === div
                        ? 'bg-emerald-500 text-slate-950 shadow-xs ring-2 ring-emerald-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    ÷ {div}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions box */}
          {!aiResponse && activeTab !== 'manual' && (
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 mb-6 text-xs sm:text-sm text-emerald-950 flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <b className="font-bold block mb-1">گۆتنا نمرەیان ب دەنگی بو خانەیا ({fieldLabels[targetField] || targetField}):</b>
                <p className="leading-relaxed mb-2">
                  ناڤێ قوتابی و نمرەیێ بێژە (بۆ نموونە: «ئالاء دوو و نیڤ، پەری چار...»). پشتی تەسجیلکرنێ دێ نمرە هێنە دابەشکرن و هەتا کلیکێ ل سەر دوگما <span className="font-black text-emerald-800">«هنارتن بو تۆمارا سجلێ»</span> بکەی ناچتە ناڤ سجلێ.
                </p>
              </div>
            </div>
          )}

          {/* Error Message Alert with fallbacks and audio download */}
          {(errorMessage || recorder.error) && (
            <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 mb-5 text-xs sm:text-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">
                  {errorMessage || recorder.error}
                </p>
              </div>
              {recorder.audioUrl && (
                <div className="pt-2 border-t border-red-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Volume2 className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <audio src={recorder.audioUrl} controls className="w-full sm:w-56 h-7" />
                  </div>
                  <a
                    href={recorder.audioUrl}
                    download={`تەسجیلا_دەنگی_${activeGrade.name}_${activeSection.label}_${new Date().toISOString().slice(0, 10)}.webm`}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>داونلودکرنا دەنگی (Download Audio)</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Voice Recording */}
          {activeTab === 'record' && !aiResponse && (
            <div className="flex flex-col items-center justify-center py-4">
              {/* Mic Icon & Visualizer Ring */}
              <div className="relative mb-6">
                {recorder.status === 'recording' && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"
                      style={{ transform: `scale(${1 + recorder.volumeLevel * 0.8})` }}
                    />
                    <div 
                      className="absolute -inset-4 rounded-full bg-red-400 opacity-15"
                      style={{ transform: `scale(${1 + recorder.volumeLevel * 0.5})` }}
                    />
                  </>
                )}

                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-xl ${
                    recorder.status === 'recording'
                      ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/40 ring-4 ring-red-400/40'
                      : recorder.status === 'paused'
                      ? 'bg-amber-500 text-white shadow-amber-500/30'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30 ring-4 ring-emerald-400/30'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 animate-spin" />
                  ) : recorder.status === 'recording' ? (
                    <Radio className="w-12 h-12 animate-pulse" />
                  ) : (
                    <Mic className="w-12 h-12" />
                  )}
                </div>
              </div>

              {/* Status & Timer */}
              <div className="text-center mb-6">
                <div className="text-3xl font-black text-slate-800 tracking-wider font-mono">
                  {formatTime(recorder.duration)}
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {isProcessing
                    ? t('processingAI')
                    : recorder.status === 'recording'
                    ? t('voiceListening')
                    : recorder.status === 'paused'
                    ? 'تەسجیل هاتە راگرتن ب دەمکی'
                    : recorder.status === 'done'
                    ? 'دەنگ هاتە تۆمارکرن. کلیکێ ل سەر راڤەکرنێ بکە'
                    : 'کلیک ل سەر دوگما کەسک بکە و دەست ب گۆتنا نمرەیان بکە'}
                </p>
              </div>

              {/* Audio Playback Preview & Download (if recorded) */}
              {recorder.audioUrl && !isProcessing && (
                <div className="w-full max-w-md bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-6 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <audio src={recorder.audioUrl} controls className="w-full h-8" />
                  </div>
                  <a
                    href={recorder.audioUrl}
                    download={`تەسجیلا_دەنگی_${activeGrade.name}_${activeSection.label}.webm`}
                    className="self-end px-3 py-1 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                    title="داونلودکرنا فایلا دەنگی یا تەسجیلکری"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>داونلودکرنا دەنگی (Download Audio)</span>
                  </a>
                </div>
              )}

              {/* Recorder Controls */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {recorder.status === 'idle' && (
                  <button
                    onClick={recorder.startRecording}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span>دەستپێکرنا تەسجیلێ</span>
                  </button>
                )}

                {recorder.status === 'recording' && (
                  <>
                    <button
                      onClick={recorder.pauseRecording}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>{t('pauseRecord')}</span>
                    </button>
                    <button
                      onClick={() => recorder.stopRecording()}
                      className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Square className="w-4 h-4" />
                      <span>ڕاگرتن و سەحکرن</span>
                    </button>
                  </>
                )}

                {recorder.status === 'paused' && (
                  <>
                    <button
                      onClick={recorder.resumeRecording}
                      className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>{t('resumeRecord')}</span>
                    </button>
                    <button
                      onClick={recorder.stopRecording}
                      className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Square className="w-4 h-4" />
                      <span>ڕاگرتن</span>
                    </button>
                  </>
                )}

                {recorder.status === 'done' && (
                  <>
                    <button
                      onClick={recorder.resetRecording}
                      disabled={isProcessing}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t('retakeVoice')}</span>
                    </button>
                    <button
                      onClick={handleProcessVoice}
                      disabled={isProcessing}
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('processingAI')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          <span>{t('stopRecord')} (AI)</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Text / Typing batch fallback */}
          {activeTab === 'text' && !aiResponse && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-700">
                دەقێ نمرەیان ل ڤێرە بنڤیسە یان بلکێنە:
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
                placeholder="بۆ نموونە:&#10;ئانیا حکیم 3.5&#10;په‌ری بلند 4&#10;جوان ريبر 2.5&#10;دعاء اسماعیل 4.5"
                className="w-full p-4 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
              />
              <button
                onClick={handleProcessText}
                disabled={!textInput.trim() || isProcessing}
                className="self-end px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>یا دهێتە راڤەکرن...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>راڤەکرن ب ژیرییا دەستکرد (AI)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: Direct Student Table Entry inside modal */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">
                  داخلکرنا راستەوخۆ یا نمرەیان بۆ خانەیا: <b className="text-emerald-700">{fieldLabels[targetField] || targetField}</b>
                </span>
                <span className="text-xs text-slate-500">
                  ژمارا قوتابیان: <b>{activeSection.students.length}</b>
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">ناڤێ قوتابی</th>
                      <th className="p-2.5 w-28 text-center">نمرەیا سەرەکی</th>
                      {voiceDivisor > 1 && (
                        <th className="p-2.5 w-28 text-center text-emerald-800">÷ {voiceDivisor} (ئەنجام)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSection.students.map((st, idx) => {
                      const origVal = manualMarks[st.id] ?? null;
                      const divVal = origVal !== null && voiceDivisor > 1 ? Number((origVal / voiceDivisor).toFixed(2)) : origVal;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-800">{st.name}</td>
                          <td className="p-1.5 text-center">
                            <input
                              type="number"
                              step="0.5"
                              value={origVal !== null ? origVal : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                setManualMarks((prev) => ({ ...prev, [st.id]: val }));
                              }}
                              placeholder="—"
                              className="w-20 p-1.5 text-center font-black rounded-lg border border-slate-300 focus:border-emerald-500 focus:bg-emerald-50 focus:outline-none"
                            />
                          </td>
                          {voiceDivisor > 1 && (
                            <td className="p-2 text-center font-black text-emerald-700 bg-emerald-50/50">
                              {divVal !== null ? divVal : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Confirm Send to Register for Manual Table Entry */}
              <div className="flex items-center justify-end pt-3">
                <button
                  type="button"
                  onClick={handleConfirmManualTableSubmit}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-5 h-5 text-emerald-200" />
                  <span>هنارتن بو تۆمارا سجلێ ( Send to Register )</span>
                </button>
              </div>
            </div>
          )}

          {/* AI RESULTS PREVIEW & CONFIRMATION */}
          {aiResponse && activeTab !== 'manual' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Audio Playback & Download Bar inside Results */}
              {recorder.audioUrl && (
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-slate-700">
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Volume2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <audio src={recorder.audioUrl} controls className="w-full sm:w-64 h-8" />
                  </div>
                  <a
                    href={recorder.audioUrl}
                    download={`تەسجیلا_دەنگی_${activeGrade.name}_${activeSection.label}_${new Date().toISOString().slice(0, 10)}.webm`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95"
                    title="داونلودکرنا فایلا دەنگی یا تەسجیلکری"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    <span>داونلودکرنا دەنگی (Download Recording)</span>
                  </a>
                </div>
              )}

              {/* Transcript */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    {t('transcriptLabel')}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                  {aiResponse.transcript || '—'}
                </p>
              </div>

              {/* Matches list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{t('recognizedCount', { count: aiResponse.results.length })} (تو دشێی لسەر نمرێ کلیک بکەی بۆ دەستکاریێ):</span>
                  </h4>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {aiResponse.results.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      چ ناڤێن قوتابیان د دەنگی دا نەهاتنە نیاسین.
                    </div>
                  ) : (
                    aiResponse.results.map((res, idx) => {
                      const finalDiv = voiceDivisor > 1 ? Number((res.mark / voiceDivisor).toFixed(2)) : res.mark;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs hover:border-emerald-300 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {res.matchedStudentName || res.spokenName}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-bold">نمرەیا گۆتی:</span>
                            <input
                              type="number"
                              step="0.5"
                              value={res.mark}
                              onChange={(e) => handleUpdateAiResultMark(idx, parseFloat(e.target.value) || 0)}
                              className="w-16 p-1 text-center font-black rounded border border-slate-300 focus:border-emerald-500 text-xs"
                            />
                            {voiceDivisor > 1 && (
                              <span className="text-xs text-emerald-700 font-extrabold">
                                ÷ {voiceDivisor} =
                              </span>
                            )}
                            <span className="text-sm font-black px-3 py-1 rounded-lg bg-emerald-600 text-white shadow-xs">
                              {finalDiv}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/80 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-sm transition-all cursor-pointer"
          >
            {t('cancelRecord')}
          </button>

          {aiResponse && activeTab !== 'manual' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiResponse(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('retakeVoice')}</span>
              </button>
              <button
                onClick={handleConfirmApply}
                disabled={!aiResponse.results.length}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Check className="w-5 h-5 text-emerald-200" />
                <span>هنارتن بو تۆمارا سجلێ ( Send to Register )</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

