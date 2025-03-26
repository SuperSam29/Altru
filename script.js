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
        // In a real environment, we would fetch the iCal data from the URL
        // For this demo, we'll simulate the fetch and parsing
        
        // Simulate fetch request to the iCal URL (in production, use the actual URL)
        // const response = await fetch(property.icalUrl);
        // const icalText = await response.text();
        
        // For demo purposes, we'll use sample iCal data
        // This would be replaced with the actual fetch result in production
        const icalText = await simulateFetchIcal(property.name);
        
        // Parse the iCal data
        const jcalData = ICAL.parse(icalText);
        const comp = new ICAL.Component(jcalData);
        const events = comp.getAllSubcomponents("vevent");
        
        // Check if the requested date range overlaps with any booked periods
        for (const event of events) {
            const icalEvent = new ICAL.Event(event);
            const eventStart = moment(icalEvent.startDate.toJSDate());
            const eventEnd = moment(icalEvent.endDate.toJSDate());
            
            // If there's any overlap between the requested dates and booked dates,
            // the property is not available
            if (start.isBefore(eventEnd) && end.isAfter(eventStart)) {
                return false;
            }
        }
        
        // If we get here, there are no conflicting bookings
        return true;
    } catch (error) {
        console.error(`Error checking availability for ${property.name}:`, error);
        throw error;
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
 * Simulate fetching and parsing iCal data (for demo purposes)
 * In production, this would be replaced with actual fetch calls
 * @param {string} propertyName - Name of the property
 * @returns {Promise<string>} - iCal data as text
 */
async function simulateFetchIcal(propertyName) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate some sample iCal data with random bookings
    let icalData = `BEGIN:VCALENDAR
PRODID:-//Airbnb Inc//Airbnb Calendar 1.0//EN
VERSION:2.0
CALSCALE:GREGORIAN`;

    // Generate some sample bookings (different for each property)
    const today = moment();
    let bookings = [];
    
    if (propertyName === "Beach House") {
        // Beach House has bookings for next weekend and in 3 weeks
        const nextWeekend = today.clone().add(1, 'week').day(6); // Next Saturday
        bookings.push({
            start: nextWeekend.clone(),
            end: nextWeekend.clone().add(2, 'days')
        });
        
        const inThreeWeeks = today.clone().add(3, 'weeks');
        bookings.push({
            start: inThreeWeeks.clone(),
            end: inThreeWeeks.clone().add(5, 'days')
        });
    } else if (propertyName === "Mountain Cabin") {
        // Mountain Cabin is booked for the week after next
        const weekAfterNext = today.clone().add(2, 'weeks');
        bookings.push({
            start: weekAfterNext.clone(),
            end: weekAfterNext.clone().add(7, 'days')
        });
    } else {
        // City Apartment has a booking starting in 10 days
        const inTenDays = today.clone().add(10, 'days');
        bookings.push({
            start: inTenDays.clone(),
            end: inTenDays.clone().add(4, 'days')
        });
    }
    
    // Add bookings to the iCal data
    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        const uid = `booking-${propertyName.replace(/\s+/g, '-').toLowerCase()}-${i}`;
        const summary = `Booked`;
        
        icalData += `
BEGIN:VEVENT
DTSTART:${booking.start.format('YYYYMMDD')}
DTEND:${booking.end.format('YYYYMMDD')}
SUMMARY:${summary}
UID:${uid}
END:VEVENT`;
    }
    
    icalData += `
END:VCALENDAR`;
    
    return icalData;
}

// Initialize the page with instructions
resultsContainer.innerHTML = `
    <p class="initial-message">
        Select check-in and check-out dates to see which properties are available.
    </p>
`; 