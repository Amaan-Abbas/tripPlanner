import requests
import urllib.parse
from typing import List, Dict, Any, Optional

def search_wikipedia(query: str) -> List[Dict[str, Any]]:
    """
    Searches Wikipedia for key terms and returns snippets.
    """
    encoded_query = urllib.parse.quote(query)
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded_query}&format=json&origin=*"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            search_results = data.get("query", {}).get("search", [])
            results = []
            for r in search_results[:5]:
                snippet = r.get("snippet", "")
                # Clean html tags from snippet
                snippet = snippet.replace("<span class=\"searchmatch\">", "").replace("</span>", "")
                snippet = snippet.replace("&quot;", '"').replace("&amp;", '&').replace("&#039;", "'")
                results.append({
                    "title": r.get("title") + " (Wikipedia)",
                    "description": snippet,
                    "url": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(r.get('title'))}"
                })
            return results
    except Exception as e:
        print(f"Error in Wikipedia search fallback: {e}")
    return []

def search_duckduckgo_free(query: str) -> List[Dict[str, Any]]:
    """
    Scrapes DuckDuckGo Lite/HTML for web results. No API key needed.
    """
    url = "https://html.duckduckgo.com/html/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.post(url, data={"q": query}, headers=headers, timeout=10)
        if response.status_code == 200:
            html = response.text
            results = []
            start = 0
            while len(results) < 5:
                idx = html.find("class=\"result__snippet\"", start)
                if idx == -1:
                    break
                
                snippet_start = html.find(">", idx) + 1
                snippet_end = html.find("</a>", snippet_start)
                snippet = html[snippet_start:snippet_end].strip()
                
                # Remove nested tags
                while "<" in snippet and ">" in snippet:
                    left = snippet.find("<")
                    right = snippet.find(">", left)
                    if left != -1 and right != -1:
                        snippet = snippet[:left] + snippet[right+1:]
                    else:
                        break
                
                snippet = snippet.replace("&quot;", '"').replace("&amp;", '&').replace("&#039;", "'")
                
                title_idx = html.rfind("class=\"result__a\"", 0, idx)
                if title_idx != -1:
                    href_idx = html.find("href=\"", title_idx)
                    href_start = href_idx + 6
                    href_end = html.find("\"", href_start)
                    link = html[href_start:href_end]
                    
                    if "uddg=" in link:
                        redirect_param = link.split("uddg=")[1].split("&")[0]
                        link = urllib.parse.unquote(redirect_param)
                    
                    title_start = html.find(">", title_idx) + 1
                    title_end = html.find("</a>", title_start)
                    title = html[title_start:title_end].strip()
                    while "<" in title and ">" in title:
                        t_left = title.find("<")
                        t_right = title.find(">", t_left)
                        if t_left != -1 and t_right != -1:
                            title = title[:t_left] + title[t_right+1:]
                        else:
                            break
                            
                    results.append({
                        "title": title,
                        "description": snippet,
                        "url": link
                    })
                
                start = idx + 10
            return results
    except Exception as e:
        print(f"Error in DuckDuckGo scraping: {e}")
    return []

def search_web(query: str, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Searches the web. Uses Brave Search API if a key is provided, 
    otherwise falls back to free keyless DuckDuckGo scraping & Wikipedia Search.
    """
    api_key = (api_key or "").strip()
    
    if api_key:
        url = f"https://api.search.brave.com/res/v1/web/search?q={urllib.parse.quote(query)}"
        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": api_key
        }
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                web_results = data.get("web", {}).get("results", [])
                results = []
                for r in web_results[:5]:
                    results.append({
                        "title": r.get("title"),
                        "description": r.get("description"),
                        "url": r.get("url")
                    })
                return results
            else:
                print(f"Brave Search API request failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error querying Brave Search API: {e}")
            
    # Fallback to free zero-config search options
    ddg_results = search_duckduckgo_free(query)
    if ddg_results:
        return ddg_results
        
    return search_wikipedia(query)
