import { saveMarksToSheets } from './services/google-sheets.js';

/**
 * Submit marks modal → Google Sheets (marksForm) via same Web App as contact form.
 */
function rowTemplate(index) {
    const n = index + 1;
    return `
        <div class="marks-row" data-marks-row data-index="${index}">
            <div class="marks-row__head">
                <span class="marks-row__label">Marks ${n}</span>
                <button type="button" class="marks-row__remove" data-marks-remove aria-label="Remove this row">Remove</button>
            </div>
            <div class="marks-row__grid">
                <label class="marks-field"><span class="marks-field__label">Subject</span><input type="text" name="subject_${index}" required maxlength="100" data-field="subject" placeholder="e.g. Economics"></label>
                <label class="marks-field"><span class="marks-field__label">Term</span><input type="text" name="term_${index}" required maxlength="80" data-field="term" placeholder="e.g. Mid-term, Term 1"></label>
                <label class="marks-field"><span class="marks-field__label">Marks obtained</span><input type="number" name="marksObtained_${index}" required min="0" step="0.01" data-field="obtained"></label>
                <label class="marks-field"><span class="marks-field__label">Out of</span><input type="number" name="marksOutOf_${index}" required min="1" step="0.01" data-field="outOf"></label>
            </div>
        </div>
    `;
}

function syncRowLabels(container) {
    container.querySelectorAll('[data-marks-row]').forEach((row, i) => {
        const lab = row.querySelector('.marks-row__label');
        if (lab) lab.textContent = `Marks ${i + 1}`;
        row.querySelectorAll('input').forEach((inp) => {
            const base = inp.dataset.field;
            if (!base) return;
            const nameMap = { subject: 'subject', term: 'term', obtained: 'marksObtained', outOf: 'marksOutOf' };
            const key = nameMap[base] || base;
            inp.name = `${key}_${i}`;
        });
        row.dataset.index = String(i);
    });
}

function updateRemoveButtons(container) {
    const rows = container.querySelectorAll('[data-marks-row]');
    rows.forEach((row, i) => {
        const btn = row.querySelector('[data-marks-remove]');
        if (btn) btn.hidden = rows.length <= 1;
    });
}

function shouldOpenMarksModalFromUrl() {
    const path = (window.location.pathname || '').toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const open = (params.get('open') || '').trim().toLowerCase();
    const marksForm = (params.get('marksForm') || '').trim().toLowerCase();
    const submitMarks = (params.get('submit-marks') || '').trim().toLowerCase();
    const hasSubmitMarksParam = params.has('submit-marks');
    const hash = (window.location.hash || '').trim().toLowerCase();

    if (path.endsWith('/submit-marks') || path.endsWith('/submit-marks/')) return true;
    if (open === 'marks' || open === 'marks-form' || open === 'submit-marks') return true;
    if (marksForm === '1' || marksForm === 'true' || marksForm === 'yes') return true;
    if (hasSubmitMarksParam) return true;
    if (submitMarks === '1' || submitMarks === 'true' || submitMarks === 'yes') return true;
    if (hash === '#marks' || hash === '#marks-form' || hash === '#open-marks-form' || hash === '#submit-marks') return true;
    return false;
}

function cleanupMarksModalUrlTrigger() {
    const current = new URL(window.location.href);
    const path = (current.pathname || '').toLowerCase();
    const hadOpen = current.searchParams.has('open');
    const hadMarksForm = current.searchParams.has('marksForm');
    const hadSubmitMarksParam = current.searchParams.has('submit-marks');
    const hash = (current.hash || '').trim().toLowerCase();
    const hadHashTrigger = hash === '#marks' || hash === '#marks-form' || hash === '#open-marks-form' || hash === '#submit-marks';
    const hadSubmitMarksPath = path.endsWith('/submit-marks') || path.endsWith('/submit-marks/');

    if (!hadOpen && !hadMarksForm && !hadSubmitMarksParam && !hadHashTrigger && !hadSubmitMarksPath) return;

    current.searchParams.delete('open');
    current.searchParams.delete('marksForm');
    current.searchParams.delete('submit-marks');
    if (hadHashTrigger) current.hash = '';
    if (hadSubmitMarksPath) current.pathname = current.pathname.replace(/\/submit-marks\/?$/i, '/') || '/';

    const cleanUrl = `${current.pathname}${current.search}${current.hash}`;
    window.history.replaceState({}, '', cleanUrl);
}

