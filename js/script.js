/* ===========================
   TOPICKSONLINE - COMPLETE UPDATED JAVASCRIPT
   Version 2.0 - Enhanced Navigation & History Management
   =========================== */

// Global variables for state management
let currentPage = 'home';
let isNavigating = false;

/* ===========================
   CORE NAVIGATION SYSTEM
   =========================== */

/**
 * Main navigation function with browser history support
 * @param {string} pageId - The ID of the page to show
 * @param {boolean} updateHistory - Whether to update browser history (default: true)
 */
function showPage(pageId, updateHistory = true) {
    if (isNavigating) return; // Prevent rapid navigation
    
    isNavigating = true;
    
    // Validate page exists
    const targetPage = document.getElementById(pageId);
    if (!targetPage) {
        console.warn(`Page "${pageId}" not found, defaulting to home`);
        pageId = 'home';
    }
    
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Show target page
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
        pageToShow.style.display = 'block';
    }
    
    // Update browser history and URL
    if (updateHistory) {
        const cleanPath = pageId === 'home' ? '/' : `/${pageId}`;
        const currentPath = window.location.pathname;
        
        // Only push to history if it's different from current URL
        if (currentPath !== cleanPath) {
            const pageTitle = getPageTitle(pageId);
            window.history.pushState(
                { page: pageId, timestamp: Date.now() }, 
                pageTitle, 
                cleanPath
            );
            
            // Update document title
            document.title = pageTitle;
        }
    }
    
    // Update current page state
    currentPage = pageId;
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Re-initialize animations for the new page
    setTimeout(() => {
        initializePageAnimations();
        isNavigating = false;
    }, 100);
    
    // Track page view for analytics
    trackPageView(pageId);
}

/**
 * Show page without updating browser history (for back/forward navigation)
 * @param {string} pageId - The ID of the page to show
 */
function showPageWithoutHistory(pageId) {
    showPage(pageId, false);
}

/**
 * Get proper page title for document title and history
 * @param {string} pageId - The page ID
 * @returns {string} - The formatted page title
 */
function getPageTitle(pageId) {
    const titles = {
        'home': 'TopPicksOnline - Your Trusted Guide to the Best Products Worldwide!',
        'categories': 'All Categories - TopPicksOnline',
        'health-fitness': 'Health & Fitness - TopPicksOnline',
        'beauty': 'Beauty & Personal Care - TopPicksOnline',
        'tech': 'Tech & Gadgets - TopPicksOnline',
        'learning': 'Online Learning - TopPicksOnline',
        'home-lifestyle': 'Home & Lifestyle - TopPicksOnline',
        'digital': 'Digital Products & Services - TopPicksOnline',
        'about': 'About TopPicksOnline - Your Trusted Product Review Guide',
        'contact': 'Contact TopPicksOnline - Get in Touch with Our Product Experts',
        'blog': 'Blog - TopPicksOnline Product Reviews & Guides',
        'top-deals': 'Top Deals This Month - TopPicksOnline',
        'privacy-policy': 'Privacy Policy - TopPicksOnline',
        'affiliate-disclaimer': 'Affiliate Disclaimer - TopPicksOnline',
        'terms-of-service': 'Terms of Service - TopPicksOnline'
    };
    
    return titles[pageId] || 'TopPicksOnline - Best Products & Deals';
}

/* ===========================
   BROWSER HISTORY MANAGEMENT
   =========================== */

/**
 * Handle browser back/forward button clicks
 */
window.addEventListener('popstate', function(event) {
    if (isNavigating) return;
    
    let pageId = 'home';
    
    if (event.state && event.state.page) {
        // User clicked back/forward and we have saved state
        pageId = event.state.page;
    } else {
        // Handle direct URL access or no state
        pageId = getPageIdFromURL();
    }
    
    showPageWithoutHistory(pageId);
});

/**
 * Get page ID from current URL
 * @returns {string} - The page ID extracted from URL
 */
function getPageIdFromURL() {
    const path = window.location.pathname;
    
    if (path === '/' || path === '/index.html' || path === '') {
        return 'home';
    } else if (path.startsWith('/')) {
        const urlPageId = path.substring(1); // Remove leading slash
        
        // Validate that the page exists
        if (document.getElementById(urlPageId)) {
            return urlPageId;
        }
    }
    
    return 'home'; // Default fallback
}

/**
 * Initialize page based on URL when site loads
 */
function initializePage() {
    const pageId = getPageIdFromURL();
    
    // Show the appropriate page without adding to history
    showPageWithoutHistory(pageId);
    
    // Set initial history state
    const pageTitle = getPageTitle(pageId);
    const cleanPath = pageId === 'home' ? '/' : `/${pageId}`;
    
    window.history.replaceState(
        { page: pageId, timestamp: Date.now() }, 
        pageTitle, 
        cleanPath
    );
    
    document.title = pageTitle;
}

