-- Add missing user fields that exist in schema but not in migrations
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

