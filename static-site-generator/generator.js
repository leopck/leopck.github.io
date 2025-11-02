const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Simple YAML parser implementation
function parseYAML(yamlString) {
  const result = {};
  const lines = yamlString.split('\n');
  let currentKey = null;
  let currentArray = null;
  let arrayIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.match(/^ */)[0].length;
    const trimmedLine = line.trim();

    // Handle arrays
    if (trimmedLine.startsWith('- ')) {
      const value = trimmedLine.substring(2).trim();
      if (currentArray && indent > arrayIndent) {
        currentArray.push(value);
      } else if (currentKey) {
        if (!result[currentKey] || !Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        result[currentKey].push(value);
        currentArray = result[currentKey];
        arrayIndent = indent;
      }
      continue;
    }

    // Handle key-value pairs
    if (trimmedLine.includes(':')) {
      const [key, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').trim();

      // Reset array context if we're at the same or lower indentation
      if (indent <= arrayIndent) {
        currentArray = null;
        arrayIndent = 0;
      }

      if (value === '') {
        // This is a section header
        currentKey = key.trim();
        if (!result[currentKey]) {
          result[currentKey] = {};
        }
      } else {
        // This is a key-value pair
        result[key.trim()] = parseYAMLValue(value);
      }
    }
  }

  return result;
}

function parseYAMLValue(value) {
  // Try to parse as number
  if (!isNaN(value) && value !== '') {
    return Number(value);
  }

  // Parse boolean values
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (value.toLowerCase() === 'null') return null;

  // Return string as-is
  return value;
}

// Configuration
const CONFIG = {
  postsDirectory: 'posts',
  outputDirectory: 'static-site-generator/dist',
  assetsDirectory: 'static-site-generator/assets',
  basePath: '',
  siteUrl: 'https://your-domain.com', // Update with your actual site URL
  siteTitle: 'Fridays with Faraday',
  siteDescription: 'Working with microcontrollers, embedded systems, and performance optimization'
};

// Utility functions
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function extractTitleFromMarkdown(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return 'Untitled';
}

function extractDescriptionFromMarkdown(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && !line.startsWith('```') && !line.startsWith('|')) {
      return line.trim().substring(0, 200);
    }
  }
  return '';
}

function extractCategoryFromPath(filePath) {
  const parts = filePath.split('/');
  const postsIndex = parts.indexOf('posts');
  if (postsIndex !== -1 && postsIndex < parts.length - 1) {
    return parts[postsIndex + 1];
  }
  return 'experiments';
}

function generateSlug(filePath) {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.md$/, '');
}

// Enhanced YAML front matter parsing
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (match) {
    try {
      const frontMatter = parseYAML(match[1]);
      const body = match[2];
      return { frontMatter, body };
    } catch (error) {
      console.warn('⚠️  Error parsing YAML front matter:', error.message);
      console.warn('⚠️  Using fallback parsing for:', match[1].split('\n')[0]);
      return { frontMatter: {}, body: content };
    }
  }
  
  return { frontMatter: {}, body: content };
}

// Extract headers for table of contents
function extractHeaders(content) {
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  const headers = [];
  let match;
  
  while ((match = headerRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    headers.push({ level, text, id });
  }
  
  return headers;
}

// Generate table of contents HTML
function generateTableOfContents(headers) {
  if (headers.length === 0) return '';
  
  let tocHtml = '<nav class="table-of-contents"><h3>Table of Contents</h3><ul>';
  
  for (const header of headers) {
    const indent = '&nbsp;'.repeat((header.level - 1) * 2);
    tocHtml += `<li style="margin-left: ${(header.level - 1) * 20}px">` +
               `<a href="#${header.id}" class="toc-link">${header.text}</a></li>`;
  }
  
  tocHtml += '</ul></nav>';
  return tocHtml;
}

// Calculate reading time and word count
function calculateReadingMetrics(content) {
  const words = content.trim().split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const readingTimeMinutes = Math.ceil(words / 200); // Average reading speed: 200 words per minute
  
  return {
    wordCount: words,
    sentenceCount: sentences,
    readingTimeMinutes,
    readingTimeText: readingTimeMinutes === 1 ? '1 min read' : `${readingTimeMinutes} min read`
  };
}

// Generate enhanced markdown with anchor IDs
function enhanceMarkdownWithAnchors(markdown) {
  return markdown.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    return `${hashes} ${text} {#${id}}`;
  });
}

