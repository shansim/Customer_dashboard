#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * Comprehensive test runner for dashboard integration tests with:
 * - Test suite organization and execution
 * - Coverage reporting and analysis
 * - Performance metrics collection
 * - Test result summarization
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  testTimeout: 30000,
  coverageThreshold: 70,
  maxRetries: 2,
  outputDir: './test-results',
  coverageDir: './coverage/integration'
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log with timestamp and color
 */
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  header: (msg) => {
    console.log('\n' + '='.repeat(80));
    console.log(`\x1b[1m${msg}\x1b[0m`);
    console.log('='.repeat(80));
  }
};

/**
 * Ensure directory exists
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Run command with error handling
 */
const runCommand = (command, options = {}) => {
  try {
    log.info(`Running: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    });
    return { success: true, result };
  } catch (error) {
    log.error(`Command failed: ${command}`);
    log.error(`Error: ${error.message}`);
    return { success: false, error };
  }
};

/**
 * Run command with streaming output
 */
const runCommandStream = (command, args = []) => {
  return new Promise((resolve, reject) => {
    log.info(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, code });
      } else {
        reject({ success: false, code });
      }
    });

    child.on('error', (error) => {
      reject({ success: false, error });
    });
  });
};

/**
 * Parse test results from JSON output
 */
const parseTestResults = (resultsFile) => {
  try {
    if (!fs.existsSync(resultsFile)) {
      log.warning(`Results file not found: ${resultsFile}`);
      return null;
    }

    const data = fs.readFileSync(resultsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log.error(`Failed to parse test results: ${error.message}`);
    return null;
  }
};

/**
 * Parse coverage results
 */
const parseCoverageResults = (coverageFile) => {
  try {
    const summaryFile = path.join(CONFIG.coverageDir, 'coverage-summary.json');
    if (!fs.existsSync(summaryFile)) {
      log.warning(`Coverage summary not found: ${summaryFile}`);
      return null;
    }

    const data = fs.readFileSync(summaryFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log.error(`Failed to parse coverage results: ${error.message}`);
    return null;
  }
};

// ============================================================================
// Test Suite Runners
// ============================================================================

/**
 * Run all integration tests
 */
const runIntegrationTests = async () => {
  log.header('Running Integration Tests');
  
  try {
    await runCommandStream('npx', [
      'vitest',
      'run',
      '--config',
      'vitest.integration.config.ts',
      '--reporter=verbose',
      '--reporter=json',
      '--outputFile.json=./test-results/integration-results.json'
    ]);
    
    log.success('Integration tests completed successfully');
    return true;
  } catch (error) {
    log.error('Integration tests failed');
    return false;
  }
};

/**
 * Run integration tests with coverage
 */
const runIntegrationTestsWithCoverage = async () => {
  log.header('Running Integration Tests with Coverage');
  
  try {
    await runCommandStream('npx', [
      'vitest',
      'run',
      '--coverage',
      '--config',
      'vitest.integration.config.ts',
      '--reporter=verbose',
      '--reporter=json',
      '--outputFile.json=./test-results/integration-results.json'
    ]);
    
    log.success('Integration tests with coverage completed successfully');
    return true;
  } catch (error) {
    log.error('Integration tests with coverage failed');
    return false;
  }
};

/**
 * Run specific test suite
 */
const runSpecificTestSuite = async (suiteName) => {
  log.header(`Running Test Suite: ${suiteName}`);
  
  try {
    await runCommandStream('npx', [
      'vitest',
      'run',
      '--config',
      'vitest.integration.config.ts',
      '--reporter=verbose',
      `src/test/integration/${suiteName}.test.tsx`
    ]);
    
    log.success(`Test suite ${suiteName} completed successfully`);
    return true;
  } catch (error) {
    log.error(`Test suite ${suiteName} failed`);
    return false;
  }
};

// ============================================================================
// Result Analysis
// ============================================================================

/**
 * Analyze test results and generate summary
 */
const analyzeResults = () => {
  log.header('Analyzing Test Results');
  
  const resultsFile = path.join(CONFIG.outputDir, 'integration-results.json');
  const results = parseTestResults(resultsFile);
  
  if (!results) {
    log.error('No test results to analyze');
    return false;
  }

  // Test summary
  const summary = {
    total: results.numTotalTests || 0,
    passed: results.numPassedTests || 0,
    failed: results.numFailedTests || 0,
    skipped: results.numPendingTests || 0,
    duration: results.testResults?.reduce((acc, test) => acc + (test.perfStats?.runtime || 0), 0) || 0
  };

  log.info(`Total Tests: ${summary.total}`);
  log.info(`Passed: ${summary.passed}`);
  log.info(`Failed: ${summary.failed}`);
  log.info(`Skipped: ${summary.skipped}`);
  log.info(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);

  // Coverage analysis
  const coverage = parseCoverageResults();
  if (coverage) {
    const total = coverage.total;
    log.info(`Coverage - Lines: ${total.lines.pct}%`);
    log.info(`Coverage - Functions: ${total.functions.pct}%`);
    log.info(`Coverage - Branches: ${total.branches.pct}%`);
    log.info(`Coverage - Statements: ${total.statements.pct}%`);

    // Check coverage thresholds
    const meetsThreshold = total.lines.pct >= CONFIG.coverageThreshold &&
                          total.functions.pct >= CONFIG.coverageThreshold &&
                          total.branches.pct >= CONFIG.coverageThreshold &&
                          total.statements.pct >= CONFIG.coverageThreshold;

    if (meetsThreshold) {
      log.success(`Coverage meets threshold of ${CONFIG.coverageThreshold}%`);
    } else {
      log.warning(`Coverage below threshold of ${CONFIG.coverageThreshold}%`);
    }
  }

  // Failed test details
  if (summary.failed > 0) {
    log.warning('Failed Tests:');
    results.testResults?.forEach(testFile => {
      testFile.assertionResults?.forEach(test => {
        if (test.status === 'failed') {
          log.error(`  - ${test.fullName}`);
          if (test.failureMessages?.length > 0) {
            test.failureMessages.forEach(msg => {
              log.error(`    ${msg.split('\n')[0]}`);
            });
          }
        }
      });
    });
  }

  return summary.failed === 0;
};

/**
 * Generate HTML report
 */
const generateHtmlReport = () => {
  log.header('Generating HTML Report');
  
  const htmlReportPath = path.join(CONFIG.outputDir, 'integration-report.html');
  
  if (fs.existsSync(htmlReportPath)) {
    log.success(`HTML report generated: ${htmlReportPath}`);
    log.info(`Open file://${path.resolve(htmlReportPath)} to view the report`);
  } else {
    log.warning('HTML report not found');
  }
};

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main test runner function
 */
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  log.header('Dashboard Integration Test Runner');
  log.info(`Command: ${command}`);
  log.info(`Working Directory: ${process.cwd()}`);
  
  // Ensure output directories exist
  ensureDir(CONFIG.outputDir);
  ensureDir(CONFIG.coverageDir);
  
  let success = false;
  
  try {
    switch (command) {
      case 'all':
        success = await runIntegrationTestsWithCoverage();
        break;
        
      case 'tests-only':
        success = await runIntegrationTests();
        break;
        
      case 'coverage':
        success = await runIntegrationTestsWithCoverage();
        break;
        
      case 'suite':
        const suiteName = args[1];
        if (!suiteName) {
          log.error('Suite name required. Usage: npm run test:integration:suite <suite-name>');
          process.exit(1);
        }
        success = await runSpecificTestSuite(suiteName);
        break;
        
      case 'analyze':
        success = analyzeResults();
        break;
        
      default:
        log.error(`Unknown command: ${command}`);
        log.info('Available commands: all, tests-only, coverage, suite <name>, analyze');
        process.exit(1);
    }
    
    // Always analyze results if tests were run
    if (['all', 'tests-only', 'coverage', 'suite'].includes(command)) {
      analyzeResults();
      generateHtmlReport();
    }
    
    if (success) {
      log.success('Integration test run completed successfully');
      process.exit(0);
    } else {
      log.error('Integration test run failed');
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTests,
  runIntegrationTestsWithCoverage,
  runSpecificTestSuite,
  analyzeResults,
  generateHtmlReport
};