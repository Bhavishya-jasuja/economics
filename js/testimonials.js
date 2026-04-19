/**
 * Testimonials carousel with dots and auto-advance.
 */
let testimonialsSliderInitialized = false;

export function initTestimonialsSlider() {
    if (testimonialsSliderInitialized) return;

    const slider = document.querySelector('.testimonials-slider');
    const cards = document.querySelectorAll('.testimonial-card');
    const dotsContainer = document.querySelector('.slider-dots');

    if (!slider || !cards.length || !dotsContainer) return;

    testimonialsSliderInitialized = true;

    let currentIndex = 0;
    let autoSlideInterval;

    cards.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (index === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.slider-dot');

    const goToSlide = (index) => {
        cards.forEach((card) => card.classList.remove('active'));
        dots.forEach((dot) => dot.classList.remove('active'));
        cards[index].classList.add('active');
        dots[index].classList.add('active');
        currentIndex = index;
    };

    const autoSlide = () => {
        currentIndex = (currentIndex + 1) % cards.length;
        goToSlide(currentIndex);
    };

    const startAutoSlide = () => {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(autoSlide, 8000);
    };

    const stopAutoSlide = () => {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    };

    goToSlide(0);
    setTimeout(() => startAutoSlide(), 2000);

    const sliderContainer = document.querySelector('.testimonials-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', () => setTimeout(startAutoSlide, 2000));
    }

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            setTimeout(startAutoSlide, 8000);
        });
    });
}
