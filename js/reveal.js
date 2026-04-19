/**
 * Scroll-triggered reveal for cards and gallery items.
 */
export function initRevealOnScroll() {
    const revealElements = document.querySelectorAll(
        '.student-card, .course-card, .achievement-item, .gallery-item'
    );
    if (!revealElements.length) return;

    revealElements.forEach((element) => element.classList.add('reveal'));

    const revealOnScroll = () => {
        revealElements.forEach((element) => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('reveal', 'active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('load', revealOnScroll);
}
