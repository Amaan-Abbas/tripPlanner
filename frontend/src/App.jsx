import { useState } from "react";
import { PlaneTakeoff, ShieldAlert, Bot, Settings, X, CheckCircle2, HelpCircle } from "lucide-react";

// Components
import APIConfig from "./components/APIConfig";
import TripForm from "./components/TripForm";
import AgentProgress from "./components/AgentProgress";
import TripDashboard from "./components/TripDashboard";

// Styles
import "./styles/main.css";
import "./styles/form.css";
import "./styles/progress.css";
import "./styles/dashboard.css";

export default function App() {
  const [llmProvider, setLlmProvider] = useState(() => localStorage.getItem("llm_provider") || "gemini");
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [openaiApiKey, setOpenaiApiKey] = useState(() => localStorage.getItem("openai_api_key") || "");
  const [braveApiKey, setBraveApiKey] = useState(() => localStorage.getItem("brave_api_key") || "");
  const [weatherApiKey, setWeatherApiKey] = useState(() => localStorage.getItem("weather_api_key") || "");
  
  const [status, setStatus] = useState("init"); // init, running, completed, error
  const [currentAgent, setCurrentAgent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tripData, setTripData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Drawer open state (opens automatically if key is missing)
  const [isConfigOpen, setIsConfigOpen] = useState(() => {
    const provider = localStorage.getItem("llm_provider") || "gemini";
    const key = provider === "gemini" 
      ? localStorage.getItem("gemini_api_key") 
      : localStorage.getItem("openai_api_key");
    return !key; // Open by default if key is missing
  });

  const handleReset = () => {
    setStatus("init");
    setCurrentAgent(null);
    setLogs([]);
    setTripData(null);
    setErrorMessage(null);
  };

  const handlePlanTrip = async (formData) => {
    const activeKey = llmProvider === "gemini" ? geminiApiKey : openaiApiKey;
    if (!activeKey) {
      setStatus("error");
      setErrorMessage(`The API Key for ${llmProvider === "gemini" ? "Gemini" : "OpenAI"} is missing. Please save your key first.`);
      setIsConfigOpen(true);
      return;
    }

    setStatus("running");
    setCurrentAgent("Coordinator");
    setLogs(["[System] Initializing connection to Multi-Agent API..."]);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData
      };

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Llm-Provider": llmProvider,
          "X-Gemini-Api-Key": geminiApiKey,
          "X-OpenAI-Api-Key": openaiApiKey,
          "X-Brave-Api-Key": braveApiKey,
          "X-Weather-Api-Key": weatherApiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errDetail = "Failed to launch agent pipeline.";
        try {
          const errText = await response.text();
          try {
            const errJson = JSON.parse(errText);
            errDetail = errJson.detail || errDetail;
          } catch {
            errDetail = errText || errDetail;
          }
        } catch (readErr) {
          console.error("Failed to read error response:", readErr);
        }
        throw new Error(errDetail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        // Keep the last incomplete block in buffer
        buffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const rawJson = trimmedLine.slice(6);
            try {
              const event = JSON.parse(rawJson);
              
              if (event.type === "progress") {
                setCurrentAgent(event.agent);
                if (event.state && event.state.logs) {
                  setLogs(event.state.logs);
                }
                if (event.state) {
                  setTripData(event.state);
                }
              } else if (event.type === "completed") {
                setTripData(event.state);
                setLogs(event.state.logs);
                setStatus("completed");
                setCurrentAgent(null);
              } else if (event.type === "error") {
                setStatus("error");
                setErrorMessage(event.message);
                setCurrentAgent(event.agent || null);
                return;
              }
            } catch (err) {
              console.error("SSE JSON Parse error:", err, rawJson);
            }
          }
        }
      }
    } catch (err) {
      console.error("Connection error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Could not communicate with the Python backend server. Make sure it is running on port 8000.");
    }
  };

  const hasActiveLlmKey = llmProvider === "gemini" ? !!geminiApiKey : !!openaiApiKey;

  return (
    <div className="app-container">
      {/* Integrations Collapsible Left Drawer */}
      <div 
        className={`integrations-drawer-overlay ${isConfigOpen ? "open" : ""}`} 
        onClick={() => setIsConfigOpen(false)} 
      />
      <div className={`integrations-drawer ${isConfigOpen ? "open" : ""}`}>
        <button 
          onClick={() => setIsConfigOpen(false)} 
          className="drawer-close-btn"
          title="Close Settings"
        >
          <X size={18} />
        </button>
        <APIConfig 
          llmProvider={llmProvider}
          setLlmProvider={setLlmProvider}
          geminiApiKey={geminiApiKey}
          setGeminiApiKey={setGeminiApiKey}
          openaiApiKey={openaiApiKey}
          setOpenaiApiKey={setOpenaiApiKey}
          braveApiKey={braveApiKey}
          setBraveApiKey={setBraveApiKey}
          weatherApiKey={weatherApiKey}
          setWeatherApiKey={setWeatherApiKey}
        />
      </div>

      {/* App Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <PlaneTakeoff size={22} />
          </div>
          <div>
            <h1 className="logo-title">
              TripPlanner<span className="gradient-text">.AI</span>
            </h1>
            <span className="logo-subtitle">Multi-Agent Travel Coordinator</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button 
            onClick={() => setIsConfigOpen(true)} 
            className="btn btn-secondary" 
            style={{ 
              padding: "0.45rem 0.9rem", 
              fontSize: "0.8rem", 
              borderRadius: "8px", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <Settings size={14} className="animate-spin-slow" />
            <span>API Integrations</span>
          </button>
          
          {status === "completed" && (
            <span className="api-status status-active" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Bot size={12} /> Workflow Active
            </span>
          )}
        </div>
      </header>

      {/* Main Content Areas */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Step 1: Input Setup & API Config */}
        {(status === "init" || status === "error") && (
          <div className="config-container">
            {/* If LLM API Key is saved, show the Planner Form */}
            {hasActiveLlmKey ? (
              <TripForm onSubmit={handlePlanTrip} isFormDisabled={status === "running"} />
            ) : (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: "3.5rem 2.5rem", 
                  textAlign: "center", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  gap: "1.5rem", 
                  borderLeft: "4px solid #f87171",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldAlert size={42} style={{ color: "#f87171" }} />
                  <h3 style={{ fontSize: "1.4rem", fontWeight: "700", fontFamily: "var(--font-header)", margin: 0 }}>
                    API Credentials Required
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "460px", lineHeight: "1.6", margin: 0 }}>
                    Enter your language model credentials to spin up the multi-agent coordination system.
                  </p>
                </div>

                {/* Clean, readable list of required vs optional services */}
                <div 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "0.75rem", 
                    width: "100%", 
                    maxWidth: "400px",
                    background: "rgba(0, 0, 0, 0.2)",
                    padding: "1.25rem 1.5rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                    textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <CheckCircle2 size={16} style={{ color: "#f87171", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.85rem" }}>
                      <strong style={{ color: "var(--text-main)" }}>LLM Engine Key (Required)</strong>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-dark)" }}>
                        Gemini (Free) or OpenAI key to power the specialist agents.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.75rem" }}>
                    <HelpCircle size={16} style={{ color: "var(--primary-color)", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.85rem" }}>
                      <strong style={{ color: "var(--text-main)" }}>Brave Search API Key (Optional)</strong>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-dark)" }}>
                        If omitted, falls back to keyless DuckDuckGo/Wikipedia Search.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.75rem" }}>
                    <HelpCircle size={16} style={{ color: "var(--primary-color)", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.85rem" }}>
                      <strong style={{ color: "var(--text-main)" }}>WeatherAPI Key (Optional)</strong>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-dark)" }}>
                        If omitted, falls back to keyless Open-Meteo Weather forecast.
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsConfigOpen(true)} 
                  className="btn btn-primary" 
                  style={{ 
                    marginTop: "0.5rem", 
                    padding: "0.7rem 1.5rem",
                    fontSize: "0.9rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Settings size={16} />
                  Configure API Keys
                </button>
              </div>
            )}

            {/* Error Message block if setup had failure */}
            {status === "error" && errorMessage && (
              <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", borderLeft: "4px solid #ef4444", background: "rgba(239, 68, 68, 0.04)" }}>
                <h4 style={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: "700", marginBottom: "0.25rem" }}>Orchestration Error</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{errorMessage}</p>
                <button onClick={handleReset} className="btn btn-secondary" style={{ marginTop: "1rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                  Dismiss & Reset Form
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Agent Progress Terminals */}
        {status === "running" && (
          <AgentProgress 
            currentAgent={currentAgent} 
            status={status} 
            logs={logs} 
            errorMessage={errorMessage} 
          />
        )}

        {/* Step 3: Completed Dashboard */}
        {status === "completed" && (
          <TripDashboard tripData={tripData} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
