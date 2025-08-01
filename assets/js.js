// Cache for common data
const cache = {
    navigation: null,
    footer: null,
    categories: null,
    searchIndex: null,
    currentArticles: []
};

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const createElement = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.assign(el, props);
    children.forEach(child => {
        if (typeof child === 'string') {
            el.innerHTML += child;
        } else if (child) {
            el.appendChild(child);
        }
    });
    return el;
};

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Fetch functions
async function fetchJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${path}:`, error);
        return null;
    }
}

async function fetchCommonData() {
    if (!cache.navigation || !cache.footer || !cache.categories) {
        const [navData, footerData, categoriesData] = await Promise.all([
            fetchJSON('/assets/data/common/navigation.json'),
            fetchJSON('/assets/data/common/footer.json'),
            fetchJSON('/assets/data/pages/categories/categories.json')
        ]);
        
        Object.assign(cache, {
            navigation: navData,
            footer: footerData,
            categories: categoriesData
        });
    }
    return cache;
}

// Theme Management
const theme = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateIcon(savedTheme);
    },
    
    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateIcon(newTheme);
    },
    
    updateIcon(theme) {
        const toggle = $('.theme-toggle');
        if (toggle) toggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
};
window.toggleTheme = theme.toggle.bind(theme);

// Loading State
const showLoading = () => {
    $('#main-content').innerHTML = '<div class="loading">Loading...</div>';
};

// HERO SLIDER CLASS
class HeroSlider {
    constructor(container, slides, options = {}) {
        this.container = container;
        this.slides = slides;
        this.currentSlide = 0;
        this.isPlaying = true;
        this.options = {
            autoPlayInterval: 5000,
            transitionDuration: 600,
            ...options
        };
        
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
        this.startAutoPlay();
    }
    
    render() {
        const dotsHTML = this.slides.map((_, index) => 
            `<div class="slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
        ).join('');
        
        const slidesHTML = this.slides.map((slide, index) => `
            <div class="slide" data-slide="${index}">
                <div class="slide-overlay"></div>
                <div class="slide-content">
                    <span class="slide-category">${slide.category}</span>
                    <h2 class="slide-title">${slide.title}</h2>
                    <p class="slide-description">${slide.description}</p>
                    <div class="slide-meta">
                        <span>By ${slide.author}</span>
                        <span>•</span>
                        <span>${slide.readTime || slide.date}</span>
                    </div>
                    <a href="/articles/${slide.id.replace('articles/', '')}" class="slide-cta">
                        Read Article →
                    </a>
                </div>
                <div class="slide-image">
                    ${slide.image ? `<img src="${slide.image}" alt="${slide.title}" loading="lazy" />` : ''}
                </div>
            </div>
        `).join('');
        
        this.container.innerHTML = `
            <div class="slider-container">
                <div class="slider-wrapper">
                    ${slidesHTML}
                </div>
                
                <button class="slider-nav prev" onclick="heroSlider.prevSlide()">‹</button>
                <button class="slider-nav next" onclick="heroSlider.nextSlide()">›</button>
                
                <div class="slider-dots">
                    ${dotsHTML}
                </div>
                
                <div class="slider-progress"></div>
            </div>
        `;
        
        this.wrapper = this.container.querySelector('.slider-wrapper');
        this.dots = this.container.querySelectorAll('.slider-dot');
        this.progress = this.container.querySelector('.slider-progress');
    }
    
    bindEvents() {
        // Dot navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Touch/swipe support
        let startX = 0;
        let endX = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        this.container.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });
        
        // Pause on hover
        this.container.addEventListener('mouseenter', () => {
            this.pauseAutoPlay();
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.startAutoPlay();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
            if (e.key === ' ') {
                e.preventDefault();
                this.toggleAutoPlay();
            }
        });
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlider();
        this.resetAutoPlay();
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlider();
        this.resetAutoPlay();
    }
    
    prevSlide() {
        this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
        this.updateSlider();
        this.resetAutoPlay();
    }
    
    updateSlider() {
        const translateX = -this.currentSlide * 100;
        this.wrapper.style.transform = `translateX(${translateX}%)`;
        
        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }
    
    startAutoPlay() {
        if (!this.isPlaying) return;
        
        this.autoPlayTimer = setInterval(() => {
            this.nextSlide();
        }, this.options.autoPlayInterval);
        
        // Progress bar animation
        this.progress.style.width = '0%';
        this.progress.style.transition = `width ${this.options.autoPlayInterval}ms linear`;
        
        setTimeout(() => {
            this.progress.style.width = '100%';
        }, 50);
    }
    
    pauseAutoPlay() {
        clearInterval(this.autoPlayTimer);
        this.progress.style.transition = 'none';
    }
    
    resetAutoPlay() {
        this.pauseAutoPlay();
        if (this.isPlaying) {
            this.startAutoPlay();
        }
    }
    
    toggleAutoPlay() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.startAutoPlay();
        } else {
            this.pauseAutoPlay();
        }
    }
    
    destroy() {
        clearInterval(this.autoPlayTimer);
        this.container.innerHTML = '';
    }
}

// Global slider instance
let heroSlider = null;

// PAGINATION CLASS
class Pagination {
    constructor(items, itemsPerPage = 3) {
        this.allItems = items;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalPages = Math.ceil(items.length / itemsPerPage);
    }
    
