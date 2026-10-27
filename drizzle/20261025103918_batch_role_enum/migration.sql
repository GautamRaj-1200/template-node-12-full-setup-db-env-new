CREATE TYPE "teaching"."batch_role" AS ENUM('teacher', 'student');--> statement-breakpoint
ALTER TABLE "teaching"."batch_members" DROP CONSTRAINT "batch_members_role_check";--> statement-breakpoint
ALTER TABLE "teaching"."batch_members" ALTER COLUMN "role" SET DATA TYPE "teaching"."batch_role" USING "role"::"teaching"."batch_role";