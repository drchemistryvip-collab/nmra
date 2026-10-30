import rawSchoolData from './schoolData.json';
import { Grade, Section, SchoolInfo } from '../types';

export const initialSchoolInfo: SchoolInfo = {
  teacher: rawSchoolData.info.teacher || 'هاریکار ژ لایێ خودایێ مەزن ڤە',
  subject: rawSchoolData.info.subject || 'التربية الإسلامية',
  school: rawSchoolData.info.school || 'اعدادية ئاكري المختلطة',
  subjects: rawSchoolData.info.subjects || ['التربية الإسلامية'],
};

export const initialGrades: Grade[] = rawSchoolData.grades || [
  { id: 'g10', name: '10' },
  { id: 'g11', name: 'الحادي عشر' },
  { id: 'g12', name: 'الثاني عشر' },
];

export const initialSections: Section[] = (rawSchoolData.sections as Section[]) || [];
