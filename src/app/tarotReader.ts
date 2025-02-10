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
            .map((card) => `${card.name}${card.isReversed ? ' ℝ' : ''}`)
            .join(' ┆ ')}`;

        // Ensure the AI *must* address the exact question asked.
        const prompt = `${cards.map((card, index) => {
            const positions = ['Past', 'Present', 'Future'];
            return `${positions[index]}: ${card.name}${card.isReversed ? ' ℝ' : ''} - ${card.summary}`;
        }).join('\n')}

You are a punk-aesthetic Gen-Z tarot reader. No fluff, no vague nonsense—just raw, direct insights.

**Your Response Format:**
- **Three-line interpretation:**
  1. Each line must be under **60 characters**.
  2. Each line must start with **"✧ "**.
  3. The first line interprets **the Past**, the second **the Present**, and the third **the Future**.
  4. **Do not add a full stop** at the end of any of these lines.

- **Final Summary:**
  - Weave in the querent’s **exact question** (without "@pentacle-tarot").
  - **Never change, reinterpret, or invent** a different question.
  - **Make it sound like real advice, not AI-generated.**
  - **Use hedging language** ("possible," "may," or "could") for future outcomes.
  - **Strictly limit to 3 sentences.**  
  - **Final sentence must be fully complete.**
  - **Start the summary with "Regarding your question about [topic]..."** to confirm you are addressing their exact query.

**User's Question:** "${question}"

Do not include any additional text, headers, or labels. Just the reading.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a punk-aesthetic, no-BS tarot reader. Your readings are insightful, direct, and brutally honest—like a friend who tells you what you need to hear, not what you want to hear."
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
            if (!interpretation) {
                throw new Error("Received null response from GPT-4");
            }

            // Combine the header and AI-generated interpretation into one response.
            const unifiedReply = `${cardsHeader}\n\n${interpretation.trim()}`;
            return unifiedReply;
        } catch (error) {
            console.error("Error generating reading:", error);
            throw new Error("Failed to generate tarot reading");
        }
    }

}
