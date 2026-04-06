# Lab 3: APIM + MCP Integration
**Duration:** 90 minutes | **Session:** 3 of 3 | **Presenter:** JT

---

## Objectives
By the end of this lab, participants will have:
- A Docker-based TVA backend simulator running
- Azure APIM configured in front of it
- Copilot Studio agent calling the backend securely via APIM
- An MCP server loaded with TVA public docs
- Understanding of OBO token flow for production-grade auth
- Know when to use MCP vs agent flows vs sub-agent models

---

## Prerequisites
- Labs 1 and 2 complete
- Docker Desktop installed and running
- Azure CLI installed (`az --version`)
- Your agent from Lab 2 open in Copilot Studio

---

## Part 1: Deploy the TVA Backend Simulator (20 min)

We use Docker to simulate a TVA document management backend — no real systems needed.

### Step 1: Pull the Workshop Image
```bash
cd ~/tva-workshop/boilerplate
docker compose up -d
```

The `docker-compose.yml` starts two services:
- `tva-backend` on port 3001 — simulates TVA document API
- `tva-mcp` on port 3002 — MCP server with TVA public docs

### Step 2: Verify It's Running
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"TVA Document Backend Simulator"}

curl http://localhost:3001/api/documents
# Expected: JSON array of TVA document metadata
```

### Step 3: Test a Document Query
```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: workshop-demo-key-2026" \
  -d '{"query": "NERC CIP-007 patch requirements", "top": 3}'
```

> ⚠️ **Vignette: Docker not starting**
> If `docker compose up` fails with "port already in use", run `docker ps` to find the conflict. Change the port mapping in `docker-compose.yml` from `"3001:3001"` to `"3011:3001"` and update your APIM backend URL accordingly.

---

## Part 2: Configure Azure APIM (25 min)

APIM sits between Copilot Studio and your backend — handling auth, rate limiting, and routing.

### Step 1: Create APIM Instance (Pre-provisioned)
The workshop hub has a shared APIM instance: `tva-workshop-apim.azure-api.net`

Navigate to it in Azure Portal → **API Management services** → `tva-workshop-apim`

### Step 2: Import Your API
1. Click **APIs** → **+ Add API** → **HTTP**
2. Configure:
   - **Display name:** `TVA Document Backend`
   - **Web service URL:** `http://host.docker.internal:3001` (points to your local Docker)
   - **API URL suffix:** `tva-[yourname]`
3. Click **Create**

### Step 3: Add API Key Policy
In your API → **All operations** → **Inbound processing** → click `</>`:

```xml
<policies>
  <inbound>
    <base />
    <check-header name="X-Api-Key" failed-check-httpcode="401" 
                  failed-check-error-message="Invalid API key" 
                  ignore-case="true">
      <value>workshop-demo-key-2026</value>
    </check-header>
    <set-header name="X-TVA-RequestId" exists-action="override">
      <value>@(Guid.NewGuid().ToString())</value>
    </set-header>
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
</policies>
```

### Step 4: Add the Query Operation
1. Click **+ Add operation**
2. **Name:** Query Documents
3. **Method:** POST
4. **URL:** `/api/query`
5. Save

### Step 5: Test via APIM
```bash
curl -X POST "https://tva-workshop-apim.azure-api.net/tva-[yourname]/api/query" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: workshop-demo-key-2026" \
  -d '{"query": "nuclear plant safety procedures", "top": 3}'
```

> ⚠️ **Vignette: CORS errors when calling from Copilot Studio**
> Add this to your APIM inbound policy:
> ```xml
> <cors>
>   <allowed-origins><origin>https://copilotstudio.microsoft.com</origin></allowed-origins>
>   <allowed-methods><method>POST</method><method>GET</method></allowed-methods>
>   <allowed-headers><header>*</header></allowed-headers>
> </cors>
> ```

---

## Part 3: Connect Agent to APIM (10 min)

### Update Your Lab 2 Topic
1. Open Copilot Studio → your TVA Document Processor agent
2. Open the **Document Search** topic
3. Update the HTTP action URL from the direct Azure OpenAI endpoint to your APIM URL:
   - **Before:** `https://YOUR_PROJECT_ENDPOINT/...`
   - **After:** `https://tva-workshop-apim.azure-api.net/tva-[yourname]/api/query`
4. Update headers — replace `api-key` with `X-Api-Key: workshop-demo-key-2026`

Test in the agent panel — should now route through APIM.

---

## Part 4: MCP Server with TVA Docs (15 min)

MCP (Model Context Protocol) lets your agent call structured tools instead of free-form HTTP.

