import { TarotCard } from '@/types/tarot';
import { TAROT_CARDS } from '../lib/tarot';

class TarotReader {
    private deck = TAROT_CARDS;

    selectCards(number: number): Array<TarotCard & { isReversed: boolean }> {
        const selected: Array<TarotCard & { isReversed: boolean }> = [];
        const available = [...this.deck];

        while (selected.length < number && available.length > 0) {
            const index = Math.floor(Math.random() * available.length);
            const card = available.splice(index, 1)[0];
            selected.push({
                ...card,
                isReversed: Math.random() > 0.5
            });
        }

        return selected;
    }

    formatReading(question: string, cards: Array<TarotCard & { isReversed: boolean }>): string {
        const [past, present, future] = cards;

        // Create the baseline reading
        let reading = `✨ "${question}"\n\n`;

        // Add the cards and their positions
        reading += cards.map((card, index) => {
            const position = ['Past', 'Present', 'Future'][index];
            return `${position}: ${card.name}${card.isReversed ? ' (R)' : ''}\n${card.summary}`;
        }).join('\n\n');

        // Add synthesis
        reading += '\n\n' + this.generateSynthesis(cards, question);

        return reading;
    }

    private generateSynthesis(cards: Array<TarotCard & { isReversed: boolean }>, question: string): string {
        const [past, present, future] = cards;

        // Split summaries into key themes
        const pastThemes = past.summary.split(', ');
        const presentThemes = present.summary.split(', ');
        const futureThemes = future.summary.split(', ');

        // Choose meaningful themes based on reversal
        const pastTheme = past.isReversed ?
            `challenges with ${pastThemes[0]}` : pastThemes[0];
        const presentTheme = present.isReversed ?
            `working through ${presentThemes[0]}` : presentThemes[0];
        const futureTheme = future.isReversed ?
            `potential ${futureThemes[0]}` : futureThemes[0];

        return `This progression shows ${pastTheme} leading to ${futureTheme}, with ${presentTheme} as your current focus.\n\nWant a deeper reading? Visit pentacletarot.xyz`;
    }
}

export { TarotReader };