    getCurrentPageItems() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.allItems.slice(startIndex, endIndex);
    }
    
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            return true;
        }
        return false;
    }
    
    nextPage() {
        return this.goToPage(this.currentPage + 1);
    }
    
    prevPage() {
        return this.goToPage(this.currentPage - 1);
    }
    
    getPageNumbers() {
        const pages = [];
        const maxVisible = 7;
        
        if (this.totalPages <= maxVisible) {
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            if (this.currentPage > 4) {
                pages.push('...');
            }
            
            // Show current page and surrounding pages
            const start = Math.max(2, this.currentPage - 1);
            const end = Math.min(this.totalPages - 1, this.currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }
            
            if (this.currentPage < this.totalPages - 3) {
                pages.push('...');
            }
            
            // Always show last page
            if (!pages.includes(this.totalPages)) {
                pages.push(this.totalPages);
            }
        }
        
        return pages;
    }
    
    renderPagination(onPageChange) {
        if (this.totalPages <= 1) return '';
        
        const pages = this.getPageNumbers();
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.allItems.length);
        
        const pagesHTML = pages.map(page => {
            if (page === '...') {
                return '<span class="pagination-ellipsis">…</span>';
            }
            return `
                <button class="pagination-button ${page === this.currentPage ? 'active' : ''}" 
                        onclick="${onPageChange}(${page})">
                    ${page}
                </button>
            `;
        }).join('');
        
        return `
            <div class="pagination-container">
                <div class="pagination">
                    <button class="pagination-button prev ${this.currentPage === 1 ? 'disabled' : ''}" 
                            onclick="${onPageChange}(${this.currentPage - 1})" 
                            ${this.currentPage === 1 ? 'disabled' : ''}>
                        ‹
                    </button>
                    
                    ${pagesHTML}
                    
                    <button class="pagination-button next ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                            onclick="${onPageChange}(${this.currentPage + 1})"
                            ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                        ›
                    </button>
                </div>
                
                <div class="pagination-info">
                    Showing ${startItem}-${endItem} of ${this.allItems.length} articles
                </div>
            </div>
        `;
    }
}

// Global pagination instances
let categoryPagination = null;
let searchPagination = null;

