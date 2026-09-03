-- Post categories: the blog taxonomy, and the /lajme filter chips.
--
-- Mirrors `training_categories`, with ONE deliberate difference: `posts.categoryId` is
-- NULLABLE and there is NO BACKFILL. Every post that exists today predates this column,
-- and no honest value exists to give them — inferring a category from a title would
-- mislabel the archive for good. An uncategorised post stays valid, is served exactly as
-- before, and shows under "Të gjitha" on the public feed until a human files it.
--
-- That is also why this migration needs no verification block, unlike the trainings one:
-- nothing is being dropped and no existing row is rewritten, so there is no data whose
-- loss has to be guarded against. The only writes are the new table and four seed rows.

CREATE TABLE "post_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_categories_name_key" ON "post_categories"("name");
CREATE UNIQUE INDEX "post_categories_slug_key" ON "post_categories"("slug");
CREATE INDEX "post_categories_sortOrder_idx" ON "post_categories"("sortOrder");

-- The four the editorial team asked for. Ids are fixed strings rather than generated
-- cuids, for the same reason the training categories are: an id that differs between
-- staging and production makes any exported fixture environment-specific.
INSERT INTO "post_categories" ("id", "name", "slug", "sortOrder") VALUES
    ('postcat_lajmet',     'Lajmet',      'lajmet',      0),
    ('postcat_teknologji', 'Teknologji',  'teknologji',  1),
    ('postcat_karriera',   'Karriera',    'karriera',    2),
    ('postcat_projekte',   'Projekte',    'projekte',    3);

ALTER TABLE "posts" ADD COLUMN "categoryId" TEXT;

CREATE INDEX "posts_categoryId_idx" ON "posts"("categoryId");

ALTER TABLE "posts"
    ADD CONSTRAINT "posts_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "post_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
