-- Featured events (admin)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Ensure PaymentStatus enum exists for fresh/shadow databases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
  END IF;
END$$;

-- Ensure Payment table exists for fresh/shadow databases
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "stripeSessionId" TEXT,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Payment_userId_fkey'
  ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Payment_eventId_fkey'
  ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- Payment gateway metadata
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "tranId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "invitationId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_tranId_key" ON "Payment"("tranId") WHERE "tranId" IS NOT NULL;

-- Deduplicate before composite uniques
DELETE FROM "Participation" a
WHERE a.id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON ("userId", "eventId") id
    FROM "Participation"
    ORDER BY "userId", "eventId", id ASC
  ) sub
);

DELETE FROM "Review" a
WHERE a.id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON ("userId", "eventId") id
    FROM "Review"
    ORDER BY "userId", "eventId", id ASC
  ) sub
);

CREATE UNIQUE INDEX IF NOT EXISTS "Participation_userId_eventId_key" ON "Participation"("userId", "eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_userId_eventId_key" ON "Review"("userId", "eventId");
