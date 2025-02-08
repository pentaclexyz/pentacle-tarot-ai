// src/scripts/cleanUpReplies.ts
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.NEYNAR_API_KEY;
const SIGNER_UUID = process.env.FARCASTER_SIGNER_UUID;
const BOT_FID = 981878;

if (!API_KEY || !SIGNER_UUID) {
    console.error('Missing required environment variables. Check your .env file.');
    process.exit(1);
}

export class ReplyCleanup {
    private client: NeynarAPIClient;
    private signerUuid: string;

    constructor(apiKey: string, signerUuid: string) {
        this.client = new NeynarAPIClient({ apiKey });
        this.signerUuid = signerUuid;
    }

    public async cleanupAllReplies() {
        try {
            console.log('Starting cleanup of all bot casts...');

            const response = await this.client.fetchFeed({
                feedType: "filter" as any,
                filterType: "fids" as any,
                fids: BOT_FID.toString(),
                limit: 100
            });

            if (!response?.casts) {
                console.log('No casts found');
                return;
            }

            console.log(`Total casts fetched: ${response.casts.length}`);

            for (const cast of response.casts) {
                try {
                    console.log('Deleting cast:', cast.hash);
                    await this.client.deleteCast({
                        signerUuid: this.signerUuid,
                        targetHash: cast.hash
                    });
                    console.log('Successfully deleted cast');
                } catch (error) {
                    console.error(`Error deleting cast ${cast.hash}:`, error);
                }
            }

            console.log('Cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Create and run the cleanup
const cleanup = new ReplyCleanup(API_KEY, SIGNER_UUID);
cleanup.cleanupAllReplies().catch(console.error);
