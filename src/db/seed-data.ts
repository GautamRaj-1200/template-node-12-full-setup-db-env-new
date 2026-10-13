// Seed data: edit this file to change what gets seeded.
// The logic that inserts it lives in seed.ts.

// ─── Academic sessions ──────────────────────────────────────────────
export const SESSIONS = [
  {
    board: 'cbse',
    label: '2026-27',
    startYear: 2026,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
  },
  {
    board: 'icse',
    label: '2026-27',
    startYear: 2026,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
  },
  {
    board: 'wbbse',
    label: '2026',
    startYear: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
];

// ─── Boards and the classes each one covers ─────────────────────────
export const BOARDS = [
  {
    slug: 'icse',
    shortName: 'CISCE (ICSE/ISC)',
    longName: 'Council for the Indian School Certificate Examinations',
    classes: { from: 1, to: 12 },
  },
  {
    slug: 'cbse',
    shortName: 'CBSE',
    longName: 'Central Board of Secondary Education',
    classes: { from: 1, to: 12 },
  },
  {
    slug: 'wbbse',
    shortName: 'WBBSE',
    longName: 'West Bengal Board of Secondary Education',
    classes: { from: 1, to: 10 },
  },
  {
    slug: 'wbchse',
    shortName: 'WBCHSE',
    longName: 'West Bengal Council of Higher Secondary Education',
    classes: { from: 11, to: 12 },
  },
] as const;

export type BoardSlug = (typeof BOARDS)[number]['slug'];

// ─── Subject catalogue (names shared by every class that uses them) ─
export const SUBJECTS = {
  mathematics: { shortName: 'Maths', longName: 'Mathematics' },
  science: { shortName: 'Science', longName: 'Science' },
  physics: { shortName: 'Physics', longName: 'Physics' },
  chemistry: { shortName: 'Chemistry', longName: 'Chemistry' },
  biology: { shortName: 'Biology', longName: 'Biology' },
  'physical-science': { shortName: 'Physical Science', longName: 'Physical Science' },
  'life-science': { shortName: 'Life Science', longName: 'Life Science' },
  computer: { shortName: 'Computer', longName: 'Computer' },
  'computer-science': { shortName: 'Computer Science', longName: 'Computer Science' },
  'ai-robotics': { shortName: 'AI & Robotics', longName: 'Artificial Intelligence and Robotics' },
} as const;

export type SubjectSlug = keyof typeof SUBJECTS;

// ─── Which subjects each board teaches in which classes ─────────────
// Rules can overlap; a class gets the union of all matching rules.
const SENIOR: SubjectSlug[] = [
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'computer-science',
];

export const SUBJECT_RULES: {
  board: BoardSlug;
  from: number;
  to: number;
  subjects: SubjectSlug[];
}[] = [
  // CBSE
  { board: 'cbse', from: 1, to: 10, subjects: ['mathematics', 'science', 'computer'] },
  { board: 'cbse', from: 11, to: 12, subjects: SENIOR },

  // CISCE: Science splits into Physics, Chemistry, Biology from Class 6
  { board: 'icse', from: 1, to: 5, subjects: ['mathematics', 'science', 'computer'] },
  {
    board: 'icse',
    from: 6,
    to: 10,
    subjects: ['mathematics', 'physics', 'chemistry', 'biology', 'computer'],
  },
  { board: 'icse', from: 8, to: 8, subjects: ['ai-robotics'] }, // from the AI & Robotics book provided
  { board: 'icse', from: 11, to: 12, subjects: SENIOR },

  // West Bengal: Madhyamik (9–10) has Physical Science and Life Science
  { board: 'wbbse', from: 1, to: 8, subjects: ['mathematics', 'science', 'computer'] },
  {
    board: 'wbbse',
    from: 9,
    to: 10,
    subjects: ['mathematics', 'physical-science', 'life-science', 'computer'],
  },
  { board: 'wbchse', from: 11, to: 12, subjects: SENIOR },
];

// ─── Syllabus: chapters per session, board, class and subject ───────
// Array order = chapter position. Only real chapters are listed; model
// papers, worksheets, test papers, glossary, projects etc. are left out.
export const SYLLABUS: {
  session: string;
  board: BoardSlug;
  class: number;
  subjects: Partial<Record<SubjectSlug, string[]>>;
}[] = [
  {
    session: '2026-27',
    board: 'icse',
    class: 8,
    subjects: {
      mathematics: [
        'Rational Numbers',
        'Exponents and Powers',
        'Squares and Square Roots',
        'Cubes and Cube Roots',
        'Playing with Numbers',
        'Operations on Sets',
        'Percentage and its Applications',
        'Simple and Compound Interest',
        'Direct and Inverse Variation',
        'Algebraic Expressions and Identities',
        'Factorisation',
        'Linear Equations and Inequalities in One Variable',
        'Understanding Shapes',
        'Construction of Quadrilaterals',
        'Circle',
        'Coordinate System and Graphs',
        'Symmetry, Reflection and Rotation',
        'Visualising Solid Shapes',
        'Mensuration',
        'Data Handling',
      ],
      physics: [
        'Matter',
        'Physical Quantities and Measurement',
        'Force and Pressure',
        'Energy',
        'Light Energy',
        'Heat Transfer',
        'Sound',
        'Electricity',
      ],
      chemistry: [
        'Matter',
        'Physical and Chemical Changes',
        'Elements, Compounds and Mixtures',
        'Atomic Structure',
        'Language of Chemistry: Chemical Equations',
        'Chemical Reactions',
        'Hydrogen',
        'Water',
        'Carbon and its Compounds',
      ],
      biology: [
        'Transport of Food and Minerals in Plants',
        'Reproduction in Plants and Animals',
        'Ecosystems',
        'Human Body—Endocrine, Circulatory and Nervous Systems',
        'Health and Hygiene',
        'Food Production',
      ],
      computer: [
        'Operating System',
        'Spreadsheet—Functions and Charts',
        'Algorithms and Flowcharts',
        'Program Coding',
        'Conditional, Looping and Jump Statements in Java',
        'App Development',
        'Computer Networking',
        'Cloud Computing',
      ],
      'ai-robotics': [
        'Stages of AI Project Cycle',
        'The World of Robots: Ethics, Laws and Future',
        'Robot as a System',
        'Introduction to Google Teachable Machine',
        'Building Projects with Google Teachable Machine',
        'Sensors, Logic and Maze Navigation',
      ],
    },
  },
];
