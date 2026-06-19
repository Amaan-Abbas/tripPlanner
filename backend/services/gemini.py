import requests
import json
import time
import re
from typing import Dict, Any, Optional

def clean_and_parse_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Robustly extracts, cleans, and parses a JSON object from text.
    Removes markdown wrappers and trailing commas before closing structural chars.
    """
    text = text.strip()
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    
    if first_brace == -1 or last_brace == -1 or last_brace <= first_brace:
        return None
        
    json_str = text[first_brace:last_brace + 1].strip()
    
    # 1. Try direct parse
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass
        
    # 2. Attempt cleanup: remove trailing commas before closing braces and brackets
    cleaned = re.sub(r',\s*}', '}', json_str)
    cleaned = re.sub(r',\s*\]', ']', cleaned)
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        print(f"JSON parsing failed after cleanup: {exc}")
        print(f"Raw block was:\n{json_str}")
        return None

def call_gemini_json(
    api_key: str, 
    system_prompt: str, 
    user_prompt: str, 
    model: str = "gemini-3.5-flash",
    retries: int = 4
) -> Optional[Dict[str, Any]]:
    """
    Calls Gemini API with system_prompt and user_prompt, requesting a JSON response.
    Handles 429 Rate Limits by sleeping for the API's requested retry delay.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": user_prompt}
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {"text": system_prompt}
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    for attempt in range(retries + 1):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                result = response.json()
                candidates = result.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        text_out = parts[0].get("text", "")
                        parsed = clean_and_parse_json(text_out)
                        if parsed is not None:
                            return parsed

                print(f"Gemini API Error: No valid JSON object returned in response: {result}")
            elif response.status_code == 429:
                # Rate limit hit, parse the exact retry delay
                retry_delay = 15.0 # default fallback
                try:
                    err_data = response.json()
                    details = err_data.get("error", {}).get("details", [])
                    for detail in details:
                        if "retrydelay" in str(detail.keys()).lower():
                            delay_str = detail.get("retryDelay", "15s")
                            # strip 's' and convert to float
                            delay_val = float(delay_str.rstrip("s"))
                            retry_delay = max(retry_delay, delay_val + 1.0)
                except Exception as e:
                    print(f"Error parsing Gemini 429 retry delay: {e}")
                
                print(f"Gemini Rate Limit (429) hit. Sleeping {retry_delay}s before retry (Attempt {attempt + 1}/{retries + 1})...")
                time.sleep(retry_delay)
                # We continue without raising, which causes the loop to retry
                continue
            else:
                print(f"Gemini API Request failed with status {response.status_code}: {response.text}")

        except Exception as e:
            print(f"Error calling Gemini API: {e}")

        if attempt < retries:
            time.sleep(2 + attempt * 2)

    return None
