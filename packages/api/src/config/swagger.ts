import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Red Team Platform API',
      version: env.API_VERSION,
      description: `
AI Security Red Team / Penetration Testing Platform API

This API provides endpoints for managing security testing of AI systems, including:
- **Payloads**: Security test payloads organized by attack category
- **Projects**: AI systems being tested
- **Tests**: Automated test runs executing payloads against targets
- **Findings**: Security vulnerabilities discovered during testing
- **Reports**: Generated security reports

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 10 requests per 15 minutes per IP
      `,
      contact: {
        name: 'TrilogyWorks',
        url: 'https://trilogyworks.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local development server',
      },
      {
        url: 'https://api.trilogyworks.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token obtained from /api/auth/login',
        },
      },
      schemas: {
        // Common response schemas
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
            },
            data: {
              description: 'Response data (varies by endpoint)',
            },
            error: {
              $ref: '#/components/schemas/Error',
            },
          },
          required: ['success'],
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'array',
              items: {},
            },
            pagination: {
              $ref: '#/components/schemas/Pagination',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
            },
            total: {
              type: 'integer',
            },
            totalPages: {
              type: 'integer',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Human-readable error message',
            },
            code: {
              type: 'string',
              description: 'Machine-readable error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
          required: ['message'],
        },
        // Enums
        PayloadCategory: {
          type: 'string',
          enum: ['PROMPT_INJECTION', 'DATA_EXTRACTION', 'GUARDRAIL_BYPASS', 'INTEGRATION_VULN'],
          description: 'Category of security test payload',
        },
        Severity: {
          type: 'string',
          enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'],
          description: 'Severity level',
        },
        TargetType: {
          type: 'string',
          enum: ['API', 'CHATBOT', 'COPILOT', 'AGENT', 'CUSTOM'],
          description: 'Type of AI system being tested',
        },
        TestStatus: {
          type: 'string',
          enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
          description: 'Status of a test run',
        },
        FindingStatus: {
          type: 'string',
          enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED_RISK', 'FALSE_POSITIVE'],
          description: 'Status of a security finding',
        },
        ReportType: {
          type: 'string',
          enum: ['EXECUTIVE_SUMMARY', 'TECHNICAL_DETAIL', 'FULL_REPORT'],
          description: 'Type of security report',
        },
        UserRole: {
          type: 'string',
          enum: ['ADMIN', 'USER', 'VIEWER'],
          description: 'User role',
        },
        // Entity schemas
        Payload: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier (CUID)',
            },
            name: {
              type: 'string',
              description: 'Payload name',
            },
            description: {
              type: 'string',
              description: 'Description of what the payload tests',
            },
            category: {
              $ref: '#/components/schemas/PayloadCategory',
            },
            subcategory: {
              type: 'string',
              nullable: true,
              description: 'Optional subcategory',
            },
            content: {
              type: 'string',
              description: 'The actual payload content/prompt',
            },
            variables: {
              type: 'object',
              nullable: true,
              description: 'Variables that can be substituted in the payload',
            },
            severity: {
              $ref: '#/components/schemas/Severity',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the payload is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreatePayloadInput: {
          type: 'object',
          required: ['name', 'description', 'category', 'content'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
            },
            description: {
              type: 'string',
              minLength: 1,
            },
            category: {
              $ref: '#/components/schemas/PayloadCategory',
            },
            subcategory: {
              type: 'string',
            },
            content: {
              type: 'string',
              minLength: 1,
            },
            variables: {
              type: 'object',
            },
            severity: {
              $ref: '#/components/schemas/Severity',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            isActive: {
              type: 'boolean',
              default: true,
            },
          },
        },
        UpdatePayloadInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            category: {
              $ref: '#/components/schemas/PayloadCategory',
            },
            subcategory: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            variables: {
              type: 'object',
            },
            severity: {
              $ref: '#/components/schemas/Severity',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            isActive: {
              type: 'boolean',
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            targetUrl: {
              type: 'string',
              nullable: true,
            },
            targetType: {
              $ref: '#/components/schemas/TargetType',
            },
            apiKey: {
              type: 'string',
              nullable: true,
              description: 'API key for the target (if required)',
            },
            config: {
              type: 'object',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateProjectInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
            },
            description: {
              type: 'string',
            },
            targetUrl: {
              type: 'string',
              format: 'uri',
            },
            targetType: {
              $ref: '#/components/schemas/TargetType',
            },
            apiKey: {
              type: 'string',
            },
            config: {
              type: 'object',
            },
          },
        },
        TestRun: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            projectId: {
              type: 'string',
            },
            name: {
              type: 'string',
              nullable: true,
            },
            status: {
              $ref: '#/components/schemas/TestStatus',
            },
            config: {
              type: 'object',
              nullable: true,
            },
            categories: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PayloadCategory',
              },
            },
            totalPayloads: {
              type: 'integer',
            },
            completedPayloads: {
              type: 'integer',
            },
            successfulAttacks: {
              type: 'integer',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateTestRunInput: {
          type: 'object',
          required: ['projectId'],
          properties: {
            projectId: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            categories: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PayloadCategory',
              },
            },
            config: {
              type: 'object',
            },
          },
        },
        TestResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            testRunId: {
              type: 'string',
            },
            payloadId: {
              type: 'string',
            },
            request: {
              type: 'object',
            },
            response: {
              type: 'object',
            },
            success: {
              type: 'boolean',
              description: 'Whether the attack was successful',
            },
            confidence: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            duration: {
              type: 'integer',
              description: 'Duration in milliseconds',
              nullable: true,
            },
            notes: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Finding: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            projectId: {
              type: 'string',
            },
            testResultId: {
              type: 'string',
              nullable: true,
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            severity: {
              $ref: '#/components/schemas/Severity',
            },
            category: {
              $ref: '#/components/schemas/PayloadCategory',
            },
            evidence: {
              type: 'object',
              nullable: true,
            },
            remediation: {
              type: 'string',
              nullable: true,
            },
            status: {
              $ref: '#/components/schemas/FindingStatus',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateFindingInput: {
          type: 'object',
          required: ['projectId', 'title', 'description', 'severity', 'category'],
          properties: {
            projectId: {
              type: 'string',
            },
            testResultId: {
              type: 'string',
            },
            title: {
              type: 'string',
              minLength: 1,
            },
            description: {
              type: 'string',
              minLength: 1,
            },
            severity: {
              $ref: '#/components/schemas/Severity',
            },
            category: {
              $ref: '#/components/schemas/PayloadCategory',
            },
            evidence: {
              type: 'object',
            },
            remediation: {
              type: 'string',
            },
          },
        },
        Report: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            projectId: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            type: {
              $ref: '#/components/schemas/ReportType',
            },
            content: {
              type: 'object',
              description: 'Structured report content',
            },
            generatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        GenerateReportInput: {
          type: 'object',
          required: ['projectId', 'type'],
          properties: {
            projectId: {
              type: 'string',
            },
            type: {
              $ref: '#/components/schemas/ReportType',
            },
            title: {
              type: 'string',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
              nullable: true,
            },
            role: {
              $ref: '#/components/schemas/UserRole',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 6,
            },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 6,
            },
            name: {
              type: 'string',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'Authentication required',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
              example: {
                success: false,
                error: {
                  message: 'Validation failed',
                  details: {},
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Payloads',
        description: 'Security test payload management',
      },
      {
        name: 'Projects',
        description: 'AI project management',
      },
      {
        name: 'Tests',
        description: 'Test run management',
      },
      {
        name: 'Findings',
        description: 'Security findings management',
      },
      {
        name: 'Reports',
        description: 'Security report generation',
      },
      {
        name: 'Analytics',
        description: 'Analytics and statistics',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
