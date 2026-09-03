-- Audit vocabulary for the blog-taxonomy endpoints.
--
-- Separate from the migration that created `post_categories` because that one was already
-- applied: editing an applied migration changes its checksum and Prisma then refuses to
-- run against the database at all. Same reason the training-category actions got their
-- own migration.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POST_CATEGORY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POST_CATEGORY_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POST_CATEGORY_DELETED';
