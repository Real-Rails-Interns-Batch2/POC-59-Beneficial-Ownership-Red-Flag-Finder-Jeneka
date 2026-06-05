import os
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import networkx as nx

from data_adapter import DataAdapter

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title="Beneficial Ownership Red-Flag Finder API",
    description="Governance & Trust intelligence engine for investigating ownership risk.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise data adapter
adapter = DataAdapter()

NOTES_FILE = os.path.join(os.path.dirname(__file__), "analyst_notes.json")

class AnalystNote(BaseModel):
    entity_id: str
    note: str
    status: str  # "investigating", "escalated", "resolved"
    analyst: str = "Compliance Agent"

def get_graph_and_data():
    """Helper to load data and construct a NetworkX directed graph."""
    data = adapter.get_ownership_data()
    entities = data.get("entities", [])
    relationships = data.get("relationships", [])
    
    # Construct NetworkX graph
    G = nx.DiGraph()
    for ent in entities:
        G.add_node(ent["id"], **ent)
    
    for rel in relationships:
        G.add_edge(rel["source"], rel["target"], share=rel["share"], type=rel["type"])
        
    return G, entities, relationships

def compute_entity_intelligence(G: nx.DiGraph, entity_id: str, entities_map: Dict[str, Dict]) -> Dict[str, Any]:
    """Computes risk profile, chain depths, UBO details, and insights for a given entity."""
    entity = entities_map.get(entity_id)
    if not entity:
        return {}

    # Calculate ownership depth (longest path from a source/UBO to this node)
    # We can find all nodes that can reach entity_id
    ancestors = nx.ancestors(G, entity_id)
    
    # Subgraph containing entity and its owners
    owner_nodes = list(ancestors) + [entity_id]
    sub_G = G.subgraph(owner_nodes)
    
    max_depth = 0
    if len(owner_nodes) > 1:
        # Find paths from nodes with in-degree 0 in sub_G to entity_id
        entry_nodes = [n for n in sub_G.nodes if sub_G.in_degree(n) == 0]
        for entry in entry_nodes:
            try:
                paths = list(nx.all_simple_paths(sub_G, entry, entity_id))
                for p in paths:
                    max_depth = max(max_depth, len(p) - 1)
            except nx.NetworkXNoPath:
                pass

    # Check for circular ownership
    # A node is in a cycle if it is part of any strongly connected component of size > 1
    cycles = list(nx.simple_cycles(G))
    in_cycle = False
    cycle_nodes = []
    for cycle in cycles:
        if entity_id in cycle:
            in_cycle = True
            cycle_nodes = cycle
            break

    # Determine Ultimate Beneficial Owners (UBOs)
    # An UBO is an ancestor that has in-degree 0 in the overall graph, or in-degree 0 in the owner subgraph
    ubos = []
    entry_points = [n for n in sub_G.nodes if sub_G.in_degree(n) == 0]
    for ep in entry_points:
        if ep != entity_id:
            ep_details = entities_map.get(ep, {})
            ubos.append({
                "id": ep,
                "name": ep_details.get("name", ep),
                "type": ep_details.get("type", "Unknown"),
                "jurisdiction": ep_details.get("jurisdiction", "Unknown")
            })

    # Generate Risk Score & Category
    # Criteria:
    # - Sanctions match: CRITICAL
    # - Circular ownership: CRITICAL
    # - Missing disclosure in the chain: HIGH
    # - Offshore jurisdiction in the chain (Cayman Islands, Panama, Bahamas): HIGH
    # - Chain depth > 5: HIGH
    # - Chain depth > 3: MEDIUM
    # - Default: LOW
    
    has_sanctions = False
    has_missing_disclosure = False
    has_offshore = False
    offshore_jurisdictions = ["Cayman Islands", "Panama", "Bahamas", "Isle of Man"]
    
    # Scan all owners in the chain (ancestors + self)
    chain_nodes = list(ancestors) + [entity_id]
    for node in chain_nodes:
        n_data = entities_map.get(node, {})
        if n_data.get("sanctions_match"):
            has_sanctions = True
        if n_data.get("missing_disclosure"):
            has_missing_disclosure = True
        if n_data.get("jurisdiction") in offshore_jurisdictions:
            has_offshore = True

    if has_sanctions:
        risk_level = "Critical"
        risk_score = 95
        risk_reason = "Immediate sanctions screening escalation required. Entity chain contains sanctioned parties."
    elif in_cycle:
        risk_level = "Critical"
        risk_score = 90
        risk_reason = "Circular ownership loop detected. Highly suggestive of corporate concealment structures."
    elif has_missing_disclosure:
        risk_level = "High"
        risk_score = 75
        risk_reason = "High-transparency review recommended due to missing disclosures in the ownership chain."
    elif has_offshore:
        risk_level = "High"
        risk_score = 70
        risk_reason = "Enhanced due diligence recommended due to offshore tax-haven exposure."
    elif max_depth >= 5:
        risk_level = "High"
        risk_score = 65
        risk_reason = f"Ownership chain is {max_depth} levels deep. Structure is 133% deeper than portfolio average."
    elif max_depth >= 3:
        risk_level = "Medium"
        risk_score = 45
        risk_reason = f"Intermediate complexity ownership chain detected (Depth: {max_depth})."
    else:
        risk_level = "Low"
        risk_score = 15
        risk_reason = "Standard corporate transparency profile. Low exposure verified."

    # Generate insights list (Translate data to intelligence)
    insights = []
    if max_depth >= 5:
        insights.append(f"Ownership structure is 133% deeper than portfolio average (depth: {max_depth}).")
    if has_offshore:
        insights.append("High-transparency review recommended due to offshore jurisdiction presence.")
    if has_sanctions:
        insights.append("Immediate sanctions screening escalation required due to direct/indirect OFAC match.")
    if in_cycle:
        insights.append(f"Red Flag: Circular ownership path identified: {' -> '.join([entities_map[c]['name'] for c in cycle_nodes])}")
    if has_missing_disclosure:
        insights.append("Corporate transparency score degraded due to missing regulatory disclosures.")
        
    if not insights:
        insights.append("Corporate transparency matches baseline standards. Standard monitoring active.")

    return {
        "entity_id": entity_id,
        "name": entity["name"],
        "type": entity["type"],
        "jurisdiction": entity["jurisdiction"],
        "risk_level": risk_level,
        "risk_score": risk_score,
        "risk_reason": risk_reason,
        "chain_depth": max_depth,
        "circular_ownership": in_cycle,
        "ubos": ubos,
        "insights": insights
    }

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Beneficial Ownership Red-Flag Finder API",
        "engine": "FastAPI + NetworkX"
    }

