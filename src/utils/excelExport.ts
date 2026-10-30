import * as XLSX from 'xlsx';
import { Student, ExamSheet, GradeItem, SchoolInfo, Grade10Record } from '../types';

export interface ExcelExportOptions {
  includeSeq?: boolean;
  includeName?: boolean;
  includeOriginalMark?: boolean;
  includeDivisor?: boolean;
  includeFinalMark?: boolean;
  includePercentage?: boolean;
  includeStatus?: boolean;
  includeNotes?: boolean;
  filterRows?: 'all' | 'graded';
  sortBy?: 'voice' | 'seq' | 'name' | 'original' | 'final';
}

export function exportExamToExcel({
  exam,
  students,
  gradeName,
  sectionLabel,
  schoolInfo,
  options,
}: {
  exam: ExamSheet;
  students: Student[];
  gradeName: string;
  sectionLabel: string;
  schoolInfo: SchoolInfo;
  options?: ExcelExportOptions;
}) {
  const opts: Required<ExcelExportOptions> = {
    includeSeq: options?.includeSeq ?? true,
    includeName: options?.includeName ?? true,
    includeOriginalMark: options?.includeOriginalMark ?? true,
    includeDivisor: options?.includeDivisor ?? true,
    includeFinalMark: options?.includeFinalMark ?? true,
    includePercentage: options?.includePercentage ?? true,
    includeStatus: options?.includeStatus ?? true,
    includeNotes: options?.includeNotes ?? true,
    filterRows: options?.filterRows ?? 'all',
    sortBy: options?.sortBy ?? 'voice',
  };

  const wb = XLSX.utils.book_new();

  // Filter students if requested
  let targetStudents = opts.filterRows === 'graded'
    ? students.filter((s) => exam.grades[s.id]?.originalMark !== null && exam.grades[s.id]?.originalMark !== undefined)
    : [...students];

  // Sort targetStudents according to requested sortBy option
  targetStudents.sort((a, b) => {
    const idxA = students.indexOf(a);
    const idxB = students.indexOf(b);

    if (opts.sortBy === 'voice') {
      const orderA = exam.grades[a.id]?.spokenOrder ?? 999999;
      const orderB = exam.grades[b.id]?.spokenOrder ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return idxA - idxB;
    }
    if (opts.sortBy === 'seq') {
      return idxA - idxB;
    }
    if (opts.sortBy === 'name') {
      return a.name.localeCompare(b.name, 'ar');
    }
    if (opts.sortBy === 'original') {
      const markA = exam.grades[a.id]?.originalMark ?? -1;
      const markB = exam.grades[b.id]?.originalMark ?? -1;
      return markB - markA; // descending
    }
    if (opts.sortBy === 'final') {
      const markA = exam.grades[a.id]?.dividedMark ?? (exam.grades[a.id]?.originalMark ? exam.grades[a.id]!.originalMark! / (exam.divisor || 1) : -1);
      const markB = exam.grades[b.id]?.dividedMark ?? (exam.grades[b.id]?.originalMark ? exam.grades[b.id]!.originalMark! / (exam.divisor || 1) : -1);
      return (markB ?? -1) - (markA ?? -1);
    }
    return 0;
  });

  // Build dynamic table headers
  const tableHeaders: string[] = [];
  if (opts.includeSeq) tableHeaders.push('ت / #');
  if (opts.includeName) tableHeaders.push('ناڤێ قوتابی / اسم الطالب');
  if (opts.includeOriginalMark) tableHeaders.push(`نمرەیا سەرەکی (/${exam.maxScore})`);
  if (opts.includeDivisor) tableHeaders.push('دابەشکرن / القسمة');
  if (opts.includeFinalMark) tableHeaders.push('نمرەیا دوماهیێ / النهائية');
  if (opts.includePercentage) tableHeaders.push('ڕێژە %');
  if (opts.includeStatus) tableHeaders.push('بارودۆخ / التقدیر');
  if (opts.includeNotes) tableHeaders.push('تێبینی / ملاحظات');

  // Prepare top header info rows
  const fillCols = Math.max(0, tableHeaders.length - 1);
  const headerRows = [
    ['سجلا نمرەیان / سجل الدرجات', ...Array(fillCols).fill('')],
    ['قوتابخانە / المدرسة:', schoolInfo.school, '', 'بابەت / المادة:', schoolInfo.subject, ...Array(Math.max(0, tableHeaders.length - 5)).fill('')],
    ['مامۆستا / المدرس:', schoolInfo.teacher, '', 'رێکەفت / التاريخ:', exam.date, ...Array(Math.max(0, tableHeaders.length - 5)).fill('')],
    ['قۆناغ / المرحلة:', gradeName, 'هۆبە / الشعبة:', sectionLabel, 'تاقیکرن / الامتحان:', exam.title, ...Array(Math.max(0, tableHeaders.length - 6)).fill('')],
    ['دابەشکرن ل سەر:', `÷ ${exam.divisor || 1}`, 'نمرەیا مەزنترین:', exam.maxScore, ...Array(Math.max(0, tableHeaders.length - 4)).fill('')],
    [], // empty spacer
    tableHeaders,
  ];

  // Prepare student rows
  const studentRows = targetStudents.map((student, index) => {
    const item: GradeItem | undefined = exam.grades[student.id];
    const orig = item?.originalMark ?? null;
    const finalVal = item?.dividedMark ?? (orig !== null && exam.divisor ? orig / exam.divisor : orig);

    const effectiveMax = exam.targetMax || (exam.maxScore / (exam.divisor || 1));
    const pct = finalVal !== null ? Math.round((finalVal / effectiveMax) * 100) : null;

    let status = '';
    if (pct !== null) {
      if (pct >= 90) status = 'نایاب (ممتاز)';
      else if (pct >= 80) status = 'زۆر باش (جيد جداً)';
      else if (pct >= 70) status = 'باش (جيد)';
      else if (pct >= 60) status = 'ناڤین (متوسط)';
      else if (pct >= 50) status = 'قەبوول (مقبول)';
      else status = 'کەفتی (راسب)';
    }

    const rowData: (string | number)[] = [];
    if (opts.includeSeq) rowData.push(index + 1);
    if (opts.includeName) rowData.push(student.name);
    if (opts.includeOriginalMark) rowData.push(orig !== null ? orig : '');
    if (opts.includeDivisor) rowData.push(`÷ ${exam.divisor || 1}`);
    if (opts.includeFinalMark) rowData.push(finalVal !== null ? Number(finalVal.toFixed(2)) : '');
    if (opts.includePercentage) rowData.push(pct !== null ? `${pct}%` : '');
    if (opts.includeStatus) rowData.push(status);
    if (opts.includeNotes) rowData.push(item?.notes || '');

    return rowData;
  });

  const allRows = [...headerRows, ...studentRows];

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set Right-to-Left sheet view property
  ws['!views'] = [{ rightToLeft: true }];

  XLSX.utils.book_append_sheet(wb, ws, `${gradeName} - ${sectionLabel}`);

  const fileName = `نمرێن_${gradeName}_${sectionLabel}_${exam.title || 'تاقیکرن'}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, fileName);
}

export function copyTableToClipboard({
  exam,
  students,
}: {
  exam: ExamSheet;
  students: Student[];
}): boolean {
  try {
    const headers = ['ت', 'ناڤێ قوتابی', 'نمرەیا سەرەکی', 'دابەشکرن', 'نمرەیا دوماهیێ', 'ڕێژە %', 'تێبینی'];
    const rows = students.map((s, idx) => {
      const item = exam.grades[s.id];
      const orig = item?.originalMark ?? '';
      const finalVal = item?.dividedMark ?? (orig !== '' && exam.divisor ? (orig as number) / exam.divisor : orig);
      const effectiveMax = exam.targetMax || (exam.maxScore / (exam.divisor || 1));
      const pct = finalVal !== '' ? Math.round(((finalVal as number) / effectiveMax) * 100) + '%' : '';
      return [
        idx + 1,
        s.name,
        orig,
        `÷ ${exam.divisor || 1}`,
        typeof finalVal === 'number' ? Number(finalVal.toFixed(2)) : finalVal,
        pct,
        item?.notes || '',
      ].join('\t');
    });

    const text = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

export async function parseExcelFileToGrades(
  file: File,
  students: Student[]
): Promise<{
  importedCount: number;
  updatedGrades: Record<string, { originalMark: number; notes?: string }>;
  unmatchedNames: string[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (!workbook.SheetNames.length) {
    throw new Error('فایلا ئێکسل ڤالایە.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rows || rows.length === 0) {
    throw new Error('چ زانیاری د ڤێ شیتێ دا نەهاتنە دیتن.');
  }

  // Find column indices
  let nameColIdx = -1;
  let markColIdx = -1;
  let notesColIdx = -1;

  // Search header row
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    row.forEach((cellVal, cIdx) => {
      const text = String(cellVal || '').trim().toLowerCase();
      if (!text) return;

      if (
        (text.includes('ناڤ') || text.includes('اسم') || text.includes('name') || text.includes('طالب') || text.includes('قوتابی')) &&
        !text.includes('مدر') && !text.includes('ڕێژە')
      ) {
        if (nameColIdx === -1) nameColIdx = cIdx;
      }

      if (
        (text.includes('نمرە') || text.includes('درجة') || text.includes('سەرەکی') || text.includes('أصلية') || text.includes('mark') || text.includes('score')) &&
        !text.includes('کۆم') && !text.includes('تێبینی')
      ) {
        if (markColIdx === -1) markColIdx = cIdx;
      }

      if (text.includes('تێبینی') || text.includes('ملاحظات') || text.includes('note')) {
        if (notesColIdx === -1) notesColIdx = cIdx;
      }
    });
  }

  // Fallback defaults if header search didn't locate exact columns
  if (nameColIdx === -1) {
    nameColIdx = 1; // Column B
  }
  if (markColIdx === -1) {
    markColIdx = nameColIdx === 1 ? 2 : 1; // Column C or B
  }

  const updatedGrades: Record<string, { originalMark: number; notes?: string }> = {};
  const unmatchedNames: string[] = [];
  let importedCount = 0;

  // Normalize string for fuzzy matching
  const normalize = (str: string) =>
    str
      .replace(/[‌‍‏‎ـ]/g, '')
      .replace(/[ىیي]/g, 'ي')
      .replace(/[کك]/g, 'ك')
      .replace(/[ەة]/g, 'ه')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const studentMap = new Map<string, Student>();
  students.forEach((s) => {
    studentMap.set(normalize(s.name), s);
  });

  // Loop through rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    const rawName = row[nameColIdx];
    const rawMark = row[markColIdx];
    const rawNote = notesColIdx !== -1 ? row[notesColIdx] : '';

    if (!rawName || typeof rawName !== 'string') continue;
    const cleanNameStr = String(rawName).trim();
    if (
      !cleanNameStr ||
      cleanNameStr.includes('ناڤێ') ||
      cleanNameStr.includes('اسم الطالب') ||
      cleanNameStr.includes('مدرس') ||
      cleanNameStr.includes('ت / #')
    ) {
      continue;
    }

    // Parse mark
    let parsedMark: number | null = null;
    if (typeof rawMark === 'number') {
      parsedMark = rawMark;
    } else if (rawMark !== undefined && rawMark !== null && rawMark !== '') {
      const num = parseFloat(String(rawMark).replace(/[^\d.-]/g, ''));
      if (!isNaN(num)) parsedMark = num;
    }

    if (parsedMark === null) continue;

    // Match student
    const normKey = normalize(cleanNameStr);
    let matchedStudent = studentMap.get(normKey);

    if (!matchedStudent) {
      for (const s of students) {
        const normS = normalize(s.name);
        if (normS.includes(normKey) || normKey.includes(normS)) {
          matchedStudent = s;
          break;
        }
      }
    }

    if (matchedStudent) {
      updatedGrades[matchedStudent.id] = {
        originalMark: parsedMark,
        notes: rawNote ? String(rawNote) : undefined,
      };
      importedCount++;
    } else {
      unmatchedNames.push(cleanNameStr);
    }
  }

  return {
    importedCount,
    updatedGrades,
    unmatchedNames,
  };
}

export function exportGrade10RegisterToExcel({
  students,
  records,
  gradeName,
  sectionLabel,
  schoolInfo,
  options,
}: {
  students: Student[];
  records: Record<string, Grade10Record>;
  gradeName: string;
  sectionLabel: string;
  schoolInfo: SchoolInfo;
  options?: ExcelExportOptions;
}) {
  const sortBy = options?.sortBy ?? 'seq';
  const filterRows = options?.filterRows ?? 'all';

  const computeTotals = (rec?: Grade10Record) => {
    if (!rec) return { sum1: '', sumMidterm: '', sum2: '', termTotal40: '', grandTotal100: '', status: '' };
    const { eval1, quiz1_1, quiz1_2, attend1, clean1, midterm, eval2, quiz2_1, quiz2_2, attend2, clean2, finalExam } = rec;

    const has1 = [eval1, quiz1_1, quiz1_2, attend1, clean1].some((v) => v !== null && v !== undefined);
    const sum1 = has1 ? (eval1 || 0) + (quiz1_1 || 0) + (quiz1_2 || 0) + (attend1 || 0) + (clean1 || 0) : null;

    const sumMidterm = (sum1 !== null || (midterm !== null && midterm !== undefined)) ? (sum1 || 0) + (midterm || 0) : null;

    const has2 = [eval2, quiz2_1, quiz2_2, attend2, clean2].some((v) => v !== null && v !== undefined);
    const sum2 = has2 ? (eval2 || 0) + (quiz2_1 || 0) + (quiz2_2 || 0) + (attend2 || 0) + (clean2 || 0) : null;

    const has40 = sumMidterm !== null || sum2 !== null;
    const termTotal40 = has40 ? (sumMidterm || 0) + (sum2 || 0) : null;

    const has100 = termTotal40 !== null || (finalExam !== null && finalExam !== undefined);
    const grandTotal100 = has100 ? (termTotal40 || 0) + (finalExam || 0) : null;

    let status = '';
    if (grandTotal100 !== null) {
      if (grandTotal100 >= 90) status = 'ممتاز (نایاب)';
      else if (grandTotal100 >= 80) status = 'جيد جداً (زۆر باش)';
      else if (grandTotal100 >= 70) status = 'جيد (باش)';
      else if (grandTotal100 >= 60) status = 'متوسط (ناڤین)';
      else if (grandTotal100 >= 50) status = 'مقبول (قەبوول)';
      else status = 'راسب (کەفتی)';
    }

    return {
      sum1: sum1 !== null ? Number(sum1.toFixed(1)) : '',
      sumMidterm: sumMidterm !== null ? Number(sumMidterm.toFixed(1)) : '',
      sum2: sum2 !== null ? Number(sum2.toFixed(1)) : '',
      termTotal40: termTotal40 !== null ? Number(termTotal40.toFixed(1)) : '',
      grandTotal100: grandTotal100 !== null ? Number(grandTotal100.toFixed(1)) : '',
      status,
    };
  };

  let targetStudents = filterRows === 'graded'
    ? students.filter((s) => computeTotals(records[s.id]).grandTotal100 !== '')
    : [...students];

  targetStudents.sort((a, b) => {
    const idxA = students.indexOf(a);
    const idxB = students.indexOf(b);

    if (sortBy === 'voice') {
      const orderA = records[a.id]?.spokenOrder ?? 999999;
      const orderB = records[b.id]?.spokenOrder ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return idxA - idxB;
    }
    if (sortBy === 'seq') return idxA - idxB;
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
    if (sortBy === 'final') {
      const totA = typeof computeTotals(records[a.id]).grandTotal100 === 'number' ? (computeTotals(records[a.id]).grandTotal100 as number) : -1;
      const totB = typeof computeTotals(records[b.id]).grandTotal100 === 'number' ? (computeTotals(records[b.id]).grandTotal100 as number) : -1;
      return totB - totA;
    }
    return 0;
  });

  const headerRows = [
    ['سجلا گشتی یا نمرەیێن پۆلا 10 (100 نمرەیی)'],
    ['قوتابخانە:', schoolInfo.school, '', 'بابەت:', schoolInfo.subject],
    ['مامۆستا:', schoolInfo.teacher, '', 'قۆناغ:', gradeName, 'هۆبە:', sectionLabel],
    [],
    [
      'ت',
      'ناڤێ قوتابی',
      'هەڵسەنگاندن (2)',
      'کویز 1 (2)',
      'کویز 2 (2)',
      'ئامادەبوون (2)',
      'پاکژی (2)',
      'کۆما دەها ئێکێ (10)',
      'نیڤا وەرزی (20)',
      'کۆما نیڤا وەرزی (30)',
      'هەڵسەنگاندن (3)',
      'کویز 1 (2)',
      'کویز 2 (2)',
      'ئامادەبوون (1)',
      'پاکژی (2)',
      'کۆما دەها دووێ (10)',
      'سەنەوی (40)',
      'دوماهیا سالێ (60)',
      'دەراەنجاما گشتی (100)',
      'التقدير',
      'تێبینی',
    ],
  ];

  const studentRows = targetStudents.map((s, idx) => {
    const rec = records[s.id] || {};
    const tot = computeTotals(rec);
    return [
      idx + 1,
      s.name,
      rec.eval1 ?? '',
      rec.quiz1_1 ?? '',
      rec.quiz1_2 ?? '',
      rec.attend1 ?? '',
      rec.clean1 ?? '',
      tot.sum1,
      rec.midterm ?? '',
      tot.sumMidterm,
      rec.eval2 ?? '',
      rec.quiz2_1 ?? '',
      rec.quiz2_2 ?? '',
      rec.attend2 ?? '',
      rec.clean2 ?? '',
      tot.sum2,
      tot.termTotal40,
      rec.finalExam ?? '',
      tot.grandTotal100,
      tot.status,
      rec.notes || '',
    ];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...studentRows]);
  ws['!views'] = [{ rightToLeft: true }];
  XLSX.utils.book_append_sheet(wb, ws, `سجلا_پۆلا_${gradeName}_${sectionLabel}`);

  const fileName = `سجلا_پۆلا_${gradeName}_${sectionLabel}_100_نمرەیی.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, fileName);
}

