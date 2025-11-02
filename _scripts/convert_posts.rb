#!/usr/bin/env ruby
# Content conversion script for Fridays with Faraday Jekyll site
# Converts existing markdown posts to Jekyll format with proper front matter

require 'yaml'
require 'fileutils'
require 'date'

class JekyllPostConverter
  CATEGORY_MAP = {
    'esp32' => 'ESP32',
    'experiments' => 'Experiments', 
    'gaudi' => 'Gaudi',
    'graphics' => 'Graphics',
    'llm' => 'LLM',
    'vllm' => 'vLLM'
  }
  
  def initialize(source_dir, target_dir)
    @source_dir = source_dir
    @target_dir = target_dir
    @converted_count = 0
  end
  
  def convert_all_posts
    puts "🔄 Starting content conversion..."
    
    # Create target directory
    FileUtils.mkdir_p(@target_dir)
    
    # Process each category
    CATEGORY_MAP.keys.each do |category|
      convert_category_posts(category)
    end
    
    # Also convert any loose posts in root
    convert_loose_posts
    
    puts "✅ Conversion complete! Converted #{@converted_count} posts."
  end
  
  private
  
  def convert_category_posts(category)
    category_dir = File.join(@source_dir, category)
    return unless Dir.exist?(category_dir)
    
    puts "📁 Processing #{category} category..."
    
    Dir.glob(File.join(category_dir, "*.md")).each do |source_file|
      convert_post(source_file, category)
    end
  end
  
  def convert_loose_posts
    loose_posts_dir = @source_dir
    return unless Dir.exist?(loose_posts_dir)
    
    # Look for any .md files in root that aren't in subdirectories
    Dir.glob(File.join(loose_posts_dir, "*.md")).each do |source_file|
      category = detect_category_from_filename(File.basename(source_file))
      convert_post(source_file, category) if category
    end
  end
  
  def convert_post(source_file, category)
    begin
      content = File.read(source_file)
      filename = File.basename(source_file, '.md')
      
      # Parse existing content
      front_matter, body = split_front_matter(content)
      title = extract_title(body)
      
      # Generate new front matter
      new_front_matter = generate_front_matter(
        title: title,
        category: category,
        filename: filename,
        existing_front_matter: front_matter
      )
      
      # Generate new filename with date
      new_filename = generate_jekyll_filename(filename, title, category)
      target_file = File.join(@target_dir, new_filename)
      
      # Write converted post
      File.write(target_file, "---\n#{new_front_matter.to_yaml}\n---\n\n#{body}")
      
      puts "  ✅ Converted: #{filename} -> #{new_filename}"
      @converted_count += 1
      
    rescue => e
      puts "  ❌ Error converting #{source_file}: #{e.message}"
    end
  end
  
  def split_front_matter(content)
    if content =~ /^---\s*\n/
      # Extract existing front matter
      parts = content.split(/^---\s*\n/, 2)
      if parts.length > 2
        front_matter_str = parts[1].split(/^---\s*\n/, 2)[0]
        body = parts[1].split(/^---\s*\n/, 2)[1] || ""
        
        begin
          front_matter = YAML.load(front_matter_str) || {}
        rescue
          front_matter = {}
        end
        
        return front_matter, body
      end
    end
    
    {}, content
  end
  
  def extract_title(body)
    # Extract title from first H1 heading
    if body =~ /#\s+(.+?)(?:\r?\n|$)/
      $1.strip
    else
      # Fallback to filename
      "Untitled Post"
    end
  end
  
  def detect_category_from_filename(filename)
    # Detect category from filename patterns
    category_map = {
      'esp32' => 'esp32',
      'esp' => 'esp32',
      'experiments' => 'experiments',
      'experiment' => 'experiments',
      'bootloader' => 'experiments',
      'gaudi' => 'gaudi',
      'gaudi2' => 'gaudi',
      'graphics' => 'graphics',
      'vaapi' => 'graphics',
      'dxva' => 'graphics',
      'level-zero' => 'graphics',
      'llm' => 'llm',
      'llama' => 'llm',
      'cache' => 'llm',
      'memory' => 'llm',
      'matrix' => 'llm',
      'vllm' => 'vllm',
      'batch' => 'vllm',
      'token' => 'vllm'
    }
    
    filename.downcase!
    category_map.each do |pattern, category|
      return category if filename.include?(pattern)
    end
    
    nil
  end
  
  def generate_front_matter(title:, category:, filename:, existing_front_matter:)
    # Merge existing front matter with new defaults
    front_matter = existing_front_matter.dup || {}
    
    # Override with our standard structure
    front_matter['title'] = title
    front_matter['category'] = category
    front_matter['layout'] = 'post'
    front_matter['author'] = 'Fridays with Faraday'
    front_matter['description'] = generate_description(title, category)
    front_matter['tags'] = generate_tags(category, filename)
    front_matter['difficulty'] = detect_difficulty(category, filename)
    front_matter['toc'] = true
    front_matter['show_related_posts'] = true
    front_matter['show_share_buttons'] = true
    front_matter['show_author'] = true
    front_matter['show_date'] = true
    front_matter['show_reading_time'] = true
    front_matter['show_categories'] = true
    front_matter['show_tags'] = true
    
    # Add reading time estimation (optional)
    front_matter['reading_time'] = estimate_reading_time(front_matter['description'])
    
    # Remove any nil values
    front_matter.delete_if { |_, v| v.nil? }
    
    front_matter
  end
  
  def generate_description(title, category)
    case category
    when 'esp32'
      "Technical analysis and implementation guide for ESP32 microcontroller programming, DMA optimization, and embedded systems development."
    when 'experiments'
      "Bare metal programming experiments, bootloader development, and low-level systems programming techniques."
    when 'gaudi'
      "Deep technical analysis of Gaudi AI accelerator architecture, memory subsystem, and optimization strategies."
    when 'graphics'
      "Graphics programming analysis, performance optimization, and GPU programming techniques using modern APIs."
    when 'llm'
      "Large Language Model optimization, cache hierarchy analysis, and performance tuning for AI workloads."
    when 'vllm'
      "High-throughput LLM inference optimization, memory management, and performance analysis for vLLM systems."
    else
      "Technical analysis and implementation guide covering #{category} programming and optimization techniques."
    end
  end
  
  def generate_tags(category, filename)
    base_tags = [category]
    
    category_tags = {
      'esp32' => ['microcontroller', 'dma', 'embedded', 'performance'],
      'experiments' => ['bootloader', 'assembly', 'arm', 'firmware'],
      'gaudi' => ['ai-accelerator', 'memory', 'hbm', 'optimization'],
      'graphics' => ['gpu', 'performance', 'multithreading', 'video'],
      'llm' => ['cache', 'memory', 'attention', 'optimization'],
      'vllm' => ['inference', 'batch-processing', 'memory-pool', 'token-generation']
    }
    
    filename_downcase = filename.downcase
    tags = base_tags + (category_tags[category] || [])
    
    # Add specific tags based on filename
    tags << 'dma' if filename_downcase.include?('dma')
    tags << 'memory' if filename_downcase.include?('memory')
    tags << 'performance' if filename_downcase.include?('performance')
    tags << 'optimization' if filename_downcase.include?('optimization')
    tags << 'analysis' if filename_downcase.include?('analysis')
    
    tags.uniq
  end
  
  def detect_difficulty(category, filename)
    case category
    when 'experiments'
      'advanced'
    when 'gaudi', 'llm', 'vllm'
      'advanced'
    when 'graphics'
      'advanced'
    else
      'intermediate'
    end
  end
  
  def generate_jekyll_filename(filename, title, category)
    # Generate date-based filename
    # For now, use current date as publication date
    # In a real scenario, you'd extract this from git history or metadata
    date = DateTime.now.strftime('%Y-%m-%d')
    
    # Clean title for filename
    clean_title = title.downcase
                 .gsub(/[^a-z0-9\s-]/, '')
                 .gsub(/\s+/, '-')
                 .gsub(/-+/, '-')
                 .strip
    
    "#{date}-#{clean_title}.md"
  end
  
  def estimate_reading_time(description)
    # Simple estimation based on word count
    word_count = description.split.length
    minutes = [1, (word_count / 200.0).ceil].max
    minutes
  end
end

# Run the conversion
if __FILE__ == $0
  source_dir = ARGV[0] || '/workspace/posts'
  target_dir = ARGV[1] || '/workspace/jekyll-site/_posts'
  
  converter = JekyllPostConverter.new(source_dir, target_dir)
  converter.convert_all_posts
end
