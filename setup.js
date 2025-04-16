#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Main function
async function main() {
  console.log('Welcome to the Release Automation setup!');
  console.log('This script will help you create your .env file with the required configuration.');
  console.log('Press Enter to use the default values (shown in parentheses).\n');

  // Check if .env file already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await prompt('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Existing .env file was not modified.');
      rl.close();
      return;
    }
  }

  // Read the .env.example file
  const envExamplePath = path.join(__dirname, '.env.example');
  const envExample = fs.readFileSync(envExamplePath, 'utf8');

  // Parse the example file to get the variables
  const envVars = {};
  const lines = envExample.split('\n');
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }
    
    // Extract variable name and default value
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, name, defaultValue] = match;
      envVars[name.trim()] = defaultValue.trim();
    }
  }

  // Prompt for each variable
  const newEnvVars = {};
  
  console.log('\n--- GitHub Configuration ---');
  newEnvVars['GITHUB_TOKEN'] = await prompt(`GitHub Token (${envVars['GITHUB_TOKEN']}): `) || envVars['GITHUB_TOKEN'];
  newEnvVars['GITHUB_OWNER'] = await prompt(`GitHub Owner/Organization (${envVars['GITHUB_OWNER']}): `) || envVars['GITHUB_OWNER'];
  newEnvVars['GITHUB_REPO'] = await prompt(`GitHub Repository (${envVars['GITHUB_REPO']}): `) || envVars['GITHUB_REPO'];
  
  console.log('\n--- TestRail Configuration ---');
  newEnvVars['TESTRAIL_HOST'] = await prompt(`TestRail Host (${envVars['TESTRAIL_HOST']}): `) || envVars['TESTRAIL_HOST'];
  newEnvVars['TESTRAIL_USERNAME'] = await prompt(`TestRail Username (${envVars['TESTRAIL_USERNAME']}): `) || envVars['TESTRAIL_USERNAME'];
  newEnvVars['TESTRAIL_API_KEY'] = await prompt(`TestRail API Key (${envVars['TESTRAIL_API_KEY']}): `) || envVars['TESTRAIL_API_KEY'];
  newEnvVars['TESTRAIL_PROJECT_ID'] = await prompt(`TestRail Project ID (${envVars['TESTRAIL_PROJECT_ID']}): `) || envVars['TESTRAIL_PROJECT_ID'];
  
  console.log('\n--- JIRA Configuration ---');
  newEnvVars['JIRA_HOST'] = await prompt(`JIRA Host (${envVars['JIRA_HOST']}): `) || envVars['JIRA_HOST'];
  newEnvVars['JIRA_USERNAME'] = await prompt(`JIRA Username (${envVars['JIRA_USERNAME']}): `) || envVars['JIRA_USERNAME'];
  newEnvVars['JIRA_API_TOKEN'] = await prompt(`JIRA API Token (${envVars['JIRA_API_TOKEN']}): `) || envVars['JIRA_API_TOKEN'];
  newEnvVars['JIRA_PROJECT_KEY'] = await prompt(`JIRA Project Key (${envVars['JIRA_PROJECT_KEY']}): `) || envVars['JIRA_PROJECT_KEY'];
  
  console.log('\n--- Confluence Configuration ---');
  newEnvVars['CONFLUENCE_HOST'] = await prompt(`Confluence Host (${envVars['CONFLUENCE_HOST']}): `) || envVars['CONFLUENCE_HOST'];
  newEnvVars['CONFLUENCE_USERNAME'] = await prompt(`Confluence Username (${envVars['CONFLUENCE_USERNAME']}): `) || envVars['CONFLUENCE_USERNAME'];
  newEnvVars['CONFLUENCE_API_TOKEN'] = await prompt(`Confluence API Token (${envVars['CONFLUENCE_API_TOKEN']}): `) || envVars['CONFLUENCE_API_TOKEN'];
  newEnvVars['CONFLUENCE_SPACE_KEY'] = await prompt(`Confluence Space Key (${envVars['CONFLUENCE_SPACE_KEY']}): `) || envVars['CONFLUENCE_SPACE_KEY'];
  newEnvVars['CONFLUENCE_QA_PARENT_PAGE_ID'] = await prompt(`Confluence QA Parent Page ID (${envVars['CONFLUENCE_QA_PARENT_PAGE_ID']}): `) || envVars['CONFLUENCE_QA_PARENT_PAGE_ID'];

  // Create the .env file content
  let envContent = '';
  
  // Add GitHub configuration
  envContent += '# GitHub Configuration\n';
  envContent += `GITHUB_TOKEN=${newEnvVars['GITHUB_TOKEN']}\n`;
  envContent += `GITHUB_OWNER=${newEnvVars['GITHUB_OWNER']}\n`;
  envContent += `GITHUB_REPO=${newEnvVars['GITHUB_REPO']}\n\n`;
  
  // Add TestRail configuration
  envContent += '# TestRail Configuration\n';
  envContent += `TESTRAIL_HOST=${newEnvVars['TESTRAIL_HOST']}\n`;
  envContent += `TESTRAIL_USERNAME=${newEnvVars['TESTRAIL_USERNAME']}\n`;
  envContent += `TESTRAIL_API_KEY=${newEnvVars['TESTRAIL_API_KEY']}\n`;
  envContent += `TESTRAIL_PROJECT_ID=${newEnvVars['TESTRAIL_PROJECT_ID']}\n\n`;
  
  // Add JIRA configuration
  envContent += '# JIRA Configuration\n';
  envContent += `JIRA_HOST=${newEnvVars['JIRA_HOST']}\n`;
  envContent += `JIRA_USERNAME=${newEnvVars['JIRA_USERNAME']}\n`;
  envContent += `JIRA_API_TOKEN=${newEnvVars['JIRA_API_TOKEN']}\n`;
  envContent += `JIRA_PROJECT_KEY=${newEnvVars['JIRA_PROJECT_KEY']}\n\n`;
  
  // Add Confluence configuration
  envContent += '# Confluence Configuration\n';
  envContent += `CONFLUENCE_HOST=${newEnvVars['CONFLUENCE_HOST']}\n`;
  envContent += `CONFLUENCE_USERNAME=${newEnvVars['CONFLUENCE_USERNAME']}\n`;
  envContent += `CONFLUENCE_API_TOKEN=${newEnvVars['CONFLUENCE_API_TOKEN']}\n`;
  envContent += `CONFLUENCE_SPACE_KEY=${newEnvVars['CONFLUENCE_SPACE_KEY']}\n`;
  envContent += `CONFLUENCE_QA_PARENT_PAGE_ID=${newEnvVars['CONFLUENCE_QA_PARENT_PAGE_ID']}\n`;

  // Write the .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n.env file has been created successfully!');
  console.log(`You can edit it manually at ${envPath} if needed.`);
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error during setup:', error);
  rl.close();
});
