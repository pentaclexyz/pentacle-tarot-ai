import { TwitterApi } from 'twitter-api-v2';
import { TarotReader } from '../app/tarotReader';

interface TwitterMention {
    id: string;
    text: string;
    author_id: string;
}

export class TwitterIntegration {
    private client: TwitterApi;
    private tarotReader: TarotReader;
    private processedTweets: Set<string> = new Set();
    private isTestMode: boolean;

    constructor(isTestMode = false) {
        // Validate environment variables
        const requiredEnvVars = [
            'TWITTER_API_KEY',
            'TWITTER_API_SECRET',
            'TWITTER_ACCESS_TOKEN',
            'TWITTER_ACCESS_SECRET',
            'OPENAI_API_KEY'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        // Initialize Twitter client with App auth
        this.client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY!,
            appSecret: process.env.TWITTER_API_SECRET!,
            accessToken: process.env.TWITTER_ACCESS_TOKEN!,
            accessSecret: process.env.TWITTER_ACCESS_SECRET!,
        });

        this.tarotReader = new TarotReader(process.env.OPENAI_API_KEY!);
        this.isTestMode = isTestMode;
    }

    async tweet(message: string): Promise<boolean> {
        try {
            if (this.isTestMode) {
                console.log('TEST MODE - Would tweet:', message);
                return true;
            }

            const response = await this.client.v2.tweet(message);
            return !!response?.data?.id;
        } catch (error) {
            console.error('Error sending tweet:', error);
            throw error;
        }
    }

    async handleMention(mention: TwitterMention): Promise<void> {
        try {
            if (this.processedTweets.has(mention.id)) {
                console.log('Already processed tweet:', mention.id);
                return;
            }

            this.processedTweets.add(mention.id);

            // Generate reading
            const cards = this.tarotReader.selectCards(3);
            const response = await this.tarotReader.formatReading(mention.text, cards);

            console.log('Generated reading:', response);

            if (this.isTestMode) {
                console.log('TEST MODE - Would reply to tweet with:', response);
                return;
            }

            // Reply to the tweet
            await this.client.v2.reply(
                response,
                mention.id
            );

            console.log('Successfully replied to tweet:', mention.id);

        } catch (error) {
            console.error('Error handling mention:', error);
            throw error;
        }
    }

    async startListening(): Promise<void> {
        if (this.isTestMode) {
            console.log('TEST MODE - Would start listening for mentions');
            return;
        }

        try {
            // Get bot's user info
            const me = await this.client.v2.me();
            console.log('Bot account:', me.data.username);

            // Set up rules for the stream
            const rules = await this.client.v2.streamRules();
            if (rules.data?.length) {
                await this.client.v2.updateStreamRules({
                    delete: { ids: rules.data.map(rule => rule.id) }
                });
            }

// Add
