import { GOOGLE_SCRIPT_URL, GOOGLE_SCRIPT_PLACEHOLDER } from '../config.js';

/**
 * Sends data to google-apps-script/code.gs (Web App doPost), which appends a row to the Sheet.
 * Uses no-cors; the browser cannot read the response body.
 */
export async function postToGoogleScript(payload) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === GOOGLE_SCRIPT_PLACEHOLDER) {
        console.warn('Google Sheets not configured. Set GOOGLE_SCRIPT_URL in js/config.js');
        return { success: false, error: 'Google Sheets not configured' };
    }

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return { success: true };
    } catch (error) {
        console.error('Error posting to Google Apps Script:', error);
        return { success: false, error: error.message };
    }
}

/** Same field names as handleContactPost_() in google-apps-script/code.gs */
export async function saveContactFormToSheets(formData) {
    return postToGoogleScript(formData);
}

/**
 * Marks modal payload → code.gs handleMarksPost_ (tab marksForm).
 * Body: { type: 'marks', student: { studentName, class, school, mobile }, marks: [{ subject, term, marksObtained, outOf }, ...] }
 */
export async function saveMarksToSheets({ student, marks }) {
    return postToGoogleScript({ type: 'marks', student, marks });
}
