// just.config.js — TVA Workshop task runner
// Run tasks: npx just <taskname>
// List tasks: npx just --list
//
// Microsoft Learn: https://microsoft.github.io/just/
// Repo: https://github.com/microsoft/just

const { task, series, condition, logger } = require('just-task');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  logger.info(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function loadEnv(file = '.workshop-outputs.env') {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .filter(l => l.includes('='))
      .map(l => l.split('='))
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

// 1. Install all dependencies (Python MCP server + local Node tools)
task('install', () => {
  logger.info('Installing MCP server dependencies (Python)...');
  run('pip install -r requirements.txt', { cwd: 'boilerplate/mcp-backend' });
  logger.info('✅ Python dependencies installed');
  logger.info('Installing AI Search upload dependencies...');
  run('pip install azure-search-documents openai azure-identity --quiet');
  logger.info('✅ All dependencies installed');
});

// 2. Run MCP server locally (Python/FastMCP)
task('dev', () => {
  logger.info('Starting TVA MCP server locally (Python/FastMCP)...');
  logger.info('MCP endpoint:  http://localhost:8000/mcp');
  logger.info('PRM metadata:  http://localhost:8000/.well-known/oauth-protected-resource');
  logger.info('Press Ctrl+C to stop.');
  run('python mcp_server.py', { cwd: 'boilerplate/mcp-backend' });
});

// 3. Run MCP server via PowerShell script (Windows-friendly)
task('dev:ps', () => {
  run('pwsh -File run_mcp_server.ps1', { cwd: 'boilerplate/mcp-backend' });
});

// 4. Stop local MCP server (Docker variant if running in container)
task('dev:stop', () => {
  run('docker compose down', { cwd: 'boilerplate/mcp-backend' });
});

// 5. Run MCP server in Docker locally
task('dev:docker', () => {
  logger.info('Building and starting MCP server in Docker...');
  run('docker build -t tva-mcp . && docker run -p 8000:8000 --env-file ../.env tva-mcp', { cwd: 'boilerplate/mcp-backend' });
});

// 6. Upload TVA docs to Azure AI Search
task('upload-docs', () => {
  logger.info('Uploading TVA documents to Azure AI Search...');
  run('python3 boilerplate/upload-docs.py');
  logger.info('✅ Docs uploaded to tva-knowledge-base index');
});

// 7. Provision full Azure stack — uses Aaron's deploy.ps1 with -Walkthrough for workshop
//    Requires PowerShell 7+ (pwsh). Pass LAB_NUM env var to set participant suffix.
task('provision', () => {
  const labNum = process.env.LAB_NUM || 'l01';
  const walkthrough = process.env.WALKTHROUGH === 'true' ? '-Walkthrough' : '';
  logger.info(`Provisioning Azure resources for lab: ${labNum}`);
  logger.info('⏱  APIM takes ~15 minutes. Grab coffee.');
  logger.info('📚 MS Learn: https://learn.microsoft.com/en-us/azure/api-management/');
  run(`pwsh -File deploy.ps1 -LabNum ${labNum} ${walkthrough}`, { cwd: 'boilerplate/mcp-backend' });
  logger.info('✅ Azure stack provisioned. Check .env for APIM outputs.');
});

// 8. Provision with walkthrough mode (teaching mode — pauses at each step)
task('provision:teach', () => {
  process.env.WALKTHROUGH = 'true';
  const labNum = process.env.LAB_NUM || 'l01';
  logger.info(`Provisioning in WALKTHROUGH mode for lab: ${labNum}`);
  run(`pwsh -File deploy.ps1 -LabNum ${labNum} -Walkthrough`, { cwd: 'boilerplate/mcp-backend' });
});

// 9. Test all endpoints (uses Aaron's test-endpoints.ps1 — device-code auth + 8 tests)
task('test:prod', () => {
  logger.info('Running endpoint tests (device-code auth required)...');
  run('pwsh -File test-endpoints.ps1', { cwd: 'boilerplate/mcp-backend' });
});

// 10. Test local MCP server
task('test:local', () => {
  logger.info('Testing local MCP server...');
  run('curl -sf http://localhost:8000/.well-known/oauth-protected-resource | python3 -m json.tool');
  logger.info('✅ PRM metadata accessible');
});

// 11. Sync Aaron's mcp-backend submodule to latest
task('sync', () => {
  logger.info('Syncing mcp-backend submodule to latest...');
  run('git submodule update --remote boilerplate/mcp-backend');
  logger.info('✅ mcp-backend updated to latest commit from Aaron\'s repo');
  logger.info('Run `git add boilerplate/mcp-backend && git commit -m "chore: sync mcp-backend"` to save the update');
});

// 12. Add a user to the MCP.User app role
task('add-user', () => {
  const user = process.env.USER_EMAIL;
  if (!user) { logger.error('Set USER_EMAIL env var first'); process.exit(1); }
  const env = loadEnv('.env');
  run(`pwsh -File add-users.ps1 -TenantId "${env.OBO_TENANT_ID}" -AppClientId "${env.OAUTH_CLIENT_ID}" -Users "${user}"`,
    { cwd: 'boilerplate/mcp-backend' });
});

// 13. Full local setup (install + dev)
task('setup', series('install', 'upload-docs'));

// 14. Full workshop flow: install → upload docs → start local server → test
task('workshop:start', series('install', 'upload-docs', 'test:local'));

// 15. End of workshop: provision Azure (walkthrough) + test prod
task('workshop:ship', series('provision:teach', 'test:prod'));

// 16. Clean up local (stop Docker)
task('clean', () => {
  run('docker compose down --volumes', { cwd: 'boilerplate/mcp-backend' });
  logger.info('Local containers stopped.');
  logger.info('To delete ALL Azure resources: az group delete --name mcp-workshop-rg --yes');
});
