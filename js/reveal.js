/**
 * Scroll-triggered reveal using IntersectionObserver.
 * Replaces the old scroll-event + getBoundingClientRect loop
 * which caused layout thrashing at 60 fps.
 */
export function initRevealOnScroll() {
    const revealElements = document.querySelectorAll(
        '.course-card, .year-card, .gallery-item, .contact-item, .testimonial-card'
    );
    if (!revealElements.length) return;

    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                /* Stagger siblings in a grid for a cascading 3D effect */
                const siblings = entry.target.parentElement
                    ? [...entry.target.parentElement.children]
                    : [];
                const idx = siblings.indexOf(entry.target);
                if (idx > 0) {
                    entry.target.style.transitionDelay = `${idx * 80}ms`;
                }

                entry.target.classList.add('active');
                observer.unobserve(entry.target); /* reveal once, then stop watching */
            });
        },
        {
            threshold: 0.08,
            rootMargin: '0px 0px -30px 0px',
        }
    );

    revealElements.forEach(el => observer.observe(el));
}
