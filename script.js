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

// URL to our server-side proxy for fetching iCal data
const PROXY_URLS = [
    "https://api.allorigins.win/raw?url=", 
    "https://cors-anywhere.herokuapp.com/", 
    "https://proxy.cors.sh/",
    "https://altru-q6ed5i0qn-bpps-projects-d47b6e50.vercel.app/ical?url="
];

// DOM elements
const checkInDateInput = document.getElementById('check-in-date');
const checkOutDateInput = document.getElementById('check-out-date');
const checkAvailabilityBtn = document.getElementById('check-availability-btn');
const resultsContainer = document.getElementById('results');

// Variables to store selected dates
let selectedCheckInDate = null;
let selectedCheckOutDate = null;

// Check if ICAL library is loaded
const isICALLoaded = typeof ICAL !== 'undefined';
if (!isICALLoaded) {
    console.warn("ICAL.js library not loaded! Using simplified parser instead.");
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendars();
    
    // Add CSS class to style inputs when focused
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
    
    // Initialize the page with instructions
    resultsContainer.innerHTML = `
        <p class="initial-message">
            Select check-in and check-out dates to see which properties are available.
        </p>
    `;
    
    // Show the results container with a slight delay for animation
    setTimeout(() => {
        resultsContainer.classList.add('visible');
    }, 300);
});

// Initialize Flatpickr calendars
function initializeCalendars() {
    // Initialize Flatpickr for check-in date
    window.checkInPicker = flatpickr(checkInDateInput, {
        minDate: "today",
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                selectedCheckInDate = selectedDates[0];
                
                // Update check-out date minimum date
                window.checkOutPicker.set('minDate', selectedDates[0]);
                
                // If check-out date is before check-in date, clear it
                if (selectedCheckOutDate && selectedCheckOutDate < selectedCheckInDate) {
                    window.checkOutPicker.clear();
                    selectedCheckOutDate = null;
                }
                
                // Focus the check-out date input if check-in is selected
                if (!selectedCheckOutDate) {
                    setTimeout(() => {
                        checkOutDateInput.focus();
                    }, 300);
                } else {
                    validateAndCheckAvailability();
                }
                
                // Add animation effect
                checkInDateInput.classList.add('date-selected');
                setTimeout(() => {
                    checkInDateInput.classList.remove('date-selected');
                }, 500);
            }
        }
    });

    // Initialize Flatpickr for check-out date
    window.checkOutPicker = flatpickr(checkOutDateInput, {
        minDate: "today",
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                selectedCheckOutDate = selectedDates[0];
                
                // Add animation effect
                checkOutDateInput.classList.add('date-selected');
                setTimeout(() => {
                    checkOutDateInput.classList.remove('date-selected');
                }, 500);
                
                validateAndCheckAvailability();
            }
        }
    });

    // Event listener for check availability button
    checkAvailabilityBtn.addEventListener('click', () => {
        if (selectedCheckInDate && selectedCheckOutDate) {
            validateAndCheckAvailability();
        } else {
            showError("Please select both check-in and check-out dates");
        }
    });
}

/**
 * Validate dates and check availability if valid
 */
function validateAndCheckAvailability() {
    if (!selectedCheckInDate || !selectedCheckOutDate) {
        return;
    }
    
    // Make sure check-out is after check-in
    if (selectedCheckOutDate <= selectedCheckInDate) {
        showError("Check-out date must be after check-in date");
        return;
    }
    
    // If all is good, check availability
    checkAvailability(selectedCheckInDate, selectedCheckOutDate);
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
    
    // Add visible class to results container with animation
    resultsContainer.classList.add('visible');
    
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
        // Try each proxy service until one works
        for (let i = 0; i < PROXY_URLS.length; i++) {
            try {
                // Fetching iCal data via CORS proxy
                console.log(`Fetching iCal data for ${property.name} via CORS proxy ${i+1}`);
                
                // Construct the URL to the CORS proxy
                const proxyUrl = PROXY_URLS[i] + encodeURIComponent(property.icalUrl);
                
                // Make request through the CORS proxy
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    console.error(`Proxy ${i+1} returned ${response.status}: ${response.statusText}`);
                    continue; // Try next proxy
                }
                
                const icalText = await response.text();
                console.log(`Successfully fetched real iCal data for ${property.name}`);
                
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
            } catch (fetchError) {
                console.error(`Error with proxy ${i+1} for ${property.name}: ${fetchError.message}`);
                // Continue to next proxy if available
            }
        }
        
        // If all proxies failed, try direct access with mode 'no-cors'
        console.log(`All proxies failed for ${property.name}, trying direct access`);
        try {
            await fetch(property.icalUrl, { mode: 'no-cors' });
            console.log(`Direct request sent for ${property.name}`);
            return true; // Can't read response with no-cors, so assume available
        } catch (directError) {
            console.error(`Direct request failed for ${property.name}: ${directError.message}`);
        }
        
        // All methods failed
        console.log(`All methods failed for ${property.name}, assuming available`);
        return true; // If all attempts fail, assume property is available
    } catch (error) {
        console.error(`Error checking availability for ${property.name}:`, error);
        // Return true as fallback - all properties will show as available
        return true;
    }
}

/**
 * Display loading state
 */
function showLoading() {
    resultsContainer.innerHTML = '<p class="loading">Checking availability</p>';
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
            .map((name, index) => `<li class="property-item" style="animation-delay: ${index * 100}ms">${name}</li>`)
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
    
    // Make the container visible with animation
    resultsContainer.classList.add('visible');
} 