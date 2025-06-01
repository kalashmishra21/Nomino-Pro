const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nomino Pro API - Smart Kitchen + Delivery Hub',
      version: '1.0.0',
      description: 'A comprehensive food delivery management platform API built with Node.js, Express.js, and MongoDB. Nomino Pro streamlines restaurant operations and delivery management with real-time tracking, role-based dashboards, and advanced analytics.',
      contact: {
        name: 'Nomino Pro Support',
        email: 'support@nominopro.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.nominopro.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password', 'phone', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'Auto-generated user ID'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            phone: {
              type: 'string',
              pattern: '^\\d{10}$',
              description: '10-digit phone number',
              example: '9876543210'
            },
            role: {
              type: 'string',
              enum: ['restaurant_manager', 'delivery_partner'],
              description: 'User role',
              example: 'restaurant_manager'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Delivery partner availability status',
              example: true
            },
            vehicleType: {
              type: 'string',
              enum: ['bike', 'scooter', 'bicycle', 'car'],
              description: 'Delivery partner vehicle type'
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Delivery partner rating',
              example: 4.5
            }
          }
        },
        Order: {
          type: 'object',
          required: ['customerName', 'customerPhone', 'customerAddress', 'items', 'totalAmount', 'prepTime'],
          properties: {
            _id: {
              type: 'string',
              description: 'Auto-generated order ID'
            },
            orderId: {
              type: 'string',
              pattern: '^ORD\\d{6}$',
              description: 'Formatted order ID',
              example: 'ORD123456'
            },
            customerName: {
              type: 'string',
              description: 'Customer name',
              example: 'Alice Johnson'
            },
            customerPhone: {
              type: 'string',
              pattern: '^\\d{10}$',
              description: '10-digit customer phone',
              example: '9876543210'
            },
            customerAddress: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                  example: '123 Main Street'
                },
                city: {
                  type: 'string',
                  example: 'Mumbai'
                },
                pincode: {
                  type: 'string',
                  pattern: '^\\d{6}$',
                  example: '400001'
                }
              }
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Margherita Pizza'
                  },
                  quantity: {
                    type: 'number',
                    minimum: 1,
                    example: 2
                  },
                  price: {
                    type: 'number',
                    minimum: 0,
                    example: 299
                  },
                  category: {
                    type: 'string',
                    enum: ['appetizer', 'main_course', 'dessert', 'beverage', 'side_dish'],
                    example: 'main_course'
                  }
                }
              }
            },
            totalAmount: {
              type: 'number',
              minimum: 0,
              description: 'Total order amount in INR',
              example: 598
            },
            prepTime: {
              type: 'number',
              minimum: 5,
              maximum: 120,
              description: 'Preparation time in minutes',
              example: 25
            },
            estimatedDeliveryTime: {
              type: 'number',
              minimum: 10,
              maximum: 60,
              description: 'Estimated delivery time in minutes',
              example: 30
            },
            dispatchTime: {
              type: 'string',
              format: 'date-time',
              description: 'Calculated dispatch time (prepTime + ETA)',
              example: '2024-01-15T14:30:00Z'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PREP', 'READY', 'PICKED', 'ON_ROUTE', 'DELIVERED', 'CANCELLED'],
              description: 'Order status',
              example: 'PENDING'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Order priority',
              example: 'MEDIUM'
            },
            deliveryPartner: {
              $ref: '#/components/schemas/User'
            },
            orderPlacedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order placement timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
}; 