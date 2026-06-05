# POC-59 · Beneficial Ownership Red-Flag Finder · Real Rails Intelligence Library · Governance & Trust Rail

A production-style full-stack Governance & Trust intelligence dashboard that helps analysts, allocators, compliance teams, and investigators identify beneficial ownership risks, sanctions exposure, hidden ownership chains, and jurisdictional red flags.

## 📸 Preview
Live dark dashboard showing real-time global corporate ownership structures with NetworkX-calculated chain depths, circular loop alerts, and OFAC sanctions exposure.

## ✨ Features
| Feature | Description |
| :--- | :--- |
| 🌐 Directed Graph Canvas | Interactive SVG force-directed corporate network visualising ownership paths |
| 📊 Compliance Panel | Entity Deep Dive showing Risk Scores, Ultimate Beneficial Owners (UBOs), and chain depth stats |
| 🧠 Intelligence Translation | Auto-translation of raw data points to audit-ready risk narratives (e.g. offshore tax-haven reviews) |
| 🔄 Reactive State Sync | Immediate handshake synchronization (selecting a node in the graph instantly updates the sidebar details) |
| 🟡 Cycle Detection | NetworkX cycles algorithm checking for circular ownership paths used to hide assets |
| 🚨 Sanctions Alerts | Visible OFAC screening match banners and blinking critical badges |
| 🎛️ Live Filters | Dynamic filtering of graph assets by Risk Profile, Jurisdiction, and Entity Type |
| 📥 Rapid Export | Single-click JSON download for active intelligence payloads |

## 🛠️ Tech Stack
**Frontend**
* Next.js 16 (App Router) — React framework
* TypeScript — Type-safe dashboard architecture
* Tailwind CSS v4 — High-end dark Fintech Terminal layout
* D3.js — Graph layout simulation engine
* Lucide React — Interface iconography

**Backend**
* Python FastAPI — High-performance REST API
* Pandas — Sovereign metadata classification
* NetworkX — Directed graph traversals and cycle calculations
* Uvicorn — ASGI server
* Python-Dotenv — Environmental credentials isolation

## 📂 Project Structure
```
POC 59 — Beneficial Ownership Red-Flag Finder/
├── backend/
│   ├── main.py              # FastAPI app with NetworkX analytical routes
│   ├── data_adapter.py      # Live endpoint routing with automatic mock fallback
│   ├── mock_data.json       # Resilient synthetic multi-tiered corporate registers
│   ├── requirements.txt     # Python backend dependencies
│   └── .env                 # API keys template
├── frontend/
│   ├── package.json         # Node packages & run script commands
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Main Split-stage layout & live summaries
│   │   │   ├── layout.tsx   # Global metadata & font settings
│   │   │   └── globals.css  # Fintech terminal glassmorphic style variables
│   │   └── components/
│   │       ├── GraphView.tsx          # SVG D3 Interactive Node Graph
│   │       └── IntelligenceSidebar.tsx # Section A-E Investigation Console
│   └── tsconfig.json        # TypeScript definitions
├── README.md                # System documentation
├── VAR_CHECKLIST.md         # Verification And Review Checklist
└── UAT_CHECKLIST.md         # User Acceptance Testing Checklist
```

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* Python 3.9+
* npm

### 1. Set up and Start the Backend
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
Backend runs on: `http://localhost:8000`

### 2. Set up and Start the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:3000`

## 🔌 API Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | GET | API engine health check |
| `/api/entities` | GET | List of all checkable entities and their simple risk ratings |
| `/api/ownership-graph` | GET | Full nodes and edges payload enriched with NetworkX depth calculations |
| `/api/risk-score/{id}` | GET | Indepth risk diagnostics and computed text narratives for a single node |
| `/api/jurisdictions` | GET | Grouped list of registry countries with their transparency scores |
| `/api/analyst-notes` | GET | Retrieve saved investigation logs |
| `/api/analyst-notes` | POST | Commit or update compliance notes for a specific node |

## 📊 Data Sources
| Source | Status | Description |
| :--- | :--- | :--- |
| **OpenCorporates** | API / Mock Fallback | External corporate registers query |
| **SEC EDGAR** | Form 3/4/5 / Mock Fallback | Beneficial ownership disclosures check |
| **OFAC** | SDN Registry / Mock Fallback | Terrorist/Sanctioned asset screening |
| **mock_data.json** | Active Fallback | Resilient corporate registry mock mapping |

## 🎨 Dashboard Panels

### Why This Matters
Strong allocator and compliance audience appeal. Explains:
* **Hidden ownership risks**: Intermediaries shielding ultimate controllers.
* **Regulatory exposure**: Severe fines for dealing with blocked individuals.
* **Counterparty transparency**: Demands for corporate registry tracking verification.

### Who Controls the Rail
This rail is ultimately controlled by global regulatory bodies such as FinCEN, FATF, OFAC, the SEC, state corporate registries, and the compliance departments of financial institutions enforcing ownership transparency requirements.

## 👩‍💻 Built By
JENEKA AD - Beneficial Ownership Red-Flag Finder POC #59
