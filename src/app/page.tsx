// src/app/page.tsx
'use client';

import { useState } from 'react';

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

  // Simple help commands for testing
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
      <main className="p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl mb-4">Tarot Reader</h1>

          {/* Quick commands for testing */}
          <div className="mb-4 space-x-2">
            <button
                onClick={() => sendCommand('help')}
                className="border px-2 py-1 rounded"
            >
              Help
            </button>
            <button
                onClick={() => sendCommand('about')}
                className="border px-2 py-1 rounded"
            >
              About
            </button>
            <button
                onClick={() => sendCommand('What kind of readings do you do?')}
                className="border px-2 py-1 rounded"
            >
              Reading Types
            </button>
          </div>

          <div className="mb-4">
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your question..."
                className="w-full p-2 border rounded"
            />
            <button
                onClick={getReading}
                disabled={loading || !question}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Getting Reading...' : 'Get Reading'}
            </button>
          </div>

          {error && (
              <div className="text-red-500 mb-4">
                {error}
              </div>
          )}

          {reading && (
              <div className="mt-4">
                <pre className="whitespace-pre-wrap">{reading.text}</pre>
                {reading.imageUrl && (
                    <img
                        src={reading.imageUrl}
                        alt="Tarot Reading"
                        className="mt-4 max-w-full h-auto"
                    />
                )}
              </div>
          )}
        </div>
      </main>
  );
}
