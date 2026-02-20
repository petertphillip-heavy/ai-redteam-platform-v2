/**
 * @swagger
 * components:
 *   schemas:
 *     PayloadFilters:
 *       type: object
 *       properties:
 *         category:
 *           $ref: '#/components/schemas/PayloadCategory'
 *         severity:
 *           $ref: '#/components/schemas/Severity'
 *         isActive:
 *           type: boolean
 *         search:
 *           type: string
 *           description: Search term for name/description
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *
 *     ProjectFilters:
 *       type: object
 *       properties:
 *         targetType:
 *           $ref: '#/components/schemas/TargetType'
 *         search:
 *           type: string
 *           description: Search term for name/description
 *
 *     TestRunFilters:
 *       type: object
 *       properties:
 *         projectId:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/TestStatus'
 *
 *     FindingFilters:
 *       type: object
 *       properties:
 *         projectId:
 *           type: string
 *         severity:
 *           $ref: '#/components/schemas/Severity'
 *         status:
 *           $ref: '#/components/schemas/FindingStatus'
 *         category:
 *           $ref: '#/components/schemas/PayloadCategory'
 *
 *     CategoryStats:
 *       type: object
 *       properties:
 *         category:
 *           $ref: '#/components/schemas/PayloadCategory'
 *         count:
 *           type: integer
 *
 *     PayloadStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         active:
 *           type: integer
 *         byCategory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryStats'
 *         bySeverity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               severity:
 *                 $ref: '#/components/schemas/Severity'
 *               count:
 *                 type: integer
 *
 *     TestProgress:
 *       type: object
 *       properties:
 *         testRunId:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/TestStatus'
 *         totalPayloads:
 *           type: integer
 *         completedPayloads:
 *           type: integer
 *         successfulAttacks:
 *           type: integer
 *         percentComplete:
 *           type: number
 *           format: float
 *
 *     TestConfig:
 *       type: object
 *       properties:
 *         concurrency:
 *           type: integer
 *           default: 5
 *           description: Number of concurrent test executions
 *         timeout:
 *           type: integer
 *           default: 30000
 *           description: Timeout in milliseconds per request
 *         retries:
 *           type: integer
 *           default: 2
 *           description: Number of retries on failure
 *         headers:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Custom headers to include in requests
 *
 *     ReportContent:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalFindings:
 *               type: integer
 *             criticalCount:
 *               type: integer
 *             highCount:
 *               type: integer
 *             mediumCount:
 *               type: integer
 *             lowCount:
 *               type: integer
 *             infoCount:
 *               type: integer
 *         findings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Finding'
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *         generatedAt:
 *           type: string
 *           format: date-time
 *
 *     AnalyticsDashboard:
 *       type: object
 *       properties:
 *         totalProjects:
 *           type: integer
 *         totalTests:
 *           type: integer
 *         totalFindings:
 *           type: integer
 *         findingsBySeverity:
 *           type: object
 *           properties:
 *             CRITICAL:
 *               type: integer
 *             HIGH:
 *               type: integer
 *             MEDIUM:
 *               type: integer
 *             LOW:
 *               type: integer
 *             INFO:
 *               type: integer
 *         recentTests:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TestRun'
 *         recentFindings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Finding'
 *
 *     BulkImportInput:
 *       type: object
 *       required:
 *         - payloads
 *       properties:
 *         payloads:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreatePayloadInput'
 *
 *     BulkImportResult:
 *       type: object
 *       properties:
 *         imported:
 *           type: integer
 *         failed:
 *           type: integer
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               index:
 *                 type: integer
 *               message:
 *                 type: string
 *
 *     UpdateFindingInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         severity:
 *           $ref: '#/components/schemas/Severity'
 *         category:
 *           $ref: '#/components/schemas/PayloadCategory'
 *         evidence:
 *           type: object
 *         remediation:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/FindingStatus'
 *
 *     UpdateProjectInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         targetUrl:
 *           type: string
 *           format: uri
 *         targetType:
 *           $ref: '#/components/schemas/TargetType'
 *         apiKey:
 *           type: string
 *         config:
 *           type: object
 *
 *     HealthCheck:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy]
 *         version:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         environment:
 *           type: string
 *           enum: [development, production, test]
 */

// This file contains additional OpenAPI schema definitions
// The schemas are defined in JSDoc comments for swagger-jsdoc to process
export {};
