-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "reference_no" TEXT NOT NULL,
    "beneficiary_name" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "bank_account_number" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "requested_by" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_reference_no_key" ON "withdrawals"("reference_no");
