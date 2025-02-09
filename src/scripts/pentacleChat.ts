import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { TarotReader } from '../app/tarotReader';

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


export class PentacleChat {
    private client: NeynarAPIClient;
    private signerUuid: string;
    private processedCasts: Set<string>;
    private processedCastsFilePath: string;
    private tarotReader: TarotReader;
    private isTestMode: boolean;
    private lastProcessedTime: number = 0;
    private processingDelay: number = 2000; // 2 seconds

    constructor(apiKey: string, signerUuid: string, isTestMode = false) {
        this.client = new NeynarAPIClient({ apiKey });
        this.signerUuid = signerUuid;
        this.processedCasts = new Set<string>();
        this.processedCastsFilePath = path.join(__dirname, 'processed_casts.json');
        this.tarotReader = new TarotReader(process.env.OPENAI_API_KEY!);
        this.isTestMode = isTestMode;
    }

    private loadProcessedCasts(): Set<string> {
        try {
            if (fs.existsSync(this.processedCastsFilePath)) {
                const data = fs.readFileSync(this.processedCastsFilePath, 'utf8');
                return new Set(JSON.parse(data));
            }
        } catch (error) {
            console.error('Error loading processed casts:', error);
        }
        return new Set();
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
            console.log('HANDLE CAST - FULL DETAILS', {
                castHash: cast.hash,
                castText: cast.text,
                timestamp: cast.timestamp,
                processedCasts: Array.from(this.processedCasts)
            });

            // Check if we've processed this cast recently
            if (this.processedCasts.has(cast.hash)) {
                console.log(`DUPLICATE CAST DETECTION: Cast ${cast.hash} already processed`);
                return;
            }

            // Add rate limiting
            const now = Date.now();
            if (now - this.lastProcessedTime < this.processingDelay) {
                console.log('RATE LIMIT TRIGGERED', {
                    now,
                    lastProcessedTime: this.lastProcessedTime,
                    delay: this.processingDelay
                });
                return;
            }
            this.lastProcessedTime = now;

            const text = cast.text.toLowerCase();
            if (!text.startsWith('@pentacle-tarot ')) {
                console.log('CAST DOES NOT MATCH @pentacle-tarot', { text });
                return;
            }

            console.log('🔮 Processing reading request:', text);

            // Add to processed set immediately
            this.processedCasts.add(cast.hash);

            const cards = this.tarotReader.selectCards(3);
            const response = await this.tarotReader.formatReading(text, cards);

            console.log('GENERATED RESPONSE', {
                responseLength: response.length,
                responsePreview: response.substring(0, 200),
                cardNames: cards.map(card => card.name)
            });

            if (this.isTestMode) {
                console.log('TEST MODE - Would send response:', response);
                return;
            }

            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: response,
                parent: cast.hash,
                channelId: 'tarot',
            });

            console.log('CAST PUBLISHED SUCCESSFULLY', {
                castHash: cast.hash
            });

            // Keep processed set from growing too large
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
            const castHash = cast.hash;
            const castText = cast.text?.toLowerCase() || '';

            // Check if this cast has already been processed
            if (this.processedCasts.has(castHash)) {
                console.log(`Cast ${castHash} already processed. Skipping.`);
                return;
            }

            console.log('Processing cast from webhook:', castText);

            if (castText.startsWith('@pentacle-tarot ')) {
                // Add to processed casts immediately to prevent duplicate processing
                this.processedCasts.add(castHash);

                const cards = this.tarotReader.selectCards(3);
                const response = await this.tarotReader.formatReading(castText, cards);

                console.log('Replying with:', response);

                await this.client.publishCast({
                    signerUuid: this.signerUuid,
                    text: response,
                    parent: cast.hash,
                    channelId: 'tarot',
                });
                console.log('Reply sent successfully!');

                // Prevent processed casts set from growing too large
                if (this.processedCasts.size > 1000) {
                    this.processedCasts.clear();
                }
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
