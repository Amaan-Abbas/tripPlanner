import { useState } from "react";
import { 
  Calendar, Hotel, CircleDollarSign, CloudSun, Compass, 
  MapPin, Clock, DollarSign, Download, Check, Landmark,
  Terminal, AlertTriangle, Info, Sparkles
} from "lucide-react";

export default function TripDashboard({ tripData, onReset }) {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [activeDay, setActiveDay] = useState(1);
  const [checkedTips, setCheckedTips] = useState([]);

  if (!tripData) return null;

  const {
    resolved_location,
    destination_details,
    weather_forecast,
    weather_report,
    selected_attractions,
    budget_breakdown,
    transport_stay_details,
    travel_tips,
    itinerary,
    api_calls = [],
    metrics = {}
  } = tripData;

  const toggleCheckTip = (tip) => {
    setCheckedTips(prev => 
      prev.includes(tip) ? prev.filter(x => x !== tip) : [...prev, tip]
    );
  };

  const handleExport = () => {
    // Generate a beautiful markdown formatted trip plan for export
    let mdContent = `# Trip Plan to ${resolved_location?.display_name || "Destination"}\n\n`;
    
    if (destination_details) {
      mdContent += `## Destination Overview\n${destination_details.overview}\n\n`;
      mdContent += `### Culture Highlights\n${destination_details.culture_highlights}\n\n`;
    }
    
    mdContent += `## Budget Summary\n`;
    mdContent += `- Total Estimated Cost: $${budget_breakdown?.total_estimated_cost_usd} USD\n`;
    mdContent += `- Daily Rate: $${budget_breakdown?.daily_rate_usd} USD/day\n\n`;
    
    if (transport_stay_details) {
      mdContent += `## Safe Stays & Transit\n`;
      mdContent += `### Recommended Safe Neighborhoods:\n${transport_stay_details.recommended_neighborhoods.map(n => `- ${n}`).join("\n")}\n\n`;
      mdContent += `### Safe Accommodations:\n`;
      transport_stay_details.stay_recommendations.forEach(s => {
        mdContent += `#### ${s.hotel_name} (${s.neighborhood})\n`;
        mdContent += `- Rating: ${s.rating_score} | Safety Score: ${s.safety_score}\n`;
        mdContent += `- Average Price: $${s.average_price_per_night_usd}/night\n`;
        mdContent += `- Safety Features: ${s.safety_features.join(", ")}\n`;
        mdContent += `- Description: ${s.description}\n\n`;
      });
    }
    
    mdContent += `## Day-by-Day Itinerary\n`;
    itinerary.forEach(d => {
      mdContent += `### Day ${d.day_number}: ${d.day_title} (${d.weather_summary})\n`;
      mdContent += `#### Morning: ${d.morning.title}\n- ${d.morning.description}\n- Transport: ${d.morning.transport_method} | Cost: $${d.morning.estimated_cost_usd}\n\n`;
      mdContent += `#### Afternoon: ${d.afternoon.title}\n- ${d.afternoon.description}\n- Transport: ${d.afternoon.transport_method} | Cost: $${d.afternoon.estimated_cost_usd}\n\n`;
      mdContent += `#### Evening: ${d.evening.title}\n- ${d.evening.description}\n- Transport: ${d.evening.transport_method} | Cost: $${d.evening.estimated_cost_usd}\n\n`;
      mdContent += `*Stay overnight at: ${d.stay_overnight}*\n`;
      if (d.daily_notes) mdContent += `*Note: ${d.daily_notes}*\n`;
      mdContent += `\n`;
    });
    
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `trip_plan_${resolved_location?.display_name.split(",")[0].toLowerCase().trim()}.txt`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Table of Contents (ToC) items based on active tab
  const getTocItems = () => {
    switch (activeTab) {
      case "overview":
        return [
          { id: "overview-snapshot", text: "Destination Overview" },
          { id: "overview-culture", text: "Cultural Highlights" },
          { id: "overview-geography", text: "Geography Notes" },
          { id: "overview-seasons", text: "Best Time to Visit" }
        ];
      case "attractions":
        return (selected_attractions || []).map((a, idx) => ({
          id: `attraction-${idx}`,
          text: a.name
        }));
      case "itinerary":
        return (itinerary || []).map(d => ({
          id: `itinerary-day-${d.day_number}`,
          text: `Day ${d.day_number}: ${d.day_title.slice(0, 20)}...`
        }));
      case "stays":
        return [
          { id: "stays-neighborhoods", text: "Safe Neighborhoods" },
          { id: "stays-hotels", text: "Safe Lodging Options" },
          { id: "stays-transit", text: "Transit Recommendations" },
          { id: "stays-safety", text: "Lodging Safety Tips" }
        ];
      case "budget":
        return [
          { id: "budget-total", text: "Estimated Budget" },
          { id: "budget-allocations", text: "Spend Categories" },
          { id: "budget-saving", text: "Cost-Saving Tips" }
        ];
      case "weather":
        return [
          { id: "weather-summary", text: "Report Summary" },
          { id: "weather-clothing", text: "Packing Layers" },
          { id: "weather-guidance", text: "Outdoor Scheduling" },
          { id: "weather-forecast", text: "7-Day Raw Forecast" }
        ];
      case "tips":
        return [
          { id: "tips-packing", text: "Packing Checklist" },
          { id: "tips-safety", text: "Safety Warnings" },
          { id: "tips-etiquette", text: "Cultural Protocol" }
        ];
      case "dev_console":
        return [
          { id: "dev-agent-performance", text: "Agent Latency Stats" },
          { id: "dev-api-trace", text: "API Integration Trace" }
        ];
      default:
        return [];
    }
  };

  const handleTocClick = (id, e) => {
    e.preventDefault();
    if (activeTab === "itinerary" && id.startsWith("itinerary-day-")) {
      const dayNum = parseInt(id.replace("itinerary-day-", ""));
      setActiveDay(dayNum);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {/* Destination Hero Banner */}
      <div className="glass-panel" style={{ padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderLeft: "4px solid var(--primary-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-color)", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <MapPin size={12} />
              <span>Itinerary Dossier</span>
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "0.15rem" }}>{resolved_location?.display_name.split(",")[0]}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.1rem" }}>{resolved_location?.display_name}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleExport} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
              <Download size={14} />
              <span>Export Dossier</span>
            </button>
            <button onClick={onReset} className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "var(--secondary-gradient)", boxShadow: "none" }}>
              New Plan
            </button>
          </div>
        </div>
      </div>

      {/* Fumadocs layout block */}
      <div className="dashboard-container" style={{ display: "grid", gridTemplateColumns: "220px 1fr 200px", gap: "1.5rem" }}>
        
        {/* Navigation Sidebar */}
        <div className="dashboard-sidebar" style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dark)" }}>
            Dossier Sections
          </div>
          <button 
            className={`sidebar-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <MapPin size={15} />
            <span>Overview</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${activeTab === "attractions" ? "active" : ""}`}
            onClick={() => setActiveTab("attractions")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <Landmark size={15} />
            <span>Attractions</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${activeTab === "itinerary" ? "active" : ""}`}
            onClick={() => setActiveTab("itinerary")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <Calendar size={15} />
            <span>Day-by-Day Plan</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${activeTab === "stays" ? "active" : ""}`}
            onClick={() => setActiveTab("stays")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <Hotel size={15} />
            <span>Stays & Transit</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${activeTab === "budget" ? "active" : ""}`}
            onClick={() => setActiveTab("budget")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <CircleDollarSign size={15} />
            <span>Budget Details</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${activeTab === "weather" ? "active" : ""}`}
            onClick={() => setActiveTab("weather")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <CloudSun size={15} />
            <span>Weather Summary</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${activeTab === "tips" ? "active" : ""}`}
            onClick={() => setActiveTab("tips")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <Compass size={15} />
            <span>Travel Protocol</span>
          </button>

          <div style={{ padding: "1rem 0.75rem 0.5rem", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dark)" }}>
            Developer
          </div>
          <button 
            className={`sidebar-tab-btn ${activeTab === "dev_console" ? "active" : ""}`}
            onClick={() => setActiveTab("dev_console")}
            style={{ padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}
          >
            <Terminal size={15} />
            <span>Metrics & Trace</span>
          </button>
        </div>

        {/* Dashboard Main Reading Area */}
        <div className="dashboard-main glass-panel" style={{ padding: "1.75rem", overflowY: "auto", minHeight: "600px" }}>

          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && destination_details && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div id="overview-snapshot">
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <MapPin size={18} className="gradient-text" />
                  <span>Destination Overview</span>
                </h3>
                <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-muted)" }}>
                  {destination_details.overview}
                </p>
              </div>

              <div id="overview-culture" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Cultural Highlights</h4>
                <div style={{ padding: "1rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                  {destination_details.culture_highlights}
                </div>
              </div>

              <div id="overview-geography" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Geography & Navigation Layout</h4>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.5", color: "var(--text-muted)" }}>
                  {destination_details.geography_notes}
                </p>
              </div>

              <div id="overview-seasons" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Best Season to Visit</h4>
                <div className="gh-alert gh-alert-tip" style={{ borderLeft: "4px solid #a855f7", background: "rgba(168, 85, 247, 0.03)", padding: "1rem", borderRadius: "8px", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <Sparkles size={16} style={{ color: "#c084fc", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Season Tip</strong>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{destination_details.best_time_to_visit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ATTRACTIONS TAB */}
          {activeTab === "attractions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <Landmark size={18} className="gradient-text" />
                  <span>Curated Attractions & Sights</span>
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Selected attractions optimized from OpenStreetMap local landmarks and real-time web guidelines.
                </p>
              </div>

              {selected_attractions && selected_attractions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {selected_attractions.map((attraction, idx) => (
                    <div 
                      key={`${attraction.name}-${idx}`} 
                      id={`attraction-${idx}`}
                      className="attraction-card" 
                      style={{ 
                        background: "rgba(255, 255, 255, 0.01)", 
                        border: "1px solid rgba(255, 255, 255, 0.04)", 
                        borderRadius: "10px", 
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        scrollMarginTop: "20px"
                      }}
                    >
                      <div className="attraction-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <div>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)" }}>{attraction.name}</h4>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", textTransform: "uppercase" }}>{attraction.category}</span>
                        </div>
                        <div className="attraction-cost" style={{ fontSize: "1.1rem", color: "var(--primary-color)", fontWeight: "800" }}>
                          {attraction.estimated_cost_usd > 0 ? `$${attraction.estimated_cost_usd}` : "Free"}
                        </div>
                      </div>
                      
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>{attraction.description}</p>
                      
                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--text-dark)" }}>
                          <Clock size={12} />
                          <span>Duration: {attraction.duration_hours}h</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--text-dark)" }}>
                          <DollarSign size={12} />
                          <span>Admissions: {attraction.estimated_cost_usd > 0 ? `$${attraction.estimated_cost_usd} USD` : "No cost"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No attractions selected.
                </p>
              )}
            </div>
          )}
          
          {/* 3. ITINERARY TAB */}
          {activeTab === "itinerary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <Calendar size={18} className="gradient-text" />
                  <span>Day-by-Day Timeline</span>
                </h3>
              </div>
              
              {/* Day Sub-navigation pills */}
              <div className="itinerary-days-nav" style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {itinerary.map(day => (
                  <button 
                    key={day.day_number}
                    className={`day-nav-btn ${activeDay === day.day_number ? "active" : ""}`}
                    onClick={() => setActiveDay(day.day_number)}
                    style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "16px" }}
                  >
                    Day {day.day_number}
                  </button>
                ))}
              </div>

              {/* Day details */}
              {itinerary.map(day => {
                if (day.day_number !== activeDay) return null;
                return (
                  <div key={day.day_number} id={`itinerary-day-${day.day_number}`} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", scrollMarginTop: "20px" }}>
                    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "0.5rem" }}>
                      <h4 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)" }}>
                        {day.day_title}
                      </h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <CloudSun size={14} style={{ color: "var(--primary-color)" }} /> Forecast: {day.weather_summary}
                      </span>
                    </div>

                    <div className="timeline" style={{ position: "relative", paddingLeft: "1.25rem" }}>
                      {/* Timeline bar */}
                      <div style={{ position: "absolute", left: "4px", top: "8px", bottom: "8px", width: "2px", background: "rgba(255,255,255,0.05)" }} />

                      {/* MORNING */}
                      <div className="timeline-item" style={{ marginBottom: "1.25rem" }}>
                        <div style={{ position: "absolute", left: "-24px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#a855f7", border: "2px solid var(--bg-color)" }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", color: "#c084fc", letterSpacing: "0.05em" }}>Morning</span>
                        <h5 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "2px" }}>{day.morning.title}</h5>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", lineHeight: "1.4" }}>{day.morning.description}</p>
                        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-dark)", marginTop: "0.5rem" }}>
                          <span>⏱️ {day.morning.duration_hours}h</span>
                          <span>🎫 ${day.morning.estimated_cost_usd}</span>
                          <span>🚇 Transit: {day.morning.transport_method}</span>
                        </div>
                      </div>

                      {/* AFTERNOON */}
                      <div className="timeline-item" style={{ marginBottom: "1.25rem" }}>
                        <div style={{ position: "absolute", left: "-24px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#00d2ff", border: "2px solid var(--bg-color)" }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", color: "#00d2ff", letterSpacing: "0.05em" }}>Afternoon</span>
                        <h5 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "2px" }}>{day.afternoon.title}</h5>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", lineHeight: "1.4" }}>{day.afternoon.description}</p>
                        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-dark)", marginTop: "0.5rem" }}>
                          <span>⏱️ {day.afternoon.duration_hours}h</span>
                          <span>🎫 ${day.afternoon.estimated_cost_usd}</span>
                          <span>🚇 Transit: {day.afternoon.transport_method}</span>
                        </div>
                      </div>

                      {/* EVENING */}
                      <div className="timeline-item" style={{ marginBottom: "0.5rem" }}>
                        <div style={{ position: "absolute", left: "-24px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", border: "2px solid var(--bg-color)" }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", color: "#f59e0b", letterSpacing: "0.05em" }}>Evening</span>
                        <h5 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "2px" }}>{day.evening.title}</h5>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", lineHeight: "1.4" }}>{day.evening.description}</p>
                        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-dark)", marginTop: "0.5rem" }}>
                          <span>⏱️ {day.evening.duration_hours}h</span>
                          <span>🎫 ${day.evening.estimated_cost_usd}</span>
                          <span>🚇 Transit: {day.evening.transport_method}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "1rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        🛌 <strong>Lodging Stay:</strong> Overnights at <em>{day.stay_overnight}</em>
                      </div>
                      
                      {day.daily_notes && (
                        <div className="gh-alert gh-alert-note" style={{ borderLeft: "4px solid #00d2ff", background: "rgba(0, 210, 255, 0.03)", padding: "0.75rem 1rem", borderRadius: "8px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <Info size={14} style={{ color: "#00d2ff", flexShrink: 0 }} />
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{day.daily_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. STAYS & TRANSIT TAB */}
          {activeTab === "stays" && transport_stay_details && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <div>
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <Hotel size={18} className="gradient-text" />
                  <span>Stays & Transportation</span>
                </h3>
              </div>

              {/* Neighborhoods */}
              <div id="stays-neighborhoods" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Safe Recommended Neighborhoods</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {transport_stay_details.recommended_neighborhoods.map((n, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        padding: "0.4rem 0.8rem", 
                        background: "rgba(0, 210, 255, 0.04)", 
                        border: "1px solid rgba(0, 210, 255, 0.15)", 
                        color: "var(--primary-color)", 
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: "600"
                      }}
                    >
                      ✓ {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Accommodations */}
              <div id="stays-hotels" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--text-main)" }}>Lodging Options</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {transport_stay_details.stay_recommendations.map((stay, idx) => (
                    <div 
                      key={idx} 
                      className="overview-card" 
                      style={{ 
                        background: "rgba(255,255,255,0.01)", 
                        border: "1px solid rgba(255,255,255,0.04)", 
                        borderRadius: "10px", 
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <h5 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)" }}>{stay.hotel_name}</h5>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-dark)" }}>📍 Area: {stay.neighborhood}</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <span style={{ background: "rgba(52, 211, 153, 0.05)", border: "1px solid rgba(52, 211, 153, 0.15)", color: "#34d399", fontSize: "0.75rem", fontWeight: "600", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                            Rating: {stay.rating_score}
                          </span>
                          <span style={{ background: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.15)", color: "#c084fc", fontSize: "0.75rem", fontWeight: "600", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                            Safety: {stay.safety_score}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>{stay.description}</p>
                      
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dark)", fontWeight: "600" }}>Safety Audited Features:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }}>
                          {stay.safety_features.map((f, fIdx) => (
                            <span key={fIdx} style={{ fontSize: "0.7rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                              🛡️ {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "var(--primary-color)", fontWeight: "700", alignSelf: "flex-end", marginTop: "0.25rem" }}>
                        Est. Cost: ${stay.average_price_per_night_usd}/night
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transit */}
              <div id="stays-transit" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--text-main)" }}>Transit Recommendations</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  {transport_stay_details.transport_recommendations.map((trans, idx) => (
                    <div key={idx} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <h5 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)" }}>{trans.mode_name}</h5>
                      <span style={{ fontSize: "0.75rem", color: "var(--primary-color)" }}>Est. Cost: ${trans.average_cost_usd} USD</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dark)" }}>Convenience: {trans.convenience_rating}</span>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", lineHeight: "1.4" }}>{trans.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Tips */}
              <div id="stays-safety" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>General Safety & Transit Alerts</h4>
                <div className="gh-alert gh-alert-warning" style={{ borderLeft: "4px solid #ef4444", background: "rgba(239, 68, 68, 0.03)", padding: "1rem", borderRadius: "8px", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <AlertTriangle size={16} style={{ color: "#f87171", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#f87171", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Caution</strong>
                    <ul style={{ paddingLeft: "1rem", margin: "0", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {transport_stay_details.general_safety_tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. BUDGET TAB */}
          {activeTab === "budget" && budget_breakdown && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <div id="budget-total">
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <CircleDollarSign size={18} className="gradient-text" />
                  <span>Financial Budget Breakdown</span>
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", padding: "1.25rem", borderRadius: "10px", textAlign: "center", marginTop: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", uppercase: "true" }}>TOTAL ESTIMATED COST</span>
                    <h4 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--primary-color)" }}>${budget_breakdown.total_estimated_cost_usd} USD</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", uppercase: "true" }}>DAILY AVERAGE RATE</span>
                    <h4 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--primary-color)" }}>${budget_breakdown.daily_rate_usd}/day</h4>
                  </div>
                </div>
              </div>

              {/* Allocations Table */}
              <div id="budget-allocations" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Spend Allocations</h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-dark)", fontWeight: "700" }}>
                        <th style={{ padding: "0.75rem 0.5rem" }}>Category</th>
                        <th style={{ padding: "0.75rem 0.5rem" }}>Allocated</th>
                        <th style={{ padding: "0.75rem 0.5rem" }}>Share %</th>
                        <th style={{ padding: "0.75rem 0.5rem" }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budget_breakdown.allocations.map((alloc, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", color: "var(--text-muted)" }}>
                          <td style={{ padding: "0.75rem 0.5rem", fontWeight: "700", color: "var(--text-main)" }}>{alloc.category}</td>
                          <td style={{ padding: "0.75rem 0.5rem", color: "var(--primary-color)" }}>${alloc.amount_usd}</td>
                          <td style={{ padding: "0.75rem 0.5rem" }}>{alloc.percentage}%</td>
                          <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem" }}>{alloc.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Saving Tips */}
              <div id="budget-saving" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Cost Saving Guide</h4>
                <div className="gh-alert gh-alert-note" style={{ borderLeft: "4px solid #00d2ff", background: "rgba(0, 210, 255, 0.03)", padding: "1rem", borderRadius: "8px", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <Info size={16} style={{ color: "#00d2ff", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#00d2ff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Financial Strategy</strong>
                    <ul style={{ paddingLeft: "1rem", margin: "0", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {budget_breakdown.saving_tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. WEATHER TAB */}
          {activeTab === "weather" && weather_report && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <div id="weather-summary">
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <CloudSun size={18} className="gradient-text" />
                  <span>Weather Meteorological Report</span>
                </h3>
                <h4 style={{ fontSize: "1.05rem", fontWeight: "600", marginTop: "1rem", color: "var(--text-main)" }}>Forecast Summary</h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.5", marginTop: "0.25rem" }}>{weather_report.summary}</p>
              </div>

              {/* Clothing */}
              <div id="weather-clothing" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>What to Pack (Layers)</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {weather_report.clothing_recommendations.map((item, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        padding: "0.4rem 0.8rem", 
                        background: "rgba(255, 255, 255, 0.02)", 
                        border: "1px solid rgba(255, 255, 255, 0.05)", 
                        color: "var(--text-main)", 
                        borderRadius: "6px",
                        fontSize: "0.8rem"
                      }}
                    >
                      👕 {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity guidance */}
              <div id="weather-guidance" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Outdoor vs Indoor Scheduling</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>{weather_report.activity_guidance}</p>
              </div>

              {/* Forecast Grid */}
              <div id="weather-forecast" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--text-main)" }}>Raw Forecast Grid</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                  {weather_forecast.map((w, idx) => (
                    <div key={idx} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "0.85rem", textAlign: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", display: "block" }}>{w.date}</span>
                      <span style={{ fontSize: "1.25rem", margin: "0.35rem 0", display: "block" }}>
                        {w.condition.split(" ").slice(-1)[0]}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-main)", fontWeight: "600", display: "block" }}>
                        {w.condition.split(" ").slice(0, -1).join(" ")}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                        {w.max_temp}°C / {w.min_temp}°C
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. TRAVEL TIPS TAB */}
          {activeTab === "tips" && travel_tips && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <div id="tips-packing">
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <Compass size={18} className="gradient-text" />
                  <span>Travel Protocols & Checklists</span>
                </h3>
                
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", margin: "1rem 0 0.5rem", color: "var(--text-main)" }}>Packing Checklist</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {travel_tips.packing_checklist.map((item, idx) => {
                    const isChecked = checkedTips.includes(item);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleCheckTip(item)}
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.5rem", 
                          background: isChecked ? "rgba(52, 211, 153, 0.02)" : "rgba(255,255,255,0.01)", 
                          border: `1px solid ${isChecked ? "rgba(52, 211, 153, 0.15)" : "rgba(255,255,255,0.03)"}`,
                          padding: "0.6rem 0.85rem", 
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          color: isChecked ? "var(--text-dark)" : "var(--text-muted)",
                          textDecoration: isChecked ? "line-through" : "none",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", background: isChecked ? "#34d399" : "none" }}>
                          {isChecked && <Check size={10} style={{ color: "#fff" }} />}
                        </div>
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Safety Precautions */}
              <div id="tips-safety" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Safety & Emergency Precautions</h4>
                <div className="gh-alert gh-alert-warning" style={{ borderLeft: "4px solid #ef4444", background: "rgba(239, 68, 68, 0.03)", padding: "1rem", borderRadius: "8px", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <AlertTriangle size={16} style={{ color: "#f87171", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#f87171", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Local Security Alerts</strong>
                    <ul style={{ paddingLeft: "1rem", margin: "0", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {travel_tips.safety_precautions.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Etiquette */}
              <div id="tips-etiquette" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-main)" }}>Cultural Etiquette & Local Customs</h4>
                <div className="gh-alert gh-alert-note" style={{ borderLeft: "4px solid #00d2ff", background: "rgba(0, 210, 255, 0.03)", padding: "1rem", borderRadius: "8px", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <Info size={16} style={{ color: "#00d2ff", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.85rem", color: "#00d2ff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Cultural Protocols</strong>
                    <ul style={{ paddingLeft: "1rem", margin: "0", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {travel_tips.local_etiquette.map((custom, idx) => (
                        <li key={idx}>{custom}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. DEVELOPER CONSOLE & TRACE TAB */}
          {activeTab === "dev_console" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <div>
                <h3 className="dashboard-section-title" style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  <Terminal size={18} className="gradient-text" />
                  <span>Developer Metrics & Execution Trace</span>
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Real-time instrumentation of background agent workflow calls, third-party API latencies, and service status codes.
                </p>
              </div>

              {/* Performance Latency Stats */}
              <div id="dev-agent-performance" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--text-main)" }}>Agent Pipeline Latency Stats</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {Object.entries(metrics).map(([metricName, value]) => {
                    const isTotal = metricName.startsWith("Total");
                    return (
                      <div 
                        key={metricName} 
                        style={{ 
                          background: isTotal ? "rgba(0, 210, 255, 0.02)" : "rgba(255,255,255,0.01)", 
                          border: `1px solid ${isTotal ? "rgba(0, 210, 255, 0.12)" : "rgba(255,255,255,0.03)"}`,
                          padding: "0.75rem 1rem", 
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", fontWeight: isTotal ? "700" : "500", color: isTotal ? "var(--primary-color)" : "var(--text-muted)" }}>
                          {isTotal ? "🔥 " : "👤 "} {metricName}
                        </span>
                        <span style={{ fontSize: "0.85rem", fontFamily: "monospace", color: isTotal ? "var(--primary-color)" : "var(--text-main)", fontWeight: "700" }}>
                          {value} {typeof value === "number" ? "ms" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* API Trace Logs */}
              <div id="dev-api-trace" style={{ scrollMarginTop: "20px" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--text-main)" }}>External API Call Trace Logs</h4>
                {api_calls && api_calls.length > 0 ? (
                  <div style={{ overflowX: "auto", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text-dark)", fontWeight: "700", background: "rgba(0,0,0,0.2)" }}>
                          <th style={{ padding: "0.6rem 0.85rem" }}>Service Name</th>
                          <th style={{ padding: "0.6rem 0.85rem" }}>Endpoint Path</th>
                          <th style={{ padding: "0.6rem 0.85rem" }}>Latency</th>
                          <th style={{ padding: "0.6rem 0.85rem" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {api_calls.map((call, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "0.6rem 0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                              {call.service}
                            </td>
                            <td style={{ padding: "0.6rem 0.85rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                              {call.endpoint}
                            </td>
                            <td style={{ padding: "0.6rem 0.85rem", fontFamily: "monospace", color: "var(--primary-color)" }}>
                              {call.duration_ms} ms
                            </td>
                            <td style={{ padding: "0.6rem 0.85rem" }}>
                              <span 
                                style={{ 
                                  padding: "0.15rem 0.4rem", 
                                  borderRadius: "4px", 
                                  fontSize: "0.7rem", 
                                  fontWeight: "700",
                                  background: call.status === "success" ? "rgba(52, 211, 153, 0.05)" : "rgba(239, 68, 68, 0.05)",
                                  border: `1px solid ${call.status === "success" ? "rgba(52, 211, 153, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
                                  color: call.status === "success" ? "#34d399" : "#f87171"
                                }}
                              >
                                {call.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No API logs tracked during this execution.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Table of Contents (Right Sidebar) */}
        <div className="dashboard-toc" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ padding: "0.5rem 0", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dark)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            On This Page
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.25rem" }}>
            {getTocItems().map((item) => (
              <a 
                key={item.id} 
                href={`#${item.id}`} 
                onClick={(e) => handleTocClick(item.id, e)}
                style={{ 
                  fontSize: "0.75rem", 
                  color: "var(--text-muted)", 
                  textDecoration: "none", 
                  lineHeight: "1.4",
                  borderLeft: "2px solid transparent",
                  paddingLeft: "8px",
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "var(--primary-color)";
                  e.target.style.borderLeftColor = "var(--primary-color)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "var(--text-muted)";
                  e.target.style.borderLeftColor = "transparent";
                }}
              >
                {item.text}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
