import { TwitterApi } from 'twitter-api-v2';

export interface MonitoredTweet {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
  inReplyToStatusId?: string;
}

export interface InfrastructureComplaint {
  tweet: MonitoredTweet;
  category: string;
  severity: 'low' | 'medium' | 'high';
  location?: string;
  keywords: string[];
}

const INFRASTRUCTURE_KEYWORDS = {
  roads: ['pothole', 'road', 'highway', 'street', 'patch', 'crack', 'damage', 'asphalting'],
  water: ['water', 'leak', 'pipeline', 'supply', 'drainage', 'sewage', 'stp', 'borewell'],
  waste: ['garbage', 'waste', 'trash', 'dustbin', 'litter', 'dump', 'cleanup'],
  lighting: ['street light', 'lamp', 'dark', 'lighting', 'bulb', 'electricity'],
  parks: ['park', 'tree', 'garden', 'playground', 'green', 'horticulture'],
};

export class TwitterMonitorService {
  private client: TwitterApi;
  private monitoredHandles: string[];
  
  constructor(
    consumerKey: string,
    consumerSecret: string,
    accessToken: string,
    accessSecret: string,
    monitoredHandles: string[] = ['@GBA_office', '@ICCCBengaluru']
  ) {
    this.client = new TwitterApi({
      appKey: consumerKey,
      appSecret: consumerSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });
    this.monitoredHandles = monitoredHandles;
  }

  async getUserId(username: string): Promise<string | null> {
    try {
      const cleanUsername = username.replace('@', '');
      const user = await this.client.v2.userByUsername(cleanUsername);
      return user.data.id;
    } catch (error) {
      console.error(`Error fetching user ID for ${username}:`, error);
      return null;
    }
  }

  async fetchMentions(userId: string, maxResults: number = 20): Promise<MonitoredTweet[]> {
    try {
      const mentions = await this.client.v2.userMentionTimeline(userId, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'author_id', 'in_reply_to_user_id'],
        'user.fields': ['username'],
        expansions: ['author_id'],
      });

      const tweets: MonitoredTweet[] = [];
      
      for (const tweet of mentions.data.data || []) {
        const author = mentions.includes?.users?.find(u => u.id === tweet.author_id);
        
        tweets.push({
          id: tweet.id,
          text: tweet.text,
          authorId: tweet.author_id || '',
          authorUsername: author?.username || 'unknown',
          createdAt: tweet.created_at || new Date().toISOString(),
          inReplyToStatusId: tweet.in_reply_to_user_id,
        });
      }

      return tweets;
    } catch (error) {
      console.error(`Error fetching mentions for user ${userId}:`, error);
      return [];
    }
  }

  async monitorAllHandles(maxResults: number = 20): Promise<MonitoredTweet[]> {
    const allTweets: MonitoredTweet[] = [];

    for (const handle of this.monitoredHandles) {
      console.log(`Monitoring ${handle}...`);
      const userId = await this.getUserId(handle);
      
      if (!userId) {
        console.warn(`Could not find user ID for ${handle}`);
        continue;
      }

      const tweets = await this.fetchMentions(userId, maxResults);
      allTweets.push(...tweets);
    }

    return this.removeDuplicates(allTweets);
  }

  classifyComplaint(tweet: MonitoredTweet): InfrastructureComplaint | null {
    const textLower = tweet.text.toLowerCase();
    const foundKeywords: string[] = [];
    let category = 'general';
    let matchCount = 0;

    for (const [cat, keywords] of Object.entries(INFRASTRUCTURE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          foundKeywords.push(keyword);
          if (keywords.filter(k => textLower.includes(k)).length > matchCount) {
            category = cat;
            matchCount = keywords.filter(k => textLower.includes(k)).length;
          }
        }
      }
    }

    if (foundKeywords.length === 0) {
      return null;
    }

    const severity = this.determineSeverity(textLower);
    const location = this.extractLocation(tweet.text);

    return {
      tweet,
      category,
      severity,
      location,
      keywords: foundKeywords,
    };
  }

  private determineSeverity(text: string): 'low' | 'medium' | 'high' {
    const highPriorityWords = ['urgent', 'emergency', 'danger', 'accident', 'injury', 'death', 'critical'];
    const mediumPriorityWords = ['please', 'fix', 'soon', 'days', 'weeks', 'month'];

    for (const word of highPriorityWords) {
      if (text.includes(word)) return 'high';
    }

    for (const word of mediumPriorityWords) {
      if (text.includes(word)) return 'medium';
    }

    return 'low';
  }

  private extractLocation(text: string): string | undefined {
    const locationPatterns = [
      /(?:at|near|on|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Road|Street|Avenue|Layout|Nagar|Circle|Junction))/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Road|Street|Avenue|Layout|Nagar|Circle|Junction))/i,
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return undefined;
  }

  async postReply(tweetId: string, replyText: string): Promise<boolean> {
    try {
      await this.client.v2.reply(replyText, tweetId);
      console.log(`Successfully posted reply to tweet ${tweetId}`);
      return true;
    } catch (error) {
      console.error(`Error posting reply to tweet ${tweetId}:`, error);
      return false;
    }
  }

  filterRecentTweets(tweets: MonitoredTweet[], hoursAgo: number = 2): MonitoredTweet[] {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    return tweets.filter(tweet => {
      const tweetTime = new Date(tweet.createdAt);
      return tweetTime > cutoffTime;
    });
  }

  private removeDuplicates(tweets: MonitoredTweet[]): MonitoredTweet[] {
    const seen = new Set<string>();
    return tweets.filter(tweet => {
      if (seen.has(tweet.id)) return false;
      seen.add(tweet.id);
      return true;
    });
  }
}

