import requests
import urllib.parse
import urllib3
from typing import Dict, Any, Optional

# Disable warnings if SSL verification is disabled
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def resolve_location(destination: str) -> Optional[Dict[str, Any]]:
    """
    Geocodes a location name to get latitude, longitude, and full name.
    """
    encoded_query = urllib.parse.quote(destination)
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={encoded_query}&limit=1"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data:
                location_info = data[0]
                return {
                    "lat": float(location_info["lat"]),
                    "lon": float(location_info["lon"]),
                    "display_name": location_info["display_name"]
                }
        return None
    except requests.exceptions.SSLError as ssl_err:
        print(f"Nominatim SSL verification failed ({ssl_err}). Retrying with verify=False...")
        try:
            response = requests.get(url, headers=headers, verify=False, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data:
                    location_info = data[0]
                    return {
                        "lat": float(location_info["lat"]),
                        "lon": float(location_info["lon"]),
                        "display_name": location_info["display_name"]
                    }
            return None
        except Exception as retry_err:
            print(f"Error in Nominatim retry: {retry_err}")
            return None
    except Exception as e:
        print(f"Error in Nominatim geocoding: {e}")
        return None
