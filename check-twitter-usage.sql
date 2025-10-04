SELECT 
  COUNT(*) as total_tweets_today,
  COUNT(CASE WHEN "tweetId" NOT LIKE 'sim-%' THEN 1 END) as real_tweets,
  COUNT(CASE WHEN "tweetId" LIKE 'sim-%' THEN 1 END) as simulated_tweets
FROM "Report"
WHERE "tweetedAt" >= CURRENT_DATE;
