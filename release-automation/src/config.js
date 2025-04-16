import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load environment variables from .env file
dotenv.config({ path: path.join(rootDir, '.env') });

// Check if .env file exists, if not, create it from .env.example
if (!fs.existsSync(path.join(rootDir, '.env'))) {
  console.warn('No .env file found. Please create one based on .env.example');
  process.exit(1);
}

const config = {
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
  },
  testrail: {
    host: process.env.TESTRAIL_HOST,
    username: process.env.TESTRAIL_USERNAME,
    apiKey: process.env.TESTRAIL_API_KEY,
    projectId: process.env.TESTRAIL_PROJECT_ID,
  },
  jira: {
    host: process.env.JIRA_HOST,
    username: process.env.JIRA_USERNAME,
    apiToken: process.env.JIRA_API_TOKEN,
    projectKey: process.env.JIRA_PROJECT_KEY,
  },
  confluence: {
    host: process.env.CONFLUENCE_HOST,
    username: process.env.CONFLUENCE_USERNAME,
    apiToken: process.env.CONFLUENCE_API_TOKEN,
    spaceKey: process.env.CONFLUENCE_SPACE_KEY,
    qaParentPageId: process.env.CONFLUENCE_QA_PARENT_PAGE_ID,
  },
};

// Validate required configuration
const validateConfig = () => {
  const missingVars = [];

  // Check GitHub config
  if (!config.github.token) missingVars.push('GITHUB_TOKEN');
  if (!config.github.owner) missingVars.push('GITHUB_OWNER');
  if (!config.github.repo) missingVars.push('GITHUB_REPO');

  // Check TestRail config
  if (!config.testrail.host) missingVars.push('TESTRAIL_HOST');
  if (!config.testrail.username) missingVars.push('TESTRAIL_USERNAME');
  if (!config.testrail.apiKey) missingVars.push('TESTRAIL_API_KEY');
  if (!config.testrail.projectId) missingVars.push('TESTRAIL_PROJECT_ID');

  // Check JIRA config
  if (!config.jira.host) missingVars.push('JIRA_HOST');
  if (!config.jira.username) missingVars.push('JIRA_USERNAME');
  if (!config.jira.apiToken) missingVars.push('JIRA_API_TOKEN');
  if (!config.jira.projectKey) missingVars.push('JIRA_PROJECT_KEY');

  // Check Confluence config
  if (!config.confluence.host) missingVars.push('CONFLUENCE_HOST');
  if (!config.confluence.username) missingVars.push('CONFLUENCE_USERNAME');
  if (!config.confluence.apiToken) missingVars.push('CONFLUENCE_API_TOKEN');
  if (!config.confluence.spaceKey) missingVars.push('CONFLUENCE_SPACE_KEY');
  if (!config.confluence.qaParentPageId) missingVars.push('CONFLUENCE_QA_PARENT_PAGE_ID');

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
};

// Export the config
export default config;
export { validateConfig };
