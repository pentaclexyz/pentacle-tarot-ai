import { NextResponse } from 'next/server';

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

        // Generate a simple JSON representation of the reading
        const readingData = JSON.stringify({
            text: reading.text,
            imageUrl: reading.imageUrl,
            timestamp: new Date().toISOString()
        }, null, 2);

        // In a real scenario, you'd upload this to IPFS here.
        // For now, we'll just simulate an IPFS hash
        const simulatedIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        // Construct the correct Filebase IPFS URL
        const ipfsUrl = `https://pentacle.myfilebase.com/ipfs/${simulatedIpfsHash}`;

        return NextResponse.json({
            success: true,
            message: 'Reading saved successfully',
            ipfsUrl: ipfsUrl,
            readingData: readingData
        });

    } catch (error) {
        console.error('Saving error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save reading'
        }, { status: 500 });
    }
}
