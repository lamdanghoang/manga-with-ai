CREATE TABLE "generation_payments" (
    "id" UUID NOT NULL,
    "tx_hash" VARCHAR(80) NOT NULL,
    "user_id" UUID NOT NULL,
    "generation_job_id" UUID NOT NULL,
    "token" VARCHAR(10) NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generation_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "generation_payments_tx_hash_key" ON "generation_payments"("tx_hash");
CREATE UNIQUE INDEX "generation_payments_generation_job_id_key" ON "generation_payments"("generation_job_id");
ALTER TABLE "generation_payments" ADD CONSTRAINT "generation_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generation_payments" ADD CONSTRAINT "generation_payments_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
