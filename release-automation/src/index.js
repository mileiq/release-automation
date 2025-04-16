import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ReleaseController from './controllers/releaseController.js';
import { validateConfig } from './config.js';
import logger from './utils/logger.js';

// Validate the configuration
validateConfig();

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('release-tag', {
    alias: 'r',
    description: 'Process a specific release by tag',
    type: 'string',
  })
  .option('check-interval', {
    alias: 'i',
    description: 'Interval in minutes to check for new releases (0 for one-time check)',
    type: 'number',
    default: 0,
  })
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Main function to process releases
 */
async function main() {
  try {
    logger.info('Starting release automation');
    const releaseController = new ReleaseController();
    
    // Process a specific release if provided
    if (argv.releaseTag) {
      logger.info(`Processing specific release: ${argv.releaseTag}`);
      const result = await releaseController.processRelease(argv.releaseTag);
      
      if (result.success) {
        logger.info(`Successfully processed release ${result.version}`);
        logger.info(`TestRail Plan ID: ${result.testPlanId}`);
        logger.info(`Test Cases Created: ${result.testCasesCount}`);
        logger.info(`Confluence Report Page ID: ${result.reportPageId}`);
      } else {
        logger.warn(`Failed to process release: ${result.message}`);
      }
    } else {
      // Process the latest release
      logger.info('Processing latest release');
      const result = await releaseController.processRelease();
      
      if (result.success) {
        logger.info(`Successfully processed release ${result.version}`);
        logger.info(`TestRail Plan ID: ${result.testPlanId}`);
        logger.info(`Test Cases Created: ${result.testCasesCount}`);
        logger.info(`Confluence Report Page ID: ${result.reportPageId}`);
      } else {
        logger.warn(`No new release to process: ${result.message}`);
      }
    }
    
    // Set up interval checking if requested
    if (argv.checkInterval > 0) {
      logger.info(`Setting up interval checking every ${argv.checkInterval} minutes`);
      
      // Convert minutes to milliseconds
      const intervalMs = argv.checkInterval * 60 * 1000;
      
      setInterval(async () => {
        logger.info('Checking for new releases');
        const result = await releaseController.processRelease();
        
        if (result.success) {
          logger.info(`Successfully processed new release ${result.version}`);
        } else {
          logger.info(`No new release to process: ${result.message}`);
        }
      }, intervalMs);
    } else {
      // Exit if not running in interval mode
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Error in main process: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
main();
