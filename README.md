# THE NEGOTIATOR (HaggleOS)
### Autonomous Voice AI Procurement, Market Research & Live Negotiation Platform
*Engineered according to Technical Blueprint v2.4*

---

## 1. System Vision & Architecture

The Negotiator is an end-to-end autonomous Voice AI system that procures products by negotiating directly with human vendor representatives over parallel phone lines.

```
+----------------------------------------------------------------------------------------------------+
|                                    1. INGEST (.xyz Web / WA)                                      |
|            Product + Technical Specs JSON | Budget Target & Walk-Away Ceiling | Phone Intake        |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
|                                    2. n8n PRO CLOUD BRAIN                                         |
|   WF-1: Web & Maps Research   |  WF-2: Parallel Dispatch  |  WF-3: BATNA Broker  |  WF-4: LLM Judge   |
+----------------------------------------------------------------------------------------------------+
                   │                                                  ▲
                   ▼                                                  │
+------------------------------------+             +-------------------------------------------------+
|     3. VOICE AI EDGE (VAPI)        |             |              4. STORAGE & DELIVERY              |
|  • 5-10x Parallel SIP Lines        |  < 280ms    |  • MongoDB Atlas: campaigns & vendor_calls       |
|  • DTMF IVR Keypad Navigation      |────────────>|  • Compound Indexes: { campaign_id, price }     |
|  • Mid-Call BATNA Leverage Tool    |  Leverage   |  • Meta WhatsApp Cloud: Verified Evidence Card  |
|  • Word-Level Diarized Audio Dump  |             |  • Live Deal Room Portal: /c/[campaign_id]      |
+------------------------------------+             +-------------------------------------------------+
```

---

## 2. Key Operational Metrics

| Metric | Target Specification | Implementation |
|---|---|---|
| **Voice Turn Latency** | `< 550 ms` | ElevenLabs Turbo v2.5 / Cartesia + Deepgram Nova-2 |
| **Concurrent Calls** | `5–10 Lines` | Batched async SIP trunk dispatches via Vapi / Retell |
| **Mid-Call BATNA Lookup** | `< 280 ms` | In-memory reactive cache + MongoDB compound index on `{ campaign_id: 1, "pricing.final_negotiated_price": 1 }` |
| **Evidence Standard** | `Audio + JSON` | Diarized verbatim transcript with audio seek grounding to exact second |

---

## 3. Directory Structure

```
c:\Users\ALLEN\OneDrive\negotiator\
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── .env.example
├── .env.local
├── README.md
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Landing & Intake page (Voice/Text, Chip-list, Budget sliders)
│   │   ├── layout.tsx                   # Dark theme app layout
│   │   ├── globals.css                  # Custom styling
│   │   ├── c/[campaign_id]/page.tsx     # Live Deal Room UI (3 Panels)
│   │   └── api/
│   │       ├── campaigns/route.ts       # POST: Validate input, seed MongoDB, trigger WF-1
│   │       ├── stream/[id]/route.ts     # GET: SSE real-time state change stream
│   │       ├── v1/live-leverage/        # POST: Sub-280ms Mid-Call BATNA Broker
│   │       ├── v1/call-complete/        # POST: End-of-call audit, LLM Judge & WhatsApp dispatch
│   │       ├── v1/simulate-call/        # POST: Parallel multi-line call negotiation simulator
│   │       └── mock-audio/[file]/       # GET: Synthetic audio server for <AudioProofPlayer />
│   ├── components/
│   │   ├── AudioProofPlayer.tsx         # HTML5 audio player with seek-to-quote (-3s) & synced transcript
│   │   ├── MarketResearchBar.tsx        # Price distribution continuum (Online Low, Target, Ceiling, Quotes)
│   │   ├── VendorCallMatrix.tsx         # Parallel call matrix with live state machine badges
│   │   ├── WinnerScorecard.tsx          # Audited winner hero banner, scoring rubric, and WhatsApp preview
│   │   ├── IntakeForm.tsx               # Voice/Text intake with dynamic spec chips & dual budget sliders
│   │   ├── DealRoom.tsx                 # Reactive 3-panel container with SSE stream integration
│   │   └── SimulationController.tsx     # Interactive test harness to trigger parallel phone calls
│   └── lib/
│       ├── db.ts                        # Mongoose connection with resilient offline fallback
│       ├── store.ts                     # Universal reactive datastore and fast BATNA lookup
│       ├── scoring.ts                   # 5-Dimension weighted scoring rubric & audio grounding
│       ├── prompt.ts                    # Dynamic Section 8 system prompt generator & tool schemas
│       ├── vapi-client.ts               # Vapi telephony client
│       ├── whatsapp.ts                  # Meta WhatsApp Business Cloud message formatter
│       ├── events.ts                    # EventEmitter bus for Server-Sent Events
│       └── models/
│           ├── Campaign.ts              # Mongoose schema for master campaigns
│           └── VendorCall.ts            # Mongoose schema for vendor call evidence & compound indexes
├── n8n/
│   ├── README.md                        # Import and configuration guide for n8n Pro Cloud
│   ├── workflow-1-market-research-vendor-discovery.json
│   ├── workflow-2-parallel-voice-dispatcher.json
│   ├── workflow-3-realtime-batna-broker.json
│   └── workflow-4-evidence-verifier-judge-whatsapp.json
├── voice-agent/
│   ├── vapi-assistant-config.json       # Ready-to-import Vapi Assistant definition
│   ├── tools-spec.json                  # get_competitor_leverage and send_vendor_whatsapp tool JSON schemas
│   └── system-prompt.md                 # Production system prompt & 4-phase negotiation state machine
└── scripts/
    ├── seed-demo.ts                     # Seeds demo campaign CMP-2026-8841 (Commercial Espresso Machine)
    └── test-scoring.ts                  # Unit test suite verifying scoring rubric & audio grounding
```

