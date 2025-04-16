import { Octokit } from 'octokit';
import config from '../config.js';
import logger from '../utils/logger.js';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({ auth: config.github.token });
    this.owner = config.github.owner;
    this.repo = config.github.repo;
    logger.info(`Initialized GitHub service for ${this.owner}/${this.repo}`);
  }

  /**
   * Get the latest release from GitHub
   * @returns {Promise<Object>} The latest release object
   */
  async getLatestRelease() {
    try {
      logger.info(`Fetching latest release for ${this.owner}/${this.repo}`);
      const { data } = await this.octokit.rest.repos.getLatestRelease({
        owner: this.owner,
        repo: this.repo,
      });
      
      logger.info(`Latest release: ${data.tag_name}`);
      return data;
    } catch (error) {
      logger.error(`Error fetching latest release: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific release by tag name
   * @param {string} tagName - The tag name of the release
   * @returns {Promise<Object>} The release object
   */
  async getReleaseByTag(tagName) {
    try {
      logger.info(`Fetching release with tag ${tagName} for ${this.owner}/${this.repo}`);
      const { data } = await this.octokit.rest.repos.getReleaseByTag({
        owner: this.owner,
        repo: this.repo,
        tag: tagName,
      });
      
      return data;
    } catch (error) {
      logger.error(`Error fetching release by tag ${tagName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all releases from GitHub
   * @returns {Promise<Array>} Array of release objects
   */
  async getAllReleases() {
    try {
      logger.info(`Fetching all releases for ${this.owner}/${this.repo}`);
      const { data } = await this.octokit.rest.repos.listReleases({
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
      });
      
      logger.info(`Found ${data.length} releases`);
      return data;
    } catch (error) {
      logger.error(`Error fetching all releases: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract version number from release tag
   * @param {string} tagName - The tag name (e.g., "v1.2.3")
   * @returns {string} The cleaned version number (e.g., "1.2.3")
   */
  extractVersionFromTag(tagName) {
    // Remove 'v' prefix if present
    return tagName.replace(/^v/, '');
  }

  /**
   * Check if a release is new (created within the last 24 hours)
   * @param {Object} release - The release object
   * @returns {boolean} True if the release is new
   */
  isNewRelease(release) {
    const releaseDate = new Date(release.created_at);
    const now = new Date();
    const diffInHours = (now - releaseDate) / (1000 * 60 * 60);
    
    return diffInHours <= 24;
  }
}

export default GitHubService;
