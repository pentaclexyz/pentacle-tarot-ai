// src/app/api/mint/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // Validate Filebase credentials
        const apiKey = process.env.FILEBASE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'Filebase API key not configured'
            }, { status: 500 });
        }

        const reading = await req.json();

        // Validate reading data
        if (!reading || !reading.text || !reading.imageUrl) {
            return NextResponse.json({
                success: false,
                error: 'Invalid reading data'
            }, { status: 400 });
        }

        // If image is already on Cloudinary, we can use that URL directly
        return NextResponse.json({
            success: true,
            message: 'Reading prepared for minting',
            imageUrl: reading.imageUrl,
            text: reading.text
        });

    } catch (error) {
        console.error('Minting preparation error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to prepare reading for minting'
        }, { status: 500 });
    }
}
