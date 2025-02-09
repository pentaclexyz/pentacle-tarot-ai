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

interface FetchFeedResponse {
    casts: Cast[];
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

    public async startPolling() {
        try {
            const status = await this.client.lookupSigner({ signerUuid: this.signerUuid });
            if (status.status !== 'approved') {
                throw new Error('Signer not approved');
            }

            await this.doPoll();

            setInterval(() => {
                this.doPoll().catch(error => {
                    console.error('Polling error:', error);
                });
            }, 10000);
        } catch (error) {
            console.error('Error starting polling:', error);
        }
    }

    private async doPoll() {
        try {
            const response: FetchFeedResponse = await this.client.fetchFeed({
                feedType: 'filter',
                filterType: 'channel_id',
                channelId: 'tarot',
                limit: 20,
            });

            if (!response?.casts) return;

            for (const cast of response.casts) {
                try {
                    const castTime = new Date(cast.timestamp);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (castTime >= today && !this.processedCasts.has(cast.hash)) {
                        await this.handleCast(cast);
                        this.processedCasts.add(cast.hash);
                        this.saveProcessedCasts();
                    }
                } catch (error) {
                    console.error('Error processing cast:', error);
                }
            }
        } catch (error) {
            console.error('Poll error:', error);
        }
    }

    private async handleCast(cast: Cast) {
        try {
            const castHash = cast.hash || 'unknown-hash';
            const text = cast.text.toLowerCase();

            console.log('HANDLE CAST DETAILS', {
                castHash,
                text,
                processedCasts: Array.from(this.processedCasts)
            });

            // Check if already processed or not a tarot request
            if (this.processedCasts.has(castHash) || !text.startsWith('@pentacle-tarot')) {
                console.log('Skipping cast', {
                    alreadyProcessed: this.processedCasts.has(castHash),
                    isNotTarotRequest: !text.startsWith('@pentacle-tarot')
                });
                return;
            }

            const response = await this.generateReading(text);
            if (!response) return;

            if (this.isTestMode) {
                console.log('TEST MODE - Would send response:', response);
                return;
            }

            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: response,
                parent: castHash,
                channelId: 'tarot',
            });

            console.log('CAST PUBLISHED SUCCESSFULLY');

            // Prevent processed set from growing too large
            if (this.processedCasts.size > 1000) {
                this.processedCasts.clear();
            }

        } catch (error) {
            console.error('COMPREHENSIVE ERROR in handleCast:', error);
        }
    }

    public async handleWebhookEvent(event: WebhookEvent) {
        try {
            if (event.type !== 'cast.created') {
                console.log('Ignoring event type:', event.type);
                return;
            }

            const cast = event.data;
            const castHash = cast.hash || 'unknown-hash';
            const castText = cast.text?.toLowerCase() || '';

            console.log('WEBHOOK EVENT DETAILS', {
                castHash,
                castText,
                processedCasts: Array.from(this.processedCasts)
            });

            if (this.processedCasts.has(castHash) || !castText.startsWith('@pentacle-tarot')) {
                console.log('Skipping webhook event', {
                    alreadyProcessed: this.processedCasts.has(castHash),
                    isNotTarotRequest: !castText.startsWith('@pentacle-tarot')
                });
                return;
            }

            this.processedCasts.add(castHash);

            const response = await this.generateReading(castText);
            if (!response) return;

            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: response,
                parent: castHash,
                channelId: 'tarot',
            });

            console.log('WEBHOOK REPLY SENT SUCCESSFULLY');

            if (this.processedCasts.size > 1000) {
                this.processedCasts.clear();
            }
        } catch (error) {
            console.error('Error handling webhook event:', error);
        }
    }

    public async testReading(question: string) {
        const testCast = {
            hash: 'test-hash-' + Date.now(),
            text: question,
            timestamp: new Date().toISOString()
        };

        await this.handleCast(testCast);
    }
}
