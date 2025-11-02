const fs = require('fs');
const path = require('path');

// Enhanced configuration with front matter support
const CONFIG = {
  postsDirectory: 'posts',
  outputDirectory: 'dist',
  assetsDirectory: 'static-site-generator/assets',
  basePath: ''
};

// Enhanced utility functions
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return {
      metadata: {
        title: extractTitleFromMarkdown(content),
        description: extractDescriptionFromMarkdown(content),
        date: new Date().toISOString().split('T')[0],
        tags: [],
        category: 'experiments',
        difficulty: 'intermediate'
      },
      content: content
    };
  }

  const metadata = {};
  const metadataLines = match[1].split('\n');
  
  metadataLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Handle arrays (tags)
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(tag => tag.trim().replace(/['"]/g, ''));
      }
      
      metadata[key] = value;
    }
  });

  return {
    metadata: {
      title: metadata.title || extractTitleFromMarkdown(match[2]),
      description: metadata.description || extractDescriptionFromMarkdown(match[2]),
      date: metadata.date || new Date().toISOString().split('T')[0],
      tags: metadata.tags || [],
      category: metadata.category || 'experiments',
      difficulty: metadata.difficulty || 'intermediate',
      author: metadata.author || 'Fridays with Faraday',
      readTime: metadata.readTime || estimateReadingTime(match[2])
    },
    content: match[2]
  };
}

function estimateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readTime} min read`;
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

function generateTableOfContents(content) {
  const lines = content.split('\n');
  const tocItems = [];
  let currentLevel = 0;
  
  lines.forEach(line => {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      const anchor = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      if (level <= 3) { // Only show H1-H3 in TOC
        tocItems.push({
          level,
          title,
          anchor,
          indent: '  '.repeat(level - 1)
        });
      }
    }
  });
  
  if (tocItems.length === 0) return '';
  
  return `
    <div class="toc">
      <h3>Table of Contents</h3>
      <nav class="toc-nav">
        ${tocItems.map(item => 
          `<a href="#${item.anchor}" class="toc-link toc-level-${item.level}">
            ${item.indent}${item.title}
          </a>`
        ).join('\n        ')}
      </nav>
    </div>
  `;
}

function findRelatedPosts(currentPost, allPosts, limit = 3) {
  const related = allPosts
    .filter(post => post.slug !== currentPost.slug)
    .map(post => {
      const tagMatches = post.tags.filter(tag => currentPost.tags.includes(tag)).length;
      const categoryMatch = post.category === currentPost.category ? 1 : 0;
      const score = tagMatches * 2 + categoryMatch;
      return { post, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
    
  return related;
}

function generateRSSFeed(posts) {
  const rssItems = posts.slice(0, 20).map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description}]]></description>
      <link>${CONFIG.basePath}/${post.category}/${post.slug}.html</link>
      <guid>${CONFIG.basePath}/${post.category}/${post.slug}.html</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category><![CDATA[${post.category}]]></category>
    </item>
  `).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Fridays with Faraday</title>
    <description>Working with microcontrollers, embedded systems, and performance optimization</description>
    <link>${CONFIG.basePath}/</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    
    ${rssItems}
  </channel>
</rss>`;
}

function createSearchIndex(posts) {
  const index = posts.map(post => ({
    title: post.title,
    description: post.description,
    category: post.category,
    tags: post.tags,
    url: `/${post.category}/${post.slug}.html`,
    content: post.content.substring(0, 500) // First 500 chars for search
  }));
  
  return index;
}

function generateEnhancedMarkdownToHtml(markdown, metadata) {
  let html = markdown;

  // Headers with IDs for TOC
  html = html.replace(/^### (.*$)/gim, (match, title) => {
    const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h3 id="${anchor}">${title}</h3>`;
  });
  html = html.replace(/^## (.*$)/gim, (match, title) => {
    const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h2 id="${anchor}">${title}</h2>`;
  });
  html = html.replace(/^# (.*$)/gim, (match, title) => {
    const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h1 id="${anchor}">${title}</h1>`;
  });

  // Enhanced code blocks
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
    <pre><code>${escapeHtml(code.trim())}</code></pre>
  </div>
