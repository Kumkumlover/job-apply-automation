import time
import json
import re
import undetected_chromedriver as uc
from bs4 import BeautifulSoup
import sys

def scrape_linkedin_via_google(company_name):
    # Initialize stealth browser
    options = uc.ChromeOptions()
    options.add_argument("--disable-popup-blocking")
    # For local execution without headless to handle potential captchas manually if needed
    # options.add_argument("--headless") 
    
    driver = uc.Chrome(options=options)
    
    try:
        driver.get("https://www.google.com/")
        time.sleep(2)
        
        # Google Dork query
        query = f'site:linkedin.com/in "{company_name}" AND ("Product" OR "Engineering" OR "Hiring")'
        
        # Find search box and submit
        search_box = driver.find_element("name", "q")
        search_box.send_keys(query)
        search_box.submit()
        
        time.sleep(5)  # Wait for results to load
        
        # Parse the page source
        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        results = []
        
        # Google search results are usually in div tags with class 'g'
        g_divs = soup.find_all('div', class_='g')
        
        for g in g_divs:
            link_tag = g.find('a')
            if not link_tag or 'href' not in link_tag.attrs:
                continue
                
            url = link_tag['href']
            if 'linkedin.com/in/' not in url:
                continue
                
            # Title usually contains Name - Role - Company | LinkedIn
            title_tag = g.find('h3')
            title = title_tag.text if title_tag else ""
            
            # Snippet
            snippet_div = g.find('div', class_='VwiC3b') # Common class for snippets
            snippet = snippet_div.text if snippet_div else ""
            
            # Basic parsing
            name = ""
            role = ""
            
            # Attempt to parse title: "John Doe - Software Engineer - Zenskar | LinkedIn"
            parts = title.split(' - ')
            if len(parts) >= 2:
                name = parts[0].strip()
                role = parts[1].strip()
            else:
                name = title.split('|')[0].strip()
                role = "Unknown"
                
            # Fallback for role from snippet if not in title
            if role == "Unknown" or role == company_name:
                role_match = re.search(r'(Product|Engineering|Hiring|Engineer|Manager|Director|Head|VP)', snippet, re.IGNORECASE)
                if role_match:
                    role = role_match.group(0)
                    
            results.append({
                "name": name,
                "role": role,
                "url": url
            })
            
        return results

    finally:
        driver.quit()

if __name__ == "__main__":
    company = sys.argv[1] if len(sys.argv) > 1 else "Zenskar"
    print(f"Scraping for {company}...")
    employees = scrape_linkedin_via_google(company)
    print(json.dumps(employees, indent=2))
