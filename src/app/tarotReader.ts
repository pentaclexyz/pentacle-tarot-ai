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

    async formatReading(question: string, cards: Array<TarotCard & { isReversed: boolean }>): Promise<string> {
        // First format the cards display
        const cardsDisplay = cards.map((card, index) => {
            const position = ['Past', 'Present', 'Future'][index];
            return `${position}: ${card.name}${card.isReversed ? ' (R)' : ''}`;
        }).join('\n');

        const prompt = `Create a hopeful three-line tarot interpretation (one line per card, max 200 chars total). Original question: "${question}"

Cards drawn:
${cards.map((card, index) => {
            const position = ['Past', 'Present', 'Future'][index];
            return `${position}: ${card.name}${card.isReversed ? ' (R)' : ''} - ${card.summary}`;
        }).join('\n')}

Rules:
1. Keep each line under 60 characters
2. Start each line with ✧
3. Be encouraging but honest
4. Frame challenges as opportunities
5. Use active, direct language
6. First line past tense, second present tense, third future tense`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an insightful and encouraging tarot reader who finds the light in every spread."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 100,
            });

            const interpretation = completion.choices[0].message.content;
            return `🔮 ${cardsDisplay}\n\n${interpretation}`;
        } catch (error) {
            console.error('Error generating reading:', error);
            // Fallback to a simpler interpretation
            return this.generateFallbackReading(cards);
        }
    }

    private generateFallbackReading(cards: Array<TarotCard & { isReversed: boolean }>): string {
        const cardsDisplay = cards.map((card, index) => {
            const position = ['Past', 'Present', 'Future'][index];
            return `${position}: ${card.name}${card.isReversed ? ' (R)' : ''}`;
        }).join('\n');

        const interpretations = cards.map(card => {
            const theme = card.summary.split(',')[0].trim();
            return `✧ ${theme}`;
        }).join('\n');

        return `🔮 ${cardsDisplay}\n\n${interpretations}`;
    }
}
