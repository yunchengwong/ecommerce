// backend/index.js
const express = require('express');
const cors = require('cors'); // Import cors middleware
const mysql = require('mysql2/promise'); // Import mysql2 with promise support

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins, allowing the frontend to access it.
// In a production environment, you would restrict this to specific origins.
app.use(cors());
app.use(express.json()); // For parsing application/json

// Configure MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // Default MySQL port is 3306
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Initializes the database by creating the 'products' table if it doesn't exist,
 * and populating it with initial product data.
 * This function is designed to be idempotent, meaning it can be run multiple
 * times without causing errors or duplicate data if the primary key exists.
 */
async function initializeDatabase() {
  console.log('Attempting to initialize database...');
  try {
    const connection = await pool.getConnection(); // Get a connection from the pool
    try {
      // 1. Create products table if it doesn't exist
      console.log('Creating products table if not exists...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS products (
            product_name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            image_url VARCHAR(255),
            PRIMARY KEY (product_name)
        );
      `);
      console.log('Products table checked/created.');

      // 2. Insert initial product data
      console.log('Inserting initial product data...');
      const productsToInsert = [
        {
          name: 'Nike P-6000 SE',
          description: 'A mash-up of past Pegasus sneakers, the P-6000 takes early-2000s running to modern heights. It mixes leather, textile and suede for a layered look built to last. Plus, its foam cushioning adds a lifted, athletics inspired stance and unbelievable comfort. This version is part of the Bowerman series—a collection honouring the legacy of Coach Bill Bowerman.',
          price: 339,
          imageUrl: 'https://ecommerce.s3.us-east-1.amazonaws.com/products/20250609161243.jpg'
        },
        {
          name: 'Air Jordan 4 RM',
          description: 'These sneakers reimagine the instantly recognisable AJ4 for life on the go. We centred comfort and durability while keeping the heritage look you love. Max Air in the heel cushions your every step, and elements of the upper—the wing, eyestay and heel—are blended into a strong, flexible cage that wraps the shoe to add a toughness to your everyday commute.',
          price: 419,
          imageUrl: 'https://ecommerce.s3.us-east-1.amazonaws.com/products/20250609161328.jpg'
        },
        {
          name: 'Air Jordan Legacy 312 Low',
          description: 'Celebrate MJ\'s legacy with this shout-out to Chicago\'s 312 area code. With elements from three iconic Jordans (the AJ3, AJ1 and Air Alpha Force), it\'s a modern mash-up that reps the best.',
          price: 399,
          imageUrl: 'https://ecommerce.s3.us-east-1.amazonaws.com/products/20250609161344.jpg'
        }
      ];

      for (const product of productsToInsert) {
        // Use ON DUPLICATE KEY UPDATE to ensure idempotency.
        // If a product with the same product_name (primary key) exists, it updates.
        // Otherwise, it inserts a new record.
        await connection.execute(
          `INSERT INTO products (product_name, description, price, image_url) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE description = VALUES(description), price = VALUES(price), image_url = VALUES(image_url);`,
          [product.name, product.description, product.price, product.imageUrl]
        );
        console.log(`Inserted/updated product: ${product.name}`);
      }
      console.log('Initial product data population complete.');
    } finally {
      connection.release(); // Always release the connection back to the pool
    }
  } catch (error) {
    console.error('Error during database initialization:', error.stack);
    // Don't exit process here; the app might still function for existing data.
    // However, if initial setup is critical, you might choose to exit.
  }
}

// Test database connection
pool.getConnection()
  .then(async connection => { // Mark this as async because we will call initializeDatabase
    console.log('Connected to AWS RDS MySQL database!');
    connection.release(); // Release the connection back to the pool
    await initializeDatabase(); // Call the database initialization function
  })
  .catch(err => {
    console.error('Error connecting to the database on startup:', err.stack);
    // It's crucial to exit if the database connection fails on startup
    process.exit(1);
  });

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello from Node.js Express Backend!');
});

// API endpoint to fetch products from the database
app.get('/api/products', async (req, res) => {
  try {
    // Execute the query to fetch all products
    const [rows] = await pool.query('SELECT product_id, product_name, description, price, image_url FROM products ORDER BY product_id ASC');

    const data = {
      message: 'Products fetched successfully from AWS RDS!',
      timestamp: new Date().toISOString(),
      source: 'AWS RDS MySQL',
      version: '1.0',
      products: rows // The fetched products
    };
    console.log(`[Backend] Products requested from frontend. Sending: ${JSON.stringify(data)}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching products from database:', error.stack);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Node.js Express Backend listening at http://localhost:${port}`);
  console.log(`Accessible within Docker network at http://backend:${port}`);
});
