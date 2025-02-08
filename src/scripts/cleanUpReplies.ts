import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface NeynarApiResponse {
    result?: {
        casts: Array<{
            hash: string;
            author: {
                fid: number;
                username: string;
            };
        }>;
        next?: {
            cursor?: string | null;
        };
    };
    casts?: Array<{
        hash: string;
        author: {
            fid: number;
            username: string;
        };
    }>;
    next?: {
        cursor?: string | null;
    };
}

const API_KEY = process.env.NEYNAR_API_KEY;
const SIGNER_UUID = process.env.FARCASTER_SIGNER_UUID;
const BOT_FID = 981878;

if (!API_KEY || !SIGNER_UUID) {
    console.error('Missing required environment variables. Check your .env file.');
    process.exit(1);
}

export class ReplyCleanup {
    private apiKey: string;
    private signerUuid: string;

    constructor(apiKey: string, signerUuid: string) {
        this.apiKey = apiKey;
        this.signerUuid = signerUuid;
    }

    public async cleanupAllReplies() {
        try {
            console.log('Starting cleanup of bot replies...');
            console.log(`Bot FID: ${BOT_FID}`);

            let cursor: string | undefined = undefined;
            let totalDeleted = 0;
            let totalAttempted = 0;

            do {
                const response: AxiosResponse<NeynarApiResponse> = await axios.get(
                    // 'https://api.neynar.com/v2/farcaster/feed/user/replies_and_recasts',
                    {
                        params: {
                            fid: BOT_FID,
                            filter: 'all',
                            limit: 50,
                            cursor: cursor
                        },
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': this.apiKey
                        }
                    }
                );

                const casts = response.data?.result?.casts || response.data?.casts || [];

                console.log(`Casts found in this batch: ${casts.length}`);

                // Filter out only bot-created replies
                const botReplies = casts.filter(cast => cast.author?.fid === BOT_FID);

                console.log(`Bot replies in this batch: ${botReplies.length}`);

                for (const cast of botReplies) {
                    try {
                        totalAttempted++;
                        console.log(`Attempting to delete reply: ${cast.hash}`);

                        await axios.delete(`https://api.neynar.com/v2/farcaster/cast`, {
                            headers: {
                                'accept': 'application/json',
                                'content-type': 'application/json',
                                'x-api-key': this.apiKey
                            },
                            data: {
                                target_hash: cast.hash,
                                signer_uuid: this.signerUuid
                            }
                        });

                        console.log(`Successfully deleted reply: ${cast.hash}`);
                        totalDeleted++;
                    } catch (deleteError: any) {
                        if (deleteError.response && deleteError.response.status === 404) {
                            console.log(`Reply ${cast.hash} not found (already deleted)`);
                        } else {
                            console.error(`Error deleting reply ${cast.hash}:`, deleteError);
                        }
                    }
                }

                // Update cursor for next iteration
                cursor = response.data.result?.next?.cursor ||
                    response.data.next?.cursor ||
                    undefined;

                if (!cursor) break;

            } while (true);

            console.log(`Cleanup completed.`);
            console.log(`Total replies attempted: ${totalAttempted}`);
            console.log(`Total replies successfully deleted: ${totalDeleted}`);
        } catch (error) {
            console.error('Error during cleanup:', error);
            console.error(JSON.stringify(error, null, 2));
        }
    }
}

// Create and run the cleanup
const cleanup = new ReplyCleanup(API_KEY, SIGNER_UUID);
cleanup.cleanupAllReplies().catch(console.error);
