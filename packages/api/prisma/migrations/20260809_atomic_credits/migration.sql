ALTER TABLE "generation_jobs"
ADD COLUMN "credit_charged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "credit_refunded" BOOLEAN NOT NULL DEFAULT false;
