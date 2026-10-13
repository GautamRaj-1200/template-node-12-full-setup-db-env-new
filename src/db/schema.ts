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

// Shared timestamp columns
const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()), // only fires for updates made through Drizzle
};

// Tables
export const academicSessionsTable = academicSyllabus.table(
  'academic_sessions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    label: varchar({ length: 7 }).notNull().unique(), // 2026-27
    startYear: integer().notNull().unique(), // 2026 -- for sorting & comparing
    startDate: date().notNull().unique(),
    endDate: date().notNull().unique(),

    ...timestamps,
  },
  (t) => [
    // '2026-27' must match startYear 2026
    check(
      'academic_sessions_label_matches_start_year',
      sql`${t.label} = ${t.startYear}::text || '-' || lpad(((${t.startYear} + 1) % 100)::text, 2, '0')`,
    ),
    check('academic_sessions_end_after_start', sql`${t.endDate} > ${t.startDate}`),
  ],
);

export const boardsTable = academicSyllabus.table('boards', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  slug: varchar({ length: 20 }).notNull().unique(), // cisce -- never change once created
  shortName: varchar({ length: 30 }).notNull().unique(), // CISCE (ICSE/ISC)
  longName: text(), // Council for the Indian School Certificate Examinations

  isActive: boolean().notNull().default(true),

  ...timestamps,
});

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

export const subjectsTable = academicSyllabus.table(
  'subjects',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    classId: integer()
      .notNull()
      .references(() => classesTable.id, { onDelete: 'restrict' }),

    slug: varchar({ length: 100 }).notNull(), // mathematics
    shortName: varchar({ length: 30 }).notNull(), // Math
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

export const syllabusChaptersTable = academicSyllabus.table(
  'syllabus_chapters',
  {
    sessionId: integer()
      .notNull()
      .references(() => academicSessionsTable.id, { onDelete: 'restrict' }),
    chapterId: integer().notNull(),
    subjectId: integer().notNull(), // copied from the chapter; kept honest by the composite FK
    position: integer().notNull(),

    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.chapterId] }),
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
