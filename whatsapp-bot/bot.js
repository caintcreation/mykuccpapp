const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize WhatsApp Web client
const client = new Client();

client.on('qr', (qr) => {
    // Generates a QR code in your terminal. Scan it with your phone!
    qrcode.generate(qr, { small: true });
    console.log("Scan this QR code with your WhatsApp!");
});

client.on('ready', () => {
    console.log('Client is ready! WhatsApp is connected.');

    // Example: Send a message to a Kenyan number (Use format: 2547XXXXXXXX@c.us)
    const number = "254712345678@c.us";
    const message = "Automated test message from my PC!";

    // To fully automate: You would use Axios to fetch your Google Sheet JSON data here,
    // loop through the latest rows, and use client.sendMessage(number, message);
});

client.initialize();
