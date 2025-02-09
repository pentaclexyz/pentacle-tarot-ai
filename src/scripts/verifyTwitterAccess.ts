import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function basicEndpointTest() {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
        console.error('TWITTER_BEARER_TOKEN is not set in the environment variables');
        return;
    }

    try {
        // Create the client using the Bearer token (OAuth 2.0 Application-only)
        const client = new TwitterApi(bearerToken);

        // Use the GET method to access the recent search endpoint with valid parameters
        const searchResult = await client.v2.get('tweets/search/recent', { query: 'from:TwitterDev', max_results: 10 });
        console.log('Search result:', searchResult);
    } catch (error: unknown) {
        // Narrow the type of error
        if (typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: number }).code === 'number') {
            const err = error as { code: number };
            if (err.code === 429) {
                console.error('Rate limit exceeded. Please try again later.');
            } else {
                console.error('Endpoint Test Error:', error);
                console.error('Detailed Error:', JSON.stringify(error, null, 2));
            }
        } else {
            // If error does not have a code property, log it directly.
            console.error('Endpoint Test Error:', error);
        }
    }
}

basicEndpointTest();
