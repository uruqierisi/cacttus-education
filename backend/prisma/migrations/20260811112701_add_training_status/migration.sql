-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN     "status" "TrainingStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "trainings_status_idx" ON "trainings"("status");
