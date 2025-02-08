import express from 'express';
import { PentacleChat } from './scripts/pentacleChat';

const app = express();
app.use(express.json()); // Parse JSON payloads

// Initialize your bot
const apiKey = process.env.NEYNAR_API_KEY!;
const signerUuid = process.env.FARCASTER_SIGNER_UUID!;
const pentacleChat = new PentacleChat(apiKey, signerUuid);

// Webhook route
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook event received:', JSON.stringify(req.body, null, 2));

        const event = req.body;

        // Forward event to the PentacleChat class
        if (event.type === 'cast.created') {
            await pentacleChat.handleWebhookEvent(event);
        }

        res.status(200).send('Event processed successfully');
    } catch (error) {
        console.error('Error processing webhook event:', error);
        res.status(500).send('Error processing event');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
