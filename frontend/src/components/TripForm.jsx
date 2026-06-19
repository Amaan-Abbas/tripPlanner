import { useState } from "react";
import { 
  MapPin, Calendar, Compass, Sparkles, ChevronRight, ChevronLeft, Heart
} from "lucide-react";

export default function TripForm({ onSubmit, isFormDisabled }) {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(3);
  const [budgetTier, setBudgetTier] = useState("Moderate");
  const [travelStyle, setTravelStyle] = useState("Cultural");
  const [interests, setInterests] = useState([]);
  const [constraints, setConstraints] = useState([]);

  // Option sets
  const budgetOptions = [
    { value: "Budget", title: "Budget", desc: "Hostels, street food, public transport", symbol: "$" },
    { value: "Moderate", title: "Moderate", desc: "3-star stays, restaurants, hybrid transit", symbol: "$$" },
    { value: "Luxury", title: "Luxury", desc: "Fine hotels, dining, private transport", symbol: "$$$" }
  ];

  const travelStyleOptions = [
    { value: "Solo", title: "Solo", icon: "👤" },
    { value: "Couple", title: "Couple", icon: "👩‍❤️‍👨" },
    { value: "Family", title: "Family", icon: "👨‍👩‍👧‍👦" },
    { value: "Friends", title: "Friends", icon: "👥" },
    { value: "Adventure", title: "Adventure", icon: "🧗" },
    { value: "Cultural", title: "Cultural", icon: "🏛️" },
    { value: "Relaxing", title: "Relaxing", icon: "🌴" }
  ];

  const interestOptions = [
    { id: "History", label: "History & Landmarks 🏛️" },
    { id: "Art", label: "Art & Museums 🎨" },
    { id: "Food", label: "Local Food & Dining 🍜" },
    { id: "Shopping", label: "Shopping & Markets 🛍️" },
    { id: "Nature", label: "Nature & Parks 🌳" },
    { id: "Nightlife", label: "Nightlife & Bars 🍹" },
    { id: "Beaches", label: "Beaches & Water 🏖️" },
    { id: "Hiking", label: "Hiking & Outdoors 🥾" },
    { id: "Tech", label: "Tech & Modern Sights 🤖" }
  ];

  const constraintOptions = [
    { id: "Vegetarian", label: "Vegetarian Meals 🌱" },
    { id: "Halal", label: "Halal Options 🥩" },
    { id: "Kosher", label: "Kosher Options 🧀" },
    { id: "Kids-friendly", label: "Kid Friendly 👶" },
    { id: "Pet-friendly", label: "Pet Friendly 🐾" },
    { id: "Senior-friendly", label: "Senior Friendly 👴" },
    { id: "Wheelchair", label: "Wheelchair Accessible ♿" }
  ];

  const handleInterestToggle = (id) => {
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleConstraintToggle = (id) => {
    setConstraints(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destination.trim()) return;
    onSubmit({
      destination,
      duration,
      budget_tier: budgetTier,
      travel_style: travelStyle,
      interests,
      constraints
    });
  };

  const totalSteps = 5;

  return (
    <div className="form-card glass-panel">
      {/* Visual Step Indicator */}
      <div className="form-step-indicator">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          let statusClass = "step-dot";
          if (step === stepNum) statusClass += " active";
          else if (step > stepNum) statusClass += " completed";
          return (
            <div key={stepNum} className={statusClass}>
              {stepNum}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Destination */}
        {step === 1 && (
          <div className="form-step-content">
            <h3 className="form-label" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <MapPin size={18} className="gradient-text" />
              <span>Where are we traveling?</span>
            </h3>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Tokyo, Japan; Paris, France; Rome, Italy..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                autoFocus
                disabled={isFormDisabled}
              />
              <p className="api-help-text">
                Enter a city name. Nominatim Geocoding will resolve coordinates, weather, and landmarks in real-time.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Duration and Budget */}
        {step === 2 && (
          <div className="form-step-content">
            <h3 className="form-label" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Calendar size={18} className="gradient-text" />
              <span>Duration & Financial Tier</span>
            </h3>
            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label">Trip Duration (Days)</label>
                <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--primary-color)" }}>{duration} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                disabled={isFormDisabled}
                style={{ cursor: "pointer", padding: "0" }}
              />
            </div>

            <label className="form-label">Select Budget Level</label>
            <div className="option-grid">
              {budgetOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`option-card ${budgetTier === opt.value ? "selected" : ""}`}
                  onClick={() => !isFormDisabled && setBudgetTier(opt.value)}
                >
                  <div className="option-icon" style={{ fontSize: "1.75rem", fontWeight: "800", fontFamily: "var(--font-header)" }}>
                    {opt.symbol}
                  </div>
                  <span className="option-title">{opt.title}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{opt.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Travel Style */}
        {step === 3 && (
          <div className="form-step-content">
            <h3 className="form-label" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Compass size={18} className="gradient-text" />
              <span>Travel Style Profile</span>
            </h3>
            <div className="option-grid">
              {travelStyleOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`option-card ${travelStyle === opt.value ? "selected" : ""}`}
                  onClick={() => !isFormDisabled && setTravelStyle(opt.value)}
                >
                  <div className="option-icon" style={{ fontSize: "2rem" }}>
                    {opt.icon}
                  </div>
                  <span className="option-title">{opt.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="form-step-content">
            <h3 className="form-label" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Sparkles size={18} className="gradient-text" />
              <span>Select Your Interests</span>
            </h3>
            <div className="checkbox-grid">
              {interestOptions.map(opt => (
                <div
                  key={opt.id}
                  className={`checkbox-tile ${interests.includes(opt.id) ? "checked" : ""}`}
                  onClick={() => !isFormDisabled && handleInterestToggle(opt.id)}
                >
                  <div className="custom-checkbox">✓</div>
                  <span className="checkbox-label">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Constraints */}
        {step === 5 && (
          <div className="form-step-content">
            <h3 className="form-label" style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Heart size={18} className="gradient-text" />
              <span>Special Needs & Constraints</span>
            </h3>
            <div className="checkbox-grid">
              {constraintOptions.map(opt => (
                <div
                  key={opt.id}
                  className={`checkbox-tile ${constraints.includes(opt.id) ? "checked" : ""}`}
                  onClick={() => !isFormDisabled && handleConstraintToggle(opt.id)}
                >
                  <div className="custom-checkbox">✓</div>
                  <span className="checkbox-label">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Navigation Controls */}
        <div className="form-navigation">
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={handlePrev} disabled={isFormDisabled}>
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={step === 1 && !destination.trim()}
              style={{ opacity: (step === 1 && !destination.trim()) ? 0.6 : 1 }}
            >
              <span>Next Step</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isFormDisabled || !destination.trim()}
              style={{ background: "var(--secondary-gradient)", boxShadow: "0 4px 15px var(--accent-glow)" }}
            >
              <span>Generate Agentic Itinerary</span>
              <Sparkles size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
