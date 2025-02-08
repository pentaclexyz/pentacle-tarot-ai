// scripts/pentacleChat.ts

import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { TarotReader } from '../app/tarotReader';



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
            // Verify signer (same as Ephemeris)
            const status = await this.client.lookupSigner({ signerUuid: this.signerUuid });
            if (status.status !== 'approved') {
                throw new Error('Signer not approved');
            }

            // Do first poll immediately
            await this.doPoll();

            // Then poll every 10 seconds
            setInterval(() => {
                this.doPoll().catch(error => {
                    console.error('Polling error:', error);
                });
            }, 10000);

        } catch (error) {
            console.error('Error starting polling:', error);
            throw error;
        }
    }

    private async doPoll() {
        try {
            const response = await this.client.fetchFeed({
                feedType: "filter" as any,
                filterType: "channel_id" as any,
                channelId: "tarot",
                limit: 20
            });

            if (!response?.casts) return;

            for (const cast of response.casts) {
                try {
                    // Same "today" logic if you want to limit to today's casts only
                    const castTime = new Date(cast.timestamp);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Adjust or remove if you don't want the "today only" filter
                    if (castTime >= today && !this.processedCasts.has(cast.hash)) {
                        await this.handleCast(cast);
                        this.processedCasts.add(cast.hash);
                        this.saveProcessedCasts();
                    }
                } catch (error) {
                    console.error('Error processing cast:', error);
                }
            }
        } catch (error: any) {
            console.error('Poll error:', error?.message);
            if (error?.response?.data) {
                console.error('API Response:', error.response.data);
            }
        }
    }

    public async sendTestCast(message: string) {
        try {
            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: message,
                channelId: "tarot"
            });
            console.log('Test cast published to #tarot!');
        } catch (error) {
            console.error('Error publishing test cast:', error);
        }
    }

    private async handleCast(cast: any) {
        try {
            const text = cast.text.toLowerCase();
            console.log('Handling cast:', text);
            let response = '';

            // Simplified text matching like EphemerisChat
            if (text.includes('reading') || text.includes('tarot')) {
                console.log('Tarot request detected');
                const cards = this.tarotReader.selectCards(3);
                console.log('Selected cards:', cards);
                response = this.tarotReader.formatReading(text, cards);
                console.log('Generated response:', response);
            } else {
                response = "✨ Ask for a reading by starting your message with 'reading' or 'tarot'.\n\nFor example: 'reading what should I focus on now?'";
            }

            console.log('About to publish response:', response);
            await this.client.publishCast({
                signerUuid: this.signerUuid,
                text: response,
                parent: cast.hash,
                channelId: 'tarot'
            });
            console.log('Successfully published response');

        } catch (error) {
            console.error('Error handling cast:', error);
        }
    }
}

