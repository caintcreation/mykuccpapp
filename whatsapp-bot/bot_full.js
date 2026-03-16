/* ============================================================
   CAINT Student Service – WhatsApp Notification Bot
   ============================================================
   • Reads new applications from Google Sheets (CSV export)
   • Sends a personalised WhatsApp confirmation to each applicant
   • Remembers who was already messaged (processed_numbers.json)
   • Tiny HTTP server keeps the process alive on free cloud hosts
   ============================================================ */

'use strict';
const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const http = require('http');
const packageInfo = require('./package.json');

const botStatus = {
    version: packageInfo.version,
    phase: 'starting',
    authenticated: false,
    ready: false,
    qr: '',
    state: 'initialising',
    lastError: '',
    lastSheetCheck: '',
    lastSheetResult: 'Not checked yet',
    browserPreflight: 'Not started'
};

// ─── Configuration ────────────────────────────────────────────────
// PASTE YOUR GOOGLE SHEET CSV LINK HERE (File → Share → Publish to web → CSV)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSCbu74oY95FGtSqSsERB8xfRDShE6zJ1nIEKu3fqXjTPwYt70rayH2_0OyM8-dI6F9Xn-CCxk4C7rX/pub?output=csv";

// How often to poll the Sheet for new submissions (default: every 30 seconds)
const CHECK_INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS || 30000);

// Port for the keep-alive HTTP server (Render.com sets this automatically)
const PORT = process.env.PORT || 3001;
const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL);

// ─── Persistence ──────────────────────────────────────────────────
const PROCESSED_FILE = 'processed_numbers.json';

// Load numbers we have already messaged so we never double-send
let processedNumbers = [];
if (fs.existsSync(PROCESSED_FILE)) {
    try {
        processedNumbers = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
    } catch (e) {
        processedNumbers = [];
    }
}

function saveProcessed() {
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedNumbers, null, 2));
}

