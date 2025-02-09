// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { FarcasterIntegration } from '../../../scripts/farcasterIntegration';
import { TwitterIntegration } from '../../../scripts/twitterIntegration';

// Instantiate the Farcaster integration (requires Neynar API key and Farcaster signer UUID)
const farcasterIntegration = new FarcasterIntegration(
    process.env.NEYNAR_API_KEY!,
    process.env.FARCASTER_SIGNER_UUID!
);

// Instantiate the Twitter integration (assumes it manages its own credentials)
const twitterIntegration = new TwitterIntegration();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Webhook event received:', JSON.stringify(body, null, 2));

        // Check for a platform field in the event payload
        if (body.platform && body.platform.toLowerCase() === 'twitter') {
            // Extract Twitter mention data from the payload (adjust properties as needed)
            const mention = {
                id: body.data?.id,
                text: body.data?.text,
                author_id: body.data?.author_id,
            };

            if (!mention.id || !mention.text) {
                console.error('Invalid Twitter payload:', body);
            } else {
                await twitterIntegration.handleMention(mention);
            }
        } else if (body.platform && body.platform.toLowerCase() === 'farcaster') {
            await farcasterIntegration.handleWebhookEvent(body);
        } else {
            // If no platform is specified, process for both integrations.
            await farcasterIntegration.handleWebhookEvent(body);
            if (body.data && body.data.id && body.data.text) {
                const mention = {
                    id: body.data.id,
                    text: body.data.text,
                    author_id: body.data.author_id,
                };
                await twitterIntegration.handleMention(mention);
            }
        }

        return NextResponse.json({ message: 'Event processed successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error processing webhook event:', error);
        return NextResponse.json({ message: 'Error processing event' }, { status: 500 });
    }
}
