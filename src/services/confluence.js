import { ConfluenceApi } from '@atlassian/confluence-api';
import config from '../config.js';
import logger from '../utils/logger.js';

class ConfluenceService {
  constructor() {
    this.confluence = new ConfluenceApi({
      baseUrl: config.confluence.host,
      username: config.confluence.username,
      password: config.confluence.apiToken,
    });
    this.spaceKey = config.confluence.spaceKey;
    this.qaParentPageId = config.confluence.qaParentPageId;
    logger.info(`Initialized Confluence service for space ${this.spaceKey}`);
  }

  /**
   * Create a new release report page
   * @param {string} releaseName - The name of the release
   * @param {string} releaseDate - The date of the release
   * @returns {Promise<Object>} The created page
   */
  async createReleaseReportPage(releaseName, releaseDate) {
    try {
      logger.info(`Creating release report page for ${releaseName}`);
      const title = `Release ${releaseName} - QA Report`;
      const content = this.generateReleaseReportContent(releaseName, releaseDate);
      
      const response = await this.confluence.createPage({
        space: this.spaceKey,
        parentId: this.qaParentPageId,
        title: title,
        content: content,
      });
      
      logger.info(`Created release report page with ID ${response.id}`);
      return response;
    } catch (error) {
      logger.error(`Error creating release report page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate the content for a release report page
   * @param {string} releaseName - The name of the release
   * @param {string} releaseDate - The date of the release
   * @returns {string} The HTML content for the page
   */
  generateReleaseReportContent(releaseName, releaseDate) {
    const date = releaseDate || new Date().toISOString().split('T')[0];
    
    return `
      <h1>Release ${releaseName} - QA Report</h1>
      <p>Release Date: ${date}</p>
      
      <h2>Pre-Release Regression Test Results</h2>
      <p>Status: <span style="color: #ff9900;">Pending</span></p>
      <table>
        <tr>
          <th>Test Suite</th>
          <th>Status</th>
          <th>Pass Rate</th>
          <th>Notes</th>
        </tr>
        <tr>
          <td>Regression Tests</td>
          <td><span style="color: #ff9900;">Pending</span></td>
          <td>-</td>
          <td></td>
        </tr>
      </table>
      
      <h2>TestRail Test Plan</h2>
      <p>TestRail Plan: <a href="#">Link to TestRail Plan</a></p>
      
      <h2>Post-Release Smoke Test Results</h2>
      <p>Status: <span style="color: #ff9900;">Pending</span></p>
      <table>
        <tr>
          <th>Test Suite</th>
          <th>Status</th>
          <th>Pass Rate</th>
          <th>Notes</th>
        </tr>
        <tr>
          <td>Smoke Tests</td>
          <td><span style="color: #ff9900;">Pending</span></td>
          <td>-</td>
          <td></td>
        </tr>
      </table>
      
      <h2>Issues Found</h2>
      <p>No issues found yet.</p>
      
      <h2>Sign-off</h2>
      <p>QA Sign-off: <span style="color: #ff9900;">Pending</span></p>
    `;
  }

  /**
   * Update an existing page
   * @param {string} pageId - The ID of the page to update
   * @param {string} title - The title of the page
   * @param {string} content - The content of the page
   * @returns {Promise<Object>} The updated page
   */
  async updatePage(pageId, title, content) {
    try {
      logger.info(`Updating page ${pageId}`);
      const page = await this.confluence.getPage(pageId);
      
      const response = await this.confluence.updatePage({
        id: pageId,
        space: this.spaceKey,
        title: title,
        content: content,
        version: { number: page.version.number + 1 },
      });
      
      logger.info(`Updated page ${pageId}`);
      return response;
    } catch (error) {
      logger.error(`Error updating page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a release report page already exists
   * @param {string} releaseName - The name of the release
   * @returns {Promise<Object|null>} The page object if found, null otherwise
   */
  async findReleaseReportPage(releaseName) {
    try {
      logger.info(`Checking if release report page exists for ${releaseName}`);
      const title = `Release ${releaseName} - QA Report`;
      
      const response = await this.confluence.getPages({
        spaceKey: this.spaceKey,
        title: title,
      });
      
      if (response.results && response.results.length > 0) {
        logger.info(`Found existing release report page for ${releaseName}`);
        return response.results[0];
      }
      
      logger.info(`No existing release report page found for ${releaseName}`);
      return null;
    } catch (error) {
      logger.error(`Error finding release report page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find or create a release report page
   * @param {string} releaseName - The name of the release
   * @param {string} releaseDate - The date of the release
   * @returns {Promise<Object>} The page object
   */
  async findOrCreateReleaseReportPage(releaseName, releaseDate) {
    try {
      logger.info(`Finding or creating release report page for ${releaseName}`);
      const existingPage = await this.findReleaseReportPage(releaseName);
      
      if (existingPage) {
        logger.info(`Found existing release report page for ${releaseName}`);
        return existingPage;
      }
      
      logger.info(`No release report page found for ${releaseName}, creating new one`);
      return await this.createReleaseReportPage(releaseName, releaseDate);
    } catch (error) {
      logger.error(`Error finding or creating release report page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update the TestRail plan link in a release report page
   * @param {string} pageId - The ID of the page to update
   * @param {string} testRailPlanUrl - The URL of the TestRail plan
   * @returns {Promise<Object>} The updated page
   */
  async updateTestRailPlanLink(pageId, testRailPlanUrl) {
    try {
      logger.info(`Updating TestRail plan link in page ${pageId}`);
      const page = await this.confluence.getPage(pageId);
      
      // Replace the placeholder link with the actual TestRail plan URL
      const updatedContent = page.body.storage.value.replace(
        '<a href="#">Link to TestRail Plan</a>',
        `<a href="${testRailPlanUrl}">Link to TestRail Plan</a>`
      );
      
      return await this.updatePage(pageId, page.title, updatedContent);
    } catch (error) {
      logger.error(`Error updating TestRail plan link: ${error.message}`);
      throw error;
    }
  }
}

export default ConfluenceService;
