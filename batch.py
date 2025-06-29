import json
import os
from pathlib import Path
from datetime import datetime
import shutil

class ArticleIndexBuilder:
    def __init__(self, base_path='assets/data'):
        self.base_path = Path(base_path)
        self.pages_path = self.base_path / 'pages/articles'
        self.category_path = self.base_path / 'pages/categories'
        self.articles = []
        self.categories = {}
        self.search_index = {"articles": []}
        
        # Pages to skip when processing articles
        self.skip_pages = ['home.json', 'about.json', 'categories.json']
        
    def slugify(self, text):
        """Convert text to URL-friendly slug"""
        return text.lower().replace(' ', '-').replace('/', '-')
    
    def extract_description(self, content_blocks):
        """Extract description from article content if not provided"""
        for block in content_blocks:
            if block.get('type') == 'text':
                # Return first 160 characters of first text block
                return block.get('content', '')[:160] + '...'
        return "No description available"
    
    def load_articles(self):
        """Load all article JSON files"""
        print("Loading articles...")
        
        for file_path in self.pages_path.glob('*.json'):
            # Skip non-article pages
            if file_path.name in self.skip_pages:
                continue
                
            # Skip category pages
            if file_path.name.startswith('category-'):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    article_data = json.load(f)
                    
                # Get article ID from filename
                article_id = file_path.stem
                
                # Extract article info
                article_info = {
                    'id': f'articles/{article_id}',
                    'image': f'assets/images/' + article_id + '.jpg',
                    'title': article_data.get('title', 'Untitled'),
                    'author': article_data.get('author', 'Unknown'),
                    'date': article_data.get('date', ''),
                    'category': article_data.get('category', 'Uncategorized'),
                    'tags': article_data.get('tags', []),
                    'difficulty': article_data.get('difficulty', 'Not specified'),
                    'assds': article_data.get('readTime', ''),
                    'description': article_data.get('description', '')
                }
                
                # If no description, extract from content
                if not article_info['description'] and 'content' in article_data:
                    article_info['description'] = self.extract_description(article_data['content'])
                
                self.articles.append(article_info)
                
                # Group by category
                category = article_info['category']
                if category not in self.categories:
                    self.categories[category] = []
                self.categories[category].append(article_info)
                
                print(f"  ✓ Loaded: {article_info['title']}")
                
            except Exception as e:
                print(f"  ✗ Error loading {file_path.name}: {e}")
    
    def create_search_index(self):
        """Create search index from articles"""
        print("\nCreating search index...")
        
        self.search_index['articles'] = [{
            'id': f"{article['id']}",
            'title': article['title'],
            'description': article['description'],
            'category': article['category'],
            'tags': article['tags'],
            'author': article['author']
        } for article in self.articles]
        
        # Save search index
        search_index_path = self.base_path / 'search-index.json'
        self.save_json(search_index_path, self.search_index)
        print(f"  ✓ Search index created with {len(self.articles)} articles")
    
    def create_categories_list(self):
        """Create main categories list page"""
        print("\nCreating categories list...")
        
        categories_data = {
            'title': 'All Categories',
            'categories': []
        }
        
        for category_name, articles in self.categories.items():
            category_info = {
                'name': category_name,
                'slug': self.slugify(category_name),
                'articleCount': len(articles),
                'description': f"Browse all {category_name} articles",
                'link': f'/category/{self.slugify(category_name)}'
            }
            categories_data['categories'].append(category_info)
        
        # Sort categories by article count
        categories_data['categories'].sort(key=lambda x: x['articleCount'], reverse=True)
        
        # Save categories list
        categories_path = self.category_path / 'categories.json'
        self.save_json(categories_path, categories_data)
        print(f"  ✓ Categories list created with {len(self.categories)} categories")
    
    def create_category_pages(self):
        """Create individual category pages"""
        print("\nCreating category pages...")
        
        # Create category directory if it doesn't exist
        category_dir = self.category_path / 'categories'
        category_dir.mkdir(exist_ok=True)
        
        for category_name, articles in self.categories.items():
            # Sort articles by date (newest first)
            sorted_articles = sorted(
                articles, 
                key=lambda x: x.get('date', ''), 
                reverse=True
            )
            
            category_data = {
                'title': f'{category_name} Articles',
                'category': category_name,
                'description': f'All articles about {category_name}',
                'articleCount': len(articles),
                'articles': sorted_articles
            }
            
            # Save category page
            category_slug = self.slugify(category_name)
            category_path = category_dir / f'{category_slug}.json'
            self.save_json(category_path, category_data)
            print(f"  ✓ Created {category_name} page with {len(articles)} articles")
    
    def save_json(self, file_path, data):
        """Save JSON file with proper formatting"""
        
        # Ensure directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save JSON with nice formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def generate_stats(self):
        """Print generation statistics"""
        print("\n" + "="*50)
        print("BUILD COMPLETE!")
        print("="*50)
        print(f"Total articles processed: {len(self.articles)}")
        print(f"Categories created: {len(self.categories)}")
        print("\nArticles per category:")
        for category, articles in self.categories.items():
            print(f"  - {category}: {len(articles)} articles")
        
        # Find articles without proper metadata
        missing_desc = [a for a in self.articles if not a.get('description')]
        missing_tags = [a for a in self.articles if not a.get('tags')]
        
        if missing_desc or missing_tags:
            print("\nWarnings:")
            if missing_desc:
                print(f"  - {len(missing_desc)} articles missing descriptions")
            if missing_tags:
                print(f"  - {len(missing_tags)} articles missing tags")
    
    def build(self):
        """Run the complete build process"""
        print("Starting JSON build process...")
        print(f"Base path: {self.base_path.absolute()}")
        
        # Execute build steps
        self.load_articles()
        
        if not self.articles:
            print("\nNo articles found! Check your directory structure.")
            return
        
        self.create_search_index()
        self.create_categories_list()
        self.create_category_pages()
        self.generate_stats()
        
        print("\n✓ Build completed successfully!")


# Optional: Watch mode for development
def watch_mode():
    """Watch for file changes and rebuild automatically"""
    import time
    
    print("Watch mode enabled. Press Ctrl+C to stop.")
    builder = ArticleIndexBuilder()
    
    last_modified = {}
    
    while True:
        try:
            # Check for modified files
            changed = False
            for file_path in builder.pages_path.glob('*.json'):
                mtime = file_path.stat().st_mtime
                if file_path not in last_modified or last_modified[file_path] < mtime:
                    last_modified[file_path] = mtime
                    changed = True
            
            if changed:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Changes detected, rebuilding...")
                builder = ArticleIndexBuilder()  # Reset builder
                builder.build()
            
            time.sleep(2)  # Check every 2 seconds
            
        except KeyboardInterrupt:
            print("\nWatch mode stopped.")
            break


if __name__ == "__main__":
    import sys
    
    builder = ArticleIndexBuilder()
    
    # Check for watch mode
    if len(sys.argv) > 1 and sys.argv[1] == '--watch':
        watch_mode()
    else:
        builder.build()
        print("\nTip: Run with --watch flag to automatically rebuild on changes")
        print("Example: python build_json.py --watch")