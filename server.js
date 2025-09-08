
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Car Rental API',
    version: '1.0.0',
    description: 'API for Car Rental service',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      Car: {
        type: 'object',
        required: ['brand', 'price', 'rentalPrice', 'type', 'year'],
        properties: {
          id: {
            type: 'string',
            description: 'The auto-generated id of the car',
          },
          brand: {
            type: 'string',
            description: 'The brand of the car',
          },
          price: {
            type: 'number',
            description: 'The price of the car',
          },
          rentalPrice: {
            type: 'number',
            description: 'The rental price of the car',
          },
          type: {
            type: 'string',
            description: 'The type of the car',
          },
          year: {
            type: 'number',
            description: 'The manufacturing year of the car',
          },
        },
      },
      Customer: {
        type: 'object',
        required: ['lastName', 'firstName', 'address', 'phone'],
        properties: {
          id: {
            type: 'string',
            description: 'The auto-generated id of the customer',
          },
          lastName: {
            type: 'string',
            description: 'Last name of the customer',
          },
          firstName: {
            type: 'string',
            description: 'First name of the customer',
          },
          patronymic: {
            type: 'string',
            description: 'Patronymic of the customer',
          },
          address: {
            type: 'string',
            description: 'Address of the customer',
          },
          phone: {
            type: 'string',
            description: 'Phone number of the customer',
          },
        },
      },
      Rental: {
        type: 'object',
        required: ['car', 'customer', 'issueDate', 'returnDate'],
        properties: {
          id: {
            type: 'string',
            description: 'The auto-generated id of the rental',
          },
          car: {
            type: 'string',
            description: 'The id of the rented car',
          },
          customer: {
            type: 'string',
            description: 'The id of the customer',
          },
          issueDate: {
            type: 'string',
            format: 'date-time',
            description: 'The date the car was issued',
          },
          returnDate: {
            type: 'string',
            format: 'date-time',
            description: 'The expected return date',
          },
        },
      },
    },
    securitySchemes: {
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-auth-token'
      }
    }
  },
  security: [{
    apiKeyAuth: []
  }]
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connect Database
connectDB();

// Load Models
app.set('models', {
  CarModel: require('./models/CarModel'),
  Rental: require('./models/Rental'),
  Customer: require('./models/Customer'),
  User: require('./models/User')
});

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));
app.use('/assets', express.static('../car-rental-frontend/src/assets'));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));

app.use('/api/customers', require('./routes/customers'));
app.use('/api/rentals', require('./routes/rentals'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));