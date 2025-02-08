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

    constructor(apiKey: string, signerUuid: string) {
        this.client = new NeynarAPIClient({ apiKey });
        this.signerUuid = signerUuid;
        this.processedCastsFilePath = path.join(__dirname, 'processed_casts.json');
        this.processedCasts = this.loadProcessedCasts();
        this.tarotReader = new TarotReader();
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

    public async sendTestCast(message: string) {
        try {
            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: message,
                channelId: 'tarot',
            });
            console.log('Test cast published to #tarot!');
        } catch (error) {
            console.error('Error publishing test cast:', error);
        }
    }

    public async handleWebhookEvent(event: WebhookEvent) {
        try {
            if (event.type !== 'cast.created') {
                console.log('Ignoring event type:', event.type);
                return;
            }

            const cast = event.data;
            const castText = cast.text?.toLowerCase() || '';

            console.log('Processing cast from webhook:', castText);

            if (castText.startsWith('@pentacle-tarot ')) {
                const cards = this.tarotReader.selectCards(3);
                const response = this.tarotReader.formatReading(castText, cards);

                console.log('Replying with:', response);

                await this.client.publishCast({
                    signerUuid: this.signerUuid,
                    text: response,
                    parent: cast.hash,
                    channelId: 'tarot',
                });
                console.log('Reply sent successfully!');
            }
        } catch (error) {
            console.error('Error handling webhook event:', error);
        }
    }

    private async handleCast(cast: Cast) {
        try {
            const text = cast.text.toLowerCase();
            console.log('Handling cast:', text);
            let response = '';

            if (text.startsWith('@pentacle-tarot ')) {
                console.log('Tarot request detected');
                const cards = this.tarotReader.selectCards(3);
                response = this.tarotReader.formatReading(text, cards);
                console.log('Generated response:', response);
            } else {
                response =
                    "✨ Ask for a reading by starting your message with '@pentacle-tarot'.\n\n" +
                    "For example: '@pentacle-tarot What should I focus on today?'";
            }

            console.log('About to publish response:', response);
            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: response,
                parent: cast.hash,
                channelId: 'tarot',
            });
            console.log('Successfully published response');
        } catch (error) {
            console.error('Error handling cast:', error);
        }
    }
}
