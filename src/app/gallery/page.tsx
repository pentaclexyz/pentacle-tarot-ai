// app/gallery/page.tsx
import Gallery from '@/components/gallery';

export const metadata = {
    title: 'Tarot Reading Gallery | Pentacle',
    description: 'Browse through the collection of AI-generated tarot reading artwork'
};

export default function GalleryPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Images
                    </h1>
                    <p className="text-lg text-gray-600">
                        Browse through our collection of AI-generated tarot reading artwork
                    </p>
                </div>

                <Gallery />
            </div>
        </main>
    );
}
