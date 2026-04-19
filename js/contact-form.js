import { saveContactFormToSheets } from './services/google-sheets.js';

const PHONE_REGEX = /^[0-9]{10}$/;

function resetMessage(formMessage) {
    setTimeout(() => {
        formMessage.className = 'form-message';
    }, 5000);
}

/**
 * Contact section form → Google Sheets (only runs if #contactForm exists).
 */
export function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    if (!contactForm || !formMessage) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

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
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
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

        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';

        if (result.success) {
            formMessage.textContent =
                'Thank you! Your message has been saved successfully. We will get back to you soon.';
            formMessage.className = 'form-message success';
            contactForm.reset();
        } else {
            formMessage.textContent =
                'There was an error saving your message. Please try again or contact us directly.';
            formMessage.className = 'form-message error';
        }
        resetMessage(formMessage);
    });
}
