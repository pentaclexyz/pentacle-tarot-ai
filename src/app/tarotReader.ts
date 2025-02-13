import { TarotCard } from '@/types/tarot';
import { TAROT_CARDS } from '../lib/tarot';
import crypto from 'crypto';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

interface VeniceResponse {
    images: string[];
}

// Define an interface for the tarot reading response
export interface TarotResponse {
    text: string;
    imageUrl?: string;
}

export class TarotReader {
    private deck = TAROT_CARDS;
    private openai: OpenAI;
    private veniceApiKey: string;

    constructor(openaiApiKey: string, veniceApiKey: string) {
        this.openai = new OpenAI({apiKey: openaiApiKey});
        this.veniceApiKey = veniceApiKey;
    }

    private secureRandom(): number {
        return crypto.randomBytes(4).readUInt32LE() / 0xFFFFFFFF;
    }

    selectCards(
        spreadType: "love" | "career" | "yesno" | "past-present-future"
    ): Array<TarotCard & { isReversed: boolean; position?: string }> {
        const numberOfCards = spreadType === "yesno" ? 1 : 3;
        const selected: Array<TarotCard & { isReversed: boolean; position?: string }> = [];
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
        const lowerQuestion = question.toLowerCase().trim();

        // Remove common prefixes like "@pentacle-tarot" for more accurate matching
        const cleanQuestion = lowerQuestion.replace(/@\w+-\w+\s+/, '');

        // Check for yes/no questions first - this needs to take precedence
        if (/^(will|should|do|does|am|are|is|has|can|could|would|have)\b/i.test(cleanQuestion)) {
            console.log('Detected yes/no question pattern:', cleanQuestion);
            return "yesno";
        }

        // Then check for other types
        if (cleanQuestion.includes("love") || cleanQuestion.includes("relationship") ||
            cleanQuestion.includes("crush") || cleanQuestion.includes("romance")) {
            return "love";
        }
        if (cleanQuestion.includes("job") || cleanQuestion.includes("work") ||
            cleanQuestion.includes("career") || cleanQuestion.includes("business")) {
            return "career";
        }

        return "past-present-future"; // Default spread
    }

    private async uploadToCloudinary(base64Image: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

            cloudinary.uploader.upload(
                `data:image/png;base64,${base64Data}`,
                {
                    folder: 'tarot-readings',
                    transformation: {
                        width: 600,
                        height: 600,
                        crop: "fill",
                        format: "png",
                        quality: "auto"
                    },
                    overwrite: true,
                    unique_filename: true
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(new Error(`Failed to upload image to Cloudinary: ${error.message}`));
                    } else {
                        const cleanUrl = result?.secure_url?.trim().replace(/;$/, '') || '';
                        console.log('Clean Cloudinary URL:', cleanUrl);
                        resolve(cleanUrl);
                    }
                }
            );
        });
    }

    private getFallbackImage(): string {
        const totalImages = 6; // now we have 6 images
        const imageNumber = Math.floor(Math.random() * totalImages) + 1;
        const imageNumberPadded = imageNumber.toString().padStart(2, '0');
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/tarot-img/reading-${imageNumberPadded}.jpg`;
    }

    private async generateTarotImage(
        cards: Array<TarotCard & { isReversed: boolean; position?: string }>
    ): Promise<string> {
        try {
            const cardNames = cards
                .map(card => `${card.name}${card.isReversed ? ' (Reversed)' : ''}`)
                .join(', ');
            const prompt = `punk, hand dawn ink style art, fine ink drawing, edgy punk manga 1960s style ink anime,young female japanese tarot reader with ${cardNames} cards laid out, https://s.mj.run/0LLFDv6GwFw`;
            const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.veniceApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "flux-dev",
                    height: 600,
                    width: 600,
                    safe_mode: true,
                    prompt,
                    style_preset: "Minimalist", // works ok too
                    // style_preset: "Minecraft", // works ok actually yes nice one
                    // style_preset: "Origami", // good kinda modern but decent images
                    // style_preset: "Zentagnle",
                    "hide_watermark": true,
                }),
            });
            if (!response.ok) {
                return this.getFallbackImage();
            }
            const data = (await response.json()) as VeniceResponse;
            if (!data.images?.[0]) {
                return this.getFallbackImage();
            }
            return await this.uploadToCloudinary(data.images[0]);
            return this.getFallbackImage();
        } catch (error) {
            console.error("Error generating image:", error);
            return this.getFallbackImage();
        }
    }

