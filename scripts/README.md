# Blog Post Management Scripts

Scripts to help manage and generate blog posts for the Fridays with Faraday blog.

## Scripts

### 1. `analyze-posts.js`

Analyzes existing blog posts and identifies gaps in the posting schedule.

**Usage:**
```bash
node scripts/analyze-posts.js
```

**Output:**
- Console report showing gaps by year/month
- `post-analysis-report.json` with detailed analysis

**What it does:**
- Scans all posts in `src/content/posts/`
- Identifies months with fewer than 2 posts (2019-2026)
- Generates topic suggestions for missing posts
- Creates a detailed JSON report

### 2. `generate-post.js`

Generates a single new blog post with proper frontmatter.

**Usage:**
```bash
node scripts/generate-post.js "Post Title" [options]
```

**Options:**
- `--category <category>` - Category (default: llm-inference)
- `--date <YYYY-MM-DD>` - Publish date (default: today)
- `--tags <tag1,tag2,...>` - Comma-separated tags
- `--difficulty <level>` - Difficulty: beginner, intermediate, advanced, expert
- `--author <author-id>` - Author ID (default: stanley-phoong)
- `--description <text>` - Post description

**Example:**
```bash
node scripts/generate-post.js "ESP32 Power Optimization" \
  --category microcontrollers \
  --date 2024-01-15 \
  --tags esp32,power,optimization \
  --difficulty advanced
```

### 3. `generate-missing-posts.js`

Generates multiple posts for missing months based on analysis.

**Usage:**
```bash
# Dry run (preview what would be generated)
node scripts/generate-missing-posts.js --dry-run

# Generate posts for a specific year
node scripts/generate-missing-posts.js --year=2020

# Generate limited number of posts
node scripts/generate-missing-posts.js --limit=10

# Actually generate posts
node scripts/generate-missing-posts.js
```

**Options:**
- `--dry-run` - Preview without creating files
- `--year=<year>` - Only generate for specific year
- `--limit=<number>` - Limit number of posts to generate

## Categories

Posts are organized into these categories:

- **llm-inference** - LLM inference optimization
- **vllm** - vLLM-specific topics
- **microcontrollers** - MCU performance and optimization
- **hardware-optimization** - CPU/GPU hardware optimization
- **gpu-programming** - GPU programming and CUDA
- **profiling** - Performance profiling tools
- **graphics** - Graphics and video acceleration
- **transformers** - Transformer architecture

## Post Structure

Each generated post includes:

- Proper frontmatter with metadata
- Template sections for content
- Import statements for MDX components
- Placeholder content to guide writing

## Workflow

1. **Analyze gaps:**
   ```bash
   node scripts/analyze-posts.js
   ```

2. **Preview what would be generated:**
   ```bash
   node scripts/generate-missing-posts.js --dry-run --limit=20
   ```

3. **Generate posts for specific period:**
   ```bash
   node scripts/generate-missing-posts.js --year=2020 --limit=10
   ```

4. **Generate individual post:**
   ```bash
   node scripts/generate-post.js "Your Post Title" --category llm-inference
   ```

## Topic Generation

The scripts use a deterministic algorithm to generate topics:
- Topics rotate through categories based on year/month
- Ensures variety while maintaining focus on performance topics
- Topics are relevant to LLM, MCU, hardware, and optimization themes

## Notes

- Generated posts are templates - you'll need to fill in the actual content
- Posts are created in `src/content/posts/`
- Existing posts are never overwritten
- All posts use the `stanley-phoong` author by default
