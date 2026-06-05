"use client";

import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, Maximize2, ShieldAlert, AlertTriangle, HelpCircle, CheckCircle2 } from "lucide-react";

interface Node extends d3.SimulationNodeDatum {
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

interface Edge extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  share: number;
  type: string;
}

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  onSelectNode: (node: Node) => void;
  filters: {
    risk_level: string;
    jurisdiction: string;
    max_depth: number;
    sanctions_only: boolean;
    entity_type: string;
  };
}

export default function GraphView({
  nodes: rawNodes,
  edges: rawEdges,
  selectedNodeId,
  onSelectNode,
  filters
}: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Parse and filter data
  useEffect(() => {
    // Deep clone raw data to avoid D3 modifying props directly
    const nodesMap = new Map(rawNodes.map(n => [n.id, { ...n }]));
    
    // Filter nodes
    let filteredNodesList = Array.from(nodesMap.values());
    
    if (filters.risk_level && filters.risk_level !== "ALL") {
      filteredNodesList = filteredNodesList.filter(n => n.risk_level.toLowerCase() === filters.risk_level.toLowerCase());
    }
    if (filters.jurisdiction && filters.jurisdiction !== "ALL") {
      filteredNodesList = filteredNodesList.filter(n => n.jurisdiction.toLowerCase() === filters.jurisdiction.toLowerCase());
    }
    if (filters.entity_type && filters.entity_type !== "ALL") {
      filteredNodesList = filteredNodesList.filter(n => n.type.toLowerCase() === filters.entity_type.toLowerCase());
    }
    if (filters.sanctions_only) {
      filteredNodesList = filteredNodesList.filter(n => n.sanctions_match);
    }
    
    const activeNodeIds = new Set(filteredNodesList.map(n => n.id));
    
    // Keep edges where both source and target are in filtered list
    const filteredEdgesList = rawEdges
      .filter(e => {
        const sourceId = typeof e.source === "string" ? e.source : (e.source as Node).id;
        const targetId = typeof e.target === "string" ? e.target : (e.target as Node).id;
        return activeNodeIds.has(sourceId) && activeNodeIds.has(targetId);
      })
      .map(e => ({
        ...e,
        source: typeof e.source === "string" ? e.source : (e.source as Node).id,
        target: typeof e.target === "string" ? e.target : (e.target as Node).id
      }));

    // Setup D3 Simulation
    const simulationNodes = filteredNodesList.map(n => ({
      ...n,
      x: n.x ?? Math.random() * 500 + 100,
      y: n.y ?? Math.random() * 400 + 100
    })) as Node[];

    const simulationEdges = filteredEdgesList.map(e => ({
      ...e,
      source: simulationNodes.find(n => n.id === e.source)!,
      target: simulationNodes.find(n => n.id === e.target)!
    })) as Edge[];

    const sim = d3.forceSimulation<Node>(simulationNodes)
      .force("link", d3.forceLink<Node, Edge>(simulationEdges).id(d => d.id).distance(160).strength(0.8))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(350, 250))
      .force("collision", d3.forceCollide().radius(80))
      .alphaDecay(0.08);

    sim.on("tick", () => {
      setNodes([...simulationNodes]);
      setEdges([...simulationEdges]);
    });

    return () => {
      sim.stop();
    };
  }, [rawNodes, rawEdges, filters]);

  // SVG Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.2, Math.min(nextZoom, 3)));
  };

  // Node Dragging
  const handleNodeDragStart = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const mouseMoveHandler = (moveEvt: MouseEvent) => {
      // Convert screen delta to zoom scale
      const dx = (moveEvt.clientX - e.clientX) / zoom;
      const dy = (moveEvt.clientY - e.clientY) / zoom;
      
      setNodes(prevNodes => 
        prevNodes.map(n => {
          if (n.id === node.id) {
            return {
              ...n,
              x: (node.x || 0) + dx,
              y: (node.y || 0) + dy
            };
          }
          return n;
        })
      );
    };

    const mouseUpHandler = () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
    };

    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mouseup", mouseUpHandler);
  };

  // Check if a node is in the highlighted pathway
  // Trace all ancestors of the selectedNodeId
  const getHighlightStatus = (nodeId: string) => {
    if (!selectedNodeId) return { isSelected: false, isPath: false };
    if (selectedNodeId === nodeId) return { isSelected: true, isPath: true };

    // Simple ancestor DFS
    const visited = new Set<string>();
    const findAncestors = (currId: string): boolean => {
      if (currId === nodeId) return true;
      visited.add(currId);
      
      const outgoingEdges = rawEdges.filter(e => {
        const targetId = typeof e.target === "string" ? e.target : (e.target as Node).id;
        return targetId === currId;
      });

      for (const edge of outgoingEdges) {
        const sourceId = typeof edge.source === "string" ? edge.source as string : (edge.source as Node).id;
        if (!visited.has(sourceId)) {
          if (findAncestors(sourceId)) return true;
        }
      }
      return false;
    };

    const isPath = findAncestors(selectedNodeId);
    return { isSelected: false, isPath };
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical":
        return <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />;
      case "medium":
        return <HelpCircle className="w-4 h-4 text-yellow-500 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
  };

  const getRiskColor = (risk: string, sanctions: boolean) => {
    if (sanctions) return "border-red-600 bg-red-950/40 text-red-400";
    switch (risk.toLowerCase()) {
      case "critical":
        return "border-red-500 bg-red-950/30 text-red-400";
      case "high":
        return "border-orange-500 bg-orange-950/20 text-orange-400";
      case "medium":
        return "border-yellow-500 bg-yellow-950/15 text-yellow-400";
      default:
        return "border-emerald-500 bg-emerald-950/10 text-emerald-400";
    }
  };

  const getNodeColors = (type: string) => {
    switch (type.toLowerCase()) {
      case "company":
        return { bg: "bg-[#0B1117]/90", border: "border-sky-500/40", text: "text-sky-400" };
      case "trust":
        return { bg: "bg-[#0B1117]/90", border: "border-indigo-500/40", text: "text-indigo-400" };
      case "individual":
        return { bg: "bg-[#0B1117]/90", border: "border-emerald-500/40", text: "text-emerald-400" };
      default:
        return { bg: "bg-[#0B1117]/90", border: "border-gray-500/40", text: "text-gray-400" };
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-[#030712] rounded-lg border border-[#1F2937] overflow-hidden group">
      {/* HUD Navigation controls */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-slate-900/80 border border-[#1F2937] backdrop-blur-md p-1.5 rounded-lg shadow-lg">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.2))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 150, y: 150 }); }}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          title="Recenter"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex space-x-4 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-400" />
          <span>Company</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-400" />
          <span>Trust</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
          <span>Individual</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-500 animate-pulse" />
          <span>Sanctioned / Loop</span>
        </div>
      </div>

      {/* Main Interactive Graph Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Arrow markers for directed graphs */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 z" fill="#4B5563" />
          </marker>
          <marker
            id="arrow-highlight"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 z" fill="#38BDF8" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render Relationships (Edges) */}
          {edges.map((edge, idx) => {
            const sourceNode = edge.source as Node;
            const targetNode = edge.target as Node;
            
            if (!sourceNode || !targetNode || sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) {
              return null;
            }

            const { isPath } = getHighlightStatus(sourceNode.id);
            const isTargetSelected = targetNode.id === selectedNodeId;
            const isHighlighted = isPath && isTargetSelected;

            // Compute edge path with offset to prevent overlap and point to node boundary
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const angle = Math.atan2(dy, dx);
            
            // Coordinates slightly offset from actual node centers to create arrow spacing
            const startX = sourceNode.x + Math.cos(angle) * 30;
            const startY = sourceNode.y + Math.sin(angle) * 30;
            const endX = targetNode.x - Math.cos(angle) * 55;
            const endY = targetNode.y - Math.sin(angle) * 55;

            // Center of the edge for percentage labels
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={isHighlighted ? "#38BDF8" : "#1F2937"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={isHighlighted ? "none" : edge.type === "beneficiary" ? "4,4" : "none"}
                  markerEnd={`url(#${isHighlighted ? "arrow-highlight" : "arrow"})`}
                  className="transition-all duration-300"
                />
                
                {/* Ownership Percentage Overlay */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-18"
                    y="-8"
                    width="36"
                    height="16"
                    rx="4"
                    fill="#0B1117"
                    stroke={isHighlighted ? "#38BDF8" : "#1F2937"}
                    strokeWidth="1"
                  />
                  <text
                    fontSize="9"
                    fill={isHighlighted ? "#38BDF8" : "#9CA3AF"}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="font-mono font-semibold"
                  >
                    {edge.share}%
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Entities (Nodes) */}
          {nodes.map((node) => {
            if (node.x === undefined || node.y === undefined) return null;

            const { isSelected, isPath } = getHighlightStatus(node.id);
            const style = getNodeColors(node.type);
            const riskBorder = getRiskColor(node.risk_level, node.sanctions_match);

            // Width and height of node card
            const width = 160;
            const height = 65;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
                className="cursor-pointer select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                onMouseDown={(e) => handleNodeDragStart(node, e)}
              >
                {/* Background Shadow / Cyan Glow */}
                <rect
                  x="-1"
                  y="-1"
                  width={width + 2}
                  height={height + 2}
                  rx="8"
                  fill="none"
                  stroke={isSelected ? "#38BDF8" : "none"}
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                  style={{
                    filter: isSelected ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))" : "none"
                  }}
                />

                {/* Main Card Container */}
                <rect
                  width={width}
                  height={height}
                  rx="6"
                  className={`${style.bg} ${node.sanctions_match || node.circular_ownership ? "critical-glow" : isSelected ? "border-[#38BDF8]" : "border-[#1F2937]"} border`}
                  strokeWidth={isSelected ? 1.5 : 1}
                />

                {/* Left Accent indicator stripe */}
                <rect
                  width="4"
                  height={height}
                  rx="2"
                  className={
                    node.sanctions_match
                      ? "fill-red-500"
                      : node.risk_level.toLowerCase() === "critical"
                      ? "fill-red-500"
                      : node.risk_level.toLowerCase() === "high"
                      ? "fill-orange-500"
                      : node.risk_level.toLowerCase() === "medium"
                      ? "fill-yellow-500"
                      : "fill-emerald-500"
                  }
                />

                {/* Entity Details Text (SVG Rendered) */}
                <text
                  x="14"
                  y="18"
                  fill="#F3F4F6"
                  fontSize="11"
                  fontWeight="bold"
                  className="font-sans"
                >
                  {node.name.length > 20 ? `${node.name.substring(0, 18)}...` : node.name}
                </text>

                <text
                  x="14"
                  y="34"
                  fill="#9CA3AF"
                  fontSize="9.5"
                  className="font-sans"
                >
                  {node.type} • {node.jurisdiction}
                </text>

                {/* Risk score pill */}
                <g transform={`translate(14, 43)`}>
                  <rect
                    width="62"
                    height="14"
                    rx="3"
                    className={
                      node.sanctions_match
                        ? "fill-red-950/50 stroke-red-800 stroke"
                        : node.risk_level.toLowerCase() === "critical"
                        ? "fill-red-950/40 stroke-red-800 stroke"
                        : node.risk_level.toLowerCase() === "high"
                        ? "fill-orange-950/40 stroke-orange-800 stroke"
                        : node.risk_level.toLowerCase() === "medium"
                        ? "fill-yellow-950/30 stroke-yellow-800 stroke"
                        : "fill-emerald-950/30 stroke-emerald-800 stroke"
                    }
                    strokeWidth="0.5"
                  />
                  <text
                    x="5"
                    y="10"
                    fill={
                      node.sanctions_match || node.risk_level.toLowerCase() === "critical"
                        ? "#F87171"
                        : node.risk_level.toLowerCase() === "high"
                        ? "#FB923C"
                        : node.risk_level.toLowerCase() === "medium"
                        ? "#FBBF24"
                        : "#34D399"
                    }
                    fontSize="8"
                    fontWeight="bold"
                    className="font-sans"
                  >
                    Risk: {node.risk_level}
                  </text>
                </g>

                {/* Sanctions Banner Overlay */}
                {node.sanctions_match && (
                  <g transform={`translate(${width - 24}, 8)`}>
                    <circle cx="8" cy="8" r="8" fill="#EF4444" />
                    <text
                      x="8"
                      y="11.5"
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