</div>`;
    }
    return `<div class="code-block"><pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre></div>`;
  });

  // Bold, italics, etc.
  html = html.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<p>\s*<ul>/g, '<ul>');
  html = html.replace(/<\/ul>\s*<\/p>/g, '</ul>');

  // Tables
  html = html.replace(/\|(.+)\|/g, (match, row) => {
    const cells = row.split('|').map(cell => `<td>${cell.trim()}</td>`).join('');
    return `<tr>${cells}</tr>`;
  });

  // Wrap in paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
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
      <li><a href="${CONFIG.basePath}/search.html">Search</a></li>
      <li><a href="mailto:your.email@example.com">Contact</a></li>
    </ul>
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
      <div class="footer-links">
        <a href="${CONFIG.basePath}/rss.xml">RSS Feed</a>
        <a href="https://github.com/yourusername/yourusername.github.io">GitHub</a>
      </div>
    </div>
  </div>
</footer>`;
}

function generatePostCard(post) {
  const tags = post.tags || [];
  const tagsHtml = tags.slice(0, 2)
    .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');

  const category = post.category || 'experiments';
  const href = `${category}/${post.slug}.html`;

  return `
<article class="project-card">
  <div class="project-header">
    ${tagsHtml}
  </div>
  <h3><a href="${href}">${escapeHtml(post.title)}</a></h3>
  <p>${escapeHtml(post.description)}</p>
  <div class="project-metrics">
    <div class="metric">
      <span class="metric-value">${post.readTime}</span>
      <span class="metric-label">Read</span>
    </div>
    <div class="metric">
      <span class="metric-value">${post.difficulty}</span>
      <span class="metric-label">Level</span>
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
      const { metadata, content: markdownContent } = parseFrontMatter(content);
      
      const post = {
        ...metadata,
        slug: generateSlug(file),
        content: markdownContent,
        html: generateEnhancedMarkdownToHtml(markdownContent, metadata)
      };

      posts.push(post);
    }
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

async function generateEnhancedPages(posts) {
  console.log('🚀 Generating enhanced site...\n');

  // Generate enhanced index
  await generateIndex(posts);
  
  // Generate enhanced experiments page
  await generateExperimentsPage(posts);
  
  // Generate enhanced individual posts
  await generateIndividualPosts(posts);
  
  // Generate additional pages
  await generateSearchPage(posts);
  await generateRSSFeedFile(posts);
  
  // Copy enhanced assets
  await copyEnhancedAssets();
  
  console.log('\n✅ Enhanced site generation complete!');
  console.log(`📁 Output directory: ${CONFIG.outputDirectory}`);
  console.log(`📝 Generated ${posts.length} posts`);
}

async function generateIndex(posts) {
  const template = `
<section class="hero">
  <div class="container">
    <div class="hero-content">
      <h1>Working with<br>Microcontrollers</h1>
      <p>I write bare metal code, optimize performance, and occasionally break things. This is where I document what I learn.</p>
    </div>
    
    <div class="terminal">
      <div class="terminal-header">
        <div class="terminal-dot" style="background: #ff5f56;"></div>
        <div class="terminal-dot" style="background: #ffbd2e;"></div>
        <div class="terminal-dot" style="background: #27c93f;"></div>
      </div>
      <div class="terminal-content">
        <div class="terminal-line">
          <span class="prompt">$</span> <span class="command">cat current_setup.txt</span>
        </div>
        <div class="terminal-line output">
          Platform: ARM Cortex-M4 @ 168MHz
        </div>
        <div class="terminal-line output">
          Memory: 192KB RAM, 1MB Flash
        </div>
        <div class="terminal-line output">
          Toolchain: gcc-arm-none-eabi -O3
        </div>
        <div class="terminal-line">
          <span class="prompt">$</span> <span class="command">./run_benchmark</span>
        </div>
        <div class="terminal-line output" style="color: #10b981;">
          Baseline: 2847 cycles → Optimized: 847 cycles
        </div>
      </div>
    </div>
  </div>
</section>

<section id="work">
  <div class="container">
    <div class="section-header">
      <h2>What I Work On</h2>
      <p>Mostly microcontrollers and getting them to do more with less</p>
    </div>
    
    <div class="tech-grid">
      <div class="tech-card">
        <div class="tech-icon">⚡</div>
        <h3>Real-Time Systems</h3>
        <p>RTOS implementations, interrupt-driven code, trying to keep timing deterministic on tiny MCUs</p>
      </div>
      <div class="tech-card">
        <div class="tech-icon">🔧</div>
        <h3>Performance</h3>
        <p>Sometimes Assembly, DMA when it makes sense, profiling with cycle counters</p>
      </div>
      <div class="tech-card">
        <div class="tech-icon">📡</div>
        <h3>Wireless Stuff</h3>
        <p>BLE, LoRa, ESP-NOW. Usually trying to reduce power consumption or increase throughput</p>
      </div>
      <div class="tech-card">
        <div class="tech-icon">🎯</div>
        <h3>Bare Metal</h3>
        <p>Direct register access, custom bootloaders, avoiding HAL libraries when they get in the way</p>
      </div>
    </div>
  </div>
</section>

<section id="recent">
  <div class="container">
    <div class="section-header">
      <h2>Recent Experiments</h2>
      <p>Things I've been working on lately</p>
    </div>
    
    <div class="project-grid">
      {{content}}
    </div>

    <div style="text-align: center; margin-top: 3rem;">
      <a href="experiments.html" class="btn">View All Experiments</a>
    </div>
  </div>
</section>`;

  const recentPosts = posts.slice(0, 3);
  const postCards = recentPosts.map(post => generatePostCard(post)).join('\n');
  const content = template.replace('{{content}}', postCards);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>f/f - Fridays with Faraday</title>
  <meta name="description" content="Working with microcontrollers, embedded systems, and performance optimization">
  <link rel="stylesheet" href="css/style.css">
  <link rel="alternate" type="application/rss+xml" title="Fridays with Faraday" href="rss.xml">
</head>
<body>
  <div class="background"></div>
  <div class="grid-overlay"></div>

  ${createNavigation('/')}

  ${content}

  ${createFooter()}

  <script src="js/main.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'index.html'), html);
  console.log('✓ Generated enhanced index.html');
}

async function generateExperimentsPage(posts) {
  const template = `
<section style="padding-top: 8rem;">
  <div class="container">
    <div class="section-header">
      <h2>All Experiments</h2>
      <p>Documenting what works, what doesn't, and what I learned along the way</p>
    </div>
    
    <div class="project-grid">
      {{content}}
    </div>
  </div>
</section>`;

  const postCards = posts.map(post => generatePostCard(post)).join('\n');
  const content = template.replace('{{content}}', postCards);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Experiments - Fridays with Faraday</title>
  <meta name="description" content="Embedded systems experiments and microcontroller projects">
  <link rel="stylesheet" href="css/style.css">
  <link rel="alternate" type="application/rss+xml" title="Fridays with Faraday" href="rss.xml">
</head>
<body>
  <div class="background"></div>
  <div class="grid-overlay"></div>

  ${createNavigation('/experiments.html')}

  ${content}

  ${createFooter()}

  <script src="js/main.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'experiments.html'), html);
  console.log('✓ Generated enhanced experiments.html');
}

async function generateIndividualPosts(posts) {
  for (const post of posts) {
    await generatePost(posts, post);
  }
}

async function generatePost(allPosts, post) {
  const category = post.category || 'experiments';
  const outputDir = path.join(CONFIG.outputDirectory, category);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const toc = generateTableOfContents(post.content);
  const relatedPosts = findRelatedPosts(post, allPosts, 3);
  const relatedHtml = relatedPosts.length > 0 ? `
    <div class="related-posts">
      <h3>Related Posts</h3>
      <div class="related-grid">
        ${relatedPosts.map(relatedPost => `
          <a href="../${relatedPost.category}/${relatedPost.slug}.html" class="related-card">
            <h4>${escapeHtml(relatedPost.title)}</h4>
            <p>${escapeHtml(relatedPost.description)}</p>
            <span class="tag">${relatedPost.category}</span>
          </a>
        `).join('')}
      </div>
    </div>
  ` : '';

  const content = `
<section class="experiment-header">
  <div class="container">
    <h1 class="experiment-title">${escapeHtml(post.title)}</h1>
    <div class="experiment-meta">
      <span class="tag">${escapeHtml(post.category)}</span>
      ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      <span class="tag difficulty-${post.difficulty}">${escapeHtml(post.difficulty)}</span>
    </div>
    <div class="post-meta">
      <span class="meta-item">
        <strong>Date:</strong> ${new Date(post.date).toLocaleDateString()}
      </span>
      <span class="meta-item">
        <strong>Read Time:</strong> ${post.readTime}
      </span>
      <span class="meta-item">
        <strong>Author:</strong> ${escapeHtml(post.author)}
      </span>
    </div>
    <p class="post-description">${escapeHtml(post.description)}</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="content-layout">
      <main class="content-main">
        ${toc}
        <div class="post-content">
          ${post.html}
        </div>
        ${relatedHtml}
      </main>
    </div>
  </div>
</section>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} - Fridays with Faraday</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="alternate" type="application/rss+xml" title="Fridays with Faraday" href="../rss.xml">
</head>
<body>
  <div class="background"></div>
  <div class="grid-overlay"></div>

  ${createNavigation('/experiments.html')}

  ${content}

  <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
    <div class="container">
      <a href="../experiments.html" style="color: var(--accent); text-decoration: none;">← Back to all experiments</a>
    </div>
  </div>

  ${createFooter()}

  <script src="../js/main.js"></script>