/* ===========================
   SPECIFIC PAGE NAVIGATION FUNCTIONS
   =========================== */

function showPrivacyPolicy() {
    showPage('privacy-policy');
}

function showAffiliateDisclaimer() {
    showPage('affiliate-disclaimer');
}

function showTermsOfService() {
    showPage('terms-of-service');
}

function showTopDeals() {
    showPage('top-deals');
}

function showLegal(type) {
    const pageMap = {
        'privacy': 'privacy-policy',
        'disclaimer': 'affiliate-disclaimer',
        'terms': 'terms-of-service'
    };
    
    const pageId = pageMap[type] || 'privacy-policy';
    showPage(pageId);
}

/* ===========================
   AFFILIATE DEAL HANDLERS
   =========================== */

/**
 * Handle general affiliate deal clicks
 * @param {string} productId - The product identifier
 */
function handleAffiliateDeal(productId) {
    // Track the click
    trackEvent('affiliate_click', {
        product_id: productId,
        page: currentPage
    });
    
    // In a real implementation, this would redirect to the actual affiliate link
    // For now, show a placeholder message
    alert(`Redirecting to affiliate partner for ${productId}. In a real implementation, this would take you to the product page with our affiliate tracking.`);
    
    // Example of how you would implement real affiliate redirects:
    // const affiliateLinks = {
    //     'protein-powder': 'https://affiliate-link-1.com',
    //     'fitness-tracker': 'https://affiliate-link-2.com',
    //     // ... more links
    // };
    // 
    // if (affiliateLinks[productId]) {
    //     window.open(affiliateLinks[productId], '_blank');
    // }
}

/**
 * Handle Wealth Nesting specific affiliate deal
 */
function handleWealthNestingDeal() {
    // Track the click with specific label
    trackEvent('affiliate_click', {
        product_id: 'wealth_nesting',
        page: currentPage,
        campaign: 'digital_vending_machines'
    });
    
    // Replace this URL with your actual Wealth Nesting affiliate link
    const wealthNestingLink = 'YOUR_WEALTH_NESTING_AFFILIATE_LINK_HERE';
    
    if (wealthNestingLink !== 'YOUR_WEALTH_NESTING_AFFILIATE_LINK_HERE') {
        window.open(wealthNestingLink, '_blank');
    } else {
        alert('Please update the Wealth Nesting affiliate link in the JavaScript file.');
    }
}

/**
 * Handle blog post clicks
 * @param {string} postId - The blog post identifier
 */
function handleBlogPost(postId) {
    trackEvent('blog_click', {
        post_id: postId,
        page: currentPage
    });
    
    alert(`Blog post "${postId}" would open here. Implement your blog system or redirect to external blog.`);
}

/* ===========================
   FORM HANDLERS
   =========================== */

/**
 * Handle newsletter signup form submission
 * @param {Event} event - The form submission event
 */
function handleNewsletterSignup(event) {
    event.preventDefault();
    
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value : '';
    
    if (!email) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Track signup
    trackEvent('newsletter_signup', {
        email: email,
        page: currentPage
    });
    
    // Show success message
    alert(`Thank you for subscribing with ${email}! You'll receive our latest deals and product recommendations.`);
    
    // Reset form
    form.reset();
    
    // In a real implementation, you would send this to your email service:
    // sendToEmailService(email);
}

/**
 * Handle contact form submission
 * @param {Event} event - The form submission event
 */
function handleContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Validate required fields
    if (!name || !email || !message) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Track contact form submission
    trackEvent('contact_form_submit', {
        page: currentPage
    });
    
    // Show success message
    alert(`Thank you ${name}! Your message has been sent. We'll get back to you at ${email} within 24 hours.`);
    
    // Reset form
    form.reset();
    
    // In a real implementation, you would send this to your backend:
    // sendContactForm({ name, email, message });
}

/* ===========================
   ANIMATION SYSTEM
   =========================== */

/**
 * Initialize animations for page elements
 */
function initializePageAnimations() {
    // Clear any existing observers
    if (window.animationObserver) {
        window.animationObserver.disconnect();
    }
    
    // Set up intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    window.animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Find and animate elements on current page
    const currentPageElement = document.querySelector('.page-content.active');
    if (currentPageElement) {
        const animatableElements = currentPageElement.querySelectorAll('.category-card, .product-card, .legal-section');
        
        animatableElements.forEach((el, index) => {
            // Reset animation state
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            el.style.transitionDelay = `${index * 0.1}s`;
            
            // Observe for animation
            window.animationObserver.observe(el);
        });
    }
}

/* ===========================
   READING PROGRESS BAR
   =========================== */

/**
 * Update reading progress bar based on scroll position
 */
function updateReadingProgress() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    if (height <= 0) {
        progressBar.style.width = '0%';
        return;
    }
    
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + '%';
}

