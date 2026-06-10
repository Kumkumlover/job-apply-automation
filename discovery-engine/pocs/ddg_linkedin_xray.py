import sys
from duckduckgo_search import DDGS

def run_xray(startup_name):
    query = f'site:linkedin.com/in/ "{startup_name}" ("Engineering" OR "Product" OR "CTO" OR "Founder" OR "Hiring")'
    print(f"Searching DuckDuckGo for: {query}")
    try:
        results = DDGS().text(query, max_results=10)
        if not results:
            print("No results found.")
            return
            
        for i, result in enumerate(results):
            title = result.get('title', '')
            href = result.get('href', '')
            body = result.get('body', '')
            
            # Basic parsing of title
            parts = title.split(' - ')
            name = parts[0].strip() if parts else title.strip()
            role = parts[1].split('|')[0].strip() if len(parts) > 1 else 'Unknown'
            
            print(f"[{i+1}] Name: {name}")
            print(f"    Role: {role}")
            print(f"    LinkedIn: {href}")
            print(f"    Snippet: {body}\n")
    except Exception as e:
        print(f"Error during search: {e}")

if __name__ == "__main__":
    target = "Zenskar"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    run_xray(target)
