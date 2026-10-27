import { and, eq, inArray } from 'drizzle-orm';

import { db } from './db.js'; // adjust to wherever your drizzle instance lives
import {
  academicSessionsTable,
  boardsTable,
  classesTable,
  subjectsTable,
  chaptersTable,
  syllabusChaptersTable,
  usersTable,
  batchesTable,
  batchMembersTable,
  batchSubjectsTable,
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

// Map "icse" -> board id
async function loadBoardIds(tx: Tx) {
  const rows = await tx.select({ id: boardsTable.id, slug: boardsTable.slug }).from(boardsTable);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

// Map "icse:8" -> class id
async function loadClassIds(tx: Tx) {
  const rows = await tx
    .select({ id: classesTable.id, class: classesTable.class, board: boardsTable.slug })
    .from(classesTable)
    .innerJoin(boardsTable, eq(boardsTable.id, classesTable.boardId));

  return new Map(rows.map((r) => [`${r.board}:${r.class}`, r.id]));
}

// Map "icse:2026-27" -> session id (always board + label, never label alone)
async function loadSessionIds(tx: Tx) {
  const rows = await tx
    .select({
      id: academicSessionsTable.id,
      label: academicSessionsTable.label,
      board: boardsTable.slug,
    })
    .from(academicSessionsTable)
    .innerJoin(boardsTable, eq(boardsTable.id, academicSessionsTable.boardId));

  return new Map(rows.map((r) => [`${r.board}:${r.label}`, r.id]));
}

// ─── 1. Boards ──────────────────────────────────────────────────────
async function seedBoards(tx: Tx) {
  const inserted = await tx
    .insert(boardsTable)
    .values(BOARDS.map(({ slug, shortName, longName }) => ({ slug, shortName, longName })))
    .onConflictDoNothing({ target: boardsTable.slug })
    .returning({ id: boardsTable.id });

  console.log(`Boards: ${inserted.length} inserted`);
}

// ─── 2. Sessions (per board) ────────────────────────────────────────
async function seedSessions(tx: Tx) {
  const boardIds = await loadBoardIds(tx);

  const rows = SESSIONS.map(({ board, ...session }) => {
    const boardId = boardIds.get(board);
    if (!boardId) throw new Error(`Board not found for session ${session.label}: ${board}`);
    return { boardId, ...session };
  });

  const inserted = await tx
    .insert(academicSessionsTable)
    .values(rows)
    .onConflictDoNothing({ target: [academicSessionsTable.boardId, academicSessionsTable.label] })
    .returning({ id: academicSessionsTable.id });

  console.log(`Sessions: ${inserted.length} inserted`);
}

// ─── 3. Classes (each board's own range) ────────────────────────────
async function seedClasses(tx: Tx) {
  const boardIds = await loadBoardIds(tx);

  const rows = BOARDS.flatMap((board) => {
    const boardId = boardIds.get(board.slug);
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

// ─── 5. Chapters + syllabus for each session ────────────────────────
// The syllabus in seed-data.ts is the source of truth: re-running replaces
// a subject's chapter list for that session (so reordering works).
async function seedSyllabus(tx: Tx) {
  const classIds = await loadClassIds(tx);
  const sessionIds = await loadSessionIds(tx);

  let chapterCount = 0;
  let linkCount = 0;

  for (const entry of SYLLABUS) {
    // Session is looked up by the entry's own board, so a subject can never
    // be attached to another board's session.
    const sessionId = sessionIds.get(`${entry.board}:${entry.session}`);
    if (!sessionId)
      throw new Error(`Session not found: ${entry.board} ${entry.session}. Add it to SESSIONS.`);

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

// ─── 6. Test users ───────────────────────────────────────────────────
async function seedUsers(tx: Tx) {
  const classIds = await loadClassIds(tx);
  const class8Id = classIds.get('icse:8');
  const class10Id = classIds.get('icse:10');
  if (!class8Id || !class10Id) throw new Error('ICSE classes 8 and 10 must exist');

  const users = [
    {
      email: 'gautamraj996@gmail.com',
      firstName: 'Raj',
      lastName: 'Gautam',
      classId: class8Id,
    },
    {
      email: 'gautamrajv2@gmail.com',
      firstName: 'Gautam',
      lastName: 'Raj',
      classId: null,
    },
    {
      email: 'sauravkumar050610@gmail.com',
      firstName: 'Saurav',
      middleName: 'Kumar',
      lastName: 'Singh',
      classId: class10Id,
    },
    {
      email: 'rishabhsingh30102010@gmail.com',
      firstName: 'Rishabh',
      middleName: 'Prasad',
      lastName: 'Singh',
      classId: class8Id,
    },
  ];

  const inserted = await tx
    .insert(usersTable)
    .values(users)
    .onConflictDoNothing({ target: usersTable.email })
    .returning({ id: usersTable.id });

  console.log(`Users: ${inserted.length} inserted`);
}

// ─── 7. Test batches, memberships, and assigned subjects ────────────
async function seedBatches(tx: Tx) {
  const users = await tx.select({ id: usersTable.id, email: usersTable.email }).from(usersTable);
  const userIds = new Map(users.map((user) => [user.email, user.id]));
  const teacherId = userIds.get('gautamrajv2@gmail.com');
  const rajId = userIds.get('gautamraj996@gmail.com');
  const sauravId = userIds.get('sauravkumar050610@gmail.com');
  const rishabhId = userIds.get('rishabhsingh30102010@gmail.com');
  if (!teacherId || !rajId || !sauravId || !rishabhId) {
    throw new Error('Test users must exist before seeding batches');
  }

  async function getOrCreateBatch(name: string, creatorId: number) {
    const [existing] = await tx
      .select({ id: batchesTable.id })
      .from(batchesTable)
      .where(and(eq(batchesTable.name, name), eq(batchesTable.createdBy, creatorId)))
      .limit(1);
    if (existing) return existing.id;

    const [created] = await tx
      .insert(batchesTable)
      .values({ name, createdBy: creatorId })
      .returning({ id: batchesTable.id });
    if (!created) throw new Error(`Could not create batch ${name}`);
    return created.id;
  }

  const class8BatchId = await getOrCreateBatch('ICSE CLASS 08', teacherId);
  const class10BatchId = await getOrCreateBatch('ICSE CLASS 10', teacherId);

  await tx
    .insert(batchMembersTable)
    .values([
      { batchId: class8BatchId, userId: teacherId, role: 'teacher' },
      { batchId: class8BatchId, userId: rajId, role: 'student' },
      { batchId: class8BatchId, userId: rishabhId, role: 'student' },
      { batchId: class10BatchId, userId: teacherId, role: 'teacher' },
      { batchId: class10BatchId, userId: rajId, role: 'student' },
      { batchId: class10BatchId, userId: sauravId, role: 'student' },
    ])
    .onConflictDoNothing({ target: [batchMembersTable.batchId, batchMembersTable.userId] });

  const classIds = await loadClassIds(tx);
  const sessionIds = await loadSessionIds(tx);
  const class8Id = classIds.get('icse:8');
  const sessionId = sessionIds.get('icse:2026-27');
  if (!class8Id || !sessionId) throw new Error('ICSE Class 8 and its session must exist');

  const subjectSlugs = [
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'computer',
    'ai-robotics',
  ] as const;
  const subjects = await tx
    .select({ id: subjectsTable.id, slug: subjectsTable.slug })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.classId, class8Id), inArray(subjectsTable.slug, subjectSlugs)));
  if (subjects.length !== subjectSlugs.length) {
    throw new Error('All six ICSE Class 8 subjects must exist');
  }

  await tx
    .insert(batchSubjectsTable)
    .values(
      subjects.map((subject) => ({ batchId: class8BatchId, sessionId, subjectId: subject.id })),
    )
    .onConflictDoNothing({
      target: [
        batchSubjectsTable.batchId,
        batchSubjectsTable.sessionId,
        batchSubjectsTable.subjectId,
      ],
    });

  console.log('Batches: 2 ensured, memberships: 6 ensured, Class 8 subjects: 6 ensured');
}

// ─── Run everything in one transaction, parents before children ─────
async function main() {
  await db.transaction(async (tx) => {
    await seedBoards(tx);
    await seedSessions(tx); // needs boards
    await seedClasses(tx); // needs boards
    await seedSubjects(tx); // needs classes
    await seedSyllabus(tx); // needs sessions, subjects
    await seedUsers(tx); // needs classes
    await seedBatches(tx); // needs users, sessions, subjects
  });

  console.log('Seed complete');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
