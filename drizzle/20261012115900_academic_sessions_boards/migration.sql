CREATE SCHEMA "academic_syllabus";
--> statement-breakpoint
CREATE TABLE "academic_syllabus"."academic_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."academic_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" varchar(7) NOT NULL UNIQUE,
	"start_year" integer NOT NULL UNIQUE,
	"start_date" date NOT NULL UNIQUE,
	"end_date" date NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_syllabus"."boards" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "academic_syllabus"."boards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(20) NOT NULL UNIQUE,
	"short_name" varchar(30) NOT NULL UNIQUE,
	"long_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
