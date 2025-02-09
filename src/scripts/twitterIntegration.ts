// src/scripts/twitterIntegration.ts

import { TwitterApi } from 'twitter-api-v2';
import { TarotReader } from '../app/tarotReader';

interface TwitterMention {
    id: string;
    text: string;
    author_id: string;
}

export class TwitterIntegration {
    // Client for write operations (OAuth 1.0a)
    private client: TwitterApi;
    // Client for streaming (OAuth 2.0 Bearer Token)
    private streamingClient: TwitterApi;
    private tarotReader: TarotReader;
    private processedTweets: Set<string> = new Set();
    private isTestMode: boolean;

    constructor(isTestMode = false) {
        // Validate required environment variables
        const requiredEnvVars = [
            'TWITTER_API_KEY',
            'TWITTER_API_SECRET',
            'TWITTER_ACCESS_TOKEN',
            'TWITTER_ACCESS_SECRET',
            'TWITTER_BEARER_TOKEN',
            'OPENAI_API_KEY'
        ];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        this.client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY as string,
            appSecret: process.env.TWITTER_API_SECRET as string,
            accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
            accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
        });

        // Initialize the streaming client using the Bearer Token (OAuth 2.0)
        this.streamingClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN as string);

        this.tarotReader = new TarotReader(process.env.OPENAI_API_KEY as string);
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

    async handleMention(mention: TwitterMention): Promise<string> {
        try {
            if (this.processedTweets.has(mention.id)) {
                console.log('Already processed tweet:', mention.id);
                return ''; // Prevents double processing
            }
            this.processedTweets.add(mention.id);

            // Generate reading
            const cards = this.tarotReader.selectCards(3);
            const response = await this.tarotReader.formatReading(mention.text, cards);

            if (!response) {
                console.log("Generated response is empty.");
                return ''; // Ensure a string is always returned
            }

            console.log('Generated reading:', response);

            if (!this.isTestMode) {
                await this.client.v2.reply(response, mention.id);
                console.log('Successfully replied to tweet:', mention.id);
            } else {
                console.log(`TEST MODE - Would reply: ${response}`);
            }

            return response; // ✅ Ensure this is returned
        } catch (error) {
            console.error('Error handling mention:', error);
            return ''; // Always return a string
        }
    }


    async startListening(): Promise<void> {
        if (this.isTestMode) {
            console.log('TEST MODE - Would start listening for mentions');
            return;
        }
        try {
            // Verify basic connectivity
            const me = await this.streamingClient.v2.me();
            console.log('Authenticated User:', me.data.username);

            // Get existing rules
            const existingRules = await this.streamingClient.v2.streamRules();
            console.log('Existing Rules:', JSON.stringify(existingRules, null, 2));

            // Remove existing rules
            if (existingRules.data?.length) {
                await this.streamingClient.v2.updateStreamRules({
                    delete: { ids: existingRules.data.map(rule => rule.id) }
                });
            }

            // Add new rule
            const ruleResponse = await this.streamingClient.v2.updateStreamRules({
                add: [{
                    value: `to:pentacletarot`,
                    tag: 'bot mentions'
                }]
            });
            console.log('Rule Addition Response:', JSON.stringify(ruleResponse, null, 2));

            console.log('Starting Twitter filtered stream...');
            const stream = await this.streamingClient.v2.searchStream({
                'tweet.fields': ['referenced_tweets', 'author_id', 'text'],
                expansions: ['referenced_tweets.id', 'author_id'],
            });

            stream.on('data', async (tweet) => {
                console.log('Received Tweet:', JSON.stringify(tweet, null, 2));
                if (tweet.data) {
                    await this.handleMention({
                        id: tweet.data.id,
                        text: tweet.data.text,
                        author_id: tweet.data.author_id,
                    });
                }
            });

            stream.on('connectionError', (error) => {
                console.error('Detailed Connection Error:', JSON.stringify(error, null, 2));
            });

        } catch (error) {
            console.error('Detailed Listening Error:', JSON.stringify(error, null, 2));
            throw error;
        }
    }

}
