-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "emailMessageId" TEXT,
ADD COLUMN     "emailedAt" TIMESTAMP(3),
ADD COLUMN     "tweetId" TEXT,
ADD COLUMN     "tweetedAt" TIMESTAMP(3);
