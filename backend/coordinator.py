import json
import traceback
import time
from typing import Generator, Dict, Any, List, Optional

# Services
from backend.services.nominatim import resolve_location
from backend.services.weather import get_weather_forecast
from backend.services.overpass import get_local_attractions
from backend.services.gemini import call_gemini_json
from backend.services.openai import call_openai_json
from backend.services.brave import search_web

# Agents
from backend.agents.transport_stay import run_transport_stay_agent
from backend.agents.prompts import (
    DESTINATION_SYSTEM_PROMPT, DESTINATION_USER_PROMPT,
    WEATHER_SYSTEM_PROMPT, WEATHER_USER_PROMPT,
    ATTRACTIONS_SYSTEM_PROMPT, ATTRACTIONS_USER_PROMPT,
    BUDGET_SYSTEM_PROMPT, BUDGET_USER_PROMPT,
    TRAVEL_TIPS_SYSTEM_PROMPT, TRAVEL_TIPS_USER_PROMPT,
    ITINERARY_SYSTEM_PROMPT, ITINERARY_USER_PROMPT
)

def run_agentic_trip_planner(api_key: str, inputs: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
    """
    Sequentially executes the multi-agent trip planning workflow.
    Yields log events during execution, ending with a final completed state event.
    """
    destination = inputs.get("destination")
    duration = int(inputs.get("duration", 3))
    budget_tier = inputs.get("budget_tier", "Moderate")
    travel_style = inputs.get("travel_style", "Cultural")
    interests = inputs.get("interests", [])
    constraints = inputs.get("constraints", [])
    
    llm_provider = inputs.get("llm_provider", "gemini")
    brave_api_key = inputs.get("brave_api_key")
    weather_api_key = inputs.get("weather_api_key")
    
    trip_state = {
        "user_inputs": {
            "destination": destination,
            "duration": duration,
            "budget_tier": budget_tier,
            "travel_style": travel_style,
            "interests": interests,
            "constraints": constraints
        },
        "resolved_location": None,
        "weather_forecast": [],
        "osm_attractions": [],
        "destination_details": None,
        "weather_report": None,
        "selected_attractions": [],
        "budget_breakdown": None,
        "transport_stay_details": None,
        "travel_tips": None,
        "itinerary": [],
        "status": "running",
        "current_agent": None,
        "logs": [],
        "api_calls": [],     # Performance monitoring for APIs
        "metrics": {}        # Agent-specific execution latency metrics
    }
    
    def log_and_yield(agent: str, msg: str):
        log_entry = f"[{agent}] {msg}"
        trip_state["logs"].append(log_entry)
        trip_state["current_agent"] = agent
        yield {
            "type": "progress",
            "agent": agent,
            "message": msg,
            "state": trip_state
        }
        
    def call_llm_json(agent_name: str, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        if llm_provider == "gemini":
            # Spacing calls out slightly to avoid rate limit spikes
            time.sleep(3)
            
        start_time = time.time()
        provider_label = llm_provider.upper()
        model_name = "gpt-4o-mini" if llm_provider == "openai" else "gemini-3.5-flash"
        
        try:
            if llm_provider == "openai":
                res = call_openai_json(api_key, system_prompt, user_prompt, model=model_name)
            else:
                res = call_gemini_json(api_key, system_prompt, user_prompt, model=model_name)
        except Exception as e:
            print(f"LLM call exception in {agent_name}: {e}")
            res = None
            
        duration_ms = int((time.time() - start_time) * 1000)
        status = "success" if res is not None else "error"
        trip_state["api_calls"].append({
            "service": f"LLM ({provider_label})",
            "status": status,
            "duration_ms": duration_ms,
            "endpoint": f"/{model_name}/generateContent"
        })
        return res
        
    try:
        # Step 0: Resolve Coordinates (Nominatim)
        yield from log_and_yield("Coordinator", f"Resolving coordinates for destination: '{destination}'...")
        start_api = time.time()
        loc = resolve_location(destination)
        duration_ms = int((time.time() - start_api) * 1000)
        trip_state["api_calls"].append({
            "service": "Nominatim Geocoding",
            "status": "success" if loc else "error",
            "duration_ms": duration_ms,
            "endpoint": "/search?format=json"
        })
        
        if not loc:
            yield from log_and_yield("Coordinator", "Nominatim lookup failed or rate-limited. Falling back to LLM geocoding...")
            coord_prompt = f"""You are a Geocoding Resolver. Given the location name '{destination}', find its approximate latitude, longitude, and standard full display name.
            You must return ONLY a raw JSON object matching this structure:
            {{
                "lat": 26.8467,
                "lon": 80.9462,
                "display_name": "Lucknow, Uttar Pradesh, India"
            }}
            Do not include any markdown wrappers or backticks. Return raw valid JSON. Use real lat/lon coordinates."""
            
            loc = call_llm_json("Coordinator", DESTINATION_SYSTEM_PROMPT, coord_prompt)
            if loc:
                try:
                    loc["lat"] = float(loc["lat"])
                    loc["lon"] = float(loc["lon"])
                except Exception:
                    loc = None
        
        if not loc:
            yield {
                "type": "error",
                "message": f"Could not find coordinates for destination: '{destination}' (Both Nominatim and LLM lookup failed)"
            }
            return
        
        trip_state["resolved_location"] = loc
        lat, lon = loc["lat"], loc["lon"]
        yield from log_and_yield("Coordinator", f"Resolved to: {loc['display_name']} ({lat}, {lon})")
        
        # Step 1A: Fetch Weather Forecast
        weather_service_label = "WeatherAPI" if weather_api_key else "Open-Meteo (Free)"
        weather_endpoint = "/v1/forecast.json" if weather_api_key else "/v1/forecast"
        yield from log_and_yield("Coordinator", f"Downloading forecast from {weather_service_label}...")
        
        start_api = time.time()
        weather = get_weather_forecast(lat, lon, api_key=weather_api_key)
        duration_ms = int((time.time() - start_api) * 1000)
        trip_state["api_calls"].append({
            "service": f"Weather Service ({weather_service_label})",
            "status": "success" if weather else "error",
            "duration_ms": duration_ms,
            "endpoint": weather_endpoint
        })
        
        if weather:
            trip_state["weather_forecast"] = weather[:duration]
            yield from log_and_yield("Coordinator", f"Weather forecast downloaded successfully ({len(trip_state['weather_forecast'])} days).")
        else:
            yield from log_and_yield("Coordinator", "Warning: Could not fetch weather forecast. Proceeding with clear weather fallback.")
            # Fallback mock weather for resilience
            import datetime
            today = datetime.date.today()
            trip_state["weather_forecast"] = [
                {
                    "date": str(today + datetime.timedelta(days=i)),
                    "max_temp": 22.0,
                    "min_temp": 15.0,
                    "condition": "Mild and Clear ☀️",
                    "code": 0
                }
                for i in range(duration)
            ]
            
        # Step 1B: Fetch OSM Points of Interest (Overpass)
        yield from log_and_yield("Coordinator", "Fetching points of interest from OpenStreetMap (Overpass API)...")
        start_api = time.time()
        osm_places = get_local_attractions(lat, lon)
        duration_ms = int((time.time() - start_api) * 1000)
        trip_state["api_calls"].append({
            "service": "OpenStreetMap Overpass",
            "status": "success" if osm_places else "empty/error",
            "duration_ms": duration_ms,
            "endpoint": "/api/interpreter"
        })
        trip_state["osm_attractions"] = osm_places
        yield from log_and_yield("Coordinator", f"Fetched {len(osm_places)} nearby sights from OpenStreetMap.")

        # Step 1C: Perform Web Search for live data context (Brave or Fallbacks)
        search_service_label = "Brave Search" if brave_api_key else "DuckDuckGo/Wikipedia (Free)"
        search_endpoint = "/res/v1/web/search" if brave_api_key else "/html"
        yield from log_and_yield("Coordinator", f"Querying search engine ({search_service_label}) for live destination highlights...")
        
        start_api = time.time()
        search_query = f"top attractions travel guide historical significance of {destination}"
        search_results = search_web(search_query, api_key=brave_api_key)
        duration_ms = int((time.time() - start_api) * 1000)
        trip_state["api_calls"].append({
            "service": f"Search Service ({search_service_label})",
            "status": "success" if search_results else "error",
            "duration_ms": duration_ms,
            "endpoint": search_endpoint
        })
        
        search_context = ""
        if search_results:
            search_context = "Here is real-time web search context regarding the destination:\n"
            for i, r in enumerate(search_results[:4]):
                search_context += f"- Result {i+1}: {r['title']}\n  Snippet: {r['description']}\n  URL: {r['url']}\n\n"
            yield from log_and_yield("Coordinator", "Web search completed. Real-time context successfully integrated.")
        else:
            search_context = "No additional search context available. Fallback to default LLM knowledge."
            yield from log_and_yield("Coordinator", "Warning: Search query returned no results. Proceeding with LLM knowledge database.")
        
        # Step 2: Run Destination Agent
        yield from log_and_yield("Destination Agent", "Researching history, culture, and highlights of the location...")
        start_agent = time.time()
        dest_prompt = DESTINATION_USER_PROMPT.format(
            destination=loc["display_name"],
            travel_style=travel_style,
            interests=", ".join(interests) if interests else "None",
            search_context=search_context
        )
        dest_details = call_llm_json("Destination Agent", DESTINATION_SYSTEM_PROMPT, dest_prompt)
        if dest_details:
            # Sanitize outputs
            dest_details["overview"] = dest_details.get("overview", "Overview unavailable.")
            dest_details["culture_highlights"] = dest_details.get("culture_highlights", "Cultural highlights unavailable.")
            dest_details["geography_notes"] = dest_details.get("geography_notes", "Geography details unavailable.")
            dest_details["best_time_to_visit"] = dest_details.get("best_time_to_visit", "Season details unavailable.")
            
            trip_state["destination_details"] = dest_details
            trip_state["metrics"]["Destination Agent"] = int((time.time() - start_agent) * 1000)
            yield from log_and_yield("Destination Agent", "Destination research finished.")
        else:
            raise Exception("Destination Agent failed to return valid data.")
            
        # Step 3: Run Weather Agent
        yield from log_and_yield("Weather Agent", "Analyzing forecast parameters to formulate guidance...")
        start_agent = time.time()
        forecast_summary = "\n".join([
            f"- {w['date']}: {w['condition']}, Max Temp: {w['max_temp']}C, Min Temp: {w['min_temp']}C"
            for w in trip_state["weather_forecast"]
        ])
        weather_user_prompt = WEATHER_USER_PROMPT.format(
            destination=loc["display_name"],
            forecast_data=forecast_summary
        )
        weather_details = call_llm_json("Weather Agent", WEATHER_SYSTEM_PROMPT, weather_user_prompt)
        if weather_details:
            # Sanitize outputs
            weather_details["summary"] = weather_details.get("summary", "Summary unavailable.")
            weather_details["clothing_recommendations"] = weather_details.get("clothing_recommendations", ["Layered clothing"])
            weather_details["activity_guidance"] = weather_details.get("activity_guidance", "Proceed with standard precautions.")
            
            trip_state["weather_report"] = weather_details
            trip_state["metrics"]["Weather Agent"] = int((time.time() - start_agent) * 1000)
            yield from log_and_yield("Weather Agent", "Weather analysis finished.")
        else:
            raise Exception("Weather Agent failed to return valid data.")
            
        # Step 4: Run Attractions Agent
        yield from log_and_yield("Attractions Agent", "Selecting and tailoring sights based on travel interests...")
        start_agent = time.time()
        attractions_user_prompt = ATTRACTIONS_USER_PROMPT.format(
            destination=loc["display_name"],
            travel_style=travel_style,
            interests=", ".join(interests) if interests else "None",
            osm_attractions=json.dumps(osm_places[:15]),
            search_context=search_context
        )
        attractions_details = call_llm_json("Attractions Agent", ATTRACTIONS_SYSTEM_PROMPT, attractions_user_prompt)
        if attractions_details and "selected_attractions" in attractions_details:
            sanitized_attractions = []
            for a in attractions_details["selected_attractions"]:
                try:
                    duration_val = float(a.get("duration_hours", 2.0))
                except Exception:
                    duration_val = 2.0
                try:
                    cost_val = float(a.get("estimated_cost_usd", 0.0))
                except Exception:
                    cost_val = 0.0
                    
                sanitized_attractions.append({
                    "name": a.get("name", "Local Attraction"),
                    "description": a.get("description", "Scenic location worth visiting."),
                    "category": a.get("category", "Sightseeing"),
                    "duration_hours": duration_val,
                    "estimated_cost_usd": cost_val
                })
                
            trip_state["selected_attractions"] = sanitized_attractions
            trip_state["metrics"]["Attractions Agent"] = int((time.time() - start_agent) * 1000)
            yield from log_and_yield("Attractions Agent", f"Selected {len(trip_state['selected_attractions'])} attractions.")
        else:
            raise Exception("Attractions Agent failed to return valid data.")
            
        # Step 5: Run Budget Agent
        yield from log_and_yield("Budget Agent", "Evaluating costs, allocating category spends, and devising saving tips...")
        start_agent = time.time()
        budget_user_prompt = BUDGET_USER_PROMPT.format(
            destination=loc["display_name"],
            duration=duration,
            budget_tier=budget_tier
        )
        budget_details = call_llm_json("Budget Agent", BUDGET_SYSTEM_PROMPT, budget_user_prompt)
        if budget_details:
            try:
                total_cost = float(budget_details.get("total_estimated_cost_usd", 0.0))
            except Exception:
                total_cost = 0.0
            try:
                daily_rate = float(budget_details.get("daily_rate_usd", 0.0))
            except Exception:
                daily_rate = 0.0
                
            sanitized_allocations = []
            for alloc in budget_details.get("allocations", []):
                try:
                    amount = float(alloc.get("amount_usd", 0.0))
                except Exception:
                    amount = 0.0
                try:
                    pct = float(alloc.get("percentage", 0.0))
                except Exception:
                    pct = 0.0
                    
                sanitized_allocations.append({
                    "category": alloc.get("category", "Miscellaneous"),
                    "amount_usd": amount,
                    "percentage": pct,
                    "description": alloc.get("description", "Category allocation.")
                })
                
            budget_details["total_estimated_cost_usd"] = total_cost
            budget_details["daily_rate_usd"] = daily_rate
            budget_details["allocations"] = sanitized_allocations
            budget_details["saving_tips"] = budget_details.get("saving_tips", ["Avoid tourist traps and plan meals in advance."])
            
            trip_state["budget_breakdown"] = budget_details
            trip_state["metrics"]["Budget Agent"] = int((time.time() - start_agent) * 1000)
            yield from log_and_yield("Budget Agent", f"Calculated total budget of ${budget_details['total_estimated_cost_usd']} USD.")
        else:
            raise Exception("Budget Agent failed to return valid data.")
            
        # Step 6: Run Transport & Stay Agent
        yield from log_and_yield("Transport & Stay Agent", "Sourcing safe areas, highly-rated accommodations, and convenient transport options...")
        start_agent = time.time()
        accommodation_budget = 150.0
        transport_budget = 50.0
        if trip_state["budget_breakdown"]:
            for alloc in trip_state["budget_breakdown"].get("allocations", []):
                if alloc["category"].lower() == "accommodation":
                    accommodation_budget = alloc["amount_usd"]
                elif alloc["category"].lower() == "transport":
                    transport_budget = alloc["amount_usd"]
                    
        ts_details = run_transport_stay_agent(
            api_key=api_key,
            destination=loc["display_name"],
            budget_tier=budget_tier,
            duration=duration,
            accommodation_budget_total=accommodation_budget,
            transport_budget_total=transport_budget,
            llm_provider=llm_provider
        )
        if ts_details:
            ts_details["recommended_neighborhoods"] = ts_details.get("recommended_neighborhoods", ["Safe central district"])
            
            sanitized_stays = []
            for s in ts_details.get("stay_recommendations", []):
                try:
                    price = float(s.get("average_price_per_night_usd", 100.0))
                except Exception:
                    price = 100.0
                    
                sanitized_stays.append({
                    "hotel_name": s.get("hotel_name", "Safe Hotel Option"),
                    "neighborhood": s.get("neighborhood", "Downtown"),
                    "safety_score": s.get("safety_score", "Verified Safe (9.0/10)"),
                    "rating_score": s.get("rating_score", "4.0/5"),
                    "average_price_per_night_usd": price,
                    "safety_features": s.get("safety_features", ["24/7 security"]),
                    "description": s.get("description", "Conveniently located lodging recommendation.")
                })
            
            sanitized_trans = []
            for t in ts_details.get("transport_recommendations", []):
                try:
                    cost = float(t.get("average_cost_usd", 15.0))
                except Exception:
                    cost = 15.0
                    
                sanitized_trans.append({
                    "mode_name": t.get("mode_name", "Public Transit"),
                    "average_cost_usd": cost,
                    "convenience_rating": t.get("convenience_rating", "High"),
                    "description": t.get("description", "Convenient local transit.")
                })
                
            ts_details["stay_recommendations"] = sanitized_stays
            ts_details["transport_recommendations"] = sanitized_trans
            ts_details["general_safety_tips"] = ts_details.get("general_safety_tips", ["Keep your documents secure and stay aware of your surroundings."])
            
            trip_state["transport_stay_details"] = ts_details
            trip_state["metrics"]["Transport & Stay Agent"] = int((time.time() - start_agent) * 1000)
            trip_state["api_calls"].append({
                "service": "Transport & Stay Agent LLM",
                "status": "success",
                "duration_ms": int((time.time() - start_agent) * 1000),
                "endpoint": f"/gpt-4o-mini" if llm_provider == "openai" else "/gemini-3.5-flash"
            })
            yield from log_and_yield("Transport & Stay Agent", f"Lodging and transit plan generated. Recommended stays in: {', '.join(ts_details.get('recommended_neighborhoods', []))}")
        else:
            raise Exception("Transport & Stay Agent failed to return valid data.")
            
        # Step 7: Run Travel Tips Agent
        yield from log_and_yield("Travel Tips Agent", "Creating customized packing items, safety alerts, and cultural protocols...")
        start_agent = time.time()
        tips_user_prompt = TRAVEL_TIPS_USER_PROMPT.format(
            destination=loc["display_name"],
            travel_style=travel_style,
            constraints=", ".join(constraints) if constraints else "None",
            interests=", ".join(interests) if interests else "None"
        )
        tips_details = call_llm_json("Travel Tips Agent", TRAVEL_TIPS_SYSTEM_PROMPT, tips_user_prompt)
        if tips_details:
            tips_details["packing_checklist"] = tips_details.get("packing_checklist", ["Universal charger", "Toiletries", "Comfortable walking shoes"])
            tips_details["safety_precautions"] = tips_details.get("safety_precautions", ["Keep emergency contacts accessible."])
            tips_details["local_etiquette"] = tips_details.get("local_etiquette", ["Respect local guidelines and customs."])
            
            trip_state["travel_tips"] = tips_details
            trip_state["metrics"]["Travel Tips Agent"] = int((time.time() - start_agent) * 1000)
            yield from log_and_yield("Travel Tips Agent", "Checklists and tips completed.")
        else:
            raise Exception("Travel Tips Agent failed to return valid data.")
            
        # Step 8: Run Itinerary Agent
        yield from log_and_yield("Itinerary Agent", "Sequencing activities, embedding travel nodes, and assembling the master calendar...")
        start_agent = time.time()
        
        weather_summary_for_itinerary = "\n".join([
            f"- Day {i+1} ({w['date']}): {w['condition']}"
            for i, w in enumerate(trip_state["weather_forecast"])
        ])
        
        attractions_text = "\n".join([
            f"- {a['name']} ({a['category']}): {a['description']} (Est. duration: {a['duration_hours']}h, Cost: ${a['estimated_cost_usd']})"
            for a in trip_state["selected_attractions"]
        ])
        
        ts_summary = ""
        if trip_state["transport_stay_details"]:
            stays_list = ", ".join([h["hotel_name"] for h in trip_state["transport_stay_details"].get("stay_recommendations", [])])
            trans_list = ", ".join([t["mode_name"] for t in trip_state["transport_stay_details"].get("transport_recommendations", [])])
            ts_summary = f"Recommended hotels: [{stays_list}]. Recommended transportation: [{trans_list}]."
            
        itinerary_user_prompt = ITINERARY_USER_PROMPT.format(
            destination=loc["display_name"],
            duration=duration,
            budget_tier=budget_tier,
            travel_style=travel_style,
            weather_summary=weather_summary_for_itinerary,
            selected_attractions=attractions_text,
            transport_stay=ts_summary
        )
        
        itinerary_details = call_llm_json("Itinerary Agent", ITINERARY_SYSTEM_PROMPT, itinerary_user_prompt)
        if itinerary_details and "itinerary" in itinerary_details:
            sanitized_itinerary = []
            for d in itinerary_details["itinerary"]:
                try:
                    day_num = int(d.get("day_number", 1))
                except Exception:
                    day_num = 1
                    
                # slots
                morning = d.get("morning", {})
                morning_san = {
                    "title": morning.get("title", "Relax and Explore"),
                    "description": morning.get("description", "Sightseeing around the local historic landmarks."),
                    "duration_hours": float(morning.get("duration_hours", 2.0) or 2.0),
                    "estimated_cost_usd": float(morning.get("estimated_cost_usd", 0.0) or 0.0),
                    "transport_method": morning.get("transport_method", "Walk")
                }
                
                afternoon = d.get("afternoon", {})
                afternoon_san = {
                    "title": afternoon.get("title", "Local Sights & Lunch"),
                    "description": afternoon.get("description", "Visit museums, local streets, and enjoy regional cuisine."),
                    "duration_hours": float(afternoon.get("duration_hours", 2.5) or 2.5),
                    "estimated_cost_usd": float(afternoon.get("estimated_cost_usd", 0.0) or 0.0),
                    "transport_method": afternoon.get("transport_method", "Transit")
                }
                
                evening = d.get("evening", {})
                evening_san = {
                    "title": evening.get("title", "Dinner & Leisure Walk"),
                    "description": evening.get("description", "Sample local street food and enjoy a evening walk."),
                    "duration_hours": float(evening.get("duration_hours", 2.0) or 2.0),
                    "estimated_cost_usd": float(evening.get("estimated_cost_usd", 0.0) or 0.0),
                    "transport_method": evening.get("transport_method", "Walk")
                }
                
                sanitized_itinerary.append({
                    "day_number": day_num,
                    "day_title": d.get("day_title", "Exploring local sights"),
                    "weather_summary": d.get("weather_summary", "Clear weather"),
                    "morning": morning_san,
                    "afternoon": afternoon_san,
                    "evening": evening_san,
                    "stay_overnight": d.get("stay_overnight", "Selected stay"),
                    "daily_notes": d.get("daily_notes")
                })
                
            trip_state["itinerary"] = sanitized_itinerary
            trip_state["metrics"]["Itinerary Agent"] = int((time.time() - start_agent) * 1000)
            yield from log_and_yield("Itinerary Agent", "Itinerary compiled.")
        else:
            raise Exception("Itinerary Agent failed to return valid data.")
            
        # Complete
        trip_state["status"] = "completed"
        trip_state["current_agent"] = None
        
        # Calculate summary metrics
        total_api_time = sum(call["duration_ms"] for call in trip_state["api_calls"])
        total_agent_time = sum(time for time in trip_state["metrics"].values())
        trip_state["metrics"]["Total API Latency (ms)"] = total_api_time
        trip_state["metrics"]["Total Agent Execution (ms)"] = total_agent_time
        
        yield from log_and_yield("Coordinator", "Trip orchestration completed successfully! Rendering dashboard...")
        
        yield {
            "type": "completed",
            "state": trip_state
        }
        
    except Exception as e:
        print("Error during trip planning orchestration:")
        traceback.print_exc()
        trip_state["status"] = "error"
        yield {
            "type": "error",
            "message": f"Orchestration failure in {trip_state.get('current_agent', 'Coordinator')}: {str(e)}"
        }
