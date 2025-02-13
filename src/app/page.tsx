'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [question, setQuestion] = useState('');
  const [reading, setReading] = useState<{ text: string; imageUrl?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getReading = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
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
    }
  };

  const sendCommand = async (command: string) => {
    setQuestion(command);
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: command })
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      const data = await response.json();
      setReading(data);
    } catch (err) {
      setError('Failed to process command. Please try again.');
      console.error('Error processing command:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        {/* Top Navigation */}
        <nav className="grid justify-items-end p-4 text-xs">
          <div className="space-x-4 !text-xs">
            <Button variant="link" onClick={() => sendCommand('help')}>
              <span className={"text-xs"}>Help</span>
            </Button>
            <Button variant="link" onClick={() => sendCommand('about')}>
              <span className={"text-xs"}>About</span>
            </Button>
            <Button variant="link" onClick={() => sendCommand('What kind of readings do you do?')}>
              <span className={"text-xs"}>Reading Types</span>
            </Button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex text-xs min-h-[calc(100vh-80px)] flex-col items-center px-4 py-4 sm:px-6 lg:px-8 font-berkeley-mono">
          <div className="max-w-4xl w-full space-y-16 text-left">
            {/* Logo and Site Title */}
            <div className="flex items-center justify-center space-x-8">
              <Link href="/" className="block">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-black hover:border-pink-400">
                  <Image
                      src="/pentacle-tarot.jpg"
                      alt="Logo"
                      fill
                      style={{ objectFit: 'cover' }}
                  />
                </div>
              </Link>
              <div className="text-left">
                <h1 className="text-2xl uppercase">Pentacle Tarot Agent</h1>
                <h2 className="mt-1 text-xs text-gray-600">
                  Your sassy companion for inner reflection
                </h2>
              </div>
            </div>

            {/* Intro Text*/}
            {/*<div className="max-w-4xl mx-auto text-xs text-gray-700">*/}
            {/*  <p className="mb-4">*/}
            {/*    Receive an instant tarot reading tailored to your question.*/}
            {/*  </p>*/}
            {/*</div>*/}

            {/* Question Input */}
            <div className="grid gap-8">
              <div className="flex gap-2 justify-center">
                <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask your question..."
                    className="flex-1 !text-xs"
                />
                <Button onClick={getReading} disabled={loading || !question} className={"text-xs"}>
                  {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reading...
                      </>
                  ) : (
                      'Ask the Tarot'
                  )}
                </Button>
              </div>

              {/* Error Alert */}
              {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {/* Reading Results */}
              {reading && (
                  <div className="flex flex-col sm:flex-row gap-x-8 p-6 border border-black card-bevel hover:bg-yellow-50">
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
                    </div>
                  </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        {/*<footer className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-[#FFFCF1]">*/}
        {/*  <div className="max-w-4xl mx-auto border-t border-black">*/}
        {/*    <div className="pt-3 flex justify-between items-center">*/}
        {/*      <div className="text-xs text-black">*/}
        {/*        © Pentacle Tarot Agent 2025*/}
        {/*      </div>*/}
        {/*      <Image*/}
        {/*          src="/pentacle-icon.svg"*/}
        {/*          alt="Pentacle Icon"*/}
        {/*          width={16}*/}
        {/*          height={16}*/}
        {/*      />*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</footer>*/}
      </>
  );
}
