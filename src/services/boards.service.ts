import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { boardsTable } from '../db/schema.js';

export function listActiveBoards() {
  return db
    .select({
      id: boardsTable.id,
      slug: boardsTable.slug,
      shortName: boardsTable.shortName,
      longName: boardsTable.longName,
    })
    .from(boardsTable)
    .where(eq(boardsTable.isActive, true));
}
