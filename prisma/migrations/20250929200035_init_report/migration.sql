-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('NEW', 'TRIAGED', 'NOTIFIED');

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "photoPath" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'NEW',
    "category" TEXT,
    "severity" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");
