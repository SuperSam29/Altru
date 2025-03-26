// Array of properties with their iCal URLs (replace with actual URLs)
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
            }
        }
        
        // Display results
        showResults(availableProperties, start, end);
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
        console.log(`Checking availability for ${property.name} from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);
        
        // For demo purposes, always use simulated data
        // In production, you would use the commented-out fetch code
        /*
        // Fetch the iCal data from the Airbnb URL with CORS proxy
        const corsProxy = "https://cors-anywhere.herokuapp.com/";
        const icalUrl = property.icalUrl;
        
        try {
            const response = await fetch(corsProxy + icalUrl);
            icalText = await response.text();
        } catch (fetchError) {
            console.error(`Error fetching iCal data: ${fetchError.message}`);
            icalText = getSimulatedIcalData(property.name);
        }
        */
        
        // Always use simulated data for demo purposes
        const icalText = getSimulatedIcalData(property.name);
        
        // Parse the iCal data
        const jcalData = ICAL.parse(icalText);
        const comp = new ICAL.Component(jcalData);
        const events = comp.getAllSubcomponents("vevent");
        
        // Log for debugging
        console.log(`Found ${events.length} events for ${property.name}`);
        
        // Check if the requested date range overlaps with any booked periods
        for (const event of events) {
            try {
                const icalEvent = new ICAL.Event(event);
                
                if (!icalEvent.startDate || !icalEvent.endDate) {
                    console.warn("Event missing start or end date, skipping");
                    continue;
                }
                
                const eventStart = moment(icalEvent.startDate.toJSDate());
                const eventEnd = moment(icalEvent.endDate.toJSDate());
                
                console.log(`Checking event: ${eventStart.format('YYYY-MM-DD')} to ${eventEnd.format('YYYY-MM-DD')}`);
                
                // If there's any overlap between the requested dates and booked dates,
                // the property is not available
                if (start.isBefore(eventEnd) && end.isAfter(eventStart)) {
                    console.log(`Conflict found for ${property.name}`);
                    return false;
                }
            } catch (eventError) {
                console.error("Error processing calendar event:", eventError);
                continue;
            }
        }
        
        // If we get here, there are no conflicting bookings
        console.log(`${property.name} is available for the selected dates`);
        return true;
    } catch (error) {
        console.error(`Error checking availability for ${property.name}:`, error);
        // For demo purposes, assume property is available if there's an error
        return true;
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

/**
 * Generate simulated iCal data for testing
 * Used as a fallback if fetching the real data fails
 * @param {string} propertyName - Name of the property
 * @returns {string} - iCal data as text
 */
function getSimulatedIcalData(propertyName) {
    console.log(`Generating simulated data for ${propertyName}`);
    
    // Generate some sample iCal data with minimal bookings
    let icalData = `BEGIN:VCALENDAR
PRODID:-//Airbnb Inc//Airbnb Calendar 1.0//EN
VERSION:2.0
CALSCALE:GREGORIAN`;

    // Very limited bookings - only specific holiday dates
    let bookings = [];
    
    if (propertyName === "Oasis") {
        // Only booked for Christmas 2024
        bookings.push({
            start: moment("2024-12-24"),
            end: moment("2024-12-27")
        });
    } else if (propertyName === "Elio") {
        // Only booked for New Year's 2024-2025
        bookings.push({
            start: moment("2024-12-30"),
            end: moment("2025-01-02")
        });
    } else if (propertyName === "Avalon") {
        // Only booked for Valentine's Day 2025
        bookings.push({
            start: moment("2025-02-14"),
            end: moment("2025-02-15")
        });
    }
    
    // Add the bookings to the iCal data
    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        icalData += `
BEGIN:VEVENT
DTSTART:${booking.start.format('YYYYMMDD')}
DTEND:${booking.end.format('YYYYMMDD')}
SUMMARY:Booked
UID:booking-${propertyName.toLowerCase().replace(/\s+/g, '-')}-${i}
END:VEVENT`;
    }
    
    icalData += `
END:VCALENDAR`;
    
    console.log(`Generated simulated iCal data for ${propertyName} with ${bookings.length} bookings`);
    return icalData;
}

// Initialize the page with instructions
resultsContainer.innerHTML = `
    <p class="initial-message">
        Select check-in and check-out dates to see which properties are available.
    </p>
`; 