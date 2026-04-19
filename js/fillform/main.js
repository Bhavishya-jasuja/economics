/**
 * Public form fill page — reads form definition from URL (#d=base64 JSON).
 */
import { decodePayload, readPayloadFromLocation } from './payload.js';

const root = document.getElementById('fill-root');

function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function showError(msg) {
    root.innerHTML = `<div class="fillform-wrap"><div class="fillform-card"><div class="fillform-error">${escapeHtml(msg)}</div><p class="fillform-foot"><a href="index.html">Back to site</a></p></div></div>`;
}

function collectAnswers(form, formEl) {
    const fd = new FormData(formEl);
    const out = {};
    for (const q of form.questions || []) {
        if (q.type === 'checkboxes') {
            out[q.id] = fd.getAll(q.id).map(String);
        } else {
            out[q.id] = (fd.get(q.id) ?? '').toString().trim();
        }
    }
    return out;
}

function validate(form, answers) {
    for (const q of form.questions || []) {
        if (!q.required) continue;
        const v = answers[q.id];
        if (q.type === 'checkboxes') {
            if (!v || !v.length) return `Please answer: ${q.title || 'Question'}`;
        } else if (v === '' || v == null) {
            return `Please answer: ${q.title || 'Question'}`;
        }
    }
    return null;
}

function renderForm(form) {
    const qs = (form.questions || [])
        .map((q) => {
            const req = q.required ? '<span class="req">*</span>' : '';
            let inner = '';
            if (q.type === 'short_text') {
                inner = `<input type="text" name="${escapeHtml(q.id)}" placeholder="Your answer" autocomplete="name">`;
            } else if (q.type === 'long_text') {
                inner = `<textarea name="${escapeHtml(q.id)}" placeholder="Your answer"></textarea>`;
            } else if (q.type === 'multiple_choice') {
                inner = `<div class="opts">${(q.options || [])
                    .map(
                        (o) =>
                            `<label><input type="radio" name="${escapeHtml(q.id)}" value="${escapeHtml(o)}"> ${escapeHtml(o)}</label>`
                    )
                    .join('')}</div>`;
            } else if (q.type === 'checkboxes') {
                inner = `<div class="opts">${(q.options || [])
                    .map(
                        (o) =>
                            `<label><input type="checkbox" name="${escapeHtml(q.id)}" value="${escapeHtml(o)}"> ${escapeHtml(o)}</label>`
                    )
                    .join('')}</div>`;
            } else if (q.type === 'dropdown') {
                inner = `<select name="${escapeHtml(q.id)}"><option value="">Choose…</option>${(q.options || [])
                    .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
                    .join('')}</select>`;
            } else if (q.type === 'linear_scale') {
                const min = q.scaleMin ?? 1;
                const max = q.scaleMax ?? 5;
                let radios = '';
                for (let n = min; n <= max; n++) {
                    radios += `<label><input type="radio" name="${escapeHtml(q.id)}" value="${n}"> ${n}</label>`;
                }
                inner = `<div class="scale-row"><span style="font-size:0.8rem;color:var(--ff-muted)">${escapeHtml(q.scaleLabelLow)}</span>${radios}<span style="font-size:0.8rem;color:var(--ff-muted)">${escapeHtml(q.scaleLabelHigh)}</span></div>`;
            } else if (q.type === 'yes_no') {
                inner = `<div class="opts"><label><input type="radio" name="${escapeHtml(q.id)}" value="Yes"> Yes</label><label><input type="radio" name="${escapeHtml(q.id)}" value="No"> No</label></div>`;
            }
            return `<div class="fillform-q"><label class="q-label">${escapeHtml(q.title || 'Question')}${req}</label>${inner}</div>`;
        })
        .join('');

    root.innerHTML = `
        <div class="fillform-wrap">
            <div class="fillform-card">
                <h1 class="fillform-title">${escapeHtml(form.title || 'Form')}</h1>
                ${form.description ? `<p class="fillform-desc">${escapeHtml(form.description)}</p>` : ''}
                <form id="public-form">
                    ${qs}
                    <button type="submit" class="fillform-submit">Submit</button>
                </form>
                <div id="fill-msg" style="display:none" class="fillform-success"></div>
                <p class="fillform-foot"><a href="index.html">← Back to site</a></p>
            </div>
        </div>
    `;

    document.getElementById('public-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formEl = e.target;
        const answers = collectAnswers(form, formEl);
        const err = validate(form, answers);
        if (err) {
            alert(err);
            return;
        }
        const msg = document.getElementById('fill-msg');
        msg.style.display = 'block';
        msg.innerHTML =
            '<strong>Thanks — response recorded on this device only (demo).</strong><br><br>' +
            'Your teacher will connect Google Sheets / Apps Script next so answers are stored centrally. ' +
            'For now you can screenshot this page if they asked for proof.';
        formEl.querySelector('.fillform-submit').disabled = true;
        console.log('Form submission (demo):', { formId: form.id, answers });
    });
}

try {
    const raw = readPayloadFromLocation();
    if (!raw) {
        showError(
            'Missing form data. Open the link your teacher shared (it should be long and start with fillform.html#d=...).'
        );
    } else {
        const data = decodePayload(raw);
        if (data.v !== 1 || data.kind !== 'form' || !Array.isArray(data.questions)) {
            showError('Invalid or outdated link. Ask your teacher for a new share link.');
        } else {
            renderForm(data);
        }
    }
} catch (e) {
    console.error(e);
    showError('Could not read this form link. It may be broken or truncated. Ask for a new link.');
}