---

## 4. 5-Dimension Weighted Scoring Rubric (Section 6)

| Evaluation Dimension | Weight | Verification Rule | Disqualification / Penalty Condition |
|---|---|---|---|
| **Net All-In Price** | **45%** | `(Max_Budget - Final_Price) / (Max_Budget - Target_Budget)` | Disqualified if final price exceeds `budget_max` by `>5%` |
| **Spec Compliance** | **25%** | Affirmative confirmation in transcript for each mandatory spec | Immediate disqualification (`score = 0`) if spec is refused/evaded |
| **Evidence Quality** | **15%** | Verbatim read-back of price, inclusions, rep name before hangup | `-30 points` if price is vague without hard confirmation |
| **Vendor Trust & Rating** | **10%** | Google Places rating & review count | `-20 points` if rating `< 3.8` or `< 10` reviews |
| **Fulfillment & Terms** | **5%** | Lead time, stock readiness, payment flexibility | `-15 points` if vendor demands 100% upfront wire |

### Anti-Hallucination & Audio Grounding Protocol
The Judge Agent never trusts a summary alone. It matches the extracted `final_negotiated_price` against word-level diarized transcript lines and extracts `start_time`, seeking the audio player directly to **`timestamp - 3s`** so users hear the verbatim verbal commitment on tape!

---

## 5. Getting Started

### Prerequisites
- Node.js LTS (v24.x or v20.x)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Scoring Unit Tests
```bash
npx tsx scripts/test-scoring.ts
```
Expected output: `11 Passed, 0 Failed` validating all scoring dimensions, edge cases, and audio grounding.

### 3. Run the Application Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Intake Form**: `/` (with quick-fill demo button or voice dictation)
- **Live Deal Room Demo**: `/c/CMP-2026-8841`

---

## 6. Testing the Live Parallel Negotiation Demo

1. Navigate to `/c/CMP-2026-8841`.
2. Notice the **3 Panels**:
   - **Market Research Continuum**: Visual distribution comparing Online Low (₹1,98,000), Anchor (₹1,75,000), Target (₹1,85,000), Walk-Away Ceiling (₹2,15,000), and vendor price points.
   - **Live Vendor Call Matrix**: 5 parallel lines with real-time status badges (`QUOTE_VERIFIED`, `LINE_BUSY`, `SPEC_MISMATCH`, `REJECTED`).
   - **Winner Scorecard & Audio Proof Locker**: BeanCraft Equipment Pvt Ltd winning at ₹1,89,000 (14.09% discount).
3. Click **"Play Verified Quote (01:51)"** on the Audio Proof Locker:
   - The HTML5 audio player jumps directly to 3 seconds before the price commitment (`111s`).
   - The synchronized diarized transcript highlights the exact line: *&ldquo;If you confirm today, we will do 1,89,000 all-inclusive with 2-year warranty.&rdquo;*
4. Click **"Dispatch Parallel Calls (5 Lines)"** to run an automated multi-line negotiation cycle through Server-Sent Events (SSE).
