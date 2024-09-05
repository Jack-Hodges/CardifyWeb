const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Middleware to parse JSON request bodies

// Path to the JSON file
const cardsFilePath = './cards.json';

// API to get all cards (GET request)
app.get('/cards', (req, res) => {
  fs.readFile(cardsFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read cards file' });
    }
    res.json(JSON.parse(data));
  });
});

// API to update the cards (POST request)
app.post('/cards', (req, res) => {
  const updatedCards = req.body; // Get the updated cards from the request body
  fs.writeFile(cardsFilePath, JSON.stringify(updatedCards, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to write to cards file' });
    }
    res.json({ success: true }); // Respond with success
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});