import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload limit for audio recording blobs
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared Gemini client with telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface CandidateStudent {
  id: string;
  name: string;
  sectionId?: string;
  gradeId?: string;
}

export interface CandidateSection {
  id: string;
  label: string;
  gradeName: string;
  gradeId: string;
}

/**
 * Robust helper to call Gemini API with retries and fallback models
 * to seamlessly handle 503 (High demand/UNAVAILABLE) and 429 (Rate limit) errors.
 */
async function generateContentWithFallback(params: any) {
  const isJsonMode = params?.config?.responseMimeType === 'application/json' || !!params?.config?.responseSchema;
  const models = isJsonMode
    ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite']
    : ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Gemini Request] Trying model "${model}" (attempt ${attempt}/3)...`);
        const response = await ai.models.generateContent({
          ...params,
          model,
        });

        if (response && response.text) {
          console.log(`[Gemini Request] Success with model "${model}" on attempt ${attempt}.`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || '').toLowerCase();
        const is503 = errMsg.includes('503') || errMsg.includes('unavailable') || errMsg.includes('high demand');
        const is429 = errMsg.includes('429') || errMsg.includes('resource_exhausted') || errMsg.includes('rate limit');

        console.warn(`[Gemini Request] Attempt ${attempt} with model "${model}" failed:`, err?.message || err);

        if ((is503 || is429) && attempt < 3) {
          // Exponential backoff delay: 1200ms, 2400ms
          await new Promise((res) => setTimeout(res, attempt * 1200));
          continue;
        }
        // Move to the next fallback model
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini AI model attempts failed.');
}

/**
 * Normalizes Kurdish (Badini / Kurmanji / Sorani) and Arabic number words to standard numeric values,
 * specifically handling halves ("و نیڤ" -> +0.5).
 */
export function parseKurdishNumberText(input: any): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }
  if (!input) return null;
  let s = String(input).trim().toLowerCase();

  // Replace Eastern Arabic numerals
  s = s
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٫,]/g, '.');

  // Direct number check (e.g., "1.5", "2", "35")
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    return parseFloat(s);
  }

  let hasHalf = false;
  if (
    s.includes('نیڤ') ||
    s.includes('نيڤ') ||
    s.includes('نصف') ||
    s.includes('نیف') ||
    s.includes('نيف') ||
    s.includes('half')
  ) {
    hasHalf = true;
    s = s
      .replace(/و\s*(نیڤ|نيڤ|نصف|نیف|نيف|half)/g, '')
      .replace(/(نیڤ|نيڤ|نصف|نیف|نيف|half)/g, '')
      .trim();
  }

  // Base Kurdish & Arabic numbers dictionary
  const dictionary: Record<string, number> = {
    'سفر': 0, 'صفر': 0,
    'ئێک': 1, 'ئێك': 1, 'ێک': 1, 'یک': 1, 'ئیک': 1, 'واحد': 1,
    'دوو': 2, 'دو': 2, 'دوە': 2, 'اثنين': 2, 'اثنان': 2,
    'سێ': 3, 'سێیە': 3, 'ثلاثة': 3, 'تلاتة': 3,
    'چار': 4, 'چوار': 4, 'چوارە': 4, 'أربعة': 4, 'اربعه': 4,
    'پێنج': 5, 'پێنجە': 5, 'خمسة': 5,
    'شەش': 6, 'شەشە': 6, 'ستة': 6,
    'حەفت': 7, 'حەوت': 7, 'سبعة': 7,
    'هەشت': 8, 'هەشتە': 8, 'ثمانية': 8, 'تمانية': 8,
    'نەهـ': 9, 'نەه': 9, 'نۆ': 9, 'تسعة': 9,
    'دەهـ': 10, 'دەه': 10, 'دە': 10, 'عشرة': 10,
    'یازدە': 11, 'یازدەهـ': 11, 'أحد عشر': 11, 'دعش': 11,
    'دوازدە': 12, 'دوازدەهـ': 12, 'اثنا عشر': 12, 'طنعش': 12,
    'سێزدە': 13, 'ثلاثة عشر': 13,
    'چاردە': 14, 'چواردە': 14, 'أربعة عشر': 14,
    'پازدە': 15, 'خمسة عشر': 15,
    'شازدە': 16, 'ستة عشر': 16,
    'حەفدە': 17, 'حەڤدە': 17, 'سبعة عشر': 17,
    'هەژدە': 18, 'ثمانية عشر': 18,
    'نۆزدە': 19, 'تسعة عشر': 19,
    'بیست': 20, 'عشرون': 20, 'عشرين': 20,
    'سیهـ': 30, 'سیه': 30, 'سی': 30, 'ثلاثون': 30, 'ثلاثين': 30,
    'چل': 40, 'أربعون': 40, 'اربعين': 40,
    'پێنجی': 50, 'پەنجا': 50, 'خمسون': 50, 'خمسين': 50,
    'شێست': 60, 'شەست': 60, 'ستون': 60, 'ستين': 60,
    'حەفتێ': 70, 'سبعون': 70, 'سبعين': 70,
    'هەشتێ': 80, 'ثمانون': 80, 'ثمانين': 80,
    'نۆت': 90, 'نەوەد': 90, 'تسعون': 90, 'تسعين': 90,
    'سەد': 100, 'مئة': 100, 'مية': 100, 'مائة': 100,
  };

  if (s in dictionary) {
    return dictionary[s] + (hasHalf ? 0.5 : 0);
  }

  const parts = s.split(/\s+و\s+|\s+/);
  let total = 0;
  let matchedAny = false;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed in dictionary) {
      total += dictionary[trimmed];
      matchedAny = true;
    } else if (/^\d+(\.\d+)?$/.test(trimmed)) {
      total += parseFloat(trimmed);
      matchedAny = true;
    }
  }

  if (matchedAny) {
    return total + (hasHalf ? 0.5 : 0);
  }

  if (hasHalf) {
    return 0.5;
  }

  return null;
}

// API to process voice audio for grade extraction
app.post('/api/process-voice', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      activeSectionName,
      activeGradeName,
      candidateStudents = [],
      allSections = [],
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the server environment.',
      });
    }

    // Clean base64 data
    let cleanBase64 = String(audioBase64);
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,').pop() || cleanBase64;
    }
    cleanBase64 = cleanBase64.replace(/^data:.*?;base64,/, '').replace(/[\r\n\s]+/g, '').trim();

    // Standardize mimeType
    let cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();
    if (!cleanMimeType.startsWith('audio/')) {
      cleanMimeType = 'audio/webm';
    }

    const studentsListSummary = (candidateStudents as CandidateStudent[])
      .map((s, idx) => `${idx + 1}. [ID: ${s.id}] "${s.name}"`)
      .join('\n');

    const sectionsSummary = (allSections as CandidateSection[])
      .map((sec) => `Grade: "${sec.gradeName}" / Section: "${sec.label}" (ID: ${sec.id})`)
      .join('\n');

    const promptText = `