### What's Pre-loaded in the Workshop MCP Server
The `tva-mcp` container (port 3002) exposes these tools:
- `search_tva_docs` — semantic search across TVA public documents
- `get_nerc_requirement` — look up specific NERC CIP standard requirements
- `check_compliance_status` — returns mock compliance posture for a given CIP standard
- `list_regulations` — lists all TVA-relevant regulatory frameworks

### Connect MCP to Copilot Studio
1. In your agent, go to **Actions** → **+ Add action** → **Model Context Protocol**
2. **MCP Server URL:** `http://localhost:3002/mcp`
3. Click **Discover tools** — you should see all 4 tools listed
4. Enable all 4 → Click **Save**

Now your agent can call these tools automatically when a user asks a relevant question.

### Test MCP Tools
In the Test panel:
- "What does NERC CIP-011 require?" → should call `get_nerc_requirement`
- "Search for TVA nuclear safety documents" → should call `search_tva_docs`

---

## Part 5: When to Use What — Decision Tree (10 min)

```
User needs info from a document/knowledge base?
  └── YES → Use Knowledge Source (Azure AI Search connected to Foundry)
  
User needs to trigger an action or workflow?
  └── YES → Is the action a well-defined tool with a schema?
        ├── YES → Use MCP (cleaner, model picks the right tool)
        └── NO → Use Agent Flow / HTTP Action (more control)

Multiple specialized agents needed?
  └── YES → Use Sub-agent model (orchestrator + specialist agents)
  └── NO → Keep it in one agent with topics

Needs to work across Teams, web, mobile, API?
  └── YES → Use Agent SDK (consistent identity across channels)
```

**Rule of thumb for TVA:**
- **Read-only compliance queries** → Knowledge source
- **Structured lookups** (get NERC requirement by ID) → MCP
- **Multi-step workflows** (submit variance request, escalate finding) → Agent flow
- **Cross-system orchestration** → Sub-agent model

---

## Part 6: OBO Token Flow (10 min)

For production TVA deployment, the agent must pass the user's identity to backend systems — not a service account.

### Why OBO Matters for TVA
- **Audit trail:** NERC CIP requires logging who accessed compliance data
- **Role-based access:** Nuclear plant data vs. grid data have different clearance levels
- **User context:** Responses can be personalized to the user's division

### The Flow
```
User → Copilot Studio → [user token] → APIM → [OBO exchange] → Backend API
                                          ↑
                                    Token validation
                                    + user context added
```

### APIM Policy for OBO
```xml
<inbound>
  <base />
  <validate-jwt header-name="Authorization" failed-validation-httpcode="401">
    <openid-config url="https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0/.well-known/openid-configuration" />
    <audiences><audience>api://tva-doc-processor</audience></audiences>
  </validate-jwt>
  <set-header name="X-TVA-UserId" exists-action="override">
    <value>@(context.Request.Headers.GetValueOrDefault("Authorization","").Split(' ').Last().Split('.')[1])</value>
  </set-header>
</inbound>
```

See `boilerplate/obo-token-flow.py` for the full Python implementation.

> ⚠️ **Vignette: Token expiry mid-conversation**
> Azure AD tokens expire after 1 hour. For long workshop sessions, users may get auth errors mid-lab. Fix: in Copilot Studio settings, enable **Token refresh** under Authentication. In production, implement refresh token handling in your backend.

---

## Lab 3 Checkpoint ✅

- [ ] Docker backend running (`curl localhost:3001/health` returns OK)
- [ ] APIM configured with your API and policy
- [ ] Agent routes through APIM successfully
- [ ] MCP tools discovered and enabled
- [ ] MCP tool called automatically in at least one test conversation
- [ ] OBO flow explained and APIM policy reviewed

---

## End-to-End Demo Script

Run this conversation to show the full stack working:

1. **User:** "What are TVA's patch management requirements under NERC CIP-007?"
   - *Should: call MCP `get_nerc_requirement`, return structured answer*

2. **User:** *(uploads `tva-compliance-report-q1.pdf`)* "Review this for compliance gaps"
   - *Should: process file, call Azure AI Foundry, return gap analysis*

3. **User:** "Search for any documents about Browns Ferry nuclear plant procedures"
   - *Should: call APIM backend, return document list with metadata*

4. **User:** "Summarize the top 3 risks"
   - *Should: use conversation context, return prioritized risk summary*

---

## Executive Takeaway
This is the pattern every government AI deployment should follow: the user talks to Copilot in plain English, Copilot routes to the right system through a secure API gateway, and every request is logged with the user's identity. TVA's compliance team gets AI capability without compromising the audit controls NERC CIP requires.
