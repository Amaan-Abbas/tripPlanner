import requests
from typing import List, Dict, Any

def get_local_attractions(lat: float, lon: float, radius_meters: int = 5000) -> List[Dict[str, Any]]:
    """
    Queries OpenStreetMap Overpass API for tourist attractions, museums, and historical nodes
    within the specified radius (default 5km) around coordinates.
    """
    # Overpass QL query targeting tourist attractions and historic spots
    query = f"""
    [out:json][timeout:10];
    (
      node["tourism"="attraction"](around:{radius_meters},{lat},{lon});
      node["tourism"="museum"](around:{radius_meters},{lat},{lon});
      node["historic"](around:{radius_meters},{lat},{lon});
    );
    out tags 15;
    """
    
    url = "https://overpass-api.de/api/interpreter"
    
    try:
        response = requests.post(url, data={"data": query}, timeout=12)
        if response.status_code == 200:
            data = response.json()
            elements = data.get("elements", [])
            
            attractions = []
            seen_names = set()
            
            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name")
                if not name:
                    continue
                
                # De-duplicate attractions by name
                if name.lower() in seen_names:
                    continue
                seen_names.add(name.lower())
                
                category = tags.get("tourism") or tags.get("historic") or "attraction"
                description = tags.get("description") or tags.get("wikidata") or f"Historical or tourist landmark of type {category}."
                
                attractions.append({
                    "name": name,
                    "type": category.capitalize(),
                    "description": description
                })
                
            return attractions
        return []
    except Exception as e:
        print(f"Error querying Overpass API: {e}")
        # Return empty list, agent will fallback to LLM generation
        return []
