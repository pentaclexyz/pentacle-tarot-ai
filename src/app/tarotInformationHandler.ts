import OpenAI from 'openai';
import {TarotResponse} from "@/types/tarot";

export class TarotInformationHandler {
    private openai: OpenAI;

    constructor(openaiApiKey: string) {
        this.openai = new OpenAI({ apiKey: openaiApiKey });
    }

    private readonly INFORMATION_PATTERNS = {
        COMMANDS: /^(help|info|about)$/i,
        ABOUT_AGENT: /who (are|r) (you|u)|how (do you|does this) work|tell me about (yourself|urself)/i,
        REVERSED_CARDS: /what (does|is) (the )?[rℝ∀] (mean|symbol)|reversed cards?/i,
        SPECIFIC_CARD: /tell me about (the )?([a-zA-Z\s]+) card/i
    };

    private readonly HELP_INFO = `Available Commands:
✧ @pentacle-tarot help - Show this help message
✧ @pentacle-tarot about - Learn about your tarot reader
✧ @pentacle-tarot info - Quick guide to readings

Reading Types:
✧ Yes/No Reading (1 card)
  • Start with "will" or "should"
  • Example: "@pentacle-tarot Should I take the job?"

✧ Love Reading (3 cards)
  • Include: love, crush, relationship
  • Example: "@pentacle-tarot How's my love life looking?"

✧ Career Reading (3 cards)
  • Include: job, work, career, business
  • Example: "@pentacle-tarot What's next in my career?"

✧ General Reading (3 cards)
  • Any other question
  • Example: "@pentacle-tarot What should I focus on?"

Card Info:
✧ "@pentacle-tarot tell me about [card name]"`;

    private readonly ABOUT_INFO = `✧ Your onchain tarot reader spitting straight facts
✧ Zero sugar-coating, pure unfiltered readings
✧ Using the classic Rider-Waite deck for cosmic clarity

Your brutally honest tarot guide serving unfiltered card wisdom. Type "help" to learn how to get readings.`;

    private readonly REVERSED_INFO = `✧ ℝ means the card showed up upside down in your reading
✧ Reversed energy brings alternative meanings
✧ Different perspective, different path needed

When a card appears reversed, it shifts the energy - not better or worse, just a different angle to consider.`;

    private readonly SPREAD_INFO = `Available Reading Types:

✧ Yes/No Reading (1 card)
  • Start with "will" or "should"
  • Example: "@pentacle-tarot Should I take the job?"

✧ Love Reading (3 cards)
  • Include: love, relationship, crush
  • Example: "@pentacle-tarot What's next in my love life?"

✧ Career Reading (3 cards)
  • Include: job, work, career, business
  • Example: "@pentacle-tarot What's my career path?"

✧ General Reading (3 cards)
  • Any other question gets past/present/future
  • Example: "@pentacle-tarot What should I focus on?"

For specific cards, ask "tell me about [card name]"`;

    private getFallbackImage(): string {
        const totalImages = 6; // Adjust as needed
        const imageNumber = Math.floor(Math.random() * totalImages) + 1;
        const imageNumberPadded = imageNumber.toString().padStart(2, '0');
        const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/tarot-img/reading-${imageNumberPadded}.jpg`;
        console.log('Using fallback image:', url);
        return url;
    }

    public async handleInformationQuery(question: string): Promise<TarotResponse> {
        const imageUrl = this.getFallbackImage();
        const cleanQuestion = question.toLowerCase().replace(/@\w+-\w+\s+/, '').trim();

        // Check for reading type questions first with expanded patterns
        const readingTypePatterns = [
            /what (type|kind|sorts?) of readings?/i,
            /what (readings?|spreads?) (can|do) you/i,
            /how (can|do) i get a reading/i,
            /what readings? (are available|do you offer)/i,
            /tell me about (your |the )?readings?/i,
            /what spreads? (can|do) you (do|have|offer)/i
        ];

        if (readingTypePatterns.some(pattern => pattern.test(cleanQuestion))) {
            return { text: this.SPREAD_INFO, imageUrl };
        }

        // Check for exact commands
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

Then give a 3-sentence summary. Requirements:
- Direct and professional tone
- No casual language (no: mate, bestie, vibes, fam, etc.)
- No slang or colloquialisms
- Clear, concrete examples
- Avoid mystical/flowery language
- Focus on practical interpretations`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a professional tarot reader focused on clear, direct interpretations. Never use casual terms like 'mate', 'bestie', 'vibes', etc. Keep responses straightforward and practical."
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

Then give a unique 3-sentence summary. Requirements:
- Direct and professional punk-aesthetic style
- Never use casual terms (no: mate, bestie, vibes, fam, etc.)
- No slang or colloquialisms
- No exclamation marks
- Sound authentic but professional
- Focus on clear, practical insights

Question to answer: "${question}"`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a professional tarot reader. Keep responses direct and clear. Never use casual terms like 'mate', 'bestie', 'vibes', etc. Maintain a professional tone while being straightforward and punk-aesthetic."
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
            text: completion.choices[0].message.content || "I couldn't process that question. Try asking about specific cards, spreads, or how readings work.",
            imageUrl: this.getFallbackImage()
        };
    }
}
