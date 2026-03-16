/* ============================================================
   CAINT Student Service – WhatsApp Notification Bot
   ============================================================
   • Reads new applications from Google Sheets (CSV export)
   • Sends a personalised WhatsApp confirmation to each applicant
   • Remembers who was already messaged (processed_numbers.json)
   • Tiny HTTP server keeps the process alive on free cloud hosts
   ============================================================ */

'use strict';
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const http = require('http');

// ─── Configuration ────────────────────────────────────────────────
// PASTE YOUR GOOGLE SHEET CSV LINK HERE (File → Share → Publish to web → CSV)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSCbu74oY95FGtSqSsERB8xfRDShE6zJ1nIEKu3fqXjTPwYt70rayH2_0OyM8-dI6F9Xn-CCxk4C7rX/pub?output=csv";

// How often to poll the Sheet for new submissions (default: every 30 seconds)
const CHECK_INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS || 30000);

// Port for the keep-alive HTTP server (Render.com sets this automatically)
const PORT = process.env.PORT || 3001;

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
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`CAINT Bot is running. Processed: ${processedNumbers.length} numbers.`);
}).listen(PORT, () => {
    console.log(`[${ts()}] Keep-alive server listening on port ${PORT}`);
});

function ts() {
    return new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
}

// ─── WhatsApp Client ──────────────────────────────────────────────
// LocalAuth saves your QR session to disk – you only scan once.
// puppeteer args are REQUIRED for any Linux/cloud environment.
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log(`[${ts()}] 📱 Scan the QR code above with your WhatsApp (Linked Devices → Link a Device)`);
});

client.on('ready', async () => {
    console.log(`[${ts()}] ✅ WhatsApp connected and ready!`);
    // Check sheet immediately for any uncontacted submissions, then poll
    await checkSheet();
    setInterval(checkSheet, CHECK_INTERVAL_MS);
    console.log(`[${ts()}] 🔄 Auto-checking every ${CHECK_INTERVAL_MS / 1000}s for new applications.`);
});

client.on('authenticated', () => {
    console.log(`[${ts()}] 🔐 Session authenticated.`);
});

client.on('auth_failure', (msg) => {
    console.error(`[${ts()}] ❌ Authentication failed: ${msg}`);
});

client.on('disconnected', (reason) => {
    console.warn(`[${ts()}] ⚠️  Disconnected (${reason}). Reinitialising in 10 seconds…`);
    setTimeout(() => {
        client.initialize();
    }, 10000);
});

// ─── Sheet checker ────────────────────────────────────────────────
async function checkSheet() {
    if (!SHEET_CSV_URL || SHEET_CSV_URL === 'YOUR_CSV_LINK_HERE') {
        console.warn(`[${ts()}] ⚠️  Set SHEET_CSV_URL at the top of bot_full.js`);
        return;
    }

    try {
        const response = await axios.get(SHEET_CSV_URL, { timeout: 15000 });
        const lines = response.data.trim().split(/\r?\n/);
        if (lines.length < 2) return; // empty or header only

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

        // Locate the primary phone and name columns (skip parent / guarantor variants)
        const phoneIndices = headers.reduce((acc, h, i) => {
            if (h === 'phone' || (h.includes('phone') && !h.includes('parent') && !h.includes('guarantor'))) acc.push(i);
            return acc;
        }, []);
        const nameIdx = headers.findIndex(h => h.includes('fullname') || (h.includes('name') && !h.includes('parent') && !h.includes('guarantor')));
        const serviceIdx = headers.findIndex(h => h === 'service');

        if (phoneIndices.length === 0) {
            console.warn(`[${ts()}] ⚠️  No phone column found in Sheet.`);
            return;
        }

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
    } catch (err) {
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
client.initialize();
