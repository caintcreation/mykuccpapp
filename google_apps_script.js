/**
 * CAINT Student Service — Google Apps Script Backend
 * =====================================================
 * PASTE THIS ENTIRE FILE into Google Apps Script.
 *
 * SETUP STEPS:
 * 1. Go to https://script.google.com  →  New Project
 * 2. Delete all existing code
 * 3. Paste this entire file
 * 4. Update SPREADSHEET_ID and DRIVE_FOLDER_ID below
 * 5. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone (even anonymous)
 * 6. Copy the Web App URL → paste into script.js SHEET_URL
 *
 * IMPORTANT: Every time you change this code, click:
 *   Deploy → Manage deployments → Edit → Update existing
 * =====================================================
 */

// ── CONFIGURE THESE TWO VALUES ────────────────────────────────────
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';   // From your Google Sheet URL
var DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';  // From your Google Drive folder URL
// ─────────────────────────────────────────────────────────────────

/**
 * Called when the form is submitted (POST request from the website).
 * Receives: JSON string in e.postData.contents
 * Does:
 *  1. Parses the JSON
 *  2. Uploads each file (base64) to Google Drive
 *  3. Stores the Drive link in the data
 *  4. Appends a row to the spreadsheet
 */
function doPost(e) {
    try {
        // ── Parse the incoming JSON ────────────────────────────────────
        // The frontend sends Content-Type: text/plain containing JSON.
        // e.postData.contents holds the raw JSON string.
        var raw = e.postData ? e.postData.contents : '';

        if (!raw || raw.trim() === '') {
            return jsonResponse({ status: 'error', message: 'Empty request body received.' });
        }

        var data = JSON.parse(raw);

        // ── Get Sheet and Drive Folder ─────────────────────────────────
        var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
        var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

        // ── Upload each base64 file to Google Drive ────────────────────
        var fileLinks = {};
        var keys = Object.keys(data);

        keys.forEach(function (key) {
            if (key.endsWith('_base64') && data[key]) {
                var fieldName = key.replace('_base64', '');
                var filename = data[fieldName + '_filename'] || (fieldName + '.bin');
                var mimeType = data[fieldName + '_mimetype'] || 'application/octet-stream';

                try {
                    var decoded = Utilities.base64Decode(data[key]);
                    var blob = Utilities.newBlob(decoded, mimeType, filename);
                    var driveFile = folder.createFile(blob);

                    // Make the file viewable by anyone with the link
                    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

                    // Store the Google Drive link
                    fileLinks[fieldName + '_DriveLink'] = driveFile.getUrl();

                    Logger.log('Uploaded file: ' + filename + ' → ' + driveFile.getUrl());
                } catch (fileErr) {
                    Logger.log('File upload failed for ' + fieldName + ': ' + fileErr.toString());
                    fileLinks[fieldName + '_DriveLink'] = 'Upload failed: ' + fileErr.message;
                }
            }
        });

        // ── Build the clean data row (exclude raw base64/filename/mimetype) ──
        var rowData = {};
        keys.forEach(function (key) {
            // Skip the binary fields — we only want text fields + Drive links
            if (!key.endsWith('_base64') && !key.endsWith('_filename') && !key.endsWith('_mimetype')) {
                rowData[key] = data[key];
            }
        });

        // Add the Drive links to the row
        Object.keys(fileLinks).forEach(function (k) {
            rowData[k] = fileLinks[k];
        });

        // ── Manage Sheet headers ───────────────────────────────────────
        var lastCol = sheet.getLastColumn();
        var headers = lastCol > 0
            ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].filter(String)
            : [];

        var rowKeys = Object.keys(rowData);

        // First submission: write the headers
        if (headers.length === 0) {
            sheet.getRange(1, 1, 1, rowKeys.length).setValues([rowKeys]);
            sheet.getRange(1, 1, 1, rowKeys.length).setFontWeight('bold').setBackground('#0f2a5c').setFontColor('#ffffff');
            sheet.setFrozenRows(1);
            headers = rowKeys;
        } else {
            // Add any new columns that don't exist yet
            rowKeys.forEach(function (key) {
                if (headers.indexOf(key) === -1) {
                    headers.push(key);
                    var newCol = headers.length;
                    sheet.getRange(1, newCol).setValue(key).setFontWeight('bold').setBackground('#0f2a5c').setFontColor('#ffffff');
                }
            });
        }

        // ── Append the data row ────────────────────────────────────────
        var row = headers.map(function (header) {
            return rowData.hasOwnProperty(header) ? (rowData[header] || '') : '';
        });

        sheet.appendRow(row);

        // Auto-resize columns for readability
        try { sheet.autoResizeColumns(1, headers.length); } catch (e) { }

        Logger.log('Row appended successfully. Total columns: ' + headers.length);

        return jsonResponse({ status: 'ok', columns: headers.length });

    } catch (err) {
        Logger.log('doPost ERROR: ' + err.toString());
        return jsonResponse({ status: 'error', message: err.toString() });
    }
}

/**
 * Called when the URL is opened in a browser (GET request).
 * Useful for testing that the script is deployed correctly.
 */
function doGet(e) {
    return ContentService
        .createTextOutput('✅ CAINT Student Service Apps Script is running correctly.')
        .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Helper: return a JSON response
 */
function jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
