import { TwitterIntegration } from './twitterIntegration';
import dotenv from 'dotenv';

dotenv.config();

async function startTwitterListener() {
    try {
        console.log("Starting live Twitter listener...");
        const twitter = new TwitterIntegration(false); // live mode
        await twitter.startListening();
    } catch (error) {
        console.error("Error starting live listener:", error);
    }
}

startTwitterListener().catch(console.error);
