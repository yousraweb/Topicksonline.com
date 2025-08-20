from playwright.sync_api import sync_playwright
from urllib.parse import urljoin, urlparse
from collections import deque
import datetime

base_url = "https://topicksonline.com"

visited = set()
queue = deque([base_url])
urls = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    while queue:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        try:
            page.goto(url, timeout=15000)
            urls.append(url)

            # Get all links on the page
            links = page.eval_on_selector_all(
                "a[href]", "elements => elements.map(e => e.href)"
            )

            for link in links:
                # Keep only internal links
                if urlparse(link).netloc == urlparse(base_url).netloc and link not in visited:
                    queue.append(link)

        except Exception as e:
            print(f"⚠️ Could not crawl {url}: {e}")
            continue

    browser.close()

# Write sitemap.xml
with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in urls:
        f.write("  <url>\n")
        f.write(f"    <loc>{u}</loc>\n")
        f.write(f"    <lastmod>{datetime.date.today().isoformat()}</lastmod>\n")
        f.write("  </url>\n")
    f.write("</urlset>")

print(f"✅ Done! Found {len(urls)} URLs. Sitemap saved as sitemap.xml")
