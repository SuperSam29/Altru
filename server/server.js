const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all requests
app.use(cors());

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
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching iCal data:', error.message);
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