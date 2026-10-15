# n8n Pro Cloud 4-Workflow Engine Setup

The HaggleOS Voice Negotiation Engine is architected into four decoupled workflows to isolate latency (<280ms for mid-call BATNA) and ensure zero dropped voice streams:

| Workflow | File | Ingress Endpoint | Function |
|---|---|---|---|
| **WF-1** | `workflow-1-market-research-vendor-discovery.json` | `POST /api/v1/campaign-start` | Tavily price benchmark + Google Places vendor search + MongoDB seed |
| **WF-2** | `workflow-2-parallel-voice-dispatcher.json` | Execute Workflow Trigger | Batched SIP dispatch (max 5 lines) with injected prompt |
| **WF-3** | `workflow-3-realtime-batna-broker.json` | `POST /api/v1/live-leverage` | Sub-280ms mid-call BATNA price lookup and tactical leverage counter-anchor |
| **WF-4** | `workflow-4-evidence-verifier-judge-whatsapp.json` | `POST /api/v1/call-complete` | AI Evidence Verifier + Audio grounding + 5-dimension scoring + WhatsApp delivery |

## How to Import into n8n:
1. Open your n8n instance (e.g. `https://your-n8n.cloud`).
2. Go to **Workflows** -> **Import from File**.
3. Select each of the 4 `.json` files in this directory.
4. Configure Credentials:
   - **MongoDB Atlas**: Set your connection string `mongodb+srv://...`
   - **Tavily API**: Add Tavily API Key
   - **Google Places API**: Add Google Cloud API Key with Places API enabled
   - **Vapi.ai**: Set Authorization Header with Vapi Private API Key
   - **Meta WhatsApp Cloud**: Set Bearer token and Phone Number ID
5. Activate all 4 workflows.
