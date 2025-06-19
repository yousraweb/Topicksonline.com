// ===========================
// TOPICKSONLINE - COMPLETE JAVASCRIPT
// ===========================

// Reading progress bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progress-bar').style.width = scrolled + '%';
});

// Main page navigation function with clean URLs
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update URL with clean path
    const cleanPath = pageId === 'home' ? '/' : `/${pageId}`;
    window.history.pushState({page: pageId}, '', cleanPath);
    
    // Update page title
    updatePageTitle(pageId);
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Privacy Policy page
function showPrivacyPolicy() {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    const privacyPage = document.getElementById('privacy-policy');
    if (privacyPage) {
        privacyPage.classList.add('active');
    }
    
    window.history.pushState({page: 'privacy-policy'}, '', '/privacy-policy');
    updatePageTitle('privacy-policy');
    window.scrollTo(0, 0);
}

// Affiliate Disclaimer page
function showAffiliateDisclaimer() {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    const disclaimerPage = document.getElementById('affiliate-disclaimer');
    if (disclaimerPage) {
        disclaimerPage.classList.add('active');
    }
    
    window.history.pushState({page: 'affiliate-disclaimer'}, '', '/affiliate-disclaimer');
    updatePageTitle('affiliate-disclaimer');
    window.scrollTo(0, 0);
}

// Terms of Service page
function showTermsOfService() {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    const termsPage = document.getElementById('terms-of-service');
    if (termsPage) {
        termsPage.classList.add('active');
    }
    
    window.history.pushState({page: 'terms-of-service'}, '', '/terms-of-service');
    updatePageTitle('terms-of-service');
    window.scrollTo(0, 0);
}

// Top Deals page
function showTopDeals() {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    const topDealsPage = document.getElementById('top-deals');
    if (topDealsPage) {
        topDealsPage.classList.add('active');
    }
    
    window.history.pushState({page: 'top-deals'}, '', '/top-deals');
    updatePageTitle('top-deals');
    window.scrollTo(0, 0);
}

// Update page title based on current page
function updatePageTitle(pageId) {
    const titles = {
        'home': 'TopPicksOnline - Your Trusted Guide to the Best Products Worldwide!',
        'about': 'About Us - TopPicksOnline',
        'contact': 'Contact Us - TopPicksOnline',
        'categories': 'All Categories - TopPicksOnline',
        'health-fitness': 'Health & Fitness Products - TopPicksOnline',
        'beauty': 'Beauty & Personal Care - TopPicksOnline',
        'tech': 'Tech & Gadgets - TopPicksOnline',
        'learning': 'Online Learning - TopPicksOnline',
        'home-lifestyle': 'Home & Lifestyle - TopPicksOnline',
        'blog': 'Product Reviews & Buying Guides - TopPicksOnline',
        'top-deals': 'Top Deals This Month - TopPicksOnline',
        'privacy-policy': 'Privacy Policy - TopPicksOnline',
        'affiliate-disclaimer': 'Affiliate Disclaimer - TopPicksOnline',
        'terms-of-service': 'Terms of Service - TopPicksOnline'
    };
    
    document.title = titles[pageId] || 'TopPicksOnline';
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page) {
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(page => page.classList.remove('active'));
        
        const targetPage = document.getElementById(event.state.page);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        updatePageTitle(event.state.page);
    } else {
        // Default to home page
        showPage('home');
    }
});

// Handle affiliate deal clicks
function handleAffiliateDeal(productId) {
    // In a real implementation, this would redirect to the affiliate link
    alert(`Redirecting to affiliate partner for ${productId}. In a real implementation, this would take you to the product page with our affiliate tracking.`);
}

// Handle newsletter signup
function handleNewsletterSignup(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    alert(`Thank you for subscribing with ${email}! You'll receive our latest deals and product recommendations.`);
    event.target.reset();
}

// Handle contact form submission
function handleContactForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    alert(`Thank you ${name}! Your message has been sent. We'll get back to you at ${email} within 24 hours.`);
    event.target.reset();
}

// Initialize page based on current URL when page loads
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    let pageId = 'home';
    
    // Map URLs to page IDs
    const urlMap = {
        '/': 'home',
        '/about': 'about',
        '/contact': 'contact',
        '/categories': 'categories',
        '/health-fitness': 'health-fitness',
        '/beauty': 'beauty',
        '/tech': 'tech',
        '/learning': 'learning',
        '/home-lifestyle': 'home-lifestyle',
        '/blog': 'blog',
        '/top-deals': 'top-deals',
        '/privacy-policy': 'privacy-policy',
        '/affiliate-disclaimer': 'affiliate-disclaimer',
        '/terms-of-service': 'terms-of-service'
    };
    
    if (urlMap[path]) {
        pageId = urlMap[path];
    }
    
    // Show the correct page without adding to history
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    updatePageTitle(pageId);
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.category-card, .product-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
});
 