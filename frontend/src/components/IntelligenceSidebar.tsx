"use client";

import React, { useState, useEffect } from "react";
import { Download, Edit3, ShieldAlert, Award, FileText, Globe, AlertTriangle, Layers, UserCheck } from "lucide-react";

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

interface AnalystNote {
  entity_id: string;
  note: string;
  status: string;
  analyst: string;
}

interface IntelligenceSidebarProps {
  selectedNode: Node | null;
  filters: {
    risk_level: string;
    jurisdiction: string;
    max_depth: number;
    sanctions_only: boolean;
    entity_type: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    risk_level: string;
    jurisdiction: string;
    max_depth: number;
    sanctions_only: boolean;
    entity_type: string;
  }>>;
  availableJurisdictions: string[];
  onDownloadSampleData: () => void;
}

export default function IntelligenceSidebar({
  selectedNode,
  filters,
  setFilters,
  availableJurisdictions,
  onDownloadSampleData
}: IntelligenceSidebarProps) {
  // Analyst Notes state
  const [noteContent, setNoteContent] = useState("");
  const [noteStatus, setNoteStatus] = useState("investigating");
  const [savedNotes, setSavedNotes] = useState<AnalystNote[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavedMessage, setIsSavedMessage] = useState(false);

  // Load notes on mount / node selection
  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      const existingNote = savedNotes.find(n => n.entity_id === selectedNode.id);
      if (existingNote) {
        setNoteContent(existingNote.note);
        setNoteStatus(existingNote.status);
      } else {
        setNoteContent("");
        setNoteStatus("investigating");
      }
    }
  }, [selectedNode, savedNotes]);

  const fetchNotes = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/analyst-notes");
      if (res.ok) {
        const data = await res.json();
        setSavedNotes(data);
      }
    } catch (err) {
      console.error("Error loading analyst notes:", err);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNode) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/api/analyst-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_id: selectedNode.id,
          note: noteContent,
          status: noteStatus,
          analyst: "Compliance Lead"
        })
      });
      if (res.ok) {
        setIsSavedMessage(true);
        setTimeout(() => setIsSavedMessage(false), 3000);
        await fetchNotes();
      }
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBadgeStyles = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "bg-red-500/10 text-red-400 border border-red-500/40 animate-pulse";
      case "high":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/30";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-1">
      {/* SECTION A: Entity Details / Investigation Window */}
      <div className="glass-panel p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-2 border-b border-border pb-3 mb-3">
          <Layers className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-sky-400 font-mono">
            Section A: Investigation Panel
          </h2>
        </div>

        {selectedNode ? (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Entity Name</span>
              <h3 className="text-lg font-bold text-slate-100">{selectedNode.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedNode.type} • {selectedNode.jurisdiction}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-border">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Risk Score</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className={`text-xl font-bold font-mono ${selectedNode.risk_score >= 80 ? "text-red-400" : selectedNode.risk_score >= 60 ? "text-orange-400" : selectedNode.risk_score >= 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                    {selectedNode.risk_score}/100
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${getRiskBadgeStyles(selectedNode.risk_level)}`}>
                    {selectedNode.risk_level}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-border">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Chain Depth</span>
                <span className="text-xl font-bold text-slate-100 mt-1 block font-mono">
                  {selectedNode.chain_depth} levels
                </span>
              </div>
            </div>

            {/* Structured Insights (Translated Raw Data -> Intelligence) */}
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 font-mono flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
                <span>Computed Intelligence</span>
              </h4>
              <ul className="text-xs space-y-2 text-slate-400">
                {selectedNode.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5 border-l-2 border-sky-500 pl-2 py-0.5">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Analyst Notebook Section */}
            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-semibold text-slate-300 font-mono mb-2 flex items-center space-x-1.5">
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                <span>Analyst Investigation Notes</span>
              </h4>
              <div className="space-y-2">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record verification notes, compliance flags, or audit findings..."
                  className="w-full h-20 bg-slate-950/80 border border-border rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-sans"
                />
                
                <div className="flex justify-between items-center">
                  <select
                    value={noteStatus}
                    onChange={(e) => setNoteStatus(e.target.value)}
                    className="bg-slate-950 border border-border text-slate-300 text-[11px] rounded p-1 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="investigating">🟡 Investigating</option>
                    <option value="escalated">🔴 Escalated</option>
                    <option value="resolved">🟢 Resolved</option>
                  </select>

                  <button
                    onClick={handleSaveNote}
                    disabled={isSubmitting || !noteContent.trim()}
                    className="bg-sky-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-1 font-mono"
                  >
                    <span>{isSubmitting ? "Saving..." : "Save Note"}</span>
                  </button>
                </div>
                {isSavedMessage && (
                  <p className="text-[10px] text-emerald-400 text-right mt-1 font-mono">Note committed successfully.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 border border-dashed border-border rounded-lg bg-slate-950/20">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs uppercase font-mono tracking-wider">Select Graph Node to Audit</p>
            <p className="text-[10px] text-slate-600 mt-1">Full ownership risk diagnostics will print here.</p>
          </div>
        )}
      </div>

      {/* SECTION B: Why This Matters */}
      <div className="glass-panel p-4 rounded-xl border border-border bg-slate-950/20">
        <div className="flex items-center space-x-2 border-b border-border pb-3 mb-2.5">
          <Award className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-indigo-400 font-mono">
            Section B: Why This Matters
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          This system is critical for allocators, lenders, and compliance teams. Unmasking <strong className="text-slate-200">hidden ownership chains</strong> exposes hidden risks before capital deployment. By tracking sanctions mappings (OFAC checks) and detecting <strong className="text-slate-200">circular loop tax-havens</strong>, institutions avoid catastrophic regulatory violations, tax evasions, and asset freezes.
        </p>
      </div>

      {/* SECTION C: Who Controls the Rail */}
      <div className="glass-panel p-4 rounded-xl border border-border bg-slate-950/20">
        <div className="flex items-center space-x-2 border-b border-border pb-3 mb-2.5">
          <Globe className="w-5 h-5 text-[#818CF8]" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[#818CF8] font-mono">
            Section C: Who Controls the Rail
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          This rail is ultimately controlled by global regulatory bodies such as <strong className="text-slate-300">FinCEN</strong>, <strong className="text-slate-300">FATF</strong>, <strong className="text-slate-300">OFAC</strong>, the <strong className="text-slate-300">SEC</strong>, state corporate registries, and the compliance departments of financial institutions enforcing ownership transparency requirements.
        </p>
      </div>

      {/* SECTION D: Live Filters */}
      <div className="glass-panel p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-2 border-b border-border pb-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-yellow-500 font-mono">
            Section D: Risk Filters
          </h2>
        </div>
        
        <div className="space-y-3.5">
          {/* Entity Type Filter */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1">Entity Type</label>
            <select
              value={filters.entity_type}
              onChange={(e) => setFilters(prev => ({ ...prev, entity_type: e.target.value }))}
              className="w-full bg-slate-950 border border-border text-slate-300 text-xs rounded p-2 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="Company">Company</option>
              <option value="Trust">Trust</option>
              <option value="Individual">Individual</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1">Risk Profile</label>
            <select
              value={filters.risk_level}
              onChange={(e) => setFilters(prev => ({ ...prev, risk_level: e.target.value }))}
              className="w-full bg-slate-950 border border-border text-slate-300 text-xs rounded p-2 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="ALL">ALL RISK SCORES</option>
              <option value="Critical">🔴 Critical</option>
              <option value="High">🟠 High Risk</option>
              <option value="Medium">🟡 Medium Risk</option>
              <option value="Low">🟢 Low Risk</option>
            </select>
          </div>

          {/* Jurisdiction Filter */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1">Jurisdiction</label>
            <select
              value={filters.jurisdiction}
              onChange={(e) => setFilters(prev => ({ ...prev, jurisdiction: e.target.value }))}
              className="w-full bg-slate-950 border border-border text-slate-300 text-xs rounded p-2 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="ALL">ALL JURISDICTIONS</option>
              {availableJurisdictions.map((jur, idx) => (
                <option key={idx} value={jur}>{jur}</option>
              ))}
            </select>
          </div>

          {/* Toggle buttons for sanctions */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="sanctions-toggle"
              checked={filters.sanctions_only}
              onChange={(e) => setFilters(prev => ({ ...prev, sanctions_only: e.target.checked }))}
              className="w-3.5 h-3.5 accent-red-500 rounded border-[#1F2937] bg-slate-950 focus:ring-0"
            />
            <label htmlFor="sanctions-toggle" className="text-xs text-slate-400 font-mono cursor-pointer select-none">
              Sanctions Exposure Only
            </label>
          </div>
        </div>
      </div>

      {/* SECTION E: Download Sample Data */}
      <div className="glass-panel p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-2 border-b border-border pb-3 mb-3.5">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-emerald-400 font-mono">
            Section E: Export Terminal
          </h2>
        </div>
        <button
          onClick={onDownloadSampleData}
          className="w-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 rounded-lg hover:bg-emerald-400 transition flex items-center justify-center space-x-2 font-mono shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Download Sample Payload</span>
        </button>
      </div>
    </div>
  );
}
