import { TarotCard, TarotResponse } from '@/types/tarot';
import { TAROT_CARDS } from '../lib/tarot';
import crypto from 'crypto';
import OpenAI from 'openai';

class TarotReader {
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

    async formatReading(question: string, cards: Array<TarotCard & { isReversed: boolean }>): Promise<TarotResponse> {
        const prompt = `Create a concise THREE-LINE tarot reading (one line per card, max 250 chars total). Question: "${question}"

Cards:
${cards.map((card, index) => {
            const position = ['Past', 'Present', 'Future'][index];
            return `${position}: ${card.name}${card.isReversed ? ' (R)' : ''} - ${card.summary}`;
        }).join('\n')}

Rules:
1. Total response must fit in a Farcaster cast (max 320 chars including the card names!)
2. First line past tense, second present tense, third future tense
3. Each line should start with ✧ 
4. Be direct and insightful
5. Don't include "this means" or "this suggests" - just state it`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a direct and insightful tarot reader who provides concise readings."
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

            // Format with cards and interpretation
            const cardsDisplay = cards.map((card, index) => {
                const position = ['Past', 'Present', 'Future'][index];
                return `${position}: ${card.name}${card.isReversed ? ' (R)' : ''}`;
            }).join('\n');

            const reading = `🔮 ${cardsDisplay}\n\n${interpretation}`;

            // Verify length
            if (reading.length > 320) {
                return {
                    text: this.generateShortFallbackReading(cards),
                    images: []
                };
            }

            return {
                text: reading,
                images: []
            };
        } catch (error) {
            console.error('Error generating reading:', error);
            return {
                text: this.generateShortFallbackReading(cards),
                images: []
            };
        }
    }

    private generateShortFallbackReading(cards: Array<TarotCard & { isReversed: boolean }>): string {
        const cardsDisplay = cards.map((card, index) => {
            const position = ['Past', 'Present', 'Future'][index];
            return `${position}: ${card.name}${card.isReversed ? ' (R)' : ''}`;
        }).join('\n');

        return `🔮 ${cardsDisplay}\n\n✧ ${cards[0].summary.split(',')[0]}\n✧ ${cards[1].summary.split(',')[0]}\n✧ ${cards[2].summary.split(',')[0]}`;
    }
}

export { TarotReader };
