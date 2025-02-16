import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { reading } = await req.json();

        // Check if reading.cid is set
        if (!reading.cid) {
            throw new Error('CID is missing from the reading. Please try generating your reading again.');
        }

        const ipfsUrl = `https://pentacle.myfilebase.com/ipfs/${reading.cid}`;

        return NextResponse.json({
            success: true,
            message: 'Reading minted successfully',
            ipfsUrl
        });
    } catch (error) {
        console.error('Minting error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to mint reading'
        }, { status: 500 });
    }
}

