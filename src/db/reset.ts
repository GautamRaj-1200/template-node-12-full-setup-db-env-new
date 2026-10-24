import { sql } from 'drizzle-orm';

import { db, pool } from './db.js';

// Empties every table in academic_syllabus and restarts ids at 1.
// Tables, views and migration history are kept; run `pnpm db:seed` afterwards.
async function main() {
  await db.execute(sql`
    TRUNCATE
      academic_syllabus.syllabus_chapters,
      academic_syllabus.chapters,
      academic_syllabus.subjects,
      academic_syllabus.classes,
      academic_syllabus.academic_sessions,
      academic_syllabus.boards
    RESTART IDENTITY CASCADE
  `);

  console.log('academic_syllabus data cleared');
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
