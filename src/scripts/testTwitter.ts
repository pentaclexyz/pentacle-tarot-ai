import { TwitterIntegration } from './twitterIntegration';
import dotenv from 'dotenv';

dotenv.config();

async function testTwitter() {
    try {
        console.log("Starting Twitter test...");

        // Create Twitter integration instance in test mode
        const twitter = new TwitterIntegration(true);  // true for test mode

        // Test a simple tweet
        const testTweet = "@pentacle-tarot What does my career look like in 2024? 🔮";
        console.log("\nTesting with tweet:", testTweet);

        await twitter.handleMention({
            id: 'test-' + Date.now(),
            text: testTweet,
            author_id: 'test-author'
        });

        console.log("✅ Twitter test complete");

    } catch (error) {
        console.error("❌ Twitter test failed:", error);
        throw error;
    }
}

testTwitter().catch(console.error);
