/**
 * Memories category tabs + Instagram embed processing for the active gallery.
 */
let categoryButtons;
let memoryGalleries;

function initMemoryGallerySelectors() {
    categoryButtons = document.querySelectorAll('.category-btn');
    memoryGalleries = document.querySelectorAll('.memory-gallery');
}

function setupCategorySwitching() {
    if (!categoryButtons || !memoryGalleries) return;

    categoryButtons.forEach((button) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', () => {
            const targetCategory = newButton.getAttribute('data-category');
            document.querySelectorAll('.category-btn').forEach((btn) => btn.classList.remove('active'));
            memoryGalleries.forEach((gallery) => gallery.classList.remove('active'));
            newButton.classList.add('active');
            const targetGallery = document.getElementById(targetCategory);
            if (targetGallery) {
                targetGallery.classList.add('active');
                if (window.instgrm && window.instgrm.Embeds) {
                    setTimeout(() => window.instgrm.Embeds.process(), 100);
                }
            }
        });
    });
}

export function initMemoryGallery() {
    initMemoryGallerySelectors();

    if (!categoryButtons || !memoryGalleries || categoryButtons.length === 0 || memoryGalleries.length === 0) {
        return;
    }

    let activeButton = Array.from(categoryButtons).find((btn) => btn.classList.contains('active'));
    let activeGallery = Array.from(memoryGalleries).find((gallery) => gallery.classList.contains('active'));

    if (!activeButton && categoryButtons.length > 0) {
        activeButton = categoryButtons[0];
        activeButton.classList.add('active');
    }

    if (!activeGallery && memoryGalleries.length > 0) {
        if (activeButton) {
            const targetCategory = activeButton.getAttribute('data-category');
            activeGallery = document.getElementById(targetCategory);
        }
        if (!activeGallery) activeGallery = memoryGalleries[0];
        memoryGalleries.forEach((gallery) => gallery.classList.remove('active'));
        if (activeGallery) activeGallery.classList.add('active');
    }

    memoryGalleries.forEach((gallery) => {
        if (!gallery.classList.contains('active')) gallery.classList.remove('active');
    });

    setupCategorySwitching();
}

function loadActiveGalleryEmbeds() {
    if (!memoryGalleries || !window.instgrm || !window.instgrm.Embeds) return;
    const activeGallery = Array.from(memoryGalleries).find((gallery) =>
        gallery.classList.contains('active')
    );
    if (activeGallery) {
        const activeEmbeds = activeGallery.querySelectorAll('.instagram-media');
        if (activeEmbeds.length > 0) window.instgrm.Embeds.process();
    }
}

/** Call after DOM; retries help when embed.js loads late */
export function initInstagramEmbedsRetries() {
    const run = () => {
        setTimeout(loadActiveGalleryEmbeds, 500);
        setTimeout(loadActiveGalleryEmbeds, 1000);
        setTimeout(loadActiveGalleryEmbeds, 2000);
    };
    if (window.instgrm) run();
    else window.addEventListener('load', run);
}
