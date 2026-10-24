import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { classesTable } from '../db/schema.js';

export function listClassesByBoard(boardId: number) {
  return db
    .select({
      id: classesTable.id,
      class: classesTable.class,
    })
    .from(classesTable)
    .where(eq(classesTable.boardId, boardId));
}
