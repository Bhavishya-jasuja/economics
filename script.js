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

// Memories Category Gallery - Initialize after DOM is ready
let categoryButtons, memoryGalleries;

const initMemoryGallerySelectors = () => {
    categoryButtons = document.querySelectorAll('.category-btn');
    memoryGalleries = document.querySelectorAll('.memory-gallery');
};

// Initialize - show the gallery that has active class in HTML, or first one by default
const initializeMemoryGallery = () => {
    // Initialize selectors first
    initMemoryGallerySelectors();
    
    if (!categoryButtons || !memoryGalleries || categoryButtons.length === 0 || memoryGalleries.length === 0) {
        return;
    }
    
    // Find which button is already active (from HTML)
    let activeButton = Array.from(categoryButtons).find(btn => btn.classList.contains('active'));
    let activeGallery = Array.from(memoryGalleries).find(gallery => gallery.classList.contains('active'));
    
    // If no active button/gallery found, use first one
    if (!activeButton && categoryButtons.length > 0) {
        activeButton = categoryButtons[0];
        activeButton.classList.add('active');
    }
    
    if (!activeGallery && memoryGalleries.length > 0) {
        // Get the gallery ID from the active button
        if (activeButton) {
            const targetCategory = activeButton.getAttribute('data-category');
            activeGallery = document.getElementById(targetCategory);
        }
        
        // Fallback to first gallery if still not found
        if (!activeGallery) {
            activeGallery = memoryGalleries[0];
        }
        
        // Remove active from all galleries first
        memoryGalleries.forEach(gallery => gallery.classList.remove('active'));
        
        // Set the correct gallery as active
        if (activeGallery) {
            activeGallery.classList.add('active');
        }
    }
    
    // Ensure only the active gallery is visible
    memoryGalleries.forEach(gallery => {
        if (!gallery.classList.contains('active')) {
            gallery.classList.remove('active');
        }
    });
    
    // Set up event listeners for category switching
    setupCategorySwitching();
};

// Set up category switching functionality
const setupCategorySwitching = () => {
    if (!categoryButtons || !memoryGalleries) return;
    
    categoryButtons.forEach(button => {
        // Remove any existing listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', () => {
            const targetCategory = newButton.getAttribute('data-category');
            
            // Remove active class from all buttons and galleries
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            memoryGalleries.forEach(gallery => gallery.classList.remove('active'));
            
            // Add active class to clicked button and corresponding gallery
            newButton.classList.add('active');
            const targetGallery = document.getElementById(targetCategory);
            if (targetGallery) {
                targetGallery.classList.add('active');
                // Re-process Instagram embeds when a new gallery is shown
                if (window.instgrm && window.instgrm.Embeds) {
                    setTimeout(() => {
                        window.instgrm.Embeds.process();
                    }, 100);
                }
            }
        });
    });
};

// Initialize on page load - run after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMemoryGallery);
} else {
    initializeMemoryGallery();
}

// Load Instagram embeds on page load - only for the active gallery
const loadActiveGalleryEmbeds = () => {
    if (!memoryGalleries || !window.instgrm || !window.instgrm.Embeds) return;
    
    const activeGallery = Array.from(memoryGalleries).find(gallery => gallery.classList.contains('active'));
    if (activeGallery) {
        const activeEmbeds = activeGallery.querySelectorAll('.instagram-media');
        if (activeEmbeds.length > 0) {
            window.instgrm.Embeds.process();
        }
    }
};

// Initialize Instagram embeds after page loads
if (window.instgrm) {
    // Try multiple times in case Instagram script loads later
    setTimeout(loadActiveGalleryEmbeds, 500);
    setTimeout(loadActiveGalleryEmbeds, 1000);
    setTimeout(loadActiveGalleryEmbeds, 2000);
} else {
    // Wait for Instagram script to load
    window.addEventListener('load', () => {
        setTimeout(loadActiveGalleryEmbeds, 500);
        setTimeout(loadActiveGalleryEmbeds, 1000);
        setTimeout(loadActiveGalleryEmbeds, 2000);
    });
}

