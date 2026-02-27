# Quick Reference - Post Generation Commands

## Analyze Posts
```bash
node scripts/analyze-posts.js
```
Shows gaps and generates `post-analysis-report.json`

## Generate Single Post
```bash
node scripts/generate-post.js "Post Title" \
  --category llm-inference \
  --date 2024-01-15 \
  --tags tag1,tag2 \
  --difficulty advanced
```

## Generate Missing Posts

**Preview (dry run):**
```bash
node scripts/generate-missing-posts.js --dry-run --limit=20
```

**Generate for specific year:**
```bash
node scripts/generate-missing-posts.js --year=2020
```

**Generate limited batch:**
```bash
node scripts/generate-missing-posts.js --limit=10
```

## Categories
- `llm-inference`
- `vllm`
- `microcontrollers`
- `hardware-optimization`
- `gpu-programming`
- `profiling`
- `graphics`
- `transformers`

## Difficulty Levels
- `beginner`
- `intermediate`
- `advanced`
- `expert`
