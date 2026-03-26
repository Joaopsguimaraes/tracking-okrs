import swaggerJsdoc from 'swagger-jsdoc';

export const openApiDocument = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Tracking OKRs API',
      version: '0.0.1',
      description: 'Base API para auth, healthcheck e módulos futuros de OKRs.',
    },
    servers: [
      {
        url: '/api/v1',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'API healthcheck',
          responses: {
            '200': {
              description: 'Healthy service',
            },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Current authenticated user',
          security: [{ sessionAuth: [] }],
          responses: {
            '200': {
              description: 'Current session payload',
            },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Credential login',
          responses: {
            '200': {
              description: 'Authenticated session payload',
            },
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Logout current session',
          responses: {
            '204': {
              description: 'Logged out',
            },
          },
        },
      },
      '/auth/github': {
        get: {
          summary: 'Start GitHub OAuth flow',
          responses: {
            '302': {
              description: 'Redirect to GitHub',
            },
          },
        },
      },
    },
  },
  apis: [],
});
