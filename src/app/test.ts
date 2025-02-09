// test.ts
import { PentacleChat } from '../scripts/PentacleChat';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const pentacleChat = new PentacleChat(
        process.env.NEYNAR_API_KEY!,
        process.env.SIGNER_UUID!,
        true  // Enable test mode
    );

    const testQuestion = '@pentacle-tarot What does my career path look like?';

    console.log('Testing with question:', testQuestion);
    await pentacleChat.testReading(testQuestion);
}

runTest().catch(console.error);
