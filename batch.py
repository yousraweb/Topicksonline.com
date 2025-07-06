import json
import os
from pathlib import Path
from datetime import datetime
import shutil
import re

class ArticleManager:
    def __init__(self, base_path='assets/data'):
        self.base_path = Path(base_path)
        self.pages_path = self.base_path / 'pages'
        self.articles_path = self.pages_path / 'articles'
        self.category_path = self.pages_path / 'categories'
        self.articles = []
        self.categories = {}
        self.search_index = {"articles": []}
        
        # Ensure directories exist
        self.articles_path.mkdir(parents=True, exist_ok=True)
        self.category_path.mkdir(parents=True, exist_ok=True)
        
        # Pages to skip when processing articles
        self.skip_pages = ['home.json', 'about.json', 'categories.json', 'blog.json', 'docs.json', 'careers.json', 'privacy.json', 'terms.json', 'cookies.json']
        
    def slugify(self, text):
        """Convert text to URL-friendly slug"""
        # Remove special characters and convert to lowercase
        slug = re.sub(r'[^\w\s-]', '', text.lower())
        # Replace spaces and multiple hyphens with single hyphen
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')
    
    def extract_description(self, content_blocks):
        """Extract description from article content if not provided"""
        for block in content_blocks:
            if block.get('type') == 'text':
                # Return first 160 characters of first text block
                content = block.get('content', '')
                if len(content) > 160:
                    return content[:157] + '...'
                return content
        return "No description available"
    
    def load_articles(self):
        """Load all article JSON files"""
        print("Loading articles...")
        
        for file_path in self.articles_path.glob('*.json'):
            # Skip non-article pages
            if file_path.name in self.skip_pages:
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    article_data = json.load(f)
                    
                # Get article ID from filename
                article_id = file_path.stem
                
                # Extract article info
                article_info = {
                    'id': f'articles/{article_id}',
                    'image': f'assets/images/{article_id}.jpg',
                    'title': article_data.get('title', 'Untitled'),
                    'author': article_data.get('author', 'Unknown'),
                    'date': article_data.get('date', ''),
                    'category': article_data.get('category', 'Uncategorized'),
                    'tags': article_data.get('tags', []),
                    'difficulty': article_data.get('difficulty', 'Beginner'),
                    'readTime': article_data.get('readTime', '5 min'),
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
            'id': article['id'],
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

    def update_homepage(self, num_featured=10):
        """Update homepage with latest articles"""
        print("\nUpdating homepage with latest articles...")
        
        # Sort articles by date (newest first)
        sorted_articles = sorted(
            self.articles, 
            key=lambda x: x.get('date', ''), 
            reverse=True
        )
        
        # Take the most recent articles for featured section
        featured_articles = sorted_articles[:num_featured]
        
        # Load existing homepage data to preserve hero section
        homepage_path = self.pages_path / 'home.json'

        # Default homepage structure
        homepage_data = {
            "hero": {
                "title": "One Blog. Every Topic.",
                "subtitle": "Fresh content every day on what matters — from money to mindset."
            },
            "featured": []
        }
        
        # Try to load existing homepage to preserve hero section
        if homepage_path.exists():
            try:
                with open(homepage_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                    # Preserve hero section if it exists
                    if 'hero' in existing_data:
                        homepage_data['hero'] = existing_data['hero']
            except Exception as e:
                print(f"  ⚠ Warning: Could not load existing homepage: {e}")
        
        # Update featured articles
        homepage_data['featured'] = []
        
        for article in featured_articles:
            # Construct the featured article object
            featured_item = {
                "id": article['id'],
                "title": article['title'],
                "description": article['description'],
                "category": article['category'],
                "difficulty": article['difficulty'],
                "author": article['author'],
                "date": article['date'],
                "readTime": article['readTime']
            }
            
            # Add optional fields
            if article.get('image'):
                featured_item['image'] = article['image']
            
            if article.get('tags'):
                featured_item['tags'] = article['tags']
            
            homepage_data['featured'].append(featured_item)
        
        # Save updated homepage
        self.save_json(homepage_path, homepage_data)
        print(f"  ✓ Homepage updated with {len(featured_articles)} featured articles")
    
    def create_new_article(self, title, author, category, content_blocks=None, **kwargs):
        """Create a new article with the given parameters"""
        print(f"\nCreating new article: {title}")
        
        # Generate filename from title
        filename = self.slugify(title) + '.json'
        filepath = self.articles_path / filename
        
        # Check if file already exists
        if filepath.exists():
            print(f"  ⚠ Warning: Article '{filename}' already exists!")
            response = input("  Overwrite? (y/N): ").lower()
            if response != 'y':
                print("  Article creation cancelled.")
                return False
        
        # Default content if none provided
        if content_blocks is None:
            content_blocks = [
                {
                    "type": "text",
                    "content": f"This is the introduction to {title}. Add your content here."
                },
                {
                    "type": "heading2",
                    "content": "Main Section"
                },
                {
                    "type": "text",
                    "content": "Add your main content here."
                },
                {
                    "type": "conclusion",
                    "content": f"This concludes our article on {title}. Remember to add your own insights and make it valuable for readers."
                }
            ]
        
        # Create article data
        article_data = {
            "title": title,
            "author": author,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": category,
            "difficulty": kwargs.get('difficulty', 'Beginner'),
            "readTime": kwargs.get('readTime', '5 min'),
            "tags": kwargs.get('tags', [category.lower()]),
            "description": kwargs.get('description', ''),
            "content": content_blocks
        }
        
        # If no description provided, extract from content
        if not article_data['description']:
            article_data['description'] = self.extract_description(content_blocks)
        
        try:
            self.save_json(filepath, article_data)
            print(f"  ✓ Article created: {filepath}")
            return True
        except Exception as e:
            print(f"  ✗ Error creating article: {e}")
            return False
    
    def save_json(self, file_path, data):
        """Save JSON file with proper formatting"""
        # Ensure directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save JSON with nice formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def clean_old_category_files(self):
        """Remove old category files that no longer have articles"""
        print("\nCleaning old category files...")
        
        category_dir = self.category_path / 'categories'
        if not category_dir.exists():
            return
        
        # Get current category slugs
        current_slugs = {self.slugify(cat) for cat in self.categories.keys()}
        
        # Check existing files
        removed_count = 0
        for file_path in category_dir.glob('*.json'):
            slug = file_path.stem
            if slug not in current_slugs:
                file_path.unlink()
                print(f"  ✓ Removed old category file: {file_path.name}")
                removed_count += 1
        
        if removed_count == 0:
            print("  ✓ No old category files to remove")
    
    def generate_stats(self):
        """Print generation statistics"""
        print("\n" + "="*50)
        print("BUILD COMPLETE!")
        print("="*50)
        print(f"Total articles processed: {len(self.articles)}")
        print(f"Categories created: {len(self.categories)}")
        print("\nArticles per category:")
        for category, articles in sorted(self.categories.items(), key=lambda x: len(x[1]), reverse=True):
            print(f"  - {category}: {len(articles)} articles")
        
        # Find articles without proper metadata
        missing_desc = [a for a in self.articles if not a.get('description') or a['description'] == "No description available"]
        missing_tags = [a for a in self.articles if not a.get('tags') or len(a['tags']) == 0]
        
        if missing_desc or missing_tags:
            print("\nWarnings:")
            if missing_desc:
                print(f"  - {len(missing_desc)} articles missing descriptions")
                for article in missing_desc[:3]:  # Show first 3
                    print(f"    • {article['title']}")
                if len(missing_desc) > 3:
                    print(f"    • ... and {len(missing_desc) - 3} more")
            
            if missing_tags:
                print(f"  - {len(missing_tags)} articles missing tags")
                for article in missing_tags[:3]:  # Show first 3
                    print(f"    • {article['title']}")
                if len(missing_tags) > 3:
                    print(f"    • ... and {len(missing_tags) - 3} more")
    
    def list_articles(self):
        """List all articles with their basic info"""
        print("\nAll Articles:")
        print("-" * 80)
        
        if not self.articles:
            print("No articles found.")
            return
        
        # Sort by date (newest first)
        sorted_articles = sorted(self.articles, key=lambda x: x.get('date', ''), reverse=True)
        
        for i, article in enumerate(sorted_articles, 1):
            print(f"{i:2d}. {article['title']}")
            print(f"    Author: {article['author']} | Category: {article['category']} | Date: {article['date']}")
            print(f"    File: {article['id'].replace('articles/', '')}.json")
            print()
    
    def interactive_create_article(self):
        """Interactive article creation"""
        print("\n" + "="*50)
        print("CREATE NEW ARTICLE")
        print("="*50)
        
        # Get basic info
        title = input("Article Title: ").strip()
        if not title:
            print("Title is required!")
            return False
        
        author = input("Author Name: ").strip()
        if not author:
            author = "Anonymous"
        
        # Show existing categories
        if self.categories:
            print("\nExisting Categories:")
            for i, cat in enumerate(sorted(self.categories.keys()), 1):
                print(f"  {i}. {cat}")
        
        category = input("Category (or new category name): ").strip()
        if not category:
            category = "General"
        
        # Try to match existing category
        existing_cats = list(self.categories.keys())
        for cat in existing_cats:
            if cat.lower() == category.lower():
                category = cat
                break
        
        difficulty = input("Difficulty (Beginner/Intermediate/Advanced) [Beginner]: ").strip()
        if not difficulty:
            difficulty = "Beginner"
        
        read_time = input("Read Time (e.g., '5 min') [5 min]: ").strip()
        if not read_time:
            read_time = "5 min"
        
        tags_input = input("Tags (comma-separated): ").strip()
        tags = [tag.strip() for tag in tags_input.split(',')] if tags_input else [category.lower()]
        
        description = input("Description (optional): ").strip()
        
        # Create the article
        success = self.create_new_article(
            title=title,
            author=author,
            category=category,
            difficulty=difficulty,
            readTime=read_time,
            tags=tags,
            description=description
        )
        
        if success:
            print(f"\n✓ Article created successfully!")
            print(f"  Edit the file: {self.articles_path / (self.slugify(title) + '.json')}")
            print("  Then run the build command to update the website.")
        
        return success
    
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
        self.clean_old_category_files()
        self.update_homepage()
        self.generate_stats()
        
        print("\n✓ Build completed successfully!")


def watch_mode():
    """Watch for file changes and rebuild automatically"""
    import time
    
    print("Watch mode enabled. Press Ctrl+C to stop.")
    manager = ArticleManager()
    
    last_modified = {}
    
    while True:
        try:
            # Check for modified files
            changed = False
            for file_path in manager.articles_path.glob('*.json'):
                mtime = file_path.stat().st_mtime
                if file_path not in last_modified or last_modified[file_path] < mtime:
                    last_modified[file_path] = mtime
                    changed = True
            
            if changed:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Changes detected, rebuilding...")
                manager = ArticleManager()  # Reset manager
                manager.build()
            
            time.sleep(2)  # Check every 2 seconds
            
        except KeyboardInterrupt:
            print("\nWatch mode stopped.")
            break


def main():
    import sys
    
    manager = ArticleManager()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == '--watch':
            watch_mode()
        elif command == '--create':
            manager.load_articles()  # Load existing for category suggestions
            manager.interactive_create_article()
        elif command == '--list':
            manager.load_articles()
            manager.list_articles()
        elif command == '--build':
            manager.build()
        elif command == '--help':
            print("""
Usage: python batch.py [command]

Commands:
  --build     Build all JSON files from articles (default)
  --create    Create a new article interactively
  --list      List all existing articles
  --watch     Watch for changes and auto-rebuild
  --help      Show this help message

Examples:
  python batch.py                # Build everything
  python batch.py --create       # Create a new article
  python batch.py --list         # List all articles
  python batch.py --watch        # Watch mode
            """)
        else:
            print(f"Unknown command: {command}")
            print("Use --help for available commands")
    else:
        # Default action: build
        manager.build()


if __name__ == "__main__":
