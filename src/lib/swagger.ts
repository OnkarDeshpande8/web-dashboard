import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flood Detection System API',
      version: '1.0.0',
      description: 'API for flood detection system using ESP32 ultrasonic sensors to monitor water levels and provide early flood warnings',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
      },
    ],
    components: {
      schemas: {
        SensorData: {
          type: 'object',
          required: ['timestamp', 'distance', 'waterLevel', 'status'],
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp of the flood sensor measurement',
              example: '2025-09-30T10:30:00.000Z',
            },
            distance: {
              type: 'number',
              format: 'float',
              description: 'Ultrasonic distance measurement from sensor to water surface in centimeters',
              example: 175.2,
              minimum: 0,
            },
            waterLevel: {
              type: 'string',
              enum: ['HIGH', 'LOW'],
              description: 'Water level status for flood detection - HIGH indicates potential flood risk',
              example: 'LOW',
            },
            status: {
              type: 'string',
              enum: ['Normal', 'Alert'],
              description: 'Flood detection system status - Alert indicates flood warning',
              example: 'Normal',
            },
          },
        },
        SensorDataInput: {
          type: 'object',
          required: ['distance'],
          properties: {
            distance: {
              type: 'number',
              format: 'float',
              description: 'Ultrasonic distance measurement from flood sensor to water surface in centimeters',
              example: 175.2,
              minimum: 0,
            },
            waterLevel: {
              type: 'string',
              enum: ['HIGH', 'LOW'],
              description: 'Water level status for flood detection (optional, can be calculated from distance threshold)',
              example: 'LOW',
            },
            status: {
              type: 'string',
              enum: ['Normal', 'Alert'],
              description: 'Flood detection system status (optional, can be determined from water level)',
              example: 'Normal',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message describing what went wrong',
              example: 'Failed to fetch sensor data',
            },
          },
        },
        Success: {
          type: 'object',
          required: ['success'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates successful operation',
              example: true,
            },
          },
        },
      },
    },
  },
  apis: [
    './src/app/api/**/*.ts', // Path to the API files
    './src/app/api/sheets/**/*.ts', // Google Sheets API files
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;