# 🚀 TVA Workshop — Getting Started

**Welcome!** Follow the steps below to set up your development environment and get started with the workshop.

---

## Step 0: Set Up Your Environment

### Requirement: GitHub Account

You need **one** of the following:
- A **GitHub Personal account** (free — [github.com/signup](https://github.com/signup))
- A **GitHub Enterprise account** (if your org uses GitHub Enterprise)

### 0a. Get Your Own Copy of the Repo

**Personal GitHub:**
```bash
# Fork or clone the repo to your account
git clone https://github.com/johnturek/TVA-Demo.git
```
Or click **Fork** at [github.com/johnturek/TVA-Demo](https://github.com/johnturek/TVA-Demo) to create your own copy.

**GitHub Enterprise:**
Import the repo into your enterprise org. See 👉 [**Import Repo Guide**](workshop/import-repo.md) for step-by-step instructions.

### 0b. Launch Your Cloud Dev Environment

We use **[vscode.dev/azure](https://vscode.dev/azure)** — a browser-based VS Code environment powered by Azure. No local installs needed.

1. Go to 👉 **[https://vscode.dev/azure](https://vscode.dev/azure)**
2. **Sign in with your Azure account** (the workshop demo tenant credentials from check-in)
3. This gives you a full VS Code editor in the browser with:
   - Integrated terminal with Azure CLI pre-authenticated
   - Built-in Azure extensions (App Service, Functions, Container Apps, etc.)
   - GitHub integration for cloning repos
   - Run, debug, and deploy to Azure directly from the browser

> 💡 **Why vscode.dev/azure?** It's a dedicated Azure development environment in your browser — no local setup, no Docker, no installs. You sign in once with your Azure identity and everything is connected.

### 0c. Clone the Repo into Your Environment

Once vscode.dev/azure is running:

1. Open the **terminal** (`Ctrl+\`` or Terminal → New Terminal)
2. Clone **your fork/import** of the repo:
   ```bash
   git clone https://github.com/<YOUR-ACCOUNT-OR-ORG>/TVA-Demo.git
   cd TVA-Demo
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

> ⚠️ Clone **your own copy**, not the original — this way you can push changes and your work is saved to your account.

You're now ready to continue with the steps below! 👇

---

## Prerequisites

> ⚠️ **Required Azure Entra ID Roles:** Before starting, each participant must have the following roles assigned in the workshop Azure tenant:
>
> - **Application Administrator** — needed to create and configure Entra ID app registrations
> - **Application Developer** — needed to register applications and grant API permissions
>
> Ask your facilitator or tenant admin to assign these roles **before the workshop begins**. Without them, the deployment scripts in Lab 3 will fail.

---

## Step 1: Sign into GitHub and Azure (required)

### GitHub CLI (for cloning and repo operations)

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

### Azure CLI (for resource deployment)

```bash
az login --use-device-code
```

Follow the prompt — open the URL, enter the code, and sign in with your **workshop demo tenant** credentials (not your personal account).

**Verify it worked:**
```bash
az account show --query '{name:name, user:user.name}' -o table
```

---

## Step 2: Configure your `.env` file

Open `.env` in the editor (it was auto-created from the template). Fill in the values your facilitator provides at check-in:

```bash
code .env
```

**Key values you'll need from check-in:**
| Variable | Where to get it |
|----------|----------------|
| `AZURE_AI_PROJECT_ENDPOINT` | Foundry portal → your project → Overview |
| `AZURE_OPENAI_KEY` | Foundry portal → Models + endpoints → gpt-4o → Key |

> 💡 Most other values are auto-populated by the deploy scripts during the labs.

---

## Step 3: Choose your starting lab

| Lab | Command | What you'll do |
|-----|---------|---------------|
| **Lab 1** — Copilot Studio | Open `workshop/lab2-copilot-studio.md` | Build a Copilot Studio agent |
| **Lab 2** — Azure AI Foundry | Open `workshop/lab1-azure-foundry.md` | Create a Foundry project, upload docs, test AI agent |
| **Lab 3** — APIM + MCP | Open `workshop/lab3-apim-mcp.md` | Deploy to Azure, connect MCP |

### Aaron's Hands-On Python Labs (Session 2)

Run interactive Python exercises during Lab 1:

```bash
# Lab 01: Prompts & Completions (start here)
FOUNDRY_LAB=01 npx just foundry:lab

# Lab 02: Responses API
FOUNDRY_LAB=02 npx just foundry:lab

# Lab 03: Agents
FOUNDRY_LAB=03 npx just foundry:lab

# Lab 04: Multi-Agent (stretch goal)
FOUNDRY_LAB=04 npx just foundry:lab

# Lab 05: RAG with AI Search (stretch goal)
FOUNDRY_LAB=05 npx just foundry:lab

# Lab 06: Foundry IQ (stretch goal)
FOUNDRY_LAB=06 npx just foundry:lab
```

> 💡 Each lab has an interactive menu — pick exercises to run individually.

---

## Step 4: Deploy to Azure (Lab 3)

When you're ready for production deployment, run the following commands from the repo root.  
Replace `tvad01` with your unique `LAB_NUM` (each student needs a unique value for per-student resources).

```bash
# Provision Azure resources (Entra ID → Container Registry → Container App → APIM)
LAB_NUM=tvad01 npx just provision

# Deploy Foundry Lab infrastructure (AI Foundry Account + AI Search)
LAB_NUM=tvad01 WALKTHROUGH=true SEARCH_LOCATION=westus npx just foundry:deploy

# (Optional) Deploy into a specific pre-existing resource group
LAB_NUM=tvad01 WALKTHROUGH=true SEARCH_LOCATION=westus RESOURCE_GROUP_OVERRIDE=mcp-workshop-rg npx just foundry:deploy
```

> 💡 **`LAB_NUM`** must be unique per student when using per-student resources (e.g. `tvad01`, `tvad02`). It can be the same value for all students if they share resources — e.g., use `tva01` during the live TVA workshop.
>
> 💡 **`WALKTHROUGH=true`** pauses at each deployment step with explanations — recommended for teaching mode.

This deploys: Entra ID app → Container Registry → Container App → APIM (takes ~15 min).

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npx just --list` | Show all available tasks |
| `npx just slides` | Open the presentation slides |
| `npx just dev` | Start MCP server locally |
| `npx just test:local` | Health-check local server |
| `LAB_NUM=tvad01 WALKTHROUGH=true SEARCH_LOCATION=westus npx just foundry:deploy` | Deploy Foundry Lab infrastructure |
| `LAB_NUM=tvad01 WALKTHROUGH=true SEARCH_LOCATION=westus RESOURCE_GROUP_OVERRIDE=mcp-workshop-rg npx just foundry:deploy` | Deploy Foundry Lab into a specific pre-existing resource group |
| `npx just workshop:ship` | Full production deploy |
| `npx just clean` | Stop & clean Docker containers |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `gh auth login` fails | Ensure GitHub CLI is installed: `gh --version`. Retry and follow the browser prompt. |
| `az login` fails | Use `--use-device-code`. Check you're using demo tenant credentials. |
| Python import errors | Run `pip install -r boilerplate/mcp-backend/foundry-lab/requirements.txt` |
| `.env` is empty | Run `cp .env.example .env` and fill in values from check-in card |
| Submodule is empty | Run `git submodule update --init --recursive` |
| PowerShell not found | Already installed — try `pwsh --version` |

---

## Resources

- 📖 **Workshop slides:** `slides/index.html` (or run `npx just slides`)
- 📚 **Lab guides:** `workshop/` directory
- 🔧 **MCP server code:** `boilerplate/mcp-backend/`
- 🧪 **Foundry labs:** `boilerplate/mcp-backend/foundry-lab/`
- 📄 **Sample TVA docs:** `docs/`

**Questions?** Ask your facilitator or open an issue at [github.com/johnturek/TVA-Demo](https://github.com/johnturek/TVA-Demo).
