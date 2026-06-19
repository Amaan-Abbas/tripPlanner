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

def call_openai_json(
    api_key: str, 
    system_prompt: str, 
    user_prompt: str, 
    model: str = "gpt-4o-mini",
    retries: int = 2
) -> Optional[Dict[str, Any]]:
    """
    Calls OpenAI Chat Completions API with system_prompt and user_prompt, requesting a JSON response.
    """
    url = "https://api.openai.com/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }
    
    for attempt in range(retries + 1):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                result = response.json()
                choices = result.get("choices", [])
                if choices:
                    message = choices[0].get("message", {})
                    text_out = message.get("content", "").strip()
                    parsed = clean_and_parse_json(text_out)
                    if parsed is not None:
                        return parsed
                
                print(f"OpenAI API Error: No valid JSON object returned in choices: {result}")
            else:
                print(f"OpenAI API Request failed with status {response.status_code}: {response.text}")

        except Exception as e:
            print(f"Error calling OpenAI API: {e}")

        if attempt < retries:
            time.sleep(1 + attempt)

    return None
