export interface Student {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  gradeId: string;
  label: string;
  students: Student[];
}

export interface Grade {
  id: string;
  name: string;
  subj?: string;
}

export interface SchoolInfo {
  teacher: string;
  subject: string;
  school: string;
  subjects: string[];
}

export interface GradeItem {
  studentId: string;
  originalMark: number | null;
  dividedMark: number | null;
  notes?: string;
  source?: 'voice' | 'manual' | 'calculated';
  spokenOrder?: number;
  confidence?: number;
  updatedAt?: string;
}

export interface ExamSheet {
  id: string;
  title: string;
  date: string;
  gradeId: string;
  sectionId: string;
  maxScore: number;
  divisor: number;
  targetMax?: number;
  rounding: 'round' | 'half' | 'ceil' | 'floor' | 'exact';
  grades: Record<string, GradeItem>; // studentId -> GradeItem
  audioTranscript?: string;
  createdAt: string;
}

export interface VoiceRecognitionResult {
  spokenName: string;
  matchedStudentId?: string;
  matchedStudentName?: string;
  mark: number;
  confidence?: number;
  note?: string;
}

export interface VoiceResponsePayload {
  transcript: string;
  detectedGrade?: string | null;
  detectedSection?: string | null;
  results: VoiceRecognitionResult[];
  unmatched?: Array<{
    spokenName: string;
    mark: number;
    reason?: string;
  }>;
}

export interface Grade10Record {
  eval1: number | null;     // هەڵسەنگاندن (2)
  quiz1_1: number | null;   // کویز 1 (2)
  quiz1_2: number | null;   // کویز 2 (2)
  attend1: number | null;   // ئامادەبوون (2)
  clean1: number | null;    // پاکژی (2)
  midterm: number | null;   // ئەزموونا نیڤا وەرزی (20)
  eval2: number | null;     // هەڵسەنگاندن (3)
  quiz2_1: number | null;   // کویز 1 (2)
  quiz2_2: number | null;   // کویز 2 (2)
  attend2: number | null;   // ئامادەبوون (1)
  clean2: number | null;    // پاکژی (2)
  finalExam: number | null; // ئەزموونا دوماهیا سالێ (60)
  notes?: string;
  spokenOrder?: number;
  updatedAt?: string;
}

export type Grade10ColumnKey =
  | 'eval1'
  | 'quiz1_1'
  | 'quiz1_2'
  | 'attend1'
  | 'clean1'
  | 'midterm'
  | 'eval2'
  | 'quiz2_1'
  | 'quiz2_2'
  | 'attend2'
  | 'clean2'
  | 'finalExam';

export type Language = 'ku' | 'ar';

export interface ClearedRecordTrashItem {
  id: string;
  timestamp: string;
  title: string;
  type: 'g10_column' | 'g10_section' | 'single_exam';
  sectionId: string;
  sectionName: string;
  columnKey?: Grade10ColumnKey;
  columnTitle?: string;
  examId?: string;
  examTitle?: string;
  grade10RecordsSnapshot?: Record<string, Grade10Record>;
  examGradesSnapshot?: Record<string, GradeItem>;
  studentCount: number;
}


