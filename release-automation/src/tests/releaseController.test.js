import { jest } from '@jest/globals';
import ReleaseController from '../controllers/releaseController.js';

// Mock the services
jest.mock('../services/github.js');
jest.mock('../services/testrail.js');
jest.mock('../services/jira.js');
jest.mock('../services/confluence.js');
jest.mock('../utils/logger.js');

// Import the mocked services
import GitHubService from '../services/github.js';
import TestRailService from '../services/testrail.js';
import JiraService from '../services/jira.js';
import ConfluenceService from '../services/confluence.js';

describe('ReleaseController', () => {
  let releaseController;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance of ReleaseController for each test
    releaseController = new ReleaseController();
  });
  
  describe('processRelease', () => {
    it('should process the latest release when no tag is provided', async () => {
      // Mock the GitHub service
      GitHubService.mockImplementation(() => ({
        getLatestRelease: jest.fn().mockResolvedValue({
          tag_name: 'v1.0.0',
          body: 'Release notes',
          published_at: '2023-01-01T00:00:00Z',
        }),
        isNewRelease: jest.fn().mockReturnValue(true),
        extractVersionFromTag: jest.fn().mockReturnValue('1.0.0'),
      }));
      
      // Mock the TestRail service
      TestRailService.mockImplementation(() => ({
        createTestPlan: jest.fn().mockResolvedValue({ id: 123 }),
        getTestSuites: jest.fn().mockResolvedValue([{ id: 456 }]),
        findOrCreateReleaseSection: jest.fn().mockResolvedValue({ id: 789 }),
        createTestCase: jest.fn().mockResolvedValue({ id: 101 }),
        addTestCasesToPlan: jest.fn().mockResolvedValue({ id: 202 }),
        testrail: { host: 'https://example.testrail.io' },
      }));
      
      // Mock the JIRA service
      JiraService.mockImplementation(() => ({
        findOrCreateVersion: jest.fn().mockResolvedValue({ id: 303 }),
        getTicketsInRelease: jest.fn().mockResolvedValue([
          { key: 'PROJ-123', fields: { summary: 'Test ticket' } },
        ]),
        formatTicketForTestCase: jest.fn().mockReturnValue({
          title: 'PROJ-123 - Test ticket',
          jiraTicket: 'PROJ-123',
          priority: 2,
          type: 1,
        }),
      }));
      
      // Mock the Confluence service
      ConfluenceService.mockImplementation(() => ({
        findOrCreateReleaseReportPage: jest.fn().mockResolvedValue({ id: 404 }),
        updateTestRailPlanLink: jest.fn().mockResolvedValue({}),
      }));
      
      // Call the method
      const result = await releaseController.processRelease();
      
      // Verify the result
      expect(result).toEqual({
        success: true,
        version: '1.0.0',
        testPlanId: 123,
        testCasesCount: 1,
        reportPageId: 404,
      });
      
      // Verify that the services were called correctly
      expect(releaseController.githubService.getLatestRelease).toHaveBeenCalled();
      expect(releaseController.githubService.isNewRelease).toHaveBeenCalled();
      expect(releaseController.testRailService.createTestPlan).toHaveBeenCalledWith('1.0.0', 'Release notes');
      expect(releaseController.jiraService.findOrCreateVersion).toHaveBeenCalledWith('1.0.0');
      expect(releaseController.jiraService.getTicketsInRelease).toHaveBeenCalledWith('1.0.0');
      expect(releaseController.testRailService.findOrCreateReleaseSection).toHaveBeenCalledWith(456, '1.0.0');
      expect(releaseController.testRailService.createTestCase).toHaveBeenCalledWith(789, 'PROJ-123 - Test ticket', expect.any(Object));
      expect(releaseController.testRailService.addTestCasesToPlan).toHaveBeenCalledWith(123, [101]);
      expect(releaseController.confluenceService.findOrCreateReleaseReportPage).toHaveBeenCalledWith('1.0.0', '2023-01-01T00:00:00Z');
      expect(releaseController.confluenceService.updateTestRailPlanLink).toHaveBeenCalledWith(404, 'https://example.testrail.io/index.php?/plans/view/123');
    });
    
    it('should skip processing if the latest release is not new', async () => {
      // Mock the GitHub service
      GitHubService.mockImplementation(() => ({
        getLatestRelease: jest.fn().mockResolvedValue({
          tag_name: 'v1.0.0',
          body: 'Release notes',
        }),
        isNewRelease: jest.fn().mockReturnValue(false),
        extractVersionFromTag: jest.fn().mockReturnValue('1.0.0'),
      }));
      
      // Call the method
      const result = await releaseController.processRelease();
      
      // Verify the result
      expect(result).toEqual({
        success: false,
        message: 'Release is not new',
      });
      
      // Verify that only the necessary services were called
      expect(releaseController.githubService.getLatestRelease).toHaveBeenCalled();
      expect(releaseController.githubService.isNewRelease).toHaveBeenCalled();
      expect(releaseController.testRailService.createTestPlan).not.toHaveBeenCalled();
      expect(releaseController.jiraService.findOrCreateVersion).not.toHaveBeenCalled();
    });
    
    it('should process a specific release when a tag is provided', async () => {
      // Mock the GitHub service
      GitHubService.mockImplementation(() => ({
        getReleaseByTag: jest.fn().mockResolvedValue({
          tag_name: 'v1.0.0',
          body: 'Release notes',
          published_at: '2023-01-01T00:00:00Z',
        }),
        extractVersionFromTag: jest.fn().mockReturnValue('1.0.0'),
      }));
      
      // Mock the TestRail service
      TestRailService.mockImplementation(() => ({
        createTestPlan: jest.fn().mockResolvedValue({ id: 123 }),
        getTestSuites: jest.fn().mockResolvedValue([{ id: 456 }]),
        findOrCreateReleaseSection: jest.fn().mockResolvedValue({ id: 789 }),
        createTestCase: jest.fn().mockResolvedValue({ id: 101 }),
        addTestCasesToPlan: jest.fn().mockResolvedValue({ id: 202 }),
        testrail: { host: 'https://example.testrail.io' },
      }));
      
      // Mock the JIRA service
      JiraService.mockImplementation(() => ({
        findOrCreateVersion: jest.fn().mockResolvedValue({ id: 303 }),
        getTicketsInRelease: jest.fn().mockResolvedValue([
          { key: 'PROJ-123', fields: { summary: 'Test ticket' } },
        ]),
        formatTicketForTestCase: jest.fn().mockReturnValue({
          title: 'PROJ-123 - Test ticket',
          jiraTicket: 'PROJ-123',
          priority: 2,
          type: 1,
        }),
      }));
      
      // Mock the Confluence service
      ConfluenceService.mockImplementation(() => ({
        findOrCreateReleaseReportPage: jest.fn().mockResolvedValue({ id: 404 }),
        updateTestRailPlanLink: jest.fn().mockResolvedValue({}),
      }));
      
      // Call the method
      const result = await releaseController.processRelease('v1.0.0');
      
      // Verify the result
      expect(result).toEqual({
        success: true,
        version: '1.0.0',
        testPlanId: 123,
        testCasesCount: 1,
        reportPageId: 404,
      });
      
      // Verify that the services were called correctly
      expect(releaseController.githubService.getReleaseByTag).toHaveBeenCalledWith('v1.0.0');
      expect(releaseController.testRailService.createTestPlan).toHaveBeenCalledWith('1.0.0', 'Release notes');
      expect(releaseController.jiraService.findOrCreateVersion).toHaveBeenCalledWith('1.0.0');
      expect(releaseController.jiraService.getTicketsInRelease).toHaveBeenCalledWith('1.0.0');
      expect(releaseController.testRailService.findOrCreateReleaseSection).toHaveBeenCalledWith(456, '1.0.0');
      expect(releaseController.testRailService.createTestCase).toHaveBeenCalledWith(789, 'PROJ-123 - Test ticket', expect.any(Object));
      expect(releaseController.testRailService.addTestCasesToPlan).toHaveBeenCalledWith(123, [101]);
      expect(releaseController.confluenceService.findOrCreateReleaseReportPage).toHaveBeenCalledWith('1.0.0', '2023-01-01T00:00:00Z');
      expect(releaseController.confluenceService.updateTestRailPlanLink).toHaveBeenCalledWith(404, 'https://example.testrail.io/index.php?/plans/view/123');
    });
  });
});
