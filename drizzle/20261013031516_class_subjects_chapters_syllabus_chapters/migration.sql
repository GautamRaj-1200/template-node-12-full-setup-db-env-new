CREATE TABLE "academic_syllabus"."chapters" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."chapters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"subject_id" integer NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapters_subject_id_slug_unique" UNIQUE("subject_id","slug"),
	CONSTRAINT "chapters_subject_id_name_unique" UNIQUE("subject_id","name"),
	CONSTRAINT "chapters_id_subject_id_unique" UNIQUE("id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "academic_syllabus"."classes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."classes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"board_id" integer NOT NULL,
	"class" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_board_id_class_unique" UNIQUE("board_id","class"),
	CONSTRAINT "classes_class_range" CHECK ("class" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE TABLE "academic_syllabus"."subjects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."subjects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"class_id" integer NOT NULL,
	"slug" varchar(100) NOT NULL,
	"short_name" varchar(30) NOT NULL,
	"long_name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_class_id_slug_unique" UNIQUE("class_id","slug"),
	CONSTRAINT "subjects_class_id_long_name_unique" UNIQUE("class_id","long_name")
);
--> statement-breakpoint
CREATE TABLE "academic_syllabus"."syllabus_chapters" (
	"session_id" integer,
	"chapter_id" integer,
	"subject_id" integer NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "syllabus_chapters_pkey" PRIMARY KEY("session_id","chapter_id"),
	CONSTRAINT "syllabus_chapters_subject_id_session_id_position_unique" UNIQUE("subject_id","session_id","position"),
	CONSTRAINT "syllabus_chapters_position_positive" CHECK ("position" > 0)
);
--> statement-breakpoint
ALTER TABLE "academic_syllabus"."chapters" ADD CONSTRAINT "chapters_subject_id_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "academic_syllabus"."subjects"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."classes" ADD CONSTRAINT "classes_board_id_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "academic_syllabus"."boards"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."subjects" ADD CONSTRAINT "subjects_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academic_syllabus"."classes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."syllabus_chapters" ADD CONSTRAINT "syllabus_chapters_session_id_academic_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "academic_syllabus"."academic_sessions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."syllabus_chapters" ADD CONSTRAINT "syllabus_chapters_d4cjcHNyW9Mz_fkey" FOREIGN KEY ("chapter_id","subject_id") REFERENCES "academic_syllabus"."chapters"("id","subject_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" ADD CONSTRAINT "academic_sessions_label_matches_start_year" CHECK ("label" = "start_year"::text || '-' || lpad((("start_year" + 1) % 100)::text, 2, '0'));--> statement-breakpoint
ALTER TABLE "academic_syllabus"."academic_sessions" ADD CONSTRAINT "academic_sessions_end_after_start" CHECK ("end_date" > "start_date");