You are an expert AI assistant specialized in Kurdish (Badini / Kurmanji / Sorani dialects) and Arabic speech understanding for school gradebooks.

The teacher has recorded their voice while grading students in school.
The teacher may:
1. Announce the Stage/Grade (قۆناغ/پۆل) and Section (هۆبە/پشک) at the start or during the speech (e.g. "قۆناغا دەهـ هۆبا أ", "پۆلا دوازدێ هۆبا ب", "الصف الحادي عشر شعبة ج", "هۆبا دال", etc.).
2. Speak student names and their marks/grades.

CRITICAL KURDISH BADINI NUMBER CONVERSION RULES (VERY IMPORTANT):
The teacher frequently uses Kurdish number words and half-numbers ("نیڤ" = 0.5). You MUST convert them to exact numbers:
- "ئێک" (or "ئێك", "یک") = 1
- "دوو" (or "دو") = 2
- "سێ" = 3
- "چار" (or "چوار") = 4
- "پێنج" = 5
- "شەش" = 6
- "حەفت" (or "حەوت") = 7
- "هەشت" = 8
- "نەهـ" (or "نەه", "نۆ") = 9
- "دەهـ" (or "دە") = 10
- "ئێک و نیڤ" = 1.5
- "دوو و نیڤ" = 2.5
- "سێ و نیڤ" = 3.5
- "چار و نیڤ" = 4.5
- "پێنج و نیڤ" = 5.5
- "شەش و نیڤ" = 6.5
- "حەفت و نیڤ" = 7.5
- "هەشت و نیڤ" = 8.5
- "نەهـ و نیڤ" = 9.5
- "دەهـ و نیڤ" = 10.5
- "یازدە" = 11, "یازدە و نیڤ" = 11.5
- "دوازدە" = 12, "دوازدە و نیڤ" = 12.5
- "سێزدە" = 13, "سێزدە و نیڤ" = 13.5
- "چاردە" = 14, "چاردە و نیڤ" = 14.5
- "پازدە" = 15, "پازدە و نیڤ" = 15.5
- "بیست" = 20, "بیست و ئێک" = 21, "بیست و پێنج" = 25, "بیست و پێنج و نیڤ" = 25.5
- "سیهـ" = 30, "سیهـ و پێنج" = 35, "سیهـ و سێ و نیڤ" = 33.5
- "چل" = 40, "چل و ئێک" = 41, "چل و پێنج" = 45
- "سفر" = 0, "سفر و نیڤ" / "نیڤ" = 0.5

