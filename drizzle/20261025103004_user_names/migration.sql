ALTER TABLE "academic_syllabus"."users" ADD COLUMN "first_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."users" ADD COLUMN "middle_name" varchar(100);--> statement-breakpoint
ALTER TABLE "academic_syllabus"."users" ADD COLUMN "last_name" varchar(100) NOT NULL;