export async function generateAIReply(
  complaint: InfrastructureComplaint,
  mcpBaseUrl: string
): Promise<string | null> {
  try {
    const categoryHashtag = {
      'roads': '#FixOurRoads',
      'water': '#BengaluruWater',
      'waste': '#CleanBengaluru',
      'lighting': '#SafeStreets',
      'parks': '#GreenBengaluru',
    }[complaint.category] || '#BengaluruInfra';

    const locationText = complaint.location ? ` in ${complaint.location}` : '';
    
    // Context-aware concern statements based on category and severity
    const concernStatements = {
      waste: {
        high: `This garbage issue${locationText} is a serious health hazard affecting our community.`,
        medium: `This waste problem${locationText} is concerning and needs prompt attention.`,
        low: `This garbage accumulation${locationText} should be addressed before it worsens.`,
      },
      roads: {
        high: `URGENT: This road hazard${locationText} poses serious safety risk to commuters and pedestrians!`,
        medium: `This road condition${locationText} is causing daily inconvenience and safety concerns.`,
        low: `This road issue${locationText} needs attention to prevent accidents.`,
      },
      water: {
        high: `URGENT: This water leak${locationText} is wasting precious resources and damaging infrastructure!`,
        medium: `This water problem${locationText} is affecting residents and needs quick resolution.`,
        low: `This water issue${locationText} should be fixed to prevent further wastage.`,
      },
      lighting: {
        high: `URGENT: Dark streets${locationText} are a major safety concern, especially for women and children!`,
        medium: `Poor lighting${locationText} is creating unsafe conditions after dark.`,
        low: `Street lighting${locationText} needs improvement for better safety.`,
      },
      parks: {
        high: `URGENT: This park issue${locationText} is affecting community well-being and safety!`,
        medium: `This green space problem${locationText} needs attention for our community.`,
        low: `This park maintenance issue${locationText} should be addressed.`,
      },
    };

    const defaultConcern = {
      high: `URGENT: This infrastructure issue${locationText} needs immediate attention!`,
      medium: `This issue${locationText} is affecting our community and needs prompt action.`,
      low: `This infrastructure problem${locationText} should be addressed soon.`,
    };

    const concernText = (concernStatements[complaint.category as keyof typeof concernStatements] || defaultConcern)[complaint.severity];

    // Craft empathetic, concerned citizen reply
    const reply = `@GBA_office @ICCCBengaluru ${concernText} Please prioritize this. ${categoryHashtag}`;

    // Ensure it fits in tweet length
    if (reply.length > 280) {
      // Fallback shorter version
      const shortReply = `@GBA_office @ICCCBengaluru ${complaint.severity === 'high' ? 'URGENT: ' : ''}${complaint.category} issue${locationText}. Please take action. ${categoryHashtag}`;
      return shortReply.slice(0, 280);
    }

    return reply;
  } catch (error) {
    console.error('Error generating AI reply:', error);
    return null;
  }
}