// Template functions
const templates = {
    tutorialCard: (tutorial) => {
        const imageHTML = tutorial.image ? 
            `<img src="${tutorial.image}" 
                 alt="${tutorial.title}" 
                 onload="this.previousElementSibling.style.display='none'" 
                 onerror="this.previousElementSibling.style.display='none'; this.style.display='none';" />` : '';
        
        return `
            <div class="tutorial-card animate-in" onclick="navigateTo('/articles/${tutorial.id.replace('articles/', '')}')" data-category="${tutorial.category}">
                <div class="tutorial-thumbnail" style="position: relative;">
                    <div class="image-loader"></div>
                    ${imageHTML}
                </div>
                <div class="tutorial-content">
                    <span class="tutorial-category">${tutorial.category}</span>
                    <h3 class="tutorial-title">${tutorial.title}</h3>
                    <p class="tutorial-description">${tutorial.description}</p>
                    <div class="tutorial-meta">
                        <span>${tutorial.author}</span>
                        <span>${tutorial.readTime || tutorial.date || ''}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    dropdownItem: (item) => `
        <div class="dropdown-item">
            <a href="${item.link}" class="nav-link">${item.title || item.name}${item.articleCount ? ` (${item.articleCount})` : ''}</a>
        </div>
    `
};

// Newsletter Template Function
function renderNewsletterBlock(block) {
    const benefits = block.benefits || [
        { icon: "✨", text: "Weekly insights" },
        { icon: "🚫", text: "No spam, ever" },
        { icon: "✋", text: "Unsubscribe anytime" }
    ];

    const uniqueId = Math.random().toString(36).substr(2, 9);
    
    const benefitsHTML = benefits.map(benefit => `
        <div class="newsletter-benefit">
            <span class="newsletter-benefit-icon">${benefit.icon}</span>
            <span>${benefit.text}</span>
        </div>
    `).join('');

    return `
        <section class="newsletter-section" data-newsletter-id="${uniqueId}">
            <div class="newsletter-content">
                <span class="newsletter-icon">${block.icon || '📧'}</span>
                <h3 class="newsletter-title">${block.title || 'Join 2,500+ Readers'}</h3>
                <p class="newsletter-description">
                    ${block.description || 'Get weekly tips on fitness, productivity, and saving money. No spam, unsubscribe anytime.'}
                </p>
                
                <form class="newsletter-form" data-form-id="${uniqueId}">
                    <input 
                        type="email" 
                        class="newsletter-input" 
                        placeholder="${block.placeholder || 'Enter your email address'}"
                        required
                        autocomplete="email"
                    >
                    <button type="submit" class="newsletter-button" data-original-text="${block.buttonText || 'Subscribe'}">
                        ${block.buttonText || 'Subscribe'}
                    </button>
                </form>
                
                <div class="newsletter-success" id="success-${uniqueId}" style="display: none;"></div>
                <div class="newsletter-error" id="error-${uniqueId}" style="display: none;"></div>
                
                <div class="newsletter-benefits">
                    ${benefitsHTML}
                </div>
            </div>
        </section>
    `;
}

// Newsletter functionality
const newsletter = {
    init() {
        this.bindEvents();
        console.log('📧 Newsletter system initialized');
    },

    bindEvents() {
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('newsletter-form')) {
                e.preventDefault();
                this.handleSubmit(e.target);
            }
        });
    },

    async handleSubmit(form) {
        const email = form.querySelector('.newsletter-input')?.value?.trim();
        const button = form.querySelector('.newsletter-button');
        const formId = form.getAttribute('data-form-id');
        
        const successMsg = document.getElementById(`success-${formId}`);
        const errorMsg = document.getElementById(`error-${formId}`);

        if (!email || !this.isValidEmail(email)) {
            this.showMessage(errorMsg, '⚠️ Please enter a valid email address.', 'error');
            return;
        }

        this.setLoading(button, true);
        this.hideMessages(successMsg, errorMsg);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch('/.netlify/functions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    firstName: '',
                    source: window.location.pathname
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                this.showMessage(successMsg, '🎉 ' + (data.message || 'Welcome to our newsletter!'), 'success');
                form.reset();
                this.trackSubscription(email);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                await this.handleFallback(email, successMsg, errorMsg);
            } else if (error.message.includes('fetch')) {
                await this.handleFallback(email, successMsg, errorMsg);
            } else {
                this.showMessage(errorMsg, '⚠️ ' + error.message, 'error');
            }
        } finally {
            this.setLoading(button, false);
        }
    },

    async handleFallback(email, successMsg, errorMsg) {
        try {
            this.saveEmailLocally(email);
            
            const formData = new FormData();
            formData.append('email', 'yarraelliz@topicksonline.com');
            formData.append('_subject', 'Newsletter Subscription - TopPicksOnline');
            formData.append('subscriber_email', email);
            formData.append('_next', window.location.href);
            
            await fetch('https://formsubmit.co/yarraelliz@topicksonline.com', {
                method: 'POST',
                body: formData
            });
            
            this.showMessage(successMsg, '🎉 Thank you! We\'ll add you to our newsletter.', 'success');
            
        } catch (fallbackError) {
            this.showMessage(errorMsg, '⚠️ Please try again later or contact us directly.', 'error');
        }
    },

    saveEmailLocally(email) {
        const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
        subscribers.push({
            email: email,
            timestamp: new Date().toISOString(),
            page: window.location.href
        });
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
    },

    showMessage(element, message, type) {
        if (!element) return;
        
        element.innerHTML = message;
        element.style.display = 'block';
        this.styleMessage(element, type);
    },

    hideMessages(successMsg, errorMsg) {
        if (successMsg) {
            successMsg.style.display = 'none';
            successMsg.innerHTML = '';
        }
        if (errorMsg) {
            errorMsg.style.display = 'none';
            errorMsg.innerHTML = '';
        }
    },

    setLoading(button, loading) {
        if (!button) return;
        
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

    styleMessage(element, type) {
        if (!element) return;
        
        const isSuccess = type === 'success';
        element.style.color = isSuccess ? '#22c55e' : '#ef4444';
        element.style.fontWeight = '600';
        element.style.background = isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        element.style.border = `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`;
        element.style.padding = '12px';
        element.style.borderRadius = '8px';
        element.style.marginTop = '12px';
    },

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length < 255 && email.length > 5;
    },

    trackSubscription(email) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_subscribe', {
                method: 'website_form'
            });
        }
    }
};

// Filter functionality
const filters = {
    currentCategory: 'All',
    
    generateChips(container, categories) {
        container.innerHTML = '';
        
        const allChip = createElement('button', {
            className: 'filter-chip active',
            textContent: 'All',
            onclick: () => this.apply('All')
        });
        container.appendChild(allChip);
        
        categories.forEach(cat => {
            const chip = createElement('button', {
                className: 'filter-chip',
                textContent: cat.name,
                onclick: () => this.apply(cat.name)
            });
            container.appendChild(chip);
        });
    },
    
    apply(category) {
        this.currentCategory = category;
        
        $$('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.textContent === category);
        });
        
        const cards = $$('.tutorial-card');
        let visibleCount = 0;
        
        cards.forEach((card, index) => {
            const cardCategory = card.dataset.category;
            const shouldShow = category === 'All' || cardCategory === category;
            
            if (shouldShow) {
                card.style.display = '';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, visibleCount * 50);
                visibleCount++;
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.style.display = 'none', 200);
            }
        });
        
        this.handleNoResults(visibleCount, category);
        
        const url = new URL(window.location);
        if (category === 'All') {
            url.searchParams.delete('filter');
        } else {
            url.searchParams.set('filter', category.toLowerCase());
        }
        window.history.replaceState({}, '', url);
    },
    
    handleNoResults(count, category) {
        const grid = $('.tutorial-grid');
        let msg = grid.querySelector('.no-results-message');
        
        if (count === 0 && !msg) {
            msg = createElement('div', {
                className: 'no-results-message',
                style: 'grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-secondary);',
                innerHTML: `<p>No tutorials found in the "${category}" category.</p>`
            });
            grid.appendChild(msg);
        } else if (count > 0 && msg) {
            msg.remove();
        }
    }
};

// Navigation Rendering
async function renderNavigation(navData, commonData) {
    const navMenu = $('#nav-menu');
    if (!navData?.items) return;

    navMenu.innerHTML = '';

    navData.items.forEach(item => {
        const li = createElement('li', { className: 'nav-item' });
        
        if (item.title === 'Categories' && commonData.categories?.categories) {
            const topCategories = commonData.categories.categories.slice(0, 10);
            const topCategoriesHTML = topCategories.map(templates.dropdownItem).join('');
            const allCategoriesHTML = commonData.categories.categories.length > 10 ? `
                <div class="dropdown-item" style="border-top: 1px solid var(--border); padding-top: 12px;">
                    <a href="/categories" class="nav-link" style="font-style: italic;">View all categories →</a>
                </div>
            ` : '';
            
            li.innerHTML = `
                <a href="#" class="nav-link">${item.title} ▾</a>
                <div class="dropdown">
                    ${topCategoriesHTML}
                    ${allCategoriesHTML}
                </div>
            `;
        } else if (item.subItems) {
            li.innerHTML = `
                <a href="#" class="nav-link">${item.title} ▾</a>
                <div class="dropdown">
                    ${item.subItems.map(templates.dropdownItem).join('')}
                </div>
            `;
        } else {
            li.innerHTML = `<a href="${item.link}" class="nav-link">${item.title}</a>`;
        }

        navMenu.appendChild(li);
    });
}

// PAGINATION FUNCTIONS
window.changeCategoryPage = function(page) {
    if (categoryPagination && categoryPagination.goToPage(page)) {
        renderCategoryPageContent();
        scrollToTop();
    }
};

window.changeSearchPage = function(page) {
    if (searchPagination && searchPagination.goToPage(page)) {
        renderSearchPageContent();
        scrollToTop();
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Page Rendering Functions
function renderHomepage(pageData) {
    const mainContent = $('#main-content');
    if (!pageData) return renderNotFound();

    cache.currentArticles = pageData.featured || [];
    
    const sliderArticles = cache.currentArticles.slice(0, 5);
    const gridArticles = cache.currentArticles.slice(5);
    
    const newsletterHTML = pageData.newsletter ? renderNewsletterBlock(pageData.newsletter) : '';
    const sliderHTML = sliderArticles.length > 0 ? `
        <div class="hero-slider animate-in" id="heroSlider">
            <!-- Slider will be rendered here -->
        </div>
    ` : '';
    
    const titleText = sliderArticles.length > 0 ? 'More Articles' : (pageData.hero?.title || 'Featured Tutorials');
    const gridHTML = gridArticles.length > 0 ? 
        gridArticles.map(templates.tutorialCard).join('') : 
        cache.currentArticles.map(templates.tutorialCard).join('');
    
    mainContent.innerHTML = `
        <div class="search-container animate-in">
            <div class="search-box">
                <input type="text" class="search-input" placeholder="Search articles..." 
                    oninput="handleSearchInput(this.value)">
                <span class="search-icon">🔍</span>
                <div class="search-results-dropdown" id="search-dropdown"></div>
            </div>
        </div>
        
        ${sliderHTML}
        
        <div class="filter-container animate-in">
            <div class="filter-chips">
                <!-- Chips will be generated dynamically -->
            </div>
        </div>
        
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 40px; font-size: 32px;">
                ${titleText}
            </h2>
            <div class="tutorial-grid">
                ${gridHTML || '<p>No tutorials found</p>'}
            </div>
            
            ${newsletterHTML}
        </div>
    `;
    
    // Initialize slider if we have featured articles
    if (sliderArticles.length > 0) {
        const sliderContainer = $('#heroSlider');
        if (sliderContainer) {
            if (heroSlider) {
                heroSlider.destroy();
            }
            heroSlider = new HeroSlider(sliderContainer, sliderArticles);
        }
    }
    
    // Generate filter chips from categories
    const filterContainer = $('.filter-chips');
    if (filterContainer && cache.categories?.categories) {
        filters.generateChips(filterContainer, cache.categories.categories);
        
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        if (filterParam) {
            const category = filterParam.charAt(0).toUpperCase() + filterParam.slice(1);
            setTimeout(() => filters.apply(category), 100);
        }
    }
}

// Store category data globally for pagination
let currentCategoryData = null;

function renderCategoryPage(categoryData) {
    if (!categoryData) return renderNotFound();
    
    currentCategoryData = categoryData;
    categoryPagination = new Pagination(categoryData.articles || [], 12);
    
    const mainContent = $('#main-content');
    const newsletterHTML = categoryData.newsletter ? renderNewsletterBlock(categoryData.newsletter) : '';
    
    mainContent.innerHTML = `
        <div class="container animate-in">
            <div class="article-header">
                <h1 class="article-title">${categoryData.title}</h1>
                <p class="article-meta">${categoryData.articleCount} articles in ${categoryData.category}</p>
            </div>
            
            <div class="section-header">
                <h2>All ${categoryData.category} Articles</h2>
            </div>
            
            <div class="tutorial-grid" id="categoryGrid">
                <!-- Articles will be rendered here -->
            </div>
            
            <div id="categoryPagination">
                <!-- Pagination will be rendered here -->
            </div>
            
            ${newsletterHTML}
        </div>
    `;
    
    renderCategoryPageContent();
}

function renderCategoryPageContent() {
    const grid = $('#categoryGrid');
    const paginationContainer = $('#categoryPagination');
    
    if (!categoryPagination || !grid) return;
    
    const currentItems = categoryPagination.getCurrentPageItems();
    
    grid.innerHTML = currentItems.length > 0 
        ? currentItems.map(templates.tutorialCard).join('')
        : '<p>No articles found in this category.</p>';
    
    grid.classList.add('paginated');
    
    paginationContainer.innerHTML = categoryPagination.renderPagination('changeCategoryPage');
}

// Store search data globally for pagination
let currentSearchData = null;

// Search functionality
const search = {
    async loadIndex() {
        if (!cache.searchIndex) {
            cache.searchIndex = await fetchJSON('/assets/data/search-index.json');
        }
        return cache.searchIndex;
    },
    
    async perform(query) {
        const index = await this.loadIndex();
        if (!index?.articles || !query.trim()) return [];
        
        const lowerQuery = query.toLowerCase();
        return index.articles.filter(article => 
            ['title', 'description', 'category', 'author'].some(field => 
                article[field]?.toLowerCase().includes(lowerQuery)
            ) || article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    },
    
    displayDropdown(results, query) {
        const dropdown = $('#search-dropdown');
        
        if (results.length === 0) {
            dropdown.innerHTML = `<div class="search-no-results">No articles found for "${query}"</div>`;
        } else {
            const resultsHTML = results.slice(0, 5).map(article => `
                <div class="search-result-item" onclick="navigateTo('/articles/${article.id.replace('articles/', '')}')">
                    <div class="search-result-title">${this.highlightMatch(article.title, query)}</div>
                    <div class="search-result-meta">${article.category} • By ${article.author}</div>
                </div>
            `).join('');
            
            const viewAllHTML = results.length > 5 ? `
                <div class="search-result-item" onclick="showAllResults('${query}')">
                    <div class="search-result-meta">View all ${results.length} results →</div>
                </div>
            ` : '';
            
            dropdown.innerHTML = resultsHTML + viewAllHTML;
        }
        
        dropdown.style.display = 'block';
    },
    
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    },
    
    displayResults(results, query) {
        currentSearchData = { results, query };
        searchPagination = new Pagination(results, 12);
        
        $('#main-content').innerHTML = `
            <div class="container">
                <div class="section-header">
                    <h2>Search Results for "${query}" (${results.length})</h2>
                </div>
                <div class="tutorial-grid" id="searchGrid">
                    <!-- Results will be rendered here -->
                </div>
                
                <div id="searchPagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;
        
        renderSearchPageContent();
    }
};

