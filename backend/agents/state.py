from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class UserInputs(BaseModel):
    destination: str
    duration: int = Field(..., ge=1, le=7)
    budget_tier: str # Budget, Moderate, Luxury
    travel_style: str # Solo, Couple, Family, Friends, Adventure, Cultural, etc.
    interests: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)

class ResolvedLocation(BaseModel):
    lat: float
    lon: float
    display_name: str

class WeatherForecastDay(BaseModel):
    date: str
    max_temp: Optional[float] = None
    min_temp: Optional[float] = None
    condition: str
    code: int

class OSMAttraction(BaseModel):
    name: str
    type: str
    description: str

class DestinationDetails(BaseModel):
    overview: str
    culture_highlights: str
    geography_notes: str
    best_time_to_visit: str

class WeatherReport(BaseModel):
    summary: str
    clothing_recommendations: List[str] = Field(default_factory=list)
    activity_guidance: str

class SelectedAttraction(BaseModel):
    name: str
    description: str
    category: str
    duration_hours: float
    estimated_cost_usd: float

class BudgetAllocation(BaseModel):
    category: str # Accommodation, Food, Transport, Activities, Buffer
    amount_usd: float
    percentage: float
    description: str

class BudgetBreakdown(BaseModel):
    total_estimated_cost_usd: float
    daily_rate_usd: float
    allocations: List[BudgetAllocation] = Field(default_factory=list)
    saving_tips: List[str] = Field(default_factory=list)

class StayOption(BaseModel):
    hotel_name: str
    neighborhood: str
    safety_score: str # e.g. "Excellent (9.5/10)", "Very Safe (9/10)"
    rating_score: str # e.g. "8.8/10 (Superb)", "4.5/5 stars"
    average_price_per_night_usd: float
    safety_features: List[str] = Field(default_factory=list) # e.g. ["24/7 reception", "Secured card access", "Well-lit entrance"]
    description: str

class TransportOption(BaseModel):
    mode_name: str # e.g. "Tokyo Metro Pass", "Standard Taxi / Uber", "Private Airport Shuttle"
    average_cost_usd: float
    convenience_rating: str # e.g. "High", "Medium", "Very High"
    description: str

class TransportStayDetails(BaseModel):
    recommended_neighborhoods: List[str] = Field(default_factory=list)
    stay_recommendations: List[StayOption] = Field(default_factory=list)
    transport_recommendations: List[TransportOption] = Field(default_factory=list)
    general_safety_tips: List[str] = Field(default_factory=list)

class TravelTips(BaseModel):
    packing_checklist: List[str] = Field(default_factory=list)
    safety_precautions: List[str] = Field(default_factory=list)
    local_etiquette: List[str] = Field(default_factory=list)

class ItineraryActivity(BaseModel):
    title: str
    description: str
    duration_hours: float
    estimated_cost_usd: float
    transport_method: str

class ItineraryDay(BaseModel):
    day_number: int
    day_title: str
    weather_summary: str
    morning: ItineraryActivity
    afternoon: ItineraryActivity
    evening: ItineraryActivity
    stay_overnight: str
    daily_notes: Optional[str] = None

class TripState(BaseModel):
    user_inputs: UserInputs
    resolved_location: Optional[ResolvedLocation] = None
    weather_forecast: List[WeatherForecastDay] = Field(default_factory=list)
    osm_attractions: List[OSMAttraction] = Field(default_factory=list)
    
    destination_details: Optional[DestinationDetails] = None
    weather_report: Optional[WeatherReport] = None
    selected_attractions: List[SelectedAttraction] = Field(default_factory=list)
    budget_breakdown: Optional[BudgetBreakdown] = None
    transport_stay_details: Optional[TransportStayDetails] = None
    travel_tips: Optional[TravelTips] = None
    itinerary: List[ItineraryDay] = Field(default_factory=list)
    
    status: str = "init" # init, running, completed, error
    current_agent: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
