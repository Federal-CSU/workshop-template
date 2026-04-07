# Lab 2: Build the TVA Document Processor in Copilot Studio
**Duration:** 90 minutes | **Session:** 2 of 3 | **Presenter:** Aaron

---

## Objectives
By the end of this lab, participants will have:
- A working Copilot Studio agent built from scratch
- Agent connected to Azure AI Foundry (not native Copilot knowledge)
- Configured authentication (maker vs OBO)
- File upload capability tested
- A passing end-to-end demo conversation

---

## Prerequisites
- Completed Lab 1 (Azure AI Foundry endpoint + index ready)
- Your saved values: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY`
- Access to https://copilotstudio.microsoft.com

---

## Part 1: Create the Agent (15 min)

### Step 1: Open Copilot Studio
1. Navigate to https://copilotstudio.microsoft.com
2. Sign in with demo tenant credentials
3. Click **+ Create** → **New agent**

### Step 2: Name and Describe Your Agent
- **Name:** `TVA Document Processor`
- **Description:** `Helps TVA engineers and compliance officers search regulatory documents, NERC CIP compliance reports, and grid reliability data.`
- **Instructions (system prompt):**

```
You are the TVA Document Processor, an AI assistant for Tennessee Valley Authority staff.

Your purpose:
- Answer questions about TVA regulatory documents and NERC CIP compliance
- Summarize uploaded compliance reports and policy documents
- Help engineers find specific requirements in TVA's document library
- Flag potential compliance gaps when asked

Always:
- Cite the source document when answering from the knowledge base
- Be precise with regulatory requirements — accuracy matters in energy compliance
- If a document is uploaded, prioritize its content over general knowledge
- If you don't know, say so clearly rather than guessing

TVA context: You support ~11,000 employees across power generation (nuclear, hydro, fossil, solar), river management operations, and grid reliability — serving 10 million people across the Tennessee Valley.
```

Click **Create**.

---

## Part 2: Connect to Azure AI Foundry Knowledge Base (25 min)

> ⚠️ **Important:** We are NOT using Copilot Studio's native knowledge feature. We're connecting directly to our Azure AI Foundry index for richer RAG control.

### Step 1: Add a Custom Connector Topic
1. In your agent, click **Topics** → **+ Add topic** → **From blank**
2. Name it: `Document Search`
3. Add a trigger phrase: `Search documents`

### Step 2: Add HTTP Action
1. In the topic canvas, click **+** → **Call an action** → **Send HTTP request**
2. Configure:
   - **Method:** POST
   - **URL:** `https://YOUR_PROJECT_ENDPOINT/openai/deployments/gpt-4o/chat/completions?api-version=2024-05-01-preview`
   - **Headers:**
     - `Content-Type`: `application/json`
     - `api-key`: `[your Azure OpenAI key]`

