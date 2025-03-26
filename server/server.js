const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all requests with specific origins
app.use(cors({
  origin: ['https://supersam29.github.io', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://supersam29.github.io');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Airbnb iCal proxy server is running');
});

// Endpoint to fetch iCal data
app.get('/ical', async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // Validate the URL is an iCal URL (basic check)
    if (!url.endsWith('.ics') && !url.includes('ical')) {
      return res.status(400).json({ error: 'URL does not appear to be an iCal URL' });
    }
    
    console.log(`Fetching iCal data from: ${url}`);
    
    // Fetch the iCal data
    const response = await axios.get(url, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AltruCalendarServer/1.0)'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Set appropriate content type for iCal data
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Access-Control-Allow-Origin', 'https://supersam29.github.io');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching iCal data:', error.message);
    // Set CORS headers even for error responses
    res.setHeader('Access-Control-Allow-Origin', 'https://supersam29.github.io');
    res.status(500).json({ 
      error: `Error fetching data: ${error.message}`,
      url: url
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`iCal proxy server listening at http://localhost:${port}`);
}); 