The extracted "mark" in the JSON results MUST be a decimal float or integer number. NEVER return words or strings for mark.

Active selected Stage: "${activeGradeName || 'Not pre-selected'}"
Active selected Section: "${activeSectionName || 'Not pre-selected'}"

Available Sections in school:
${sectionsSummary}

Candidate Students in current/active section:
${studentsListSummary}

YOUR TASKS:
1. Provide a clean transcript of what the teacher spoke in the original language/dialect (Kurdish/Arabic).
2. Detect if the teacher mentioned a specific Grade and Section in their speech.
3. For every student mentioned and their mark:
   - Match the spoken name to the closest candidate student from the list above.
   - Extract the numeric mark strictly following the conversion rules above.
   - If a student cannot be matched to the candidate list, include them in "unmatched".

Return JSON conforming strictly to the requested schema.
`;

    // Call Gemini using the retry + fallback helper
    const response = await generateContentWithFallback({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanMimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.STRING,
              description: 'The full text transcription of what the teacher spoke in Kurdish/Arabic',
            },
            detectedGrade: {
              type: Type.STRING,
              description: 'Detected school grade/stage if mentioned in voice, e.g. "10", "11", "12", or null',
            },
            detectedSection: {
              type: Type.STRING,
              description: 'Detected section if mentioned in voice, e.g. "أ", "ب", "ج", "د", "هـ", "و", "ز", or null',
            },
            results: {
              type: Type.ARRAY,
              description: 'List of successfully recognized student grades',
              items: {
                type: Type.OBJECT,
                properties: {
                  spokenName: { type: Type.STRING },
                  matchedStudentId: { type: Type.STRING, description: 'The exact ID from candidate list if matched' },
                  matchedStudentName: { type: Type.STRING, description: 'The full name from candidate list if matched' },
                  mark: { type: Type.NUMBER, description: 'The extracted numeric mark' },
                  confidence: { type: Type.NUMBER, description: 'Confidence between 0 and 1' },
                  note: { type: Type.STRING, description: 'Any extra note or clarification' },
                },
                required: ['spokenName', 'mark'],
              },
            },
            unmatched: {
              type: Type.ARRAY,
              description: 'Names or marks that could not be mapped to known students in the active section',
              items: {
                type: Type.OBJECT,
                properties: {
                  spokenName: { type: Type.STRING },
                  mark: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['spokenName', 'mark'],
              },
            },
          },
          required: ['transcript', 'results'],
        },
      },
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);

    // Safety normalization on numeric marks
    if (Array.isArray(parsed.results)) {
      parsed.results.forEach((item: any) => {
        if (typeof item.mark !== 'number' || isNaN(item.mark)) {
          const parsedNum = parseKurdishNumberText(item.mark || item.note || item.spokenName);
          if (parsedNum !== null) item.mark = parsedNum;
        }
      });
    }

    if (Array.isArray(parsed.unmatched)) {
      parsed.unmatched.forEach((item: any) => {
        if (typeof item.mark !== 'number' || isNaN(item.mark)) {
          const parsedNum = parseKurdishNumberText(item.mark || item.reason || item.spokenName);
          if (parsedNum !== null) item.mark = parsedNum;
        }
      });
    }

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error processing audio with Gemini:', err);
    const errString = String(err?.message || err || '');
    let friendlyError = 'خەلەتیەک چێبوو د دەمێ راڤەکرنا دەنگی دا.';

    if (errString.includes('503') || errString.includes('high demand') || errString.includes('UNAVAILABLE')) {
      friendlyError = 'سەرڤەرێ ژیرییا دەستکرد (Gemini) نوکە ل ژێر قەرەبالغیەکا کاتی دایە. تکایە دووبارە ل سەر دوگما "دووبارە راڤەبکە" بدە یان فایلا دەنگی باربکە.';
    } else if (errString.includes('429') || errString.includes('rate limit')) {
      friendlyError = 'ژمارا داخازیان زۆر بوو. تکایە چەند چڕکان بپێڤە و دووبارە کلیک بکە.';
    }

    return res.status(500).json({
      success: false,
      error: friendlyError,
    });
  }
});

// API for text dictation fallback
app.post('/api/process-text', async (req, res) => {
  try {
    const {
      text,
      activeSectionName,
      activeGradeName,
      candidateStudents = [],
      allSections = [],
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment.',
      });
    }

    const studentsListSummary = (candidateStudents as CandidateStudent[])
      .map((s, idx) => `${idx + 1}. [ID: ${s.id}] "${s.name}"`)
      .join('\n');

    const sectionsSummary = (allSections as CandidateSection[])
      .map((sec) => `Grade: "${sec.gradeName}" / Section: "${sec.label}" (ID: ${sec.id})`)
      .join('\n');

    const promptText = `
