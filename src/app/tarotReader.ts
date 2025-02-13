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

// interface VeniceResponse {
//     images: string[];
// }

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
                        width: 800,
                        height: 340,
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
                        // Clean the URL of any trailing semicolons or whitespace
                        const cleanUrl = result?.secure_url?.trim().replace(/;$/, '') || '';
                        console.log('Clean Cloudinary URL:', cleanUrl);
                        resolve(cleanUrl);
                    }
                }
            );
        });
    }

    private getFallbackImage(): string {
        const imageNumber = Math.floor(Math.random() * 3) + 1;
        const imageNumberPadded = imageNumber.toString().padStart(2, '0');
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/tarot/reading-${imageNumberPadded}`;
    }

    private async generateTarotImage(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cards: Array<TarotCard & { isReversed: boolean; position?: string }>
    ): Promise<string> {
        try {
            // Temporarily comment out Venice AI generation
            // const cardNames = cards
            //     .map(card => `${card.name}${card.isReversed ? ' (Reversed)' : ''}`)
            //     .join(', ');

            // const prompt = `japanese anime girl, mystic, american 1960s style ink cartoon, age 35, tarot reader with ${cardNames} cards laid out, https://s.mj.run/0LLFDv6GwFw`;

            // const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
            //     method: 'POST',
            //     headers: {
            //         'Authorization': `Bearer ${this.veniceApiKey}`,
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         model: "flux-dev",
            //         height: 200,
            //         width: 600,
            //         safe_mode: true,
            //         prompt,
            //         style_preset: "Zentangle",
            //         "hide_watermark": true,
            //     }),
            // });

            // if (!response.ok) {
            //     return this.getFallbackImage();
            // }

            // const data = (await response.json()) as VeniceResponse;

            // if (!data.images?.[0]) {
            //     return this.getFallbackImage();
            // }

            // return await this.uploadToCloudinary(data.images[0]);

            // Always return a local fallback image for now
            return this.getFallbackImage();
        } catch (error) {
            console.error("Error generating image:", error);
            return this.getFallbackImage();
        }
    }

    public async formatReading(
        question: string,
        cards: Array<TarotCard & { isReversed: boolean; position?: string }>,
        spreadType: "love" | "career" | "yesno" | "past-present-future"
    ): Promise<TarotResponse> {
        try {
            const cardsHeader = cards
                .map(card => `${card.name}${card.isReversed ? ' ℝ' : ''}`)
                .join(' ┆ ');

            let interpretation = "";

            // Handle yes/no spread
            if (spreadType === "yesno") {
                const yesNoAnswer = cards[0].isReversed ? "No" : "Yes";
                const confidence = cards[0].isReversed ? "the cards suggest against it" : "the cards encourage this";

                // Get GPT to generate a concise interpretation
                const prompt = `For a yes/no question: "${question}", the card is ${cards[0].name}${cards[0].isReversed ? ' (reversed)' : ''}.
        The answer is ${yesNoAnswer}. Using the card's meaning (${cards[0].summary}), write TWO short sentences:
        1. Explain WHY this is the answer, based on the card's energy
        2. Give practical, direct advice based on this insight
        
        Use a punk-aesthetic Gen-Z style, keeping it brutally honest but supportive. Each sentence must be under 60 characters.
        Use hedging language for future possibilities. Make it sound like advice from a friend, not AI-generated.`;

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
                    max_tokens: 150
                });

                const summary = completion.choices[0].message.content || "";

                interpretation = `✧ ${yesNoAnswer} - ${confidence}\n✧ ${cards[0].name} appears with a clear message\n✧ ${cards[0].summary}\n\n${summary.trim()}`;
            } else {
                // Build the prompt for a full reading
                const prompt = `${cards
                    .map(card => `${card.position}: ${card.name}${card.isReversed ? ' ℝ' : ''} - ${card.summary}`)
                    .join('\n')}

You are a punk-aesthetic Gen-Z tarot reader. No fluff, no vague nonsense—just raw, direct insights.

**Your Response Format:**
- **Three-line interpretation:**
  1. Each line must be under **60 characters**.
  2. Each line must start with **"✧ "**.
  3. The first line interprets **${cards[0].position}**, the second **${cards[1].position}**, and the third **${cards[2]?.position || "Future"}**.
  4. **Do not add a full stop** at the end of any of these lines.

- **Final Summary:**
  - Weave in the querent's **exact question** (without "@pentacle-tarot").
  - **Never change, reinterpret, or invent** a different question.
  - **Make it sound like real advice, not AI-generated.**
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
                            content:
                                "You are a punk-aesthetic, no-BS tarot reader. Your readings are insightful, direct, and brutally honest—like a friend who tells you what you need to hear, not what you want to hear."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                });

                interpretation = completion.choices[0].message.content || "";
                if (!interpretation) {
                    throw new Error("Received null response from GPT-4");
                }
            }

            // Generate image and return
            const imageUrl = await this.generateTarotImage(cards);
            return {
                text: `${cardsHeader}\n\n${interpretation.trim()}`,
                imageUrl
            };
        } catch (error) {
            console.error("Error in formatReading:", error);
            // Even in case of error, return a valid TarotResponse
            return {
                text: "I apologize, but I encountered an error while generating your reading. Please try again.",
                imageUrl: undefined
            };
        }
    }
}
