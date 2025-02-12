import { TarotCard } from '@/types/tarot';
import { TAROT_CARDS } from '../lib/tarot';
import crypto from 'crypto';
import OpenAI from 'openai';

import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with explicit configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

interface VeniceResponse {
    images: string[];
}

export class TarotReader {
    private deck = TAROT_CARDS;
    private openai: OpenAI;
    private veniceApiKey: string;

    constructor(openaiApiKey: string, veniceApiKey: string) {
        this.openai = new OpenAI({ apiKey: openaiApiKey });
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

    private async uploadToCloudinary(base64Image: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.CLOUDINARY_KEY;
            const apiSecret = process.env.CLOUDINARY_SECRET;

            console.log('Cloudinary config:', cloudinary.config());

            console.log('Cloudinary Upload Debug:', {
                cloudName: cloudName ? 'PRESENT' : 'MISSING',
                apiKey: apiKey ? 'PRESENT' : 'MISSING',
                apiSecret: apiSecret ? 'PRESENT' : 'MISSING'
            });

            if (!cloudName || !apiKey || !apiSecret) {
                return reject(new Error('Incomplete Cloudinary configuration'));
            }

            // Remove any data URL prefix if it exists
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

            cloudinary.uploader.upload(
                `data:image/png;base64,${base64Data}`,
                {
                    folder: 'tarot-readings',
                    transformation: {
                        width: 600,
                        crop: "scale",
                        format: "png",    // Force PNG conversion
                        quality: "auto"
                    },
                    overwrite: true,
                    unique_filename: true
                },
                (error, result) => {
                    if (error) {
                        console.error('Detailed Cloudinary upload error:', error);
                        reject(new Error(`Failed to upload image to Cloudinary: ${error.message}`));
                    } else {
                        console.log('Cloudinary upload successful:', {
                            url: result?.secure_url,
                            publicId: result?.public_id
                        });
                        resolve(result?.secure_url || '');
                    }
                }
            );
        });
    }

    private async generateTarotImage(
        cards: Array<TarotCard & { isReversed: boolean; position?: string }>
    ): Promise<string> {
        const cardNames = cards
            .map(card => `${card.name}${card.isReversed ? ' (Reversed)' : ''}`)
            .join(', ');

        const prompt = `japanese anime girl, mystic, american 1960s style ink cartoon, age 35, tarot reader with ${cardNames} cards laid out, dramatic lighting, mystical atmosphere, https://s.mj.run/0LLFDv6GwFw`;

        try {
            const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.veniceApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "flux-dev",
                    height: 200,
                    width: 600,
                    safe_mode: true,
                    prompt,
                    style_preset: "Zentangle"
                }),
            });

            if (!response.ok) {
                throw new Error(`Venice API error: ${response.statusText}`);
            }

            const data = (await response.json()) as VeniceResponse;

            if (data && data.images && data.images[0]) {
                // Upload the returned base64 image to Cloudinary and get a PNG URL
                const imageUrl = await this.uploadToCloudinary(data.images[0]);
                return imageUrl;
            }

            throw new Error('Unexpected response format from Venice API');
        } catch (error) {
            console.error("Error generating image:", error);
            throw new Error("Failed to generate tarot image");
        }
    }

    public async formatReading(
        question: string,
        cards: Array<TarotCard & { isReversed: boolean; position?: string }>,
        spreadType: "love" | "career" | "yesno" | "past-present-future"
    ): Promise<string> {
        const cardsHeader = cards
            .map(card => `${card.name}${card.isReversed ? ' ℝ' : ''}`)
            .join(' ┆ ');

        let prompt = "";
        let interpretation = "";

        // Generate the text response based on the spread type
        if (spreadType === "yesno") {
            const yesNoAnswer = cards[0].isReversed ? "No" : "Yes";
            prompt = `You are a punk tarot reader. Give a **bold, direct** one-line response to a yes/no question based on this card. The answer is "${yesNoAnswer}".  

Do NOT explain the card, just give the answer and a one-liner explaining it.`;
            interpretation = `${yesNoAnswer}: ${cards[0].summary}`;
        } else {
            prompt = `${cards
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
  - **Final sentence must be fully complete.**
    - **Final sentence must always fully complete—no cut-offs**  
  - **Write the summary in a natural way—avoid repetitive phrasing.**
  - **It must still clearly address the querent's question.**

**User's Question:** "${question}"`;

            try {
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
            } catch (error) {
                console.error("Error generating reading:", error);
                throw new Error("Failed to generate tarot reading");
            }
        }

        try {
            // Generate the image (Cloudinary now returns the PNG URL)
            const imageUrl = await this.generateTarotImage(cards);

            // Return a Markdown-formatted response with the image
            const unifiedReply = `${cardsHeader}\n\n${interpretation.trim()}\n\n![Tarot Vision](${imageUrl})`;
            return unifiedReply;
        } catch (error) {
            console.error("Error generating image:", error);
            // If image generation fails, return just the text response
            return `${cardsHeader}\n\n${interpretation.trim()}`;
        }
    }
}
