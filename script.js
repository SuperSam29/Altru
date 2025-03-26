// Array of properties with their iCal URLs
const properties = [
    { 
        name: "Oasis", 
        icalUrl: "https://www.airbnb.co.uk/calendar/ical/1194779357845731963.ics?s=ca2a7532c96d1edb8cb1a49c80862fd1" 
    },
    { 
        name: "Elio", 
        icalUrl: "https://www.airbnb.co.uk/calendar/ical/1334655061299011571.ics?s=db782cbedab27f01e32b87423a50e35b" 
    },
    { 
        name: "Avalon", 
        icalUrl: "https://www.airbnb.co.uk/calendar/ical/1361426217954407183.ics?s=23a434061b45e5ac9a261a66f17d849c" 
    }
];

// URL to our server-side proxy for fetching iCal data - updated
const SERVER_URL = "https://altru-q6ed5i0qn-bpps-projects-d47b6e50.vercel.app/ical";

// DOM elements
const datePicker = document.getElementById('date-picker');
const resultsContainer = document.getElementById('results');

// Initialize Flatpickr date range picker
const fpInstance = flatpickr(datePicker, {
    mode: "range",
    minDate: "today",
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    conjunction: " to ",
    onChange: function(selectedDates) {
        if (selectedDates.length === 2) {
            checkAvailability(selectedDates[0], selectedDates[1]);
        }
    }
});

// Check if ICAL library is loaded
const isICALLoaded = typeof ICAL !== 'undefined';
if (!isICALLoaded) {
    console.warn("ICAL.js library not loaded! Using simplified parser instead.");
}

/**
 * Simplified iCal parser for fallback when ical.js is not available
 * @param {string} icalData - Raw iCal data as text
 * @returns {Array} - Array of event objects with start and end dates
 */
function parseICalSimple(icalData) {
    const events = [];
    const lines = icalData.split('\n');
    
    let currentEvent = null;
    let startDate = null;
    let endDate = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
            startDate = null;
            endDate = null;
        } else if (line === 'END:VEVENT') {
            if (startDate && endDate) {
                events.push({
                    startDate: startDate,
                    endDate: endDate
                });
            }
            currentEvent = null;
        } else if (line.startsWith('DTSTART:') && currentEvent) {
            const dateStr = line.substring(8);
            startDate = parseDateFromICalFormat(dateStr);
        } else if (line.startsWith('DTEND:') && currentEvent) {
            const dateStr = line.substring(6);
            endDate = parseDateFromICalFormat(dateStr);
        }
    }
    
    return events;
}

/**
 * Parse an iCal date string into a JavaScript Date object
 * @param {string} dateStr - Date string in iCal format (YYYYMMDD)
 * @returns {Date} - JavaScript Date object
 */
function parseDateFromICalFormat(dateStr) {
    // Basic format: YYYYMMDD
    if (dateStr.length >= 8) {
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JS months are 0-based
        const day = parseInt(dateStr.substring(6, 8), 10);
        return new Date(year, month, day);
    }
    return null;
}

/**
 * Check availability for all properties within the selected date range
 * @param {Date} startDate - Check-in date
 * @param {Date} endDate - Check-out date
 */
async function checkAvailability(startDate, endDate) {
    // Show loading state
    showLoading();
    
    // Create moment objects for date comparison
    const start = moment(startDate);
    const end = moment(endDate);
    
    // Track available properties
    const availableProperties = [];
    let hasErrors = false;
    
    try {
        // Check each property
        for (const property of properties) {
            try {
                const isAvailable = await checkPropertyAvailability(property, start, end);
                if (isAvailable) {
                    availableProperties.push(property.name);
                }
            } catch (error) {
                console.error(`Error checking ${property.name}:`, error);
                hasErrors = true;
                // Continue with next property even if one fails
            }
        }
        
        // Display results
        if (hasErrors) {
            showError("There were errors checking some properties. Some real availability data may be missing.");
        } else {
            showResults(availableProperties, start, end);
        }
    } catch (error) {
        showError("There was an error checking availability. Please try again.");
        console.error("Error in checkAvailability:", error);
    }
}

