#!/bin/bash
# Post-create setup for TVA Workshop Codespace / devcontainer
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          TVA Workshop — Environment Setup                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 1. Submodules
echo "⏳ Initializing submodules..."
git submodule update --init --recursive
echo "   ✅ Submodules ready"

# 2. Node dependencies
echo "⏳ Installing Node.js dependencies..."
npm install --quiet 2>&1 | tail -1
echo "   ✅ Node.js ready"

# 3. Python dependencies (MCP server + Foundry labs)
echo "⏳ Installing Python dependencies..."
pip install --quiet \
  -r boilerplate/mcp-backend/requirements.txt \
  -r boilerplate/mcp-backend/foundry-lab/requirements.txt \
  2>&1 | tail -1
echo "   ✅ Python ready"

# 4. Copy .env template
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   ✅ Created .env from template"
else
  echo "   ✅ .env already exists"
fi

# 5. Verify tools
echo ""
echo "── Installed Tools ──────────────────────────────────────"
printf "   Node.js:     %s\n" "$(node --version 2>/dev/null || echo 'NOT FOUND')"
printf "   Python:      %s\n" "$(python3 --version 2>/dev/null || echo 'NOT FOUND')"
printf "   PowerShell:  %s\n" "$(pwsh --version 2>/dev/null || echo 'NOT FOUND')"
printf "   Azure CLI:   %s\n" "$(az version --query '\"azure-cli\"' -o tsv 2>/dev/null || echo 'NOT FOUND')"
echo "───────────────────────────────────────────────────────"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  WORKSHOP ENVIRONMENT READY                          ║"
echo "║                                                          ║"
echo "║  📋 Open GETTING-STARTED.md for your next steps          ║"
echo "║  🔑 First: az login --use-device-code                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
