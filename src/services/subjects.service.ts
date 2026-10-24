import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { subjectsTable } from '../db/schema.js';

export function listSubjectsByClass(classId: number) {
  return db
    .select({
      id: subjectsTable.id,
      slug: subjectsTable.slug,
      shortName: subjectsTable.shortName,
      longName: subjectsTable.longName,
    })
    .from(subjectsTable)
    .where(eq(subjectsTable.classId, classId));
}
