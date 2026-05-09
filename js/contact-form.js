import { saveContactFormToSheets } from './services/google-sheets.js';

const PHONE_REGEX = /^[0-9]{10}$/;
const WA_NUMBER = '919084514455';

function setBtn(btn, text, disabled) {
    const span = btn.querySelector('span');
    if (span) span.textContent = text;
    else btn.textContent = text;
    btn.disabled = disabled;
}

function resetMessage(formMessage) {
    setTimeout(() => {
        formMessage.className = 'form-message';
    }, 6000);
}


function buildWaMessage(data) {
    return encodeURIComponent(
        `Hello Udit Bhaiya,\n\n` +
        `I just filled the enrollment form. Here are my details:\n\n` +
        `Name: ${data.name}\n` +
        `Phone: ${data.phone}\n` +
        `Email: ${data.email}\n` +
        `Courses: ${data.courses}\n` +
        `Class: ${data.class}\n` +
        `School: ${data.school}\n` +
        `Parent Phone: ${data.parentPhone}\n` +
        `Address: ${data.address}\n\n` +
        `Please confirm my enrollment. Thank you!`
    );
}

/**
 * Contact section form → Google Sheets + WhatsApp redirect on success.
 */
export function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    if (!contactForm || !formMessage) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        setBtn(submitBtn, 'Sending...', true);

        const courseCheckboxes = document.querySelectorAll('input[name="courses"]:checked');
        const selectedCourses = Array.from(courseCheckboxes).map((cb) => cb.value);

        const formData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            courses: selectedCourses.join(', '),
            parentPhone: document.getElementById('parentPhone').value.trim(),
            class: document.getElementById('class').value.trim(),
            school: document.getElementById('school').value.trim(),
            address: document.getElementById('address').value.trim()
        };

        const fail = (msg) => {
            formMessage.textContent = msg;
            formMessage.className = 'form-message error';
            setBtn(submitBtn, 'Send Message', false);
            resetMessage(formMessage);
        };

        if (!PHONE_REGEX.test(formData.phone)) {
            fail('Please enter a valid 10-digit phone number.');
            return;
        }
        if (!PHONE_REGEX.test(formData.parentPhone)) {
            fail('Please enter a valid 10-digit parent phone number.');
            return;
        }
        if (
            !formData.name ||
            !formData.phone ||
            !formData.email ||
            !formData.courses ||
            !formData.parentPhone ||
            !formData.class ||
            !formData.school ||
            !formData.address
        ) {
            fail('Please fill in all fields and select at least one course.');
            return;
        }
        if (selectedCourses.length === 0) {
            fail('Please select at least one course.');
            return;
        }

        const result = await saveContactFormToSheets(formData);
        setBtn(submitBtn, 'Send Message', false);

        if (result.success) {
            formMessage.textContent =
                '✅ Message sent! Redirecting to WhatsApp...';
            formMessage.className = 'form-message success';
            contactForm.reset();

            setTimeout(() => {
                window.location.href = `https://wa.me/${WA_NUMBER}?text=${buildWaMessage(formData)}`;
            }, 1500);
        } else {
            formMessage.textContent =
                'There was an error saving your message. Please try again or contact us directly.';
            formMessage.className = 'form-message error';
        }

        resetMessage(formMessage);
    });
}
