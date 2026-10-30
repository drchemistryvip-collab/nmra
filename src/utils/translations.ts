import { Language } from '../types';

export const translations = {
  ku: {
    // App header
    appTitle: 'تۆمارا نمرەیان ب دەنگی و ئێکسل',
    appSubtitle: 'سیستەمێ ژیرێ تۆمارکرن و دابەشکرنا نمرەیێن قوتابیان ب دەنگی',
    teacher: 'مامۆستا',
    school: 'قوتابخانە',
    subject: 'بابەت',
    changeLang: 'عربي',

    // Section selector
    selectStage: 'قۆناغ هەلبژێرە:',
    selectSection: 'هۆبە هەلبژێرە:',
    stage: 'قۆناغ',
    section: 'هۆبە',
    totalStudents: 'قوتابی',
    studentsCount: '{count} قوتابی',
    grade10: 'پۆلا 10',
    grade11: 'پۆلا 11 (یازدێ)',
    grade12: 'پۆلا 12 (دوازدێ)',

    // Actions
    recordVoice: 'تەسجیلکرنا دەنگی ب ئەی ئای',
    recordingActive: 'دەنگ دهێتە تەسجیلکرن...',
    stopRecord: 'تمامکرن و راڤەکرن',
    pauseRecord: 'راگرتن',
    resumeRecord: 'بەردەوامبوون',
    cancelRecord: 'پاشگەزبوون',
    pasteText: 'لکاندن / نڤیسینا دەقی',
    divideMarks: 'دابەشکرنا نمرەیان ب ئێک کلیک',
    exportExcel: 'هەناردن بۆ ئێکسل (.xlsx)',
    printPdf: 'چاپکرن / PDF',
    copyTable: 'کۆپیکرن بۆ ئێکسل',
    copiedSuccess: 'خشتە هاتە کۆپیکرن بۆ کلیپبۆردێ',
    resetMarks: 'زڤڕاندن بۆ نمرەیا سەرەکی',
    saveSheet: 'پاشەکەفتکرن',

    // Division options
    divideBy: 'دابەشکرن ل سەر:',
    quickDivide: 'دابەشکرنا لەزگین:',
    customDivisor: 'ژمارەکا دی بنڤیسە...',
    scaleFromTo: 'گۆڕینا نمرەیێ:',
    scaleFrom: 'نمرەیا مەزنترین (سەرەکی):',
    scaleTo: 'دەربازکرن بۆ (مەزنترین):',
    roundingRule: 'رێسایا گۆڕینێ (کەرت):',
    roundInteger: 'سەدەقا تمام (بێ کەرت)',
    roundHalf: 'نیڤ نمرە (0.5)',
    roundTwoDecimals: 'دوو ژمارێن کەرتێ (.00)',
    roundExact: 'نمرەیا رێک و پێک (کەرت)',
    applyDivision: 'جێبەجێکرنا دابەشکرنێ ل سەر هەمی نمرەیان',
    dividedNotice: 'هەمی نمرە هاتنە دابەشکرن ل سەر {divisor}',

    // Table headers
    thSeq: '#',
    thName: 'ناڤێ چواری یێ قوتابی',
    thOriginalMark: 'نمرەیا سەرەکی',
    thDivisor: 'دابەشکرن',
    thFinalMark: 'نمرەیا دوماهیێ',
    thPercentage: 'ڕێژە %',
    thStatus: 'بارودۆخ',
    thNotes: 'تێبینی',

    // Statuses
    excellent: 'نایاب (٩٠-١٠٠)',
    veryGood: 'زۆر باش (٨٠-٨٩)',
    good: 'باش (٧٠-٧٩)',
    medium: 'ناڤین (٦٠-٦٩)',
    acceptable: 'قەبوول (٥٠-٥٩)',
    failed: 'کەفتی (< ٥٠)',
    notGraded: 'نەهاتیە دانان',

    // Stats
    statAverage: 'تێکڕایا پۆلێ',
    statHighest: 'بەرزترین نمرە',
    statLowest: 'نزمترین نمرە',
    statPassRate: 'ڕێژەیا دەرچوونێ',
    statGradedCount: 'قوتابیێن نمرە وەرگرتین',

    // Voice Modal
    voiceModalTitle: 'تەسجیلکرنا دەنگی بۆ دانانا نمرەیان ب ئەی ئای',
    voiceInstructions: 'دەستپێکێ دبێژی قۆناغ و هۆبە، یان ئێکسەر بێژە ناڤێ قوتابی و نمرەیا وێ. بۆ نموونە: "ئانیا حەکیم سیهـ و پێنج، پەری بلند چل، جوان ڕێبەر بیست و هەشت..."',
    voiceListening: 'مایکروفۆن یێ کار دکەت... دەنگێ تە دهێتە تەسجیلکرن',
    processingAI: 'ژیرییا دەستکرد (AI) یا دەنگی راڤە دکەت و ناڤێن قوتابیان دەستنیشان دکەت...',
    voiceSummaryTitle: 'ئەنجامێن دەنگی یێن ناسکڕی',
    transcriptLabel: 'دەقێ هاتیە گۆتن (Transcript):',
    recognizedCount: '{count} نمرە هاتنە هاوتاکرن دگەل ناڤێن هۆبەیێ',
    unmatchedCount: '{count} ناڤ نەهاتنە نیاسین',
    applyVoiceResults: 'دانانا ڤان نمرەیان د خشتەی دا',
    retakeVoice: 'دووبارە تەسجیلکرن',

    // Exams
    currentExam: 'تاقیکرن / ئەرک:',
    newExam: 'تاقیکرنەکا نوو',
    examTitlePlaceholder: 'ناڤێ تاقیکرنێ (بۆ نموونە: کویزێ ١، ئەزموونا مەهانە...)',
    manageClasses: 'بڕێڤەبرنا پۆل و قوتابیان',
    addStudent: 'زێدەکرنا قوتابیەکی',
    studentNamePh: 'ناڤێ قوتابی بنڤیسە...',
    studentAdded: 'قوتابی هاتە زێدەکرن',
  },
  ar: {
    // App header
    appTitle: 'سجل الدرجات الصوتي وإكسل',
    appSubtitle: 'نظام ذكي لرصد وقسمة درجات الطلاب بالصوت والذكاء الاصطناعي',
    teacher: 'المدرس',
    school: 'المدرسة',
    subject: 'المادة',
    changeLang: 'کوردی',

    // Section selector
    selectStage: 'اختر المرحلة:',
    selectSection: 'اختر الشعبة:',
    stage: 'المرحلة',
    section: 'الشعبة',
    totalStudents: 'طالب',
    studentsCount: '{count} طالب',
    grade10: 'الصف العاشر',
    grade11: 'الصف الحادي عشر',
    grade12: 'الصف الثاني عشر',

    // Actions
    recordVoice: 'تسجيل الدرجات بالصوت (AI)',
    recordingActive: 'جارٍ تسجيل الصوت...',
    stopRecord: 'إنهاء وتحليل بالذكاء الاصطناعي',
    pauseRecord: 'إيقاف مؤقت',
    resumeRecord: 'متابعة',
    cancelRecord: 'إلغاء',
    pasteText: 'لصق / كتابة النص',
    divideMarks: 'قسمة الدرجات بنقرة واحدة',
    exportExcel: 'تصدير إكسل (.xlsx)',
    printPdf: 'طباعة / PDF',
    copyTable: 'نسخ لجدول إكسل',
    copiedSuccess: 'تم نسخ الجدول إلى الحافظة',
    resetMarks: 'استعادة الدرجات الأصلية',
    saveSheet: 'حفظ السجل',

    // Division options
    divideBy: 'القسمة على:',
    quickDivide: 'قسمة سريعة:',
    customDivisor: 'رقم مخصص...',
    scaleFromTo: 'تحويل مقياس الدرجة:',
    scaleFrom: 'الدرجة العظمى الحالية:',
    scaleTo: 'الدرجة العظمى المطلوبة:',
    roundingRule: 'قاعدة التقريب:',
    roundInteger: 'عدد صحيح (بدون كسور)',
    roundHalf: 'نصف درجة (0.5)',
    roundTwoDecimals: 'رقمين عشريين (.00)',
    roundExact: 'القيمة الدقيقة (مع الكسور)',
    applyDivision: 'تطبيق القسمة على جميع الدرجات',
    dividedNotice: 'تمت قسمة جميع الدرجات على {divisor}',

    // Table headers
    thSeq: 'ت',
    thName: 'اسم الطالب الرباعي',
    thOriginalMark: 'الدرجة الأصلية',
    thDivisor: 'القسمة',
    thFinalMark: 'الدرجة النهائية',
    thPercentage: 'النسبة %',
    thStatus: 'التقدير',
    thNotes: 'ملاحظات',

    // Statuses
    excellent: 'ممتاز (٩٠-١٠٠)',
    veryGood: 'جيد جداً (٨٠-٨٩)',
    good: 'جيد (٧٠-٧٩)',
    medium: 'متوسط (٦٠-٦٩)',
    acceptable: 'مقبول (٥٠-٥٩)',
    failed: 'راسب (< ٥٠)',
    notGraded: 'غير مرصود',

    // Stats
    statAverage: 'معدل الشعبة',
    statHighest: 'أعلى درجة',
    statLowest: 'أدنى درجة',
    statPassRate: 'نسبة النجاح',
    statGradedCount: 'الطلاب المرصود لهم',

    // Voice Modal
    voiceModalTitle: 'تسجيل الصوت لرصد درجات الطلاب بالذكاء الاصطناعي',
    voiceInstructions: 'اذكر أولاً المرحلة والشعبة، ثم اذكر أسماء الطلاب ودرجاتهم. مثال: "آنيا حكيم خمسة وثلاثون، بري بلند أربعون، جوان ريبر خمسة وعشرون..."',
    voiceListening: 'الميكروفون يعمل... يتم تسجيل صوتك الآن',
    processingAI: 'الذكاء الاصطناعي يحلل الصوت ويطابق أسماء الطلاب...',
    voiceSummaryTitle: 'نتائج التعرف على الصوت',
    transcriptLabel: 'النص المكتشف (Transcript):',
    recognizedCount: 'تمت مطابقة {count} درجات مع طلاب الشعبة',
    unmatchedCount: '{count} أسماء لم يتم التعرف عليها',
    applyVoiceResults: 'تثبيت هذه الدرجات في السجل',
    retakeVoice: 'إعادة التسجيل',

    // Exams
    currentExam: 'الامتحان / النشاط:',
    newExam: 'امتحان جديد',
    examTitlePlaceholder: 'عنوان الامتحان (مثال: كويز ١، امتحان شهري...)',
    manageClasses: 'إدارة الصفوف والطلاب',
    addStudent: 'إضافة طالب',
    studentNamePh: 'اسم الطالب...',
    studentAdded: 'تمت إضافة الطالب',
  },
};

export function getTranslation(lang: Language, key: keyof typeof translations['ku'], params?: Record<string, any>): string {
  let text = (translations[lang] && translations[lang][key]) || translations['ku'][key] || key;
  if (params) {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
    });
  }
  return text;
}
