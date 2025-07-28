// Enhanced newsletter system with advanced features
const advancedNewsletter = {
    init() {
        this.bindEvents();
        this.initExitIntent();
        this.initScrollTrigger();
        this.loadSubscriberCount();
        this.initAnalytics();
        console.log('📧 Advanced newsletter system initialized');
    },

    bindEvents() {
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('newsletter-form')) {
                e.preventDefault();
                this.handleSubmit(e.target);
            }
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.focusNewsletterInput();
            }
        });
    },

    // Exit intent popup
    initExitIntent() {
        let hasShown = false;
        document.addEventListener('mouseout', (e) => {
            if (!hasShown && e.clientY <= 0) {
                this.showExitIntentPopup();
                hasShown = true;
            }
        });
    },

    // Show newsletter after scrolling 60%
    initScrollTrigger() {
        let hasShown = false;
        window.addEventListener('scroll', () => {
            if (hasShown) return;
            
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > 60) {
                this.highlightNewsletterSection();
                hasShown = true;
            }
        });
    },

    async handleSubmit(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const firstName = formData.get('firstName') || '';
        
        const button = form.querySelector('.newsletter-button');
        const successMsg = form.querySelector('.newsletter-success');
        const errorMsg = form.querySelector('.newsletter-error');

        if (!this.isValidEmail(email)) {
            this.showError(errorMsg, 'Please enter a valid email address.');
            this.trackEvent('newsletter_error', { error_type: 'invalid_email' });
            return;
        }

        this.setLoading(button, true);
        this.hideMessages(successMsg, errorMsg);

        try {
            // Add retry logic
            const result = await this.submitWithRetry({
                email,
                firstName,
                source: this.getSourceData()
            });

            if (result.success) {
                this.showSuccess(successMsg, result.message);
                form.reset();
                this.trackConversion(email);
                this.updateSubscriberCount();
                this.showThankYouAnimation();
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Newsletter error:', error);
            this.showError(errorMsg, error.message || 'Something went wrong. Please try again.');
            this.trackEvent('newsletter_error', { error_message: error.message });
        } finally {
            this.setLoading(button, false);
        }
    },

    async submitWithRetry(data, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch('/.netlify/functions/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (response.ok) {
                    return result;
                } else if (i === maxRetries - 1) {
                    throw new Error(result.error);
                }
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    },

    getSourceData() {
        return {
            page: window.location.pathname,
            referrer: document.referrer,
            utm_source: new URLSearchParams(window.location.search).get('utm_source'),
            utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            timestamp: new Date().toISOString()
        };
    },

    showExitIntentPopup() {
        const popup = document.createElement('div');
        popup.className = 'exit-intent-popup';
        popup.innerHTML = `
            <div class="popup-overlay">
                <div class="popup-content">
                    <button class="popup-close" onclick="this.closest('.exit-intent-popup').remove()">×</button>
                    <h3>Wait! Don't miss out 📧</h3>
                    <p>Join 2,500+ readers getting weekly tips on fitness, productivity, and saving money.</p>
                    <form class="newsletter-form popup-form">
                        <input type="email" name="email" placeholder="Enter your email" required />
                        <button type="submit">Get Free Tips</button>
                    </form>
                    <p class="popup-disclaimer">No spam. Unsubscribe anytime.</p>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, 30000);
    },

    highlightNewsletterSection() {
        const newsletters = document.querySelectorAll('.newsletter-section');
        newsletters.forEach(section => {
            section.style.animation = 'pulse 2s ease-in-out';
            section.style.border = '2px solid var(--accent)';
            setTimeout(() => {
                section.style.animation = '';
                section.style.border = '';
            }, 3000);
        });
    },

    async loadSubscriberCount() {
        try {
            // You can implement this to show real subscriber counts
            const count = localStorage.getItem('newsletter_subscriber_count') || '2500';
            document.querySelectorAll('.subscriber-count').forEach(el => {
                el.textContent = this.formatNumber(parseInt(count));
            });
        } catch (error) {
            console.log('Could not load subscriber count');
        }
    },

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    },

    updateSubscriberCount() {
        const current = parseInt(localStorage.getItem('newsletter_subscriber_count') || '2500');
        localStorage.setItem('newsletter_subscriber_count', (current + 1).toString());
        this.loadSubscriberCount();
    },

    showThankYouAnimation() {
        const celebration = document.createElement('div');
        celebration.innerHTML = '🎉 Welcome aboard! 🎉';
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--success);
            color: white;
            padding: 20px 40px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            animation: celebrationPop 3s ease-out forwards;
        `;
        
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 3000);
    },

    focusNewsletterInput() {
        const input = document.querySelector('.newsletter-input');
        if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    // Analytics & Tracking
    initAnalytics() {
        // Track newsletter form views
        const newsletters = document.querySelectorAll('.newsletter-section');
        newsletters.forEach((section, index) => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.trackEvent('newsletter_view', { 
                            section_index: index,
                            page: window.location.pathname 
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(section);
        });
    },

    trackEvent(eventName, properties = {}) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        
        // You can add other analytics services here
        console.log(`📊 Event tracked: ${eventName}`, properties);
    },

    trackConversion(email) {
        this.trackEvent('newsletter_subscribe', {
            method: 'website_form',
            value: 1,
            currency: 'USD'
        });
        
        // Facebook Pixel (if you use it)
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Subscribe');
        }
        
        console.log('🎯 Newsletter conversion tracked');
    },

    // Utility methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length < 255 && email.length > 5;
    },

    setLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '⏳ Subscribing...';
            button.style.opacity = '0.8';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || 'Subscribe';
            button.style.opacity = '1';
        }
    },

    showSuccess(successMsg, message) {
        successMsg.innerHTML = `🎉 ${message || 'Welcome to our newsletter!'}`;
        successMsg.style.display = 'block';
        this.styleMessage(successMsg, 'success');
    },

    showError(errorMsg, message) {
        errorMsg.innerHTML = `❌ ${message}`;
        errorMsg.style.display = 'block';
        this.styleMessage(errorMsg, 'error');
    },

    styleMessage(element, type) {
        const isSuccess = type === 'success';
        element.style.color = isSuccess ? '#22c55e' : '#ef4444';
        element.style.fontWeight = '600';
        element.style.background = isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        element.style.border = `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`;
        element.style.padding = '12px';
        element.style.borderRadius = '8px';
        element.style.marginTop = '12px';
    },

    hideMessages(successMsg, errorMsg) {
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';
    }
};

// Add CSS for animations
const newsletterCSS = `
@keyframes celebrationPop {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    10% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
    20% { transform: translate(-50%, -50%) scale(1); }
    90% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
}

.exit-intent-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
}

.popup-overlay {
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
}

.popup-content {
    background: var(--bg-modal);
    padding: 40px;
    border-radius: 16px;
    max-width: 500px;
    margin: 20px;
    position: relative;
    text-align: center;
}

.popup-close {
    position: absolute;
    top: 15px;
    right: 20px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
}

.popup-form {
    margin: 20px 0;
}

.popup-form input {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-card);
    color: var(--text-primary);
}

.popup-form button {
    width: 100%;
    padding: 12px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.popup-disclaimer {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 10px;
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = newsletterCSS;
document.head.appendChild(style);

// Replace your existing newsletter object with this one
// window.newsletter = advancedNewsletter;