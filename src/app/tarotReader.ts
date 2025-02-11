// tarotReader

import { TarotCard } from '@/types/tarot';
import { TAROT_CARDS } from '../lib/tarot';
import crypto from 'crypto';
import OpenAI from 'openai';

export class TarotReader {
    private deck = TAROT_CARDS;
    private openai: OpenAI;

    constructor(openaiApiKey: string) {
        this.openai = new OpenAI({apiKey: openaiApiKey});
    }

    private secureRandom(): number {
        return crypto.randomBytes(4).readUInt32LE() / 0xFFFFFFFF;
    }

    selectCards(spreadType: "love" | "career" | "yesno" | "past-present-future"): Array<TarotCard & {
        isReversed: boolean,
        position?: string
    }> {
        const numberOfCards = spreadType === "yesno" ? 1 : 3;
        const selected: Array<TarotCard & { isReversed: boolean, position?: string }> = [];
        const available = [...this.deck];

        const spreadPositions: Record<string, string[]> = {
            "past-present-future": ["Past", "Present", "Future"],
            "love": ["Your Energy", "The Relationship", "Outcome"],
            "career": ["Current Job", "Challenges", "Next Steps"],
            "yesno": ["Answer"]
        };

        while (selected.length < numberOfCards && available.length > 0) {
            const index = Math.floor(this.secureRandom() * available.length);
            const card = available.splice(index, 1)[0];
            selected.push({
                ...card,
                isReversed: this.secureRandom() > 0.5,
                position: spreadPositions[spreadType][selected.length] || ""
            });
        }
        return selected;
    }


    determineSpreadType(question: string): "love" | "career" | "yesno" | "past-present-future" {
        const lowerQuestion = question.toLowerCase();

        if (lowerQuestion.includes("love") || lowerQuestion.includes("relationship") || lowerQuestion.includes("crush") || lowerQuestion.includes("romance")) {
            return "love";
        }
        if (lowerQuestion.includes("job") || lowerQuestion.includes("work") || lowerQuestion.includes("career") || lowerQuestion.includes("business")) {
            return "career";
        }
        if (lowerQuestion.startsWith("will ") || lowerQuestion.startsWith("should ")) {
            return "yesno";
        }
        return "past-present-future"; // Default spread
    }


    async formatReading(
        question: string,
        cards: Array<TarotCard & { isReversed: boolean, position?: string }>,
        spreadType: "love" | "career" | "yesno" | "past-present-future"
    ): Promise<string> {
        const cardsHeader = `${cards
            .map((card) => `${card.name}${card.isReversed ? ' ℝ' : ''}`)
            .join(' ┆ ')}`;

        let prompt = "";

        if (spreadType === "yesno") {
            const yesNoAnswer = cards[0].isReversed ? "No" : "Yes";
            prompt = `You are a punk tarot reader. Give a **bold, direct** one-line response to a yes/no question based on this card. The answer is "${yesNoAnswer}".  
        
        Do NOT explain the card, just give the answer and a one-liner explaining it.`;
        } else {
            prompt = `${cards.map((card) => `${card.position}: ${card.name}${card.isReversed ? ' ℝ' : ''} - ${card.summary}`).join('\n')}

You are a punk-aesthetic Gen-Z tarot reader. No fluff, no vague nonsense—just raw, direct insights.

**Your Response Format:**
- **Three-line interpretation:**
  1. Each line must be under **60 characters**.
  2. Each line must start with **"✧ "**.
  3. The first line interprets **${cards[0].position}**, the second **${cards[1].position}**, and the third **${cards[2]?.position || "Future"}**.
  4. **Do not add a full stop** at the end of any of these lines.

- **Final Summary:**
  - Weave in the querent’s **exact question** (without "@pentacle-tarot").
  - **Never change, reinterpret, or invent** a different question.
  - **Make it sound like real advice, not AI-generated.**
  - **Use hedging language** ("possible," "may," or "could") for future outcomes.
  - **Strictly limit to 3 sentences.**  
  - **Final sentence must be fully complete.**
    - **Final sentence must always fully complete—no cut-offs**  
  - **Write the summary in a natural way—avoid repetitive phrasing.**
  - **Make sure it sounds conversational, not formulaic.**
  - **It must still clearly address the querent’s question.**

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

                const unifiedReply = `${cardsHeader}\n\n${interpretation.trim()}`;
                return unifiedReply;
            } catch (error) {
                console.error("Error generating reading:", error);
                throw new Error("Failed to generate tarot reading");
            }
        }
        return "✧ Error: No valid tarot reading could be generated.";
    }
}
