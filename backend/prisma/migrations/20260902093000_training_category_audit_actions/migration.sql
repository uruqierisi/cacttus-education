-- Audit vocabulary for the taxonomy endpoints.
--
-- Separate from the migration that created `training_categories` because that one was
-- already applied: editing an applied migration changes its checksum and Prisma then
-- refuses to run against the database at all.
--
-- Postgres allows ADD VALUE only outside a transaction on older versions; on 12+ it is
-- transactional but the new value cannot be USED in the same transaction that adds it.
-- Nothing here uses them, so a plain ALTER TYPE is safe.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TRAINING_CATEGORY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TRAINING_CATEGORY_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TRAINING_CATEGORY_DELETED';