### Step 3: Build the Request Body
Use this JSON template in the body field:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a TVA compliance assistant. Always cite document sources."
    },
    {
      "role": "user",
      "content": "{System.LastMessage.Text}"
    }
  ],
  "data_sources": [
    {
      "type": "azure_search",
      "parameters": {
        "endpoint": "YOUR_SEARCH_ENDPOINT",
        "index_name": "tva-knowledge-base",
        "authentication": {
          "type": "api_key",
          "key": "YOUR_SEARCH_KEY"
        }
      }
    }
  ],
  "max_tokens": 800
}
```

### Step 4: Parse and Display the Response
1. Add a **Parse value** action → parse `Topic.HTTPResponse.Body` as JSON
2. Add a **Send a message** action
3. Set message to: `{Topic.ParsedResponse.choices[0].message.content}`

> ⚠️ **Vignette: "Variable not found" error**
> Copilot Studio's variable picker can be finicky with nested JSON. If `choices[0]` doesn't resolve, use the expression editor and type it manually: `Topic.ParsedResponse.choices.first().message.content`

### Step 5: Enable Generative Answers as Fallback
1. Go to **Settings** → **Generative AI**
2. Toggle **Generative answers** ON
3. Under **Knowledge**, click **+ Add knowledge** → **External data source**
4. Add your Azure AI Search endpoint as a connected source

This ensures the agent uses your Foundry index for any question, not just the Document Search topic.

---

## Part 3: Authentication — Maker vs OBO (20 min)

This is one of the most important decisions in Copilot Studio development.

### The Two Models

| | Maker Credentials | User Credentials (OBO) |
|---|---|---|
| **Who authenticates** | The agent itself (service principal) | The end user |
| **Best for** | Internal tools, read-only data | Sensitive data, audit trails, user-specific data |
| **Setup complexity** | Low | Medium-High |
| **Government use** | Acceptable for demos | Required for production |
| **TVA use case** | Workshop demos | Production NERC CIP queries |

### Configure Maker Credentials (Workshop Default)
1. Go to **Settings** → **Security** → **Authentication**
2. Select **No authentication** (for workshop only)
3. This lets the agent call your API key directly

### Configure OBO (Production Pattern — Demo Only)
1. Go to **Settings** → **Security** → **Authentication**
2. Select **Authenticate with Microsoft**
3. Enter your app registration details (from Lab 3's `setup-app-registration.ps1`)
4. Enable **Require users to sign in**

When OBO is enabled, the agent forwards the logged-in user's token to backend APIs — meaning your APIM layer knows exactly which TVA engineer made the request.

> ⚠️ **Vignette: GCC Tenants — Dataverse Connector Broken**
> If you're deploying to a GCC (Government Community Cloud) tenant, the Dataverse connector for Copilot Studio skills is currently broken. Aaron has a pending PR with the product group for GCC support. Workaround: use HTTP actions directly (what we're doing in this lab) instead of Dataverse-backed skills. This is actually the more portable pattern anyway.

---

## Part 4: File Upload Capability (15 min)

One of Copilot Studio's most powerful features for document processing.

### Step 1: Enable File Upload
1. Go to **Settings** → **Generative AI**
2. Scroll to **File upload** → Toggle ON
3. Set max file size: 20MB
4. Allowed types: PDF, DOCX, TXT

### Step 2: Add Upload Topic
1. Create a new topic: `Analyze Document`
2. Trigger phrases:
   - `analyze this document`
   - `review this file`
   - `check this report`
3. Add a **File upload** action node
4. Store result in `Topic.UploadedFile`

### Step 3: Process the Upload
After the file upload node:

```
Send message: "I've received your document. Give me a moment to analyze it..."

Call HTTP action:
  POST https://YOUR_PROJECT_ENDPOINT/chat/completions
  Body: {
    "messages": [
      {"role": "system", "content": "Analyze this TVA document for compliance issues and key findings."},
      {"role": "user", "content": "Document content: {Topic.UploadedFile.Content}"}
    ]
  }
```

### Test It
Upload one of the sample TVA documents from the `/docs` folder and ask:
- "What compliance gaps does this document identify?"
- "Summarize the key findings"
- "Are there any NERC CIP violations mentioned?"

---

## Part 5: Prompt-Based Development (10 min)

Instead of clicking through the UI for every topic, generate YAML directly.

### Step 1: Ask Copilot to Generate a Topic
In VS Code or any editor, prompt:

```
Generate a Copilot Studio topic YAML for an agent that:
- Triggers on "check compliance status"  
- Asks the user which NERC CIP standard they need (CIP-007, CIP-010, CIP-011)
- Calls a REST endpoint at https://api.example.com/compliance/{standard}
- Displays the result with a formatted message
```

### Step 2: Import the YAML
1. In Copilot Studio, go to **Topics**
2. Click **...** menu → **Open code editor**
3. Paste the generated YAML
4. Fix any validation errors (usually just variable name formatting)

This approach is 5-10x faster than building topics in the canvas UI — especially for complex flows.

---

## Lab 2 Checkpoint ✅

Before break, verify:
- [ ] Agent created with TVA system prompt
- [ ] Document Search topic calls Azure AI Foundry and returns cited answers
- [ ] Generative answers fallback enabled
- [ ] Authentication mode selected (maker for workshop, OBO pattern understood)
- [ ] File upload works — uploaded a sample doc and got a summary
- [ ] Tested at least 3 conversations in the Test panel

**Test your agent:** In the Test panel (right side), try:
1. "What are the NERC CIP-007 requirements for patch management?"
2. Upload `tva-sample-compliance.pdf` and ask "What are the key findings?"
3. "Who do I contact for a regulatory variance?"

---

## Executive Takeaway
What was just built: a virtual compliance expert that any TVA engineer can talk to in plain English. It reads the same documents your team uses, answers instantly, and cites exactly where the answer came from. This is what replaces 45-minute searches through SharePoint.
