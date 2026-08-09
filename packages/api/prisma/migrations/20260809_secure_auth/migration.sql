CREATE TABLE "auth_challenges" (
    "id" UUID NOT NULL,
    "wallet_address" VARCHAR(64) NOT NULL,
    "nonce" VARCHAR(64) NOT NULL,
    "message" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_challenges_nonce_key" ON "auth_challenges"("nonce");
CREATE INDEX "auth_challenges_wallet_address_created_at_idx" ON "auth_challenges"("wallet_address", "created_at");

ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