function renderSearchPageContent() {
    const grid = $('#searchGrid');
    const paginationContainer = $('#searchPagination');
    
    if (!searchPagination || !grid || !currentSearchData) return;
    
    const currentItems = searchPagination.getCurrentPageItems();
    
    grid.innerHTML = currentItems.length > 0 
        ? currentItems.map(templates.tutorialCard).join('')
        : '<p>No articles found matching your search.</p>';
    
    grid.classList.add('paginated');
    
    paginationContainer.innerHTML = searchPagination.renderPagination('changeSearchPage');
}

// Search handlers
const handleSearchInput = debounce(async (query) => {
    const dropdown = $('#search-dropdown');
    
    if (!query.trim()) {
        dropdown.style.display = 'none';
        return;
    }
    
    const results = await search.perform(query);
    search.displayDropdown(results, query);
}, 300);

window.handleSearchInput = handleSearchInput;

async function showAllResults(query) {
    $('#search-dropdown').style.display = 'none';
    showLoading();
    const results = await search.perform(query);
    search.displayResults(results, query);
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
}

window.showAllResults = showAllResults;

function renderArticle(articleData) {
    if (!articleData) return renderNotFound();

    setMetaTags(articleData);

    const mainContent = $('#main-content');
    let contentHTML = '';
    
    if (articleData.introduction) {
        const introElements = [];
        if (articleData.introduction.hook) introElements.push(`<p><strong>${articleData.introduction.hook}</strong></p>`);
        if (articleData.introduction.personalStory) introElements.push(`<p>${articleData.introduction.personalStory}</p>`);
        if (articleData.introduction.credibility) introElements.push(`<p>${articleData.introduction.credibility}</p>`);
        if (articleData.introduction.promise) introElements.push(`<p>${articleData.introduction.promise}</p>`);
        
        contentHTML += `<div class="article-introduction">${introElements.join('')}</div>`;
    }
    
    if (articleData.sections) {
        articleData.sections.forEach(section => {
            contentHTML += `<section class="article-section">`;
            contentHTML += `<h2 class="section-heading">${section.theme}</h2>`;
            if (section.description) {
                contentHTML += `<p class="section-description">${section.description}</p>`;
            }
            
            // Handle various section types
            ['problems', 'impacts', 'hacks', 'meals', 'weeklyMeals', 'safetyProtocols', 
             'budgetBreakdown', 'varietyStrategies', 'weeklySchedule', 'principles', 
             'strategies', 'habits', 'workoutTypes', 'ingredients', 'furniture', 
             'technology', 'environment', 'comfort', 'systems', 'concepts', 
             'challenges', 'nutritionStrategies', 'mistakes', 'tools'].forEach(type => {
                if (section[type]) {
                    contentHTML += renderSectionType(section[type], type);
                }
            });
            
            contentHTML += `</section>`;
        });
    }
    
    // Add additional content sections
    if (articleData.strategicCombinations) {
        contentHTML += renderStrategicCombinations(articleData.strategicCombinations);
    }
    
    if (articleData.dailyMealStructure) {
        contentHTML += renderDailyMealStructure(articleData.dailyMealStructure);
    }
    
    if (articleData.conclusion) {
        contentHTML += renderConclusion(articleData.conclusion);
    }
    
    // Fallback for old content format
    if (!contentHTML && articleData.content) {
        contentHTML = renderOldContentFormat(articleData.content);
    }

    mainContent.innerHTML = `
        <article class="article-container animate-in">
            <header class="article-header">
                <h1 class="article-title">${articleData.title}</h1>
                <div class="article-meta">
                    By ${articleData.author} • ${articleData.date} • ${articleData.category}
                </div>
            </header>
            <div class="article-content">
                ${contentHTML}
            </div>
        </article>
    `;
    
    const shareButtonHTML = shareUtils.createShareButton();
    mainContent.insertAdjacentHTML('beforeend', shareButtonHTML);

    const shareButton = document.querySelector('.share-button');
    if (navigator.share) {
        shareButton.onclick = () => shareUtils.shareNative();
    }
    
    setTimeout(initAffiliateCards, 100);
}

