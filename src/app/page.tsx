'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <main className="container mx-auto p-4 max-w-3xl">
        {/* Top Navigation */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <img
                src="/pentacle-tarot.jpg"
                alt="Logo"
                className="w-10 h-10 rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold">Pentacle Tarot Agent</h1>
              <p className="text-sm text-muted-foreground">
                Ask a question or use quick commands
              </p>
            </div>
          </div>
          <div className="space-x-2">
            <Button variant="link" onClick={() => sendCommand('help')}>
              Help
            </Button>
            <Button variant="link" onClick={() => sendCommand('about')}>
              About
            </Button>
            <Button variant="link" onClick={() => sendCommand('What kind of readings do you do?')}>
              Reading Types
            </Button>
          </div>
        </header>

        {/* Question Input (No Card Wrapper) */}
        <section className="mb-8">
          <div className="flex gap-2">
            <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your question..."
                className="flex-1"
            />
            <Button onClick={getReading} disabled={loading || !question}>
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
        </section>

        {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {reading && (
            <Card>
              <CardContent className="pt-6">
                <div className="whitespace-pre-wrap mb-4">{reading.text}</div>
                {reading.imageUrl && (
                    <img
                        src={reading.imageUrl}
                        alt="Tarot Reading"
                        className="w-full h-auto rounded-lg shadow-lg"
                    />
                )}
              </CardContent>
            </Card>
        )}
      </main>
  );
}
