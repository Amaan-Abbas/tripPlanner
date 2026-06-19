import { useState } from "react";
import { Key, Eye, EyeOff, ShieldCheck, Settings, Globe, CloudSun, Check, Sparkles } from "lucide-react";

export default function APIConfig({
  llmProvider,
  setLlmProvider,
  geminiApiKey,
  setGeminiApiKey,
  openaiApiKey,
  setOpenaiApiKey,
  braveApiKey,
  setBraveApiKey,
  weatherApiKey,
  setWeatherApiKey
}) {
  const [showKeys, setShowKeys] = useState({});
  const [activeTab, setActiveTab] = useState("llm");
  const [savedStatus, setSavedStatus] = useState({});

  const handleSaveKey = (keyName, value, setter) => {
    const cleanValue = value.trim();
    localStorage.setItem(keyName, cleanValue);
    setter(cleanValue);
    setSavedStatus(prev => ({ ...prev, [keyName]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [keyName]: false }));
    }, 1500);
  };

  const handleClearKey = (keyName, setter) => {
    localStorage.removeItem(keyName);
    setter("");
  };

  const toggleShowKey = (name) => {
    setShowKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const hasLlmKey = (llmProvider === "gemini" && geminiApiKey) || (llmProvider === "openai" && openaiApiKey);

  return (
    <div className="api-config-card" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      
      {/* Title Header with breathing space */}
      <div className="api-header" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h3 className="api-title" style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>
            <Settings size={20} className="gradient-text" />
            <span>Integrations Settings</span>
          </h3>
          <span 
            className={`api-status ${hasLlmKey ? "status-active" : "status-missing"}`}
            style={{ 
              fontSize: "0.75rem", 
              fontWeight: "600",
              padding: "0.25rem 0.6rem",
              borderRadius: "20px"
            }}
          >
            {hasLlmKey ? "Ready" : "Key Needed"}
          </span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-dark)", lineHeight: "1.4", margin: 0 }}>
          Manage your AI models, search crawlers, and weather forecast API credentials.
        </p>
      </div>

      {/* Tabs Navigation (Larger, more breathing room) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label className="form-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dark)", fontWeight: "600" }}>
          Select Service Category
        </label>
        <div style={{ display: "flex", gap: "0.35rem", background: "rgba(0,0,0,0.3)", padding: "5px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("llm")}
            style={{
              flex: 1,
              padding: "0.6rem 0.5rem",
              fontSize: "0.8rem",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "llm" ? "rgba(255,255,255,0.08)" : "transparent",
              color: activeTab === "llm" ? "var(--text-main)" : "var(--text-muted)",
              transition: "all 0.2s ease-in-out",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}
          >
            <Sparkles size={14} style={{ color: activeTab === "llm" ? "var(--primary-color)" : "inherit" }} />
            <span>LLM</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            style={{
              flex: 1,
              padding: "0.6rem 0.5rem",
              fontSize: "0.8rem",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "search" ? "rgba(255,255,255,0.08)" : "transparent",
              color: activeTab === "search" ? "var(--text-main)" : "var(--text-muted)",
              transition: "all 0.2s ease-in-out",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}
          >
            <Globe size={14} style={{ color: activeTab === "search" ? "var(--primary-color)" : "inherit" }} />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("weather")}
            style={{
              flex: 1,
              padding: "0.6rem 0.5rem",
              fontSize: "0.8rem",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "weather" ? "rgba(255,255,255,0.08)" : "transparent",
              color: activeTab === "weather" ? "var(--text-main)" : "var(--text-muted)",
              transition: "all 0.2s ease-in-out",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}
          >
            <CloudSun size={14} style={{ color: activeTab === "weather" ? "var(--primary-color)" : "inherit" }} />
            <span>Weather</span>
          </button>
        </div>
      </div>

      {/* Settings Tab Content View (Padded, clean spacing) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "0.25rem" }}>
        
        {/* 1. LLM SETTINGS TAB */}
        {activeTab === "llm" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dark)" }}>
                Language Model Provider
              </label>
              <select
                className="form-input"
                value={llmProvider}
                onChange={(e) => {
                  const prov = e.target.value;
                  setLlmProvider(prov);
                  localStorage.setItem("llm_provider", prov);
                }}
                style={{ 
                  background: "rgba(0,0,0,0.3)", 
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "0.85rem 1rem",
                  fontSize: "0.9rem",
                  borderRadius: "10px",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                <option value="gemini">Google Gemini 3.5 Flash (Free Tier)</option>
                <option value="openai">OpenAI GPT-4o-Mini (Paid Key)</option>
              </select>
            </div>

            {llmProvider === "gemini" ? (
              <KeyInput
                label="Gemini API Credentials"
                placeholder="Paste AIzaSy... API Key"
                value={geminiApiKey}
                onSave={(val) => handleSaveKey("gemini_api_key", val, setGeminiApiKey)}
                onClear={() => handleClearKey("gemini_api_key", setGeminiApiKey)}
                isSaved={!!geminiApiKey}
                savedLabel="Gemini Key Saved"
                showKey={showKeys["gemini"]}
                toggleShow={() => toggleShowKey("gemini")}
                helpLink="https://aistudio.google.com/"
                helpText="Requires a free Gemini API Key from Google AI Studio. It yields fast agent execution."
                successSave={savedStatus["gemini_api_key"]}
              />
            ) : (
              <KeyInput
                label="OpenAI API Credentials"
                placeholder="Paste sk-proj-... API Key"
                value={openaiApiKey}
                onSave={(val) => handleSaveKey("openai_api_key", val, setOpenaiApiKey)}
                onClear={() => handleClearKey("openai_api_key", setOpenaiApiKey)}
                isSaved={!!openaiApiKey}
                savedLabel="OpenAI Key Saved"
                showKey={showKeys["openai"]}
                toggleShow={() => toggleShowKey("openai")}
                helpLink="https://platform.openai.com/api-keys"
                helpText="Requires a paid OpenAI key. Uses gpt-4o-mini to synthesize structured travel timelines."
                successSave={savedStatus["openai_api_key"]}
              />
            )}
          </div>
        )}

        {/* 2. BRAVE SEARCH TAB */}
        {activeTab === "search" && (
          <KeyInput
            label="Brave Search API Key"
            placeholder="Paste bs-... API Key"
            value={braveApiKey}
            onSave={(val) => handleSaveKey("brave_api_key", val, setBraveApiKey)}
            onClear={() => handleClearKey("brave_api_key", setBraveApiKey)}
            isSaved={!!braveApiKey}
            savedLabel="Brave API Key Saved"
            showKey={showKeys["brave"]}
            toggleShow={() => toggleShowKey("brave")}
            helpLink="https://brave.com/search/api/"
            helpText="Optional. If left empty, the application automatically uses free, keyless DuckDuckGo / Wikipedia search context resolvers."
            successSave={savedStatus["brave_api_key"]}
          />
        )}

        {/* 3. WEATHERAPI TAB */}
        {activeTab === "weather" && (
          <KeyInput
            label="WeatherAPI credentials"
            placeholder="Paste WeatherAPI Key"
            value={weatherApiKey}
            onSave={(val) => handleSaveKey("weather_api_key", val, setWeatherApiKey)}
            onClear={() => handleClearKey("weather_api_key", setWeatherApiKey)}
            isSaved={!!weatherApiKey}
            savedLabel="WeatherAPI Key Saved"
            showKey={showKeys["weather"]}
            toggleShow={() => toggleShowKey("weather")}
            helpLink="https://www.weatherapi.com/"
            helpText="Optional. If left empty, the application automatically uses the free, keyless Open-Meteo meteorological forecast."
            successSave={savedStatus["weather_api_key"]}
          />
        )}
      </div>
    </div>
  );
}

