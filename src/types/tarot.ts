// types/tarot.ts
export interface TarotCard {
    id: number;
    numeral: string;
    name: string;
    arcana: 'major' | 'minor';
    summary: string;
    description: string;
    question: string;
    planet: string;
    element: string;
    zodiac: string;
}

export interface TarotResponse {
    text: string;
    imageUrl?: string;
}