@app.get("/api/entities")
def get_entities():
    """Returns a simple list of entities with their computed risk categories."""
    try:
        G, entities, _ = get_graph_and_data()
        entities_map = {ent["id"]: ent for ent in entities}
        
        results = []
        for ent in entities:
            intel = compute_entity_intelligence(G, ent["id"], entities_map)
            results.append({
                "id": ent["id"],
                "name": ent["name"],
                "type": ent["type"],
                "jurisdiction": ent["jurisdiction"],
                "risk_level": intel["risk_level"],
                "risk_score": intel["risk_score"],
                "chain_depth": intel["chain_depth"],
                "sanctions_match": ent.get("sanctions_match", False)
            })
        return results
    except Exception as e:
        logger.error(f"Error getting entities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ownership-graph")
def get_ownership_graph():
    """Returns nodes and edges prepared for frontend graph libraries."""
    try:
        G, entities, relationships = get_graph_and_data()
        entities_map = {ent["id"]: ent for ent in entities}
        
        # Calculate full intelligence for each entity to attach to nodes
        nodes = []
        for ent in entities:
            intel = compute_entity_intelligence(G, ent["id"], entities_map)
            nodes.append({
                "id": ent["id"],
                "name": ent["name"],
                "type": ent["type"],
                "jurisdiction": ent["jurisdiction"],
                "risk_level": intel["risk_level"],
                "risk_score": intel["risk_score"],
                "chain_depth": intel["chain_depth"],
                "circular_ownership": intel["circular_ownership"],
                "sanctions_match": ent.get("sanctions_match", False),
                "insights": intel["insights"]
            })
            
        # Return format friendly for React Flow / Vis
        return {
            "nodes": nodes,
            "edges": relationships
        }
    except Exception as e:
        logger.error(f"Error generating ownership graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk-score/{entity_id}")
