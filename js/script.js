
        // Reading progress bar
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            document.getElementById('progress-bar').style.width = scrolled + '%';
        });

        function showPage(pageId) {
            // Hide all pages
            const pages = document.querySelectorAll('.page-content');
            pages.forEach(page => page.classList.remove('active'));
            
            // Show selected page
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
        function showPrivacyPolicy() {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show privacy policy page
    const privacyPage = document.getElementById('privacy-policy');
    if (privacyPage) {
        privacyPage.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function showAffiliateDisclaimer() {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show affiliate disclaimer page
    const disclaimerPage = document.getElementById('affiliate-disclaimer');
    if (disclaimerPage) {
        disclaimerPage.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function showTermsOfService() {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show terms page
    const termsPage = document.getElementById('terms-of-service');
    if (termsPage) {
        termsPage.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

        function showTopDeals() {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show top deals page
    const topDealsPage = document.getElementById('top-deals');
    if (topDealsPage) {
        topDealsPage.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

        function showLegal(type) {
            // Hide all pages
            const pages = document.querySelectorAll('.page-content');
            pages.forEach(page => page.classList.remove('active'));
            
            // Create or show legal page
            let legalPage = document.getElementById('legal-page');
            if (!legalPage) {
                legalPage = document.createElement('div');
                legalPage.id = 'legal-page';
                legalPage.className = 'page-content';
                document.body.appendChild(legalPage);
            }
            
            let content = '';
            let title = '';
            switch(type) {
                case 'privacy':
                    title = 'Privacy Policy';
                    content = `
                        <h2>Information We Collect</h2>
                        <p>We collect information you provide directly to us, such as when you subscribe to our newsletter or contact us.</p>
                        <h2>How We Use Your Information</h2>
                        <p>We use the information we collect to provide, maintain, and improve our services, including sending you newsletters and product recommendations.</p>
                        <h2>Information Sharing</h2>
                        <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
                    `;
                    break;
                case 'disclaimer':
                    title = 'Affiliate Disclaimer';
                    content = `
                        <h2>Affiliate Relationships</h2>
                        <p>TopPicksOnline participates in various affiliate marketing programs, which means we may earn commissions from qualifying purchases made through our links.</p>
                        <h2>Amazon Associate</h2>
                        <p>As an Amazon Associate, we earn from qualifying purchases. This does not affect the price you pay for products.</p>
                        <h2>Product Recommendations</h2>
                        <p>Our product recommendations are based on thorough research and testing. While we may earn commissions, this does not influence our honest reviews and recommendations.</p>
                    `;
                    break;
                case 'terms':
                    title = 'Terms of Service';
                    content = `
                        <h2>Acceptance of Terms</h2>
                        <p>By accessing and using TopPicksOnline, you accept and agree to be bound by the terms and provision of this agreement.</p>
                        <h2>Use License</h2>
                        <p>Permission is granted to temporarily view the materials on TopPicksOnline for personal, non-commercial transitory viewing only.</p>
                        <h2>Disclaimer</h2>
                        <p>The materials on TopPicksOnline are provided on an 'as is' basis. TopPicksOnline makes no warranties, expressed or implied.</p>
                    `;
                    break;
            }
            
            legalPage.innerHTML = `
                <div class="page-header">
                    <div class="page-header-content">
                        <h1>${title}</h1>
                    </div>
                </div>
                <div class="page-content-body">
                    <div class="content-container">
                        <p><em>Last updated: June 17, 2025</em></p>
                        ${content}
                    </div>
                </div>
            `;
            
            legalPage.classList.add('active');
            window.scrollTo(0, 0);
        }

        function handleAffiliateDeal(productId) {
            // In a real implementation, this would redirect to the affiliate link
            alert(`Redirecting to affiliate partner for ${productId}. In a real implementation, this would take you to the product page with our affiliate tracking.`);
        }

        function handleNewsletterSignup(event) {
            event.preventDefault();
            const email = event.target.querySelector('input[type="email"]').value;
            alert(`Thank you for subscribing with ${email}! You'll receive our latest deals and product recommendations.`);
            event.target.reset();
        }

        function handleContactForm(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            alert(`Thank you ${name}! Your message has been sent. We'll get back to you at ${email} within 24 hours.`);
            event.target.reset();
        }

        // Initialize animations when page loads
        document.addEventListener('DOMContentLoaded', function() {
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
 