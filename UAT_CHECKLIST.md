# User Acceptance Testing (UAT) Checklist - Beneficial Ownership Red-Flag Finder

Follow these instructions to verify all user flows, visual elements, and compliance analytics.

## 🛠️ Step 1: System Boot Verification
- [ ] Ensure the backend server is running at `http://localhost:8000`. You can test this by browsing to `http://localhost:8000/`. You should see `{"status":"online", "service":"Beneficial Ownership Red-Flag Finder API", ...}`.
- [ ] Ensure the Next.js dev server is running at `http://localhost:3000`.
- [ ] Open a browser and navigate to `http://localhost:3000`. Verify that the dashboard load animation completes and the directed graph is rendered.
- [ ] Verify that the header shows **"ENGINE ONLINE"** (or **"MOCK FALLBACK ACTIVE"** if backend is starting up) in the top right.

## 🔄 Step 2: Interactive Handshake Verification
- [ ] Click on **"Alpha Holdings Ltd"** in the directed graph.
- [ ] **Verification**: Check the right-hand **Section A: Investigation Panel**. It must instantly print:
  - **Entity Name**: Alpha Holdings Ltd
  - **Risk Score**: 70/100 (High)
  - **Chain Depth**: 3 levels
  - **Computed Intelligence**: Must show high offshore tax-haven reviews.
- [ ] **Path Highlights**: Verify that the path `Vladimir Roskov -> Giga Trust -> Beta Shell Corp -> Alpha Holdings` is highlighted in sky-blue on the graph canvas.

## 🟢 Step 3: Circular Loop Detection Verification
- [ ] Click on **"Nexus Trade Ltd"** in the directed graph.
- [ ] **Verification**: The investigation panel must print:
  - **Risk Score**: 90/100 (Critical)
  - **Computed Intelligence**: Must warn that a circular ownership path is detected: `Nexus Trade Ltd -> Vortex Holdings -> Orbit Logistics`.
- [ ] Check if the node border in the graph has a red pulsing glow.

## 🛡️ Step 4: Sanctions Warning Verification
- [ ] Locate **"Vladimir Roskov"** on the graph.
- [ ] **Verification**: Check if the card has a red exclamation mark and a blinking critical outline.
- [ ] Click the card. Verify that the Risk Score is `95/100 (Critical)` and the computed insight states: *"Immediate sanctions screening escalation required due to direct/indirect OFAC match."*

## 📝 Step 5: Analyst Notes Module Verification
- [ ] Select any node (e.g., **"Beta Shell Corp"**).
- [ ] In the **Analyst Investigation Notes** box in the sidebar, type: *"Proxy directors identified. Panama registry documents missing. Escalating to compliance director."*
- [ ] Choose status: **"Escalated"** (with the red circle icon).
- [ ] Click **"Save Note"**.
- [ ] **Verification**: Look for the confirmation message *"Note committed successfully."*. Select another node, then click **"Beta Shell Corp"** again. Verify that your typed note and selected status are restored.

## 🎛️ Step 6: Live Filter Panel Verification
- [ ] In the **Section D: Risk Filters** panel on the sidebar, change **Jurisdiction** to **"Cyprus"**.
- [ ] **Verification**: Check the graph canvas. It must update instantly to only show Cyprus nodes (Vortex Holdings and Orbit Logistics) and their connections.
- [ ] Change the filter back to **"ALL JURISDICTIONS"**.
- [ ] Check the **Sanctions Exposure Only** checkbox. Verify that only the blocked individual card (Vladimir Roskov) is highlighted/filtered.

## 📥 Step 7: Sample Export Verification
- [ ] Click the green button **"DOWNLOAD SAMPLE PAYLOAD"** in Section E of the sidebar.
- [ ] **Verification**: A file named `beneficial_ownership_risk_payload.json` must download. Open this file and verify it contains structured compliance metadata, node lists, and relationship lists.
