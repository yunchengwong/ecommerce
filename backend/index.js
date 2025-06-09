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

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to AWS RDS MySQL database!');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.stack);
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
