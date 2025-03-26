# Airbnb iCal Calendar Integration for Wix

This project provides a cost-effective solution for integrating Airbnb iCal calendar data into a Wix website using an iframe. The solution allows website visitors to check property availability based on the dates they select without relying on paid plugins.

## Features

- Date range picker for selecting check-in and check-out dates
- Fetch and parse Airbnb iCal calendar data to determine property availability
- Display available properties for selected dates
- Responsive design that works well on both desktop and mobile devices
- No paid plugins or subscriptions required

## Implementation Instructions

### 1. Update Property Information

Edit the `script.js` file to add your actual Airbnb property information:

```javascript
const properties = [
    { 
        name: "Your Property Name", 
        icalUrl: "https://www.airbnb.com/calendar/ical/YOUR_PROPERTY_ID.ics?s=YOUR_SECRET_KEY" 
    },
    // Add more properties as needed
];
```

To find your Airbnb iCal URL:
1. Log in to your Airbnb account
2. Go to "Calendar" for your listing
3. Click "Export Calendar" and copy the URL provided

### 2. Host the Files

Upload the files to a web hosting service (such as GitHub Pages, Netlify, or your own web server). Make sure all files (`index.html`, `styles.css`, and `script.js`) are in the same directory.

### 3. Embed in Wix

1. Open your Wix website editor
2. Go to the page where you want to add the availability calendar
3. Click the "+" (Add) button
4. Select "Embed" > "HTML iframe"
5. Place the iframe on the page and adjust its size
6. Click on the iframe to open its settings
7. Select "Website URL" and enter the URL where you've hosted these files
8. Adjust the height and width to fit your design

## Customization

### Styling

You can customize the appearance by editing the `styles.css` file. The calendar uses CSS variables for colors, making it easy to match your website's color scheme:

```css
:root {
    --primary-color: #007bff; /* Change to match your website's primary color */
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --light-color: #f8f9fa;
    --dark-color: #343a40;
}
```

### Single Property Mode

If you only have one property, you can modify the code to display a simple "Available" or "Not Available" message instead of a list. Edit the `showResults` function in `script.js`:

```javascript
function showResults(availableProperties, start, end) {
    const formatDate = date => date.format('MMMM D, YYYY');
    const dateRange = `${formatDate(start)} to ${formatDate(end)}`;
    
    if (availableProperties.length > 0) {
        resultsContainer.innerHTML = `
            <h3 class="available">Available!</h3>
            <p>The property is available for ${dateRange}</p>
        `;
    } else {
        resultsContainer.innerHTML = `
            <h3 class="not-available">Not Available</h3>
            <p>The property is not available for ${dateRange}</p>
            <p>Please try different dates.</p>
        `;
    }
}
```

## Technical Notes

- The solution uses three external libraries:
  - Flatpickr: For the date range picker
  - ical.js: For parsing iCal data
  - moment.js: For date manipulations and comparisons
- In the production version, you will need to uncomment the actual fetch call to the iCal URL and remove the simulation code
- CORS (Cross-Origin Resource Sharing) may prevent fetching iCal data directly. If this happens, you might need to set up a simple proxy server or use a CORS proxy service.

## Troubleshooting

- **iCal data not loading**: Check that your iCal URLs are correct and publicly accessible
- **Date picker not working**: Make sure all JavaScript libraries are loading correctly
- **Styling issues**: Inspect the iframe using browser developer tools to identify CSS conflicts

## Credits

This solution uses the following open-source libraries:
- [Flatpickr](https://flatpickr.js.org/) - Lightweight date picker
- [ical.js](https://github.com/mozilla-comm/ical.js) - iCal parser
- [moment.js](https://momentjs.com/) - Date manipulation library 