// Helper functions for rendering different section types
function renderSectionType(items, type) {
    // This is a simplified version - you would implement specific rendering for each type
    return items.map(item => {
        switch(type) {
            case 'mistakes':
                return `<div class="mistake-block">
                    <h3 class="subsection-heading">Mistake #${item.mistakeNumber}: ${item.mistakeTitle}</h3>
                    ${item.description ? `<p>${item.description}</p>` : ''}
                    ${item.personalExperience ? `<div class="highlight-text">${item.personalExperience}</div>` : ''}
                </div>`;
            case 'tools':
                return `<div class="tool-block">
                    <h3 class="subsection-heading">${item.toolName}</h3>
                    ${item.description ? `<p>${item.description}</p>` : ''}
                </div>`;
            default:
                return `<div class="content-block"><p>${JSON.stringify(item)}</p></div>`;
        }
    }).join('');
}

function renderStrategicCombinations(combinations) {
    const combosHTML = combinations.map(combo => `
        <div class="combination-block">
            <h3>${combo.combination || combo.strategy}</h3>
            ${combo.ingredients ? `<p><strong>Ingredients:</strong> ${combo.ingredients}</p>` : ''}
            ${combo.result ? `<p><strong>Result:</strong> ${combo.result}</p>` : ''}
            ${combo.strategy ? `<p>${combo.strategy}</p>` : ''}
        </div>
    `).join('');
    
    return `<section class="article-section"><h2 class="section-heading">Strategic Combinations</h2>${combosHTML}</section>`;
}

