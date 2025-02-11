import { FarcasterIntegration } from './farcasterIntegration';
import dotenv from 'dotenv';

dotenv.config();

// Randomized test questions
const testQuestions = [
    "@pentacle-tarot What does my love life look like?",
    "@pentacle-tarot Will I find true love soon?",
    "@pentacle-tarot Should I take this new job offer?",
    "@pentacle-tarot What’s blocking my success?",
    "@pentacle-tarot Will I ever get back with my ex?",
    "@pentacle-tarot Is my crush into me?",
    "@pentacle-tarot What’s my next career move?",
    "@pentacle-tarot Should I trust this person?",
    "@pentacle-tarot What should I focus on this month?",
    "@pentacle-tarot Will my creative project succeed?"
];

// Function to pick a random question
function getRandomTestQuestion() {
    return testQuestions[Math.floor(Math.random() * testQuestions.length)];
}

async function runTest() {
    const farcaster = new FarcasterIntegration(
        process.env.NEYNAR_API_KEY!,
        process.env.FARCASTER_SIGNER_UUID!,
        true  // Enable test mode
    );

    const testQuestion = getRandomTestQuestion(); // Get a random question

    console.log('Testing with question:', testQuestion);
    await farcaster.testReading(testQuestion);
}

runTest().catch(console.error);
