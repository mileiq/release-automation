# Release Automation

This project automates several steps in the QA release process:

1. Creates a TestRail Test Plan when a release is cut on GitHub
2. Checks JIRA for tickets in the target release
3. Adds those tickets as test cases in TestRail and adds them to the Release Test Plan
4. Creates a new report page on Confluence with the correct release number

## Prerequisites

- Node.js (v16 or higher)
- Access to GitHub, TestRail, JIRA, and Confluence APIs

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
cd release-automation
npm install
```

4. Run the setup script to configure your environment:

```bash
npm run setup
```

This interactive script will guide you through creating your `.env` file with the necessary API credentials.

Alternatively, you can manually copy the `.env.example` file to `.env` and fill in your API credentials:

```bash
cp .env.example .env
```

## Configuration

Edit the `.env` file with your API credentials and configuration:

```
# GitHub Configuration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_organization_name
GITHUB_REPO=your_repository_name

# TestRail Configuration
TESTRAIL_HOST=https://your-instance.testrail.io
TESTRAIL_USERNAME=your_testrail_username
TESTRAIL_API_KEY=your_testrail_api_key
TESTRAIL_PROJECT_ID=your_testrail_project_id

# JIRA Configuration
JIRA_HOST=https://your-instance.atlassian.net
JIRA_USERNAME=your_jira_username
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=your_jira_project_key

# Confluence Configuration
CONFLUENCE_HOST=https://your-instance.atlassian.net/wiki
CONFLUENCE_USERNAME=your_confluence_username
CONFLUENCE_API_TOKEN=your_confluence_api_token
CONFLUENCE_SPACE_KEY=your_confluence_space_key
CONFLUENCE_QA_PARENT_PAGE_ID=your_qa_parent_page_id
```

## Usage

### Process the Latest Release

To process the latest GitHub release:

```bash
npm start
```

### Process a Specific Release

To process a specific release by tag:

```bash
npm start -- --release-tag v1.2.3
```

### Continuous Monitoring

To continuously check for new releases at a specified interval (in minutes):

```bash
npm start -- --check-interval 60
```

This will check for new releases every 60 minutes.

## How It Works

1. **GitHub Integration**: Detects when a new release is cut on GitHub.
2. **TestRail Integration**: Creates a test plan for the release in TestRail.
3. **JIRA Integration**: Fetches tickets associated with the release version from JIRA.
4. **TestRail Test Cases**: Creates test cases in TestRail for each JIRA ticket and adds them to the test plan.
5. **Confluence Integration**: Creates a QA report page in Confluence for the release with links to the TestRail test plan.

## Logs

Logs are stored in the `logs` directory:
- `combined.log`: Contains all log messages
- `error.log`: Contains only error messages

## Development

### Project Structure

```
release-automation/
├── src/
│   ├── controllers/
│   │   └── releaseController.js
│   ├── services/
│   │   ├── github.js
│   │   ├── testrail.js
│   │   ├── jira.js
│   │   └── confluence.js
│   ├── tests/
│   │   └── releaseController.test.js
│   ├── utils/
│   │   └── logger.js
│   ├── config.js
│   └── index.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── logs/
├── .env.example
├── .env
├── .eslintrc.json
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
├── setup.js
└── README.md
```

### Testing

Run the tests with:

```bash
npm test
```

### Docker

You can also run the application using Docker:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The Docker setup includes:

- A Dockerfile that builds the application image
- A docker-compose.yml file that configures the container
- Volume mapping for logs directory
- Environment variables loaded from .env file

By default, the Docker container will run in continuous monitoring mode, checking for new releases every 60 minutes. You can modify this behavior by editing the `command` in docker-compose.yml.

## License

ISC