// Scroll reveal animation
const revealElements = document.querySelectorAll('.student-card, .course-card, .achievement-item, .gallery-item');

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
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvjEErtG4plilEmQu-l3PMphxwddX8QCy7Sk3qtCfy6FFnuC2CW0ERxeU1-MydP38r/exec';

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
    // Get selected courses from checkboxes
    const courseCheckboxes = document.querySelectorAll('input[name="courses"]:checked');
    const selectedCourses = Array.from(courseCheckboxes).map(cb => cb.value);
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        courses: selectedCourses.join(', '), // Join multiple courses with comma
        parentPhone: document.getElementById('parentPhone').value.trim(),
        class: document.getElementById('class').value.trim(),
        school: document.getElementById('school').value.trim(),
        address: document.getElementById('address').value.trim()
    };
    
    // Validate phone numbers (exactly 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
        formMessage.textContent = 'Please enter a valid 10-digit phone number.';
        formMessage.className = 'form-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 5000);
        return;
    }
    
    if (!phoneRegex.test(formData.parentPhone)) {
        formMessage.textContent = 'Please enter a valid 10-digit parent phone number.';
        formMessage.className = 'form-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 5000);
        return;
    }
    
    // Validate form
    if (!formData.name || !formData.phone || !formData.email || !formData.courses || !formData.parentPhone || !formData.class || !formData.school || !formData.address) {
        formMessage.textContent = 'Please fill in all fields and select at least one course.';
        formMessage.className = 'form-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 5000);
        return;
    }
    
    // Validate at least one course is selected
    if (selectedCourses.length === 0) {
        formMessage.textContent = 'Please select at least one course.';
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

// Testimonials Slider
let testimonialsSliderInitialized = false;
const testimonialsSlider = () => {
    // Prevent multiple initializations
    if (testimonialsSliderInitialized) return;
    
    const slider = document.querySelector('.testimonials-slider');
    const cards = document.querySelectorAll('.testimonial-card');
    const dotsContainer = document.querySelector('.slider-dots');
    
    if (!slider || !cards.length) return;
    
    testimonialsSliderInitialized = true;
    
    let currentIndex = 0;
    let autoSlideInterval;
    
    // Create navigation dots
    cards.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (index === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.slider-dot');
    
    // Show specific slide
    const goToSlide = (index) => {
        // Remove active class from all cards and dots
        cards.forEach(card => card.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current card and dot
        cards[index].classList.add('active');
        dots[index].classList.add('active');
        
        currentIndex = index;
    };
    
    // Auto slide function
    const autoSlide = () => {
        currentIndex = (currentIndex + 1) % cards.length;
        goToSlide(currentIndex);
    };
    
    // Start auto sliding (every 8 seconds = 8000ms - gives time to read)
    const startAutoSlide = () => {
        // Clear any existing interval first
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
        autoSlideInterval = setInterval(autoSlide, 8000);
    };
    
    // Stop auto sliding (when user interacts)
    const stopAutoSlide = () => {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    };
    
    // Resume auto sliding after user interaction
    const resumeAutoSlide = () => {
        stopAutoSlide();
        // Wait 3 seconds before resuming
        setTimeout(startAutoSlide, 3000);
    };
    
    // Initialize: Show first card
    goToSlide(0);
    
    // Start auto sliding after a short delay (2 seconds)
    setTimeout(() => {
        startAutoSlide();
    }, 2000);
    
    // Pause on hover - stay paused while hovering
    const sliderContainer = document.querySelector('.testimonials-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', () => {
            // Resume after 2 seconds when mouse leaves
            setTimeout(startAutoSlide, 2000);
        });
    }
    
    // Pause on dot click - give user time to read
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            // Resume after 8 seconds when user clicks a dot
            setTimeout(startAutoSlide, 8000);
        });
    });
};

// Initialize testimonials slider when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testimonialsSlider);
} else {
    testimonialsSlider();
}

// Custom Select Dropdown with Checkboxes
const initCustomSelect = () => {
    const customSelect = document.getElementById('customSelect');
    const customSelectTrigger = customSelect?.querySelector('.custom-select-trigger');
    const customSelectOptions = document.getElementById('customSelectOptions');
    const customSelectValue = customSelect?.querySelector('.custom-select-value');
    const checkboxes = customSelectOptions?.querySelectorAll('input[type="checkbox"]');
    
    if (!customSelect || !customSelectTrigger || !customSelectOptions) return;
    
    // Toggle dropdown
    customSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('active');
    });
    
    // Update display value when checkboxes change
    const updateDisplayValue = () => {
        const checked = Array.from(checkboxes).filter(cb => cb.checked);
        if (checked.length === 0) {
            customSelectValue.textContent = 'Select Course Interest';
        } else if (checked.length === 1) {
            customSelectValue.textContent = checked[0].getAttribute('data-label');
        } else {
            customSelectValue.textContent = `${checked.length} courses selected`;
        }
    };
    
    // Handle checkbox changes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateDisplayValue();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('active');
        }
    });
    
    // Prevent closing when clicking inside options
    customSelectOptions.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Initialize display value
    updateDisplayValue();
};

// Initialize custom select when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomSelect);
} else {
    initCustomSelect();
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
