-- CreateEnum
CREATE TYPE "TrainingCategory" AS ENUM ('PROGRAMIM', 'ADMINISTRIM', 'SIGURI_KIBERNETIKE', 'MARKETING_DIZAJN', 'MENAXHIM_PROJEKTEVE', 'AFTESI_TE_BUTA');

-- CreateEnum
CREATE TYPE "TrainingFormat" AS ENUM ('KLASE', 'HIBRID', 'ONLINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'TRAINING_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'TRAINING_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'TRAINING_DELETED';

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "trainingId" TEXT;

-- CreateTable
CREATE TABLE "trainings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TrainingCategory" NOT NULL,
    "startDate" TIMESTAMP(3),
    "format" "TrainingFormat" NOT NULL,
    "hours" INTEGER,
    "instructor" TEXT,
    "city" TEXT,
    "description" TEXT,
    "strengths" JSONB,
    "syllabusPdf" TEXT,
    "formSlug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainings_slug_key" ON "trainings"("slug");

-- CreateIndex
CREATE INDEX "trainings_category_idx" ON "trainings"("category");

-- CreateIndex
CREATE INDEX "trainings_city_idx" ON "trainings"("city");

-- CreateIndex
CREATE INDEX "trainings_isActive_deletedAt_idx" ON "trainings"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "submissions_trainingId_idx" ON "submissions"("trainingId");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
