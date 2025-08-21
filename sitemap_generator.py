import os
import datetime

base_url = "https://topicksonline.com"
urls = []

def add_json_urls(folder, url_prefix):
    """Loop through JSON files in a folder and add URLs"""
    if not os.path.exists(folder):
        print(f"⚠️ Skipping missing folder: {folder}")
        return

    for filename in os.listdir(folder):
        if filename.endswith(".json"):
            slug = filename.replace(".json", "")
            if slug == "home" and url_prefix == "":  # homepage
                urls.append((f"{base_url}/", datetime.date.today().isoformat()))
            else:
                urls.append((f"{base_url}/{url_prefix}{slug}", datetime.date.today().isoformat()))

# ✅ Define your real folders
articles_folder   = os.path.join("assets", "data", "pages", "articles")
categories_folder = os.path.join("assets", "data", "pages", "categories")
pages_folder      = os.path.join("assets", "data", "pages")

# ✅ Articles
add_json_urls(articles_folder, "articles/")

# ✅ Categories
add_json_urls(categories_folder, "categories/")

# ✅ Top-level pages (about.json, privacy.json, etc.)
add_json_urls(pages_folder, "")

# ✅ Write sitemap.xml
with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for url, lastmod in urls:
        f.write("  <url>\n")
        f.write(f"    <loc>{url}</loc>\n")
        f.write(f"    <lastmod>{lastmod}</lastmod>\n")
        f.write("  </url>\n")
    f.write("</urlset>")

print(f"✅ Done! Found {len(urls)} URLs. Sitemap saved as sitemap.xml")
