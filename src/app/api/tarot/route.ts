// src/app/api/tarot/route.ts
import { TarotService } from '../../../scripts/tarotService';
import { ContentFilter } from '@/lib/contentFilter';
import { RateLimiter } from '@/lib/rateLimiter';
import { uploadToFilebase, uploadImageToFilebase, ReadingMetadata } from '@/lib/filebase';

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
            return Response.json({ error: rateLimit.message }, { status: 429 });
        }

        const { question } = await req.json();
        if (!question) {
            return Response.json({ error: 'Question is required' }, { status: 400 });
        }

        // Validate content
        const validation = contentFilter.validateContent(question);
        if (!validation.isValid) {
            return Response.json({ error: validation.message }, { status: 400 });
        }

        const tarotService = new TarotService();
        const response = await tarotService.generateReading(question);

        // First, upload the image (if available) to Filebase
        let imageIpfsCid: string | null = null;
        if (response.imageUrl) {
            try {
                imageIpfsCid = await uploadImageToFilebase(response.imageUrl);
            } catch (imageUploadError) {
                console.warn('IPFS upload (image) failed:', imageUploadError);
                imageIpfsCid = null;
            }
        }

        // Build the Filebase image URL if the image was successfully uploaded
        const filebaseImageUrl = imageIpfsCid
            ? `https://pentacle.myfilebase.com/ipfs/${imageIpfsCid}`
            : response.imageUrl; // fallback to the Cloudinary URL if upload failed

        // Now, prepare the metadata with the updated image URL
        const metadata: ReadingMetadata = {
            name: `Pentacle Tarot reading ${Date.now()}`,
            description: "Made for you by your bff for inner reflection",
            reading: {
                cards: response.text.split('\n')[0],
                interpretation: response.text,
                timestamp: new Date().toISOString(),
                type: "tarot"
            },
            image: filebaseImageUrl
        };

        // Upload the metadata JSON to Filebase
        let cid;
        try {
            cid = await uploadToFilebase(metadata);
        } catch (uploadError) {
            console.warn('IPFS upload (metadata) failed:', uploadError);
            cid = null;
        }

        return Response.json({
            ...response,
            cid,
            imageCid: imageIpfsCid
        });
    } catch (error) {
        console.error('Detailed API error:', error);
        return Response.json(
            { error: 'Failed to generate reading', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
