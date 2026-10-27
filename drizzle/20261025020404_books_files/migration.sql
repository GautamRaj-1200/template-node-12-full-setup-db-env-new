CREATE TABLE "academic_syllabus"."books" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."books_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"syllabus_chapter_id" integer NOT NULL UNIQUE,
	"file_id" integer NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_syllabus"."files" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."files_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"file_key" text NOT NULL UNIQUE,
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_syllabus"."users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(255) NOT NULL UNIQUE,
	"class_id" integer
);
--> statement-breakpoint
ALTER TABLE "academic_syllabus"."syllabus_chapters" ADD COLUMN "id" integer GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."syllabus_chapters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "academic_syllabus"."syllabus_chapters" DROP CONSTRAINT "syllabus_chapters_pkey";--> statement-breakpoint
ALTER TABLE "academic_syllabus"."syllabus_chapters" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "academic_syllabus"."syllabus_chapters" ADD CONSTRAINT "syllabus_chapters_session_id_chapter_id_unique" UNIQUE("session_id","chapter_id");--> statement-breakpoint
ALTER TABLE "academic_syllabus"."books" ADD CONSTRAINT "books_syllabus_chapter_id_syllabus_chapters_id_fkey" FOREIGN KEY ("syllabus_chapter_id") REFERENCES "academic_syllabus"."syllabus_chapters"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."books" ADD CONSTRAINT "books_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "academic_syllabus"."files"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."files" ADD CONSTRAINT "files_uploaded_by_users_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "academic_syllabus"."users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."users" ADD CONSTRAINT "users_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic_syllabus"."classes"("id") ON DELETE RESTRICT;