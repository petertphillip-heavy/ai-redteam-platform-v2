/**
 * Basic Usage Example
 *
 * This example demonstrates the complete workflow for using the AI Red Team SDK:
 * 1. Initialize the client
 * 2. Browse available payloads
 * 3. Create a project for your AI system
 * 4. Run a security test
 * 5. Monitor progress and wait for completion
 * 6. Review findings and generate a report
 */

import {
  RedTeamClient,
  Project,
  TestRun,
  Finding,
  Report,
} from '@trilogyworks/ai-redteam';

// Configuration
const API_KEY = process.env.TRILOGYWORKS_API_KEY || 'your-api-key';
const API_URL = process.env.TRILOGYWORKS_API_URL || 'https://api.trilogyworks.com';

async function main() {
  // ============================================
  // 1. Initialize the Client
  // ============================================

  console.log('Initializing AI Red Team client...\n');

  const client = new RedTeamClient({
    apiKey: API_KEY,
    baseUrl: API_URL,
    timeout: 30000,
  });

  // ============================================
  // 2. Browse Available Payloads
  // ============================================

  console.log('Fetching available payloads...\n');

  // Get payload statistics
  const stats = await client.getPayloadStats();
  console.log('Payload Statistics:');
  console.log(`  Total: ${stats.total}`);
  console.log('  By Category:');
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`    ${category}: ${count}`);
  }
  console.log('  By Severity:');
  for (const [severity, count] of Object.entries(stats.bySeverity)) {
    console.log(`    ${severity}: ${count}`);
  }
  console.log();

  // List high-severity prompt injection payloads
  const { data: payloads } = await client.getPayloads({
    category: 'PROMPT_INJECTION',
    severity: 'HIGH',
    isActive: true,
    limit: 5,
  });

  console.log('Sample High-Severity Prompt Injection Payloads:');
  for (const payload of payloads) {
    console.log(`  - ${payload.name} (${payload.severity})`);
    console.log(`    ${payload.description.substring(0, 80)}...`);
  }
  console.log();

  // ============================================
  // 3. Create a Project
  // ============================================

  console.log('Creating project for AI system...\n');

  const project: Project = await client.createProject({
    name: 'My AI Chatbot - Security Test',
    description: 'Customer support chatbot powered by GPT-4',
    targetUrl: 'https://api.example.com/v1/chat',
    targetType: 'CHATBOT',
    config: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {{API_KEY}}',
      },
      bodyTemplate: JSON.stringify({
        messages: [{ role: 'user', content: '{{payload}}' }],
        model: 'gpt-4',
      }),
      responseField: 'choices.0.message.content',
      timeout: 30000,
      rateLimit: 5,
    },
  });

  console.log(`Project created: ${project.name}`);
  console.log(`  ID: ${project.id}`);
  console.log(`  Target: ${project.targetUrl}`);
  console.log(`  Type: ${project.targetType}`);
  console.log();

  // ============================================
  // 4. Start a Security Test
  // ============================================

  console.log('Starting security test...\n');

  const testProgress = await client.startTest({
    projectId: project.id,
    name: 'Initial Security Assessment',
    categories: ['PROMPT_INJECTION', 'DATA_EXTRACTION'],
    rateLimit: 3, // 3 requests per second to avoid overwhelming the target
    timeout: 30000,
    retries: 2,
  });

  console.log(`Test started: ${testProgress.testRunId}`);
  console.log(`  Status: ${testProgress.status}`);
  console.log(`  Total Payloads: ${testProgress.totalPayloads}`);
  console.log();

  // ============================================
  // 5. Wait for Completion with Progress Updates
  // ============================================

  console.log('Monitoring test progress...\n');

  const testRun: TestRun = await client.waitForTestCompletion(testProgress.testRunId, {
    pollInterval: 2000, // Check every 2 seconds
    timeout: 600000, // 10 minute max
    onProgress: (progress) => {
      const pct = ((progress.completedPayloads / progress.totalPayloads) * 100).toFixed(1);
      const bar = '='.repeat(Math.floor(Number(pct) / 5)).padEnd(20, ' ');
      console.log(
        `[${bar}] ${pct}% | ` +
        `${progress.completedPayloads}/${progress.totalPayloads} payloads | ` +
        `${progress.successfulAttacks} vulnerabilities | ` +
        `Current: ${progress.currentPayload || 'N/A'}`
      );
    },
  });

  console.log();
  console.log('Test Complete!');
  console.log(`  Status: ${testRun.status}`);
  console.log(`  Completed Payloads: ${testRun.completedPayloads}/${testRun.totalPayloads}`);
  console.log(`  Successful Attacks: ${testRun.successfulAttacks}`);
  console.log(`  Duration: ${getDuration(testRun.startedAt, testRun.completedAt)}`);
  console.log();

  // ============================================
  // 6. Review Test Results
  // ============================================

  console.log('Fetching detailed results...\n');

  const results = await client.getTestResults(testRun.id);

  // Show successful attacks
  const successfulResults = results.filter((r) => r.success);
  if (successfulResults.length > 0) {
    console.log('Successful Attacks:');
    for (const result of successfulResults) {
      console.log(`  - ${result.payload.name}`);
      console.log(`    Category: ${result.payload.category}`);
      console.log(`    Severity: ${result.payload.severity}`);
      console.log(`    Confidence: ${((result.confidence || 0) * 100).toFixed(0)}%`);
      console.log(`    Duration: ${result.duration}ms`);
      console.log();
    }
  } else {
    console.log('No successful attacks detected. Your AI system appears secure!\n');
  }

  // ============================================
  // 7. Get Findings
  // ============================================

  console.log('Fetching findings...\n');

  const findings: Finding[] = await client.getProjectFindings(project.id);

  if (findings.length > 0) {
    console.log(`Found ${findings.length} vulnerabilities:\n`);

    // Group by severity
    const bySeverity = findings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || []).concat(f);
      return acc;
    }, {} as Record<string, Finding[]>);

    for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']) {
      const severityFindings = bySeverity[severity] || [];
      if (severityFindings.length > 0) {
        console.log(`${severity} (${severityFindings.length}):`);
        for (const finding of severityFindings) {
          console.log(`  - ${finding.title}`);
          console.log(`    Status: ${finding.status}`);
          if (finding.remediation) {
            console.log(`    Remediation: ${finding.remediation.substring(0, 100)}...`);
          }
        }
        console.log();
      }
    }
  } else {
    console.log('No findings recorded.\n');
  }

  // ============================================
  // 8. Generate a Report
  // ============================================

  console.log('Generating security report...\n');

  const report: Report = await client.generateReport({
    projectId: project.id,
    type: 'FULL_REPORT',
    title: 'AI Security Assessment Report',
    includeEvidence: true,
    testRunIds: [testRun.id],
  });

  console.log(`Report generated: ${report.title}`);
  console.log(`  ID: ${report.id}`);
  console.log(`  Type: ${report.type}`);
  console.log(`  Generated: ${report.generatedAt}`);
  console.log();

  if (report.content.summary) {
    console.log('Report Summary:');
    console.log(`  Project: ${report.content.summary.projectName}`);
    console.log(`  Test Date: ${report.content.summary.testDate}`);
    console.log(`  Total Tests: ${report.content.summary.totalTests}`);
    console.log(`  Successful Attacks: ${report.content.summary.successfulAttacks}`);
    console.log(`  Critical Findings: ${report.content.summary.criticalFindings}`);
    console.log(`  High Findings: ${report.content.summary.highFindings}`);
    console.log(`  Overall Risk: ${report.content.summary.overallRisk}`);
    console.log();
  }

  if (report.content.recommendations && report.content.recommendations.length > 0) {
    console.log('Recommendations:');
    for (const rec of report.content.recommendations) {
      console.log(`  - ${rec}`);
    }
    console.log();
  }

  // ============================================
  // 9. Update Finding Status (Optional)
  // ============================================

  if (findings.length > 0) {
    console.log('Updating finding status...\n');

    const firstFinding = findings[0];
    const updatedFinding = await client.updateFindingStatus(firstFinding.id, 'IN_PROGRESS');

    console.log(`Finding "${updatedFinding.title}" marked as IN_PROGRESS`);
    console.log();
  }

  // ============================================
  // Done!
  // ============================================

  console.log('Security assessment complete!');
  console.log(`\nProject ID: ${project.id}`);
  console.log(`Test Run ID: ${testRun.id}`);
  console.log(`Report ID: ${report.id}`);
}

// Helper function to calculate duration
function getDuration(start?: string, end?: string): string {
  if (!start || !end) return 'N/A';
  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Run the example
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