// ─── Keep-alive HTTP server ────────────────────────────────────────
// Render.com free tier requires an open port. UptimeRobot pings this
// URL every 5 minutes to prevent the service from sleeping.
http.createServer((req, res) => {
    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ...botStatus,
            processedCount: processedNumbers.length
        }, null, 2));
        return;
    }

    if (req.url === '/qr') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

        if (!botStatus.qr) {
            res.end(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>CAINT Bot QR</title></head>
<body style="font-family: Arial, sans-serif; padding: 24px;">
  <h1>CAINT Bot QR</h1>
  <p>No QR is waiting right now.</p>
  <p>Current phase: <strong>${botStatus.phase}</strong></p>
  <p>Current state: <strong>${botStatus.state}</strong></p>
  <p>Ready: <strong>${botStatus.ready}</strong></p>
  <p>Authenticated: <strong>${botStatus.authenticated}</strong></p>
  <p>Last error: <strong>${botStatus.lastError || 'None'}</strong></p>
</body>
</html>`);
            return;
        }

        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(botStatus.qr)}`;
        res.end(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>CAINT Bot QR</title></head>
<body style="font-family: Arial, sans-serif; padding: 24px; text-align: center;">
  <h1>Scan This WhatsApp QR</h1>
  <p>Open WhatsApp -> Linked Devices -> Link a Device</p>
  <img src="${qrImageUrl}" alt="WhatsApp QR code" style="max-width: 320px; width: 100%; height: auto; border: 1px solid #ddd;" />
  <p style="margin-top: 16px; color: #666;">Refresh this page if the QR expires.</p>
</body>
</html>`);
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(
        `CAINT Bot is running\n` +
        `Phase: ${botStatus.phase}\n` +
        `State: ${botStatus.state}\n` +
        `Authenticated: ${botStatus.authenticated}\n` +
        `Ready: ${botStatus.ready}\n` +
        `Processed: ${processedNumbers.length}\n` +
        `Last sheet check: ${botStatus.lastSheetCheck || 'Never'}\n` +
        `Last sheet result: ${botStatus.lastSheetResult}\n` +
        `QR page: /qr\n` +
        `Status JSON: /status\n`
    );
}).listen(PORT, () => {
    console.log(`[${ts()}] Keep-alive server listening on port ${PORT}`);
});

function ts() {
    return new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
}

// ─── WhatsApp Client ──────────────────────────────────────────────
// LocalAuth saves your QR session to disk – you only scan once.
// puppeteer args are REQUIRED for any Linux/cloud environment.
const chromeExecutablePath = puppeteer.executablePath();
console.log(`[${ts()}] Using Chrome executable: ${chromeExecutablePath}`);
botStatus.phase = 'launching-browser';

const authStrategy = isRender
    ? new NoAuth()
    : new LocalAuth({ dataPath: '.wwebjs_auth' });

console.log(`[${ts()}] Using auth strategy: ${isRender ? 'NoAuth (Render)' : 'LocalAuth (local)'} `);

async function runBrowserPreflight() {
    let browser;
    try {
        botStatus.browserPreflight = 'Launching browser';
        browser = await puppeteer.launch({
            headless: true,
            executablePath: chromeExecutablePath,
            timeout: 120000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
                '--window-size=1366,768'
            ]
        });

        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
        botStatus.browserPreflight = 'Passed';
        console.log(`[${ts()}] Browser preflight passed.`);
    } catch (err) {
        botStatus.browserPreflight = `Failed: ${err.message}`;
        botStatus.lastError = err.message;
        console.error(`[${ts()}] ❌ Browser preflight failed: ${err.message}`);
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
}

const client = new Client({
    authStrategy,
    puppeteer: {
        headless: true,
        executablePath: chromeExecutablePath,
        timeout: 120000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-networking',
            '--window-size=1366,768'
        ]
    }
});

client.on('qr', (qr) => {
    botStatus.phase = 'waiting-for-qr-scan';
    botStatus.qr = qr;
    botStatus.ready = false;
    qrcode.generate(qr, { small: true });
    console.log(`[${ts()}] 📱 Scan the QR code above with your WhatsApp (Linked Devices → Link a Device)`);
    console.log(`[${ts()}] Open /qr on your Render app to scan if the terminal QR is not visible.`);
});

client.on('ready', async () => {
    botStatus.phase = 'ready';
    botStatus.ready = true;
    botStatus.authenticated = true;
    botStatus.qr = '';
    console.log(`[${ts()}] ✅ WhatsApp connected and ready!`);
    // Check sheet immediately for any uncontacted submissions, then poll
    await checkSheet();
    setInterval(checkSheet, CHECK_INTERVAL_MS);
    console.log(`[${ts()}] 🔄 Auto-checking every ${CHECK_INTERVAL_MS / 1000}s for new applications.`);
});

client.on('authenticated', () => {
    botStatus.phase = 'authenticated';
    botStatus.authenticated = true;
    botStatus.lastError = '';
    console.log(`[${ts()}] 🔐 Session authenticated.`);
});

client.on('auth_failure', (msg) => {
    botStatus.phase = 'auth-failure';
    botStatus.authenticated = false;
    botStatus.ready = false;
    botStatus.lastError = msg;
    console.error(`[${ts()}] ❌ Authentication failed: ${msg}`);
});

client.on('disconnected', (reason) => {
    botStatus.phase = 'disconnected';
    botStatus.ready = false;
    botStatus.authenticated = false;
    botStatus.lastError = reason;
    console.warn(`[${ts()}] ⚠️  Disconnected (${reason}). Reinitialising in 10 seconds…`);
    setTimeout(() => {
        botStatus.phase = 'reinitialising';
        client.initialize();
    }, 10000);
});

client.on('loading_screen', (percent, message) => {
    botStatus.phase = 'loading';
    botStatus.state = `${percent}% ${message}`;
    console.log(`[${ts()}] Loading WhatsApp: ${percent}% - ${message}`);
});

client.on('change_state', (state) => {
    botStatus.state = state;
    console.log(`[${ts()}] WhatsApp state: ${state}`);
});

// ─── Sheet checker ────────────────────────────────────────────────
async function checkSheet() {
    botStatus.lastSheetCheck = ts();

    if (!SHEET_CSV_URL || SHEET_CSV_URL === 'YOUR_CSV_LINK_HERE') {
        botStatus.lastSheetResult = 'Missing sheet URL';
        console.warn(`[${ts()}] ⚠️  Set SHEET_CSV_URL at the top of bot_full.js`);
        return;
    }

    try {
        const response = await axios.get(SHEET_CSV_URL, { timeout: 15000 });
        const lines = response.data.trim().split(/\r?\n/);
        if (lines.length < 2) {
            botStatus.lastSheetResult = 'Sheet empty or header only';
            return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

        // Locate the primary phone and name columns (skip parent / guarantor variants)
        const phoneIndices = headers.reduce((acc, h, i) => {
            if (h === 'phone' || (h.includes('phone') && !h.includes('parent') && !h.includes('guarantor'))) acc.push(i);
            return acc;
        }, []);
        const nameIdx = headers.findIndex(h => h.includes('fullname') || (h.includes('name') && !h.includes('parent') && !h.includes('guarantor')));
        const serviceIdx = headers.findIndex(h => h === 'service');

        if (phoneIndices.length === 0) {
            botStatus.lastSheetResult = 'No phone column found';
            console.warn(`[${ts()}] ⚠️  No phone column found in Sheet.`);
            return;
        }

        let foundNewNumber = false;

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (!cols.length) continue;

            // Pick the best phone value (prefer rightmost non-empty)
            let phone = '';
            for (let pi = phoneIndices.length - 1; pi >= 0; pi--) {
                const val = (cols[phoneIndices[pi]] || '').trim();
                if (val && val !== '#ERROR!') { phone = val; break; }
            }
            if (!phone) continue;

            phone = normalisePhone(phone);
            if (!phone || processedNumbers.includes(phone)) continue;

            foundNewNumber = true;

            const name = nameIdx !== -1 ? (cols[nameIdx] || 'Student').trim() : 'Student';
            const service = serviceIdx !== -1 ? (cols[serviceIdx] || '').trim() : '';
            const serviceLabel = formatService(service);

            console.log(`[${ts()}] 📤 New application – sending to ${name} (${phone})…`);

            const message =
                `Hello ${name} 👋\n\n` +
                `Thank you for submitting your *${serviceLabel}* application to *CAINT Student Service*.\n\n` +
                `✅ We have received your details and will process your request within *30 minutes*.\n\n` +
                `If you have any questions, simply reply to this message or call us anytime.\n\n` +
                `— CAINT Student Service, Chuka 🎓`;

            try {
                await client.sendMessage(phone + '@c.us', message);
                console.log(`[${ts()}] ✅ Message sent to ${phone}`);
            } catch (err) {
                console.error(`[${ts()}] ❌ Failed to send to ${phone}: ${err.message}`);
            }

            // Always mark as processed even if send fails (avoids spam on error)
            processedNumbers.push(phone);
            saveProcessed();

            // Polite delay (5-10 s) to avoid WhatsApp rate-limiting
            await sleep(Math.floor(Math.random() * 5000) + 5000);
        }

        if (!foundNewNumber) {
            botStatus.lastSheetResult = `No new numbers. Total rows: ${lines.length - 1}`;
        } else {
            botStatus.lastSheetResult = 'Processed one or more new numbers';
        }
    } catch (err) {
        botStatus.lastSheetResult = 'Sheet fetch error';
        botStatus.lastError = err.message;
        console.error(`[${ts()}] ❌ Sheet fetch error: ${err.message}`);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────
function parseCSVLine(line) {
    const cols = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
        else { cur += ch; }
    }
    cols.push(cur.trim());
    return cols;
}

function normalisePhone(raw) {
    let p = raw.replace(/\D/g, '');
    if (p.startsWith('0') && p.length === 10) p = '254' + p.slice(1);
    else if (p.length === 9) p = '254' + p;
    else if (p.startsWith('+')) p = p.slice(1);
    return p.length >= 11 ? p : '';
}

function formatService(svc) {
    const map = {
        kuccps: 'KUCCPS Application',
        helb: 'HELB Application',
        ecitizen: 'E-Citizen Service',
        kmtc: 'KMTC Application',
        kra: 'KRA PIN Registration',
        webdev: 'Website Development'
    };
    return map[svc.toLowerCase()] || svc || 'Service';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Start ────────────────────────────────────────────────────────
console.log(`[${ts()}] 🚀 Starting CAINT WhatsApp Bot…`);
(async () => {
    await runBrowserPreflight();

    client.initialize().catch((err) => {
        botStatus.phase = 'init-failed';
        botStatus.lastError = err.message;
        console.error(`[${ts()}] ❌ Client initialization failed: ${err.message}`);
    });
})();
