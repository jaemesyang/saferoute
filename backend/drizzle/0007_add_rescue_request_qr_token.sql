ALTER TABLE "rescue_requests" ADD COLUMN "qr_token" uuid DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "rescue_requests" ADD CONSTRAINT "rescue_requests_qr_token_unique" UNIQUE("qr_token");
