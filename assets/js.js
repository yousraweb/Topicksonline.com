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
            <div class="tutorial-thumbnail">${tutorial.image ? `<img src="${tutorial.image}" alt="${tutorial.title}" onerror="this.style.display='none'">` : ''}</div>
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
    const contentBlocks = {
        text: (block) => `<p>${block.content}</p>`,
        heading2: (block) => `<h2>${block.content}</h2>`,
        heading3: (block) => `<h3>${block.content}</h3>`,
        code: (block) => `<div class="code-block"><pre>${block.content}</pre></div>`,
        tip: (block) => `<div class="tip-box">💡 ${block.content}</div>`,
        warning: (block) => `<div class="warning-box">⚠️ ${block.content}</div>`,
        affiliate: (block) => `
            <a href="${block.link}" class="affiliate-card" target="_blank" rel="noopener" id="affiliate-${Math.random().toString(36).substr(2, 9)}">
            <div class="affiliate-card-inner">
            <div class="glowing">
                <span style="--i:1;"></span>
                <span style="--i:2;"></span>
                <span style="--i:3;"></span>
                <span style="--i:4;"></span>
                <span style="--i:5;"></span>
            </div>
                    <div class="affiliate-glow"></div>
                    <div class="affiliate-content">
                        <div class="affiliate-text">
                            <span class="affiliate-label">${block.label || 'Special Offer'}</span>
                            <h3 class="affiliate-title">${block.content}</h3>
                            ${block.description ? `<p class="affiliate-description">${block.description}</p>` : ''}
                        </div>
                        <div class="affiliate-button">
                            Get Started →
                        </div>
                    </div>
                </div>
            </a>
        `,
        image: (block) => `<img src="${block.src}" alt="${block.alt || ''}" onerror="this.style.display='none'" />`,
        conclusion: (block) => `<div class="conclusion-box"><h3>Conclusion</h3><p>${block.content}</p></div>`
    };

    const contentHTML = articleData.content?.map(block => 
        contentBlocks[block.type] ? contentBlocks[block.type](block) : ''
    ).join('') || '';

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
    document.title = 'TopPicksOnline - One Blog. Every Topic.';
    
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
        cta: (block) => `<div class="cta-section"><p>${block.text}</p></div>`
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