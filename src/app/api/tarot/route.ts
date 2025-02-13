// src/app/api/tarot/route.ts
import { TarotService } from '../../../scripts/tarotService';
import { ContentFilter } from '@/lib/contentFilter';
import { RateLimiter } from '@/lib/rateLimiter';

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

        return Response.json(response);
    } catch (error) {
        console.error('Error in tarot API:', error);
        return Response.json(
            { error: 'Failed to generate reading' },
            { status: 500 }
        );
    }
}