</body>
</html>`;

  const outputPath = path.join(outputDir, `${post.slug}.html`);
  fs.writeFileSync(outputPath, html);
  console.log(`✓ Generated: ${category}/${post.slug}.html`);
}

async function generateSearchPage(posts) {
  const searchIndex = createSearchIndex(posts);
  const searchJs = `
window.SEARCH_DATA = ${JSON.stringify(searchIndex)};

function searchPosts(query) {
  const results = [];
  const searchTerm = query.toLowerCase();
  
  window.SEARCH_DATA.forEach(post => {
    const searchableText = [
      post.title,
      post.description,
      post.category,
      post.tags.join(' '),
      post.content
    ].join(' ').toLowerCase();
    
    if (searchableText.includes(searchTerm)) {
      results.push({
        title: post.title,
        description: post.description,
        category: post.category,
        url: post.url,
        relevance: searchableText.split(searchTerm).length - 1
      });
    }
  });
  
  return results.sort((a, b) => b.relevance - a.relevance);
}

function displaySearchResults(results) {
  const resultsContainer = document.getElementById('search-results');
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<p>No results found.</p>';
    return;
  }
  
  resultsContainer.innerHTML = results.map(result => \`
    <div class="search-result">
      <h3><a href="\${result.url}">\${result.title}</a></h3>
      <p>\${result.description}</p>
      <span class="search-category">\${result.category}</span>
    </div>
  \`).join('');
}

// Auto-search on page load if URL has hash
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  if (query) {
    document.getElementById('search-input').value = query;
    const results = searchPosts(query);
    displaySearchResults(results);
  }
  
  // Search on input
  document.getElementById('search-input').addEventListener('input', function(e) {
    const query = e.target.value;
    if (query.length > 2) {
      const results = searchPosts(query);
      displaySearchResults(results);
    } else {
      document.getElementById('search-results').innerHTML = '';
    }
  });
});
`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search - Fridays with Faraday</title>
  <meta name="description" content="Search all technical posts and experiments">
  <link rel="stylesheet" href="css/style.css">
  <link rel="alternate" type="application/rss+xml" title="Fridays with Faraday" href="rss.xml">
</head>
<body>
  <div class="background"></div>
  <div class="grid-overlay"></div>

  ${createNavigation('/search.html')}

  <section style="padding-top: 8rem;">
    <div class="container">
      <div class="section-header">
        <h2>Search Posts</h2>
        <p>Find technical posts across all categories</p>
      </div>
      
      <div class="search-container">
        <input 
          type="text" 
          id="search-input" 
          placeholder="Search for posts, techniques, or topics..." 
          class="search-input"
        />
      </div>
      
      <div id="search-results" class="search-results"></div>
    </div>
  </section>

  ${createFooter()}

  <script src="js/main.js"></script>
  <script>
${searchJs}
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'search.html'), html);
  console.log('✓ Generated search.html');
}

