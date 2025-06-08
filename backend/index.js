// backend/index.js
const express = require('express');
const cors = require('cors'); // Import cors middleware
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins, allowing the frontend to access it.
// In a production environment, you would restrict this to specific origins.
app.use(cors());
app.use(express.json()); // For parsing application/json

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello from Node.js Express Backend!');
});

// API endpoint to provide data
app.get('/api/data', (req, res) => {
  const data = {
    message: 'Data fetched successfully from Node.js Express Backend!',
    timestamp: new Date().toISOString(),
    source: 'Node.js Express',
    version: '1.0'
  };
  console.log(`[Backend] Data requested from frontend. Sending: ${JSON.stringify(data)}`);
  res.json(data);
});

// Start the server
app.listen(port, () => {
  console.log(`Node.js Express Backend listening at http://localhost:${port}`);
  console.log(`Accessible within Docker network at http://backend:${port}`);
});
