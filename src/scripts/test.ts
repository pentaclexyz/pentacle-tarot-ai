import { FarcasterIntegration } from './farcasterIntegration';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Randomized reading questions
const readingQuestions = [
    "What does my love life look like?",
    "Will I find true love soon?",
    "Should I take this new job offer?",
    "What's blocking my success?",
    "Will I ever get back with my ex?",
    "Is my crush into me?",
    "What's my next career move?",
    "Should I trust this person?",
    "What should I focus on this month?",
    "Will my creative project succeed?"
];

// Information questions
const infoQuestions = [
    // Basic commands
    "help",
    "info",
    "about",
    // Identity questions
    "Who are you?",
    "How do you work?",
    "Tell me about yourself",
    // Card info
    "What does the R symbol mean?",
    "Tell me about the Death card",
    // Reading types
    "What kind of readings do you do?",
    "How do I get a reading?",
    "How can I use this?",
    "What spreads are available?"
];

// Function to pick a random question from a specific array
function getRandomQuestion(questions: string[]) {
    return questions[Math.floor(Math.random() * questions.length)];
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user
function promptUser(): Promise<string> {
    return new Promise((resolve) => {
        console.log('\nChoose an option:');
        console.log('1. Random reading question');
        console.log('2. Random information question');
        console.log('3. Enter your own question');

        rl.question('Enter your choice (1-3): ', (answer) => {
            switch(answer.trim()) {
                case '1':
                    resolve('@pentacle-tarot ' + getRandomQuestion(readingQuestions));
                    break;
                case '2':
                    resolve('@pentacle-tarot ' + getRandomQuestion(infoQuestions));
                    break;
                case '3':
                    rl.question('Enter your question: ', (question) => {
                        resolve(question.startsWith('@pentacle-tarot') ?
                            question :
                            '@pentacle-tarot ' + question);
                    });
                    break;
                default:
                    console.log('Invalid choice, using random reading question');
                    resolve('@pentacle-tarot ' + getRandomQuestion(readingQuestions));
            }
        });
    });
}

async function runTest() {
    const farcaster = new FarcasterIntegration(
        process.env.NEYNAR_API_KEY!,
        process.env.FARCASTER_SIGNER_UUID!,
        true  // Enable test mode
    );

    try {
        const testQuestion = await promptUser();
        console.log('\nTesting with question:', testQuestion);
        await farcaster.testReading(testQuestion);
    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        rl.close();
    }
}

runTest().catch(console.error);
