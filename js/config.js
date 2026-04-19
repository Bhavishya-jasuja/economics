/**
 * Web App URL for google-apps-script/code.gs (deployed on script.google.com).
 * That script receives POSTs and writes rows to the Sheet set inside code.gs (SPREADSHEET_ID).
 */
export const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzvjEErtG4plilEmQu-l3PMphxwddX8QCy7Sk3qtCfy6FFnuC2CW0ERxeU1-MydP38r/exec';

export const GOOGLE_SCRIPT_PLACEHOLDER = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

export function isGoogleScriptConfigured() {
    return Boolean(GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== GOOGLE_SCRIPT_PLACEHOLDER);
}

export function logGoogleScriptStatus() {
    if (!isGoogleScriptConfigured()) {
        console.warn(
            'Google Apps Script Web App URL is not set. Update js/config.js after deploying your script.'
        );
    } else {
        console.log('Google Apps Script Web App URL:', GOOGLE_SCRIPT_URL);
    }
}
