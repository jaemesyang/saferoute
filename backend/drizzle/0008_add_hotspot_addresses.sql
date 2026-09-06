ALTER TABLE "hotspots" ADD COLUMN "address" text;
UPDATE "hotspots"
SET "address" = format('%.6f, %.6f', ST_Y("location"), ST_X("location"))
WHERE "address" IS NULL;
ALTER TABLE "hotspots" ALTER COLUMN "address" SET NOT NULL;
