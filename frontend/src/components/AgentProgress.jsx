import { useEffect, useRef } from "react";
import { 
  Bot, Globe, CloudSun, MapPin, CircleDollarSign, 
  Hotel, Briefcase, CalendarCheck2, Loader2, AlertTriangle 
} from "lucide-react";

const AGENT_SEQUENCE = [
  { id: "Coordinator", name: "Coordinator", icon: Bot, label: "Coordinator" },
  { id: "Destination Agent", name: "Destination Agent", icon: Globe, label: "Destination" },
  { id: "Weather Agent", name: "Weather Agent", icon: CloudSun, label: "Weather" },
  { id: "Attractions Agent", name: "Attractions Agent", icon: MapPin, label: "Attractions" },
  { id: "Budget Agent", name: "Budget Agent", icon: CircleDollarSign, label: "Budget" },
  { id: "Transport & Stay Agent", name: "Transport & Stay Agent", icon: Hotel, label: "Stay & Transit" },
  { id: "Travel Tips Agent", name: "Travel Tips Agent", icon: Briefcase, label: "Travel Tips" },
  { id: "Itinerary Agent", name: "Itinerary Agent", icon: CalendarCheck2, label: "Itinerary" }
];

export default function AgentProgress({ currentAgent, status, logs, errorMessage }) {
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Determine the status of each agent in the sequence
  const getAgentStatus = (agentName) => {
    if (status === "error" && currentAgent === agentName) {
      return "error";
    }
    if (status === "completed") {
      return "completed";
    }
    
    const currentIndex = AGENT_SEQUENCE.findIndex(a => a.name === currentAgent);
    const agentIndex = AGENT_SEQUENCE.findIndex(a => a.name === agentName);
    
    if (currentIndex === -1) {
      return "idle";
    }
    
    if (currentIndex > agentIndex) {
      return "completed";
    } else if (currentIndex === agentIndex) {
      return "running";
    } else {
      return "idle";
    }
  };

  return (
    <div className="progress-container">
      {/* 1. Visual Graph of Specialist Agents */}
      <div className="agents-graph-card glass-panel">
        <h3 className="graph-title">
          <span className="gradient-text" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <Loader2 className="animate-spin" size={18} style={{ color: "var(--primary-color)" }} />
            Multi-Agent Orchestration Flow
          </span>
        </h3>
        
        <div className="nodes-grid">
          {AGENT_SEQUENCE.map(agent => {
            const agentStatus = getAgentStatus(agent.name);
            const Icon = agent.icon;
            return (
              <div key={agent.id} className={`agent-node ${agentStatus}`} title={`${agent.label} - ${agentStatus}`}>
                <Icon className="agent-node-icon" size={24} />
                <span className="agent-node-name">{agent.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Scrolling Terminal Console */}
      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot dot-red" />
            <div className="terminal-dot dot-yellow" />
            <div className="terminal-dot dot-green" />
          </div>
          <span className="terminal-title">AGENT_ORCHESTRATOR_CONSOLE</span>
          <div style={{ width: "42px" }} /> {/* spacer */}
        </div>
        
        <div className="terminal-body">
          {logs.length === 0 ? (
            <div className="terminal-line">
              <span className="terminal-prompt">$</span>
              <span className="terminal-text">Initializing agent workflow...</span>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="terminal-line">
                <span className="terminal-prompt">&gt;</span>
                <span className="terminal-text">{log}</span>
              </div>
            ))
          )}
          
          {/* Active running prompt */}
          {status === "running" && (
            <div className="terminal-line">
              <span className="terminal-prompt">$</span>
              <span className="terminal-text">
                Waiting on {currentAgent || "Coordinator"}...
                <span className="terminal-cursor" />
              </span>
            </div>
          )}

          {/* Error message */}
          {status === "error" && (
            <div className="terminal-line" style={{ color: "#f87171" }}>
              <span className="terminal-prompt">Error:</span>
              <span className="terminal-text">
                <AlertTriangle size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                {errorMessage || "Orchestration halted due to an agent exception."}
              </span>
            </div>
          )}
          
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
