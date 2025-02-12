import { Metadata } from 'next';

export async function generateMetadata({
                                           searchParams
                                       }: {
    searchParams: { img?: string } & Promise<{ img?: string }>
}): Promise<Metadata> {
    const imageUrl = searchParams.img || '';

    return {
        title: 'Tarot Reading Image',
        description: 'A tarot reading image generated for your query.',
        openGraph: {
            images: imageUrl ? [{
                url: imageUrl,
                width: 1200,
                height: 630
            }] : [],
        },
    };
}

export default function OgPage({ searchParams }: { searchParams: { img?: string } & Promise<{ img?: string }> }) {
    const imageUrl = searchParams.img || '';

    return (
        <html>
        <head>
            <title>Tarot Reading Image</title>
            {imageUrl && (
                <>
                    <meta property="og:image" content={imageUrl} />
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                </>
            )}
        </head>
        <body>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt="Tarot Reading"
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '630px' }}
                />
            ) : (
                <p>No image available</p>
            )}
        </div>
        </body>
        </html>
    );
}
