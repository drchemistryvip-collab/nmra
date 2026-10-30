import React, { useState, useEffect } from 'react';
import { 
  Grade, 
  Section, 
  Student, 
  ExamSheet, 
  GradeItem, 
  SchoolInfo, 
  Language, 
  VoiceResponsePayload,
  Grade10Record,
  Grade10ColumnKey,
  ClearedRecordTrashItem
} from './types';
import { initialGrades, initialSections, initialSchoolInfo } from './data/initialData';
import { Navbar } from './components/Navbar';
import { SectionSelector } from './components/SectionSelector';
import { DivisionBar } from './components/DivisionBar';
import { StatsCards } from './components/StatsCards';
import { ExcelTable } from './components/ExcelTable';
import { Grade10RegisterTable } from './components/Grade10RegisterTable';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { MicPermissionBanner } from './components/MicPermissionBanner';
import { ClassManagerModal } from './components/ClassManagerModal';
import { ExamManagerModal } from './components/ExamManagerModal';
import { TrashBinModal } from './components/TrashBinModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { googleSyncService, SyncDataPayload } from './services/googleSyncService';
import { 
  exportExamToExcel, 
  exportGrade10RegisterToExcel, 
  copyTableToClipboard, 
  parseExcelFileToGrades, 
  ExcelExportOptions 
} from './utils/excelExport';
import { getTranslation } from './utils/translations';
import { 
  CheckCircle2, 
  FileSpreadsheet, 
  Sparkles, 
  Printer, 
  RotateCcw,
  Volume2
} from 'lucide-react';

const STORAGE_KEY_SECTIONS = 'voice_gradebook_sections_v2';
const STORAGE_KEY_GRADES = 'voice_gradebook_grades_v2';
const STORAGE_KEY_INFO = 'voice_gradebook_info_v2';
const STORAGE_KEY_EXAMS = 'voice_gradebook_exams_v2';
const STORAGE_KEY_ACTIVE = 'voice_gradebook_active_v2';
const STORAGE_KEY_LANG = 'voice_gradebook_lang_v2';
const STORAGE_KEY_GRADE10_RECS = 'voice_gradebook_g10_records_v1';
const STORAGE_KEY_TRASH = 'voice_gradebook_trash_v1';

