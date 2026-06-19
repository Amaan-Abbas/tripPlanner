import requests
from typing import Dict, Any, Optional, List

WMO_WEATHER_CODES = {
    0: "Clear Sky ☀️",
    1: "Mainly Clear 🌤️",
    2: "Partly Cloudy ⛅",
    3: "Overcast ☁️",
    45: "Foggy 🌫️",
    48: "Depositing Rime Fog 🌫️",
    51: "Light Drizzle 🌧️",
    53: "Moderate Drizzle 🌧️",
    55: "Dense Drizzle 🌧️",
    56: "Light Freezing Drizzle 🌨️",
    57: "Dense Freezing Drizzle 🌨️",
    61: "Slight Rain 🌧️",
    63: "Moderate Rain 🌧️",
    65: "Heavy Rain 🌧️🌧️",
    66: "Light Freezing Rain 🌨️",
    67: "Heavy Freezing Rain 🌨️",
    71: "Slight Snow Fall ❄️",
    73: "Moderate Snow Fall ❄️",
    75: "Heavy Snow Fall ❄️❄️",
    77: "Snow Grains ❄️",
    80: "Slight Rain Showers 🌦️",
    81: "Moderate Rain Showers 🌦️",
    82: "Violent Rain Showers ⛈️",
    85: "Slight Snow Showers 🌨️",
    86: "Heavy Snow Showers 🌨️",
    95: "Thunderstorm 🌩️",
    96: "Thunderstorm with Slight Hail ⛈️",
    99: "Thunderstorm with Heavy Hail ⛈️"
}

def get_weather_forecast(lat: float, lon: float, api_key: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
    """
    Fetches 7-day weather forecast. Uses WeatherAPI if a key is provided,
    otherwise falls back to Open-Meteo API (free, no key required).
    """
    api_key = (api_key or "").strip()
    
    if api_key:
        # WeatherAPI.com forecast endpoint
        url = f"http://api.weatherapi.com/v1/forecast.json?key={api_key}&q={lat},{lon}&days=7&aqi=no&alerts=no"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                forecast_days = data.get("forecast", {}).get("forecastday", [])
                forecast = []
                for day_data in forecast_days:
                    day = day_data.get("day", {})
                    cond = day.get("condition", {})
                    text = cond.get("text", "Unknown")
                    code = cond.get("code", 0)
                    
                    # Add an appropriate emoji to the condition text for aesthetic UI
                    text_lower = text.lower()
                    emoji = "☀️" if "sun" in text_lower or "clear" in text_lower else \
                            "⛅" if "partly" in text_lower or "overcast" in text_lower or "cloud" in text_lower else \
                            "🌧️" if "rain" in text_lower or "drizzle" in text_lower or "shower" in text_lower else \
                            "❄️" if "snow" in text_lower or "sleet" in text_lower or "ice" in text_lower else \
                            "⛈️" if "thunder" in text_lower or "storm" in text_lower else "🌫️"
                    
                    forecast.append({
                        "date": day_data.get("date"),
                        "max_temp": day.get("maxtemp_c"),
                        "min_temp": day.get("mintemp_c"),
                        "condition": f"{text} {emoji}",
                        "code": code
                    })
                return forecast
            else:
                print(f"WeatherAPI request failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error querying WeatherAPI: {e}")

    # Fallback to Open-Meteo API
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            daily = data.get("daily", {})
            times = daily.get("time", [])
            codes = daily.get("weathercode", [])
            max_temps = daily.get("temperature_2m_max", [])
            min_temps = daily.get("temperature_2m_min", [])
            
            forecast = []
            for i in range(len(times)):
                code = codes[i] if i < len(codes) else 0
                desc = WMO_WEATHER_CODES.get(code, "Unknown Weather")
                forecast.append({
                    "date": times[i],
                    "max_temp": max_temps[i] if i < len(max_temps) else None,
                    "min_temp": min_temps[i] if i < len(min_temps) else None,
                    "condition": desc,
                    "code": code
                })
            return forecast
        return None
    except Exception as e:
        print(f"Error fetching Open-Meteo weather forecast: {e}")
        return None
