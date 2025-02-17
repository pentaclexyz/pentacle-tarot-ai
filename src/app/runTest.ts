// runTest.ts
import { FarcasterIntegration } from '../scripts/farcasterIntegration';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
    const pentacleChat = new FarcasterIntegration(
        process.env.NEYNAR_API_KEY!,
        process.env.SIGNER_UUID!,
        true  // Enable test mode
    );

    await pentacleChat.testReading('@pentacle-tarot What does my career path look like?');
    await pentacleChat.testReading('@pentacle-tarot Should I take the new job offer?');
    await pentacleChat.testReading('@pentacle-tarot What should I focus on today?');
}

test().catch(console.error);
