-- Add version column to configurations (starts at 1 for all existing rows)
ALTER TABLE "configurations" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Remove the read-only lock that was automatically applied on share.
-- Configs should remain editable by their owner after sharing.
UPDATE "configurations" SET "is_read_only" = false WHERE "is_shared" = true;
