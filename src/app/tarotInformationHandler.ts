import OpenAI from 'openai';

export interface TarotResponse {
    text: string;
    imageUrl?: string;
}

export class TarotInformationHandler {
    private openai: OpenAI;

    constructor(openaiApiKey: string) {
        this.openai = new OpenAI({ apiKey: openaiApiKey });
    }

    private readonly INFORMATION_PATTERNS = {
        ABOUT_AGENT: /who (are|r) (you|u)|how (do you|does this) work|tell me about (yourself|urself)/i,
        REVERSED_CARDS: /what (does|is) (the )?[rℝ∀] (mean|symbol)|reversed cards?/i,
        SPECIFIC_CARD: /tell me about (the )?([a-zA-Z\s]+) card/i,
        SPREAD_TYPES: /what (types of )?(spreads?|readings?) (can you do|do you offer|are available)|how (can|do) i (get|ask for) (a )?reading|^help$|how (can|do) i use (you|this)|what commands/i,
    };

    private readonly AGENT_INFO = `✧ Your brutally honest tarot bestie, spitting straight facts
✧ No sugar-coating, just pure cosmic guidance vibes
✧ Using the OG Rider-Waite-Smith deck to keep it real

Listen up bestie - I'm your digital tarot reader, and I don't do that vague mystical nonsense. My specialty is serving pure, unfiltered card wisdom with zero fluff. Every reading comes with a visual aesthetic that matches our punk-tarot energy.`;

    private readonly REVERSED_INFO = `✧ ℝ means the card showed up upside down in your reading fr fr
✧ Reversed energy hits different - it's giving blocked vibes
✧ Not bad necessarily, just needs a different approach

Look, when a card goes ℝ mode, it's telling you to switch up your perspective. It's like when your fave song hits different in reverse - same energy, just coming at you from a whole new angle. The universe might be telling you to get creative with your approach.`;

    private readonly SPREAD_INFO = `✧ Quick yes/no: Start with "Will..." or "Should..." for fast answers
✧ Love reading: Ask about relationships, crushes, or romance vibes
✧ Career moves: Ask about work, jobs, business, or professional growth

Here's how to get your cosmic guidance bestie! Want a quick answer? Hit me with a "Should I..." or "Will I..." question for a one-card reality check. Looking for love tea? Just mention "relationship" or "crush" in your q and I'll pull a 3-card spread to decode your heart vibes. Career chaos? Drop words like "job" or "work" in your question and I'll map out your professional path. For anything else, I'll give you that past-present-future spread to light up your journey.`;

    private getFallbackImage(): string {
        const imageNumber = Math.floor(Math.random() * 3) + 1;
        const imageNumberPadded = imageNumber.toString().padStart(2, '0');
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/tarot/reading-${imageNumberPadded}`;
    }

    public async handleInformationQuery(question: string): Promise<TarotResponse> {
        // Get a fallback image for the response
        const imageUrl = this.getFallbackImage();

        // Check if it matches any of our predefined patterns
        if (this.INFORMATION_PATTERNS.ABOUT_AGENT.test(question)) {
            const response = await this.generateContextualResponse(
                "Tell me about yourself as a punk-aesthetic Gen-Z tarot reader"
            );
            return {
                text: response.text,
                imageUrl
            };
        }

        if (this.INFORMATION_PATTERNS.REVERSED_CARDS.test(question)) {
            return {
                text: this.REVERSED_INFO,
                imageUrl
            };
        }

        if (this.INFORMATION_PATTERNS.SPREAD_TYPES.test(question)) {
            return {
                text: this.SPREAD_INFO,
                imageUrl
            };
        }

        const specificCardMatch = question.match(this.INFORMATION_PATTERNS.SPECIFIC_CARD);
        if (specificCardMatch) {
            const response = await this.getSpecificCardInfo(specificCardMatch[2]);
            return {
                ...response,
                imageUrl
            };
        }

        // For any other questions, use GPT to generate a contextual response
        const response = await this.generateContextualResponse(question);
        return {
            ...response,
            imageUrl
        };
    }

    private async getSpecificCardInfo(cardName: string): Promise<TarotResponse> {
        const prompt = `Explain the ${cardName} tarot card with this exact format:

✧ First line about upright meaning (under 60 chars, no period)
✧ Second line about reversed meaning (under 60 chars, no period)
✧ Third line with practical advice (under 60 chars, no period)

Then give a 3-sentence summary in a punk-aesthetic Gen-Z style that's direct and practical. Use hedging language for possibilities. Make it sound like real advice from a friend, not AI-generated. Keep the tone brutally honest but supportive.`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a punk-aesthetic, no-BS tarot reader. Your explanations are direct, practical, and honest."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        return {
            text: completion.choices[0].message.content || "I couldn't find information about that specific card."
        };
    }

    private async generateContextualResponse(question: string): Promise<TarotResponse> {
        const prompt = `Respond to this tarot-related query with this exact format:

✧ First key point about the answer (under 60 chars, no period)
✧ Second key point diving deeper (under 60 chars, no period)
✧ Third key point with practical takeaway (under 60 chars, no period)

Then give a unique 3-sentence summary with these requirements:
- Use a different opening each time (no "Listen up bestie" or similar repeated phrases)
- Write in a punk-aesthetic Gen-Z style (think TikTok energy but make it mystical)
- Keep it brutally honest and direct - zero fluff
- Mix in some current Gen-Z slang naturally
- Make each response feel fresh and original
- Sound like advice from a friend, not AI-generated text
- For identity questions, emphasize being a modern, no-nonsense tarot reader

Question to answer: "${question}"

Previous response to AVOID repeating:
${this.AGENT_INFO}`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a punk-aesthetic, no-BS tarot reader. Your answers are direct, practical, and honest."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        return {
            text: completion.choices[0].message.content || "I couldn't process that question. Try asking about specific cards, spreads, or how readings work!"
        };
    }
}
