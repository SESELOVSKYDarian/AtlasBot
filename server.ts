console.log('>>> [DEBUG] server.ts is being executed...');
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('>>> [DEBUG] Env loaded. OpenAI Key present:', !!process.env.OPENAI_API_KEY);

import { create, Client } from '@open-wa/wa-automate';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Special function to capture QR - Override internal logging or use specific callback if available
// For this MVP, we might need a modified start approach or rely on the `qr` event if exposed.
// Standard `create` blocks until connected.
// Let's try standard `create` first. 
// If we can't get the QR easily, we might need to use `puppeteer` options to screenshot? 
// No, `@open-wa/wa-automate` usually provides a way.
// Ah, `start` method with `onQr` callback?
// Let's refine this later. For now, basic setup.

app.prepare().then(async () => {
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    }).listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log('🚀 Attempting to initialize Bot Loader...');

        import('./lib/bot-loader')
            .then(loader => {
                console.log('📦 Bot Loader module loaded successfully');
                loader.initBot();
            })
            .catch(err => {
                console.error('❌ CRITICAL: Failed to load Bot Loader module:', err);
            });
    });
});
