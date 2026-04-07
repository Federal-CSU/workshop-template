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

// 1. Install all dependencies
task('install', () => {
  logger.info('Installing boilerplate dependencies...');
  run('pip install azure-search-documents openai azure-identity --quiet', { cwd: '../boilerplate' });
  run('npm install express', { cwd: '../boilerplate' });
  logger.info('✅ Dependencies installed');
});

// 2. Start local Docker stack (backend + MCP)
task('dev', () => {
  logger.info('Starting local TVA stack (Docker)...');
  run('docker compose up -d', { cwd: '../boilerplate' });
  logger.info('✅ Backend:  http://localhost:3001/health');
  logger.info('✅ MCP:      http://localhost:3002/health');
});

// 3. Stop local Docker stack
task('dev:stop', () => {
  run('docker compose down', { cwd: '../boilerplate' });
});

// 4. Upload TVA docs to Azure AI Search
task('upload-docs', () => {
  logger.info('Uploading TVA documents to Azure AI Search...');
  const env = {
    ...process.env,
    AZURE_SEARCH_ENDPOINT: process.env.AZURE_SEARCH_ENDPOINT,
    AZURE_SEARCH_KEY: process.env.AZURE_SEARCH_KEY,
  };
  run('python3 upload-docs.py', { cwd: '../boilerplate', env });
  logger.info('✅ Docs uploaded to tva-knowledge-base index');
});

// 5. Provision full Azure stack (Container Apps + APIM + App Reg)
task('provision', () => {
  const suffix = process.env.PARTICIPANT_SUFFIX || 'l01';
  logger.info(`Provisioning Azure resources for participant: ${suffix}`);
  logger.info('⏱  This takes ~15 minutes. Go get coffee.');
  run(`bash provision-azure.sh ${suffix}`, { cwd: '../boilerplate' });
});

// 6. Test local endpoints
task('test:local', () => {
  logger.info('Testing local endpoints...');
  run('curl -sf http://localhost:3001/health | python3 -m json.tool');
  run('curl -sf http://localhost:3002/health | python3 -m json.tool');
  logger.info('✅ Local stack healthy');
});

// 7. Test production APIM endpoint
task('test:prod', () => {
  const env = loadEnv();
  const endpoint = env.MCP_ENDPOINT || process.env.MCP_ENDPOINT;
  if (!endpoint) {
    logger.error('MCP_ENDPOINT not set. Run `just provision` first or source .workshop-outputs.env');
    process.exit(1);
  }
  logger.info(`Testing production endpoint: ${endpoint}`);
  run(`curl -sf ${endpoint.replace('/mcp', '')}/health | python3 -m json.tool`);
  logger.info('✅ Production stack healthy');
});

// 8. Full local setup (install + dev)
task('setup', series('install', 'dev'));

// 9. Full workshop flow: setup → upload docs → test
task('workshop:start', series('setup', 'upload-docs', 'test:local'));

// 10. End of workshop: provision Azure + test prod
task('workshop:ship', series('provision', 'test:prod'));

// 11. Clean up (stop Docker, optionally delete Azure resources)
task('clean', () => {
  run('docker compose down --volumes', { cwd: '../boilerplate' });
  logger.info('Local stack stopped and volumes removed');
  logger.info('To delete Azure resources: az group delete --name tva-workshop-rg');
});
