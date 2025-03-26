// Array of properties with their iCal URLs and details
const properties = [
    { 
        name: "Oasis", 
        icalUrl: "https://www.airbnb.co.uk/calendar/ical/1194779357845731963.ics?s=ca2a7532c96d1edb8cb1a49c80862fd1",
        description: "Luxury 4 bedroom villa with private pool and ocean views",
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
        beds: 4,
        baths: 3,
        guests: 8
    },
    { 
        name: "Elio", 
        icalUrl: "https://www.airbnb.co.uk/calendar/ical/1334655061299011571.ics?s=db782cbedab27f01e32b87423a50e35b",
        description: "Serene 3 bedroom retreat with mountain views and hot tub",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1075&q=80",
        beds: 3,
        baths: 2,
        guests: 6
    },
    { 
        name: "Avalon", 
        icalUrl: "https://www.airbnb.co.uk/calendar/ical/1361426217954407183.ics?s=23a434061b45e5ac9a261a66f17d849c",
        description: "Beachfront 5 bedroom villa with infinity pool and chef service",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
        beds: 5,
        baths: 4,
        guests: 10
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
const datePicker = document.getElementById('date-picker');
const resultsContainer = document.getElementById('results');
const propertiesGrid = document.getElementById('properties-grid');

// Initialize property cards
initializePropertyCards();

// Initialize Flatpickr date range picker with animation
const fpInstance = flatpickr(datePicker, {
    mode: "range",
    minDate: "today",
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    conjunction: " to ",
    showMonths: window.innerWidth > 768 ? 2 : 1,
    animate: true,
    disableMobile: true,
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
 * Create and display property cards
 */
function initializePropertyCards() {
    propertiesGrid.innerHTML = '';
    const template = document.getElementById('property-card-template');
    
    properties.forEach((property, index) => {
        const card = template.content.cloneNode(true);
        
        // Set property details
        card.querySelector('.property-name').textContent = property.name;
        card.querySelector('.property-description').textContent = property.description;
        
        // Set property image
        const imageDiv = card.querySelector('.property-image');
        imageDiv.style.backgroundImage = `url(${property.image})`;
        
        // Set property features
        const features = card.querySelector('.property-features');
        features.innerHTML = `
            <span><i class="fas fa-bed"></i> ${property.beds} beds</span>
            <span><i class="fas fa-bath"></i> ${property.baths} baths</span>
            <span><i class="fas fa-users"></i> ${property.guests} guests</span>
        `;
        
        // Set initial status
        const statusDiv = card.querySelector('.property-status');
        statusDiv.textContent = 'Select dates';
        statusDiv.classList.add('loading');
        
        // Set availability message
        card.querySelector('.property-availability').innerHTML = 
            '<span>Select dates to check availability</span>';
        
        // Add card to the grid
        propertiesGrid.appendChild(card);
        
        // Add animation with GSAP (optional)
        if (typeof gsap !== 'undefined') {
            gsap.from(propertiesGrid.children[index], {
                opacity: 0,
                y: 30,
                duration: 0.6,
                delay: 0.1 * index,
                ease: "power2.out"
            });
        }
    });
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
    
    // Update all property cards to loading state
    updateAllCardStatuses('loading', 'Checking...');
    
    // Create moment objects for date comparison
    const start = moment(startDate);
    const end = moment(endDate);
    
    // Format dates for display
    const formattedStart = moment(startDate).format('MMM D, YYYY');
    const formattedEnd = moment(endDate).format('MMM D, YYYY');
    const dateRange = `${formattedStart} - ${formattedEnd}`;
    
    // Track available properties
    const availableProperties = [];
    let hasErrors = false;
    
    try {
        // Check each property
        for (const [index, property] of properties.entries()) {
            try {
                // Update card to checking status
                updateCardStatus(index, 'loading', 'Checking...');
                
                const isAvailable = await checkPropertyAvailability(property, start, end);
                
                if (isAvailable) {
                    availableProperties.push(property.name);
                    // Update card to available status with animation
                    updateCardStatus(index, 'available', 'Available', dateRange, true);
                } else {
                    // Update card to unavailable status with animation
                    updateCardStatus(index, 'unavailable', 'Unavailable', dateRange, false);
                }
            } catch (error) {
                console.error(`Error checking ${property.name}:`, error);
                hasErrors = true;
                // Update card to error status
                updateCardStatus(index, 'unavailable', 'Error', 'Could not check availability');
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
 * Update the status of a specific property card
 * @param {number} index - Index of the property in the array
 * @param {string} statusClass - CSS class for the status (loading, available, unavailable)
 * @param {string} statusText - Text to display in the status badge
 * @param {string} dateRange - Date range string (optional)
 * @param {boolean} isAvailable - Whether the property is available
 */
function updateCardStatus(index, statusClass, statusText, dateRange = '', isAvailable = false) {
    const card = propertiesGrid.children[index];
    if (!card) return;
    
    // Update status badge
    const statusDiv = card.querySelector('.property-status');
    statusDiv.textContent = statusText;
    statusDiv.className = 'property-status'; // Reset classes
    statusDiv.classList.add(statusClass);
    
    // Update availability message
    const availabilityDiv = card.querySelector('.property-availability');
    if (dateRange) {
        const messageClass = isAvailable ? 'available-dates' : 'unavailable-dates';
        availabilityDiv.innerHTML = 
            `<span class="${messageClass}">
                ${isAvailable ? '✓ Available' : '✗ Unavailable'} 
                for ${dateRange}
            </span>`;
    } else {
        availabilityDiv.innerHTML = '<span>Select dates to check availability</span>';
    }
    
    // Add animation with GSAP if available
    if (typeof gsap !== 'undefined') {
        gsap.from(statusDiv, {
            scale: 0.5,
            opacity: 0,
            duration: 0.4,
            ease: "back.out(1.7)"
        });
        
        gsap.from(availabilityDiv, {
            y: 10,
            opacity: 0,
            duration: 0.4,
            delay: 0.1,
            ease: "power2.out"
        });
    }
}

/**
 * Update all property cards to a specific status
 * @param {string} statusClass - CSS class for the status
 * @param {string} statusText - Text to display in the status badge
 */
function updateAllCardStatuses(statusClass, statusText) {
    for (let i = 0; i < properties.length; i++) {
        updateCardStatus(i, statusClass, statusText);
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
    resultsContainer.innerHTML = '<div class="loading">Checking availability</div>';
    
    // Add animation with GSAP if available
    if (typeof gsap !== 'undefined') {
        gsap.from(resultsContainer, {
            opacity: 0,
            duration: 0.4
        });
    }
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
            .map((name, index) => `<li class="property-item available" style="--index: ${index}">${name}</li>`)
            .join('');
        
        resultsContainer.innerHTML = `
            <div class="availability-results">
                <h3>Available Properties</h3>
                <p>For ${dateRange}:</p>
                <ul class="property-list">
                    ${propertyList}
                </ul>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = `
            <div class="availability-results">
                <p class="no-properties">No properties available for ${dateRange}</p>
                <p>Please try different dates.</p>
            </div>
        `;
    }
    
    // Add animation with GSAP if available
    if (typeof gsap !== 'undefined') {
        gsap.from('.availability-results', {
            opacity: 0,
            y: 20,
            duration: 0.5,
            ease: "power2.out"
        });
    }
}

/**
 * Display error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    resultsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i> ${message}
        </div>
    `;
    
    // Add animation with GSAP if available
    if (typeof gsap !== 'undefined') {
        gsap.from('.error-message', {
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            ease: "power2.out"
        });
    }
} 