// src/lib/contentFilter.ts

export class ContentFilter {
    private readonly BANNED_PATTERNS = [
        // Violence
        /\b(kill|murder|hurt|attack|stab|shoot)\b/i,

        // Harmful intentions
        /\b(hurt|harm|damage|destroy)\b/i,

        // Illegal activities
        /\b(steal|rob|theft|drug|cocaine|heroin)\b/i,

        // Match violent words as whole words, case insensitive
        /\b(kill(s|ing)?)\b/i,
        /\b(murder(s|ed|ing)?)\b/i,
        /\b(bomb(s|ing)?)\b/i,
        /\b(shoot(s|ing)?)\b/i,
        /\b(stab(s|bed|bing)?)\b/i,
        /\b(assault(s|ed|ing)?)\b/i,
        /\b(rape(s|d|ing)?)\b/i,
        /\b(violence|violent)\b/i,
        /\b(bash(s|ing)?)\b/i,
        /\b(death|die|dead|suicide)\b/i,
        /\b(crime|criminal)\b/i,
        // Add more patterns based on what you see in logs
    ];

    private readonly FLAGGED_PATTERNS = [
        /\b(death|die|dead|suicide)\b/i,
        /\b(crime|criminal)\b/i,
        // Add more patterns for monitoring
    ];

    private readonly REPLACEMENT_MESSAGE = "I'm here to help you think through things constructively. Let's keep it respectful so I can give you a meaningful reading.";

    public validateContent(question: string): { isValid: boolean; message?: string } {
        const cleanedQuestion = question.toLowerCase().trim();

        // Log for monitoring
        console.log(`Processing question: ${cleanedQuestion}`);

        // Check banned patterns
        for (const pattern of this.BANNED_PATTERNS) {
            if (pattern.test(cleanedQuestion)) {
                console.warn(`Blocked question with banned pattern: ${cleanedQuestion}`);
                return {
                    isValid: false,
                    message: this.REPLACEMENT_MESSAGE
                };
            }
        }

        // Check and log flagged patterns
        for (const pattern of this.FLAGGED_PATTERNS) {
            if (pattern.test(cleanedQuestion)) {
                console.warn(`Flagged question for review: ${cleanedQuestion}`);
                // We allow these but log them for monitoring
            }
        }

        return { isValid: true };
    }
}