// Estimate difficulty level
function estimateDifficulty(content) {
  const avgWordsPerSentence = content.split(/\s+/).length / 
    Math.max(1, content.split(/[.!?]+/).filter(s => s.trim().length > 0).length);
  
  const technicalTerms = (content.match(/\b(algorithm|optimization|performance|architecture|implementation|benchmark|analysis|framework|configuration|specification|performance|cache|memory|bandwidth|throughput|optimization|parallel|concurrent|synchronous|asynchronous)\b/gi) || []).length;
  const technicalTermDensity = technicalTerms / (content.split(/\s+/).length / 100);
  
  let difficulty = 'Beginner';
  if (avgWordsPerSentence > 15 && technicalTermDensity > 2) {
    difficulty = 'Advanced';
  } else if (avgWordsPerSentence > 12 || technicalTermDensity > 1) {
    difficulty = 'Intermediate';
  }
  
  return difficulty;
}

// Find related posts based on tags and category
function findRelatedPosts(currentPost, allPosts, limit = 3) {
  const currentTags = Array.isArray(currentPost.tags) ? currentPost.tags : [];
  
  const related = allPosts
    .filter(post => post.slug !== currentPost.slug)
    .map(post => {
      let score = 0;
      const postTags = Array.isArray(post.tags) ? post.tags : [];
      
      // Category match (higher weight)
      if (post.category === currentPost.category) {
        score += 3;
      }
      
      // Tag matches (highest weight)
      const commonTags = postTags.filter(tag => 
        currentTags.includes(tag)
      );
      score += commonTags.length * 2;
      
      return { post, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
  
  return related;
}

// Enhanced markdown to HTML converter with anchor support
function markdownToHtml(markdown) {
  let html = markdown;

  // Headers with IDs
  html = html.replace(/^##### (.*?)\s*\{#([^}]+)\}/gim, '<h5 id="$2">$1</h5>');
  html = html.replace(/^#### (.*?)\s*\{#([^}]+)\}/gim, '<h4 id="$2">$1</h4>');
  html = html.replace(/^### (.*?)\s*\{#([^}]+)\}/gim, '<h3 id="$2">$1</h3>');
  html = html.replace(/^## (.*?)\s*\{#([^}]+)\}/gim, '<h2 id="$2">$1</h2>');
  html = html.replace(/^# (.*?)\s*\{#([^}]+)\}/gim, '<h1 id="$2">$1</h1>');

  // Headers without IDs (backward compatibility)
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    if (lang === 'terminal' || lang === 'bash') {
      return `
<div class="terminal">
  <div class="terminal-header">
    <div class="terminal-dot" style="background: #ff5f56;"></div>
    <div class="terminal-dot" style="background: #ffbd2e;"></div>
    <div class="terminal-dot" style="background: #27c93f;"></div>
  </div>
  <div class="terminal-content">
    <pre>${escapeHtml(code.trim())}</pre>
  </div>
</div>`;
    }
    return `<div class="code-block"><pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre></div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Tables
  html = html.replace(/\|(.+)\|/g, (match, row) => {
    const cells = row.split('|').map(cell => `<td>${cell.trim()}</td>`).join('');
    return `<tr>${cells}</tr>`;
  });

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Wrap paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');

  return html;
}

function createNavigation(currentPath = '/') {
  const isActive = (path) => currentPath === path ? 'active' : '';
  
  return `
<nav>
  <div class="container">
    <a href="${CONFIG.basePath}/" class="logo">
      <span class="logo-f">f</span><span class="logo-slash">/</span><span class="logo-f">f</span>
    </a>
    <ul class="nav-menu">
      <li><a href="${CONFIG.basePath}/#work">Work</a></li>
      <li><a href="${CONFIG.basePath}/experiments.html" class="${isActive('/experiments.html')}">Experiments</a></li>
      <li><a href="mailto:your.email@example.com">Contact</a></li>
    </ul>
    <div class="nav-search">
      <input type="text" id="search-input" placeholder="Search posts..." />
      <div id="search-results" class="search-results"></div>
    </div>
    <button class="nav-toggle" aria-label="Toggle menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</nav>`;
}

function createFooter() {
  return `
<footer>
  <div class="container">
    <div class="footer-content">
      <div class="footer-logo">
        <span class="logo-f">f</span><span class="logo-slash">/</span><span class="logo-f">f</span>
      </div>
      <p>Fridays with Faraday - Working with microcontrollers and embedded systems</p>
    </div>
  </div>
</footer>`;
}

function generatePostCard(post) {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const tagsHtml = tags.slice(0, 3)
    .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');

  const category = post.category || 'experiments';
  const href = `${category}/${post.slug}.html`;

  return `
<article class="project-card" data-category="${category}" data-tags="${tags.join(',')}" data-title="${escapeHtml(post.title)}" data-description="${escapeHtml(post.description)}">
  <div class="project-header">
    ${tagsHtml}
  </div>
  <h3><a href="${href}">${escapeHtml(post.title)}</a></h3>
  <p>${escapeHtml(post.description)}</p>
  <div class="project-meta">
    <div class="meta-item">
      <span class="meta-icon">📅</span>
      <span>${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
    </div>
    <div class="meta-item">
      <span class="meta-icon">📖</span>
      <span>${post.readingTime}</span>
    </div>
    <div class="meta-item">
      <span class="meta-icon">🎯</span>
      <span>${post.difficulty}</span>
    </div>
    <div class="meta-item">
      <span class="meta-icon">📂</span>
      <span>${category}</span>
    </div>
  </div>
</article>`;
}

async function loadPosts() {
  const posts = [];
  const categories = ['experiments', 'esp32', 'gaudi', 'graphics', 'llm', 'vllm'];

  for (const category of categories) {
    const categoryPath = path.join(CONFIG.postsDirectory, category);
    if (!fs.existsSync(categoryPath)) continue;

    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Parse front matter
      const { frontMatter, body } = parseFrontMatter(content);
      
      // Calculate metrics
      const metrics = calculateReadingMetrics(body);
      const difficulty = estimateDifficulty(body);
      
      // Extract headers for TOC
      const headers = extractHeaders(body);
      
      // Generate enhanced markdown with anchor IDs
      const enhancedMarkdown = enhanceMarkdownWithAnchors(body);
      
      const post = {
        title: frontMatter.title || extractTitleFromMarkdown(body),
        description: frontMatter.description || extractDescriptionFromMarkdown(body),
        date: frontMatter.date || new Date().toISOString().split('T')[0],
        category: frontMatter.category || category,
        tags: frontMatter.tags || [],
        difficulty: frontMatter.difficulty || difficulty,
        slug: generateSlug(file),
        content: body,
        enhancedContent: enhancedMarkdown,
        html: markdownToHtml(enhancedMarkdown),
        wordCount: metrics.wordCount,
        readingTime: metrics.readingTimeText,
        readingTimeMinutes: metrics.readingTimeMinutes,
        headers: headers,
        hasTOC: headers.length > 3 // Show TOC if more than 3 headers
      };

      posts.push(post);
    }
  }

  // Sort by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

async function generateIndex(posts) {
  const template = fs.readFileSync('templates/index.html', 'utf-8');
  const baseTemplate = fs.readFileSync('templates/base.html', 'utf-8');

  const recentPosts = posts.slice(0, 3);
  const postCards = recentPosts.map(post => generatePostCard(post)).join('\n');

  const content = template.replace('{{content}}', postCards);

  const html = baseTemplate
    .replace('{{navigation}}', createNavigation('/'))
    .replace('{{footer}}', createFooter())
    .replace('{{content}}', content)
    .replace(/{{title}}/g, 'f/f - Fridays with Faraday')
    .replace(/{{description}}/g, 'Working with microcontrollers, embedded systems, and performance optimization')
    .replace(/{{basePath}}/g, CONFIG.basePath);

  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'index.html'), html);
  console.log('✓ Generated index.html');
}

async function generateExperimentsPage(posts) {
  const template = fs.readFileSync('templates/experiments.html', 'utf-8');
  const baseTemplate = fs.readFileSync('templates/base.html', 'utf-8');

  const postCards = posts.map(post => generatePostCard(post)).join('\n');
  const content = template.replace('{{content}}', postCards);

  const html = baseTemplate
    .replace('{{navigation}}', createNavigation('/experiments.html'))
    .replace('{{footer}}', createFooter())
    .replace('{{content}}', content)
    .replace(/{{title}}/g, 'Experiments - Fridays with Faraday')
    .replace(/{{description}}/g, 'Embedded systems experiments and microcontroller projects')
    .replace(/{{basePath}}/g, CONFIG.basePath);

  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'experiments.html'), html);
  console.log('✓ Generated experiments.html');
}

function generateSocialSharingLinks(post) {
  const url = `${CONFIG.siteUrl}/${post.category}/${post.slug}.html`;
  const title = encodeURIComponent(post.title);
  const description = encodeURIComponent(post.description);
  
  return `
    <div class="social-sharing">
      <h4>Share this post</h4>
      <div class="share-buttons">
        <a href="https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(url)}" 
           target="_blank" rel="noopener" class="share-btn twitter">Twitter</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" 
           target="_blank" rel="noopener" class="share-btn linkedin">LinkedIn</a>
        <a href="mailto:?subject=${title}&body=${description}%0A%0A${encodeURIComponent(url)}" 
           class="share-btn email">Email</a>
        <button onclick="navigator.clipboard.writeText('${url}'); this.innerHTML='Copied!'; setTimeout(() => this.innerHTML='Copy Link', 2000);" 
                class="share-btn copy">Copy Link</button>
      </div>
    </div>
  `;
}

function generatePostNavigation(posts, currentIndex) {
  const prevPost = posts[currentIndex - 1];
  const nextPost = posts[currentIndex + 1];
  
  let navHtml = '<div class="post-navigation">';
  
  if (prevPost) {
    navHtml += `<div class="nav-previous">
                  <a href="${prevPost.category}/${prevPost.slug}.html">
                    <span class="nav-label">← Previous</span>
                    <span class="nav-title">${escapeHtml(prevPost.title)}</span>
                  </a>
                </div>`;
  }
  
  if (nextPost) {
    navHtml += `<div class="nav-next">
                  <a href="${nextPost.category}/${nextPost.slug}.html">
                    <span class="nav-label">Next →</span>
                    <span class="nav-title">${escapeHtml(nextPost.title)}</span>
                  </a>
                </div>`;
  }
  
  navHtml += '</div>';
  return navHtml;
}

function generateRelatedPostsSection(relatedPosts, currentPost) {
  if (relatedPosts.length === 0) return '';
  
  const relatedHtml = `
    <section class="related-posts">
      <h3>Related Posts</h3>
      <div class="related-grid">
        ${relatedPosts.map(relatedPost => `
          <article class="related-post">
            <h4><a href="${relatedPost.category}/${relatedPost.slug}.html">${escapeHtml(relatedPost.title)}</a></h4>
            <p>${escapeHtml(relatedPost.description.substring(0, 120))}...</p>
            <div class="related-meta">
              <span class="reading-time">${relatedPost.readingTime}</span>
              <span class="difficulty">${relatedPost.difficulty}</span>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
  
  return relatedHtml;
}

async function generateIndividualPosts(posts) {
  const template = fs.readFileSync('templates/post.html', 'utf-8');
  const baseTemplate = fs.readFileSync('templates/base.html', 'utf-8');

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const category = post.category || 'experiments';
    const outputDir = path.join(CONFIG.outputDirectory, category);
    ensureDirectoryExists(outputDir);

    // Generate enhanced tags HTML
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const tagsHtml = tags.length > 0 
      ? `<div class="experiment-meta">
           <div class="tags-container">
             ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
           </div>
         </div>`
      : '';

    // Generate TOC if needed
    const tocHtml = post.hasTOC ? generateTableOfContents(post.headers) : '';

    // Find related posts
    const relatedPosts = findRelatedPosts(post, posts, 3);

    // Generate social sharing
    const socialSharing = generateSocialSharingLinks(post);

    // Generate post navigation
    const postNavigation = generatePostNavigation(posts, i);

    // Generate related posts section
    const relatedPostsSection = generateRelatedPostsSection(relatedPosts, post);

    const enhancedTemplate = `
    <section class="experiment-header">
        <div class="container">
            <h1 class="experiment-title">${escapeHtml(post.title)}</h1>
            ${tagsHtml}
            <div class="post-header-meta">
              <div class="meta-row">
                <span class="meta-item">
                  <span class="meta-icon">📅</span>
                  <time datetime="${post.date}">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                </span>
                <span class="meta-item">
                  <span class="meta-icon">📖</span>
                  <span>${post.readingTime}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-icon">📝</span>
                  <span>${post.wordCount.toLocaleString()} words</span>
                </span>
                <span class="meta-item">
                  <span class="meta-icon">🎯</span>
                  <span class="difficulty-badge difficulty-${post.difficulty.toLowerCase()}">${post.difficulty}</span>
                </span>
              </div>
              <div class="post-actions">
                <button onclick="toggleDarkMode()" class="action-btn">🌓 Theme</button>
                <button onclick="window.print()" class="action-btn">🖨️ Print</button>
              </div>
            </div>
            <p class="post-description">${escapeHtml(post.description)}</p>
        </div>
    </section>

    <section>
        <div class="container">
            <div class="content-layout">
                ${tocHtml}
                <article class="content-section">
                    ${post.html}
                </article>
            </div>
            
            ${socialSharing}
            ${postNavigation}
            ${relatedPostsSection}
            
            <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                <a href="${CONFIG.basePath}/experiments.html" style="color: var(--accent); text-decoration: none;">← Back to all experiments</a>
            </div>
        </div>
    </section>`;

    const html = baseTemplate
      .replace('{{navigation}}', createNavigation('/experiments.html'))
      .replace('{{footer}}', createFooter())
      .replace('{{content}}', enhancedTemplate)
      .replace(/{{title}}/g, `${post.title} - ${CONFIG.siteTitle}`)
      .replace(/{{description}}/g, post.description)
      .replace(/{{basePath}}/g, CONFIG.basePath)
      // Add RSS feed link
      .replace('</head>', `    <link rel="alternate" type="application/rss+xml" title="${CONFIG.siteTitle}" href="${CONFIG.basePath}/feed.xml">
</head>`);

    const outputPath = path.join(outputDir, `${post.slug}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Generated: ${category}/${post.slug}.html`);
  }
}

async function generateRSSFeed(posts) {
  const feedItems = posts.slice(0, 20) // Latest 20 posts
    .map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description}]]></description>
      <link>${CONFIG.siteUrl}/${post.category}/${post.slug}.html</link>
      <guid isPermaLink="true">${CONFIG.siteUrl}/${post.category}/${post.slug}.html</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category><![CDATA[${post.category}]]></category>
      ${post.tags.map(tag => `<category><![CDATA[${tag}]]></category>`).join('')}
    </item>`).join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${CONFIG.siteTitle}]]></title>
    <description><![CDATA[${CONFIG.siteDescription}]]></description>
    <link>${CONFIG.siteUrl}</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${CONFIG.siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${feedItems}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'feed.xml'), rssFeed);
  console.log('✓ Generated RSS feed (feed.xml)');
}

async function generateSearchIndex(posts) {
  const searchIndex = posts.map(post => ({
    title: post.title,
    description: post.description,
    category: post.category,
    tags: post.tags,
    slug: post.slug,
    url: `${post.category}/${post.slug}.html`,
    readingTime: post.readingTime,
    difficulty: post.difficulty
  }));

  const searchJs = `// Search index for client-side search
const searchIndex = ${JSON.stringify(searchIndex, null, 2)};

// Search function
function searchPosts(query) {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase();
  return searchIndex.filter(post => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.description.toLowerCase().includes(searchTerm) ||
    post.category.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    post.difficulty.toLowerCase().includes(searchTerm)
  ).slice(0, 10);
}

// Highlight search results
function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm) return text;
  // Simple replacement without complex regex escaping
  const regex = new RegExp(searchTerm, 'gi');
  return text.replace(regex, '<mark>$&</mark>');
}`;

  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'js', 'search.js'), searchJs);
  console.log('✓ Generated search index (js/search.js)');
}

async function copyAssets() {
  // Copy CSS
  const cssSource = path.join(CONFIG.assetsDirectory, 'css', 'style.css');
  const cssDest = path.join(CONFIG.outputDirectory, 'css');
  ensureDirectoryExists(cssDest);
  fs.copyFileSync(cssSource, path.join(cssDest, 'style.css'));
  console.log('✓ Copied style.css');

  // Copy JS
  const jsSource = path.join(CONFIG.assetsDirectory, 'js', 'main.js');
  const jsDest = path.join(CONFIG.outputDirectory, 'js');
  ensureDirectoryExists(jsDest);
  fs.copyFileSync(jsSource, path.join(jsDest, 'main.js'));
  console.log('✓ Copied main.js');
}

async function main() {
  console.log('🚀 Starting enhanced site generation...\n');

  try {
    // Clean output directory
    if (fs.existsSync(CONFIG.outputDirectory)) {
      fs.rmSync(CONFIG.outputDirectory, { recursive: true });
    }
    ensureDirectoryExists(CONFIG.outputDirectory);

    // Load and process posts
    console.log('📖 Loading and processing posts...');
    const posts = await loadPosts();
    console.log(`✓ Loaded ${posts.length} posts with enhanced metadata\n`);

    // Generate pages
    console.log('🏗️  Generating pages...');
    await generateIndex(posts);
    await generateExperimentsPage(posts);
    await generateIndividualPosts(posts);
    console.log();

    // Copy assets first
    console.log('📦 Copying assets...');
    await copyAssets();
    
    // Generate enhanced features
    console.log('🔧 Generating enhanced features...');
    await generateRSSFeed(posts);
    await generateSearchIndex(posts);
    console.log();

    console.log('✅ Enhanced site generation complete!');
    console.log(`📁 Output directory: ${CONFIG.outputDirectory}`);
    console.log(`📝 Generated ${posts.length} posts with:`);
    console.log('   • Front matter metadata support');
    console.log('   • Automatic table of contents');
    console.log('   • Related posts suggestions');
    console.log('   • Client-side search functionality');
    console.log('   • RSS feed generation');
    console.log('   • Enhanced post features');
    console.log('   • Social sharing buttons');
    console.log('   • Post navigation');
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main();
