-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "mint_tx_hash" TEXT;

-- AlterTable
ALTER TABLE "style_templates" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_subscriptions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tier" VARCHAR(20) NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "credit_purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "package" VARCHAR(20) NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount_usd" VARCHAR(10) NOT NULL,
    "payment_tx" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_purchases_payment_tx_key" ON "credit_purchases"("payment_tx");

-- AddForeignKey
ALTER TABLE "credit_purchases" ADD CONSTRAINT "credit_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