async function generateRSSFeedFile(posts) {
  const rss = generateRSSFeed(posts);
  fs.writeFileSync(path.join(CONFIG.outputDirectory, 'rss.xml'), rss);
  console.log('✓ Generated rss.xml');
}

async function copyEnhancedAssets() {
  // Copy CSS
  const cssSource = path.join(CONFIG.assetsDirectory, 'css', 'style.css');
  const cssDest = path.join(CONFIG.outputDirectory, 'css');
  if (!fs.existsSync(cssDest)) {
    fs.mkdirSync(cssDest, { recursive: true });
  }
  if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, path.join(cssDest, 'style.css'));
    console.log('✓ Copied enhanced style.css');
  } else {
    console.log('⚠ Warning: style.css not found at', cssSource);
  }

  // Copy JS
  const jsSource = path.join(CONFIG.assetsDirectory, 'js', 'main.js');
  const jsDest = path.join(CONFIG.outputDirectory, 'js');
  if (!fs.existsSync(jsDest)) {
    fs.mkdirSync(jsDest, { recursive: true });
  }
  if (fs.existsSync(jsSource)) {
    fs.copyFileSync(jsSource, path.join(jsDest, 'main.js'));
    console.log('✓ Copied main.js');
  } else {
    console.log('⚠ Warning: main.js not found at', jsSource);
  }
}

async function main() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDirectory)) {
      fs.mkdirSync(CONFIG.outputDirectory, { recursive: true });
      console.log(`✓ Created output directory: ${CONFIG.outputDirectory}`);
    }
    
    const posts = await loadPosts();
    await generateEnhancedPages(posts);
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main();