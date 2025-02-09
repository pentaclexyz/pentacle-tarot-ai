import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

async function testFilteredStream() {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
        console.error('TWITTER_BEARER_TOKEN is not set');
        return;
    }

    console.log('Bearer Token Length:', bearerToken.length);
    console.log('Bearer Token First 10 Chars:', bearerToken.substring(0, 10));

    try {
        const client = new TwitterApi(bearerToken);

        console.log('Client created successfully');

        // Check existing rules
        const existingRules = await client.v2.streamRules();
        console.log('Existing Rules:', JSON.stringify(existingRules, null, 2));

    } catch (error) {
        console.error('Detailed Error:', error);
        console.error('Error Details:', JSON.stringify(error, null, 2));
    }
}

testFilteredStream();