// Throttled scroll handler for better performance
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(updateReadingProgress, 10);
});

/* ===========================
   ANALYTICS & TRACKING
   =========================== */

/**
 * Track page views for analytics
 * @param {string} pageId - The page being viewed
 */
function trackPageView(pageId) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('config', 'G-CTYVD72Y6N', {
            page_title: getPageTitle(pageId),
            page_location: window.location.href
        });
    }
    
    // Custom analytics tracking
    console.log(`Page view: ${pageId}`);
}

/**
 * Track custom events for analytics
 * @param {string} eventName - The event name
 * @param {Object} eventData - Additional event data
 */
function trackEvent(eventName, eventData = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            event_category: eventData.category || 'engagement',
            event_label: eventData.label || eventData.product_id || '',
            page: eventData.page || currentPage,
            ...eventData
        });
    }
    
    // Custom analytics tracking
    console.log(`Event: ${eventName}`, eventData);
}

/* ===========================
   UTILITY FUNCTIONS
   =========================== */

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Smooth scroll to element
 * @param {string} elementId - The ID of the element to scroll to
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} - True if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ===========================
   MOBILE NAVIGATION
   =========================== */

/**
 * Initialize mobile navigation (if needed)
 */
function initializeMobileNav() {
    // Add mobile menu toggle functionality here if needed
    // For now, the CSS handles mobile navigation by hiding the menu
    
    // Example mobile menu implementation:
    // const mobileMenuButton = document.getElementById('mobile-menu-button');
    // const navMenu = document.querySelector('.nav-menu');
    // 
    // if (mobileMenuButton && navMenu) {
    //     mobileMenuButton.addEventListener('click', () => {
    //         navMenu.classList.toggle('mobile-open');
    //     });
    // }
}

/* ===========================
   ERROR HANDLING
   =========================== */

/**
 * Global error handler
 */
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    
    // Track error for analytics
    trackEvent('javascript_error', {
        error_message: event.error ? event.error.message : 'Unknown error',
        page: currentPage
    });
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Track error for analytics
    trackEvent('promise_rejection', {
        error_message: event.reason ? event.reason.toString() : 'Unknown promise rejection',
        page: currentPage
    });
});

/* ===========================
   INITIALIZATION
   =========================== */

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('TopPicksOnline JavaScript initialized');
    
    // Initialize page based on current URL
    initializePage();
    
    // Initialize mobile navigation
    initializeMobileNav();
    
    // Initialize animations
    setTimeout(initializePageAnimations, 100);
    
    // Initialize reading progress
    updateReadingProgress();
    
    // Set up smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            if (targetId) {
                scrollToElement(targetId);
            }
        });
    });
    
    // Add click handlers for navigation elements
    document.querySelectorAll('[onclick]').forEach(element => {
        const onclickValue = element.getAttribute('onclick');
        
        // Replace onclick attributes with proper event listeners for better performance
        if (onclickValue.includes('showPage')) {
            element.removeAttribute('onclick');
            
            // Extract page ID from onclick value
            const pageMatch = onclickValue.match(/showPage\('([^']+)'\)/);
            if (pageMatch) {
                const pageId = pageMatch[1];
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    showPage(pageId);
                });
            }
        }
    });
    
    console.log('Application initialization complete');
});

/* ===========================
   PERFORMANCE MONITORING
   =========================== */

/**
 * Monitor page performance
 */
window.addEventListener('load', function() {
    // Check if Performance API is available
    if ('performance' in window) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
        
        // Track performance for analytics
        trackEvent('page_performance', {
            load_time: loadTime,
            page: currentPage
        });
    }
});

/* ===========================
   ACCESSIBILITY ENHANCEMENTS
   =========================== */

/**
 * Handle keyboard navigation
 */
document.addEventListener('keydown', function(event) {
    // Handle Escape key to close modals or return to home
    if (event.key === 'Escape') {
        // Add modal closing logic here if needed
    }
    
    // Handle Enter key on clickable elements
    if (event.key === 'Enter' && event.target.hasAttribute('onclick')) {
        event.target.click();
    }
});

/**
 * Announce page changes to screen readers
 * @param {string} pageId - The page being shown
 */
function announcePageChange(pageId) {
    const announcement = `Navigated to ${getPageTitle(pageId)}`;
    
    // Create or update announcement element for screen readers
    let announcer = document.getElementById('page-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'page-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);
    }
    
    announcer.textContent = announcement;
}

/* ===========================
   EXPORT FOR TESTING (if needed)
   =========================== */

// Export functions for testing in development
if (typeof window !== 'undefined') {
    window.TopPicksOnline = {
        showPage,
        getPageIdFromURL,
        trackEvent,
        currentPage: () => currentPage
    };
}

console.log('TopPicksOnline JavaScript loaded successfully');