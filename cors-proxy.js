/**
 * Simple CORS Proxy Server
 * 
 * This is a minimal Node.js server that acts as a CORS proxy for fetching iCal data.
 * Use this if you encounter CORS issues when trying to fetch iCal files directly from the browser.
 * 
 * To use:
 * 1. Install Node.js
 * 2. Run `npm install express cors axios`
 * 3. Run this file with `node cors-proxy.js`
 * 4. Update your fetch URLs in script.js to use this proxy
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Main proxy endpoint
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).send('URL parameter is required');
  }
  
  try {
    // Validate the URL is an iCal URL (basic check)
    if (!url.endsWith('.ics') && !url.includes('ical')) {
      return res.status(400).send('URL does not appear to be an iCal URL');
    }
    
    // Fetch the iCal data
    const response = await axios.get(url, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Calendar Proxy)'
      }
    });
    
    // Set appropriate content type for iCal data
    res.setHeader('Content-Type', 'text/calendar');
    res.send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send(`Error fetching data: ${error.message}`);
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('iCal CORS Proxy Server is running');
});

// Start the server
app.listen(port, () => {
  console.log(`CORS Proxy server listening at http://localhost:${port}`);
  console.log(`Use http://localhost:${port}/proxy?url=YOUR_ICAL_URL to fetch iCal data`);
});

/**
 * To use this proxy with your calendar app:
 * 
 * In script.js, modify your fetch call to use the proxy:
 * 
 * // Instead of:
 * // const response = await fetch(property.icalUrl);
 * 
 * // Use:
 * const proxyUrl = "http://localhost:3000/proxy?url=" + encodeURIComponent(property.icalUrl);
 * const response = await fetch(proxyUrl);
 */ 