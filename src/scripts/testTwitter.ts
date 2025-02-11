import { TwitterIntegration } from './twitterIntegration';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// List of randomized test questions for Twitter
const testQuestions = [
    "@pentacletarot What does my love life look like?",
    "@pentacletarot Will I find true love soon?",
    "@pentacletarot Should I take this new job offer?",
    "@pentacletarot What’s blocking my success?",
    "@pentacletarot Will I ever get back with my ex?",
    "@pentacletarot Is my crush into me?",
    "@pentacletarot What’s my next career move?",
    "@pentacletarot Should I trust this person?",
    "@pentacletarot What should I focus on this month?",
    "@pentacletarot Will my creative project succeed?"
];

// Function to pick a random test question
function getRandomTestQuestion(): string {
    return testQuestions[Math.floor(Math.random() * testQuestions.length)];
}

// Helper function for CLI input
const askQuestion = (query: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

async function testTwitter() {
    try {
        console.log("🔄 Starting Twitter test...");

        // Create a test-mode instance
        const testIntegration = new TwitterIntegration(true);
        const testTweet = getRandomTestQuestion(); // Randomized test question

        console.log("\nProcessing test tweet:");
        console.log(`📨 "${testTweet}"`);

        // ✅ Generate the tarot reading only once
        const tarotReading = await testIntegration.handleMention({
            id: String(Math.floor(Math.random() * 1e18)), // Random numeric ID
            text: testTweet,
            author_id: 'test-user'
        });

        console.log("\n🎴 Generated Reading:");
        console.log(tarotReading);

        // Ask user if they want to post the tweet
        const confirmation = await askQuestion("\n🚀 Publish this tweet to your main account? (yes/no): ");
        if (confirmation.trim().toLowerCase().startsWith("y")) {
            console.log("📤 Publishing tweet...");

            // ✅ Reuse the same tarot reading instead of generating another one
            const liveIntegration = new TwitterIntegration(false);
            const published = await liveIntegration.tweet(tarotReading);

            if (published) {
                console.log("✅ Tweet published successfully.");
            } else {
                console.error("❌ Tweet publication failed.");
            }
        } else {
            console.log("❌ Tweet not published.");
        }

        console.log("✅ Twitter test complete.");
    } catch (error) {
        console.error("❌ Twitter test failed:", error);
    }
}

// Run the test
testTwitter().catch(console.error);
