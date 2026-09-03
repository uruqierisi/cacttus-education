-- Trainings categories become data.
--
-- `enum TrainingCategory` is replaced by a `training_categories` table and
-- `trainings.category` by a `categoryId` foreign key. The six enum values migrate across
-- with the Albanian labels the two frontends used to hard-code, so nothing an admin or a
-- visitor reads changes.
--
-- HAND-WRITTEN, not scaffolded. `prisma migrate dev` would have dropped the enum column
-- and recreated it, taking every training's category with it. The order below —
-- create, seed, backfill, VERIFY, only then drop — is what makes it non-destructive.
--
-- The DO block is the point of the whole file: it aborts if a single training failed to
-- map, and because Prisma runs a migration inside one transaction the abort rolls back
-- the table, the seed and the new column together. There is no half-migrated state.
--
-- ROLLBACK (no down-migrations in this project; run by hand against a backup-restored DB):
--   CREATE TYPE "TrainingCategory" AS ENUM ('PROGRAMIM','ADMINISTRIM','SIGURI_KIBERNETIKE',
--     'MARKETING_DIZAJN','MENAXHIM_PROJEKTEVE','AFTESI_TE_BUTA');
--   ALTER TABLE "trainings" ADD COLUMN "category" "TrainingCategory";
--   UPDATE "trainings" t SET "category" = c."slug_as_enum" ...  -- via training_categories.slug
--   ALTER TABLE "trainings" ALTER COLUMN "category" SET NOT NULL;
--   ALTER TABLE "trainings" DROP COLUMN "categoryId";
--   DROP TABLE "training_categories";
-- Categories created AFTER this migration have no enum member to map back to, which is
-- the honest reason the rollback is "restore the backup", not "run the inverse".

-- 1. The table.
CREATE TABLE "training_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "training_categories_name_key" ON "training_categories"("name");
CREATE UNIQUE INDEX "training_categories_slug_key" ON "training_categories"("slug");
CREATE INDEX "training_categories_sortOrder_idx" ON "training_categories"("sortOrder");

-- 2. The six current values, with the labels the frontends used to hold. Ids are fixed
--    strings rather than generated cuids so every environment ends up with the SAME ids
--    — a category id that differs between staging and production would make any exported
--    fixture or hard-coded reference environment-specific.
INSERT INTO "training_categories" ("id", "name", "slug", "sortOrder") VALUES
    ('trcat_programim',           'Programim',             'programim',            0),
    ('trcat_administrim',         'Administrim',           'administrim',          1),
    ('trcat_siguri_kibernetike',  'Siguri Kibernetike',    'siguri-kibernetike',   2),
    ('trcat_marketing_dizajn',    'Marketing & Dizajn',    'marketing-dizajn',     3),
    ('trcat_menaxhim_projekteve', 'Menaxhim i Projekteve', 'menaxhim-i-projekteve',4),
    ('trcat_aftesi_te_buta',      'Aftësi të buta',        'aftesi-te-buta',       5);

-- 3. The new column, nullable for the moment so the backfill has somewhere to write.
ALTER TABLE "trainings" ADD COLUMN "categoryId" TEXT;

-- 4. Backfill. Soft-deleted trainings included: their row survives a soft delete, so it
--    still needs a valid FK.
UPDATE "trainings" SET "categoryId" = CASE "category"
    WHEN 'PROGRAMIM'           THEN 'trcat_programim'
    WHEN 'ADMINISTRIM'         THEN 'trcat_administrim'
    WHEN 'SIGURI_KIBERNETIKE'  THEN 'trcat_siguri_kibernetike'
    WHEN 'MARKETING_DIZAJN'    THEN 'trcat_marketing_dizajn'
    WHEN 'MENAXHIM_PROJEKTEVE' THEN 'trcat_menaxhim_projekteve'
    WHEN 'AFTESI_TE_BUTA'      THEN 'trcat_aftesi_te_buta'
END;

-- 5. VERIFY BEFORE DROPPING. Every training must have been mapped; anything else means
--    an enum value existed that this CASE does not know about, and dropping the column
--    would destroy the only record of what it was.
DO $$
DECLARE
    total_rows    BIGINT;
    filled_rows   BIGINT;
    orphan_rows   BIGINT;
BEGIN
    SELECT count(*) INTO total_rows  FROM "trainings";
    SELECT count(*) INTO filled_rows FROM "trainings" WHERE "categoryId" IS NOT NULL;

    IF total_rows <> filled_rows THEN
        RAISE EXCEPTION
            'Backfill incomplete: % of % trainings got a categoryId. Refusing to drop "category".',
            filled_rows, total_rows;
    END IF;

    SELECT count(*) INTO orphan_rows
    FROM "trainings" t
    LEFT JOIN "training_categories" c ON c."id" = t."categoryId"
    WHERE c."id" IS NULL;

    IF orphan_rows > 0 THEN
        RAISE EXCEPTION
            'Backfill produced % training(s) pointing at a category that does not exist.',
            orphan_rows;
    END IF;

    RAISE NOTICE 'Backfill verified: % of % trainings mapped to a category.', filled_rows, total_rows;
END $$;

-- 6. Only now is the old column expendable.
ALTER TABLE "trainings" ALTER COLUMN "categoryId" SET NOT NULL;

DROP INDEX "trainings_category_idx";
ALTER TABLE "trainings" DROP COLUMN "category";
DROP TYPE "TrainingCategory";

CREATE INDEX "trainings_categoryId_idx" ON "trainings"("categoryId");

ALTER TABLE "trainings"
    ADD CONSTRAINT "trainings_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "training_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
