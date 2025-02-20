// app/api/get-images/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

export async function GET() {
    try {
        console.log('Starting Cloudinary search...');

        const result = await cloudinary.search
            .expression('folder:tarot-readings/*')
            .sort_by('created_at', 'desc')
            .max_results(500)  // Increased to get all images
            .execute();

        console.log('Search completed, found:', result.resources.length, 'images');

        return NextResponse.json(result.resources);
    } catch (error) {
        console.error('Error fetching images:', error);
        return NextResponse.json(
            { error: 'Failed to fetch images from Cloudinary' },
            { status: 500 }
        );
    }
}
