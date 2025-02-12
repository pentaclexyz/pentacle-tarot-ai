import { TarotReader } from '../app/tarotReader';

export class TarotService {
    private tarotReader: TarotReader;
    protected isTestMode: boolean;

    constructor(isTestMode = false) {
        this.isTestMode = isTestMode;

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        if (!process.env.VENICEAI_API_KEY) {
            throw new Error('VENICEAI_API_KEY environment variable is required');
        }

        this.tarotReader = new TarotReader(
            process.env.OPENAI_API_KEY,
            process.env.VENICEAI_API_KEY
        );
    }

    protected async generateReading(question: string): Promise<string> {
        try {
            const spreadType = this.tarotReader.determineSpreadType(question);
            const cards = this.tarotReader.selectCards(spreadType);
            const response = await this.tarotReader.formatReading(question, cards, spreadType);

            console.log({
                spreadType,
                numberOfCards: cards.length,
                responseLength: response.length,
                responsePreview: response.substring(0, 200)
            });

            return response;
        } catch (error) {
            console.error('Error in tarot service:', error);
            throw error;
        }
    }
}
