#!/usr/bin/env python3
"""
Content conversion script for Fridays with Faraday Jekyll site
Converts existing markdown posts to Jekyll format with proper front matter
"""

import os
import re
import yaml
import shutil
from datetime import datetime
from pathlib import Path
import argparse

class JekyllPostConverter:
    CATEGORY_MAP = {
        'esp32': 'ESP32',
        'experiments': 'Experiments',
        'gaudi': 'Gaudi',
        'graphics': 'Graphics',
        'llm': 'LLM',
        'vllm': 'vLLM'
    }
    
    def __init__(self, source_dir, target_dir):
        self.source_dir = Path(source_dir)
        self.target_dir = Path(target_dir)
        self.converted_count = 0
    
    def convert_all_posts(self):
        print("🔄 Starting content conversion...")
        
        # Create target directory
        self.target_dir.mkdir(parents=True, exist_ok=True)
        
        # Process each category
        for category in self.CATEGORY_MAP.keys():
            self.convert_category_posts(category)
        
        # Also convert any loose posts in root
        self.convert_loose_posts()
        
        print(f"✅ Conversion complete! Converted {self.converted_count} posts.")
    
    def convert_category_posts(self, category):
        category_dir = self.source_dir / category
        if not category_dir.exists():
            return
        
        print(f"📁 Processing {category} category...")
        
        for md_file in category_dir.glob("*.md"):
            self.convert_post(md_file, category)
    
    def convert_loose_posts(self):
        # Look for any .md files in root that aren't in subdirectories
        for md_file in self.source_dir.glob("*.md"):
            category = self.detect_category_from_filename(md_file.name)
            if category:
                self.convert_post(md_file, category)
    
    def convert_post(self, source_file, category):
        try:
            with open(source_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            filename = source_file.stem
            
            # Parse existing content
            front_matter, body = self.split_front_matter(content)
            title = self.extract_title(body)
            
            # Generate new front matter
            new_front_matter = self.generate_front_matter(
                title=title,
                category=category,
                filename=filename,
                existing_front_matter=front_matter
            )
            
            # Generate new filename with date
            new_filename = self.generate_jekyll_filename(filename, title, category)
            target_file = self.target_dir / new_filename
            
            # Write converted post
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write("---\n")
                f.write(yaml.dump(new_front_matter, default_flow_style=False, allow_unicode=True))
                f.write("---\n\n")
                f.write(body)
            
            print(f"  ✅ Converted: {filename} -> {new_filename}")
            self.converted_count += 1
            
        except Exception as e:
            print(f"  ❌ Error converting {source_file}: {e}")
    
    def split_front_matter(self, content):
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                front_matter_str = parts[1].strip()
                body = parts[2]
                
                try:
                    front_matter = yaml.safe_load(front_matter_str) or {}
                except yaml.YAMLError:
                    front_matter = {}
                
                return front_matter, body
        
        return {}, content
    
    def extract_title(self, body):
        # Extract title from first H1 heading
        match = re.search(r'^#\s+(.+?)(?:\r?\n|$)', body, re.MULTILINE)
        if match:
            return match.group(1).strip()
        else:
            # Fallback to filename
            return "Untitled Post"
    
    def detect_category_from_filename(self, filename):
        # Detect category from filename patterns
        filename_lower = filename.lower()
        
        patterns = {
            'esp32': ['esp32', 'esp'],
            'experiments': ['experiments', 'experiment', 'bootloader'],
            'gaudi': ['gaudi', 'gaudi2'],
            'graphics': ['graphics', 'vaapi', 'dxva', 'level-zero'],
            'llm': ['llm', 'llama', 'cache', 'memory', 'matrix'],
            'vllm': ['vllm', 'batch', 'token']
        }
        
        for category, keywords in patterns.items():
            for keyword in keywords:
                if keyword in filename_lower:
                    return category
        
        return None
    
    def generate_front_matter(self, title, category, filename, existing_front_matter):
        # Merge existing front matter with new defaults
        front_matter = existing_front_matter.copy() if existing_front_matter else {}
        
        # Override with our standard structure
        front_matter['title'] = title
        front_matter['category'] = category
        front_matter['layout'] = 'post'
        front_matter['author'] = 'Fridays with Faraday'
        front_matter['description'] = self.generate_description(title, category)
        front_matter['tags'] = self.generate_tags(category, filename)
        front_matter['difficulty'] = self.detect_difficulty(category, filename)
        front_matter['toc'] = True
        front_matter['show_related_posts'] = True
        front_matter['show_share_buttons'] = True
        front_matter['show_author'] = True
        front_matter['show_date'] = True
        front_matter['show_reading_time'] = True
        front_matter['show_categories'] = True
        front_matter['show_tags'] = True
        
        # Add reading time estimation
        front_matter['reading_time'] = self.estimate_reading_time(front_matter['description'])
        
        # Remove any None values
        front_matter = {k: v for k, v in front_matter.items() if v is not None}
        
        return front_matter
    
    def generate_description(self, title, category):
        descriptions = {
            'esp32': "Technical analysis and implementation guide for ESP32 microcontroller programming, DMA optimization, and embedded systems development.",
            'experiments': "Bare metal programming experiments, bootloader development, and low-level systems programming techniques.",
            'gaudi': "Deep technical analysis of Gaudi AI accelerator architecture, memory subsystem, and optimization strategies.",
            'graphics': "Graphics programming analysis, performance optimization, and GPU programming techniques using modern APIs.",
            'llm': "Large Language Model optimization, cache hierarchy analysis, and performance tuning for AI workloads.",
            'vllm': "High-throughput LLM inference optimization, memory management, and performance analysis for vLLM systems."
        }
        
        return descriptions.get(category, f"Technical analysis and implementation guide covering {category} programming and optimization techniques.")
    
    def generate_tags(self, category, filename):
        base_tags = [category]
        
        category_tags = {
            'esp32': ['microcontroller', 'dma', 'embedded', 'performance'],
            'experiments': ['bootloader', 'assembly', 'arm', 'firmware'],
            'gaudi': ['ai-accelerator', 'memory', 'hbm', 'optimization'],
            'graphics': ['gpu', 'performance', 'multithreading', 'video'],
            'llm': ['cache', 'memory', 'attention', 'optimization'],
            'vllm': ['inference', 'batch-processing', 'memory-pool', 'token-generation']
        }
        
        filename_lower = filename.lower()
        tags = base_tags + category_tags.get(category, [])
        
        # Add specific tags based on filename
        if 'dma' in filename_lower:
            tags.append('dma')
        if 'memory' in filename_lower:
            tags.append('memory')
        if 'performance' in filename_lower:
            tags.append('performance')
        if 'optimization' in filename_lower:
            tags.append('optimization')
        if 'analysis' in filename_lower:
            tags.append('analysis')
        
        return list(set(tags))  # Remove duplicates
    
    def detect_difficulty(self, category, filename):
        advanced_categories = ['experiments', 'gaudi', 'llm', 'vllm', 'graphics']
        return 'advanced' if category in advanced_categories else 'intermediate'
    
    def generate_jekyll_filename(self, filename, title, category):
        # Generate date-based filename
        # For now, use current date as publication date
        # In a real scenario, you'd extract this from git history or metadata
        date_str = datetime.now().strftime('%Y-%m-%d')
        
        # Clean title for filename
        clean_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title)
        clean_title = re.sub(r'\s+', '-', clean_title)
        clean_title = re.sub(r'-+', '-', clean_title).strip('-').lower()
        
        return f"{date_str}-{clean_title}.md"
    
    def estimate_reading_time(self, description):
        # Simple estimation based on word count
        word_count = len(description.split())
        minutes = max(1, (word_count / 200.0).__ceil__())
        return minutes

def main():
    parser = argparse.ArgumentParser(description='Convert existing markdown posts to Jekyll format')
    parser.add_argument('source_dir', nargs='?', default='/workspace/posts',
                       help='Source directory containing existing posts')
    parser.add_argument('target_dir', nargs='?', default='/workspace/jekyll-site/_posts',
                       help='Target directory for Jekyll posts')
    
    args = parser.parse_args()
    
    converter = JekyllPostConverter(args.source_dir, args.target_dir)
    converter.convert_all_posts()

if __name__ == '__main__':
    main()
