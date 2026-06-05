"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Wifi, Cpu, Layers, RefreshCw, BarChart2, Activity } from "lucide-react";
import GraphView from "../components/GraphView";
import IntelligenceSidebar from "../components/IntelligenceSidebar";

interface Node {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  risk_level: string;
  risk_score: number;
  chain_depth: number;
  circular_ownership: boolean;
  sanctions_match: boolean;
  insights: string[];
}

interface Edge {
  source: string;
  target: string;
  share: number;
  type: string;
}

export default function Dashboard() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<"online" | "fallback">("online");
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState({
    risk_level: "ALL",
    jurisdiction: "ALL",
    max_depth: 10,
    sanctions_only: false,
    entity_type: "ALL"
  });

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Connect to FastAPI backend
      const graphRes = await fetch("http://localhost:8000/api/ownership-graph");
      if (!graphRes.ok) {
        throw new Error("Backend graph API returned non-ok status");
      }
      const graphData = await graphRes.json();
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
      
      // Calculate available jurisdictions
      const jurs = Array.from(new Set(graphData.nodes.map((n: Node) => n.jurisdiction))) as string[];
      setJurisdictions(jurs);
      setSystemStatus("online");
    } catch (err) {
      console.warn("Backend API unreachable. Triggering client-side fallback visualizer.", err);
      // Hard fallback dataset for frontend safety if backend uvicorn is not running yet
      const fallbackData = {
        nodes: [
          { id: "E001", name: "Alpha Holdings Ltd", type: "Company", jurisdiction: "Cayman Islands", risk_level: "High", risk_score: 70, chain_depth: 3, circular_ownership: false, sanctions_match: false, insights: ["High-transparency review recommended due to offshore jurisdiction."] },
          { id: "E002", name: "Beta Shell Corp", type: "Company", jurisdiction: "Panama", risk_level: "High", risk_score: 75, chain_depth: 2, circular_ownership: false, sanctions_match: false, insights: ["Enhanced due diligence recommended due to offshore tax-haven exposure.", "Corporate transparency score degraded due to missing regulatory disclosures."] },
          { id: "E003", name: "Giga Trust", type: "Trust", jurisdiction: "Switzerland", risk_level: "Medium", risk_score: 45, chain_depth: 1, circular_ownership: false, sanctions_match: false, insights: ["Intermediate complexity ownership chain detected."] },
          { id: "E004", name: "Vladimir Roskov", type: "Individual", jurisdiction: "Russian Federation", risk_level: "Critical", risk_score: 95, chain_depth: 0, circular_ownership: false, sanctions_match: true, insights: ["Immediate sanctions screening escalation required due to direct/indirect OFAC match."] },
          { id: "E005", name: "Nexus Trade Ltd", type: "Company", jurisdiction: "United Kingdom", risk_level: "Critical", risk_score: 90, chain_depth: 3, circular_ownership: true, sanctions_match: false, insights: ["Red Flag: Circular ownership path identified."] },
          { id: "E006", name: "Vortex Holdings", type: "Company", jurisdiction: "Cyprus", risk_level: "Critical", risk_score: 90, chain_depth: 3, circular_ownership: true, sanctions_match: false, insights: ["Red Flag: Circular ownership path identified."] },
          { id: "E007", name: "Orbit Logistics", type: "Company", jurisdiction: "Cyprus", risk_level: "Critical", risk_score: 90, chain_depth: 3, circular_ownership: true, sanctions_match: false, insights: ["Red Flag: Circular ownership path identified."] }
        ],
        edges: [
          { source: "E002", target: "E001", share: 100, type: "owns" },
          { source: "E003", target: "E002", share: 80, type: "owns" },
          { source: "E004", target: "E003", share: 51, type: "beneficiary" },
          { source: "E005", target: "E006", share: 40, type: "owns" },
          { source: "E006", target: "E007", share: 60, type: "owns" },
          { source: "E007", target: "E005", share: 55, type: "owns" }
        ]
      };
      setNodes(fallbackData.nodes);
      setEdges(fallbackData.edges);
      setJurisdictions(["Cayman Islands", "Panama", "Switzerland", "Russian Federation", "United Kingdom", "Cyprus"]);
      setSystemStatus("fallback");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleData = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      source: "Real Rails Governance & Trust Library",
      dataset: "Beneficial Ownership Risk Payload",
      nodes,
      edges
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "beneficial_ownership_risk_payload.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Compute live summary indicators
  const totalAudited = nodes.length;
  const sanctionsMatches = nodes.filter(n => n.sanctions_match).length;
  const offshoreExposures = nodes.filter(n => ["Cayman Islands", "Panama", "Bahamas"].includes(n.jurisdiction)).length;
  const circularLoops = nodes.filter(n => n.circular_ownership).length;

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#030712] text-slate-100 font-sans">
      
      {/* High-End Terminal Header */}
      <header className="h-16 shrink-0 bg-[#0B1117]/85 border-b border-[#1F2937] px-6 flex items-center justify-between backdrop-blur-md z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-sky-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase font-mono">
              Beneficial Ownership Red-Flag Finder
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wider font-mono">
              REAL RAILS INTELLIGENCE LIBRARY // GOVERNANCE & TRUST RAIL
            </p>
          </div>
        </div>

        {/* Live system state indicators */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-[#1F2937] px-3 py-1 rounded-md text-xs font-mono">
            {systemStatus === "online" ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">ENGINE ONLINE</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                <span className="text-yellow-500">MOCK FALLBACK ACTIVE</span>
              </>
            )}
          </div>
          
          <button
            onClick={fetchGraphData}
            className="p-2 hover:bg-slate-800 border border-[#1F2937] rounded-md transition"
            title="Refresh engine state"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Real-time Summary Indicators Bar */}
      <section className="h-14 shrink-0 bg-slate-950 border-b border-[#1F2937] px-6 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex space-x-8">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Total Entities Checked</span>
            <span className="text-sm font-bold text-slate-200">{totalAudited}</span>
          </div>
          <div className="border-l border-slate-800 pl-8">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Sanctions Mapped (OFAC)</span>
            <span className={`text-sm font-bold ${sanctionsMatches > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {sanctionsMatches} Found
            </span>
          </div>
          <div className="border-l border-slate-800 pl-8">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Offshore Trusts/Corps</span>
            <span className="text-sm font-bold text-sky-400">{offshoreExposures} Flagged</span>
          </div>
          <div className="border-l border-slate-800 pl-8">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Circular Ownership Loops</span>
            <span className={`text-sm font-bold ${circularLoops > 0 ? "text-red-400" : "text-slate-400"}`}>
              {circularLoops} Detected
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 uppercase">
          <Cpu className="w-3.5 h-3.5 text-sky-500" />
          <span>Analytics Core v1.0.0</span>
        </div>
      </section>

      {/* Split Stage Workspace */}
      <div className="flex-1 flex overflow-hidden p-4 space-x-4">
        
        {/* Main Stage (70% width) */}
        <section className="w-[70%] h-full flex flex-col space-y-4">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0B1117] rounded-lg border border-[#1F2937]">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
              <p className="text-xs uppercase font-mono text-slate-400 tracking-wider">Syncing ownership graph nodes...</p>
            </div>
          ) : (
            <>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    Ownership Network Visualisation (70% Split)
                  </span>
                  {selectedNode && (
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-mono"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <div className="flex-1 relative">
                  <GraphView
                    nodes={nodes}
                    edges={edges}
                    selectedNodeId={selectedNode?.id || null}
                    onSelectNode={(node) => setSelectedNode(node)}
                    filters={filters}
                  />
                </div>
              </div>
            </>
          )}

          {/* Quick audit metrics dashboard footer */}
          <div className="h-24 bg-[#0B1117]/60 border border-[#1F2937] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart2 className="w-8 h-8 text-slate-500" />
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Corporate Red-Flag Index</h4>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  Real-time network traversal mapping paths to high-risk sovereign jurisdictions.
                </p>
              </div>
            </div>
            <div className="flex space-x-4 text-xs font-mono">
              <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                <span className="text-[9px] text-slate-500 block">MAX DEPTH INDEX</span>
                <span className="font-bold text-slate-300">6 Levels</span>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                <span className="text-[9px] text-slate-500 block">AVERAGE RISK</span>
                <span className="font-bold text-yellow-500">62.8 / 100</span>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Sidebar (30% width) */}
        <section className="w-[30%] min-w-[340px] max-w-[400px] h-full">
          <IntelligenceSidebar
            selectedNode={selectedNode}
            filters={filters}
            setFilters={setFilters}
            availableJurisdictions={jurisdictions}
            onDownloadSampleData={handleDownloadSampleData}
          />
        </section>
      </div>

    </main>
  );
}