function renderDailyMealStructure(structure) {
    const mealsHTML = structure.breakdown.map(meal => `
        <div class="meal-item">
            <h4>${meal.meal} - ${meal.cost}</h4>
            <p>${meal.description}</p>
        </div>
    `).join('');
    
    return `
        <section class="article-section">
            <h2 class="section-heading">Daily Meal Structure - ${structure.totalCost}</h2>
            <div class="meal-breakdown">${mealsHTML}</div>
            <p><strong>Appeal:</strong> ${structure.appeal}</p>
        </section>
    `;
}

function renderConclusion(conclusion) {
    const elements = [];
    if (conclusion.mainMessage) elements.push(`<p><strong>${conclusion.mainMessage}</strong></p>`);
    if (conclusion.keyInsight) elements.push(`<p>${conclusion.keyInsight}</p>`);
    if (conclusion.actionPlan) elements.push(`<p>${conclusion.actionPlan}</p>`);
    if (conclusion.callToAction) elements.push(`<p>${conclusion.callToAction}</p>`);
    
    return `
        <div class="conclusion-box">
            <h3>Key Takeaways</h3>
            ${elements.join('')}
        </div>
    `;
}

function renderOldContentFormat(content) {
    const contentBlocks = {
        text: (block) => `<p>${block.content}</p>`,
        heading2: (block) => `<h2>${block.content}</h2>`,
        heading3: (block) => `<h3>${block.content}</h3>`,
        code: (block) => `<div class="code-block"><pre>${block.content}</pre></div>`,
        tip: (block) => `<div class="tip-box">💡 ${block.content}</div>`,
        warning: (block) => `<div class="warning-box">⚠️ ${block.content}</div>`,
        conclusion: (block) => `<div class="conclusion-box"><h3>Conclusion</h3><p>${block.content}</p></div>`,
        newsletter: (block) => renderNewsletterBlock(block)
    };

    return content.map(block => 
        contentBlocks[block.type] ? contentBlocks[block.type](block) : ''
    ).join('');
}

