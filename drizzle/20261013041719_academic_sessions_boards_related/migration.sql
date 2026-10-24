ALTER TABLE "academic_syllabus"."academic_sessions" DROP CONSTRAINT "academic_sessions_label_key";--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" DROP CONSTRAINT "academic_sessions_start_year_key";--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" DROP CONSTRAINT "academic_sessions_start_date_key";--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" DROP CONSTRAINT "academic_sessions_end_date_key";--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" ADD COLUMN "board_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" ADD CONSTRAINT "academic_sessions_board_id_label_unique" UNIQUE("board_id","label");--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" ADD CONSTRAINT "academic_sessions_board_id_start_year_unique" UNIQUE("board_id","start_year");--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" ADD CONSTRAINT "academic_sessions_board_id_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "academic_syllabus"."boards"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" DROP CONSTRAINT "academic_sessions_label_matches_start_year", ADD CONSTRAINT "academic_sessions_label_matches_start_year" CHECK ("label" = "start_year"::text
          OR "label" = "start_year"::text || '-' || lpad((("start_year" + 1) % 100)::text, 2, '0'));