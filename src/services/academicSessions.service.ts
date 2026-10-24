import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { academicSessionsTable } from '../db/schema.js';

export function listAcademicSessionsByBoard(boardId: number) {
  return db
    .select({
      id: academicSessionsTable.id,
      label: academicSessionsTable.label,
    })
    .from(academicSessionsTable)
    .where(eq(academicSessionsTable.boardId, boardId));
}
