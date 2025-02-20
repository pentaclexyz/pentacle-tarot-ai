'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CloudinaryImage {
    public_id: string;
    secure_url: string;
    url: string;
}

export default function Gallery() {
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getImages = async () => {
            try {
                console.log('Fetching images...');
                const res = await fetch('/api/get-images');
                const data = await res.json();
                console.log('Images fetched:', data);

                if (Array.isArray(data)) {
                    setImages(data);
                } else {
                    console.error('Unexpected data format:', data);
                }
            } catch (error) {
                console.error('Failed to fetch images:', error);
            } finally {
                setIsLoading(false);
            }
        };

        getImages();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                    <Card
                        key={image.public_id}
                        className="group cursor-pointer overflow-hidden"
                        onClick={() => setSelectedImage(image)}
                    >
                        <div className="aspect-square relative overflow-hidden">
                            <img
                                src={image.secure_url || image.url}
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
                <DialogContent className="max-w-[600px] p-0">
                    {selectedImage && (
                        <img
                            src={selectedImage.secure_url || selectedImage.url}
                            alt="Tarot Reading"
                            className="w-full h-auto rounded-lg"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
