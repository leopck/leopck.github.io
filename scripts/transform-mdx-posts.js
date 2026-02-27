const fs = require('fs');
const path = require('path');

/**
 * Script to transform MDX blog posts to be more diagram-first and less code-heavy
 * Follows the patterns established in the sample transformations
 */

const POSTS_DIR = './src/content/posts/';
const BACKUP_DIR = './src/content/posts/backup/';

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Posts that have already been transformed
const TRANSFORMED_POSTS = [
  'esp32-wifi-power-analysis-2019.mdx',
  'cuda-kernel-optimization-techniques-2019.mdx',
  'cuda-warp-occupancy-latency-hiding-2020.mdx',
  'flashattention-memory-hierarchy.mdx'
];

// Categories of posts to process
const CATEGORIES = {
  CUDA_GPU: ['cuda-', 'gpu-', 'warp-', 'tensor-core', 'memory-hierarchy'],
  LLM_TRANSFORMER: ['attention-', 'transformer-', 'llm-', 'kv-cache-', 'flashattention'],
  EMBEDDED: ['esp32-', 'cortex-', 'stm32-', 'i2c-', 'adc-'],
  DISTRIBUTED: ['deepspeed-', 'nccl-', 'gradient-', 'distributed-'],
  OPTIMIZATION: ['tensorrt-', 'gemm-', 'mixed-precision-', 'optimiz']
};

function categorizePost(filename) {
  const lowerName = filename.toLowerCase();
  
  for (const [category, patterns] of Object.entries(CATEGORIES)) {
    if (patterns.some(pattern => lowerName.includes(pattern))) {
      return category;
    }
  }
  
  return 'GENERAL';
}

function needsTransformation(content) {
  // Check if post already has diagram-first approach
  const diagramComponents = ['<MemoryLayout', '<RegisterDiagram', '<PerfChart', '<Benchmark'];
  const hasDiagrams = diagramComponents.some(component => content.includes(component));
  
  // Check if post has excessive code blocks
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  
  return !hasDiagrams || codeBlockCount > 5;
}

function generateTransformationTemplate(originalContent, filename) {
  // This is a simplified template - in practice, each post needs individual attention
  let transformed = originalContent;
  
  // Add import statements for common components if not present
  if (!transformed.includes('@/components/mdx')) {
    const importSection = transformed.match(/(import\s+.+?;\s*\n)+/);
    const hasImports = importSection && importSection[0];
    
    const newImports = `import Callout from '@/components/mdx/Callout.astro';
import PerfChart from '@/components/mdx/PerfChart.astro';
import Benchmark from '@/components/mdx/Benchmark.astro';
import MemoryLayout from '@/components/mdx/MemoryLayout.astro';
import RegisterDiagram from '@/components/mdx/RegisterDiagram.astro';`;

    if (hasImports) {
      // Insert new imports after existing ones
      transformed = transformed.replace(
        /(import\s+.+?;\s*\n)+/, 
        `${importSection[0]}${newImports}\n`
      );
    } else {
      // Insert imports after frontmatter
      transformed = transformed.replace(
        /(---\n([\s\S]*?)---\n)/, 
        `$1\n${newImports}\n\n`
      );
    }
  }
  
  return transformed;
}

async function transformPosts() {
  console.log('Starting MDX post transformation process...');
  
  const allFiles = fs.readdirSync(POSTS_DIR);
  const mdxFiles = allFiles.filter(file => file.endsWith('.mdx'));
  
  console.log(`Found ${mdxFiles.length} MDX files`);
  console.log(`Already transformed: ${TRANSFORMED_POSTS.length} files`);
  
  const filesToTransform = mdxFiles.filter(file => !TRANSFORMED_POSTS.includes(file));
  
  console.log(`Files remaining to transform: ${filesToTransform.length}`);
  
  for (const file of filesToTransform) {
    console.log(`\nProcessing: ${file}`);
    
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (needsTransformation(content)) {
      const category = categorizePost(file);
      console.log(`  Category: ${category}`);
      
      // Backup original file
      const backupPath = path.join(BACKUP_DIR, file);
      fs.writeFileSync(backupPath, content);
      console.log(`  Backed up to: ${backupPath}`);
      
      // Generate transformed content with basic import additions
      const transformedContent = generateTransformationTemplate(content, file);
      
      // Write transformed file
      const tempPath = path.join(POSTS_DIR, file.replace('.mdx', '-transformed.mdx'));
      fs.writeFileSync(tempPath, transformedContent);
      
      console.log(`  Created transformed version: ${tempPath}`);
      console.log(`  Manual review needed for: ${file}`);
    } else {
      console.log(`  Already optimized, skipping: ${file}`);
    }
  }
  
  console.log('\nTransformation process completed!');
  console.log('Next steps:');
  console.log('1. Review generated -transformed.mdx files');
  console.log('2. Manually enhance with appropriate diagrams');
  console.log('3. Test rendering and fix any issues');
  console.log('4. Rename -transformed.mdx to replace originals when satisfied');
}

// Run the transformation
transformPosts().catch(console.error);