import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import {
  academicSessionsTable,
  chaptersTable,
  classesTable,
  subjectsTable,
  syllabusChaptersTable,
} from '../db/schema.js';
import { ApiError } from '../utils/ApiError.js';

export async function listSyllabusChapters(sessionId: number, subjectId: number) {
  const [session] = await db
    .select({ boardId: academicSessionsTable.boardId })
    .from(academicSessionsTable)
    .where(eq(academicSessionsTable.id, sessionId))
    .limit(1);

  if (!session) throw new ApiError(404, 'Academic session not found');

  const [subject] = await db
    .select({ boardId: classesTable.boardId })
    .from(subjectsTable)
    .innerJoin(classesTable, eq(subjectsTable.classId, classesTable.id))
    .where(eq(subjectsTable.id, subjectId))
    .limit(1);

  if (!subject) throw new ApiError(404, 'Subject not found');
  if (session.boardId !== subject.boardId) {
    throw new ApiError(400, 'Subject and academic session must belong to the same board');
  }

  return db
    .select({
      id: chaptersTable.id,
      slug: chaptersTable.slug,
      name: chaptersTable.name,
      position: syllabusChaptersTable.position,
    })
    .from(syllabusChaptersTable)
    .innerJoin(chaptersTable, eq(syllabusChaptersTable.chapterId, chaptersTable.id))
    .where(
      and(
        eq(syllabusChaptersTable.sessionId, sessionId),
        eq(syllabusChaptersTable.subjectId, subjectId),
      ),
    )
    .orderBy(asc(syllabusChaptersTable.position));
}
