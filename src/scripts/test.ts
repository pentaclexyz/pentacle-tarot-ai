import { FarcasterIntegration } from './farcasterIntegration';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const farcaster = new FarcasterIntegration(
        process.env.NEYNAR_API_KEY!,
        process.env.FARCASTER_SIGNER_UUID!,
        true  // Enable test mode
    );

    const testQuestion = '@pentacle-tarot What does my love life look like?';

    console.log('Testing with question:', testQuestion);
    await farcaster.testReading(testQuestion);
}

runTest().catch(console.error);