// In the formatReading method, update both the header generation and yes/no section:

    public async formatReading(
        question: string,
        cards: Array<TarotCard & { isReversed: boolean; position?: string }>,
        spreadType: "love" | "career" | "yesno" | "past-present-future"
    ): Promise<TarotResponse> {
        try {
            let cardsHeader = '';
            let interpretation = "";


            // In the formatReading method, update the yes/no section:

            if (spreadType === "yesno") {
                const yesNoAnswer = cards[0].isReversed ? "No" : "Yes";
                const confidence = cards[0].isReversed ? "the cards suggest against it" : "the cards encourage this";
                const header = `${cards[0].name}${cards[0].isReversed ? ' ℝ' : ''}\n\n✧ ${yesNoAnswer} - ${confidence}\n✧ ${cards[0].name}${cards[0].isReversed ? ' reversed' : ''} appears with a clear message\n`;
                const prompt = `For a yes/no question: "${question}", the card is ${cards[0].name}${cards[0].isReversed ? ' reversed' : ''}.
    Write TWO separate sentences:
    1. First sentence starts with "So, [card name] [reversed if applicable], huh?" then explains the card's message
    2. Second sentence gives practical, direct advice based on this insight
    
    Return them as two separate paragraphs with a blank line between them.
    Use a punk-aesthetic Gen-Z style, keeping it brutally honest but supportive.
    Make it sound like advice from a friend, not AI-generated.
    Use hedging language for future possibilities.`;

                const completion = await this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are a punk-aesthetic, no-BS tarot reader. Your readings are insightful, direct, and brutally honest—like a friend who tells you what you need to hear, not what you want to hear. Always return interpretations as two separate paragraphs with a blank line between them."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                });

                const summary = completion.choices[0].message.content || "";
                interpretation = `${header}\n\n${summary.trim()}`;
            } else {
                // Handle other spread types
                cardsHeader = cards
                    .map(card => `${card.name}${card.isReversed ? ' ℝ' : ''}`)
                    .join(' ┆ ');

                // Build the prompt for multi-card reading
                const prompt = `${cards
                    .map(card => `${card.position}: ${card.name}${card.isReversed ? ' reversed' : ''} - ${card.summary}`)
                    .join('\n')}

You are a punk-aesthetic Gen-Z tarot reader. No fluff, no vague nonsense—just raw, direct insights.

**Your Response Format:**
- **Three-line interpretation:**a
  1. Each line must be under **60 characters**.
  2. Each line must start with **"✧ "**.
  3. The first line interprets **${cards[0].position}**, the second **${cards[1].position}**, and the third **${cards[2]?.position || "Future"}**.
  4. **Do not add a full stop** at the end of any of these lines.

- **Final Summary:**
  - Weave in the querent's **exact question** (without "@pentacle-tarot").
  - **Never change, reinterpret, or invent** a different question.
  - **Make it sound like real advice, not AI-generated.**
  - **Return these points as two separate paragraphs with a blank line between them.**
  - **Use hedging language** ("possible," "may," or "could") for future outcomes.
  - **Strictly limit to 3 sentences.**  
  - **Final sentence must be fully complete—no cut-offs.**
  - **Write the summary in a natural way—avoid repetitive phrasing.**
  - **It must still clearly address the querent's question.**

**User's Question:** "${question}"`;

                const completion = await this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are a punk-aesthetic, no-BS tarot reader. Your readings are insightful, direct, and brutally honest—like a friend who tells you what you need to hear, not what you want to hear. Return interpretations as separate paragraphs with blank lines between them."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 400
                });

                interpretation = completion.choices[0].message.content || "";
            }

// Generate image and return
            const imageUrl = await this.generateTarotImage(cards);
            return {
                text: `${cardsHeader}\n\n${interpretation.trim()}`,
                imageUrl
            };
        } catch (error) {
            console.error("Error in formatReading:", error);
            return {
                text: "I apologize, but I encountered an error while generating your reading. Please try again.",
                imageUrl: undefined
            };
        }
    }
}
