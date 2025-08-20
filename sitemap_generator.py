import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from collections import deque
import datetime

# 🔹 Change this to your website
base_url = "https://topicksonline.com"

visited = set()
queue = deque([base_url])
urls = []

while queue:
    url = queue.popleft()
    if url in visited:
        continue
    visited.add(url)
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            urls.append(url)
            for link in soup.find_all("a", href=True):
                full_url = urljoin(base_url, link["href"])
                if full_url.startswith(base_url) and full_url not in visited:
                    queue.append(full_url)
    except:
        continue

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