/**
 * Check if a specific property is available for the given date range
 * @param {Object} property - Property object with name and iCal URL
 * @param {Moment} start - Check-in date as moment object
 * @param {Moment} end - Check-out date as moment object
 * @returns {Promise<boolean>} - True if property is available
 */
async function checkPropertyAvailability(property, start, end) {
    try {
        // Fetching iCal data via our server proxy
        console.log(`Fetching iCal data for ${property.name} via server proxy`);
        
        // Construct the URL to our server endpoint
        const proxyUrl = `${SERVER_URL}?url=${encodeURIComponent(property.icalUrl)}`;
        
        let icalText;
        try {
            // Make request to our proxy server
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            icalText = await response.text();
            console.log(`Successfully fetched real iCal data for ${property.name}`);
        } catch (fetchError) {
            console.error(`Error fetching iCal data for ${property.name}: ${fetchError.message}`);
            throw fetchError; // Rethrow to show the actual error
        }
        
        // Parse the iCal data
        let events = [];
        
        if (isICALLoaded) {
            // Use ical.js if available
            try {
                const jcalData = ICAL.parse(icalText);
                const comp = new ICAL.Component(jcalData);
                const icalEvents = comp.getAllSubcomponents("vevent");
                
                // Convert to our simplified format
                for (const event of icalEvents) {
                    try {
                        const icalEvent = new ICAL.Event(event);
                        
                        if (icalEvent.startDate && icalEvent.endDate) {
                            events.push({
                                startDate: icalEvent.startDate.toJSDate(),
                                endDate: icalEvent.endDate.toJSDate()
                            });
                        }
                    } catch (eventError) {
                        console.error("Error processing event:", eventError);
                    }
                }
            } catch (parseError) {
                console.error("Error parsing with ICAL.js:", parseError);
                // Fallback to simple parser
                events = parseICalSimple(icalText);
            }
        } else {
            // Use simple parser
            events = parseICalSimple(icalText);
        }
        
        console.log(`Found ${events.length} real events for ${property.name}`);
        
        // Check if the requested date range overlaps with any booked periods
        for (const event of events) {
            try {
                const eventStart = moment(event.startDate);
                const eventEnd = moment(event.endDate);
                
                // If there's any overlap between the requested dates and booked dates,
                // the property is not available
                if (start.isBefore(eventEnd) && end.isAfter(eventStart)) {
                    console.log(`Conflict found for ${property.name}: ${eventStart.format('YYYY-MM-DD')} to ${eventEnd.format('YYYY-MM-DD')}`);
                    return false;
                }
            } catch (eventError) {
                console.error("Error processing event dates:", eventError);
                continue;
            }
        }
        
        // If we get here, there are no conflicting bookings
        console.log(`${property.name} is available for the selected dates (based on real data)`);
        return true;
    } catch (error) {
        console.error(`Error checking availability for ${property.name}:`, error);
        throw error; // Don't hide errors
    }
}

/**
 * Display loading state
 */
function showLoading() {
    resultsContainer.innerHTML = '<p class="loading">Checking availability...</p>';
}

/**
 * Display available properties
 * @param {Array} availableProperties - List of available property names
 * @param {Moment} start - Check-in date
 * @param {Moment} end - Check-out date
 */
function showResults(availableProperties, start, end) {
    const formatDate = date => date.format('MMMM D, YYYY');
    const dateRange = `${formatDate(start)} to ${formatDate(end)}`;
    
    if (availableProperties.length > 0) {
        const propertyList = availableProperties
            .map(name => `<li class="property-item">${name}</li>`)
            .join('');
        
        resultsContainer.innerHTML = `
            <h3>Available Properties</h3>
            <p>For ${dateRange}:</p>
            <ul class="property-list">
                ${propertyList}
            </ul>
        `;
    } else {
        resultsContainer.innerHTML = `
            <p class="no-properties">No properties available for ${dateRange}</p>
            <p>Please try different dates.</p>
        `;
    }
}

/**
 * Display error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    resultsContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// Initialize the page with instructions
resultsContainer.innerHTML = `
    <p class="initial-message">
        Select check-in and check-out dates to see which properties are available.
    </p>
`; 