export default function App() {
  // Languages
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEY_LANG) as Language) || 'ku';
  });

  const t = (key: any, params?: any) => getTranslation(lang, key, params);

  // School & Teacher Info
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.teacher || parsed.teacher.includes('شاكر')) {
          parsed.teacher = 'هاریکار ژ لایێ خودایێ مەزن ڤە';
        }
        return parsed;
      }
      return initialSchoolInfo;
    } catch {
      return initialSchoolInfo;
    }
  });

  // Grades (Stages)
  const [grades, setGrades] = useState<Grade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GRADES);
      return saved ? JSON.parse(saved) : initialGrades;
    } catch {
      return initialGrades;
    }
  });

  // Sections
  const [sections, setSections] = useState<Section[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SECTIONS);
      return saved ? JSON.parse(saved) : initialSections;
    } catch {
      return initialSections;
    }
  });

  // Active Grade & Section IDs
  const [activeGradeId, setActiveGradeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gradeId) return parsed.gradeId;
      }
    } catch {}
    return grades[2]?.id || grades[0]?.id || '';
  });

  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sectionId) return parsed.sectionId;
      }
    } catch {}
    const firstSec = sections.find((s) => s.gradeId === activeGradeId);
    return firstSec?.id || sections[0]?.id || '';
  });

  // Mode View toggle: 'g10_register' (Full 100 mark sheet) or 'single_exam' (Single Exam Sheet)
  const [viewMode, setViewMode] = useState<'g10_register' | 'single_exam'>('g10_register');
  const [selectedRegisterColumnKey, setSelectedRegisterColumnKey] = useState<Grade10ColumnKey>('quiz1_1');

  // Column limits and titles
  const fieldMaxes: Record<Grade10ColumnKey, number> = {
    eval1: 2, quiz1_1: 2, quiz1_2: 2, attend1: 2, clean1: 2,
    midterm: 20,
    eval2: 3, quiz2_1: 2, quiz2_2: 2, attend2: 1, clean2: 2,
    finalExam: 60,
  };

  const fieldTitles: Record<Grade10ColumnKey, string> = {
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

  // Default initial records for Grade 10-B (smux13l99qu78k) so student quiz marks are preserved
  const defaultG10BRecords: Record<string, Grade10Record> = {
    'mux19y2tk9m8a': { eval1: null, quiz1_1: 4, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
    'mux19y2towpkl': { eval1: null, quiz1_1: 2, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
    'mux19y2t5tna5': { eval1: null, quiz1_1: 2, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
    'mux19y2tvb676': { eval1: null, quiz1_1: 2.5, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
    'mux19y2t6x9of': { eval1: null, quiz1_1: 3, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
    'mux19y2tnom6a': { eval1: null, quiz1_1: 1, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
    'mux19y2ti0tyi': { eval1: null, quiz1_1: 0, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
    'mux19y2tov11s': { eval1: null, quiz1_1: 2, quiz1_2: null, attend1: null, clean1: null, midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null, notes: '', updatedAt: new Date().toISOString() },
  };

  // Grade 10 Multi-column Records (sectionId -> studentId -> Grade10Record)
  const [grade10Records, setGrade10Records] = useState<Record<string, Record<string, Grade10Record>>>(() => {
    const baseRecs: Record<string, Record<string, Grade10Record>> = {
      'smux13l99qu78k': defaultG10BRecords,
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GRADE10_RECS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged10B = { ...defaultG10BRecords, ...(parsed['smux13l99qu78k'] || {}) };
        Object.keys(defaultG10BRecords).forEach((stId) => {
          if (!merged10B[stId] || merged10B[stId].quiz1_1 === null || merged10B[stId].quiz1_1 === undefined) {
            merged10B[stId] = { ...merged10B[stId], quiz1_1: defaultG10BRecords[stId].quiz1_1 };
          }
        });
        return { ...parsed, 'smux13l99qu78k': merged10B };
      }
    } catch {}
    return baseRecs;
  });

  // Exams / Sheets
  const [exams, setExams] = useState<ExamSheet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXAMS);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default sample exam for initial setup
    const defaultExam: ExamSheet = {
      id: 'exam_default_1',
      title: 'تاقیکرنا مەهانە (کویز)',
      date: new Date().toISOString().slice(0, 10),
      gradeId: grades[2]?.id || grades[0]?.id || '',
      sectionId: sections[0]?.id || '',
      maxScore: 100,
      divisor: 1,
      rounding: 'half',
      grades: {},
      createdAt: new Date().toISOString(),
    };
    return [defaultExam];
  });

  const [currentExamId, setCurrentExamId] = useState<string>(() => {
    return exams[0]?.id || 'exam_default_1';
  });

  // Trash Bin State (Cleared marks snapshot list)
  const [trashItems, setTrashItems] = useState<ClearedRecordTrashItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRASH);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceModalTargetField, setVoiceModalTargetField] = useState<Grade10ColumnKey>('quiz1_1');
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [isExamManagerOpen, setIsExamManagerOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Sync Payloads and Handlers
  const handleGetSyncPayload = (): SyncDataPayload => {
    return {
      schoolInfo,
      grades,
      sections,
      examSheets: exams,
      grade10Records,
      trashItems,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleRestoreFromGoogleDrive = (payload: SyncDataPayload) => {
    if (payload.schoolInfo) setSchoolInfo(payload.schoolInfo);
    if (payload.grades) setGrades(payload.grades);
    if (payload.sections) setSections(payload.sections);
    if (payload.examSheets) setExams(payload.examSheets);
    if (payload.grade10Records) setGrade10Records(payload.grade10Records);
    if (payload.trashItems) setTrashItems(payload.trashItems);
    showToast('داتایێن سجمێ ب سەرکەفتن ژ Google Drive هاتنە زڤڕاندن!');
  };

  const handleExportGoogleSheets = async (): Promise<string> => {
    const sheetTitle = `سجلا نمران - ${schoolInfo.school || 'قوتابخانە'} - ${schoolInfo.teacher || 'مامۆستا'}`;
    const headers = [
      'ژمارە',
      'ناڤێ چواریا قوتابی',
      'هەڵسەنگاندن (2)',
      'کویز 1 (2)',
      'کویز 2 (2)',
      'ئامادەبوون (2)',
      'پاکژی (2)',
      'کۆم (10)',
      'ئەزموونا نیڤا وەرزی (20)',
      'هەڵسەنگاندن 2 (3)',
      'کویز 1 (2)',
      'کویز 2 (2)',
      'ئامادەبوون 2 (1)',
      'پاکژی 2 (2)',
      'کۆم (10)',
      'ئەزموونا دوماهیا سالێ (60)',
      'نمرەیا گشتی (100)',
    ];

    const currentStudents = activeSection ? activeSection.students : [];
    const secRecords = activeSectionId ? (grade10Records[activeSectionId] || {}) : {};
    const rows: (string | number)[][] = currentStudents.map((student, idx) => {
      const rec: Grade10Record = secRecords[student.id] || {
        eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
        midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null,
        clean2: null, finalExam: null
      };
      const sum1 = (rec.eval1 || 0) + (rec.quiz1_1 || 0) + (rec.quiz1_2 || 0) + (rec.attend1 || 0) + (rec.clean1 || 0);
      const sum2 = (rec.eval2 || 0) + (rec.quiz2_1 || 0) + (rec.quiz2_2 || 0) + (rec.attend2 || 0) + (rec.clean2 || 0);
      const total = sum1 + (rec.midterm || 0) + sum2 + (rec.finalExam || 0);

      return [
        idx + 1,
        student.name,
        rec.eval1 ?? '-',
        rec.quiz1_1 ?? '-',
        rec.quiz1_2 ?? '-',
        rec.attend1 ?? '-',
        rec.clean1 ?? '-',
        sum1,
        rec.midterm ?? '-',
        rec.eval2 ?? '-',
        rec.quiz2_1 ?? '-',
        rec.quiz2_2 ?? '-',
        rec.attend2 ?? '-',
        rec.clean2 ?? '-',
        sum2,
        rec.finalExam ?? '-',
        total,
      ];
    });

    const result = await googleSyncService.createOrUpdateGoogleSheet(sheetTitle, headers, rows);
    return result.spreadsheetUrl;
  };

  const handleOpenVoiceModalForColumn = (colKey?: Grade10ColumnKey) => {
    if (colKey) {
      setVoiceModalTargetField(colKey);
    }
    setIsVoiceModalOpen(true);
  };

  // Current selected objects
  const activeGrade = grades.find((g) => g.id === activeGradeId) || grades[0];
  const activeSections = sections.filter((s) => s.gradeId === activeGradeId);
  const activeSection = sections.find((s) => s.id === activeSectionId) || activeSections[0] || sections[0];

  // Current active exam sheet
  const currentExam: ExamSheet =
    exams.find((e) => e.id === currentExamId) ||
    exams[0] || {
      id: 'fallback',
      title: 'تاقیکرن',
      date: new Date().toISOString().slice(0, 10),
      gradeId: activeGradeId,
      sectionId: activeSectionId,
      maxScore: 100,
      divisor: 1,
      rounding: 'half',
      grades: {},
      createdAt: new Date().toISOString(),
    };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, lang);
    document.documentElement.lang = lang === 'ku' ? 'ckb' : 'ar';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INFO, JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GRADES, JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GRADE10_RECS, JSON.stringify(grade10Records));
  }, [grade10Records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRASH, JSON.stringify(trashItems));
  }, [trashItems]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_ACTIVE,
      JSON.stringify({ gradeId: activeGradeId, sectionId: activeSectionId })
    );
  }, [activeGradeId, activeSectionId]);

  // Auto-sync existing exam marks into Grade 10 quiz1_1 field so no student mark is lost!
  useEffect(() => {
    if (!activeSection) return;
    const isG10 = activeGrade?.name === '10' || activeGrade?.id === 'g10' || activeGrade?.id === 'gmux13l994lazg';
    if (!isG10) return;

    // Only sync if currentExam belongs to this active section
    if (currentExam.sectionId && currentExam.sectionId !== activeSection.id) return;

    setGrade10Records((prev) => {
      const secRecs = { ...(prev[activeSection.id] || {}) };
      let changed = false;

      activeSection.students.forEach((s) => {
        const existingExamGrade = currentExam.grades[s.id];
        const existingRec = secRecs[s.id];

        if (
          existingExamGrade &&
          existingExamGrade.originalMark !== null &&
          (!existingRec || existingRec.quiz1_1 === null || existingRec.quiz1_1 === undefined)
        ) {
          secRecs[s.id] = {
            eval1: existingRec?.eval1 ?? null,
            quiz1_1: existingExamGrade.originalMark,
            quiz1_2: existingRec?.quiz1_2 ?? null,
            attend1: existingRec?.attend1 ?? null,
            clean1: existingRec?.clean1 ?? null,
            midterm: existingRec?.midterm ?? null,
            eval2: existingRec?.eval2 ?? null,
            quiz2_1: existingRec?.quiz2_1 ?? null,
            quiz2_2: existingRec?.quiz2_2 ?? null,
            attend2: existingRec?.attend2 ?? null,
            clean2: existingRec?.clean2 ?? null,
            finalExam: existingRec?.finalExam ?? null,
            notes: existingRec?.notes || existingExamGrade.notes || '',
            spokenOrder: existingRec?.spokenOrder || existingExamGrade.spokenOrder,
            updatedAt: new Date().toISOString(),
          };
          changed = true;
        }
      });

      if (changed) {
        return { ...prev, [activeSection.id]: secRecs };
      }
      return prev;
    });
  }, [activeSectionId, currentExam]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Switch to single column exam view pre-populated with existing column records
  const handleSelectColumnForExam = (colKey: Grade10ColumnKey) => {
    setSelectedRegisterColumnKey(colKey);
    setVoiceModalTargetField(colKey);

    const maxVal = fieldMaxes[colKey] || 100;
    const titleStr = fieldTitles[colKey] || colKey;

    if (activeSection) {
      const secRecs = grade10Records[activeSection.id] || {};
      const newExamGrades: Record<string, GradeItem> = {};

      activeSection.students.forEach((s) => {
        const rec = secRecs[s.id];
        const val = rec ? rec[colKey] : null;
        if (val !== null && val !== undefined) {
          newExamGrades[s.id] = {
            studentId: s.id,
            originalMark: val,
            dividedMark: val,
            notes: rec?.notes || '',
            spokenOrder: rec?.spokenOrder,
            source: 'manual',
            updatedAt: new Date().toISOString(),
          };
        }
      });

      setExams((prev) =>
        prev.map((ex) => {
          if (ex.id !== currentExam.id) return ex;
          return {
            ...ex,
            title: titleStr,
            maxScore: maxVal,
            divisor: 1,
            grades: newExamGrades,
          };
        })
      );
    }

    setViewMode('single_exam');
  };

  // Send marks from single exam sheet back to main register column
  const handleSendToMainRegister = (colKey: Grade10ColumnKey) => {
    if (!activeSection) return;

    setGrade10Records((prev) => {
      const secRecs = { ...(prev[activeSection.id] || {}) };
      let count = 0;

      activeSection.students.forEach((s) => {
        const item = currentExam.grades[s.id];
        if (item && item.originalMark !== null) {
          const finalVal = item.dividedMark !== null && item.dividedMark !== undefined
            ? item.dividedMark
            : (currentExam.divisor && currentExam.divisor > 1
                ? computeDivided(item.originalMark, currentExam.divisor, currentExam.rounding || 'half')
                : item.originalMark);

          const existing = secRecs[s.id] || {
            eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
            midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null,
            finalExam: null,
          };

          secRecs[s.id] = {
            ...existing,
            [colKey]: finalVal,
            notes: item.notes || existing.notes || '',
            spokenOrder: item.spokenOrder || existing.spokenOrder,
            updatedAt: new Date().toISOString(),
          };
          count++;
        }
      });

      return { ...prev, [activeSection.id]: secRecs };
    });

    const titleStr = fieldTitles[colKey] || colKey;
    showToast(`✓ نمرە ب سەرکەفتن هاتنە هنارتن بۆ تۆمارا سەرەکی د خانەیا (${titleStr}) دا`);
    setViewMode('g10_register');
  };

  // Helper to compute divided mark according to rounding rules
  const computeDivided = (
    originalMark: number | null,
    divisor: number,
    rounding: 'round' | 'half' | 'ceil' | 'floor' | 'exact'
  ): number | null => {
    if (originalMark === null) return null;
    if (!divisor || divisor <= 1) return originalMark;

    const raw = originalMark / divisor;
    if (rounding === 'round') return Math.round(raw);
    if (rounding === 'half') return Math.round(raw * 2) / 2;
    if (rounding === 'ceil') return Math.ceil(raw);
    if (rounding === 'floor') return Math.floor(raw);
    return Math.round(raw * 100) / 100;
  };

  // 1-Click Divide marks across active exam
  const handleApplyDivision = (
    divisor: number,
    rounding: 'round' | 'half' | 'ceil' | 'floor' | 'exact' = 'half'
  ) => {
    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id !== currentExam.id) return ex;

        const updatedGrades = { ...ex.grades };
        Object.keys(updatedGrades).forEach((stId) => {
          const item = updatedGrades[stId];
          if (item && item.originalMark !== null) {
            updatedGrades[stId] = {
              ...item,
              dividedMark: computeDivided(item.originalMark, divisor, rounding),
              updatedAt: new Date().toISOString(),
            };
          }
        });

        return {
          ...ex,
          divisor,
          rounding,
          grades: updatedGrades,
        };
      })
    );

    // Sync divided marks to Grade 10 Register if in active section
    if (activeSectionId) {
      setGrade10Records((prev) => {
        const secRecs = { ...(prev[activeSectionId] || {}) };
        Object.keys(currentExam.grades).forEach((stId) => {
          const item = currentExam.grades[stId];
          if (item && item.originalMark !== null) {
            const divMark = computeDivided(item.originalMark, divisor, rounding);
            const existing = secRecs[stId] || {
              eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
              midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null,
            };
            secRecs[stId] = {
              ...existing,
              quiz1_1: divMark ?? item.originalMark,
              updatedAt: new Date().toISOString(),
            };
          }
        });
        return { ...prev, [activeSectionId]: secRecs };
      });
    }

    showToast(t('dividedNotice', { divisor }));
  };

  // Reset to original marks
  const handleResetToOriginal = () => {
    handleApplyDivision(1, 'exact');
  };

  // Update a single student mark in the exam table
  const handleUpdateMark = (studentId: string, originalMark: number | null, notes?: string) => {
    let computedDiv: number | null = null;
    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id !== currentExam.id) return ex;

        const existing = ex.grades[studentId];
        const dividedMark = computeDivided(originalMark, ex.divisor || 1, ex.rounding || 'half');
        computedDiv = dividedMark;

        return {
          ...ex,
          grades: {
            ...ex.grades,
            [studentId]: {
              studentId,
              originalMark,
              dividedMark,
              notes: notes !== undefined ? notes : existing?.notes || '',
              source: existing?.source || 'manual',
              updatedAt: new Date().toISOString(),
            },
          },
        };
      })
    );

    // Also sync to quiz1_1 in Grade 10 Register if in Grade 10
    if (activeSectionId && originalMark !== null) {
      setGrade10Records((prev) => {
        const secRecs = { ...(prev[activeSectionId] || {}) };
        const existing = secRecs[studentId] || {
          eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
          midterm: null,
          eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null,
          finalExam: null,
        };

        const finalMarkForRegister = currentExam.divisor && currentExam.divisor > 1
          ? computeDivided(originalMark, currentExam.divisor, currentExam.rounding || 'half')
          : originalMark;

        secRecs[studentId] = {
          ...existing,
          quiz1_1: finalMarkForRegister,
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, [activeSectionId]: secRecs };
      });
    }
  };

  // Update Grade 10 field directly
  const handleUpdateGrade10Field = (
    studentId: string,
    field: Grade10ColumnKey,
    value: number | null,
    notes?: string
  ) => {
    if (!activeSectionId) return;
    setGrade10Records((prev) => {
      const secRecs = { ...(prev[activeSectionId] || {}) };
      const existing = secRecs[studentId] || {
        eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
        midterm: null,
        eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null,
        finalExam: null,
      };

      secRecs[studentId] = {
        ...existing,
        [field]: value,
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: new Date().toISOString(),
      };

      return { ...prev, [activeSectionId]: secRecs };
    });
  };

  // Clear column records for active section in Grade 10 Register
  const handleClearGrade10ColumnRecords = (field: Grade10ColumnKey) => {
    if (!activeSectionId) return;

    const currentSecRecs = grade10Records[activeSectionId] || {};
    const snapshot: Record<string, Grade10Record> = {};
    let count = 0;

    Object.keys(currentSecRecs).forEach((stId) => {
      const rec = currentSecRecs[stId];
      if (rec && rec[field] !== null && rec[field] !== undefined) {
        snapshot[stId] = { ...rec };
        count++;
      }
    });

    if (count > 0) {
      const titleStr = fieldTitles[field] || field;
      const trashItem: ClearedRecordTrashItem = {
        id: 'trash_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        title: `نمرەیێن (${titleStr})`,
        type: 'g10_column',
        sectionId: activeSectionId,
        sectionName: activeSection?.label || '',
        columnKey: field,
        columnTitle: titleStr,
        grade10RecordsSnapshot: snapshot,
        studentCount: count,
      };
      setTrashItems((prev) => [trashItem, ...prev]);
    }

    setGrade10Records((prev) => {
      const secRecs = { ...(prev[activeSectionId] || {}) };
      Object.keys(secRecs).forEach((stId) => {
        if (secRecs[stId]) {
          secRecs[stId] = {
            ...secRecs[stId],
            [field]: null,
            updatedAt: new Date().toISOString(),
          };
        }
      });
      return { ...prev, [activeSectionId]: secRecs };
    });
    const titleStr = fieldTitles[field] || field;
    showToast(`✓ هەمی نمرەیێن ستوونا (${titleStr}) هاتنە مسحکرن و ناردن بۆ سەلا زبڵێ`);
  };

  // Clear marks for active section in Grade 10 Register
  const handleClearGrade10SectionRecords = () => {
    if (!activeSectionId) return;

    const currentSecRecs = grade10Records[activeSectionId] || {};
    const count = Object.keys(currentSecRecs).filter((stId) => {
      const r = currentSecRecs[stId];
      return r && Object.values(r).some((v) => typeof v === 'number' && v !== null);
    }).length;

    if (count > 0) {
      const trashItem: ClearedRecordTrashItem = {
        id: 'trash_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        title: `سجلا هەمی نمرەیێن ${activeSection?.label || 'هۆبێ'}`,
        type: 'g10_section',
        sectionId: activeSectionId,
        sectionName: activeSection?.label || '',
        grade10RecordsSnapshot: currentSecRecs,
        studentCount: count,
      };
      setTrashItems((prev) => [trashItem, ...prev]);
    }

    setGrade10Records((prev) => {
      const copy = { ...prev };
      delete copy[activeSectionId];
      return copy;
    });

    showToast('هەمی نمرەیێن سجلا پۆلا 10 پاککرن و ناردن بۆ سەلا زبڵێ');
  };

  // Clear all marks for active section in single exam
  const handleClearMarks = () => {
    const count = Object.keys(currentExam.grades).length;

    if (count > 0) {
      const trashItem: ClearedRecordTrashItem = {
        id: 'trash_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        title: `تاقیکرنا (${currentExam.title})`,
        type: 'single_exam',
        sectionId: activeSectionId,
        sectionName: activeSection?.label || '',
        examId: currentExam.id,
        examTitle: currentExam.title,
        examGradesSnapshot: currentExam.grades,
        studentCount: count,
      };
      setTrashItems((prev) => [trashItem, ...prev]);
    }

    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id !== currentExam.id) return ex;

        const updatedGrades = { ...ex.grades };
        if (activeSection) {
          activeSection.students.forEach((s) => {
            delete updatedGrades[s.id];
          });
        }

        return {
          ...ex,
          grades: updatedGrades,
        };
      })
    );

    showToast('هەمی نمرە هاتنە پاککرن و ناردن بۆ سەلا زبڵێ');
  };

  // Restore item from Trash Bin back to main register or exam sheet
  const handleRestoreTrashItem = (item: ClearedRecordTrashItem) => {
    if (item.type === 'g10_column' && item.columnKey && item.grade10RecordsSnapshot) {
      const colKey = item.columnKey;
      setGrade10Records((prev) => {
        const secRecs = { ...(prev[item.sectionId] || {}) };
        Object.keys(item.grade10RecordsSnapshot!).forEach((stId) => {
          const snapshotRec = item.grade10RecordsSnapshot![stId];
          const val = snapshotRec ? snapshotRec[colKey] : null;
          if (val !== null && val !== undefined) {
            secRecs[stId] = {
              ...secRecs[stId],
              [colKey]: val,
              notes: snapshotRec.notes || secRecs[stId]?.notes || '',
              updatedAt: new Date().toISOString(),
            };
          }
        });
        return { ...prev, [item.sectionId]: secRecs };
      });
    } else if (item.type === 'g10_section' && item.grade10RecordsSnapshot) {
      setGrade10Records((prev) => {
        const secRecs = { ...(prev[item.sectionId] || {}) };
        Object.keys(item.grade10RecordsSnapshot!).forEach((stId) => {
          secRecs[stId] = {
            ...secRecs[stId],
            ...item.grade10RecordsSnapshot![stId],
            updatedAt: new Date().toISOString(),
          };
        });
        return { ...prev, [item.sectionId]: secRecs };
      });
    } else if (item.type === 'single_exam' && item.examId && item.examGradesSnapshot) {
      setExams((prev) =>
        prev.map((ex) => {
          if (ex.id !== item.examId) return ex;
          return {
            ...ex,
            grades: {
              ...ex.grades,
              ...item.examGradesSnapshot,
            },
          };
        })
      );
      if (item.sectionId) {
        setGrade10Records((prev) => {
          const secRecs = { ...(prev[item.sectionId] || {}) };
          Object.keys(item.examGradesSnapshot!).forEach((stId) => {
            const gi = item.examGradesSnapshot![stId];
            if (gi && gi.originalMark !== null) {
              const existing = secRecs[stId] || {
                eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
                midterm: null, eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null, finalExam: null,
              };
              secRecs[stId] = {
                ...existing,
                quiz1_1: gi.dividedMark ?? gi.originalMark,
                updatedAt: new Date().toISOString(),
              };
            }
          });
          return { ...prev, [item.sectionId]: secRecs };
        });
      }
    }

    setTrashItems((prev) => prev.filter((t) => t.id !== item.id));
    showToast(`✓ (${item.title}) ب سەرکەفتن هاتە زڤڕاندن بۆ سەر سجلێ`);
  };

  const handleDeleteTrashItem = (id: string) => {
    setTrashItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllTrash = () => {
    setTrashItems([]);
    showToast('سەلا زبڵێ ب تەمامی هاتە پاقژکرن');
  };

  // Apply voice recognition results from AI
  const handleApplyVoiceResults = (
    payload: VoiceResponsePayload,
    detectedSectionId?: string,
    detectedGradeId?: string,
    targetField: string = 'quiz1_1',
    voiceDivisor: number = 1
  ) => {
    const targetSectionId = detectedSectionId || activeSectionId;
    const targetGradeId = detectedGradeId || activeGradeId;

    if (targetSectionId !== activeSectionId) {
      setActiveGradeId(targetGradeId);
      setActiveSectionId(targetSectionId);
    }

    const targetSec = sections.find((s) => s.id === targetSectionId) || activeSection;
    if (!targetSec) return;

    let appliedCount = 0;

    // 1) Apply to single exam sheet
    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id !== currentExam.id) return ex;

        const updatedGrades = { ...ex.grades };

        payload.results.forEach((res, idx) => {
          let matchedStudent = targetSec.students.find((s) => s.id === res.matchedStudentId);

          if (!matchedStudent && res.spokenName) {
            const cleanSpoken = res.spokenName.replace(/[‌‍‏‎ـ\s]/g, '').toLowerCase();
            matchedStudent = targetSec.students.find((s) => {
              const cleanSName = s.name.replace(/[‌‍‏‎ـ\s]/g, '').toLowerCase();
              return cleanSName.includes(cleanSpoken) || cleanSpoken.includes(cleanSName);
            });
          }

          if (matchedStudent) {
            const finalMark = voiceDivisor > 1 ? Math.round((res.mark / voiceDivisor) * 100) / 100 : res.mark;
            const dividedMark = computeDivided(finalMark, ex.divisor || 1, ex.rounding || 'half');

            updatedGrades[matchedStudent.id] = {
              studentId: matchedStudent.id,
              originalMark: finalMark,
              dividedMark,
              notes: res.note || '',
              source: 'voice',
              spokenOrder: idx + 1,
              confidence: res.confidence,
              updatedAt: new Date().toISOString(),
            };
          }
        });

        return {
          ...ex,
          audioTranscript: payload.transcript,
          grades: updatedGrades,
        };
      })
    );

    // 2) Apply to Grade 10 Register
    setGrade10Records((prev) => {
      const secRecs = { ...(prev[targetSectionId] || {}) };

      payload.results.forEach((res, idx) => {
        let matchedStudent = targetSec.students.find((s) => s.id === res.matchedStudentId);

        if (!matchedStudent && res.spokenName) {
          const cleanSpoken = res.spokenName.replace(/[‌‍‏‎ـ\s]/g, '').toLowerCase();
          matchedStudent = targetSec.students.find((s) => {
            const cleanSName = s.name.replace(/[‌‍‏‎ـ\s]/g, '').toLowerCase();
            return cleanSName.includes(cleanSpoken) || cleanSpoken.includes(cleanSName);
          });
        }

        if (matchedStudent) {
          appliedCount++;
          const existing = secRecs[matchedStudent.id] || {
            eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
            midterm: null,
            eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null,
            finalExam: null,
          };

          const fieldKey = (targetField as Grade10ColumnKey) || 'quiz1_1';
          const finalMark = voiceDivisor > 1 ? Math.round((res.mark / voiceDivisor) * 100) / 100 : res.mark;

          secRecs[matchedStudent.id] = {
            ...existing,
            [fieldKey]: finalMark,
            notes: res.note || existing.notes || '',
            spokenOrder: idx + 1,
            updatedAt: new Date().toISOString(),
          };
        }
      });

      return { ...prev, [targetSectionId]: secRecs };
    });

    const divInfo = voiceDivisor > 1 ? ` (دابەشی ${voiceDivisor})` : '';
    showToast(`✓ ${appliedCount} نمرە ب رێکا دەنگی${divInfo} هاتنە نەقلکرن بۆ سەر سجلێ`);
  };

  // Add / Delete students
  const handleAddStudent = (sectionId: string, studentName: string) => {
    const newStudent: Student = {
      id: 'stu_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: studentName,
    };

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          students: [...sec.students, newStudent],
        };
      })
    );

    showToast(`قوتابی "${studentName}" هاتە زێدەکرن`);
  };

  const handleDeleteStudent = (sectionId: string, studentId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          students: sec.students.filter((s) => s.id !== studentId),
        };
      })
    );
  };

  const handleBulkAddStudents = (sectionId: string, names: string[]) => {
    const newStudents: Student[] = names.map((name) => ({
      id: 'stu_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
    }));

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          students: [...sec.students, ...newStudents],
        };
      })
    );

    showToast(`${newStudents.length} قوتابی هاتنە زێدەکرن`);
  };

  const handleAddSection = (gradeId: string, label: string) => {
    const newSec: Section = {
      id: 'sec_' + Date.now().toString(36),
      gradeId,
      label,
      students: [],
    };
    setSections((prev) => [...prev, newSec]);
    setActiveSectionId(newSec.id);
    showToast(`هۆبا "${label}" هاتە زێدەکرن`);
  };

  const handleAddGrade = (name: string) => {
    const newGrade: Grade = {
      id: 'grade_' + Date.now().toString(36),
      name,
    };
    setGrades((prev) => [...prev, newGrade]);
    setActiveGradeId(newGrade.id);
    showToast(`قۆناغا "${name}" هاتە زێدەکرن`);
  };

  // Exam sheets
  const handleCreateExam = (title: string, maxScore: number, date: string) => {
    const newExam: ExamSheet = {
      id: 'exam_' + Date.now().toString(36),
      title,
      date,
      gradeId: activeGradeId,
      sectionId: activeSectionId,
      maxScore,
      divisor: 1,
      rounding: 'half',
      grades: {},
      createdAt: new Date().toISOString(),
    };
    setExams((prev) => [newExam, ...prev]);
    setCurrentExamId(newExam.id);
    showToast(`تاقیکرنا "${title}" هاتە دروستکرن`);
  };

  const handleDeleteExam = (examId: string) => {
    const remaining = exams.filter((e) => e.id !== examId);
    setExams(remaining);
    if (currentExamId === examId && remaining[0]) {
      setCurrentExamId(remaining[0].id);
    }
  };

  // Export & Import handlers
  const handleExportExcel = (options?: ExcelExportOptions) => {
    if (!activeSection) return;

    if (viewMode === 'g10_register') {
      exportGrade10RegisterToExcel({
        students: activeSection.students,
        records: grade10Records[activeSection.id] || {},
        gradeName: activeGrade?.name || '10',
        sectionLabel: activeSection.label,
        schoolInfo,
        options,
      });
    } else {
      exportExamToExcel({
        exam: currentExam,
        students: activeSection.students,
        gradeName: activeGrade?.name || '',
        sectionLabel: activeSection.label,
        schoolInfo,
        options,
      });
    }
  };

  const handleImportExcel = async (file: File) => {
    if (!activeSection) return;
    try {
      const { importedCount, updatedGrades, unmatchedNames } = await parseExcelFileToGrades(file, activeSection.students);
      if (importedCount === 0) {
        showToast('چ نمرە نەهاتنە ئینان! تکایە دوپات بکە ژ ناڤێن قوتابیان د فایلا ئێکسل دا.');
        return;
      }

      // Update single exam
      setExams((prev) =>
        prev.map((ex) => {
          if (ex.id !== currentExam.id) return ex;

          const newGrades = { ...ex.grades };
          Object.entries(updatedGrades).forEach(([stId, data]) => {
            const existing = newGrades[stId];
            const dividedMark = computeDivided(data.originalMark, ex.divisor || 1, ex.rounding || 'half');
            newGrades[stId] = {
              studentId: stId,
              originalMark: data.originalMark,
              dividedMark,
              notes: data.notes || existing?.notes || '',
              source: 'manual',
              updatedAt: new Date().toISOString(),
            };
          });

          return { ...ex, grades: newGrades };
        })
      );

      // Update Grade 10 quiz1_1
      setGrade10Records((prev) => {
        const secRecs = { ...(prev[activeSection.id] || {}) };
        Object.entries(updatedGrades).forEach(([stId, data]) => {
          const existing = secRecs[stId] || {
            eval1: null, quiz1_1: null, quiz1_2: null, attend1: null, clean1: null,
            midterm: null,
            eval2: null, quiz2_1: null, quiz2_2: null, attend2: null, clean2: null,
            finalExam: null,
          };
          secRecs[stId] = {
            ...existing,
            quiz1_1: data.originalMark,
            notes: data.notes || existing.notes || '',
            updatedAt: new Date().toISOString(),
          };
        });
        return { ...prev, [activeSection.id]: secRecs };
      });

      let msg = `✓ ${importedCount} نمرە ژ فایلا ئێکسل هاتنە بارکرن`;
      if (unmatchedNames.length > 0) {
        msg += ` (${unmatchedNames.length} ناڤ نەهاتنە دیتن)`;
      }
      showToast(msg);
    } catch (err: any) {
      showToast(err?.message || 'خەلەتیەک چێبوو د بارکرنا فایلا ئێکسل دا');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyClipboard = () => {
    if (!activeSection) return;
    copyTableToClipboard({
      exam: currentExam,
      students: activeSection.students,
    });
  };

  const hasGrades = activeSection
    ? activeSection.students.some((s) => currentExam.grades[s.id]?.originalMark !== null)
    : false;

  // Update exam total max score
  const handleUpdateMaxScore = (maxScore: number) => {
    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id !== currentExam.id) return ex;

        const updatedGrades = { ...ex.grades };
        Object.keys(updatedGrades).forEach((stId) => {
          const item = updatedGrades[stId];
          if (item && item.originalMark !== null) {
            updatedGrades[stId] = {
              ...item,
              dividedMark: computeDivided(item.originalMark, ex.divisor || 1, ex.rounding || 'half'),
            };
          }
        });

        return {
          ...ex,
          maxScore,
          grades: updatedGrades,
        };
      })
    );
    showToast(`نمرەیا گشتی یا تاقیکرنێ هاتە گۆڕین بۆ (${maxScore})`);
  };

  const isG10 = activeGrade?.name === '10' || activeGrade?.id === 'g10' || activeGrade?.id === 'gmux13l994lazg';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-bold border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mic Permission Banner on top when opening website */}
      <MicPermissionBanner lang={lang} />

      {/* Top Navbar */}
      <Navbar
        schoolInfo={schoolInfo}
        lang={lang}
        onToggleLang={() => setLang(lang === 'ku' ? 'ar' : 'ku')}
        onOpenClassManager={() => setIsClassManagerOpen(true)}
        onOpenExamManager={() => setIsExamManagerOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenTrashModal={() => setIsTrashModalOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        trashCount={trashItems.length}
        currentExamTitle={currentExam.title}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Printable Official Header */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
          <div className="flex justify-between items-center text-sm font-bold mb-2">
            <span>{schoolInfo.school}</span>
            <span className="text-xl font-black">{viewMode === 'g10_register' ? 'سجلا هه‌ڵسه‌نگاندن و ئه‌زموونێن پۆلا 10 (100 نمرەیی)' : currentExam.title}</span>
            <span>{schoolInfo.teacher}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>قۆناغ: {activeGrade?.name} — هۆبە: {activeSection?.label}</span>
            <span>بابەت: {schoolInfo.subject}</span>
            <span>رێکەفت: {currentExam.date}</span>
          </div>
        </div>

        {/* Section & Stage Selector */}
        <div className="print:hidden">
          <SectionSelector
            grades={grades}
            sections={sections}
            activeGradeId={activeGradeId}
            activeSectionId={activeSectionId}
            onSelectGrade={(gId) => {
              setActiveGradeId(gId);
              const firstSec = sections.find((s) => s.gradeId === gId);
              if (firstSec) setActiveSectionId(firstSec.id);
            }}
            onSelectSection={(sId) => setActiveSectionId(sId)}
            lang={lang}
          />
        </div>

        {/* View Mode Switcher Tab (Grade 10 Register vs Single Exam Sheet) */}
        <div className="print:hidden mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              onClick={() => setViewMode('g10_register')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'g10_register'
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>سجلا نمرەیێن گشتی یا پۆلا 10 (100 نمرەیی)</span>
            </button>
            <button
              onClick={() => setViewMode('single_exam')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'single_exam'
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>تاقیکرنا تاکەکەسی (کویز / ئەزموون)</span>
            </button>
          </div>
        </div>

        {/* Division Bar only shown in single exam mode */}
        {viewMode === 'single_exam' && (
          <div className="print:hidden">
            <DivisionBar
              currentDivisor={currentExam.divisor || 1}
              currentRounding={currentExam.rounding || 'half'}
              onApplyDivision={handleApplyDivision}
              onResetToOriginal={handleResetToOriginal}
              lang={lang}
              hasGrades={hasGrades}
            />
          </div>
        )}

        {/* Statistics KPI Cards */}
        {activeSection && viewMode === 'single_exam' && (
          <div className="print:hidden">
            <StatsCards
              students={activeSection.students}
              exam={currentExam}
              lang={lang}
            />
          </div>
        )}

        {/* Main Content Area: Grade 10 Multi-Column Register OR Single Exam Sheet */}
        {activeSection && (
          viewMode === 'g10_register' ? (
            <Grade10RegisterTable
              students={activeSection.students}
              records={grade10Records[activeSection.id] || {}}
              onUpdateField={handleUpdateGrade10Field}
              onClearSectionRecords={handleClearGrade10SectionRecords}
              onClearColumnRecords={handleClearGrade10ColumnRecords}
              onExportExcel={handleExportExcel}
              onImportExcel={handleImportExcel}
              onPrint={handlePrint}
              onCopyClipboard={handleCopyClipboard}
              onOpenVoiceModal={handleOpenVoiceModalForColumn}
              onSelectColumnForExam={handleSelectColumnForExam}
              onOpenAddStudent={() => setIsClassManagerOpen(true)}
              onOpenTrashModal={() => setIsTrashModalOpen(true)}
              trashCount={trashItems.length}
              lang={lang}
            />
          ) : (
            <ExcelTable
              students={activeSection.students}
              exam={currentExam}
              targetColumnKey={selectedRegisterColumnKey}
              targetColumnTitle={fieldTitles[selectedRegisterColumnKey]}
              onUpdateMark={handleUpdateMark}
              onUpdateMaxScore={handleUpdateMaxScore}
              onClearMarks={handleClearMarks}
              onExportExcel={handleExportExcel}
              onImportExcel={handleImportExcel}
              onPrint={handlePrint}
              onCopyClipboard={handleCopyClipboard}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenAddStudent={() => setIsClassManagerOpen(true)}
              onOpenTrashModal={() => setIsTrashModalOpen(true)}
              trashCount={trashItems.length}
              onSendToMainRegister={handleSendToMainRegister}
              onBackToMainRegister={() => setViewMode('g10_register')}
              lang={lang}
            />
          )
        )}
      </main>

      {/* Modals */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        activeGrade={activeGrade}
        activeSection={activeSection}
        allGrades={grades}
        allSections={sections}
        initialTargetField={voiceModalTargetField}
        onApplyResults={handleApplyVoiceResults}
        lang={lang}
      />

      <ClassManagerModal
        isOpen={isClassManagerOpen}
        onClose={() => setIsClassManagerOpen(false)}
        grades={grades}
        sections={sections}
        activeGradeId={activeGradeId}
        activeSectionId={activeSectionId}
        onAddStudent={handleAddStudent}
        onDeleteStudent={handleDeleteStudent}
        onBulkAddStudents={handleBulkAddStudents}
        onAddSection={handleAddSection}
        onAddGrade={handleAddGrade}
        lang={lang}
      />

      <ExamManagerModal
        isOpen={isExamManagerOpen}
        onClose={() => setIsExamManagerOpen(false)}
        exams={exams}
        currentExamId={currentExam.id}
        onSelectExam={(id) => setCurrentExamId(id)}
        onCreateExam={handleCreateExam}
        onDeleteExam={handleDeleteExam}
        lang={lang}
      />

      <TrashBinModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        trashItems={trashItems}
        onRestoreItem={handleRestoreTrashItem}
        onDeleteItem={handleDeleteTrashItem}
        onClearAllTrash={handleClearAllTrash}
        lang={lang}
      />

      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
        getSyncPayload={handleGetSyncPayload}
        onRestoreData={handleRestoreFromGoogleDrive}
        onExportSheets={handleExportGoogleSheets}
      />
    </div>
  );
}
