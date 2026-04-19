/**
 * Admin forms — drafts in localStorage; share links for students (fillform).
 * Console login uses ADMIN_PASSWORD below (browser only, not sent to Google).
 */

import { encodePayload } from '../fillform/payload.js';

const ADMIN_SESSION_KEY = 'adminforms_session_v1';
/** Change this before sharing the admin URL. Checked only in this browser. */
const ADMIN_PASSWORD = 'admin123';
const STORAGE_FORMS = 'adminforms_forms_drafts_v1';

const QUESTION_TYPES = [
    { value: 'short_text', label: 'Short answer' },
    { value: 'long_text', label: 'Paragraph' },
    { value: 'multiple_choice', label: 'Multiple choice' },
    { value: 'checkboxes', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'linear_scale', label: 'Linear scale' },
    { value: 'yes_no', label: 'Yes / No' }
];

const TYPE_LABELS = Object.fromEntries(QUESTION_TYPES.map((t) => [t.value, t.label]));

function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function getSiteRootHref() {
    const p = window.location.pathname;
    const i = p.indexOf('/adminforms');
    if (i === -1) return `${window.location.origin}/`;
    return `${window.location.origin}${p.slice(0, i)}/`;
}

function isLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function setAdminSession() {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
}

function logout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    location.reload();
}

function loadForms() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_FORMS) || '[]');
    } catch {
        return [];
    }
}

function saveForms(list) {
    localStorage.setItem(STORAGE_FORMS, JSON.stringify(list));
}

// --- DOM refs ---
const el = {
    loginView: document.getElementById('view-login'),
    appView: document.getElementById('view-app'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewFormEditor: document.getElementById('view-form-editor'),
    btnLogout: document.getElementById('btn-logout'),
    btnNewForm: document.getElementById('btn-new-form'),
    formList: document.getElementById('form-list'),
    formEditorRoot: document.getElementById('form-editor-root'),
    modalRoot: document.getElementById('modal-root')
};

function showView(name) {
    el.viewDashboard.classList.toggle('adminforms-hidden', name !== 'dashboard');
    el.viewFormEditor.classList.toggle('adminforms-hidden', name !== 'form-editor');
}

function showLogin(show) {
    el.loginView.classList.toggle('adminforms-hidden', !show);
    el.appView.classList.toggle('adminforms-hidden', show);
}

function emptyQuestion(type) {
    const base = {
        id: uid('q'),
        type,
        title: '',
        required: false
    };
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(type)) {
        base.options = ['Option 1', 'Option 2'];
    }
    if (type === 'linear_scale') {
        base.scaleMin = 1;
        base.scaleMax = 5;
        base.scaleLabelLow = 'Low';
        base.scaleLabelHigh = 'High';
    }
    return base;
}

function renderDashboard() {
    const forms = loadForms();

    if (!forms.length) {
        el.formList.innerHTML = '<div class="empty-state">No forms yet. Create one with “New form”.</div>';
    } else {
        el.formList.innerHTML = forms
            .map(
                (f) => `
            <div class="admin-card-item" data-form-id="${f.id}">
                <div class="title">${escapeHtml(f.title || 'Untitled form')}</div>
                <div class="meta">${f.questions?.length || 0} questions · Updated ${formatDate(f.updatedAt)}</div>
                <div class="actions">
                    <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" data-action="edit-form">Edit</button>
                    <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" data-action="preview-form">Preview</button>
                    <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" data-action="share-form">Share link</button>
                    <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" data-action="delete-form">Delete</button>
                </div>
            </div>`
            )
            .join('');
    }

    el.formList.querySelectorAll('[data-action="edit-form"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.closest('[data-form-id]').getAttribute('data-form-id');
            openFormEditor(id);
        });
    });
    el.formList.querySelectorAll('[data-action="preview-form"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.closest('[data-form-id]').getAttribute('data-form-id');
            openPreviewForm(getFormById(id));
        });
    });
    el.formList.querySelectorAll('[data-action="share-form"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.closest('[data-form-id]').getAttribute('data-form-id');
            openShareModal(id);
        });
    });
    el.formList.querySelectorAll('[data-action="delete-form"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.closest('[data-form-id]').getAttribute('data-form-id');
            if (confirm('Delete this form draft?')) {
                saveForms(loadForms().filter((f) => f.id !== id));
                renderDashboard();
            }
        });
    });
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function getFormById(id) {
    return loadForms().find((f) => f.id === id);
}

