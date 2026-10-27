import {
  snakeCase,
  integer,
  varchar,
  date,
  text,
  boolean,
  timestamp,
  unique,
  primaryKey,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

// Schemas
export const academicSyllabus = snakeCase.schema('academic_syllabus');
export const teaching = snakeCase.schema('teaching');
export const batchRole = teaching.enum('batch_role', ['teacher', 'student']);

// Shared timestamp columns
const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()), // only fires for updates made through Drizzle
};

// ─── Boards ─────────────────────────────────────────────────────────
export const boardsTable = academicSyllabus.table('boards', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  slug: varchar({ length: 20 }).notNull().unique(), // icse -- never change once created
  shortName: varchar({ length: 30 }).notNull().unique(), // CISCE (ICSE/ISC)
  longName: text(), // Council for the Indian School Certificate Examinations

  isActive: boolean().notNull().default(true),

  ...timestamps,
});

// ─── Academic sessions (each board has its own calendar) ────────────
// CBSE / CISCE: April–March, labelled '2026-27'
// WBBSE:        January–December, labelled '2026'
export const academicSessionsTable = academicSyllabus.table(
  'academic_sessions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    boardId: integer()
      .notNull()
      .references(() => boardsTable.id, { onDelete: 'restrict' }),

    label: varchar({ length: 7 }).notNull(), // '2026-27' or '2026'
    startYear: integer().notNull(), // 2026 -- for sorting & comparing
    startDate: date().notNull(),
    endDate: date().notNull(),

    ...timestamps,
  },
  (t) => [
    unique().on(t.boardId, t.label),
    unique().on(t.boardId, t.startYear),
    // label is either '2026' or '2026-27', matching startYear
    check(
      'academic_sessions_label_matches_start_year',
      sql`${t.label} = ${t.startYear}::text OR ${t.label} = ${t.startYear}::text || '-' || lpad(((${t.startYear} + 1) % 100)::text, 2, '0')`,
    ),
    check('academic_sessions_end_after_start', sql`${t.endDate} > ${t.startDate}`),
  ],
);

// ─── Classes ────────────────────────────────────────────────────────
export const classesTable = academicSyllabus.table(
  'classes',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // Classes belong to a board because each board has its own subjects and chapters.
    boardId: integer()
      .notNull()
      .references(() => boardsTable.id, { onDelete: 'restrict' }),

    class: integer().notNull(),

    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (t) => [
    unique().on(t.boardId, t.class), // needed by the seed's onConflictDoNothing
    check('classes_class_range', sql`${t.class} BETWEEN 1 AND 12`),
  ],
);

// ─── Subjects ───────────────────────────────────────────────────────
export const subjectsTable = academicSyllabus.table(
  'subjects',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    classId: integer()
      .notNull()
      .references(() => classesTable.id, { onDelete: 'restrict' }),

    slug: varchar({ length: 100 }).notNull(), // mathematics
    shortName: varchar({ length: 30 }).notNull(), // Maths
    longName: varchar({ length: 100 }).notNull(), // Mathematics

    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (t) => [
    // Unique within a class, not globally: every class has its own "Mathematics".
    unique().on(t.classId, t.slug),
    unique().on(t.classId, t.longName),
  ],
);

// ─── Chapters (catalogue of every chapter a subject has ever had) ───
export const chaptersTable = academicSyllabus.table(
  'chapters',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    subjectId: integer()
      .notNull()
      .references(() => subjectsTable.id, { onDelete: 'restrict' }),

    slug: varchar({ length: 100 }).notNull(), // quadratic-equations
    name: varchar({ length: 150 }).notNull(), // Quadratic Equations

    ...timestamps,
  },
  (t) => [
    // Unique within a subject, not globally.
    unique().on(t.subjectId, t.slug),
    unique().on(t.subjectId, t.name),
    // Required so syllabus_chapters can reference (id, subject_id) as a pair.
    unique().on(t.id, t.subjectId),
  ],
);

// ─── Syllabus: which chapters a subject has in a session, in order ──
export const syllabusChaptersTable = academicSyllabus.table(
  'syllabus_chapters',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sessionId: integer()
      .notNull()
      .references(() => academicSessionsTable.id, { onDelete: 'restrict' }),
    chapterId: integer().notNull(),
    subjectId: integer().notNull(), // copied from the chapter; kept honest by the composite FK
    position: integer().notNull(),

    ...timestamps,
  },
  (t) => [
    unique().on(t.sessionId, t.chapterId),
    // No two chapters of the same subject share a position in a session.
    unique().on(t.subjectId, t.sessionId, t.position),
    // The (chapter, subject) pair must exist together in chapters.
    foreignKey({
      columns: [t.chapterId, t.subjectId],
      foreignColumns: [chaptersTable.id, chaptersTable.subjectId],
    }).onDelete('restrict'),
    check('syllabus_chapters_position_positive', sql`${t.position} > 0`),
  ],
);

// Local user records can be linked to an external auth provider later.
export const usersTable = academicSyllabus.table('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar({ length: 100 }).notNull(),
  middleName: varchar({ length: 100 }),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  classId: integer().references(() => classesTable.id, { onDelete: 'restrict' }),
  // System-wide admin. Teacher/student roles are per batch (batch_members.role).
  isAdmin: boolean().notNull().default(false),
  ...timestamps,
});

export const filesTable = academicSyllabus.table('files', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fileKey: text().notNull().unique(),
  uploadedBy: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'restrict' }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const booksTable = academicSyllabus.table('books', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  syllabusChapterId: integer()
    .notNull()
    .unique()
    .references(() => syllabusChaptersTable.id, { onDelete: 'restrict' }),
  fileId: integer()
    .notNull()
    .unique()
    .references(() => filesTable.id, { onDelete: 'restrict' }),
  ...timestamps,
});

// A batch can span boards, classes, and subjects through its assigned session/subject pairs.
export const batchesTable = teaching.table('batches', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 150 }).notNull(),
  createdBy: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'restrict' }),
  ...timestamps,
});

export const batchSubjectsTable = teaching.table(
  'batch_subjects',
  {
    batchId: integer()
      .notNull()
      .references(() => batchesTable.id, { onDelete: 'cascade' }),
    sessionId: integer()
      .notNull()
      .references(() => academicSessionsTable.id, { onDelete: 'restrict' }),
    subjectId: integer()
      .notNull()
      .references(() => subjectsTable.id, { onDelete: 'restrict' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.batchId, t.sessionId, t.subjectId] })],
);

export const batchMembersTable = teaching.table(
  'batch_members',
  {
    batchId: integer()
      .notNull()
      .references(() => batchesTable.id, { onDelete: 'cascade' }),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict' }),
    role: batchRole().notNull(),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.batchId, t.userId] })],
);
