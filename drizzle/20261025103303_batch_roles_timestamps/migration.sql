ALTER TABLE "teaching"."batch_members" ADD COLUMN "role" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "teaching"."batch_members" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "teaching"."batch_subjects" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."users" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "teaching"."batch_members" ADD CONSTRAINT "batch_members_role_check" CHECK ("role" IN ('teacher', 'student'));