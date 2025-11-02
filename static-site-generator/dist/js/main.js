// Enhanced Site Functionality
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initSearch();
    initTableOfContents();
    initThemeToggle();
    initSmoothScrolling();
    initProgressReading();
    initCopyCode();
});

// Mobile Menu Toggle
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger
            const spans = navToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translateY(7px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translateY(-7px)';
            } else {
                spans.forEach(span => {
                    span.style.transform = 'none';
                    span.style.opacity = '1';
                });
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navMenu && navMenu.classList.contains('active')) {
            if (!e.target.closest('nav')) {
                navMenu.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.transform = 'none';
                    span.style.opacity = '1';
                });
            }
        }
    });
}

// Search Functionality
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchIndex) return;

    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (query.length < 2) {
                hideSearchResults();
                return;
            }
            
            const results = searchPosts(query);
            displaySearchResults(results, query);
        }, 300);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-search')) {
            hideSearchResults();
        }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const results = searchResults.querySelectorAll('.search-result-item');
        const active = searchResults.querySelector('.search-result-item.active');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!active) {
                results[0]?.classList.add('active');
            } else {
                active.classList.remove('active');
                active.nextElementSibling?.classList.add('active');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!active) {
                results[results.length - 1]?.classList.add('active');
            } else {
                active.classList.remove('active');
                active.previousElementSibling?.classList.add('active');
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            active?.click();
        } else if (e.key === 'Escape') {
            hideSearchResults();
            searchInput.blur();
        }
    });
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-title">No results found</div></div>';
    } else {
        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="window.location.href='${result.url}'">
                <div class="search-result-title">${highlightSearchTerm(result.title, query)}</div>
                <div class="search-result-desc">${highlightSearchTerm(result.description.substring(0, 100), query)}...</div>
                <div class="search-result-meta">
                    <span class="search-result-tag">${result.category}</span>
                    <span>${result.readingTime}</span>
                    <span>${result.difficulty}</span>
                </div>
            </div>
        `).join('');
    }
    
    searchResults.style.display = 'block';
}

function hideSearchResults() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Table of Contents Functionality
function initTableOfContents() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (tocLinks.length === 0 || headers.length === 0) return;
    
    // Create intersection observer for TOC highlighting
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            const tocLink = document.querySelector(`.toc-link[href="#${id}"]`);
            
            if (entry.isIntersecting) {
                // Remove active class from all links
                tocLinks.forEach(link => link.classList.remove('active'));
                // Add active class to current link
                tocLink?.classList.add('active');
            }
        });
    }, {
        rootMargin: '-100px 0px -66% 0px'
    });
    
    headers.forEach(header => {
        if (header.id) {
            observer.observe(header);
        }
    });
    
    // Smooth scroll for TOC links
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without triggering scroll
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
}

// Theme Toggle
function initThemeToggle() {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Smooth Scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            }
        });
    });
}

// Reading Progress Indicator
function initProgressReading() {
    if (document.querySelector('.content-section')) {
        createProgressIndicator();
    }
}

function createProgressIndicator() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.innerHTML = '<div class="reading-progress-fill"></div>';
    
    // Add CSS for progress bar
    const style = document.createElement('style');
    style.textContent = `
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: rgba(59, 130, 246, 0.1);
            z-index: 1000;
        }
        
        .reading-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--accent), var(--success));
            width: 0%;
            transition: width 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    window.addEventListener('scroll', updateReadingProgress);
}

function updateReadingProgress() {
    const contentSection = document.querySelector('.content-section');
    const progressFill = document.querySelector('.reading-progress-fill');
    
    if (!contentSection || !progressFill) return;
    
    const contentTop = contentSection.offsetTop;
    const contentHeight = contentSection.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    
    const progress = Math.min(100, Math.max(0, 
        ((scrollTop - contentTop + windowHeight) / contentHeight) * 100
    ));
    
    progressFill.style.width = progress + '%';
}

// Copy Code Functionality
function initCopyCode() {
    const codeBlocks = document.querySelectorAll('pre');
    
    codeBlocks.forEach(block => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = '📋 Copy';
        copyButton.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        block.style.position = 'relative';
        block.appendChild(copyButton);
        
        block.addEventListener('mouseenter', () => {
            copyButton.style.opacity = '1';
        });
        
        block.addEventListener('mouseleave', () => {
            copyButton.style.opacity = '0';
        });
        
        copyButton.addEventListener('click', async () => {
            const code = block.querySelector('code')?.textContent || block.textContent;
            try {
                await navigator.clipboard.writeText(code);
                copyButton.innerHTML = '✅ Copied!';
                setTimeout(() => {
                    copyButton.innerHTML = '📋 Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
            }
        });
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


================================================
================================================
references:
  - v+
  - master
name-template: 'v$RESOLVED_VERSION 🌈'
tag-template: 'v$RESOLVED_VERSION'
categories:
  - title: '🚀 Features'
    labels:
      - 'feature'
      - 'enhancement'
  - title: '🐛 Bug Fixes'
    labels:
      - 'fix'
      - 'bugfix'
      - 'bug'
  - title: '🧰 Maintenance'
    label: 
      - 'chore'
      - 'dependencies'
change-template: '- $TITLE @$AUTHOR (#$NUMBER)'
version-resolver:
  major:
    labels:
      - 'next-major-release'
  minor:
    labels:
      - 'next-minor-release'
  patch:
    labels:
      - 'patch'
  default: minor
template: |
  ## Changes

  $CHANGES


