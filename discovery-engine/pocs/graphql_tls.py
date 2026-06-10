import sys
from curl_cffi import requests

def demonstrate_tls_impersonation(target_browser="chrome110"):
    """
    Demonstrates the concept of TLS fingerprint impersonation.
    This script queries a safe, diagnostic endpoint to show how the TLS handshake
    and User-Agent are modified to match the target browser.
    
    It is provided for educational purposes to understand how WAFs analyze
    TLS signatures (like JA3/JA4) and how impersonation libraries operate.
    """
    print(f"[*] Starting TLS impersonation demonstration using target: {target_browser}")
    print("[*] Querying a diagnostic endpoint to observe the TLS signature...")
    
    try:
        # Querying a diagnostic endpoint that echoes back the TLS fingerprint info
        url = "https://tls.peet.ws/api/all" 
        
        # Make the request using curl_cffi with impersonation enabled
        response = requests.get(url, impersonate=target_browser)
        
        if response.status_code == 200:
            data = response.json()
            print("\n[+] Request successful.")
            print("[+] Observed TLS Fingerprint Data:")
            print(f"    - JA3 Hash: {data.get('tls', {}).get('ja3_hash')}")
            print(f"    - HTTP Version: {data.get('http_version')}")
            
            # Show headers to demonstrate how User-Agent aligns with the TLS fingerprint
            user_agent = response.request.headers.get("User-Agent", "Not Sent")
            print(f"    - User-Agent sent: {user_agent}")
        else:
            print(f"[-] Request returned unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"[-] Error occurred during request: {e}")

if __name__ == "__main__":
    demonstrate_tls_impersonation()
