CREATE SCHEMA "teaching";
--> statement-breakpoint
CREATE TABLE "teaching"."batch_members" (
	"batch_id" integer,
	"user_id" integer,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_members_pkey" PRIMARY KEY("batch_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teaching"."batch_subjects" (
	"batch_id" integer,
	"session_id" integer,
	"subject_id" integer,
	CONSTRAINT "batch_subjects_pkey" PRIMARY KEY("batch_id","session_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "teaching"."batches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teaching"."batches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teaching"."batch_members" ADD CONSTRAINT "batch_members_batch_id_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "teaching"."batches"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teaching"."batch_members" ADD CONSTRAINT "batch_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "academic_syllabus"."users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teaching"."batch_subjects" ADD CONSTRAINT "batch_subjects_batch_id_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "teaching"."batches"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teaching"."batch_subjects" ADD CONSTRAINT "batch_subjects_session_id_academic_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "academic_syllabus"."academic_sessions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teaching"."batch_subjects" ADD CONSTRAINT "batch_subjects_subject_id_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "academic_syllabus"."subjects"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teaching"."batches" ADD CONSTRAINT "batches_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "academic_syllabus"."users"("id") ON DELETE RESTRICT;