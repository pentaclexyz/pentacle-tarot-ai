// src/app/og/page.tsx

import { Metadata } from 'next';

interface OgPageProps {
    searchParams: {
        img?: string | string[];
    };
}

/**
 * Dynamically generates Open Graph metadata based on the `img` query parameter.
 */
export async function generateMetadata({ searchParams }: OgPageProps): Promise<Metadata> {
    const imgParam = searchParams.img;
    const imageUrl = typeof imgParam === 'string' ? decodeURIComponent(imgParam) : '';

    return {
        title: 'Tarot Reading Image',
        description: 'A tarot reading image generated for your query.',
        openGraph: {
            title: 'Tarot Reading Image',
            description: 'A tarot reading image generated for your query.',
            images: imageUrl
                ? [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: 'Tarot Reading Image',
                    },
                ]
                : [],
        },
    };
}

/**
 * The component renders a preview of the dynamic image.
 * This page is scraped by Warpcast to retrieve OG meta tags.
 */
export default function OgPage({ searchParams }: OgPageProps) {
    const imgParam = searchParams.img;
    const imageUrl = typeof imgParam === 'string' ? decodeURIComponent(imgParam) : '';

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Tarot Reading Image Preview</h1>
            {imageUrl ? (
                <img src={imageUrl} alt="Tarot Reading" style={{ maxWidth: '100%', height: 'auto' }} />
            ) : (
                <p>No image provided.</p>
            )}
        </div>
    );
}