function setMetaTags(articleData) {
    const getOrCreateMeta = (property, name = null) => {
        let meta = document.querySelector(`meta[property="${property}"]`) || 
                   (name ? document.querySelector(`meta[name="${name}"]`) : null);
        if (!meta) {
            meta = document.createElement('meta');
            if (property) meta.setAttribute('property', property);
            if (name) meta.setAttribute('name', name);
            document.head.appendChild(meta);
        }
        return meta;
    };

    const firstTextBlock = articleData.content?.find(block => block.type === 'text');
    const description = articleData.description || 
                       (firstTextBlock ? firstTextBlock.content.substring(0, 160) + '...' : 
                        `Read about ${articleData.title} by ${articleData.author}`);

    const firstImageBlock = articleData.content?.find(block => block.type === 'image');
    const imageUrl = articleData.thumbnail || firstImageBlock?.src || '/assets/default-share-image.jpg';
    const currentUrl = window.location.href;

    document.title = `${articleData.title} | TopPicksOnline`;

    getOrCreateMeta(null, 'description').content = description;
    getOrCreateMeta(null, 'author').content = articleData.author;
    getOrCreateMeta(null, 'keywords').content = articleData.tags?.join(', ') || articleData.category;

    getOrCreateMeta('og:title').content = articleData.title;
    getOrCreateMeta('og:description').content = description;
    getOrCreateMeta('og:type').content = 'article';
    getOrCreateMeta('og:url').content = currentUrl;
    getOrCreateMeta('og:image').content = imageUrl;
    getOrCreateMeta('og:site_name').content = 'TopPicksOnline';
    getOrCreateMeta('article:author').content = articleData.author;
    getOrCreateMeta('article:published_time').content = articleData.date;
    getOrCreateMeta('article:section').content = articleData.category;
    
    if (articleData.tags) {
        articleData.tags.forEach(tag => {
            const tagMeta = document.createElement('meta');
            tagMeta.setAttribute('property', 'article:tag');
            tagMeta.content = tag;
            document.head.appendChild(tagMeta);
        });
    }

    getOrCreateMeta('twitter:card').content = 'summary_large_image';
    getOrCreateMeta('twitter:title').content = articleData.title;
    getOrCreateMeta('twitter:description').content = description;
    getOrCreateMeta('twitter:image').content = imageUrl;
    getOrCreateMeta('twitter:site').content = '@topicksonline';

    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
        structuredData = document.createElement('script');
        structuredData.type = 'application/ld+json';
        document.head.appendChild(structuredData);
    }

    structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": articleData.title,
        "description": description,
        "image": imageUrl,
        "author": {
            "@type": "Person",
            "name": articleData.author
        },
        "publisher": {
            "@type": "Organization",
            "name": "TopPicksOnline",
            "logo": {
                "@type": "ImageObject",
                "url": "/assets/logo.png"
            }
        },
        "datePublished": articleData.date,
        "dateModified": articleData.lastModified || articleData.date,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": currentUrl
        },
        "articleSection": articleData.category,
        "keywords": articleData.tags?.join(', ')
    });
}

function resetMetaTags() {
    document.title = 'TopPicksOnline - Take control of your health, fitness, and productivity';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.content = 'Discover high-quality tutorials on programming, design, business, and more';
    
    document.querySelectorAll('meta[property^="article:"], meta[property^="og:"], meta[property^="twitter:"]').forEach(meta => {
        if (meta.getAttribute('property') !== 'og:site_name') {
            meta.remove();
        }
    });
    
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    if (structuredData) structuredData.remove();
}

function renderGenericPage(pageData) {
    const mainContent = $('#main-content');
    if (!pageData) return renderNotFound();

    const contentBlocks = {
        text: (block) => `<p>${block.content}</p>`,
        heading: (block) => `<h${block.level || 2}>${block.content}</h${block.level || 2}>`,
        list: (block) => `<ul>${block.items?.map(item => `<li>${item}</li>`).join('') || ''}</ul>`,
        cards: (block) => {
            const cardsHTML = block.cards?.map(card => `
                <div class="card">
                    <h3>${card.title}</h3>
                    <p>${card.description}</p>
                    ${card.link ? `<a href="${card.link}" class="card-link">Learn More →</a>` : ''}
                </div>
            `).join('') || '';
            return `<div class="cards-grid">${cardsHTML}</div>`;
        },
        cta: (block) => `<div class="cta-section"><p>${block.text}</p></div>`,
        newsletter: (block) => renderNewsletterBlock(block)
    };

    let content = '';
    if (pageData.content) {
        content = pageData.content.map(block => 
            contentBlocks[block.type] ? contentBlocks[block.type](block) : `<p>${block.content || ''}</p>`
        ).join('');
    }

    mainContent.innerHTML = `
        <div class="container animate-in">
            <div class="article-header">
                <h1 class="article-title">${pageData.title}</h1>
                ${pageData.description ? `<p class="article-meta">${pageData.description}</p>` : ''}
            </div>
            <div class="article-content">
                ${content}
            </div>
        </div>
    `;
}

function renderNotFound() {
    $('#main-content').innerHTML = `
        <div class="container" style="text-align: center; padding: 100px 20px;">
            <h1 style="font-size: 48px; margin-bottom: 20px;">404</h1>
            <p style="font-size: 20px; color: var(--text-secondary);">Page not found</p>
            <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: var(--accent); color: white; text-decoration: none; border-radius: var(--radius);">Go Home</a>
        </div>
    `;
}

async function renderFooter(footerData) {
    const footerContent = $('#footer-content');
    if (!footerData?.columns) return;

    const columnsHTML = footerData.columns.map(column => {
        const linksHTML = column.links?.map(link => `
            <li><a href="${link.link}">${link.title}</a></li>
        `).join('') || '';
        
        return `
            <div class="footer-column">
                <h4>${column.title}</h4>
                <ul class="footer-links">
                    ${linksHTML}
                </ul>
            </div>
        `;
    }).join('');

    footerContent.innerHTML = columnsHTML;
}

// Routing
async function handleRoute() {
    showLoading();
    const path = window.location.pathname;

    if (path === '/' || path === '') {
        const pageData = await fetchJSON('/assets/data/pages/home.json');
        renderHomepage(pageData);
        resetMetaTags();
    } else if (path.startsWith('/articles/')) {
        const articleSlug = path.substring('/articles/'.length);
        const articleData = await fetchJSON(`/assets/data/pages/articles/${articleSlug}.json`);
        renderArticle(articleData);
    } else if (path.startsWith('/category/')) {
        const categorySlug = path.substring('/category/'.length);
        const categoryData = await fetchJSON(`/assets/data/pages/categories/categories/${categorySlug}.json`);
        renderCategoryPage(categoryData);
    } else if (path === '/search') {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            const results = await search.perform(query);
            search.displayResults(results, query);
        } else {
            navigateTo('/');
        }
    } else {
        const pageName = path.substring(1);
        const pageData = await fetchJSON(`/assets/data/pages/${pageName}.json`);
        if (pageData) {
            renderGenericPage(pageData);
        } else {
            renderNotFound();
        }
    }
}

