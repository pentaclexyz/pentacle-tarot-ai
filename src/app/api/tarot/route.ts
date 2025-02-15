// src/app/api/tarot/route.ts
import { TarotService } from '../../../scripts/tarotService';
import { ContentFilter } from '@/lib/contentFilter';
import { RateLimiter } from '@/lib/rateLimiter';
import { uploadToFilebase, ReadingMetadata } from '@/lib/filebase';

const contentFilter = new ContentFilter();
const rateLimiter = new RateLimiter();

export async function POST(req: Request) {
    try {
        // Get IP and admin token
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
        const adminToken = req.headers.get('x-admin-token') || undefined;

        // Check rate limit with potential bypass
        const rateLimit = rateLimiter.checkLimit(ip, adminToken);
        if (!rateLimit.allowed) {
            return Response.json(
                { error: rateLimit.message },
                { status: 429 }
            );
        }

        const { question } = await req.json();

        if (!question) {
            return Response.json({ error: 'Question is required' }, { status: 400 });
        }

        // Validate content
        const validation = contentFilter.validateContent(question);
        if (!validation.isValid) {
            return Response.json(
                { error: validation.message },
                { status: 400 }
            );
        }

        const tarotService = new TarotService();
        const response = await tarotService.generateReading(question);

        // Modify the upload process to be optional and not break the entire request
        try {
            // Format metadata for potential upload
            const metadata: ReadingMetadata = {
                name: `Pentacle Tarot reading ${Date.now()}`,
                description: "Made for you by your bff for inner reflection",
                reading: {
                    cards: response.text.split('\n')[0],
                    interpretation: response.text,
                    timestamp: new Date().toISOString(),
                    type: "tarot"
                },
                image: response.imageUrl
            };

            // Optional upload with fallback
            let ipfsHash;
            try {
                ipfsHash = await uploadToFilebase(metadata);
            } catch (uploadError) {
                console.warn('IPFS upload failed:', uploadError);
                ipfsHash = null;
            }

            return Response.json({
                ...response,
                ipfsHash
            });
        } catch (processingError) {
            console.error('Error processing reading:', processingError);
            return Response.json(response);
        }

    } catch (error) {
        console.error('Detailed API error:', error);
        if (error instanceof Error) {
            return Response.json(
                { error: 'Failed to generate reading', details: error.message },
                { status: 500 }
            );
        }
        return Response.json(
            { error: 'Failed to generate reading' },
            { status: 500 }
        );
    }
}
