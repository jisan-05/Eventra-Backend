-- Featured events (admin)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Payment gateway metadata (skip if "Payment" table does not exist yet — run `npx prisma db push` first)
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
