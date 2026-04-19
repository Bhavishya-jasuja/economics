/**
 * Encode / decode form definition into a URL fragment (share link).
 * Students do not use admin localStorage — the link carries a snapshot of the form.
 */

export function encodePayload(obj) {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)));
}

export function decodePayload(b64) {
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
}

/** Read #d=... from hash (preferred) or ?d= from query */
export function readPayloadFromLocation() {
    if (location.hash.startsWith('#d=')) {
        return decodeURIComponent(location.hash.slice(3));
    }
    const q = new URLSearchParams(location.search).get('d');
    return q || '';
}
