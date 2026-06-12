-- CreateEnum
CREATE TYPE "ticket_tier" AS ENUM ('CLASSIC', 'CLASSIC_COUPLE', 'VIP', 'VIP_COUPLE', 'TABLE_OF_5');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('PENDING', 'APPROVED', 'DELETED');

-- CreateEnum
CREATE TYPE "app_role" AS ENUM ('admin', 'scanner');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "external_id" TEXT NOT NULL,
    "fapshi_trans_id" TEXT,
    "fapshi_payment_link" TEXT,
    "buyer_name" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "tier" "ticket_tier" NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_amount" INTEGER,
    "revenue" INTEGER,
    "status" "order_status" NOT NULL DEFAULT 'PENDING',
    "medium" TEXT,
    "payer_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "qr_slug" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "slots_total" INTEGER NOT NULL,
    "slots_used" INTEGER NOT NULL DEFAULT 0,
    "is_fully_used" BOOLEAN NOT NULL DEFAULT false,
    "first_scan_at" TIMESTAMPTZ(6),
    "last_scan_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "status" "message_status" NOT NULL DEFAULT 'PENDING',
    "display_name" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role" "app_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_external_id_key" ON "orders"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_fapshi_trans_id_key" ON "orders"("fapshi_trans_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_user_email_idx" ON "orders"("user_email");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_slug_key" ON "tickets"("qr_slug");

-- CreateIndex
CREATE INDEX "tickets_order_id_idx" ON "tickets"("order_id");

-- CreateIndex
CREATE INDEX "anonymous_messages_status_idx" ON "anonymous_messages"("status");

-- CreateIndex
CREATE INDEX "anonymous_messages_created_at_idx" ON "anonymous_messages"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