You are an expert AI assistant specialized in Kurdish and Arabic speech/text understanding for school gradebooks.
The teacher dictated or typed the following text containing student names and marks:
"""
${text}
"""

CRITICAL KURDISH BADINI NUMBER CONVERSION RULES:
- "ئێک" = 1
- "دوو" = 2
- "سێ" = 3
- "چار" = 4
- "پێنج" = 5
- "شەش" = 6
- "حەفت" = 7
- "هەشت" = 8
- "نەهـ" = 9
- "دەهـ" = 10
- "ئێک و نیڤ" = 1.5
- "دوو و نیڤ" = 2.5
- "سێ و نیڤ" = 3.5
- "چار و نیڤ" = 4.5
- "پێنج و نیڤ" = 5.5
- "شەش و نیڤ" = 6.5
- "حەفت و نیڤ" = 7.5
- "هەشت و نیڤ" = 8.5
- "نەهـ و نیڤ" = 9.5
- "دەهـ و نیڤ" = 10.5

The extracted "mark" in the JSON results MUST be a decimal float or integer number.

Active selected Stage: "${activeGradeName || 'Not pre-selected'}"
Active selected Section: "${activeSectionName || 'Not pre-selected'}"

Available Sections:
${sectionsSummary}

Candidate Students in active section:
${studentsListSummary}

Parse the text, detect if a grade/section was mentioned, match each student name to the candidate student list, and extract the numeric marks.
`;

    const response = await generateContentWithFallback({
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            detectedGrade: { type: Type.STRING },
            detectedSection: { type: Type.STRING },
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  spokenName: { type: Type.STRING },
                  matchedStudentId: { type: Type.STRING },
                  matchedStudentName: { type: Type.STRING },
                  mark: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  note: { type: Type.STRING },
                },
                required: ['spokenName', 'mark'],
              },
            },
            unmatched: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  spokenName: { type: Type.STRING },
                  mark: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['spokenName', 'mark'],
              },
            },
          },
          required: ['transcript', 'results'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Safety normalization on numeric marks
    if (Array.isArray(parsed.results)) {
      parsed.results.forEach((item: any) => {
        if (typeof item.mark !== 'number' || isNaN(item.mark)) {
          const parsedNum = parseKurdishNumberText(item.mark || item.note || item.spokenName);
          if (parsedNum !== null) item.mark = parsedNum;
        }
      });
    }

    if (Array.isArray(parsed.unmatched)) {
      parsed.unmatched.forEach((item: any) => {
        if (typeof item.mark !== 'number' || isNaN(item.mark)) {
          const parsedNum = parseKurdishNumberText(item.mark || item.reason || item.spokenName);
          if (parsedNum !== null) item.mark = parsedNum;
        }
      });
    }

    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error processing text with Gemini:', err);
    return res.status(500).json({
      success: false,
      error: 'خەلەتیەک چێبوو د دەمێ راڤەکرنا دەقی دا. تکایە دووبارە بکەڤە.',
    });
  }
});

// Mount Vite middleware for dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
