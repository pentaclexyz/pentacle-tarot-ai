import { TarotReader } from '../app/tarotReader';

export class TarotService {
    private tarotReader: TarotReader;
    protected isTestMode: boolean;

    constructor(isTestMode = false) {
        this.isTestMode = isTestMode;

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        if (!process.env.VENICE_API_KEY) {
            throw new Error('VENICE_API_KEY environment variable is required');
        }

        this.tarotReader = new TarotReader(
            process.env.OPENAI_API_KEY,
            process.env.VENICE_API_KEY
        );
    }

    protected async generateReading(question: string): Promise<{ text: string, imageUrl?: string }> {
        try {
            const spreadType = this.tarotReader.determineSpreadType(question);
            const cards = this.tarotReader.selectCards(spreadType);
            const response = await this.tarotReader.formatReading(question, cards, spreadType);

            // If response is an object, extract its text property; if it's a string, use it directly.
            const readingText = typeof response === 'string' ? response : response.text;

            console.log({
                spreadType,
                numberOfCards: cards.length,
                responseLength: readingText.length,
                responsePreview: readingText.substring(0, 200),
                imageUrl: response.imageUrl
            });

            return {
                text: readingText,
                imageUrl: response.imageUrl
            };
        } catch (error) {
            console.error('Error in tarot service:', error);
            throw error;
        }
    }
}
