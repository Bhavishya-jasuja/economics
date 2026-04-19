/**
 * Home page (index.html) entry — imports feature modules only for this page.
 */
import { logGoogleScriptStatus } from './config.js';
import { initNavigation } from './nav.js';
import { initMemoryGallery, initInstagramEmbedsRetries } from './memory-gallery.js';
import { initRevealOnScroll } from './reveal.js';
import { initContactForm } from './contact-form.js';
import { initTestimonialsSlider } from './testimonials.js';
import { initCustomSelect } from './custom-select.js';
import { initMarksSubmitModal } from './marks-submit-modal.js';

initNavigation();
initMemoryGallery();
initInstagramEmbedsRetries();
initRevealOnScroll();
initContactForm();
initTestimonialsSlider();
initCustomSelect();
initMarksSubmitModal();
logGoogleScriptStatus();