def get_risk_score(entity_id: str):
    """Deep analysis of risk profile for a single entity."""
    try:
        G, entities, _ = get_graph_and_data()
        entities_map = {ent["id"]: ent for ent in entities}
        
        if entity_id not in entities_map:
            raise HTTPException(status_code=404, detail="Entity not found")
            
        return compute_entity_intelligence(G, entity_id, entities_map)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing risk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jurisdictions")
def get_jurisdictions():
    """Returns unique jurisdictions found in dataset, indexed by their transparency risk metadata."""
    try:
        _, entities, _ = get_graph_and_data()
        df = pd.DataFrame(entities)
        
        if df.empty:
            return []
            
        # Group by jurisdiction
        jurisdictions = df["jurisdiction"].unique()
        
        metadata = {
            "Cayman Islands": {"risk_category": "High", "transparency_score": 28, "details": "FATF grey-listed jurisdiction history, strict bank secrecy."},
            "Panama": {"risk_category": "High", "transparency_score": 20, "details": "High shell-company density, low corporate registrar transparency."},
            "Bahamas": {"risk_category": "High", "transparency_score": 35, "details": "Offshore wealth hub, limited corporate filings public access."},
            "Russian Federation": {"risk_category": "Critical", "transparency_score": 15, "details": "Under comprehensive international OFAC sanctions and restrictions."},
            "Cyprus": {"risk_category": "Medium", "transparency_score": 60, "details": "EU member, popular holding intermediary, moderate regulatory disclosure."},
            "Isle of Man": {"risk_category": "Medium", "transparency_score": 55, "details": "Crown dependency with moderate register visibility."},
            "United Kingdom": {"risk_category": "Low", "transparency_score": 85, "details": "Companies House open register, public beneficial ownership database (PSC)."},
            "United States": {"risk_category": "Low", "transparency_score": 90, "details": "Corporate Transparency Act active (FinCEN BOI filing)."},
            "Switzerland": {"risk_category": "Medium", "transparency_score": 50, "details": "Historically low transparency, now adopting automatic tax exchange."}
        }
        
        results = []
        for jur in jurisdictions:
            meta = metadata.get(jur, {"risk_category": "Medium", "transparency_score": 50, "details": "Standard sovereign transparency registry."})
            results.append({
                "country": jur,
                "transparency_rating": meta["transparency_score"],
                "risk_category": meta["risk_category"],
                "details": meta["details"]
            })
            
        return results
    except Exception as e:
        logger.error(f"Error compiling jurisdictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analyst-notes")
def get_analyst_notes():
    """Retrieve all saved analyst investigation logs."""
    if not os.path.exists(NOTES_FILE):
        return []
    try:
        with open(NOTES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading notes: {e}")
        return []

@app.post("/api/analyst-notes")
def add_analyst_note(note: AnalystNote):
    """Saves or updates an investigation log."""
    notes = []
    if os.path.exists(NOTES_FILE):
        try:
            with open(NOTES_FILE, "r", encoding="utf-8") as f:
                notes = json.load(f)
        except Exception:
            notes = []
            
    # Update note if exists, or append
    updated = False
    for n in notes:
        if n["entity_id"] == note.entity_id:
            n["note"] = note.note
            n["status"] = note.status
            n["analyst"] = note.analyst
            updated = True
            break
            
    if not updated:
        notes.append(note.dict())
        
    try:
        with open(NOTES_FILE, "w", encoding="utf-8") as f:
            json.dump(notes, f, indent=2, ensure_ascii=False)
        return {"status": "success", "note": note}
    except Exception as e:
        logger.error(f"Error saving note: {e}")
        raise HTTPException(status_code=500, detail="Could not save note to file system.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
