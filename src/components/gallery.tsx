'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CloudinaryImage {
    public_id: string;
    secure_url: string;
    created_at: string;
}

interface ApiResponse {
    images: CloudinaryImage[];
    total: number;
    error?: string;
}

export default function Gallery() {
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                setError(null);
                const response = await fetch('/api/get-images');
                const data: ApiResponse = await response.json();

                // Debug log
                console.log('API Response:', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch images');
                }

                if (data.images && Array.isArray(data.images)) {
                    setImages(data.images);
                    console.log(`Loaded ${data.images.length} images successfully`);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Gallery error:', error);
                setError(error instanceof Error ? error.message : 'Failed to load images');
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!images.length) {
        return (
            <Alert className="my-4">
                <AlertDescription>No images found in the gallery.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                    <Card
                        key={image.public_id}
                        className="group cursor-pointer overflow-hidden"
                        onClick={() => setSelectedImage(image)}
                    >
                        <div className="aspect-square relative overflow-hidden">
                            <img
                                src={image.secure_url}
                                alt="Tarot Reading"
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog
                open={!!selectedImage}
                onOpenChange={() => setSelectedImage(null)}
            >
                <DialogContent className="max-w-4xl p-0">
                    {selectedImage && (
                        <img
                            src={selectedImage.secure_url}
                            alt="Tarot Reading"
                            className="w-full h-auto rounded-lg"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
