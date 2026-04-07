# TVA Workshop — Microsoft Copilot Studio + Azure AI

> **8-hour hands-on workshop** | April 15, 2026 | TVA HQ, Knoxville TN
>
> Build a production-ready, Entra ID–secured AI agent connected to TVA's knowledge base — live in Azure by end of day.

---

## What You'll Build

The **TVA Document Processor** — a Copilot Studio agent that:
- Answers questions about TVA regulatory documents and NERC CIP compliance
- Processes uploaded compliance reports via Azure AI Foundry RAG
- Routes securely through Azure APIM with full user identity (OBO)
- Runs on Azure Container Apps — production-grade, auto-scaling, shareable URL

```
You → Copilot Studio → APIM (JWT validated) → Container Apps (MCP Server) → Azure AI Foundry → TVA Knowledge Base
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/johnturek/TVA-Demo
cd TVA-Demo

# 2. Install dependencies
npm install

# 3. See all available tasks
npx just --list

# 4. Start the local workshop stack
npx just setup
```

---

## Task Runner (`just`)

This repo uses [`just-task`](https://github.com/microsoft/just) — Microsoft's task library for JS projects.

| Command | What it does |
|---------|-------------|
| `npx just --list` | List all available tasks |
| `npx just install` | Install Python + AI Search dependencies |
| `npx just dev` | Start MCP server locally (Python/FastMCP) |
| `npx just dev:docker` | Run MCP server in Docker locally |
| `npx just dev:stop` | Stop Docker containers |
| `npx just upload-docs` | Upload TVA docs to Azure AI Search index |
| `npx just test:local` | Health check local MCP server |
| `npx just test:prod` | Full endpoint test suite (device-code auth + 8 tests) |
| `npx just provision` | Deploy full Azure stack (silent mode) |
| `npx just provision:teach` | Deploy full Azure stack **(walkthrough mode — use in workshop)** |
| `npx just add-user` | Add a user to the MCP.User app role (`USER_EMAIL=...`) |
| `npx just sync` | Pull latest updates from Aaron's mcp-backend submodule |
| `npx just setup` | Install deps + upload docs |
| `npx just workshop:start` | Full Lab 1+2 setup |
| `npx just workshop:ship` | End-of-day: provision Azure (walkthrough) + verify production |
| `npx just clean` | Stop containers, remove volumes |

> **Workshop tip:** Use `npx just provision:teach` for Lab 3 — it pauses at each step with explanations so participants understand what's being deployed.

---

## Prerequisites

Install these before the workshop:

| Tool | Install | Version |
|------|---------|---------|
| Node.js | https://nodejs.org | 18+ |
| Python | https://python.org | 3.9+ |
| Docker Desktop | https://docker.com/products/docker-desktop | Latest |
| Azure CLI | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli | Latest |
| VS Code | https://code.visualstudio.com | Latest |
| VS Code REST Client | Extensions → `humao.rest-client` | Latest |

```bash
# Verify prereqs
node --version
python3 --version
docker --version
az --version
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values (distributed at workshop check-in):

```bash
cp .env.example .env
```

```env
# Microsoft Foundry / Azure AI Projects (Lab 1)
AZURE_AI_PROJECT_ENDPOINT=https://tva-workshop.services.ai.azure.com/api/projects/tva-doc-processor-[yourname]
AZURE_AGENT_ID=
AZURE_OPENAI_ENDPOINT=https://tva-workshop.openai.azure.com/
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Foundry Agent Endpoint (Lab 2 — same values as above)
FOUNDRY_AGENT_ENDPOINT=https://tva-workshop.services.ai.azure.com/api/projects/tva-doc-processor-[yourname]
FOUNDRY_AGENT_KEY=

# Azure Identity (filled by provision-azure.sh)
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=

# Production (filled after running: npx just provision)
MCP_ENDPOINT=
APIM_GATEWAY=
JWT_AUDIENCE=
JWT_ISSUER=
```

---

## Repo Structure

```
TVA-Demo/
├── just.config.js          # Task runner — all workshop commands
├── package.json
├── .env.example
├── .gitmodules             # Submodule: Aaron's mcp-backend
│
├── boilerplate/
│   ├── mcp-backend/            # ⭐ Git submodule — Aaron's production MCP server
│   │   ├── mcp_server.py           # Python/FastMCP with PRM + OBO
│   │   ├── deploy.ps1              # One-command Azure deployment (-Walkthrough for teaching)
│   │   ├── setup-entra-apps.ps1    # Full Entra ID app registration
│   │   ├── deploy-infrastructure.ps1
│   │   ├── deploy-apim.ps1         # APIM + JWT policy
│   │   ├── test-endpoints.ps1      # Full test suite (8 endpoint tests)
│   │   ├── add-reply-url.ps1       # Add Copilot Studio redirect URI
│   │   ├── add-users.ps1           # Assign users to MCP.User app role
│   │   ├── Dockerfile
│   │   ├── example.env
│   │   └── requirements.txt
│   ├── upload-docs.py          # Upload TVA docs to Azure AI Search
│   ├── agent-template.yaml     # Copilot Studio agent definition
│   └── test-agent.http         # REST Client test file
│
├── docs/                   # Sample TVA documents for the knowledge base
│   ├── nerc-cip-007.txt
│   ├── nerc-cip-010.txt
│   ├── tva-grid-reliability.txt
│   ├── nuclear-safety-overview.txt
│   └── regulatory-variance-process.txt
│
└── workshop/               # Workshop materials
    ├── agenda.md
    ├── exec-brief.md
    ├── lab1-azure-foundry.md
    ├── lab2-copilot-studio.md
    ├── lab3-apim-mcp.md
    ├── facilitator-guide.md
    └── boilerplate-readme.md
```

### Keeping mcp-backend in sync

Aaron's MCP server lives at `boilerplate/mcp-backend` as a git submodule. To pull his latest:

```bash
npx just sync
git add boilerplate/mcp-backend && git commit -m "chore: sync mcp-backend"
```

---

## Workshop Agenda (Quick View)

| Time | Session | Presenter |
|------|---------|-----------|
| 8:30 AM | Kickoff + Executive Briefing | JT |
| 9:00 AM | Session 1: Azure AI Foundry + Lab | Kevin |
| 11:45 AM | Session 2: Copilot Studio + Lab | Aaron |
| 1:45 PM | Session 2 continued | Aaron |
| 2:45 PM | Session 3: APIM + MCP + Lab | JT |
| 4:45 PM | **Production Deploy** (`npx just workshop:ship`) | All |
| 5:15 PM | Q&A + Next Steps | All |

Full agenda: [`workshop/agenda.md`](workshop/agenda.md)

---

## Reusing This for Other Customers

This repo is built as a template. To clone for a new customer:

```bash
# 1. Fork or copy the repo
gh repo create [CUSTOMER]-Demo --template johnturek/TVA-Demo --public

# 2. Find/replace TVA-specific content
grep -r "TVA\|Tennessee Valley\|NERC CIP\|Browns Ferry" workshop/ boilerplate/

# 3. Update docs/ with customer-relevant documents

# 4. Update agent-template.yaml system prompt

# 5. Run the workshop
npx just workshop:start
```

---

## Microsoft Learn Resources

| Topic | Link |
|-------|------|
| Azure AI Foundry | https://learn.microsoft.com/en-us/azure/ai-foundry/ |
| Foundry Agent Service | https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview |
| Copilot Studio overview | https://learn.microsoft.com/en-us/microsoft-copilot-studio/ |
| Copilot Studio + MCP | https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp |
| Copilot Studio auth (OBO) | https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-authentication-azure-ad |
| Azure API Management | https://learn.microsoft.com/en-us/azure/api-management/ |
| APIM Entra ID token validation | https://learn.microsoft.com/en-us/azure/api-management/validate-azure-ad-token-policy |
| Azure Container Apps | https://learn.microsoft.com/en-us/azure/container-apps/ |
| Entra ID OBO flow | https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow |
| just-task runner | https://microsoft.github.io/just/ |

---

## Questions?

Contact JT or open an issue in this repo.
