import JiraClient from 'jira-client';
import config from '../config.js';
import logger from '../utils/logger.js';

class JiraService {
  constructor() {
    this.jira = new JiraClient({
      protocol: 'https',
      host: config.jira.host.replace('https://', ''),
      username: config.jira.username,
      password: config.jira.apiToken,
      apiVersion: '3',
      strictSSL: true,
    });
    this.projectKey = config.jira.projectKey;
    logger.info(`Initialized JIRA service for project ${this.projectKey}`);
  }

  /**
   * Get all tickets in a specific release/version
   * @param {string} versionName - The name of the version/release
   * @returns {Promise<Array>} Array of issue objects
   */
  async getTicketsInRelease(versionName) {
    try {
      logger.info(`Fetching tickets for release ${versionName}`);
      const jql = `project = ${this.projectKey} AND fixVersion = "${versionName}"`;
      
      const response = await this.jira.searchJira(jql, {
        maxResults: 1000,
        fields: ['key', 'summary', 'description', 'status', 'issuetype', 'priority'],
      });
      
      logger.info(`Found ${response.issues.length} tickets in release ${versionName}`);
      return response.issues;
    } catch (error) {
      logger.error(`Error fetching tickets in release: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific version by name
   * @param {string} versionName - The name of the version
   * @returns {Promise<Object>} The version object
   */
  async getVersionByName(versionName) {
    try {
      logger.info(`Fetching version ${versionName}`);
      const versions = await this.jira.getVersions(this.projectKey);
      const version = versions.find(v => v.name === versionName);
      
      if (!version) {
        logger.warn(`Version ${versionName} not found`);
        return null;
      }
      
      logger.info(`Found version ${versionName} with ID ${version.id}`);
      return version;
    } catch (error) {
      logger.error(`Error fetching version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new version
   * @param {string} versionName - The name of the version
   * @param {string} description - The description of the version
   * @returns {Promise<Object>} The created version
   */
  async createVersion(versionName, description) {
    try {
      logger.info(`Creating version ${versionName}`);
      const response = await this.jira.createVersion({
        name: versionName,
        description: description || `Release ${versionName}`,
        projectId: this.projectKey,
      });
      
      logger.info(`Created version ${versionName} with ID ${response.id}`);
      return response;
    } catch (error) {
      logger.error(`Error creating version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find or create a version by name
   * @param {string} versionName - The name of the version
   * @param {string} description - The description of the version
   * @returns {Promise<Object>} The version object
   */
  async findOrCreateVersion(versionName, description) {
    try {
      logger.info(`Finding or creating version ${versionName}`);
      const existingVersion = await this.getVersionByName(versionName);
      
      if (existingVersion) {
        logger.info(`Found existing version ${versionName}`);
        return existingVersion;
      }
      
      logger.info(`No version found for ${versionName}, creating new one`);
      return await this.createVersion(versionName, description);
    } catch (error) {
      logger.error(`Error finding or creating version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific issue by key
   * @param {string} issueKey - The issue key (e.g., "PROJ-123")
   * @returns {Promise<Object>} The issue object
   */
  async getIssue(issueKey) {
    try {
      logger.info(`Fetching issue ${issueKey}`);
      const response = await this.jira.findIssue(issueKey);
      return response;
    } catch (error) {
      logger.error(`Error fetching issue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format ticket information for TestRail test case
   * @param {Object} issue - The JIRA issue object
   * @returns {Object} Formatted ticket information
   */
  formatTicketForTestCase(issue) {
    return {
      title: `${issue.key} - ${issue.fields.summary}`,
      description: issue.fields.description || '',
      jiraTicket: issue.key,
      priority: this.mapJiraPriorityToTestRail(issue.fields.priority?.name),
      type: this.mapJiraIssueTypeToTestRail(issue.fields.issuetype?.name),
    };
  }

  /**
   * Map JIRA priority to TestRail priority
   * @param {string} jiraPriority - The JIRA priority name
   * @returns {number} TestRail priority ID
   */
  mapJiraPriorityToTestRail(jiraPriority) {
    const priorityMap = {
      'Highest': 1, // Critical
      'High': 2,    // High
      'Medium': 3,  // Medium
      'Low': 4,     // Low
      'Lowest': 5,  // Minor
    };
    
    return priorityMap[jiraPriority] || 3; // Default to Medium
  }

  /**
   * Map JIRA issue type to TestRail test type
   * @param {string} issueType - The JIRA issue type name
   * @returns {number} TestRail test type ID
   */
  mapJiraIssueTypeToTestRail(issueType) {
    const typeMap = {
      'Bug': 1,        // Functional
      'Task': 2,       // Acceptance
      'Story': 3,      // Functional
      'Epic': 7,       // Compatibility
      'Improvement': 6, // Performance
    };
    
    return typeMap[issueType] || 1; // Default to Functional
  }
}

export default JiraService;
