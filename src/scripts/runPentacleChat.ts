#!/usr/bin/env node
import dotenv from 'dotenv';
import { PentacleChat } from './pentacleChat';

dotenv.config();

async function main() {
    console.log('🚀 Starting Pentacle Chat Bot...');

    const apiKey = process.env.NEYNAR_API_KEY;
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;

    if (!apiKey || !signerUuid) {
        console.error('❌ Missing required environment variables');
        process.exit(1);
    }

    console.log('✅ Environment variables loaded');

    const bot = new PentacleChat(apiKey, signerUuid);
    await bot.startPolling();

    try {
        console.log('🔄 Initializing bot...');

        // Start your polling or any main routine
        bot.startPolling();

        console.log('💫 Pentacle chat bot is running...');

        setInterval(() => {
            console.log('💗 Heartbeat - ' + new Date().toISOString());
        }, 10000);

        process.on('SIGINT', async () => {
            console.log('\n👋 Shutting down Pentacle chat bot...');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start Pentacle chat bot:', error);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