function openFormEditor(id) {
    const forms = loadForms();
    let form = forms.find((f) => f.id === id);
    if (!form) return;
    showView('form-editor');
    renderFormEditor(form);
}

function newForm() {
    const form = {
        id: uid('form'),
        kind: 'form',
        title: 'Untitled form',
        description: '',
        questions: [emptyQuestion('short_text')],
        updatedAt: new Date().toISOString()
    };
    const forms = loadForms();
    forms.unshift(form);
    saveForms(forms);
    openFormEditor(form.id);
}

function renderFormEditor(form) {
    el.formEditorRoot.innerHTML = `
        <div class="admin-editor-header">
            <input type="text" class="title-input" id="fe-title" value="${escapeHtml(form.title)}" placeholder="Form title" maxlength="200">
            <textarea class="desc-input" id="fe-desc" placeholder="Form description (optional)">${escapeHtml(form.description)}</textarea>
        </div>
        <div class="admin-toolbar">
            <label for="fe-add-type">Add question</label>
            <select id="fe-add-type">
                ${QUESTION_TYPES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('')}
            </select>
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="fe-add-q"><i class="fas fa-plus"></i> Add</button>
            <span style="flex:1"></span>
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="fe-back"><i class="fas fa-arrow-left"></i> Dashboard</button>
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="fe-save"><i class="fas fa-save"></i> Save draft</button>
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="fe-preview"><i class="fas fa-eye"></i> Preview</button>
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="fe-share"><i class="fas fa-link"></i> Offline share link</button>
        </div>
        <div class="admin-questions" id="fe-questions"></div>
    `;

    const qRoot = el.formEditorRoot.querySelector('#fe-questions');
    const renderQs = () => {
        qRoot.innerHTML = '';
        form.questions.forEach((q, qi) => {
            qRoot.appendChild(renderQuestionCard(form, q, qi));
        });
    };
    renderQs();

    el.formEditorRoot.querySelector('#fe-title').addEventListener('input', (e) => {
        form.title = e.target.value;
    });
    el.formEditorRoot.querySelector('#fe-desc').addEventListener('input', (e) => {
        form.description = e.target.value;
    });
    el.formEditorRoot.querySelector('#fe-add-q').addEventListener('click', () => {
        const type = el.formEditorRoot.querySelector('#fe-add-type').value;
        form.questions.push(emptyQuestion(type));
        renderQs();
    });
    el.formEditorRoot.querySelector('#fe-back').addEventListener('click', () => {
        persistCurrentForm(form);
        showView('dashboard');
        renderDashboard();
    });
    el.formEditorRoot.querySelector('#fe-save').addEventListener('click', () => {
        persistCurrentForm(form);
        alert('Draft saved in this browser (localStorage).');
    });
    el.formEditorRoot.querySelector('#fe-preview').addEventListener('click', () => {
        persistCurrentForm(form);
        openPreviewForm(getFormById(form.id));
    });
    el.formEditorRoot.querySelector('#fe-share').addEventListener('click', () => {
        persistCurrentForm(form);
        openShareModal(form.id);
    });
}

