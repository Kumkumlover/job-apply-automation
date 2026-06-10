import sys
import requests

def run_github_osint(startup_name):
    url = f"https://api.github.com/search/users?q=company:{startup_name}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    print(f"Querying GitHub API: {url}")
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        items = data.get('items', [])
        if not items:
            print(f"No users found associated with company: {startup_name}")
            return
            
        print(f"Found {len(items)} users. Fetching details for up to 5...\n")
        
        for i, item in enumerate(items[:5]):
            user_url = item.get('url')
            if user_url:
                user_resp = requests.get(user_url, headers=headers)
                if user_resp.status_code == 200:
                    user_data = user_resp.json()
                    name = user_data.get('name') or item.get('login')
                    company = user_data.get('company', 'Unknown')
                    bio = user_data.get('bio', '')
                    blog = user_data.get('blog', '')
                    
                    print(f"[{i+1}] Name/Login: {name}")
                    print(f"    Company: {company}")
                    print(f"    Bio: {bio}")
                    print(f"    Blog/Website: {blog}")
                    print(f"    GitHub Profile: {item.get('html_url')}\n")
    except Exception as e:
        print(f"Error during GitHub API request: {e}")

if __name__ == "__main__":
    target = "Zenskar"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    run_github_osint(target)
