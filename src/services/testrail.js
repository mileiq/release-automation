import TestRail from 'testrail-api';
import config from '../config.js';
import logger from '../utils/logger.js';

class TestRailService {
  constructor() {
    this.testrail = new TestRail({
      host: config.testrail.host,
      user: config.testrail.username,
      password: config.testrail.apiKey,
    });
    this.projectId = config.testrail.projectId;
    logger.info(`Initialized TestRail service for project ID ${this.projectId}`);
  }

  /**
   * Create a new test plan for a release
   * @param {string} releaseName - The name of the release
   * @param {string} description - The description of the test plan
   * @returns {Promise<Object>} The created test plan
   */
  async createTestPlan(releaseName, description) {
    try {
      logger.info(`Creating test plan for release ${releaseName}`);
      const response = await this.testrail.addPlan(this.projectId, {
        name: `Release ${releaseName} Test Plan`,
        description: description || `Test plan for release ${releaseName}`,
      });
      
      logger.info(`Created test plan with ID ${response.id}`);
      return response;
    } catch (error) {
      logger.error(`Error creating test plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new test case
   * @param {number} sectionId - The section ID to add the test case to
   * @param {string} title - The title of the test case
   * @param {Object} options - Additional options for the test case
   * @returns {Promise<Object>} The created test case
   */
  async createTestCase(sectionId, title, options = {}) {
    try {
      logger.info(`Creating test case: ${title}`);
      const testCase = {
        title,
        type_id: options.typeId || 1, // 1 = Functional test
        priority_id: options.priorityId || 2, // 2 = Medium priority
        estimate: options.estimate || '15m',
        refs: options.refs || '',
        custom_jira_ticket: options.jiraTicket || '',
      };
      
      const response = await this.testrail.addCase(sectionId, testCase);
      logger.info(`Created test case with ID ${response.id}`);
      return response;
    } catch (error) {
      logger.error(`Error creating test case: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add test cases to a test plan
   * @param {number} planId - The ID of the test plan
   * @param {number} suiteId - The ID of the test suite
   * @param {Array<number>} caseIds - Array of test case IDs to add
   * @returns {Promise<Object>} The created test plan entry
   */
  async addTestCasesToPlan(planId, suiteId, caseIds) {
    try {
      logger.info(`Adding ${caseIds.length} test cases to plan ${planId}`);
      const response = await this.testrail.addPlanEntry(planId, {
        suite_id: suiteId,
        include_all: false,
        case_ids: caseIds,
      });
      
      logger.info(`Added test cases to plan, entry ID: ${response.id}`);
      return response;
    } catch (error) {
      logger.error(`Error adding test cases to plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all test suites for a project
   * @returns {Promise<Array>} Array of test suite objects
   */
  async getTestSuites() {
    try {
      logger.info(`Getting test suites for project ${this.projectId}`);
      const response = await this.testrail.getSuites(this.projectId);
      logger.info(`Found ${response.length} test suites`);
      return response;
    } catch (error) {
      logger.error(`Error getting test suites: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all sections in a test suite
   * @param {number} suiteId - The ID of the test suite
   * @returns {Promise<Array>} Array of section objects
   */
  async getSections(suiteId) {
    try {
      logger.info(`Getting sections for suite ${suiteId}`);
      const response = await this.testrail.getSections(this.projectId, { suite_id: suiteId });
      logger.info(`Found ${response.length} sections`);
      return response;
    } catch (error) {
      logger.error(`Error getting sections: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new section in a test suite
   * @param {number} suiteId - The ID of the test suite
   * @param {string} name - The name of the section
   * @param {number} parentId - The ID of the parent section (optional)
   * @returns {Promise<Object>} The created section
   */
  async createSection(suiteId, name, parentId = null) {
    try {
      logger.info(`Creating section ${name} in suite ${suiteId}`);
      const section = {
        name,
        suite_id: suiteId,
      };
      
      if (parentId) {
        section.parent_id = parentId;
      }
      
      const response = await this.testrail.addSection(this.projectId, section);
      logger.info(`Created section with ID ${response.id}`);
      return response;
    } catch (error) {
      logger.error(`Error creating section: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a test case by ID
   * @param {number} caseId - The ID of the test case
   * @returns {Promise<Object>} The test case object
   */
  async getTestCase(caseId) {
    try {
      logger.info(`Getting test case ${caseId}`);
      const response = await this.testrail.getCase(caseId);
      return response;
    } catch (error) {
      logger.error(`Error getting test case: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all test cases in a section
   * @param {number} sectionId - The ID of the section
   * @returns {Promise<Array>} Array of test case objects
   */
  async getTestCasesInSection(sectionId) {
    try {
      logger.info(`Getting test cases in section ${sectionId}`);
      const response = await this.testrail.getCases(this.projectId, { section_id: sectionId });
      logger.info(`Found ${response.length} test cases`);
      return response;
    } catch (error) {
      logger.error(`Error getting test cases: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find or create a section for a release
   * @param {number} suiteId - The ID of the test suite
   * @param {string} releaseName - The name of the release
   * @returns {Promise<Object>} The section object
   */
  async findOrCreateReleaseSection(suiteId, releaseName) {
    try {
      logger.info(`Finding or creating section for release ${releaseName}`);
      const sections = await this.getSections(suiteId);
      const releaseSection = sections.find(section => section.name === `Release ${releaseName}`);
      
      if (releaseSection) {
        logger.info(`Found existing section for release ${releaseName}: ${releaseSection.id}`);
        return releaseSection;
      }
      
      logger.info(`No section found for release ${releaseName}, creating new one`);
      return await this.createSection(suiteId, `Release ${releaseName}`);
    } catch (error) {
      logger.error(`Error finding or creating release section: ${error.message}`);
      throw error;
    }
  }
}

export default TestRailService;
