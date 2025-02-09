// tarotReader

import { TarotCard } from '@/types/tarot';
import { TAROT_CARDS } from '../lib/tarot';
import crypto from 'crypto';
import OpenAI from 'openai';

export class TarotReader {
    private deck = TAROT_CARDS;
    private openai: OpenAI;

    constructor(openaiApiKey: string) {
        this.openai = new OpenAI({ apiKey: openaiApiKey });
    }

    private secureRandom(): number {
        return crypto.randomBytes(4).readUInt32LE() / 0xFFFFFFFF;
    }

    selectCards(number: number): Array<TarotCard & { isReversed: boolean }> {
        const selected: Array<TarotCard & { isReversed: boolean }> = [];
        const available = [...this.deck];

        while (selected.length < number && available.length > 0) {
            const index = Math.floor(this.secureRandom() * available.length);
            const card = available.splice(index, 1)[0];
            selected.push({
                ...card,
                isReversed: this.secureRandom() > 0.5
            });
        }

        return selected;
    }

    async formatReading(
        question: string,
        cards: Array<TarotCard & { isReversed: boolean }>
    ): Promise<string> {
        // Build the header from your selected cards.
        const cardsHeader = `${cards
            .map((card, index) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const position = ['Past', 'Present', 'Future'][index];
                return `${card.name}${card.isReversed ? ' ®' : ''}`;
            })
            .join(' 🃏 ')}`;

        const prompt = `${cards.map((card, index) => {
            const positions = ['Past', 'Present', 'Future'];
            return `${positions[index]}: ${card.name}${card.isReversed ? ' ®' : ''} - ${card.summary}`;
        }).join('\n')}

Please produce exactly three lines of interpretation that follow these rules:
1. Each line must be under 60 characters
2. Each line must start with the symbol "✨ " (a sparkle emoji and a space)
3. The first line interprets the Past, the second the Present, and the third the Future
4. Do not add a full stop to the end of any of these first three sentences

After these three lines, provide a concise final summary that seamlessly incorporates the original question (ignoring any occurrence of "@pentacle-tarot") into an overall interpretation of the reading. In your wording, do not guarantee any outcomes; use terms like "possible," "may," or "could" instead of "will."

Do not include any additional text, headers, or labels`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an insightful and encouraging tarot reader."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150,
            });

            const interpretation = completion.choices[0].message.content;
            if (interpretation === null) {
                throw new Error("Received null response from GPT-4");
            }

            // Combine the header and GPT interpretation into one unified reply.
            const unifiedReply = `${cardsHeader}\n\n${interpretation.trim()}`;
            return unifiedReply;
        } catch (error) {
            console.error("Error generating reading:", error);
            throw new Error("Failed to generate tarot reading");
        }
    }
}
