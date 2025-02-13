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
        COMMANDS: /^(help|info|about)$/i,  // Exact command matches
        ABOUT_AGENT: /who (are|r) (you|u)|how (do you|does this) work|tell me about (yourself|urself)/i,
        REVERSED_CARDS: /what (does|is) (the )?[rℝ∀] (mean|symbol)|reversed cards?/i,
        SPECIFIC_CARD: /tell me about (the )?([a-zA-Z\s]+) card/i,
        SPREAD_TYPES: /what (types of )?(spreads?|readings?) (can you do|do you offer|are available)|how (can|do) i (get|ask for) (a )?reading|how (can|do) i use (you|this)|what commands/i,
    };

    private readonly HELP_INFO = `Available Commands:
✧ help - Show this help message
✧ about - Learn about your tarot reader
✧ info - Quick guide to readings

Reading Types:
✧ Yes/No Reading (1 card)
  • Start with "will" or "should"
  • Example: "Should I take the job?"

✧ Love Reading (3 cards)
  • Include: love, crush, relationship
  • Example: "How's my love life looking?"

✧ Career Reading (3 cards)
  • Include: job, work, career, business
  • Example: "What's next in my career?"

✧ General Reading (3 cards)
  • Any other question
  • Example: "What should I focus on?"

Card Info:
✧ Get card meanings with "tell me about [card name]"`;

    private readonly ABOUT_INFO = `✧ Your digital tarot bestie spitting straight facts
✧ Reading cards with zero sugar-coating, all realness
✧ Using classic Rider-Waite deck for cosmic clarity

I'm your brutally honest tarot guide, serving up unfiltered card wisdom. Type "help" to learn how to get readings, or hit me with your questions about life, love, or leveling up your path.`;

    private readonly REVERSED_INFO = `✧ ℝ means the card showed up upside down in your reading fr fr
✧ Reversed energy hits different - it's giving blocked vibes
✧ Not bad necessarily, just needs a different approach

Look, when a card goes ℝ mode, it's telling you to switch up your perspective. It's like when your fave song hits different in reverse - same energy, just coming at you from a whole new angle.`;

    private getFallbackImage(): string {
        const imageNumber = Math.floor(Math.random() * 3) + 1;
        const imageNumberPadded = imageNumber.toString().padStart(2, '0');
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/tarot/reading-${imageNumberPadded}`;
    }

    public async handleInformationQuery(question: string): Promise<TarotResponse> {
        const imageUrl = this.getFallbackImage();
        const cleanQuestion = question.toLowerCase().replace(/@\w+-\w+\s+/, '').trim();

        // Check for exact commands first
        if (this.INFORMATION_PATTERNS.COMMANDS.test(cleanQuestion)) {
            switch(cleanQuestion) {
                case 'help':
                case 'info':
                    return { text: this.HELP_INFO, imageUrl };
                case 'about':
                    return { text: this.ABOUT_INFO, imageUrl };
            }
        }

        // Check other patterns
        if (this.INFORMATION_PATTERNS.REVERSED_CARDS.test(cleanQuestion)) {
            return { text: this.REVERSED_INFO, imageUrl };
        }

        if (this.INFORMATION_PATTERNS.SPECIFIC_CARD.test(cleanQuestion)) {
            const cardMatch = cleanQuestion.match(this.INFORMATION_PATTERNS.SPECIFIC_CARD);
            if (cardMatch) {
                return await this.getSpecificCardInfo(cardMatch[2]);
            }
        }

        if (this.INFORMATION_PATTERNS.ABOUT_AGENT.test(cleanQuestion)) {
            return { text: this.ABOUT_INFO, imageUrl };
        }

        // Fallback to contextual response
        return await this.generateContextualResponse(cleanQuestion);
    }

    private async getSpecificCardInfo(cardName: string): Promise<TarotResponse> {
        const prompt = `Explain the ${cardName} tarot card with this exact format:

✧ First line about upright meaning (under 60 chars, no period)
✧ Second line about reversed meaning (under 60 chars, no period)
✧ Third line with practical advice (under 60 chars, no period)

Then give a 3-sentence summary in a punk-aesthetic Gen-Z style that's direct and practical. Use hedging language for possibilities. Make it sound like real advice from a friend, not AI-generated text.`;

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
            text: completion.choices[0].message.content || "I couldn't find information about that specific card.",
            imageUrl: this.getFallbackImage()
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

Question to answer: "${question}"`;

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
            text: completion.choices[0].message.content || "I couldn't process that question. Try asking about specific cards, spreads, or how readings work!",
            imageUrl: this.getFallbackImage()
        };
    }
}
