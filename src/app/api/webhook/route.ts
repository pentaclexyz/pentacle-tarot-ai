// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PentacleChat } from '@/scripts/pentacleChat';

const apiKey = process.env.NEYNAR_API_KEY!;
const signerUuid = process.env.FARCASTER_SIGNER_UUID!;
const pentacleChat = new PentacleChat(apiKey, signerUuid);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Webhook event received:', JSON.stringify(body, null, 2));

        if (body.type === 'cast.created') {
            await pentacleChat.handleWebhookEvent(body);
        }

        return NextResponse.json({ message: 'Event processed successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error processing webhook event:', error);
        return NextResponse.json({ message: 'Error processing event' }, { status: 500 });
    }
}
