ALTER TABLE "hotspots" RENAME COLUMN "headcount" TO "assigned";--> statement-breakpoint
ALTER TABLE "hotspots" ADD COLUMN "arrived" integer DEFAULT 0 NOT NULL;