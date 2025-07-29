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

// Template functions
const templates = {
    tutorialCard: (tutorial) => `
        <div class="tutorial-card animate-in" onclick="navigateTo('/articles/${tutorial.id.replace('articles/', '')}')" data-category="${tutorial.category}">
            <div class="tutorial-thumbnail" style="position: relative;">
                <!-- Loader shown until image loads -->
                <div class="image-loader"></div>
                ${tutorial.image ? `<img src="${tutorial.image}" 
                                       alt="${tutorial.title}" 
                                       onload="this.previousElementSibling.style.display='none'" 
                                       onerror="this.previousElementSibling.style.display='none'; this.style.display='none';" />` : ''}
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
    `,
    
    dropdownItem: (item) => `
        <div class="dropdown-item">
            <a href="${item.link}" class="nav-link">${item.title || item.name}${item.articleCount ? ` (${item.articleCount})` : ''}</a>
        </div>
    `
};

// Newsletter Template Function
// FINAL FIX: Newsletter system that works properly
function renderNewsletterBlock(block) {
    const benefits = block.benefits || [
        { icon: "✨", text: "Weekly insights" },
        { icon: "🚫", text: "No spam, ever" },
        { icon: "✋", text: "Unsubscribe anytime" }
    ];

    const uniqueId = Math.random().toString(36).substr(2, 9);

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
                
                <!-- SUCCESS/ERROR MESSAGES WITH UNIQUE IDS -->
                <div class="newsletter-success" id="success-${uniqueId}" style="display: none;"></div>
                <div class="newsletter-error" id="error-${uniqueId}" style="display: none;"></div>
                
                <div class="newsletter-benefits">
                    ${benefits.map(benefit => `
                        <div class="newsletter-benefit">
                            <span class="newsletter-benefit-icon">${benefit.icon}</span>
                            <span>${benefit.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}

// IMPROVED Newsletter object - no more alerts or stuck buttons
const newsletter = {
    init() {
        this.bindEvents();
        console.log('📧 Newsletter system initialized - final version');
    },

    bindEvents() {
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('newsletter-form')) {
                e.preventDefault();
                console.log('📝 Newsletter form submitted');
                this.handleSubmit(e.target);
            }
        });
    },

    async handleSubmit(form) {
        console.log('🚀 Processing newsletter subscription...');
        
        const email = form.querySelector('.newsletter-input')?.value?.trim();
        const button = form.querySelector('.newsletter-button');
        const formId = form.getAttribute('data-form-id');
        
        // Get message elements by ID to ensure they're found
        const successMsg = document.getElementById(`success-${formId}`);
        const errorMsg = document.getElementById(`error-${formId}`);

        console.log('📋 Form elements found:', {
            email: !!email,
            button: !!button,
            successMsg: !!successMsg,
            errorMsg: !!errorMsg,
            formId: formId
        });

        // Validate
        if (!email || !this.isValidEmail(email)) {
            console.log('❌ Invalid email');
            this.showMessage(errorMsg, '⚠️ Please enter a valid email address.', 'error');
            return;
        }

        // Set loading state
        this.setLoading(button, true);
        this.hideMessages(successMsg, errorMsg);

        try {
            console.log('📨 Attempting to subscribe:', email);
            
            // Try the backend function with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await fetch('/.netlify/functions/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                console.log('✅ API Success:', data);
                
                this.showMessage(successMsg, '🎉 ' + (data.message || 'Welcome to our newsletter!'), 'success');
                form.reset();
                this.trackSubscription(email);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Subscription error:', error.name, error.message);
            
            if (error.name === 'AbortError') {
                console.log('⏰ Request timed out, trying fallback...');
                await this.handleFallback(email, successMsg, errorMsg);
            } else if (error.message.includes('fetch')) {
                console.log('🌐 Network error, trying fallback...');
                await this.handleFallback(email, successMsg, errorMsg);
            } else {
                this.showMessage(errorMsg, '⚠️ ' + error.message, 'error');
            }
        } finally {
            // ALWAYS reset button state
            console.log('🔄 Resetting button state');
            this.setLoading(button, false);
        }
    },

    async handleFallback(email, successMsg, errorMsg) {
        try {
            console.log('🔄 Using fallback method...');
            
            // Save locally
            this.saveEmailLocally(email);
            
            // Try simple email service
            const formData = new FormData();
            formData.append('email', 'yousraelassoui6@gmail.com');
            formData.append('_subject', 'Newsletter Subscription - TopPicksOnline');
            formData.append('subscriber_email', email);
            formData.append('_next', window.location.href);
            
            await fetch('https://formsubmit.co/yousraelassoui6@gmail.com', {
                method: 'POST',
                body: formData
            });
            
            this.showMessage(successMsg, '🎉 Thank you! We\'ll add you to our newsletter.', 'success');
            console.log('✅ Fallback successful');
            
        } catch (fallbackError) {
            console.error('❌ Fallback failed:', fallbackError);
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
        console.log('💾 Email saved locally');
    },

    showMessage(element, message, type) {
        if (!element) {
            console.warn('⚠️ Message element not found, using console instead');
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }
        
        element.innerHTML = message;
        element.style.display = 'block';
        this.styleMessage(element, type);
        
        console.log(`📢 Showing ${type} message:`, message);
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
        if (!button) {
            console.warn('⚠️ Button not found');
            return;
        }
        
        if (loading) {
            button.disabled = true;
            button.innerHTML = '⏳ Subscribing...';
            button.style.opacity = '0.8';
            console.log('🔄 Button set to loading state');
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || 'Subscribe';
            button.style.opacity = '1';
            console.log('✅ Button reset to normal state');
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
        console.log('📊 Newsletter subscription tracked');
    }
};

// Also ensure you have this helper function to check stored emails:
window.getNewsletterSubscribers = function() {
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    console.log('📧 Newsletter Subscribers:');
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

// Add CSS for loading spinner and shake animation
const additionalCSS = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.newsletter-error {
    animation-fill-mode: both;
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Filter functionality
const filters = {
    currentCategory: 'All',
    
    generateChips(container, categories) {
        container.innerHTML = '';
        
        // Add "All" chip
        const allChip = createElement('button', {
            className: 'filter-chip active',
            textContent: 'All',
            onclick: () => this.apply('All')
        });
        container.appendChild(allChip);
        
        // Add category chips
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
        
        // Update active chip
        $$('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.textContent === category);
        });
        
        // Filter cards
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
        
        // Show no results message if needed
        this.handleNoResults(visibleCount, category);
        
        // Update URL
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
            li.innerHTML = `
                <a href="#" class="nav-link">${item.title} ▾</a>
                <div class="dropdown">
                    ${topCategories.map(templates.dropdownItem).join('')}
                    ${commonData.categories.categories.length > 10 ? `
                        <div class="dropdown-item" style="border-top: 1px solid var(--border); padding-top: 12px;">
                            <a href="/categories" class="nav-link" style="font-style: italic;">View all categories →</a>
                        </div>
                    ` : ''}
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

// Page Rendering Functions
function renderHomepage(pageData) {
    const mainContent = $('#main-content');
    if (!pageData) return renderNotFound();

    cache.currentArticles = pageData.featured || [];
    
    // Check if newsletter data exists in JSON
    const newsletterHTML = pageData.newsletter ? renderNewsletterBlock(pageData.newsletter) : '';
    
    mainContent.innerHTML = `
        <div class="search-container animate-in">
            <div class="search-box">
                <input type="text" class="search-input" placeholder="Search articles..." 
                    oninput="handleSearchInput(this.value)">
                <span class="search-icon">🔍</span>
                <div class="search-results-dropdown" id="search-dropdown"></div>
            </div>
        </div>
        
        <div class="filter-container animate-in">
            <div class="filter-chips">
                <!-- Chips will be generated dynamically -->
            </div>
        </div>
        
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 40px; font-size: 32px;">${pageData.hero?.title || 'Featured Tutorials'}</h2>
            <div class="tutorial-grid">
                ${cache.currentArticles.map(templates.tutorialCard).join('') || '<p>No tutorials found</p>'}
            </div>
            
            ${newsletterHTML}
        </div>
    `;
    
    // Generate filter chips from categories
    const filterContainer = $('.filter-chips');
    if (filterContainer && cache.categories?.categories) {
        filters.generateChips(filterContainer, cache.categories.categories);
        
        // Apply filter from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        if (filterParam) {
            const category = filterParam.charAt(0).toUpperCase() + filterParam.slice(1);
            setTimeout(() => filters.apply(category), 100);
        }
    }
}

function renderArticle(articleData) {
    if (!articleData) return renderNotFound();

    // Set meta tags for social media sharing
    setMetaTags(articleData);

    const mainContent = $('#main-content');
    
    // Generate content HTML from sections
    let contentHTML = '';
    
    // Add introduction if it exists
    if (articleData.introduction) {
        contentHTML += `
            <div class="article-introduction">
                ${articleData.introduction.hook ? `<p><strong>${articleData.introduction.hook}</strong></p>` : ''}
                ${articleData.introduction.personalStory ? `<p>${articleData.introduction.personalStory}</p>` : ''}
                ${articleData.introduction.credibility ? `<p>${articleData.introduction.credibility}</p>` : ''}
                ${articleData.introduction.promise ? `<p>${articleData.introduction.promise}</p>` : ''}
            </div>
        `;
    }
    
    // Process sections
    if (articleData.sections) {
        articleData.sections.forEach(section => {
            contentHTML += `
                <section class="article-section">
                    <h2 class="section-heading">${section.theme}</h2>
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
            `;
            
            // Handle PRINCIPLES
            if (section.principles) {
                section.principles.forEach(principle => {
                    contentHTML += `
                        <div class="principle-block">
                            <h3 class="subsection-heading">${principle.principleTitle || principle.title}</h3>
                            ${principle.description ? `<p>${principle.description}</p>` : ''}
                            ${principle.personalExperience ? `<div class="highlight-text">${principle.personalExperience}</div>` : ''}
                            
                            ${principle.threePillars ? `
                                <div class="pillars-content">
                                    <h4>The Three Pillars:</h4>
                                    <ul class="content-list">
                                        <li><strong>Nutrition:</strong> ${principle.threePillars.nutrition}</li>
                                        <li><strong>Movement:</strong> ${principle.threePillars.movement}</li>
                                        <li><strong>Mindset:</strong> ${principle.threePillars.mindset}</li>
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${principle.keyInsight ? `<div class="tip-box">${principle.keyInsight}</div>` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle STRATEGIES
            if (section.strategies) {
                section.strategies.forEach(strategy => {
                    contentHTML += `
                        <div class="strategy-block">
                            <h3 class="subsection-heading">${strategy.strategyTitle || strategy.title}</h3>
                            ${strategy.description ? `<p>${strategy.description}</p>` : ''}
                            ${strategy.personalExperience ? `<div class="highlight-text">${strategy.personalExperience}</div>` : ''}
                            
                            ${strategy.tdeeCalculation ? `
                                <div class="calculation-box">
                                    <h4>TDEE Calculation Example:</h4>
                                    <p><strong>Definition:</strong> ${strategy.tdeeCalculation.definition}</p>
                                    <p><strong>Example:</strong> ${strategy.tdeeCalculation.myExample}</p>
                                    <p><strong>Result:</strong> ${strategy.tdeeCalculation.result}</p>
                                    <p><strong>Target:</strong> ${strategy.tdeeCalculation.deficitTarget}</p>
                                </div>
                            ` : ''}
                            
                            ${strategy.dailyEatingStructure ? `
                                <div class="meal-structure">
                                    <h4>Daily Eating Structure (${strategy.dailyEatingStructure.total}):</h4>
                                    <ul>
                                        <li><strong>Breakfast:</strong> ${strategy.dailyEatingStructure.breakfast}</li>
                                        <li><strong>Lunch:</strong> ${strategy.dailyEatingStructure.lunch}</li>
                                        <li><strong>Snack:</strong> ${strategy.dailyEatingStructure.snack}</li>
                                        <li><strong>Dinner:</strong> ${strategy.dailyEatingStructure.dinner}</li>
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${strategy.keyInsight ? `<div class="tip-box">${strategy.keyInsight}</div>` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle HABITS
            if (section.habits) {
                section.habits.forEach(habit => {
                    contentHTML += `
                        <div class="habit-block">
                            <h3 class="subsection-heading">${habit.habitTitle || habit.title}</h3>
                            ${habit.description ? `<p>${habit.description}</p>` : ''}
                            ${habit.personalExperience ? `<div class="highlight-text">${habit.personalExperience}</div>` : ''}
                            
                            ${habit.whySleepMatters ? `
                                <h4>Why Sleep Matters:</h4>
                                <ul class="content-list">
                                    ${habit.whySleepMatters.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                            
                            ${habit.sleepOptimization ? `
                                <h4>Sleep Optimization:</h4>
                                <ul class="content-list">
                                    ${habit.sleepOptimization.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                            
                            ${habit.movementStrategies ? `
                                <h4>Movement Strategies:</h4>
                                <ul class="content-list">
                                    ${habit.movementStrategies.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                            
                            ${habit.stressReductionTechniques ? `
                                <h4>Stress Reduction Techniques:</h4>
                                <ul class="content-list">
                                    ${habit.stressReductionTechniques.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle WORKOUT TYPES
            if (section.workoutTypes) {
                section.workoutTypes.forEach(workout => {
                    contentHTML += `
                        <div class="workout-block">
                            <h3 class="subsection-heading">${workout.workoutTitle}: ${workout.description}</h3>
                            ${workout.personalExperience ? `<div class="highlight-text">${workout.personalExperience}</div>` : ''}
                            
                            ${workout.exercises ? `
                                <div class="exercises-list">
                                    <h4>Exercises:</h4>
                                    ${workout.exercises.map(exercise => `
                                        <div class="exercise-item">
                                            <h5>${exercise.exercise}</h5>
                                            <p><strong>Duration:</strong> ${exercise.duration}</p>
                                            <p><strong>Technique:</strong> ${exercise.technique}</p>
                                            ${exercise.benefits ? `<p><strong>Benefits:</strong> ${exercise.benefits}</p>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${workout.progressionTips ? `
                                <div class="tip-box">
                                    <h4>Progression Tips:</h4>
                                    <ul>
                                        ${workout.progressionTips.map(tip => `<li>${tip}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle INGREDIENTS
            if (section.ingredients) {
                section.ingredients.forEach(ingredient => {
                    contentHTML += `
                        <div class="ingredient-block">
                            <h3 class="subsection-heading">${ingredient.ingredientTitle} - ${ingredient.cost}</h3>
                            ${ingredient.description ? `<p><strong>${ingredient.description}</strong></p>` : ''}
                            ${ingredient.personalExperience ? `<div class="highlight-text">${ingredient.personalExperience}</div>` : ''}
                            
                            ${ingredient.whyEggsAreBudgetGold || ingredient.whyBeansAreBrilliant || ingredient.whyGroundTurkeyWins ? `
                                <h4>Why This Works:</h4>
                                <ul class="content-list">
                                    ${(ingredient.whyEggsAreBudgetGold || ingredient.whyBeansAreBrilliant || ingredient.whyGroundTurkeyWins || []).map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                            
                            ${ingredient.mealIdeasThatStretch || ingredient.mealIdeasThatSatisfy ? `
                                <div class="meal-ideas">
                                    <h4>Meal Ideas:</h4>
                                    ${(ingredient.mealIdeasThatStretch || ingredient.mealIdeasThatSatisfy || []).map(meal => `
                                        <div class="meal-idea">
                                            <h5>${meal.meal} - ${meal.cost}</h5>
                                            <p>${meal.description}</p>
                                            <p><em>${meal.appeal}</em></p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle FURNITURE
            if (section.furniture) {
                section.furniture.forEach(item => {
                    contentHTML += `
                        <div class="furniture-block">
                            <h3 class="subsection-heading">${item.furnitureTitle}</h3>
                            ${item.description ? `<p>${item.description}</p>` : ''}
                            ${item.personalExperience ? `<div class="highlight-text">${item.personalExperience}</div>` : ''}
                            
                            ${item.deskRequirements ? `
                                <div class="requirements-section">
                                    <h4>Desk Requirements:</h4>
                                    ${item.deskRequirements.sizeRequirements ? `
                                        <h5>Size Requirements:</h5>
                                        <ul>${item.deskRequirements.sizeRequirements.map(req => `<li>${req}</li>`).join('')}</ul>
                                    ` : ''}
                                    ${item.deskRequirements.stabilityIsEverything ? `
                                        <h5>Stability Matters:</h5>
                                        <ul>${item.deskRequirements.stabilityIsEverything.map(req => `<li>${req}</li>`).join('')}</ul>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            ${item.deskRecommendations ? `
                                <div class="recommendations">
                                    <h4>Recommendations:</h4>
                                    ${item.deskRecommendations.map(rec => `
                                        <div class="recommendation-item">
                                            <h5>${rec.category}</h5>
                                            <p><strong>${rec.product}</strong></p>
                                            <p>${rec.description}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle TECHNOLOGY
            if (section.technology) {
                section.technology.forEach(tech => {
                    contentHTML += `
                        <div class="tech-block">
                            <h3 class="subsection-heading">${tech.techTitle}</h3>
                            ${tech.description ? `<p>${tech.description}</p>` : ''}
                            ${tech.personalExperience ? `<div class="highlight-text">${tech.personalExperience}</div>` : ''}
                            
                            ${tech.monitorSetup ? `
                                <div class="monitor-setup">
                                    <h4>Monitor Setup:</h4>
                                    ${tech.monitorSetup.singleVsDualVsUltrawide ? `
                                        <h5>Setup Comparison:</h5>
                                        <ul>${tech.monitorSetup.singleVsDualVsUltrawide.map(item => `<li>${item}</li>`).join('')}</ul>
                                    ` : ''}
                                    ${tech.monitorSetup.optimalDualSetup ? `
                                        <h5>Optimal Dual Setup:</h5>
                                        <ul>${tech.monitorSetup.optimalDualSetup.map(item => `<li>${item}</li>`).join('')}</ul>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            ${tech.peripheralRecommendations ? `
                                <div class="recommendations">
                                    <h4>Peripheral Recommendations:</h4>
                                    ${tech.peripheralRecommendations.map(rec => `
                                        <div class="recommendation-item">
                                            <h5>${rec.category}</h5>
                                            <p><strong>${rec.product}</strong></p>
                                            <p>${rec.description}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle SYSTEMS
            if (section.systems) {
                section.systems.forEach(system => {
                    contentHTML += `
                        <div class="system-block">
                            <h3 class="subsection-heading">${system.systemTitle}</h3>
                            ${system.description ? `<p>${system.description}</p>` : ''}
                            ${system.personalExperience ? `<div class="highlight-text">${system.personalExperience}</div>` : ''}
                            
                            ${system.goalEvolution ? `
                                <div class="goal-evolution">
                                    <h4>Goal Evolution:</h4>
                                    <ul>${system.goalEvolution.map(item => `<li>${item}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                            
                            ${system.trackingMethod ? `
                                <div class="tip-box">
                                    <h4>Tracking Method:</h4>
                                    <p>${system.trackingMethod}</p>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle CONCEPTS
            if (section.concepts) {
                section.concepts.forEach(concept => {
                    contentHTML += `
                        <div class="concept-block">
                            <h3 class="subsection-heading">${concept.conceptTitle}</h3>
                            ${concept.description ? `<p>${concept.description}</p>` : ''}
                            ${concept.personalExperience ? `<div class="highlight-text">${concept.personalExperience}</div>` : ''}
                            
                            ${concept.subcutaneousFat ? `
                                <div class="fat-type">
                                    <h4>Subcutaneous Fat:</h4>
                                    <p><strong>Definition:</strong> ${concept.subcutaneousFat.definition}</p>
                                    <ul>${concept.subcutaneousFat.characteristics.map(char => `<li>${char}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                            
                            ${concept.visceralFat ? `
                                <div class="fat-type">
                                    <h4>Visceral Fat:</h4>
                                    <p><strong>Definition:</strong> ${concept.visceralFat.definition}</p>
                                    <ul>${concept.visceralFat.characteristics.map(char => `<li>${char}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                            
                            ${concept.keyInsight ? `<div class="tip-box">${concept.keyInsight}</div>` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle CHALLENGES
            if (section.challenges) {
                section.challenges.forEach(challenge => {
                    contentHTML += `
                        <div class="challenge-block">
                            <h3 class="subsection-heading">${challenge.challengeTitle}</h3>
                            ${challenge.description ? `<p>${challenge.description}</p>` : ''}
                            ${challenge.personalExperience ? `<div class="highlight-text">${challenge.personalExperience}</div>` : ''}
                            
                            ${challenge.gymVsHomeReality ? `
                                <div class="comparison">
                                    <h4>Gym vs Home Reality:</h4>
                                    <ul>${challenge.gymVsHomeReality.map(item => `<li>${item}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                            
                            ${challenge.myFailedAttempts ? `
                                <div class="failed-attempts">
                                    <h4>Failed Attempts:</h4>
                                    <ul>${challenge.myFailedAttempts.map(attempt => `<li>${attempt}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                            
                            ${challenge.keyInsight ? `<div class="tip-box">${challenge.keyInsight}</div>` : ''}
                        </div>
                    `;
                });
            }
            
            // Handle NUTRITIONAL STRATEGIES
            if (section.nutritionStrategies) {
                section.nutritionStrategies.forEach(strategy => {
                    contentHTML += `
                        <div class="nutrition-block">
                            <h3 class="subsection-heading">${strategy.strategyTitle}</h3>
                            ${strategy.description ? `<p>${strategy.description}</p>` : ''}
                            ${strategy.personalExperience ? `<div class="highlight-text">${strategy.personalExperience}</div>` : ''}
                            
                            ${strategy.foodsToReduceOrEliminate ? `
                                <div class="foods-section">
                                    <h4>Foods to Reduce or Eliminate:</h4>
                                    ${strategy.foodsToReduceOrEliminate.map(food => `
                                        <div class="food-category">
                                            <h5>${food.category}</h5>
                                            <p>${food.explanation}</p>
                                            <p><strong>Examples:</strong> ${food.examples || food.effects}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${strategy.foodsThatAccelerateFatLoss ? `
                                <div class="foods-section">
                                    <h4>Foods That Accelerate Fat Loss:</h4>
                                    ${strategy.foodsThatAccelerateFatLoss.map(food => `
                                        <div class="food-category">
                                            <h5>${food.category}</h5>
                                            <p>${food.benefits}</p>
                                            <p><strong>Examples:</strong> ${food.examples}</p>
                                            ${food.target ? `<p><strong>Target:</strong> ${food.target}</p>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // Keep existing handlers for MISTAKES and TOOLS
            if (section.mistakes) {
                section.mistakes.forEach(mistake => {
                    contentHTML += `
                        <div class="mistake-block">
                            <h3 class="subsection-heading">Mistake #${mistake.mistakeNumber}: ${mistake.mistakeTitle}</h3>
                            ${mistake.description ? `<p>${mistake.description}</p>` : ''}
                            ${mistake.personalExperience ? `<div class="highlight-text">${mistake.personalExperience}</div>` : ''}
                            
                            ${mistake.whatIWasDoingWrong ? `
                                <h4>What I Was Doing Wrong:</h4>
                                <ul class="content-list">
                                    ${mistake.whatIWasDoingWrong.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                            
                            ${mistake.doThisInstead ? `
                                <div class="tip-box">
                                    <h4>${mistake.doThisInstead.mainAction}</h4>
                                    ${mistake.doThisInstead.specificSteps ? `
                                        <ul>
                                            ${mistake.doThisInstead.specificSteps.map(step => `<li>${step}</li>`).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            if (section.tools) {
                section.tools.forEach(tool => {
                    contentHTML += `
                        <div class="tool-block">
                            <h3 class="subsection-heading">${tool.toolName}</h3>
                            ${tool.description ? `<p>${tool.description}</p>` : ''}
                            ${tool.personalExperience ? `<p>${tool.personalExperience}</p>` : ''}
                            
                            ${tool.whatILove ? `
                                <h4>What I Love:</h4>
                                <ul class="content-list">
                                    ${tool.whatILove.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                            
                            ${tool.bestFor ? `<div class="highlight-text"><strong>Best For:</strong> ${tool.bestFor}</div>` : ''}
                        </div>
                    `;
                });
            }
            
            contentHTML += `</section>`;
        });
    }
    
    // Add conclusion if it exists
    if (articleData.conclusion) {
        contentHTML += `
            <div class="conclusion-box">
                <h3>Key Takeaways</h3>
                ${articleData.conclusion.mainMessage ? `<p><strong>${articleData.conclusion.mainMessage}</strong></p>` : ''}
                ${articleData.conclusion.keyInsight ? `<p>${articleData.conclusion.keyInsight}</p>` : ''}
                ${articleData.conclusion.callToAction ? `<p>${articleData.conclusion.callToAction}</p>` : ''}
            </div>
        `;
    }
    
    // Fallback: if no sections, try the old content array format
    if (!contentHTML && articleData.content) {
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

        contentHTML = articleData.content.map(block => 
            contentBlocks[block.type] ? contentBlocks[block.type](block) : ''
        ).join('');
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

    // Update share button behavior for mobile
    const shareButton = document.querySelector('.share-button');
    if (navigator.share) {
        shareButton.onclick = () => shareUtils.shareNative();
    }
    
    // Initialize affiliate cards after rendering
    setTimeout(initAffiliateCards, 100);
}

// Add this new function to handle meta tags
function setMetaTags(articleData) {
    // Get or create meta tags
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

    // Extract description from first text block
    const firstTextBlock = articleData.content?.find(block => block.type === 'text');
    const description = articleData.description || 
                       (firstTextBlock ? firstTextBlock.content.substring(0, 160) + '...' : 
                        `Read about ${articleData.title} by ${articleData.author}`);

    // Extract first image from content
    const firstImageBlock = articleData.content?.find(block => block.type === 'image');
    const imageUrl = articleData.thumbnail || firstImageBlock?.src || '/assets/default-share-image.jpg';

    // Current page URL
    const currentUrl = window.location.href;

    // Update page title
    document.title = `${articleData.title} | TopPicksOnline`;

    // Basic meta tags
    getOrCreateMeta(null, 'description').content = description;
    getOrCreateMeta(null, 'author').content = articleData.author;
    getOrCreateMeta(null, 'keywords').content = articleData.tags?.join(', ') || articleData.category;

    // Open Graph meta tags (Facebook, LinkedIn, etc.)
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

    // Twitter Card meta tags
    getOrCreateMeta('twitter:card').content = 'summary_large_image';
    getOrCreateMeta('twitter:title').content = articleData.title;
    getOrCreateMeta('twitter:description').content = description;
    getOrCreateMeta('twitter:image').content = imageUrl;
    getOrCreateMeta('twitter:site').content = '@topicksonline';

    // Structured data for SEO (JSON-LD)
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

// Also add a function to reset meta tags when navigating away
function resetMetaTags() {
    document.title = 'TopPicksOnline - Take control of your health, fitness, and productivity';
    
    // Reset basic meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.content = 'Discover high-quality tutorials on programming, design, business, and more';
    
    // Remove article-specific meta tags
    document.querySelectorAll('meta[property^="article:"], meta[property^="og:"], meta[property^="twitter:"]').forEach(meta => {
        if (meta.getAttribute('property') !== 'og:site_name') {
            meta.remove();
        }
    });
    
    // Remove structured data
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    if (structuredData) structuredData.remove();
}

function renderCategoryPage(categoryData) {
    if (!categoryData) return renderNotFound();
    
    // Check if newsletter data exists in JSON
    const newsletterHTML = categoryData.newsletter ? renderNewsletterBlock(categoryData.newsletter) : '';
    
    $('#main-content').innerHTML = `
        <div class="container animate-in">
            <div class="article-header">
                <h1 class="article-title">${categoryData.title}</h1>
                <p class="article-meta">${categoryData.articleCount} articles in ${categoryData.category}</p>
            </div>
            
            <div class="section-header">
                <h2>All ${categoryData.category} Articles</h2>
            </div>
            
            <div class="tutorial-grid">
                ${categoryData.articles?.map(templates.tutorialCard).join('') || '<p>No articles found in this category.</p>'}
            </div>
            
            ${newsletterHTML}
        </div>
    `;
}

function renderGenericPage(pageData) {
    const mainContent = $('#main-content');
    if (!pageData) return renderNotFound();

    const contentBlocks = {
        text: (block) => `<p>${block.content}</p>`,
        heading: (block) => `<h${block.level || 2}>${block.content}</h${block.level || 2}>`,
        list: (block) => `<ul>${block.items?.map(item => `<li>${item}</li>`).join('') || ''}</ul>`,
        cards: (block) => `
            <div class="cards-grid">
                ${block.cards?.map(card => `
                    <div class="card">
                        <h3>${card.title}</h3>
                        <p>${card.description}</p>
                        ${card.link ? `<a href="${card.link}" class="card-link">Learn More →</a>` : ''}
                    </div>
                `).join('') || ''}
            </div>
        `,
        cta: (block) => `<div class="cta-section"><p>${block.text}</p></div>`,
        newsletter: (block) => renderNewsletterBlock(block) // ADD NEWSLETTER SUPPORT
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

    footerContent.innerHTML = footerData.columns.map(column => `
        <div class="footer-column">
            <h4>${column.title}</h4>
            <ul class="footer-links">
                ${column.links?.map(link => `
                    <li><a href="${link.link}">${link.title}</a></li>
                `).join('') || ''}
            </ul>
        </div>
    `).join('');
}

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
            dropdown.innerHTML = results.slice(0, 5).map(article => `
                <div class="search-result-item" onclick="navigateTo('/articles/${article.id.replace('articles/', '')}')">
                    <div class="search-result-title">${this.highlightMatch(article.title, query)}</div>
                    <div class="search-result-meta">${article.category} • By ${article.author}</div>
                </div>
            `).join('');
            
            if (results.length > 5) {
                dropdown.innerHTML += `
                    <div class="search-result-item" onclick="showAllResults('${query}')">
                        <div class="search-result-meta">View all ${results.length} results →</div>
                    </div>
                `;
            }
        }
        
        dropdown.style.display = 'block';
    },
    
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    },
    
    displayResults(results) {
        $('#main-content').innerHTML = `
            <div class="container">
                <div class="section-header">
                    <h2>Search Results (${results.length})</h2>
                </div>
                <div class="tutorial-grid">
                    ${results.map(templates.tutorialCard).join('') || '<p>No articles found matching your search.</p>'}
                </div>
            </div>
        `;
    }
};

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
    search.displayResults(results);
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
}

window.showAllResults = showAllResults;

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
            search.displayResults(results);
        } else {
            navigateTo('/');
        }
    } else {
        // Try to load as a generic page
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
    window.history.pushState({}, '', path);
    handleRoute();
}

window.navigateTo = navigateTo;

// Add this function to your JavaScript
function initAffiliateCards() {
    const affiliateCards = document.querySelectorAll('.affiliate-card');
    
    affiliateCards.forEach(card => {
        const inner = card.querySelector('.affiliate-card-inner');
        const glow = card.querySelector('.affiliate-glow');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update glow position
            glow.style.setProperty('--x', `${x}px`);
            glow.style.setProperty('--y', `${y}px`);
            
            // Calculate rotation for 3D tilt
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
    newsletter.init(); // ADD NEWSLETTER INITIALIZATION

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
// Newsletter helper functions
window.checkNewsletterSubscribers = function() {
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    console.log('📧 Newsletter Subscribers (' + subscribers.length + ' total):');
    console.table(subscribers);
    return subscribers;
};
function updateMetaTags(article) {
    document.title = article.title + " - TopPicksOnline";
    document.querySelector('meta[name="description"]').content = article.description;
};