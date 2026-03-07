# CAINT Student Service - Chuka

## Overview
CAINT Student Service is a trusted digital assistance platform designed for Form 4 leavers applying for KUCCPS, HELB loans, KRA PIN, and TVET placements in Kenya. This web application provides a secure, easy-to-use interface for students and parents to submit their application details safely without risk of scams.

## Features
- **Responsive Design**: Mobile-first architecture ensures accessibility across all device sizes.
- **Dark/Light Mode**: Smooth transitions between themes with saved user preferences.
- **Interactive Multi-Step Form**: A clean and easy-to-navigate form for secure data submission.
- **Organic Animations**: Smooth, human-centric UI with floating badges, scroll-reveal effects, and 3D interactions.
- **WhatsApp Integration**: Fast processing and direct support via WhatsApp.
- **Google Sheets Automation**: Form submissions securely and automatically update backend spreadsheets.

## File Structure
- `index.html`: The main structured document containing the landing page, services, FAQs, and application form.
- `style.css`: The styling rules defining modern, human-centric design with gradients, micro-animations, and organic components.
- `script.js`: Handles interactions, dark mode toggle, multi-step validations, real-time feedback, and form submissions.
- `video.mp4`: A beautiful background asset bringing the initial hero section to life.

## Setup & Deployment
1. Simply place these files (`index.html`, `style.css`, `script.js`, `video.mp4`) in your chosen web server directory (e.g., Apache/NGINX or any standard static file host).
2. For local testing, any HTTP server will work (e.g., `npx serve`, Live Server in VSCode, or XAMPP).
3. The platform does not require PHP runtime anymore since data is submitted directly to Google Apps Script. 
4. Ensure the `video.mp4` file is properly optimized for web hosting to prevent slow loading times.

## Support & Maintenance
If modifications are needed to the Google Apps Script Web App URL, replace the `SHEET_URL` variable inside `script.js` located in the form submission handler.
