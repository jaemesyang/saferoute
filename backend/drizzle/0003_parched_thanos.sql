CREATE TABLE "hotspots" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" geometry(point) NOT NULL,
	"headcount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rescue_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"assigned_hotspot_id" integer,
	"people" integer DEFAULT 1 NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "rescue_requests" ADD CONSTRAINT "rescue_requests_assigned_hotspot_id_hotspots_id_fk" FOREIGN KEY ("assigned_hotspot_id") REFERENCES "public"."hotspots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spatial_index" ON "hotspots" USING gist ("location");