function KeyInput({
  label,
  placeholder,
  value,
  onSave,
  onClear,
  isSaved,
  savedLabel,
  showKey,
  toggleShow,
  helpLink,
  helpText,
  successSave
}) {
  const [inputVal, setInputVal] = useState(value || "");

  const handleSave = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSave(inputVal);
    }
  };

  const handleClear = () => {
    setInputVal("");
    onClear();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <label className="form-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dark)", fontWeight: "600" }}>
        {label}
      </label>
      
      {!isSaved ? (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", width: "100%", position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              className="form-input"
              placeholder={placeholder}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{ 
                paddingRight: "2.75rem", 
                fontSize: "0.85rem", 
                background: "rgba(0,0,0,0.3)",
                paddingTop: "0.85rem",
                paddingBottom: "0.85rem",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            />
            <button
              type="button"
              onClick={toggleShow}
              style={{
                position: "absolute",
                right: "100px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inputVal.trim().length < 5}
              style={{ 
                opacity: inputVal.trim().length >= 5 ? 1 : 0.6, 
                flexShrink: 0, 
                padding: "0.5rem 1.1rem", 
                fontSize: "0.8rem",
                borderRadius: "10px"
              }}
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(52, 211, 153, 0.02)", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid rgba(52, 211, 153, 0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShieldCheck size={18} style={{ color: "#34d399" }} />
            <span style={{ fontSize: "0.85rem", color: "#34d399", fontFamily: "monospace", fontWeight: "500" }}>
              ••••••••{value.slice(-4)}
            </span>
          </div>
          <button
            onClick={handleClear}
            className="btn btn-secondary"
            style={{ 
              padding: "0.35rem 0.7rem", 
              fontSize: "0.75rem", 
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--text-muted)"
            }}
          >
            Clear
          </button>
        </div>
      )}
      
      <p className="api-help-text" style={{ fontSize: "0.75rem", color: "var(--text-dark)", lineHeight: "1.5", margin: 0, marginTop: "0.25rem" }}>
        {helpText}{" "}
        <a 
          href={helpLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: "var(--primary-color)", 
            textDecoration: "none", 
            fontWeight: "500",
            borderBottom: "1px dotted var(--primary-color)",
            paddingBottom: "1px"
          }}
        >
          API Console
        </a>
      </p>

      {successSave && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#34d399", fontSize: "0.75rem", marginTop: "4px", fontWeight: "500" }}>
          <Check size={12} /> {savedLabel}
        </div>
      )}
    </div>
  );
}
