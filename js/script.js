// Initialize the map centered Kano, Nigeria
const map = L.map('map').setView([12.0022, 8.5919], 13);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let startMarker = null;
let endMarker = null;
let routeLayer = null;

// Function to calculate and display route
async function getRoute(start, end) {
    // Get the selected mode of transportation
    const mode = document.getElementById('mode').value;
    const url = `https://router.project-osrm.org/route/v1/${mode}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;

    try {
        const response = await axios.get(url); // Using Axios instead of fetch
        const data = response.data;

        if (routeLayer) {
            map.removeLayer(routeLayer);
        }

        // Add the route to the map
        routeLayer = L.geoJSON(data.routes[0].geometry).addTo(map);

        // Update distance and duration
        const distance = (data.routes[0].distance / 1000).toFixed(2); // Convert to km
        const duration = (data.routes[0].duration / 60).toFixed(2); // Convert to minutes

        document.getElementById('distance').textContent = `${distance} km`;
        document.getElementById('duration').textContent = `${duration} minutes`;

        // Check if steps exist before displaying them
        const steps = data.routes[0].legs[0]?.steps;
        const directionsContainer = document.getElementById('directions-container');
        const directionsList = document.getElementById('directions');

        if (steps) {
            // Populate directions list
            directionsList.innerHTML = steps.map((step, index) => `
                <li>${index + 1}. ${step.maneuver.instruction} (${(step.distance / 1000).toFixed(2)} km)</li>
            `).join('');
            directionsContainer.classList.remove('hidden'); // Show the directions section
        } else {
            directionsList.innerHTML = ''; // Clear previous directions
            directionsContainer.classList.add('hidden'); // Hide the directions section
        }
    } catch (error) {
        console.error('Error fetching route:', error);

        // Handle error state
        document.getElementById('directions').innerHTML = '<li>Error fetching directions.</li>';
        document.getElementById('directions-container').classList.remove('hidden');
    }
}

// Function to display step-by-step directions
function displayDirections(steps) {
    const directionsList = document.getElementById('directions');
    directionsList.innerHTML = '';

    steps.forEach((step, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${step.maneuver.instruction}`;
        directionsList.appendChild(li);
    });
}

// Function to create draggable marker
function createMarker(lat, lng, label) {
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map).bindPopup(label).openPopup();
    marker.on('dragend', () => {
        if (startMarker && endMarker) {
            getRoute(startMarker.getLatLng(), endMarker.getLatLng());
        }
    });
    return marker;
}

// Set a marker dynamically as start or end point
function setMarker(lat, lng) {
    if (!startMarker) {
        startMarker = createMarker(lat, lng, 'Start Point');
    } else if (!endMarker) {
        endMarker = createMarker(lat, lng, 'End Point');
        getRoute(startMarker.getLatLng(), endMarker.getLatLng());
    }
}

// Get user's location
document.getElementById('getLocationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setMarker(latitude, longitude);
            map.setView([latitude, longitude], 13);
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

// Search for a place
document.getElementById('search-place').addEventListener('click', () => {
    const place = document.getElementById('place').value;

    if (place) {
        const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;

        axios.get(geocodingUrl) // Using Axios for geocoding
            .then((response) => {
                if (response.data.length > 0) {
                    const { lat, lon } = response.data[0];
                    setMarker(parseFloat(lat), parseFloat(lon));
                    map.setView([lat, lon], 13);
                } else {
                    alert('Place not found!');
                }
            })
            .catch((error) => console.error('Error fetching geolocation:', error));
    } else {
        alert('Please enter a place to search.');
    }
});

// Reset map and clear markers
document.getElementById('reset').addEventListener('click', () => {
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    if (routeLayer) map.removeLayer(routeLayer);

    startMarker = null;
    endMarker = null;
    routeLayer = null;

    document.getElementById('distance').textContent = '-';
    document.getElementById('duration').textContent = '-';
    document.getElementById('directions').innerHTML = '';
    map.setView([12.0022, 8.5919], 13);
});

// Map click listener to set start and end points
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    setMarker(lat, lng);
});
