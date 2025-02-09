import { TwitterIntegration } from './twitterIntegration';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Helper function to ask for user input via the CLI.
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
        console.log("Starting Twitter test...");

        // Create a test-mode instance to generate the reading without live posting.
        const testIntegration = new TwitterIntegration(true);
        const testTweet = "@pentacletarot What does my career look like in 2024? 🔮";
        console.log("\nProcessing tweet:");
        console.log(testTweet);

        // Temporarily suppress console.log to avoid extra logs from handleMention.
        const originalConsoleLog = console.log;
        console.log = () => {};

        const tarotReading = await testIntegration.handleMention({
            id: String(Math.floor(Math.random() * 1e18)), // Random numeric ID
            text: testTweet,
            author_id: 'test-author'
        });

        // Restore console.log
        console.log = originalConsoleLog;

        // Print the generated reading only once.
        console.log("\nGenerated Reading:");
        console.log(tarotReading);

        // Ask for confirmation before publishing the tweet.
        const confirmation = await askQuestion("\nDo you want to publish this tweet to your main Twitter account? (yes/no): ");
        const answer = confirmation.trim().toLowerCase();
        if (answer === "yes" || answer === "y") {
            console.log("Publishing tweet...");

            // Create a live-mode instance and post the tweet.
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

testTwitter().catch(console.error);
