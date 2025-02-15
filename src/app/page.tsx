'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { SignInButton } from "@/components/signInbutton";

export default function Home() {
    const [question, setQuestion] = useState('');
    const [reading, setReading] = useState<{ text: string; imageUrl?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingStage, setLoadingStage] = useState(0);
    const [isMinting, setIsMinting] = useState(false);

    const loadingMessages = [
        "Analyzing your question to choose the perfect spread...",
        "Drawing the cards and interpreting their energy...",
        "Generating a visual representation of your reading..."
    ];

    const getReading = async () => {
        try {
            setLoading(true);
            setError('');

            // First message (analyzing)
            setLoadingStage(0);
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Second message (drawing cards)
            setLoadingStage(1);
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Third message (generating image) - stays until done
            setLoadingStage(2);

            const response = await fetch('/api/tarot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({question})
            });

            if (!response.ok) {
                throw new Error('Failed to get reading');
            }

            const data = await response.json();
            setReading(data);

        } catch (err) {
            setError('Failed to get reading. Please try again.');
            console.error('Error getting reading:', err);
        } finally {
            setLoading(false);
            setLoadingStage(0);
        }
    };

    const mintReading = async () => {
        try {
            setIsMinting(true);
            const response = await fetch('/api/mint', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(reading)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save reading');
            }

            console.log('IPFS upload result:', result);

            // Open IPFS URLs if available
            if (result.imageUrl) {
                window.open(result.imageUrl, '_blank');
            }
            if (result.textUrl) {
                window.open(result.textUrl, '_blank');
            }

            alert('Reading saved to IPFS successfully!');
        } catch (error) {
            console.error('Minting error:', error);
            alert(error.message || 'Failed to save reading');
        } finally {
            setIsMinting(false);
        }
    };
    const sendCommand = async (command: string) => {
        setQuestion(command);
        try {
            setError('');

            const response = await fetch('/api/tarot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({question: command})
            });

            if (!response.ok) {
                throw new Error('Failed to process command');
            }

            const data = await response.json();
            setReading(data);
        } catch (err) {
            setError('Failed to process command. Please try again.');
            console.error('Error processing command:', err);
        }
    };

    return (
        <>
            <nav className="grid justify-items-end p-4 text-xs">
                <div className="flex space-x-4 !text-xs">
                    <Button variant="link" onClick={() => sendCommand('help')}>
                        <span className={"text-xs"}>Help</span>
                    </Button>
                    <Button variant="link" onClick={() => sendCommand('about')}>
                        <span className={"text-xs"}>About</span>
                    </Button>
                    <Button variant="link" onClick={() => sendCommand('What kind of readings do you do?')}>
                        <span className={"text-xs"}>Reading Types</span>
                    </Button>
                    <div>
                        <SignInButton/>
                    </div>
                </div>
            </nav>

            <main
                className="flex text-xs min-h-[calc(100vh-80px)] flex-col items-center px-4 py-4 sm:px-6 lg:px-8 font-berkeley-mono">
                <div className="max-w-4xl w-full space-y-16 text-left">
                    <div className="flex items-center justify-center space-x-8">
                        <Link href="/" className="block">
                            <div
                                className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-black hover:border-pink-400">
                                <Image
                                    src="/pentacle-tarot.jpg"
                                    alt="Logo"
                                    fill
                                    style={{objectFit: 'cover'}}
                                />
                            </div>
                        </Link>
                        <div className="text-left">
                            <h1 className="text-2xl uppercase">Pentacle Tarot</h1>
                            <h2 className="mt-1 text-xs text-gray-600">
                                Your bff for inner reflection
                            </h2>
                        </div>
                    </div>

                    <div className="grid gap-8">
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask your question..."
                                className="flex-1 !text-xs"
                            />
                            <Button onClick={getReading} disabled={loading || !question} className={"text-xs"}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        {loadingMessages[loadingStage]}
                                    </>
                                ) : (
                                    'Ask the Tarot'
                                )}
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {reading && (
                            <div
                                className="flex flex-col sm:flex-row gap-x-8 p-6 border border-black card-bevel hover:bg-yellow-50">
                                <div className="flex-1 whitespace-pre-wrap mb-4">{reading.text}</div>
                                <div className={"flex-1"}>
                                    {reading.imageUrl && (
                                        <Image
                                            src={reading.imageUrl}
                                            alt="Tarot Reading"
                                            width={400}
                                            height={400}
                                            className="rounded-lg shadow-lg"
                                        />
                                    )}
                                    <Button
                                        onClick={mintReading}
                                        disabled={isMinting}
                                        className="mt-4"
                                    >
                                        {isMinting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Minting...
                                            </>
                                        ) : (
                                            'Mint Reading'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
