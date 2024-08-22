import swaggerJsDoc from 'swagger-jsdoc';

// Get the port from the environment variables
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Define the Swagger options
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: '1.0.0',
      title: 'SANI-TRACK API',
      contact: { name: 'Emmanuel Mbagwu' },
      servers: [{ url: `http://localhost:${PORT}` }]
    }
  },
  // Specify the location of Swagger API documentation files
  apis: ['./src/swaggerDocs/**/*.yml']
};

// Generate Swagger documentation using swagger-jsdoc
const swaggerDocument = swaggerJsDoc(swaggerOptions);

// Export the generated Swagger documentation
export default swaggerDocument;
