// src/app/api/tarot/route.ts
import { TarotService } from '@/app/tarotService';

export async function POST(req: Request) {
    try {
        const { question } = await req.json();

        if (!question) {
            return Response.json({ error: 'Question is required' }, { status: 400 });
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
