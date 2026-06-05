# Validation and Review (VAR) Checklist - Beneficial Ownership Red-Flag Finder

This checklist documents the verification of implementation requirements, styling parameters, API schemas, and security guardrails.

## 🎨 Visual DNA and Layout Alignment
- [x] **Background Color**: The page-wide CSS setting has background `#030712` enforced in `globals.css` and `layout.tsx`.
- [x] **Surface Color**: High-end Fintech cards render with `#0B1117` background styling.
- [x] **Accent Primary Color**: Active components utilize `#38BDF8` with a subtle glow shadow.
- [x] **Accent Secondary Color**: Contextual headers and secondary links employ `#818CF8`.
- [x] **Border Color**: Borders conform to `#1F2937` to create sleek partitions.
- [x] **Layout Splits**: Exact 70% width for the main visualization canvas stage and 30% width for the compliance panel.
- [x] **Glassmorphism Styling**: Enforced using CSS backdrop filter blur effects on surfaces.

## 🧠 Backend and API Integration
- [x] **FastAPI Framework**: Full Python FastAPI server implemented in `backend/main.py` running on port `8000`.
- [x] **CORS Middleware**: Activated to allow the Next.js client (`localhost:3000`) to query the backend endpoints.
- [x] **Data Ingestion Fallback**: The server uses `data_adapter.py` to seamlessly fallback to `mock_data.json` if live credentials are not provided or if external connections fail.
- [x] **NetworkX Analytics**: Builds a directed graph to calculate:
  - Chain Depth: Maximum simple path lengths from source controllers.
  - Circular Loops: Strongly connected cycle detection (`nx.simple_cycles`).
  - UBO Tracking: Ancestor nodes with in-degree of 0 in the subgraph.
- [x] **Pydantic Validation**: Strong schemas for analyst notes POST requests.

## 🔄 Interactive Handshake & State Management
- [x] **Immediate Graph -> Sidebar Sync**: Clicking on a node in `GraphView.tsx` triggers the selection hook, updating the sidebar component details immediately without reload.
- [x] **Path Highlight**: Selecting a node visually lights up the directed lines leading from that node to all its Ultimate Beneficial Owners (UBOs) in sky-blue.
- [x] **Live Filtering**: Modifying the filters (Risk Profile, Jurisdiction, Entity Type, Sanctions) immediately updates the graph nodes and edges.
- [x] **Exporter**: The download payload button bundles nodes and edges as JSON and triggers a local file download.

## 🛡️ Security & Environment Guardrails
- [x] **Keys Protection**: External corporate search API keys are managed via the `.env` file; no raw credentials are hardcoded.
- [x] **Data Privacy**: Local persistence of analyst notes is saved within the workspace folder in `analyst_notes.json`.
