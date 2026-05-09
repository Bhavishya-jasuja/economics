/**
 * GPU-accelerated 3D mouse-follow tilt for cards.
 * Skipped entirely on touch/coarse-pointer devices (phones, tablets)
 * so there is zero overhead on mobile.
 */
export function init3DTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = document.querySelectorAll('.course-card, .year-card');

    cards.forEach(card => {
        /* Add shine overlay for light-reflection feel */
        const shine = document.createElement('div');
        shine.className = 'card-shine';
        card.appendChild(shine);

        card.addEventListener('mousemove', e => {
            const r  = card.getBoundingClientRect();
            const x  = e.clientX - r.left;
            const y  = e.clientY - r.top;
            const rx = ((y / r.height) - 0.5) * -14;   /* ±7 deg vertical */
            const ry = ((x / r.width)  - 0.5) *  14;   /* ±7 deg horizontal */

            card.style.transform =
                `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.04,1.04,1.04)`;

            shine.style.background =
                `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, transparent 62%)`;
        });

        card.addEventListener('mouseleave', () => {
            /* Smooth spring-back */
            card.style.transition =
                'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)';
            card.style.transform  = '';
            shine.style.background = '';

            /* Remove inline transition after spring-back so hover feels instant */
            card.addEventListener('transitionend', () => {
                card.style.transition = '';
            }, { once: true });
        });
    });
}
