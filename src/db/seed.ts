import { and, eq, inArray } from 'drizzle-orm';

import { db } from './db.js'; // adjust to wherever your drizzle instance lives
import {
  academicSessionsTable,
  boardsTable,
  classesTable,
  subjectsTable,
  chaptersTable,
  syllabusChaptersTable,
} from './schema.js';
import {
  SESSIONS,
  BOARDS,
  SUBJECTS,
  SUBJECT_RULES,
  SYLLABUS,
  type SubjectSlug,
} from './seed-data.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// "Human Body—Endocrine, Circulatory & Nervous" -> "human-body-endocrine-circulatory-and-nervous"
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ─── 1. Sessions ────────────────────────────────────────────────────
async function seedSessions(tx: Tx) {
  const inserted = await tx
    .insert(academicSessionsTable)
    .values(SESSIONS)
    .onConflictDoNothing({ target: academicSessionsTable.label })
    .returning({ id: academicSessionsTable.id });

  console.log(`Sessions: ${inserted.length} inserted`);
}

// ─── 2. Boards ──────────────────────────────────────────────────────
async function seedBoards(tx: Tx) {
  const inserted = await tx
    .insert(boardsTable)
    .values(BOARDS.map(({ slug, shortName, longName }) => ({ slug, shortName, longName })))
    .onConflictDoNothing({ target: boardsTable.slug })
    .returning({ id: boardsTable.id });

  console.log(`Boards: ${inserted.length} inserted`);
}

// ─── 3. Classes (each board's own range) ────────────────────────────
async function seedClasses(tx: Tx) {
  const boards = await tx
    .select({ id: boardsTable.id, slug: boardsTable.slug })
    .from(boardsTable)
    .where(
      inArray(
        boardsTable.slug,
        BOARDS.map((b) => b.slug),
      ),
    );

  const boardIdBySlug = new Map(boards.map((b) => [b.slug, b.id]));

  const rows = BOARDS.flatMap((board) => {
    const boardId = boardIdBySlug.get(board.slug);
    if (!boardId) throw new Error(`Board not found: ${board.slug}`);

    return range(board.classes.from, board.classes.to).map((c) => ({ boardId, class: c }));
  });

  const inserted = await tx
    .insert(classesTable)
    .values(rows)
    .onConflictDoNothing({ target: [classesTable.boardId, classesTable.class] })
    .returning({ id: classesTable.id });

  console.log(`Classes: ${inserted.length} inserted`);
}

// Map "icse:8" -> class id
async function loadClassIds(tx: Tx) {
  const rows = await tx
    .select({ id: classesTable.id, class: classesTable.class, board: boardsTable.slug })
    .from(classesTable)
    .innerJoin(boardsTable, eq(boardsTable.id, classesTable.boardId));

  return new Map(rows.map((r) => [`${r.board}:${r.class}`, r.id]));
}

// ─── 4. Subjects (from SUBJECT_RULES) ───────────────────────────────
async function seedSubjects(tx: Tx) {
  const classIds = await loadClassIds(tx);

  // Union of all rules per class, so overlapping rules don't create duplicates
  const subjectsByClass = new Map<number, Set<SubjectSlug>>();

  for (const rule of SUBJECT_RULES) {
    for (const c of range(rule.from, rule.to)) {
      const classId = classIds.get(`${rule.board}:${c}`);
      if (!classId) throw new Error(`Class not found: ${rule.board} class ${c}`);

      const set = subjectsByClass.get(classId) ?? new Set<SubjectSlug>();
      rule.subjects.forEach((s) => set.add(s));
      subjectsByClass.set(classId, set);
    }
  }

  const rows = [...subjectsByClass].flatMap(([classId, slugs]) =>
    [...slugs].map((slug) => ({ classId, slug, ...SUBJECTS[slug] })),
  );

  const inserted = await tx
    .insert(subjectsTable)
    .values(rows)
    .onConflictDoNothing({ target: [subjectsTable.classId, subjectsTable.slug] })
    .returning({ id: subjectsTable.id });

  console.log(`Subjects: ${inserted.length} inserted`);
}

// ─── 5 & 6. Chapters + syllabus for each session ────────────────────
// The syllabus in seed-data.ts is the source of truth: re-running replaces
// a subject's chapter list for that session (so reordering works).
async function seedSyllabus(tx: Tx) {
  const classIds = await loadClassIds(tx);

  const sessions = await tx
    .select({ id: academicSessionsTable.id, label: academicSessionsTable.label })
    .from(academicSessionsTable);
  const sessionIdByLabel = new Map(sessions.map((s) => [s.label, s.id]));

  let chapterCount = 0;
  let linkCount = 0;

  for (const entry of SYLLABUS) {
    const sessionId = sessionIdByLabel.get(entry.session);
    if (!sessionId) throw new Error(`Session not found: ${entry.session}`);

    const classId = classIds.get(`${entry.board}:${entry.class}`);
    if (!classId) throw new Error(`Class not found: ${entry.board} class ${entry.class}`);

    for (const [subjectSlug, chapterNames] of Object.entries(entry.subjects)) {
      if (!chapterNames?.length) continue;

      const [subject] = await tx
        .select({ id: subjectsTable.id })
        .from(subjectsTable)
        .where(and(eq(subjectsTable.classId, classId), eq(subjectsTable.slug, subjectSlug)));

      if (!subject) {
        throw new Error(
          `Subject "${subjectSlug}" not found for ${entry.board} class ${entry.class}. Add it to SUBJECT_RULES.`,
        );
      }

      // Chapters: the catalogue, kept even if later dropped from a syllabus
      const chapterRows = chapterNames.map((name) => ({
        subjectId: subject.id,
        slug: slugify(name),
        name,
      }));

      const inserted = await tx
        .insert(chaptersTable)
        .values(chapterRows)
        .onConflictDoNothing({ target: [chaptersTable.subjectId, chaptersTable.slug] })
        .returning({ id: chaptersTable.id });
      chapterCount += inserted.length;

      const chapters = await tx
        .select({ id: chaptersTable.id, slug: chaptersTable.slug })
        .from(chaptersTable)
        .where(
          and(
            eq(chaptersTable.subjectId, subject.id),
            inArray(
              chaptersTable.slug,
              chapterRows.map((c) => c.slug),
            ),
          ),
        );
      const chapterIdBySlug = new Map(chapters.map((c) => [c.slug, c.id]));

      // Replace this subject's list for this session
      await tx
        .delete(syllabusChaptersTable)
        .where(
          and(
            eq(syllabusChaptersTable.sessionId, sessionId),
            eq(syllabusChaptersTable.subjectId, subject.id),
          ),
        );

      await tx.insert(syllabusChaptersTable).values(
        chapterRows.map((c, index) => ({
          sessionId,
          subjectId: subject.id,
          chapterId: chapterIdBySlug.get(c.slug)!,
          position: index + 1,
        })),
      );
      linkCount += chapterRows.length;
    }
  }

  console.log(`Chapters: ${chapterCount} inserted, syllabus links: ${linkCount} written`);
}

// ─── Run everything in one transaction, parents before children ─────
async function main() {
  await db.transaction(async (tx) => {
    await seedSessions(tx);
    await seedBoards(tx);
    await seedClasses(tx);
    await seedSubjects(tx);
    await seedSyllabus(tx);
  });

  console.log('Seed complete');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
