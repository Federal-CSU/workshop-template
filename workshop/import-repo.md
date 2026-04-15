# 📥 Importing This Repo into Your GitHub Enterprise Account

**Do this first** — before starting any labs. You'll create your own copy of this repository inside your organization's GitHub Enterprise instance so you can work independently.

---

## Why Import?

- You get your **own instance** of the repo to modify freely
- Your work stays within your organization's GitHub Enterprise environment
- Codespaces, Actions, and branch protections all work under your org's policies
- You won't affect the original public repo or other participants

---

## Step-by-Step: Import the Repository

### 1. Open GitHub Import

Navigate to your GitHub Enterprise instance and go to:

```
https://github.com/<your-enterprise-org>/import
```

Or from any page:
1. Click the **+** icon in the top-right corner of GitHub
2. Select **Import repository**

> 💡 If you don't see "Import repository," contact your GitHub Enterprise admin — your org may need to enable this feature.

### 2. Fill in the Import Form

| Field | Value |
|-------|-------|
| **Your old repository's clone URL** | `https://github.com/johnturek/TVA-Demo.git` |
| **Owner** | Select your GitHub Enterprise organization |
| **Repository name** | `TVA-Demo` (or a name of your choosing, e.g., `tva-workshop`) |
| **Privacy** | Choose **Private** (recommended) or **Public** |

### 3. Click "Begin Import"

GitHub will start importing the repository. This typically takes **1–2 minutes** for a repo this size.

You'll see a progress page — once it says **"Import complete!"**, click the link to go to your new repository.

### 4. Initialize the Submodule

The repo uses a git submodule for the MCP backend. After import, initialize it:

```bash
# Clone your imported repo
git clone https://github.com/<your-org>/TVA-Demo.git
cd TVA-Demo

# Initialize and pull the submodule
git submodule update --init --recursive
```

> ⚠️ **Note:** GitHub's import tool does not automatically import submodules. The submodule reference will still point to the original public source, which is fine — it will pull correctly as long as the submodule source remains accessible.

### 5. Set Up Your Environment

Now follow the main **[Getting Started guide](../GETTING-STARTED.md)** to configure your environment:

- **Codespaces (Recommended):** Open your imported repo in Codespaces — click the green **Code** button → **Codespaces** tab → **Create codespace on main**
- **Local:** Clone and follow the [setup instructions](setup-environment.md)

---

## Alternative: Fork Instead of Import

If your GitHub Enterprise instance allows forking from public repos, you can fork instead:

1. Go to [github.com/johnturek/TVA-Demo](https://github.com/johnturek/TVA-Demo)
2. Click **Fork** in the top-right
3. Select your Enterprise organization as the destination
4. Uncheck **"Copy the `main` branch only"** if you want all branches

> ⚠️ Forks maintain a link to the upstream repo. If your org's policy requires a fully independent copy with no upstream connection, use **Import** instead.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Import repository" option is missing | Ask your GitHub Enterprise admin to enable repository imports for your org |
| Import fails or hangs | Verify the source URL is correct: `https://github.com/johnturek/TVA-Demo.git` |
| Submodule folder is empty after clone | Run `git submodule update --init --recursive` |
| Codespaces not available | Your Enterprise plan may not include Codespaces — use local setup instead |
| Permission denied on import | Ensure you have **repo create** permissions in your target organization |

---

## Next Steps

Once your import is complete:

1. ✅ Open your repo in **Codespaces** or clone locally
2. ✅ Follow the **[Getting Started guide](../GETTING-STARTED.md)**
3. ✅ Start with **Lab 1** and work through the workshop at your own pace

---

**Questions?** Contact your facilitator or open an issue in the original repo at [github.com/johnturek/TVA-Demo](https://github.com/johnturek/TVA-Demo).