function renderQuestionCard(form, q, index) {
    const wrap = document.createElement('div');
    wrap.className = 'admin-q-card';
    wrap.dataset.qid = q.id;

    let extra = '';
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type)) {
        extra = `
            <div class="admin-options-list">
                ${(q.options || [])
                    .map(
                        (opt, oi) => `
                    <div class="opt-row">
                        <input type="text" value="${escapeHtml(opt)}" data-opt-i="${oi}" class="opt-input" placeholder="Option ${oi + 1}">
                        <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm opt-remove" data-opt-i="${oi}"><i class="fas fa-times"></i></button>
                    </div>`
                    )
                    .join('')}
                <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm add-opt"><i class="fas fa-plus"></i> Add option</button>
            </div>`;
    } else if (q.type === 'linear_scale') {
        extra = `
            <div class="admin-scale-row">
                <label>From <input type="number" class="scale-min" value="${q.scaleMin}" min="0" max="99"></label>
                <label>To <input type="number" class="scale-max" value="${q.scaleMax}" min="1" max="100"></label>
            </div>
            <div class="admin-options-list">
                <input type="text" class="scale-low" value="${escapeHtml(q.scaleLabelLow)}" placeholder="Label (low)">
                <input type="text" class="scale-high" value="${escapeHtml(q.scaleLabelHigh)}" placeholder="Label (high)">
            </div>`;
    }

    wrap.innerHTML = `
        <div class="q-type-badge">${TYPE_LABELS[q.type] || q.type}</div>
        <input type="text" class="q-title-input" value="${escapeHtml(q.title)}" placeholder="Question title">
        ${extra}
        <div class="admin-q-row">
            <label><input type="checkbox" class="q-required" ${q.required ? 'checked' : ''}> Required</label>
        </div>
        <div class="admin-q-actions">
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm q-up" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm q-down" ${index === form.questions.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
            <button type="button" class="admin-btn admin-btn-danger admin-btn-sm q-del"><i class="fas fa-trash"></i> Remove</button>
        </div>
    `;

    const titleIn = wrap.querySelector('.q-title-input');
    titleIn.addEventListener('input', () => {
        q.title = titleIn.value;
    });
    wrap.querySelector('.q-required').addEventListener('change', (e) => {
        q.required = e.target.checked;
    });

    wrap.querySelectorAll('.opt-input').forEach((inp) => {
        inp.addEventListener('input', () => {
            const oi = +inp.dataset.optI;
            q.options[oi] = inp.value;
        });
    });
    wrap.querySelectorAll('.opt-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            const oi = +btn.dataset.optI;
            q.options.splice(oi, 1);
            if (!q.options.length) q.options.push('Option');
            renderFormEditor(form);
        });
    });
    const addOpt = wrap.querySelector('.add-opt');
    if (addOpt) {
        addOpt.addEventListener('click', () => {
            q.options.push(`Option ${q.options.length + 1}`);
            renderFormEditor(form);
        });
    }

    const smin = wrap.querySelector('.scale-min');
    const smax = wrap.querySelector('.scale-max');
    if (smin) {
        smin.addEventListener('change', () => {
            q.scaleMin = +smin.value || 0;
        });
        smax.addEventListener('change', () => {
            q.scaleMax = +smax.value || 5;
        });
        wrap.querySelector('.scale-low').addEventListener('input', (e) => {
            q.scaleLabelLow = e.target.value;
        });
        wrap.querySelector('.scale-high').addEventListener('input', (e) => {
            q.scaleLabelHigh = e.target.value;
        });
    }

    wrap.querySelector('.q-up').addEventListener('click', () => {
        if (index <= 0) return;
        [form.questions[index - 1], form.questions[index]] = [form.questions[index], form.questions[index - 1]];
        renderFormEditor(form);
    });
    wrap.querySelector('.q-down').addEventListener('click', () => {
        if (index >= form.questions.length - 1) return;
        [form.questions[index + 1], form.questions[index]] = [form.questions[index], form.questions[index + 1]];
        renderFormEditor(form);
    });
    wrap.querySelector('.q-del').addEventListener('click', () => {
        if (form.questions.length <= 1) {
            alert('Keep at least one question.');
            return;
        }
        form.questions.splice(index, 1);
        renderFormEditor(form);
    });

    return wrap;
}

function persistCurrentForm(form) {
    form.updatedAt = new Date().toISOString();
    const forms = loadForms();
    const i = forms.findIndex((f) => f.id === form.id);
    if (i >= 0) forms[i] = form;
    saveForms(forms);
}

