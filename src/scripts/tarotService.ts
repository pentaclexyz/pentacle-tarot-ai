import { TarotReader } from '../app/tarotReader';

export class TarotService {
    protected tarotReader: TarotReader;
    protected isTestMode: boolean;
    protected lastProcessedTime: number = 0;
    protected processingDelay: number = 2000; // 2 seconds

    constructor(isTestMode = false) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OPENAI_API_KEY environment variable');
        }
        this.tarotReader = new TarotReader(process.env.OPENAI_API_KEY);
        this.isTestMode = isTestMode;
    }

    protected async generateReading(question: string): Promise<string> {
        // Rate limiting
        const now = Date.now();
        if (now - this.lastProcessedTime < this.processingDelay) {
            console.log('RATE LIMIT TRIGGERED');
            return '';
        }
        this.lastProcessedTime = now;

        console.log('🔮 Processing reading request:', question);

        const cards = this.tarotReader.selectCards(3);
        const response = await this.tarotReader.formatReading(question, cards);

        console.log('GENERATED RESPONSE', {
            responseLength: response.length,
            responsePreview: response.substring(0, 200)
        });

        return response;
    }
}
