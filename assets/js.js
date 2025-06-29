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
        <div class="tutorial-card animate-in" onclick="navigateTo('/${tutorial.id}')" data-category="${tutorial.category}">
            <div class="tutorial-thumbnail">${console.log(tutorial), tutorial.image ? `<img src="${tutorial.image}" alt="${tutorial.title}">` : ''}</div>
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
        image: (block) => `<img src="${block.src}" alt="${block.alt || ''}" />`
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
        
        <div class="sidebar-ad">
            <div>Advertisement</div>
        </div>
    `;
    
setTimeout(initAffiliateCards, 100);
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
                <div class="search-result-item" onclick="navigateTo('/${article.id}')">
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
    } else if (path.startsWith('/category/')) {
        const categorySlug = path.substring('/category/'.length);
        const categoryData = await fetchJSON(`/assets/data/pages/categories/categories/${categorySlug}.json`);
        renderCategoryPage(categoryData);
    } else {
        const pageName = path.substring(1);
        const pageData = await fetchJSON(`/assets/data/pages/${pageName}.json`);
        renderArticle(pageData);
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