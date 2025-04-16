import GitHubService from '../services/github.js';
import TestRailService from '../services/testrail.js';
import JiraService from '../services/jira.js';
import ConfluenceService from '../services/confluence.js';
import logger from '../utils/logger.js';

class ReleaseController {
  constructor() {
    this.githubService = new GitHubService();
    this.testRailService = new TestRailService();
    this.jiraService = new JiraService();
    this.confluenceService = new ConfluenceService();
    logger.info('Initialized Release Controller');
  }

  /**
   * Process a new release
   * @param {string} releaseTag - The tag of the release to process (optional)
   * @returns {Promise<Object>} The result of the processing
   */
  async processRelease(releaseTag = null) {
    try {
      // Step 1: Get the release information
      let release;
      if (releaseTag) {
        logger.info(`Processing specific release: ${releaseTag}`);
        release = await this.githubService.getReleaseByTag(releaseTag);
      } else {
        logger.info('Processing latest release');
        release = await this.githubService.getLatestRelease();
        
        // Check if the release is new (within the last 24 hours)
        if (!this.githubService.isNewRelease(release)) {
          logger.info(`Latest release ${release.tag_name} is not new, skipping processing`);
          return { success: false, message: 'Release is not new' };
        }
      }
      
      const version = this.githubService.extractVersionFromTag(release.tag_name);
      logger.info(`Processing release ${version}`);
      
      // Step 2: Create a TestRail test plan for the release
      const testPlan = await this.createTestRailPlan(version, release.body);
      
      // Step 3: Get tickets from JIRA for the release
      const tickets = await this.getJiraTicketsForRelease(version);
      
      // Step 4: Create test cases in TestRail for each ticket
      const testCases = await this.createTestRailTestCases(tickets, version);
      
      // Step 5: Add test cases to the test plan
      await this.addTestCasesToPlan(testPlan.id, testCases);
      
      // Step 6: Create a Confluence report page
      const reportPage = await this.createConfluenceReportPage(version, release.published_at);
      
      // Step 7: Update the TestRail plan link in the Confluence page
      const testRailPlanUrl = `${this.testRailService.testrail.host}/index.php?/plans/view/${testPlan.id}`;
      await this.confluenceService.updateTestRailPlanLink(reportPage.id, testRailPlanUrl);
      
      logger.info(`Successfully processed release ${version}`);
      return {
        success: true,
        version,
        testPlanId: testPlan.id,
        testCasesCount: testCases.length,
        reportPageId: reportPage.id,
      };
    } catch (error) {
      logger.error(`Error processing release: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a TestRail test plan for a release
   * @param {string} version - The version of the release
   * @param {string} description - The description of the release
   * @returns {Promise<Object>} The created test plan
   */
  async createTestRailPlan(version, description) {
    try {
      logger.info(`Creating TestRail plan for version ${version}`);
      return await this.testRailService.createTestPlan(version, description);
    } catch (error) {
      logger.error(`Error creating TestRail plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tickets from JIRA for a release
   * @param {string} version - The version of the release
   * @returns {Promise<Array>} Array of JIRA issues
   */
  async getJiraTicketsForRelease(version) {
    try {
      logger.info(`Getting JIRA tickets for version ${version}`);
      
      // Ensure the version exists in JIRA
      await this.jiraService.findOrCreateVersion(version);
      
      // Get tickets for the version
      return await this.jiraService.getTicketsInRelease(version);
    } catch (error) {
      logger.error(`Error getting JIRA tickets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create test cases in TestRail for each JIRA ticket
   * @param {Array} tickets - Array of JIRA issues
   * @param {string} version - The version of the release
   * @returns {Promise<Array>} Array of created test case IDs
   */
  async createTestRailTestCases(tickets, version) {
    try {
      logger.info(`Creating TestRail test cases for ${tickets.length} tickets`);
      
      // Get the test suites
      const suites = await this.testRailService.getTestSuites();
      if (suites.length === 0) {
        throw new Error('No test suites found in TestRail');
      }
      
      // Use the first suite (or you could have logic to select a specific one)
      const suiteId = suites[0].id;
      
      // Find or create a section for this release
      const section = await this.testRailService.findOrCreateReleaseSection(suiteId, version);
      
      // Create test cases for each ticket
      const testCaseIds = [];
      for (const ticket of tickets) {
        const formattedTicket = this.jiraService.formatTicketForTestCase(ticket);
        const testCase = await this.testRailService.createTestCase(
          section.id,
          formattedTicket.title,
          {
            typeId: formattedTicket.type,
            priorityId: formattedTicket.priority,
            jiraTicket: formattedTicket.jiraTicket,
          }
        );
        testCaseIds.push(testCase.id);
      }
      
      logger.info(`Created ${testCaseIds.length} test cases`);
      return testCaseIds;
    } catch (error) {
      logger.error(`Error creating TestRail test cases: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add test cases to a test plan
   * @param {number} planId - The ID of the test plan
   * @param {Array} caseIds - Array of test case IDs
   * @returns {Promise<Object>} The result of adding test cases
   */
  async addTestCasesToPlan(planId, caseIds) {
    try {
      logger.info(`Adding ${caseIds.length} test cases to plan ${planId}`);
      
      // Get the test suites
      const suites = await this.testRailService.getTestSuites();
      if (suites.length === 0) {
        throw new Error('No test suites found in TestRail');
      }
      
      // Use the first suite (or you could have logic to select a specific one)
      const suiteId = suites[0].id;
      
      return await this.testRailService.addTestCasesToPlan(planId, suiteId, caseIds);
    } catch (error) {
      logger.error(`Error adding test cases to plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a Confluence report page for a release
   * @param {string} version - The version of the release
   * @param {string} releaseDate - The date of the release
   * @returns {Promise<Object>} The created page
   */
  async createConfluenceReportPage(version, releaseDate) {
    try {
      logger.info(`Creating Confluence report page for version ${version}`);
      return await this.confluenceService.findOrCreateReleaseReportPage(version, releaseDate);
    } catch (error) {
      logger.error(`Error creating Confluence report page: ${error.message}`);
      throw error;
    }
  }
}

export default ReleaseController;