function navigateTo(path) {
    $('#search-dropdown') && ($('#search-dropdown').style.display = 'none');
    
    if (heroSlider && path !== '/') {
        heroSlider.destroy();
        heroSlider = null;
    }
    
    window.history.pushState({}, '', path);
    handleRoute();
}

window.navigateTo = navigateTo;

function initAffiliateCards() {
    const affiliateCards = document.querySelectorAll('.affiliate-card');
    
    affiliateCards.forEach(card => {
        const inner = card.querySelector('.affiliate-card-inner');
        const glow = card.querySelector('.affiliate-glow');
        
        if (!inner || !glow) return;
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            glow.style.setProperty('--x', `${x}px`);
            glow.style.setProperty('--y', `${y}px`);
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * 2;
            const rotateY = ((x - centerX) / centerX) * -2;
            
            inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            inner.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
        });
    });
}

// Share functionality
const shareUtils = {
    createShareButton() {
        return `
            <div class="share-container">
                <button class="share-button" onclick="shareUtils.toggleMenu()" aria-label="Share article">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                </button>
                <div class="share-menu" id="shareMenu">
                    <div class="share-option twitter" onclick="shareUtils.shareTwitter()">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </svg>
                        <span>Twitter</span>
                    </div>
                    <div class="share-option facebook" onclick="shareUtils.shareFacebook()">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                        <span>Facebook</span>
                    </div>
                    <div class="share-option linkedin" onclick="shareUtils.shareLinkedIn()">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect x="2" y="9" width="4" height="12"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                        <span>LinkedIn</span>
                    </div>
                    <div class="share-option whatsapp" onclick="shareUtils.shareWhatsApp()">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        <span>WhatsApp</span>
                    </div>
                    <div class="share-option copy" onclick="shareUtils.copyLink()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy Link</span>
                    </div>
                </div>
                <div class="share-toast" id="shareToast"></div>
            </div>
        `;
    },

    getCurrentArticle() {
        return {
            title: document.querySelector('.article-title')?.textContent || document.title,
            url: window.location.href,
            description: document.querySelector('meta[name="description"]')?.content || ''
        };
    },

    toggleMenu() {
        const menu = document.getElementById('shareMenu');
        menu.classList.toggle('active');
        
        if (menu.classList.contains('active')) {
            setTimeout(() => {
                document.addEventListener('click', this.closeMenuHandler);
            }, 100);
        }
    },

    closeMenuHandler(e) {
        if (!e.target.closest('.share-container')) {
            document.getElementById('shareMenu').classList.remove('active');
            document.removeEventListener('click', shareUtils.closeMenuHandler);
        }
    },

    showToast(message) {
        const toast = document.getElementById('shareToast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    async shareNative() {
        const article = this.getCurrentArticle();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.description,
                    url: article.url
                });
                this.showToast('Shared successfully!');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            this.toggleMenu();
        }
    },

    shareTwitter() {
        const article = this.getCurrentArticle();
        const text = `${article.title} by @topicksonline.com`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(article.url)}`;
        window.open(url, '_blank', 'width=550,height=400');
        this.showToast('Sharing to Twitter...');
    },

    shareFacebook() {
        const article = this.getCurrentArticle();
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.url)}`;
        window.open(url, '_blank', 'width=550,height=400');
        this.showToast('Sharing to Facebook...');
    },

    shareLinkedIn() {
        const article = this.getCurrentArticle();
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(article.url)}`;
        window.open(url, '_blank', 'width=550,height=400');
        this.showToast('Sharing to LinkedIn...');
    },

    shareWhatsApp() {
        const article = this.getCurrentArticle();
        const text = `${article.title} - ${article.url}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        this.showToast('Opening WhatsApp...');
    },

    async copyLink() {
        const article = this.getCurrentArticle();
        
        try {
            await navigator.clipboard.writeText(article.url);
            this.showToast('Link copied to clipboard!');
            
            const copyOption = document.querySelector('.share-option.copy svg');
            const originalSVG = copyOption.innerHTML;
            copyOption.innerHTML = '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none"></path>';
            
            setTimeout(() => {
                copyOption.innerHTML = originalSVG;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showToast('Failed to copy link');
        }
    }
};

window.shareUtils = shareUtils;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    theme.init();
    newsletter.init();

    const commonData = await fetchCommonData();
    if (commonData.navigation) {
        await renderNavigation(commonData.navigation, commonData);
    }
    if (commonData.footer) {
        await renderFooter(commonData.footer);
    }

    await handleRoute();

    window.addEventListener('popstate', handleRoute);

    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
            e.preventDefault();
            navigateTo(e.target.getAttribute('href'));
        }
        
        const searchBox = $('.search-box');
        const dropdown = $('#search-dropdown');
        if (searchBox && dropdown && !searchBox.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

// Helper functions
window.checkNewsletterSubscribers = function() {
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    console.log('📧 Newsletter Subscribers (' + subscribers.length + ' total):');
    console.table(subscribers);
    return subscribers;
};

// Auto-save button text
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const buttons = document.querySelectorAll('.newsletter-button');
        buttons.forEach(button => {
            if (!button.getAttribute('data-original-text')) {
                button.setAttribute('data-original-text', button.textContent);
            }
        });
    }, 1000);
});