export function initMarksSubmitModal() {
    const modal = document.getElementById('marksModal');
    const form = document.getElementById('marksForm');
    const rowsRoot = document.getElementById('marksRows');
    const addBtn = document.getElementById('marksAddRow');
    const openSelectors = '[data-marks-modal-open], #marksInviteCard';

    if (!modal || !form || !rowsRoot || !addBtn) return;

    const openers = document.querySelectorAll(openSelectors);
    let lastFocus = null;

    function openModal() {
        lastFocus = document.activeElement;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const first = form.querySelector('input:not([type="hidden"])');
        if (first) first.focus();
    }

    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function addRow() {
        const idx = rowsRoot.querySelectorAll('[data-marks-row]').length;
        rowsRoot.insertAdjacentHTML('beforeend', rowTemplate(idx));
        syncRowLabels(rowsRoot);
        updateRemoveButtons(rowsRoot);
    }

    rowsRoot.innerHTML = rowTemplate(0);
    updateRemoveButtons(rowsRoot);

    const mobileEl = document.getElementById('marksMobile');
    if (mobileEl) {
        mobileEl.addEventListener('input', () => {
            const digits = mobileEl.value.replace(/\D/g, '').slice(0, 10);
            if (digits !== mobileEl.value) mobileEl.value = digits;
            mobileEl.setCustomValidity('');
        });
    }

    function clearCustomValidity() {
        form.querySelectorAll('input').forEach((inp) => inp.setCustomValidity(''));
    }

    openers.forEach((el) => {
        el.addEventListener('click', () => openModal());
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal();
            }
        });
    });

    if (shouldOpenMarksModalFromUrl()) {
        openModal();
        cleanupMarksModalUrlTrigger();
    }

    modal.querySelectorAll('[data-marks-modal-close]').forEach((el) => {
        el.addEventListener('click', () => closeModal());
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    addBtn.addEventListener('click', () => addRow());

    rowsRoot.addEventListener('click', (e) => {
        const rm = e.target.closest('[data-marks-remove]');
        if (!rm || rm.hidden) return;
        const row = rm.closest('[data-marks-row]');
        if (!row || rowsRoot.querySelectorAll('[data-marks-row]').length <= 1) return;
        row.remove();
        syncRowLabels(rowsRoot);
        updateRemoveButtons(rowsRoot);
    });

    const msgEl = document.getElementById('marksFormMessage');

    function setMarksMessage(text, kind) {
        if (!msgEl) return;
        msgEl.textContent = text || '';
        msgEl.className = 'marks-form__msg' + (kind ? ' marks-form__msg--' + kind : '');
        msgEl.hidden = !text;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearCustomValidity();

        if (mobileEl) {
            mobileEl.value = mobileEl.value.replace(/\D/g, '').slice(0, 10);
            if (!/^\d{10}$/.test(mobileEl.value)) {
                mobileEl.setCustomValidity('Enter exactly 10 digits (numbers only).');
            }
        }

        rowsRoot.querySelectorAll('[data-marks-row]').forEach((row) => {
            const obInp = row.querySelector('[data-field="obtained"]');
            const outInp = row.querySelector('[data-field="outOf"]');
            if (!obInp || !outInp) return;
            const ob = parseFloat(String(obInp.value).trim());
            const out = parseFloat(String(outInp.value).trim());
            if (Number.isFinite(ob) && Number.isFinite(out) && out >= 1 && ob > out) {
                obInp.setCustomValidity('Cannot be more than "Out of".');
            }
        });

        if (!form.reportValidity()) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const prevLabel = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';
        }
        setMarksMessage('', '');

        const student = {
            studentName: document.getElementById('marksStudentName')?.value?.trim() || '',
            class: document.getElementById('marksClass')?.value?.trim() || '',
            school: document.getElementById('marksSchool')?.value?.trim() || '',
            mobile: mobileEl?.value?.trim() || ''
        };

        const markLines = [];
        rowsRoot.querySelectorAll('[data-marks-row]').forEach((row) => {
            const subject = row.querySelector('[data-field="subject"]')?.value?.trim() || '';
            const term = row.querySelector('[data-field="term"]')?.value?.trim() || '';
            const obtained = row.querySelector('[data-field="obtained"]')?.value ?? '';
            const outOf = row.querySelector('[data-field="outOf"]')?.value ?? '';
            markLines.push({ subject, term, marksObtained: obtained, outOf });
        });

        const result = await saveMarksToSheets({ student, marks: markLines });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = prevLabel || 'Submit';
        }

        if (result.success) {
            setMarksMessage('Saved. Thank you — your marks were submitted.', 'success');
            form.reset();
            rowsRoot.innerHTML = rowTemplate(0);
            syncRowLabels(rowsRoot);
            updateRemoveButtons(rowsRoot);
            setTimeout(() => {
                setMarksMessage('', '');
                closeModal();
            }, 2200);
        } else {
            setMarksMessage(
                result.error === 'Google Sheets not configured'
                    ? 'Form is not connected yet (missing Web App URL in config).'
                    : 'Could not save. Check your connection and try again.',
                'error'
            );
        }
    });
}
