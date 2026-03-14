// Navigation functionality
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Memories Slider
const sliderTrack = document.getElementById('sliderTrack');
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let currentSlide = 0;
const totalSlides = slides.length;

// Clone first and last slides for infinite loop
const firstClone = slides[0].cloneNode(true);
const lastClone = slides[totalSlides - 1].cloneNode(true);
sliderTrack.appendChild(firstClone);
sliderTrack.insertBefore(lastClone, slides[0]);

// Update slider position
function updateSlider() {
    sliderTrack.style.transform = `translateX(-${(currentSlide + 1) * 100}%)`;
}

// Next slide
function nextSlide() {
    currentSlide++;
    updateSlider();
    
    if (currentSlide >= totalSlides) {
        setTimeout(() => {
            currentSlide = 0;
            sliderTrack.style.transition = 'none';
            updateSlider();
            setTimeout(() => {
                sliderTrack.style.transition = 'transform 0.5s ease';
            }, 50);
        }, 500);
    }
}

// Previous slide
function prevSlide() {
    currentSlide--;
    updateSlider();
    
    if (currentSlide < 0) {
        setTimeout(() => {
            currentSlide = totalSlides - 1;
            sliderTrack.style.transition = 'none';
            updateSlider();
            setTimeout(() => {
                sliderTrack.style.transition = 'transform 0.5s ease';
            }, 50);
        }, 500);
    }
}

// Button events
nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// Auto-slide every 2.5 seconds
let autoSlideInterval = setInterval(nextSlide, 2500);

// Pause auto-slide on hover
const sliderContainer = document.querySelector('.slider-container');
sliderContainer.addEventListener('mouseenter', () => {
    clearInterval(autoSlideInterval);
});

sliderContainer.addEventListener('mouseleave', () => {
    autoSlideInterval = setInterval(nextSlide, 2500);
});

// Initialize slider
updateSlider();
setTimeout(() => {
    sliderTrack.style.transition = 'transform 0.5s ease';
}, 50);

// Scroll reveal animation
const revealElements = document.querySelectorAll('.student-card, .course-card, .achievement-item');

const revealOnScroll = () => {
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('reveal', 'active');
        }
    });
};

// Initialize reveal animation
revealElements.forEach(element => {
    element.classList.add('reveal');
});

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// Contact Form - Google Sheets Integration
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

// IMPORTANT: Replace with your Google Apps Script Web App URL
// Get it after deploying the Google Apps Script (see GOOGLE_SHEETS_SETUP.md)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzP4Cl5fHyz88Q5JYQQSS9RNq4xA_mIlUyK2SrGOx10XxEt-LeS9f9Zo2MGGkNl80y4/exec';

// Save data to Google Sheets
async function saveToGoogleSheets(formData) {
    try {
        // Check if URL is configured
        if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            console.warn('Google Sheets not configured. Please set GOOGLE_SCRIPT_URL in script.js');
            return { success: false, error: 'Google Sheets not configured' };
        }
        
        // Send as JSON (Google Apps Script handles both JSON and form data)
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        // With no-cors, we can't read response, but we'll assume success
        // The data should be saved. If there's an error, check Google Apps Script logs
        console.log('Form data sent to Google Sheets');
        return { success: true };
        
    } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        return { success: false, error: error.message };
    }
}

// Form submission handler
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable submit button to prevent double submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Get form values
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value.trim()
    };
    
    // Validate form
    if (!formData.name || !formData.phone || !formData.email || !formData.subject || !formData.message) {
        formMessage.textContent = 'Please fill in all fields.';
        formMessage.className = 'form-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 5000);
        return;
    }
    
    // Save to Google Sheets
    const result = await saveToGoogleSheets(formData);
    
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
    
    // Show result message
    if (result.success) {
        formMessage.textContent = 'Thank you! Your message has been saved successfully. We will get back to you soon.';
        formMessage.className = 'form-message success';
        
        // Reset form
        contactForm.reset();
    } else {
        formMessage.textContent = 'There was an error saving your message. Please try again or contact us directly.';
        formMessage.className = 'form-message error';
    }
    
    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.className = 'form-message';
    }, 5000);
});

// Counter animation for statistics
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            const text = element.textContent;
            if (text.includes('%')) {
                element.textContent = target + '%';
            } else if (text.includes('+')) {
                element.textContent = target + '+';
            } else if (text.includes('/')) {
                element.textContent = target + '/5';
            } else {
                element.textContent = target;
            }
            clearInterval(timer);
        } else {
            const text = element.textContent;
            if (text.includes('%')) {
                element.textContent = Math.floor(start) + '%';
            } else if (text.includes('+')) {
                element.textContent = Math.floor(start) + '+';
            } else if (text.includes('/')) {
                element.textContent = (start / 5).toFixed(1) + '/5';
            } else {
                element.textContent = Math.floor(start);
            }
        }
    }, 16);
};

// Observe statistics section for counter animation
const statsSection = document.querySelector('.achievements-stats');
const achievementStats = document.querySelectorAll('.achievement-stat .stat-number');

const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const text = stat.textContent;
                    let number;
                    
                    if (text.includes('/')) {
                        number = parseFloat(text.replace(/[^\d.]/g, ''));
                    } else {
                        number = parseInt(text.replace(/\D/g, ''));
                    }
                    
                    if (number && !stat.classList.contains('animated')) {
                        stat.classList.add('animated');
                        animateCounter(stat, number);
                    }
                });
            }
        });
    }, observerOptions);
    
    statsObserver.observe(statsSection);
}

// Add active class to current navigation link
const sections = document.querySelectorAll('section[id]');

const highlightNavigation = () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
};

window.addEventListener('scroll', highlightNavigation);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if Google Sheets is configured
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.warn('⚠️ Google Sheets not configured. Please follow GOOGLE_SHEETS_SETUP.md to set up data storage.');
    } else {
        console.log('✅ Google Sheets integration ready');
        console.log('📝 Web App URL:', GOOGLE_SCRIPT_URL);
    }
});
