import { TarotReader } from '../app/tarotReader';
import { TarotInformationHandler } from '../app/tarotInformationHandler';

export class TarotService {
    private tarotReader: TarotReader;
    private infoHandler: TarotInformationHandler;
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
        this.infoHandler = new TarotInformationHandler(process.env.OPENAI_API_KEY);
    }

    private isInformationQuery(question: string): boolean {
        // Clean the question first
        const cleanQuestion = question.toLowerCase()
            .replace(/@\w+-\w+\s+/, '')
            .trim();

        // Check for exact commands first
        const exactCommands = [
            'help',
            'info',
            'about'
        ];
        if (exactCommands.includes(cleanQuestion)) {
            console.log('Matched exact command:', cleanQuestion);
            return true;
        }

        // Check information patterns
        const infoPatterns = [
            /^(help|info|about)$/i,
            /who (are|r) (you|u)/i,
            /how (do you|does this) work/i,
            /what (does|is) (the )?[rℝ∀] (mean|symbol)/i,
            /tell me about (the )?([a-zA-Z\s]+) card/i,
            /what (types? of |kind of )?(spreads?|readings?)/i,
            /what (readings?|spreads?) (can|do) you (do|offer|give)/i,
            /how (can|do) i (get|ask for) (a )?reading/i,
            /how (can|do) i use (you|this)/i,
            /explain|describe|define|meaning of/i,
            /tell me about (yourself|urself)/i,
            /what (are|r) (you|u)/i
        ];

        const isInfoQuery = infoPatterns.some(pattern => pattern.test(cleanQuestion));
        if (isInfoQuery) {
            console.log('Matched information pattern:', cleanQuestion);
        }
        return isInfoQuery;
    }

    async generateReading(question: string): Promise<{ text: string, imageUrl?: string }> {
        try {
            // Log the incoming question
            console.log('Processing question:', question);

            // Check if this is an information query first
            if (this.isInformationQuery(question)) {
                console.log('Handling as information query');
                return await this.infoHandler.handleInformationQuery(question);
            }

            // Handle actual reading request
            console.log('Generating tarot reading');
            const spreadType = this.tarotReader.determineSpreadType(question);
            const cards = this.tarotReader.selectCards(spreadType);
            const response = await this.tarotReader.formatReading(question, cards, spreadType);

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
