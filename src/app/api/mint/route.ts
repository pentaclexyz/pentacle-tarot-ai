import { NextResponse } from 'next/server';
import { Filebase } from '@filebase/sdk';

// Initialize Filebase client
const filebase = new Filebase({
    apiKey: process.env.FILEBASE_API_KEY,
    apiSecret: process.env.FILEBASE_API_SECRET
});

export async function POST(req: Request) {
    try {
        const { reading } = await req.json();

        // Validate reading data
        if (!reading || !reading.text || !reading.imageUrl) {
            return NextResponse.json({
                success: false,
                error: 'Invalid reading data'
            }, { status: 400 });
        }

        // Generate JSON representation of the reading
        const readingData = JSON.stringify({
            text: reading.text,
            imageUrl: reading.imageUrl,
            timestamp: new Date().toISOString()
        }, null, 2);

        // Upload to IPFS via Filebase
        const uploadResult = await filebase.upload({
            data: Buffer.from(readingData),
            name: 'tarot-reading.json',
            bucket: process.env.FILEBASE_BUCKET_NAME
        });

        // Construct the IPFS URL
        const ipfsUrl = `https://pentacle.myfilebase.com/ipfs/${uploadResult.cid}`;

        return NextResponse.json({
            success: true,
            message: 'Reading saved successfully',
            ipfsUrl: ipfsUrl,
            cid: uploadResult.cid
        });

    } catch (error) {
        console.error('Saving error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save reading'
        }, { status: 500 });
    }
}