function openPreviewForm(form) {
    if (!form) return;
    const body = `
        <div class="admin-preview-form">
            <div class="pv-title">${escapeHtml(form.title)}</div>
            ${form.description ? `<div class="pv-desc">${escapeHtml(form.description)}</div>` : ''}
            ${(form.questions || [])
                .map((q) => {
                    const req = q.required ? ' <span class="pv-req">*</span>' : '';
                    let field = '';
                    if (q.type === 'short_text') {
                        field = `<input type="text" disabled placeholder="Short answer text">`;
                    } else if (q.type === 'long_text') {
                        field = `<textarea disabled placeholder="Long answer"></textarea>`;
                    } else if (q.type === 'multiple_choice') {
                        field = `<div class="pv-opts">${(q.options || []).map((o) => `<label><input type="radio" disabled name="${q.id}"> ${escapeHtml(o)}</label>`).join('')}</div>`;
                    } else if (q.type === 'checkboxes') {
                        field = `<div class="pv-opts">${(q.options || []).map((o) => `<label><input type="checkbox" disabled> ${escapeHtml(o)}</label>`).join('')}</div>`;
                    } else if (q.type === 'dropdown') {
                        field = `<select disabled><option>Choose</option>${(q.options || []).map((o) => `<option>${escapeHtml(o)}</option>`).join('')}</select>`;
                    } else if (q.type === 'linear_scale') {
                        const min = q.scaleMin ?? 1;
                        const max = q.scaleMax ?? 5;
                        let radios = '';
                        for (let n = min; n <= max; n++) {
                            radios += `<label style="display:inline-flex;margin-right:0.5rem;"><input type="radio" disabled> ${n}</label>`;
                        }
                        field = `<div class="pv-opts"><span style="font-size:0.85rem;color:var(--admin-muted)">${escapeHtml(q.scaleLabelLow)}</span> ${radios} <span style="font-size:0.85rem;color:var(--admin-muted)">${escapeHtml(q.scaleLabelHigh)}</span></div>`;
                    } else if (q.type === 'yes_no') {
                        field = `<div class="pv-opts"><label><input type="radio" disabled name="${q.id}"> Yes</label><label><input type="radio" disabled name="${q.id}"> No</label></div>`;
                    }
                    return `<div class="admin-preview-q"><div class="pv-q-title">${escapeHtml(q.title || 'Question')}${req}</div>${field}</div>`;
                })
                .join('')}
        </div>
    `;
    openModal('Preview (student view)', body, true);
}

function openShareModal(id) {
    const form = getFormById(id);
    if (!form) return;
    const payload = {
        v: 1,
        kind: 'form',
        id: form.id,
        title: form.title,
        description: form.description,
        questions: form.questions
    };
    let b64;
    try {
        b64 = encodePayload(payload);
    } catch (err) {
        alert('Could not build share link. Try shortening the form.');
        return;
    }
    const url = `${getSiteRootHref()}fillform.html#d=${encodeURIComponent(b64)}`;
    let extraNote = '';
    if (url.length > 8000) {
        extraNote =
            'This link is long; some chat apps may truncate it. Prefer email, WhatsApp “document”, or a URL shortener.';
    }

    const body = `
        <p style="font-size:0.9rem;color:var(--admin-muted);margin-bottom:0.75rem;">
            <strong>Students never read your localStorage.</strong> This link contains a <em>copy</em> of the form. Send it by WhatsApp, email, etc. They open it in a browser — no password.
        </p>
        ${extraNote ? `<p style="font-size:0.85rem;color:#b45309;margin-bottom:0.75rem;">${escapeHtml(extraNote)}</p>` : ''}
        <div class="admin-share-box" style="max-height:140px;overflow:auto;word-break:break-all;">${escapeHtml(url)}</div>
        <button type="button" class="admin-btn admin-btn-primary admin-btn-sm" id="modal-copy" style="margin-top:0.75rem">Copy link</button>
    `;
    openModal('Share with students', body, false);
    el.modalRoot.querySelector('#modal-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(url).then(() => alert('Copied.')).catch(() => prompt('Copy this link:', url));
    });
}

function openModal(title, bodyHtml, wide) {
    el.modalRoot.innerHTML = `
        <div class="admin-modal-overlay" id="modal-ov">
            <div class="admin-modal" style="max-width:${wide ? '720px' : '520px'}">
                <div class="admin-modal-header">
                    <h3>${escapeHtml(title)}</h3>
                    <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="admin-modal-body">${bodyHtml}</div>
                <div class="admin-modal-footer">
                    <button type="button" class="admin-btn admin-btn-secondary" id="modal-done">Close</button>
                </div>
            </div>
        </div>
    `;
    const close = () => {
        el.modalRoot.innerHTML = '';
    };
    el.modalRoot.querySelector('#modal-close').addEventListener('click', close);
    el.modalRoot.querySelector('#modal-done').addEventListener('click', close);
    el.modalRoot.querySelector('#modal-ov').addEventListener('click', (e) => {
        if (e.target.id === 'modal-ov') close();
    });
}

// --- init ---
el.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    el.loginError.textContent = '';
    const password = document.getElementById('login-password').value;
    if (password !== ADMIN_PASSWORD) {
        el.loginError.textContent = 'Wrong password.';
        return;
    }
    setAdminSession();
    showLogin(false);
    renderDashboard();
});

el.btnLogout.addEventListener('click', logout);
el.btnNewForm.addEventListener('click', newForm);

if (isLoggedIn()) {
    showLogin(false);
    renderDashboard();
} else {
    showLogin(true);
}
