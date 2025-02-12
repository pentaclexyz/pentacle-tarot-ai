import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { TarotService } from './tarotService';

interface Cast {
    hash: string;
    text: string;
    timestamp: string;
}

interface WebhookEvent {
    type: string;
    data: {
        text?: string;
        hash?: string;
        author?: {
            fid: number;
            username: string;
        };
        timestamp?: string;
        [key: string]: string | number | object | undefined;
    };
}

export class FarcasterIntegration extends TarotService {
    private client: NeynarAPIClient;
    private signerUuid: string;
    private processedCasts: Set<string>;
    private processedCastsFilePath: string;

    constructor(apiKey: string, signerUuid: string, isTestMode = false) {
        super(isTestMode);
        this.client = new NeynarAPIClient({ apiKey });
        this.signerUuid = signerUuid;
        this.processedCasts = new Set<string>();
        this.processedCastsFilePath = path.join(__dirname, 'processed_casts.json');
        this.loadProcessedCasts();
    }

    private loadProcessedCasts() {
        try {
            if (fs.existsSync(this.processedCastsFilePath)) {
                const data = fs.readFileSync(this.processedCastsFilePath, 'utf8');
                this.processedCasts = new Set(JSON.parse(data));
            }
        } catch (error) {
            console.error('Error loading processed casts:', error);
        }
    }

    private saveProcessedCasts() {
        try {
            fs.writeFileSync(
                this.processedCastsFilePath,
                JSON.stringify(Array.from(this.processedCasts)),
                'utf8'
            );
        } catch (error) {
            console.error('Error saving processed casts:', error);
        }
    }

    public async startPolling(interval = 10000) {
        try {
            const status = await this.client.lookupSigner({ signerUuid: this.signerUuid });
            if (status.status !== 'approved') {
                throw new Error('Signer not approved');
            }

            await this.doPoll();
            setInterval(() => this.doPoll().catch(console.error), interval);
        } catch (error) {
            console.error('Error starting polling:', error);
            throw error; // Re-throw to allow caller to handle
        }
    }

    private async doPoll() {
        try {
            const response = await this.client.fetchFeed({
                feedType: 'filter',
                filterType: 'channel_id',
                channelId: 'tarot',
                limit: 20,
            });

            if (!response?.casts) return;

            for (const cast of response.casts) {
                const castTime = new Date(cast.timestamp);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (castTime >= today && !this.processedCasts.has(cast.hash)) {
                    await this.handleCast(cast);
                }
            }
        } catch (error) {
            console.error('Poll error:', error);
        }
    }

    private async handleCast(cast: Cast) {
        try {
            const castHash = cast.hash;
            const text = cast.text.toLowerCase();

            if (this.processedCasts.has(castHash) || !text.startsWith('@pentacle-tarot')) {
                return;
            }

            // Generate reading
            const reading = await this.generateReading(text);
            const response = typeof reading === 'string'
                ? { text: reading, imageUrl: '' }
                : reading;

            // Put image URL on its own line for proper Farcaster embedding
            const replyText = response.imageUrl
                ? `${response.text}\n\n${response.imageUrl}` // Double newline for clean separation
                : response.text;

            if (this.isTestMode) {
                console.log('TEST MODE - Would send response:', replyText);
                return;
            }

            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: replyText,
                parent: castHash,
                channelId: 'tarot',
            });

            this.processedCasts.add(castHash);
            this.saveProcessedCasts();

            // Cleanup old processed casts if needed
            if (this.processedCasts.size > 1000) {
                const oldestCasts = Array.from(this.processedCasts).slice(0, 500);
                oldestCasts.forEach(hash => this.processedCasts.delete(hash));
                this.saveProcessedCasts();
            }
        } catch (error) {
            console.error('Error handling cast:', error);
        }
    }

    public async handleWebhookEvent(event: WebhookEvent) {
        if (event.type !== 'cast.created') return;

        const cast = {
            hash: event.data.hash || 'unknown-hash',
            text: event.data.text || '',
            timestamp: event.data.timestamp || new Date().toISOString()
        };

        await this.handleCast(cast);
    }

    // Test method for manual testing
    public async testReading(question: string) {
        await this.handleCast({
            hash: 'test-hash-' + Date.now(),
            text: question,
            timestamp: new Date().toISOString()
        });
    }
}
