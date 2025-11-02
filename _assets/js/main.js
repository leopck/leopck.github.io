/**
 * Main JavaScript functionality for Fridays with Faraday
 * Handles global interactions and initializes components
 */

(function() {
  'use strict';

  // DOM Ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeSite();
  });

  /**
   * Initialize site functionality
   */
  function initializeSite() {
    setupNavigation();
    setupSearchOverlay();
    setupBackToTop();
    setupCodeCopyButtons();
    setupReadingProgress();
    setupSmoothScrolling();
    setupThemeToggle();
  }

  /**
   * Setup navigation functionality
   */
  function setupNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    
    if (navToggle && mobileMenu) {
      // Toggle mobile menu
      navToggle.addEventListener('click', function() {
        const isOpen = mobileMenu.classList.contains('open');
        
        if (isOpen) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });
      
      // Close menu buttons
      if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
      }
      
      if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', closeMobileMenu);
      }
      
      // Close menu on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
          closeMobileMenu();
        }
      });
      
      // Handle dropdown menus
      const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
      dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
          e.preventDefault();
          const dropdown = this.parentElement;
          const menu = dropdown.querySelector('.nav-dropdown-menu');
          const isExpanded = this.getAttribute('aria-expanded') === 'true';
          
          this.setAttribute('aria-expanded', !isExpanded);
          dropdown.classList.toggle('open');
        });
      });
    }
  }

  /**
   * Open mobile menu
   */
  function openMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (mobileMenu) {
      mobileMenu.classList.add('open');
      document.body.classList.add('menu-open');
      
      if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'true');
      }
      
      if (mobileNavOverlay) {
        mobileNavOverlay.classList.add('active');
      }
      
      // Focus first menu item
      const firstMenuItem = mobileMenu.querySelector('a, button');
      if (firstMenuItem) {
        setTimeout(() => firstMenuItem.focus(), 100);
      }
    }
  }

  /**
   * Close mobile menu
   */
  function closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const navToggle = document.querySelector('.nav-toggle');
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    
    if (mobileMenu) {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
      
      if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
      }
      
      if (mobileNavOverlay) {
        mobileNavOverlay.classList.remove('active');
      }
      
      // Close any open dropdowns
      dropdownToggles.forEach(toggle => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.parentElement.classList.remove('open');
      });
    }
  }

  /**
   * Setup search overlay functionality
   */
  function setupSearchOverlay() {
    const searchToggle = document.querySelector('.nav-search-toggle');
    const searchOverlay = document.querySelector('.search-overlay');
    const searchClose = document.querySelector('.search-close');
    const searchInput = document.getElementById('search-input');
    
    if (searchToggle && searchOverlay) {
      // Toggle search overlay
      searchToggle.addEventListener('click', function() {
        const isOpen = searchOverlay.classList.contains('open');
        
        if (isOpen) {
          closeSearchOverlay();
        } else {
          openSearchOverlay();
        }
      });
      
      // Close search buttons
      if (searchClose) {
        searchClose.addEventListener('click', closeSearchOverlay);
      }
      
      // Close on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchOverlay.classList.contains('open')) {
          closeSearchOverlay();
        }
        
        // Open search with Ctrl+K or Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          openSearchOverlay();
        }
      });
      
      // Search functionality
      if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            // Navigate to search results page
            const query = searchInput.value.trim();
            if (query) {
              window.location.href = `/search?q=${encodeURIComponent(query)}`;
            }
          }
        });
      }
    }
  }

  /**
   * Open search overlay
   */
  function openSearchOverlay() {
    const searchOverlay = document.querySelector('.search-overlay');
    const searchInput = document.getElementById('search-input');
    
    if (searchOverlay) {
      searchOverlay.classList.add('open');
      document.body.classList.add('search-open');
      
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }
  }

  /**
   * Close search overlay
   */
  function closeSearchOverlay() {
    const searchOverlay = document.querySelector('.search-overlay');
    const searchInput = document.getElementById('search-input');
    
    if (searchOverlay) {
      searchOverlay.classList.remove('open');
      document.body.classList.remove('search-open');
      
      if (searchInput) {
        searchInput.value = '';
      }
      
      // Clear search results
      const searchResults = document.getElementById('search-results');
      if (searchResults) {
        searchResults.innerHTML = '';
      }
    }
  }

  /**
   * Handle search input
   */
  function handleSearch(e) {
    const query = e.target.value.trim();
    const searchResults = document.getElementById('search-results');
    
    if (!searchResults) return;
    
    if (query.length < 2) {
      searchResults.innerHTML = '<div class="search-help">Type at least 2 characters to search</div>';
      return;
    }
    
    // Simple client-side search (in a real implementation, this would be server-side)
    searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
    
    // Simulate search delay
    setTimeout(() => {
      const posts = window.sitePosts || []; // This would be populated with actual post data
      const results = posts.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.description.toLowerCase().includes(query.toLowerCase()) ||
        post.content.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      
      displaySearchResults(results, query);
    }, 200);
  }

  /**
   * Display search results
   */
  function displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    
    if (!searchResults) return;
    
    if (results.length === 0) {
      searchResults.innerHTML = `<div class="no-results">No results found for "${query}"</div>`;
      return;
    }
    
    const resultsHTML = results.map(post => `
      <div class="search-result">
        <a href="${post.url}">
          <h4>${highlightText(post.title, query)}</h4>
          <p>${highlightText(post.description || post.excerpt, query)}</p>
          <div class="search-meta">
            <span class="category">${post.category}</span>
            <span class="date">${formatDate(post.date)}</span>
          </div>
        </a>
      </div>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
  }

  /**
   * Highlight search terms in text
   */
  function highlightText(text, query) {
    if (!text) return '';
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special regex characters
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Format date
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Setup back to top button
   */
  function setupBackToTop() {
    const backToTopButton = document.querySelector('.back-to-top');
    
    if (backToTopButton) {
      // Show/hide button based on scroll position
      window.addEventListener('scroll', throttle(() => {
        if (window.pageYOffset > 300) {
          backToTopButton.classList.add('visible');
        } else {
          backToTopButton.classList.remove('visible');
        }
      }, 100));
      
      // Scroll to top on click
      backToTopButton.addEventListener('click', function() {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  /**
   * Setup code copy buttons
   */
  function setupCodeCopyButtons() {
    // Add copy buttons to code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-btn';
      copyButton.innerHTML = '<i class="icon-copy"></i>';
      copyButton.setAttribute('aria-label', 'Copy code to clipboard');
      
      pre.parentElement.insertBefore(copyButton, pre);
      
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent);
          
          // Show success feedback
          copyButton.innerHTML = '<i class="icon-check"></i>';
          copyButton.classList.add('success');
          
          setTimeout(() => {
            copyButton.innerHTML = '<i class="icon-copy"></i>';
            copyButton.classList.remove('success');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      });
    });
  }

  /**
   * Setup reading progress indicator
   */
  function setupReadingProgress() {
    const progressBar = document.querySelector('.reading-progress');
    
    if (progressBar) {
      window.addEventListener('scroll', throttle(() => {
        const article = document.querySelector('article');
        if (!article) return;
        
        const articleHeight = article.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        const articleTop = article.offsetTop;
        const articleBottom = articleTop + articleHeight;
        
        const progress = Math.max(0, Math.min(100, 
          ((scrollTop - articleTop) / (articleHeight - windowHeight)) * 100
        ));
        
        progressBar.style.width = `${progress}%`;
      }, 50));
    }
  }

  /**
   * Setup smooth scrolling for anchor links
   */
  function setupSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        if (href === '#') return;
        
        const target = document.querySelector(href);
        
        if (target) {
          e.preventDefault();
          
          const headerHeight = document.querySelector('.main-navigation').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Setup theme toggle (for future dark mode implementation)
   */
  function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
      
      // Load saved theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
      }
    }
  }

  /**
   * Utility function: debounce
   */
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

  /**
   * Utility function: throttle
   */
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Export functions for use in other scripts
  window.FaradaySite = {
    openMobileMenu,
    closeMobileMenu,
    openSearchOverlay,
    closeSearchOverlay
  };

})();
