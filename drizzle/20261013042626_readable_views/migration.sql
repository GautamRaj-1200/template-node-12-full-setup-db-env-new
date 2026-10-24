-- Custom SQL migration file, put your code below! --

-- Readable views: names alongside ids, so you never have to guess which id is which.
-- Ids are kept as columns so you can still copy them into queries or seeds.

-- Classes with their board
CREATE OR REPLACE VIEW academic_syllabus.v_classes AS
SELECT
  c.id          AS class_id,
  b.short_name  AS board,
  c.class,
  c.is_active,
  b.id          AS board_id
FROM academic_syllabus.classes c
JOIN academic_syllabus.boards b ON b.id = c.board_id
ORDER BY b.short_name, c.class;

-- Sessions with their board
CREATE OR REPLACE VIEW academic_syllabus.v_sessions AS
SELECT
  s.id          AS session_id,
  b.short_name  AS board,
  s.label       AS session,
  s.start_date,
  s.end_date,
  b.id          AS board_id
FROM academic_syllabus.academic_sessions s
JOIN academic_syllabus.boards b ON b.id = s.board_id
ORDER BY b.short_name, s.start_year;

-- Subjects with board and class
CREATE OR REPLACE VIEW academic_syllabus.v_subjects AS
SELECT
  sub.id         AS subject_id,
  b.short_name   AS board,
  c.class,
  sub.long_name  AS subject,
  sub.slug       AS subject_slug,
  sub.is_active,
  c.id           AS class_id,
  b.id           AS board_id
FROM academic_syllabus.subjects sub
JOIN academic_syllabus.classes c ON c.id = sub.class_id
JOIN academic_syllabus.boards  b ON b.id = c.board_id
ORDER BY b.short_name, c.class, sub.long_name;

-- Chapters with board, class and subject (the full catalogue, any session)
CREATE OR REPLACE VIEW academic_syllabus.v_chapters AS
SELECT
  ch.id          AS chapter_id,
  b.short_name   AS board,
  c.class,
  sub.long_name  AS subject,
  ch.name        AS chapter,
  ch.slug        AS chapter_slug,
  sub.id         AS subject_id
FROM academic_syllabus.chapters ch
JOIN academic_syllabus.subjects sub ON sub.id = ch.subject_id
JOIN academic_syllabus.classes  c   ON c.id = sub.class_id
JOIN academic_syllabus.boards   b   ON b.id = c.board_id
ORDER BY b.short_name, c.class, sub.long_name, ch.name;

-- Syllabus: what is taught in each session, in order
CREATE OR REPLACE VIEW academic_syllabus.v_syllabus AS
SELECT
  s.label        AS session,
  b.short_name   AS board,
  c.class,
  sub.long_name  AS subject,
  sc.position,
  ch.name        AS chapter,
  s.id           AS session_id,
  sub.id         AS subject_id,
  ch.id          AS chapter_id
FROM academic_syllabus.syllabus_chapters sc
JOIN academic_syllabus.academic_sessions s   ON s.id = sc.session_id
JOIN academic_syllabus.chapters          ch  ON ch.id = sc.chapter_id
JOIN academic_syllabus.subjects          sub ON sub.id = sc.subject_id
JOIN academic_syllabus.classes           c   ON c.id = sub.class_id
JOIN academic_syllabus.boards            b   ON b.id = c.board_id
ORDER BY s.start_year, b.short_name, c.class, sub.long_name, sc.position;
