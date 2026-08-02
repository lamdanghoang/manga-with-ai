-- AlterTable: add payment_token to credit_purchases and user_subscriptions
ALTER TABLE "credit_purchases" ADD COLUMN "payment_token" VARCHAR(10);
ALTER TABLE "user_subscriptions" ADD COLUMN "payment_token" VARCHAR(10);
